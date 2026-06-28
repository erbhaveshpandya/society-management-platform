import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { parkingService } from '../../services/parkingService';
import { ParkingAlert } from '../../types/common.types';
import { formatDate } from '../../utils/dateUtils';

export const WrongParkingScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<ParkingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  // Form State
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const fetchAlerts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await parkingService.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Parking alerts error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [])
  );

  const handleReportParking = async () => {
    if (!vehicleNumber.trim() || !location.trim()) {
      Alert.alert('Required Info', 'Please enter both vehicle number and location.');
      return;
    }
    setSubmitting(true);
    try {
      await parkingService.reportAlert(
        vehicleNumber.trim().toUpperCase(),
        location.trim(),
        description.trim() || 'Wrongly parked vehicle blocking pathway'
      );
      Alert.alert('Reported', 'Parking violation reported successfully.');
      setReportModalVisible(false);
      setVehicleNumber('');
      setLocation('');
      setDescription('');
      fetchAlerts(true);
    } catch (err) {
      console.error('Report parking error:', err);
      Alert.alert('Error', 'Failed to report parking violation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveAlert = async (id: number, vehicleNum: string) => {
    Alert.alert(
      'Resolve Alert',
      `Mark parking alert for vehicle ${vehicleNum} as resolved?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            setResolvingId(id);
            try {
              await parkingService.resolveAlert(id);
              Alert.alert('Resolved', 'Parking alert resolved successfully.');
              fetchAlerts(true);
            } catch (err) {
              console.error('Resolve parking alert error:', err);
              Alert.alert('Error', 'Failed to resolve parking alert.');
            } finally {
              setResolvingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingState message="Loading parking records..." />;

  const activeAlerts = alerts.filter(a => !a.isResolved);
  const resolvedAlerts = alerts.filter(a => a.isResolved);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🚗 Parking Warnings</Text>
          <Text style={styles.subtitle}>{activeAlerts.length} active violations</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setReportModalVisible(true)}>
          <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAlerts(true)} colors={['#4F46E5']} />}
      >
        {alerts.length === 0 ? (
          <EmptyState title="No parking alerts recorded" icon="car-outline" />
        ) : (
          <>
            {activeAlerts.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Active Alerts ({activeAlerts.length})</Text>
                {activeAlerts.map(a => (
                  <AppCard key={a.id} style={[styles.alertCard, styles.activeCard]}>
                    <View style={styles.alertHeader}>
                      <View>
                        <Text style={styles.vehiclePlate}>{a.vehicleNumber}</Text>
                        <Text style={styles.alertLocation}>📍 {a.location}</Text>
                      </View>
                      <StatusBadge status="Overdue" />
                    </View>
                    <Text style={styles.alertDesc}>{a.description}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>By: {a.reportedByName} • {formatDate(a.reportedAt)}</Text>
                      <TouchableOpacity
                        style={[styles.resolveBtn, resolvingId === a.id && styles.disabledBtn]}
                        onPress={() => handleResolveAlert(a.id, a.vehicleNumber)}
                        disabled={resolvingId === a.id}
                      >
                        {resolvingId === a.id ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.resolveBtnText}>Resolve</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </AppCard>
                ))}
              </>
            )}

            {resolvedAlerts.length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Resolved History ({resolvedAlerts.length})</Text>
                {resolvedAlerts.map(a => (
                  <AppCard key={a.id} style={styles.alertCard}>
                    <View style={styles.alertHeader}>
                      <View>
                        <Text style={[styles.vehiclePlate, styles.resolvedText]}>{a.vehicleNumber}</Text>
                        <Text style={styles.alertLocation}>📍 {a.location}</Text>
                      </View>
                      <StatusBadge status="Resolved" />
                    </View>
                    <Text style={styles.alertDesc}>{a.description}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>By: {a.reportedByName} • {formatDate(a.reportedAt)}</Text>
                    </View>
                  </AppCard>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Report Parking Alert Modal */}
      <Modal visible={reportModalVisible} animationType="slide" transparent onRequestClose={() => setReportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Wrong Parking</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <AppInput
                label="Vehicle Plate Number"
                placeholder="e.g. MH12AB1234"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
              />

              <AppInput
                label="Location / Parking Lot"
                placeholder="e.g. Block A Basement Parking Lot 42"
                value={location}
                onChangeText={setLocation}
              />

              <AppInput
                label="Violation Description"
                placeholder="e.g. Blocked entry path / No parking zone"
                value={description}
                onChangeText={setDescription}
              />

              <AppButton
                title="Report Parking Alert"
                onPress={handleReportParking}
                loading={submitting}
                style={{ marginTop: 8 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', shadowColor: '#EF4444', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  list: { flex: 1 },
  listContent: { padding: 20, gap: 12 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  alertCard: { marginBottom: 0 },
  activeCard: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vehiclePlate: { fontSize: 16, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5 },
  resolvedText: { color: '#64748B', textDecorationLine: 'line-through' },
  alertLocation: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 4 },
  alertDesc: { fontSize: 13, color: '#64748B', marginTop: 8, lineHeight: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  metaText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  disabledBtn: { opacity: 0.7 },
  resolveBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
});
