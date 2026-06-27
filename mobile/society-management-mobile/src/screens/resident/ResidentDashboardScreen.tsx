import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { LoadingState } from '../../components/LoadingState';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { ResidentDashboard } from '../../types/common.types';
import { formatDate } from '../../utils/dateUtils';

export const ResidentDashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState<ResidentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await dashboardService.getResidentDashboard();
      setDashboard(data);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  if (loading) return <LoadingState message="Loading dashboard..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDashboard(true)}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.fullName || 'Resident'}</Text>
            {dashboard && (
              <Text style={styles.flatInfo}>
                {dashboard.buildingName} • {dashboard.flatNumber}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Stats Grid */}
        {dashboard && (
          <>
            <View style={styles.statsGrid}>
              <AppCard
                title="Outstanding Dues"
                icon="wallet-outline"
                iconColor="#DC2626"
                iconBgColor="#FEF2F2"
                value={`₹${dashboard.totalDues.toLocaleString('en-IN')}`}
                style={styles.statCard}
              />
              <AppCard
                title="Open Complaints"
                icon="chatbubble-ellipses-outline"
                iconColor="#F59E0B"
                iconBgColor="#FFFBEB"
                value={dashboard.openComplaints.toString()}
                style={styles.statCard}
              />
            </View>
            <View style={styles.statsGrid}>
              <AppCard
                title="Active Bookings"
                icon="calendar-outline"
                iconColor="#10B981"
                iconBgColor="#ECFDF5"
                value={dashboard.activeBookings.toString()}
                style={styles.statCard}
              />
              <AppCard
                title="Notifications"
                icon="notifications-outline"
                iconColor="#6366F1"
                iconBgColor="#EEF2FF"
                value={dashboard.unreadNotifications.toString()}
                style={styles.statCard}
              />
            </View>

            {/* Recent Notices */}
            <Text style={styles.sectionTitle}>Recent Notices</Text>
            {dashboard.recentNotices.length > 0 ? (
              dashboard.recentNotices.map((notice) => (
                <AppCard key={notice.id} style={styles.noticeCard}>
                  <View style={styles.noticeRow}>
                    <View style={styles.noticeIcon}>
                      <Ionicons name="megaphone-outline" size={18} color="#4F46E5" />
                    </View>
                    <View style={styles.noticeContent}>
                      <Text style={styles.noticeTitle} numberOfLines={1}>
                        {notice.title}
                      </Text>
                      <Text style={styles.noticeMeta}>
                        {notice.category} • {formatDate(notice.publishedDate)}
                      </Text>
                    </View>
                  </View>
                </AppCard>
              ))
            ) : (
              <AppCard>
                <Text style={styles.emptyText}>No recent notices</Text>
              </AppCard>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#94A3B8',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  flatInfo: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 12,
  },
  noticeCard: {
    marginBottom: 8,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  noticeMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
