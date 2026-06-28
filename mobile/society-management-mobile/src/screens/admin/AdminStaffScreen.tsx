import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { staffService } from '../../services/staffService';
import { Staff } from '../../types/common.types';
import { formatTime } from '../../utils/dateUtils';

export const AdminStaffScreen: React.FC = () => {
  const navigation = useNavigation();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStaff = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await staffService.getAll();
      setStaffList(data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      Alert.alert('Error', 'Failed to load domestic staff list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStaff();
    }, [])
  );

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch((err) => {
      console.error('Call dial error:', err);
      Alert.alert('Error', 'Failed to open dialer.');
    });
  };

  if (loading) return <LoadingState message="Loading staff list..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Domestic Staff"
        subtitle="Track domestic staff & attendance"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchStaff(true)} colors={['#4F46E5']} />
        }
      >
        {staffList.length === 0 ? (
          <EmptyState
            title="No Staff Registered"
            message="No domestic helper, maid, driver, or gardener has been registered in the database."
            icon="people-outline"
          />
        ) : (
          staffList.map((staff) => (
            <AppCard key={staff.id} style={styles.staffCard}>
              <View style={styles.cardRow}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {staff.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.staffInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      staff.isCheckedIn ? styles.statusIn : styles.statusOut
                    ]}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: staff.isCheckedIn ? '#10B981' : '#94A3B8' }
                      ]} />
                      <Text style={[
                        styles.statusText,
                        { color: staff.isCheckedIn ? '#065F46' : '#475569' }
                      ]}>
                        {staff.isCheckedIn ? 'IN' : 'OUT'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.staffRole}>{staff.role}</Text>

                  {/* Attendance timing */}
                  {staff.isCheckedIn ? (
                    <Text style={styles.timeText}>
                      Checked in today at: {staff.lastCheckIn ? formatTime(staff.lastCheckIn) : 'N/A'}
                    </Text>
                  ) : (
                    <Text style={styles.timeText}>
                      Last check out: {staff.lastCheckOut ? formatTime(staff.lastCheckOut) : 'Never checked in'}
                    </Text>
                  )}
                </View>

                {staff.phone ? (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCall(staff.phone)}
                  >
                    <Ionicons name="call" size={18} color="#4F46E5" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </AppCard>
          ))
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
    padding: 16,
    paddingBottom: 32,
  },
  staffCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  staffInfo: {
    flex: 1,
    paddingRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  staffRole: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  statusIn: {
    backgroundColor: '#D1FAE5',
  },
  statusOut: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 6,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
