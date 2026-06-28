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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { LoadingState } from '../../components/LoadingState';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { AdminDashboard } from '../../types/common.types';
import axiosClient from '../../api/axiosClient';

export const AdminDashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // SuperAdmin active society switching states
  const [societies, setSocieties] = useState<{ id: number; name: string }[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState<number | null>(null);
  const [societyModalVisible, setSocietyModalVisible] = useState(false);

  // SOS State
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [triggeringSOS, setTriggeringSOS] = useState(false);

  const fetchSocietiesList = async () => {
    if (user?.role !== 'SuperAdmin') return;
    try {
      const res = await axiosClient.get<{ id: number; name: string }[]>('societies');
      setSocieties(res.data);
      
      const storedId = await SecureStore.getItemAsync('selectedSocietyId');
      if (storedId) {
        setSelectedSocietyId(parseInt(storedId, 10));
      } else if (res.data.length > 0) {
        setSelectedSocietyId(res.data[0].id);
        await SecureStore.setItemAsync('selectedSocietyId', res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load societies list in AdminDashboard:', err);
    }
  };

  const handleSwitchSociety = async (id: number) => {
    setSelectedSocietyId(id);
    await SecureStore.setItemAsync('selectedSocietyId', id.toString());
    setSocietyModalVisible(false);
    // Reload dashboard content
    fetchDashboard(false);
  };

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await dashboardService.getAdminDashboard();
      setDashboard(data);
    } catch (err) {
      setError('Failed to load dashboard metrics');
      console.error('Admin Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTriggerSOS = async (type: 'Fire' | 'Theft' | 'Medical' | 'SuspiciousActivity' | 'Other') => {
    Alert.alert(
      'Confirm SOS Alert',
      `This will immediately broadcast a ${type} distress alarm to all security gates and residents. Proceed?`,
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
                description: `Emergency distress signal triggered from Mobile app by Administrator ${user?.fullName}`,
              });
              Alert.alert('SOS Broadcasted', 'Emergency alarm is active. Security and residents have been alerted.');
              setSosModalVisible(false);
            } catch (err) {
              console.error('Failed to trigger admin SOS:', err);
              Alert.alert('Error', 'Failed to broadcast distress signal. Please check connection.');
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
      const initDashboard = async () => {
        if (user?.role === 'SuperAdmin') {
          await fetchSocietiesList();
        }
        await fetchDashboard();
      };
      initDashboard();
    }, [user])
  );

  if (loading) return <LoadingState message="Loading admin metrics..." />;

  const currentSocietyName = societies.find(s => s.id === selectedSocietyId)?.name || 'Select Society';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.roleText}>{user?.role} Portal</Text>
          <Text style={styles.userName}>{user?.fullName}</Text>
          {user?.role === 'SuperAdmin' ? (
            <TouchableOpacity
              style={styles.societySwitcherBtn}
              onPress={() => setSocietyModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="business-outline" size={13} color="#4F46E5" />
              <Text style={styles.societySwitcherText} numberOfLines={1}>
                {currentSocietyName}
              </Text>
              <Ionicons name="chevron-down" size={13} color="#4F46E5" />
            </TouchableOpacity>
          ) : (
            <Text style={styles.societyNameText}>{user?.societyName}</Text>
          )}
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDashboard(true)}
            colors={['#4F46E5']}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <AppButton title="Retry" onPress={() => fetchDashboard()} />
          </View>
        ) : null}

        {/* SOS Quick trigger card */}
        <TouchableOpacity
          style={styles.sosCard}
          onPress={() => setSosModalVisible(true)}
        >
          <View style={styles.sosCardHeader}>
            <View style={styles.sosIconContainer}>
              <Ionicons name="alert-circle" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.sosCardTextContainer}>
              <Text style={styles.sosCardTitle}>EMERGENCY SOS</Text>
              <Text style={styles.sosCardSubtitle}>Broadcast emergency alert to entire society</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Core Stats Section */}
        <Text style={styles.sectionTitle}>Overview Metrics</Text>
        <View style={styles.statsGrid}>
          {/* Maintenance Collected */}
          <AppCard style={[styles.statsCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
            <Text style={styles.statsLabel}>Maintenance Collected</Text>
            <Text style={[styles.statsValue, { color: '#065F46' }]}>
              ₹{dashboard?.totalMaintenanceCollected.toLocaleString() ?? '0'}
            </Text>
          </AppCard>

          {/* Maintenance Pending */}
          <AppCard style={[styles.statsCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]}>
            <Text style={styles.statsLabel}>Pending Collection</Text>
            <Text style={[styles.statsValue, { color: '#92400E' }]}>
              ₹{dashboard?.pendingMaintenanceAmount.toLocaleString() ?? '0'}
            </Text>
          </AppCard>

          {/* Open Complaints */}
          <AppCard style={[styles.statsCard, { borderLeftColor: '#EF4444', borderLeftWidth: 4 }]}>
            <Text style={styles.statsLabel}>Active Complaints</Text>
            <View style={styles.statsRow}>
              <Text style={[styles.statsValue, { color: '#991B1B' }]}>
                {dashboard?.openComplaints ?? '0'}
              </Text>
              <Ionicons name="warning-outline" size={24} color="#EF4444" />
            </View>
          </AppCard>

          {/* Active Visitors */}
          <AppCard style={[styles.statsCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 4 }]}>
            <Text style={styles.statsLabel}>Active Visitors</Text>
            <View style={styles.statsRow}>
              <Text style={[styles.statsValue, { color: '#1E40AF' }]}>
                {dashboard?.activeVisitors ?? '0'}
              </Text>
              <Ionicons name="people-outline" size={24} color="#3B82F6" />
            </View>
          </AppCard>
        </View>

        {/* Occupancy Card */}
        <AppCard style={styles.occupancyCard}>
          <Text style={styles.cardTitle}>Apartment Occupancy</Text>
          <View style={styles.occupancyGrid}>
            <View style={styles.occupancyItem}>
              <Text style={styles.occupancyNumber}>{dashboard?.totalFlats ?? '0'}</Text>
              <Text style={styles.occupancyLabel}>Total Flats</Text>
            </View>
            <View style={styles.occupancyDivider} />
            <View style={styles.occupancyItem}>
              <Text style={[styles.occupancyNumber, { color: '#10B981' }]}>
                {dashboard?.occupiedFlats ?? '0'}
              </Text>
              <Text style={styles.occupancyLabel}>Occupied</Text>
            </View>
            <View style={styles.occupancyDivider} />
            <View style={styles.occupancyItem}>
              <Text style={[styles.occupancyNumber, { color: '#64748B' }]}>
                {dashboard?.vacantFlats ?? '0'}
              </Text>
              <Text style={styles.occupancyLabel}>Vacant</Text>
            </View>
          </View>
        </AppCard>

        {/* Admin Navigation Menu */}
        <Text style={styles.sectionTitle}>Management Console</Text>
        <View style={styles.menuGrid}>
          {/* Complaints */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AdminComplaints')}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="chatbubbles" size={24} color="#EF4444" />
            </View>
            <Text style={styles.menuLabel}>Complaints</Text>
            {dashboard && dashboard.openComplaints > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dashboard.openComplaints}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Notices */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AdminNotices')}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="megaphone" size={24} color="#0EA5E9" />
            </View>
            <Text style={styles.menuLabel}>Notices</Text>
          </TouchableOpacity>

          {/* Flats */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AdminFlats')}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#E0F8F5' }]}>
              <Ionicons name="business" size={24} color="#0D9488" />
            </View>
            <Text style={styles.menuLabel}>Flats Directory</Text>
          </TouchableOpacity>

          {/* Staff */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AdminStaff')}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="people" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.menuLabel}>Domestic Staff</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* SOS Dialog Modal */}
      <Modal
        visible={sosModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSosModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sosModalContent}>
            <View style={styles.sosModalHeader}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.sosModalTitle}>Select Emergency Type</Text>
              <TouchableOpacity onPress={() => setSosModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.sosOptionsGrid}>
              {[
                { type: 'Fire', icon: 'flame', color: '#EF4444' },
                { type: 'Medical', icon: 'medical', color: '#10B981' },
                { type: 'Theft', icon: 'lock-open', color: '#F59E0B' },
                { type: 'SuspiciousActivity', icon: 'eye', color: '#8B5CF6' },
                { type: 'Other', icon: 'help-circle', color: '#64748B' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={styles.sosOptionItem}
                  onPress={() => handleTriggerSOS(item.type as any)}
                  disabled={triggeringSOS}
                >
                  <View style={[styles.sosOptionIcon, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.sosOptionText}>{item.type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {triggeringSOS && (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#EF4444" />
                <Text style={styles.loaderText}>Broadcasting Alert...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Society Selector Modal */}
      <Modal
        visible={societyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSocietyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.societyModalContent}>
            <View style={styles.modalHeaderBorder}>
              <Text style={styles.societyModalTitle}>Switch Active Society</Text>
              <TouchableOpacity onPress={() => setSocietyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={societies}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedSocietyId;
                return (
                  <TouchableOpacity
                    style={[
                      styles.societyItemRow,
                      isSelected && styles.societyItemRowActive
                    ]}
                    onPress={() => handleSwitchSociety(item.id)}
                  >
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={20}
                      color={isSelected ? "#4F46E5" : "#64748B"}
                    />
                    <Text style={[
                      styles.societyItemText,
                      isSelected && styles.societyItemTextActive
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B' }}>No societies found</Text>
                </View>
              }
            />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  roleText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
  },
  sosIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  statsCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 0,
  },
  statsLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occupancyCard: {
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  occupancyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occupancyItem: {
    flex: 1,
    alignItems: 'center',
  },
  occupancyNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  occupancyLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 4,
  },
  occupancyDivider: {
    height: 30,
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sosModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
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
    paddingBottom: 14,
    marginBottom: 16,
    gap: 8,
  },
  sosModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  sosOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  sosOptionItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  sosOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sosOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  societySwitcherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
  societySwitcherText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    maxWidth: 180,
  },
  societyNameText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  societyModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '70%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeaderBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 10,
  },
  societyModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  societyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    gap: 12,
  },
  societyItemRowActive: {
    backgroundColor: '#F5F3FF',
  },
  societyItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  societyItemTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
});
