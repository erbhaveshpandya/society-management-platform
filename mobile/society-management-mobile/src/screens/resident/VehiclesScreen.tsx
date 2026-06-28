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
import { useAuth } from '../../contexts/AuthContext';
import { vehicleService } from '../../services/vehicleService';

const VEHICLE_TYPES = ['Car', 'Bike', 'Scooter'];

export const VehiclesScreen: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [type, setType] = useState('Car');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');

  const fetchVehicles = async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await vehicleService.getMyVehicles(user.id.toString());
      setVehicles(data);
    } catch (err) {
      console.error('Vehicles error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [user])
  );

  const handleAddVehicle = async () => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Required Info', 'Please enter a vehicle number.');
      return;
    }
    setSubmitting(true);
    try {
      await vehicleService.addVehicle(vehicleNumber.trim().toUpperCase(), type, make.trim(), model.trim());
      Alert.alert('Success', 'Vehicle registered successfully.');
      setAddModalVisible(false);
      setVehicleNumber('');
      setMake('');
      setModel('');
      fetchVehicles(true);
    } catch (err) {
      console.error('Add vehicle error:', err);
      Alert.alert('Error', 'Failed to register vehicle. Check input parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id: number, numberStr: string) => {
    Alert.alert(
      'Remove Vehicle',
      `Are you sure you want to remove vehicle ${numberStr}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await vehicleService.deleteVehicle(id);
              Alert.alert('Success', 'Vehicle removed successfully.');
              fetchVehicles(true);
            } catch (err) {
              console.error('Delete vehicle error:', err);
              Alert.alert('Error', 'Failed to remove vehicle.');
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingState message="Loading vehicles..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🚗 My Vehicles</Text>
          <Text style={styles.subtitle}>{vehicles.length} vehicles registered</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchVehicles(true)} colors={['#4F46E5']} />}
      >
        {vehicles.length === 0 ? (
          <EmptyState title="No vehicles registered yet" icon="car-outline" />
        ) : (
          vehicles.map(v => (
            <AppCard key={v.id} style={styles.vehicleCard}>
              <View style={styles.vehicleHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={v.type === 'Car' ? 'car-outline' : v.type === 'Bike' ? 'bicycle-outline' : 'speedometer-outline'}
                    size={28} color="#4F46E5"
                  />
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.numberPlate}>{v.vehicleNumber}</Text>
                  <Text style={styles.vehicleModel}>
                    {v.make} {v.model} • {v.type}
                  </Text>
                  <Text style={styles.flatText}>
                    {v.buildingName} • {v.flatNumber}
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteVehicle(v.id, v.vehicleNumber)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </AppCard>
          ))
        )}
      </ScrollView>

      {/* Add Vehicle Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Vehicle</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <AppInput
                label="Vehicle Number"
                placeholder="e.g. MH12AB1234"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.typeLabel}>Vehicle Type</Text>
              <View style={styles.typeSelector}>
                {VEHICLE_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, type === t && styles.typeChipActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AppInput
                label="Make / Brand"
                placeholder="e.g. Honda, Suzuki"
                value={make}
                onChangeText={setMake}
              />

              <AppInput
                label="Model"
                placeholder="e.g. City, Activa"
                value={model}
                onChangeText={setModel}
              />

              <AppButton
                title="Register Vehicle"
                onPress={handleAddVehicle}
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
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  list: { flex: 1 },
  listContent: { padding: 20, gap: 12 },
  vehicleCard: { marginBottom: 0 },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  vehicleInfo: { flex: 1 },
  numberPlate: { fontSize: 16, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5 },
  vehicleModel: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 2 },
  flatText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  deleteBtn: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  typeLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 4 },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center' },
  typeChipActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  typeText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  typeTextActive: { color: '#4F46E5' },
});
