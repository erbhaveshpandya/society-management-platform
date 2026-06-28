import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { staffService } from '../../services/staffService';
import { Staff } from '../../types/common.types';

const roleIcons: Record<string, string> = {
  Maid: 'woman-outline',
  Cook: 'restaurant-outline',
  Driver: 'car-outline',
  Gardener: 'leaf-outline',
  Plumber: 'water-outline',
  Electrician: 'flash-outline',
  Watchman: 'shield-outline',
};

export const StaffScreen: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStaff = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await staffService.getAll();
      setStaff(data);
    } catch (err) {
      console.error('Staff error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchStaff(); }, []));

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) return <LoadingState message="Loading staff directory..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>👷 Domestic Staff</Text>
        <Text style={styles.subtitle}>{staff.length} staff members</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchStaff(true)} colors={['#4F46E5']} />}
      >
        {staff.length === 0 ? (
          <EmptyState title="No staff registered" icon="people-outline" />
        ) : (
          staff.map(s => {
            const icon = roleIcons[s.role] || 'person-outline';
            return (
              <AppCard key={s.id} style={styles.staffCard}>
                <View style={styles.staffRow}>
                  <View style={styles.staffIcon}>
                    <Ionicons name={icon as any} size={24} color="#4F46E5" />
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{s.name}</Text>
                    <Text style={styles.staffRole}>{s.role}</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: s.isCheckedIn ? '#22C55E' : '#EF4444' }]} />
                      <Text style={[styles.statusText, { color: s.isCheckedIn ? '#059669' : '#DC2626' }]}>
                        {s.isCheckedIn ? 'Present in Society' : 'Not Checked In'}
                      </Text>
                    </View>
                  </View>
                  {s.phone ? (
                    <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(s.phone)}>
                      <Ionicons name="call" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </AppCard>
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
  list: { flex: 1 },
  listContent: { padding: 20, gap: 12 },
  staffCard: { marginBottom: 0 },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  staffIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  staffRole: { fontSize: 13, color: '#64748B', marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  callBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },
});
