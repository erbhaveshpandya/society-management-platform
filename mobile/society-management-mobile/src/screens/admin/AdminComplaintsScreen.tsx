import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types/complaint.types';
import { formatDate } from '../../utils/dateUtils';

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case 'Low': return styles.priorityLow;
    case 'Medium': return styles.priorityMedium;
    case 'High': return styles.priorityHigh;
    case 'Critical': return styles.priorityCritical;
    default: return styles.priorityMedium;
  }
};

export const AdminComplaintsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Open' | 'InProgress' | 'Resolved'>('All');

  // Detail Modal State
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchComplaints = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await complaintService.getComplaints();
      setComplaints(data);
      applyFilter(data, filter);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      Alert.alert('Error', 'Failed to fetch complaints list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilter = (list: Complaint[], statusFilter: typeof filter) => {
    if (statusFilter === 'All') {
      setFilteredComplaints(list);
    } else {
      setFilteredComplaints(list.filter(c => c.status === statusFilter));
    }
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    applyFilter(complaints, newFilter);
  };

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [filter])
  );

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedComplaint) return;
    setSubmittingComment(true);
    try {
      await complaintService.addComment(selectedComplaint.id, commentText.trim());
      setCommentText('');
      // Refresh the selected complaint's details in modal
      const data = await complaintService.getComplaints();
      setComplaints(data);
      applyFilter(data, filter);
      const updated = data.find(c => c.id === selectedComplaint.id);
      if (updated) setSelectedComplaint(updated);
    } catch (err) {
      console.error('Failed to add comment:', err);
      Alert.alert('Error', 'Failed to submit comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'InProgress' | 'Resolved') => {
    if (!selectedComplaint) return;
    setUpdatingStatus(true);
    try {
      // Add comments as activity log if required, or update status directly
      await complaintService.updateComplaintStatus(selectedComplaint.id, newStatus);
      
      // Auto add comment documenting status update
      await complaintService.addComment(
        selectedComplaint.id,
        `Status updated to ${newStatus} by Administrator.`
      );

      Alert.alert('Success', `Complaint status marked as ${newStatus}`);
      setDetailModalVisible(false);
      fetchComplaints();
    } catch (err) {
      console.error('Failed to update status:', err);
      Alert.alert('Error', 'Failed to update complaint status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <LoadingState message="Loading complaints..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader title="Complaints" subtitle="Review and resolve issues" onBack={() => navigation.goBack()} />
      
      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {(['All', 'Open', 'InProgress', 'Resolved'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => handleFilterChange(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item === 'InProgress' ? 'In Progress' : item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchComplaints(true)} colors={['#4F46E5']} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Complaints Found"
            message={`There are no complaints matching "${filter === 'InProgress' ? 'In Progress' : filter}" status.`}
            icon="chatbubbles-outline"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedComplaint(item);
              setDetailModalVisible(true);
            }}
          >
            <AppCard style={styles.complaintCard}>
              <View style={styles.complaintHeader}>
                <Text style={styles.flatText}>
                  {item.flatNumber}
                </Text>
                <StatusBadge status={item.status} size="small" />
              </View>

              <Text style={styles.subjectText}>{item.subject}</Text>
              <Text style={styles.descriptionSnippet} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.complaintFooter}>
                <View style={styles.metaInfo}>
                  <Ionicons name="person-outline" size={13} color="#64748B" />
                  <Text style={styles.metaText}>{item.residentName}</Text>
                </View>
                <View style={[styles.priorityBadge, getPriorityStyle(item.priority)]}>
                  <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
              </View>
            </AppCard>
          </TouchableOpacity>
        )}
      />

      {/* Complaint Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complaint Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {selectedComplaint && (
                <>
                  <View style={styles.modalSection}>
                    <View style={styles.modalMetaRow}>
                      <StatusBadge status={selectedComplaint.status} />
                      <View style={[styles.priorityBadge, getPriorityStyle(selectedComplaint.priority)]}>
                        <Text style={styles.priorityText}>{selectedComplaint.priority} Priority</Text>
                      </View>
                    </View>

                    <Text style={styles.modalSubject}>{selectedComplaint.subject}</Text>
                    
                    <View style={styles.reporterDetails}>
                      <Ionicons name="person" size={14} color="#4F46E5" />
                      <Text style={styles.reporterName}>
                        {selectedComplaint.residentName} ({selectedComplaint.flatNumber})
                      </Text>
                    </View>

                    <Text style={styles.modalDescLabel}>Description</Text>
                    <Text style={styles.modalDescription}>{selectedComplaint.description}</Text>
                  </View>

                  {/* Resolution Controls for Open or InProgress status */}
                  {selectedComplaint.status !== 'Resolved' && (
                    <View style={styles.adminActionSection}>
                      <Text style={styles.sectionHeading}>Resolve Action</Text>
                      <View style={styles.actionButtonsRow}>
                        {selectedComplaint.status === 'Open' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.progressBtn]}
                            onPress={() => handleUpdateStatus('InProgress')}
                            disabled={updatingStatus}
                          >
                            <Ionicons name="play" size={16} color="#1E40AF" />
                            <Text style={styles.progressBtnText}>Start Working</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.resolveBtn]}
                          onPress={() => handleUpdateStatus('Resolved')}
                          disabled={updatingStatus}
                        >
                          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                          <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Comments Section */}
                  <View style={styles.commentsSection}>
                    <Text style={styles.sectionHeading}>Activity log & Comments</Text>
                    
                    {(!selectedComplaint.comments || selectedComplaint.comments.length === 0) ? (
                      <Text style={styles.noCommentsText}>No activity logs yet.</Text>
                    ) : (
                      (selectedComplaint.comments || []).map((comment) => (
                        <View key={comment.id} style={styles.commentItem}>
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentUser}>{comment.userName}</Text>
                            <Text style={styles.commentRole}>({comment.userRole})</Text>
                          </View>
                          <Text style={styles.commentBody}>{comment.comment}</Text>
                          <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Comment Input Sticky Footer */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment or resolution note..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
                onPress={handleAddComment}
                disabled={!commentText.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  complaintCard: {
    padding: 16,
    marginBottom: 12,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flatText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
    textTransform: 'uppercase',
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  descriptionSnippet: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityLow: {
    backgroundColor: '#F0FDF4',
  },
  priorityMedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityHigh: {
    backgroundColor: '#FED7AA',
  },
  priorityCritical: {
    backgroundColor: '#FEE2E2',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalSubject: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 26,
    marginBottom: 8,
  },
  reporterDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  reporterName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  modalDescLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  adminActionSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  progressBtn: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  progressBtnText: {
    color: '#1E40AF',
    fontWeight: '700',
    fontSize: 13,
  },
  resolveBtn: {
    backgroundColor: '#10B981',
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  commentsSection: {
    marginBottom: 10,
  },
  noCommentsText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  commentItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  commentRole: {
    fontSize: 10,
    color: '#64748B',
  },
  commentBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'right',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 100,
    color: '#1E293B',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
