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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { complaintService } from '../../services/complaintService';
import { visitorService } from '../../services/visitorService';
import { Complaint } from '../../types/complaint.types';
import { Flat } from '../../types/visitor.types';
import { timeAgo } from '../../utils/dateUtils';

export const ComplaintsScreen: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [priority, setPriority] = useState('Medium');

  const categories = ['Plumbing', 'Electrical', 'Civil', 'Pest Control', 'Noise', 'Security', 'Other'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const fetchComplaints = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await complaintService.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFlats = async () => {
    try {
      const data = await visitorService.getFlats();
      setFlats(data);
    } catch (err) {
      console.error('Failed to fetch flats:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
      fetchFlats();
    }, [])
  );

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Validation', 'Subject and description are required.');
      return;
    }
    if (flats.length === 0) {
      Alert.alert('Error', 'No flats available. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      await complaintService.createComplaint({
        flatId: flats[0].id,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      });
      setSubject('');
      setDescription('');
      setCategory('Plumbing');
      setPriority('Medium');
      setModalVisible(false);
      fetchComplaints();
      Alert.alert('Success', 'Complaint submitted successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
      console.error('Create complaint error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComplaint = ({ item }: { item: Complaint }) => (
    <AppCard style={styles.complaintCard}>
      <View style={styles.complaintHeader}>
        <View style={styles.complaintTitleRow}>
          <Text style={styles.complaintSubject} numberOfLines={1}>
            {item.subject}
          </Text>
          <StatusBadge status={item.status} size="small" />
        </View>
        <Text style={styles.complaintMeta}>
          {item.category} • <StatusBadge status={item.priority} size="small" />
        </Text>
      </View>
      <Text style={styles.complaintDesc} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.complaintFooter}>
        <Text style={styles.complaintTime}>{timeAgo(item.createdAt)}</Text>
        {item.comments && item.comments.length > 0 && (
          <View style={styles.commentBadge}>
            <Ionicons name="chatbubble-outline" size={12} color="#64748B" />
            <Text style={styles.commentCount}>{item.comments.length}</Text>
          </View>
        )}
      </View>
    </AppCard>
  );

  if (loading) return <LoadingState message="Loading complaints..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Complaints</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComplaint}
          contentContainerStyle={complaints.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchComplaints(true)}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No Complaints"
              message="You haven't filed any complaints yet."
            />
          }
        />

        {/* Create Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
        >
          <SafeAreaView style={styles.modalSafe}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Complaint</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
                <AppInput
                  label="Subject"
                  placeholder="Brief description of the issue"
                  icon="document-text-outline"
                  value={subject}
                  onChangeText={setSubject}
                />
                <AppInput
                  label="Description"
                  placeholder="Provide details about the complaint"
                  icon="chatbox-ellipses-outline"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 100, textAlignVertical: 'top' }}
                />

                {/* Category Selector */}
                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, category === cat && styles.chipActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Priority Selector */}
                <Text style={styles.fieldLabel}>Priority</Text>
                <View style={styles.priorityRow}>
                  {priorities.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chip, priority === p && styles.chipActive]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[styles.chipText, priority === p && styles.chipTextActive]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <AppButton
                  title="Submit Complaint"
                  onPress={handleSubmit}
                  loading={submitting}
                  style={{ marginTop: 16, marginBottom: 32 }}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  addButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: 16 },
  emptyList: { flex: 1 },
  complaintCard: { marginBottom: 12 },
  complaintHeader: { marginBottom: 8 },
  complaintTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
  },
  complaintSubject: { fontSize: 15, fontWeight: '600', color: '#1E293B', flex: 1, marginRight: 8 },
  complaintMeta: { fontSize: 12, color: '#94A3B8', flexDirection: 'row', alignItems: 'center' },
  complaintDesc: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 8 },
  complaintFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  complaintTime: { fontSize: 12, color: '#94A3B8' },
  commentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentCount: { fontSize: 12, color: '#64748B' },

  // Modal
  modalSafe: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  modalContent: { padding: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  chipRow: { marginBottom: 16 },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F1F5F9', marginRight: 8,
  },
  chipActive: { backgroundColor: '#4F46E5' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  chipTextActive: { color: '#FFFFFF' },
});
