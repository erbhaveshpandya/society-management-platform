import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { staffService } from '../../services/staffService';
import { Staff, StaffAttendance } from '../../types/common.types';

export const StaffAttendanceScreen: React.FC = () => {
  const [tab, setTab] = useState<'mark' | 'logs'>('mark');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      if (tab === 'mark') {
        const staff = await staffService.getAll();
        setStaffList(staff);
      } else {
        const logs = await staffService.getAttendance();
        setAttendanceLogs(logs);
      }
    } catch (err) {
      console.error('Attendance fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [tab])
  );

  const handleAttendanceToggle = async (staff: Staff) => {
    setActionId(staff.id);
    const isCheckingIn = !staff.isCheckedIn;
    try {
      if (isCheckingIn) {
        await staffService.checkIn(staff.id);
        Alert.alert('Checked In', `${staff.name} has been checked in successfully.`);
      } else {
        await staffService.checkOut(staff.id);
        Alert.alert('Checked Out', `${staff.name} has been checked out successfully.`);
      }
      fetchData(true);
    } catch (err: any) {
      console.error('Attendance toggle error:', err);
      const msg = err?.response?.data || 'Failed to toggle attendance status.';
      Alert.alert('Failed', typeof msg === 'string' ? msg : 'An error occurred.');
    } finally {
      setActionId(null);
    }
  };

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) return <LoadingState message="Loading staff records..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>⏱️ Staff Attendance</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'mark' && styles.tabActive]} onPress={() => setTab('mark')}>
          <Text style={[styles.tabText, tab === 'mark' && styles.tabTextActive]}>Mark Presence</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'logs' && styles.tabActive]} onPress={() => setTab('logs')}>
          <Text style={[styles.tabText, tab === 'logs' && styles.tabTextActive]}>Today's Logs</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#4F46E5']} />}
      >
        {tab === 'mark' ? (
          staffList.length === 0 ? (
            <EmptyState title="No staff registered" icon="people-outline" />
          ) : (
            staffList.map(s => (
              <AppCard key={s.id} style={styles.staffCard}>
                <View style={styles.staffRow}>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{s.name}</Text>
                    <Text style={styles.staffRole}>{s.role}</Text>
                    <Text style={styles.phoneText}>📞 {s.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      s.isCheckedIn ? styles.checkOutStyle : styles.checkInStyle,
                      actionId === s.id && styles.disabledBtn
                    ]}
                    onPress={() => handleAttendanceToggle(s)}
                    disabled={actionId === s.id}
                  >
                    {actionId === s.id ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name={s.isCheckedIn ? "log-out-outline" : "log-in-outline"} size={16} color="#FFFFFF" />
                        <Text style={styles.actionBtnText}>{s.isCheckedIn ? 'Check Out' : 'Check In'}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </AppCard>
            ))
          )
        ) : (
          attendanceLogs.length === 0 ? (
            <EmptyState title="No attendance marked today" icon="time-outline" />
          ) : (
            attendanceLogs.map(log => (
              <AppCard key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View>
                    <Text style={styles.staffName}>{log.staffName}</Text>
                    <Text style={styles.staffRole}>{log.staffRole}</Text>
                  </View>
                  <Text style={styles.markedBy}>By Guard: {log.markedByName}</Text>
                </View>
                <View style={styles.timeDetails}>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeLabel}>In Time</Text>
                    <Text style={[styles.timeValue, { color: '#059669' }]}>{formatTime(log.checkInTime)}</Text>
                  </View>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeLabel}>Out Time</Text>
                    <Text style={[styles.timeValue, { color: log.checkOutTime ? '#DC2626' : '#94A3B8' }]}>
                      {formatTime(log.checkOutTime)}
                    </Text>
                  </View>
                </View>
              </AppCard>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  tabTextActive: { color: '#4F46E5' },
  list: { flex: 1 },
  listContent: { padding: 20, gap: 12 },
  staffCard: { marginBottom: 0 },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  staffRole: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '600' },
  phoneText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  checkInStyle: { backgroundColor: '#10B981' },
  checkOutStyle: { backgroundColor: '#EF4444' },
  disabledBtn: { opacity: 0.7 },
  actionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  logCard: { marginBottom: 0, borderLeftWidth: 4, borderLeftColor: '#4F46E5' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  markedBy: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  timeDetails: { flexDirection: 'row', gap: 24, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  timeBox: {},
  timeLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  timeValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
});
