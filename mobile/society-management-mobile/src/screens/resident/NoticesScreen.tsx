import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
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

export const NoticesScreen: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchNotices = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await noticeService.getNotices();
      setNotices(data);
    } catch (err) {
      console.error('Notices error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchNotices(); }, []));

  const filtered = selectedCategory === 'All'
    ? notices
    : notices.filter(n => n.category === selectedCategory);

  if (loading) return <LoadingState message="Loading notices..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>📢 Notice Board</Text>
        <Text style={styles.subtitle}>{notices.length} announcements</Text>
      </View>

      {/* Category Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCategory === cat && styles.chipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNotices(true)} colors={['#4F46E5']} />}
      >
        {filtered.length === 0 ? (
          <EmptyState title="No notices found" icon="megaphone-outline" />
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
                      <Text style={styles.noticeTitle} numberOfLines={isExpanded ? undefined : 2}>{notice.title}</Text>
                      <View style={styles.metaRow}>
                        <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                          <Text style={[styles.catBadgeText, { color: cat.text }]}>{notice.category}</Text>
                        </View>
                        <Text style={styles.dateMeta}>{formatDate(notice.publishedDate)}</Text>
                      </View>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
                  </View>
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <Text style={styles.noticeContent}>{notice.content}</Text>
                      {notice.createdByName && (
                        <Text style={styles.authorText}>— Published by {notice.createdByName}</Text>
                      )}
                    </View>
                  )}
                </AppCard>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  chipScroll: { maxHeight: 48, paddingLeft: 20 },
  chipContainer: { flexDirection: 'row', gap: 8, paddingRight: 20, alignItems: 'center' },
  chip: { backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chipActive: { backgroundColor: '#4F46E5' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#FFFFFF' },
  list: { flex: 1 },
  listContent: { padding: 20, gap: 12 },
  noticeCard: { marginBottom: 0 },
  noticeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noticeInfo: { flex: 1 },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catBadgeText: { fontSize: 11, fontWeight: '700' },
  dateMeta: { fontSize: 11, color: '#94A3B8' },
  expandedContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  noticeContent: { fontSize: 14, color: '#475569', lineHeight: 22 },
  authorText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginTop: 8 },
});
