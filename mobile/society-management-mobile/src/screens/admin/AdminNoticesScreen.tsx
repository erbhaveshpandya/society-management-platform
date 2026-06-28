import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { noticeService } from '../../services/noticeService';
import { Notice } from '../../types/common.types';
import { formatDate } from '../../utils/dateUtils';

const CATEGORIES = ['All', 'General', 'Maintenance', 'Event', 'Emergency', 'Other'];

const categoryColors: Record<string, { bg: string; text: string; icon: string }> = {
  General: { bg: '#EEF2FF', text: '#4F46E5', icon: 'information-circle' },
  Maintenance: { bg: '#FEF3C7', text: '#D97706', icon: 'construct' },
  Event: { bg: '#ECFDF5', text: '#059669', icon: 'calendar' },
  Emergency: { bg: '#FEE2E2', text: '#DC2626', icon: 'warning' },
  Other: { bg: '#F1F5F9', text: '#475569', icon: 'ellipsis-horizontal-circle' },
};

export const AdminNoticesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [isPublished, setIsPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await noticeService.getNotices();
      setNotices(data);
    } catch (err) {
      console.error('Notices error:', err);
      Alert.alert('Error', 'Failed to fetch notices.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotices();
    }, [])
  );

  const handleCreateNotice = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation', 'Title and Content are required.');
      return;
    }
    setSubmitting(true);
    try {
      await noticeService.createNotice({
        title: title.trim(),
        content: content.trim(),
        category,
        isPublished,
      });
      Alert.alert('Success', 'Notice published successfully');
      setCreateModalVisible(false);
      setTitle('');
      setContent('');
      setCategory('General');
      setIsPublished(true);
      fetchNotices();
    } catch (err) {
      console.error('Create Notice error:', err);
      Alert.alert('Error', 'Failed to publish notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = selectedCategory === 'All'
    ? notices
    : notices.filter(n => n.category === selectedCategory);

  if (loading) return <LoadingState message="Loading notices..." />;

  const rightActionHeader = (
    <TouchableOpacity
      style={styles.addBtn}
      onPress={() => setCreateModalVisible(true)}
    >
      <Ionicons name="add" size={24} color="#4F46E5" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Notices"
        subtitle="Publish updates & rules"
        onBack={() => navigation.goBack()}
        rightAction={rightActionHeader}
      />

      {/* Category Chips */}
      <View style={styles.chipContainerWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContainer}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                {cat === 'All' ? 'All Notices' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notices List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotices(true)} colors={['#4F46E5']} />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState title="No notices found" message="Notice board is empty for this category." icon="megaphone-outline" />
        ) : (
          filtered.map(notice => {
            const cat = categoryColors[notice.category] || categoryColors.Other;
            const isExpanded = expandedId === notice.id;
            return (
              <TouchableOpacity
                key={notice.id}
                activeOpacity={0.9}
                onPress={() => setExpandedId(isExpanded ? null : notice.id)}
              >
                <AppCard style={styles.noticeCard}>
                  <View style={styles.noticeHeader}>
                    <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
                      <Ionicons name={cat.icon as any} size={20} color={cat.text} />
                    </View>
                    <View style={styles.noticeInfo}>
                      <Text style={styles.noticeTitle} numberOfLines={isExpanded ? undefined : 2}>
                        {notice.title}
                      </Text>
                      <View style={styles.metaRow}>
                        <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                          <Text style={[styles.catText, { color: cat.text }]}>{notice.category}</Text>
                        </View>
                        <Text style={styles.metaText}>{formatDate(notice.publishedDate)}</Text>
                      </View>
                    </View>
                  </View>

                  {isExpanded && (
                    <View style={styles.noticeBody}>
                      <Text style={styles.noticeContentText}>{notice.content}</Text>
                      <View style={styles.authorSection}>
                        <Ionicons name="person-circle-outline" size={16} color="#94A3B8" />
                        <Text style={styles.authorText}>
                          Published by: {notice.createdByName || 'Administrator'}
                        </Text>
                      </View>
                    </View>
                  )}
                </AppCard>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Create Notice Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleHeader}>Publish Notice</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              <AppInput
                label="Notice Title"
                placeholder="e.g. Water Outage Maintenance"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.pickerLabel}>Category</Text>
              <View style={styles.categoryPickerGrid}>
                {['General', 'Maintenance', 'Event', 'Emergency'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPickerBtn, category === cat && styles.categoryPickerBtnActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryPickerText, category === cat && styles.categoryPickerTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.pickerLabel}>Notice Content</Text>
              <TextInput
                style={styles.contentTextarea}
                placeholder="Enter complete notice announcement details here..."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Publish Immediately</Text>
                  <Text style={styles.switchSublabel}>Visible to all residents and security guards</Text>
                </View>
                <Switch
                  value={isPublished}
                  onValueChange={setIsPublished}
                  trackColor={{ false: '#CBD5E1', true: '#C7D2FE' }}
                  thumbColor={isPublished ? '#4F46E5' : '#94A3B8'}
                />
              </View>

              <AppButton
                title="Publish Announcement"
                onPress={handleCreateNotice}
                loading={submitting}
                style={styles.submitBtn}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  addBtn: {
    padding: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  chipContainerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chipScroll: {
    paddingVertical: 10,
  },
  chipContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#4F46E5',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  noticeCard: {
    padding: 14,
    marginBottom: 12,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noticeInfo: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  noticeBody: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  noticeContentText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  authorText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
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
    height: '80%',
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
  modalTitleHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginTop: 14,
  },
  categoryPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryPickerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPickerBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryPickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPickerTextActive: {
    color: '#FFFFFF',
  },
  contentTextarea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    color: '#1E293B',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  switchSublabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 20,
  },
});
