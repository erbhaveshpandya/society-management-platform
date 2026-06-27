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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { LoadingState } from '../../components/LoadingState';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { ResidentDashboard } from '../../types/common.types';
import { formatDate } from '../../utils/dateUtils';
import axiosClient from '../../api/axiosClient';

export const ResidentDashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState<ResidentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // SOS State
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [triggeringSOS, setTriggeringSOS] = useState(false);

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

  const handleTriggerSOS = async (type: 'Fire' | 'Theft' | 'Medical' | 'SuspiciousActivity' | 'Other') => {
    Alert.alert(
      'Confirm SOS Alert',
      `This will immediately broadcast a ${type} distress alarm to all security gates and administrators. Proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ACTIVATE ALARM',
          style: 'destructive',
          onPress: async () => {
            setTriggeringSOS(true);
            try {
              await axiosClient.post('emergency-alerts', {
                type,
                description: `Emergency distress signal triggered from Mobile app by Resident ${user?.fullName}`,
              });
              Alert.alert('SOS Broadcasted', 'Distress alarm active. Help is on the way.');
              setSosModalVisible(false);
            } catch (err) {
              console.error('Failed to trigger mobile SOS:', err);
              Alert.alert('Error', 'Failed to broadcast distress signal. Please call local security.');
            } finally {
              setTriggeringSOS(false);
            }
          },
        },
      ]
    );
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

        {/* SOS Emergency Trigger Panel */}
        <TouchableOpacity
          style={styles.sosCard}
          onPress={() => setSosModalVisible(true)}
          activeOpacity={0.9}
        >
          <View style={styles.sosCardHeader}>
            <View style={styles.sosIconContainer}>
              <Ionicons name="alert-circle" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.sosCardTextContainer}>
              <Text style={styles.sosCardTitle}>TRIGGER SOS EMERGENCY</Text>
              <Text style={styles.sosCardSubtitle}>Broadcast distress alert to gate security & admin</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#FFFFFF" style={{ opacity: 0.8 }} />
          </View>
        </TouchableOpacity>

        {/* SOS Trigger Selection Modal */}
        <Modal
          visible={sosModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSosModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.sosModalContent}>
              <View style={styles.sosModalHeader}>
                <Ionicons name="warning-outline" size={24} color="#DC2626" />
                <Text style={styles.sosModalTitle}>Select Emergency Type</Text>
                <TouchableOpacity onPress={() => setSosModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sosModalDescription}>
                Select the distress category to alert the society administration and all security gates:
              </Text>

              {triggeringSOS ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#DC2626" />
                  <Text style={styles.loadingText}>Broadcasting distress alarm...</Text>
                </View>
              ) : (
                <View style={styles.sosOptionsGrid}>
                  <TouchableOpacity
                    style={[styles.sosOptionItem, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                    onPress={() => handleTriggerSOS('Fire')}
                  >
                    <Ionicons name="flame" size={32} color="#DC2626" />
                    <Text style={[styles.sosOptionLabel, { color: '#991B1B' }]}>Fire</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sosOptionItem, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}
                    onPress={() => handleTriggerSOS('Theft')}
                  >
                    <Ionicons name="shield-half" size={32} color="#D97706" />
                    <Text style={[styles.sosOptionLabel, { color: '#92400E' }]}>Theft</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sosOptionItem, { backgroundColor: '#E0F2FE', borderColor: '#7DD3FC' }]}
                    onPress={() => handleTriggerSOS('Medical')}
                  >
                    <Ionicons name="medical" size={32} color="#0284C7" />
                    <Text style={[styles.sosOptionLabel, { color: '#075985' }]}>Medical</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sosOptionItem, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}
                    onPress={() => handleTriggerSOS('Other')}
                  >
                    <Ionicons name="warning" size={32} color="#475569" />
                    <Text style={[styles.sosOptionLabel, { color: '#1E293B' }]}>Other</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

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
  sosCard: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sosCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sosIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosCardTextContainer: {
    flex: 1,
  },
  sosCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sosCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sosModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  sosModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
    gap: 8,
  },
  sosModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  sosModalDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  closeBtn: {
    padding: 4,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  sosOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sosOptionItem: {
    width: '48%',
    aspectRatio: 1.1,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sosOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});
