import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, Alert, Platform,
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
import { amenityService } from '../../services/amenityService';
import { Amenity, Booking, OccupiedSlot } from '../../types/common.types';
import { formatDate } from '../../utils/dateUtils';

const TIME_SLOTS = ['06:00-08:00', '08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'];

export const AmenityBookingScreen: React.FC = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [occupied, setOccupied] = useState<OccupiedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [purpose, setPurpose] = useState('');
  const [booking, setBooking] = useState(false);
  const [tab, setTab] = useState<'amenities' | 'mybookings'>('amenities');

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [a, b, o] = await Promise.all([
        amenityService.getAmenities(),
        amenityService.getBookings(),
        amenityService.getOccupiedSlots(),
      ]);
      setAmenities(a);
      setBookings(b);
      setOccupied(o);
    } catch (err) {
      console.error('Amenity error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const todayStr = new Date().toISOString().split('T')[0];

  const isSlotOccupied = (amenityId: number, slot: string) => {
    return occupied.some(o => o.amenityId === amenityId && o.bookingDate.startsWith(todayStr) && o.timeSlot === slot);
  };

  const handleBook = async () => {
    if (!selectedAmenity || !selectedSlot) {
      Alert.alert('Missing Info', 'Please select a time slot.');
      return;
    }
    setBooking(true);
    try {
      await amenityService.createBooking(selectedAmenity.id, todayStr, selectedSlot, purpose || 'General Use');
      Alert.alert('Booking Submitted', 'Your booking has been submitted for approval.');
      setBookModalVisible(false);
      setSelectedAmenity(null);
      setSelectedSlot('');
      setPurpose('');
      fetchData(true);
    } catch (err: any) {
      const msg = err?.response?.data || 'Failed to create booking.';
      Alert.alert('Booking Failed', typeof msg === 'string' ? msg : 'An error occurred.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <LoadingState message="Loading amenities..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🏊 Amenity Booking</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'amenities' && styles.tabActive]} onPress={() => setTab('amenities')}>
          <Text style={[styles.tabText, tab === 'amenities' && styles.tabTextActive]}>Amenities</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'mybookings' && styles.tabActive]} onPress={() => setTab('mybookings')}>
          <Text style={[styles.tabText, tab === 'mybookings' && styles.tabTextActive]}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={['#4F46E5']} />}
      >
        {tab === 'amenities' ? (
          amenities.length === 0 ? (
            <EmptyState title="No amenities available" icon="fitness-outline" />
          ) : (
            amenities.map(a => (
              <AppCard key={a.id} style={styles.amenityCard}>
                <View style={styles.amenityHeader}>
                  <View style={styles.amenityIcon}>
                    <Ionicons
                      name={a.name.toLowerCase().includes('gym') ? 'barbell' : a.name.toLowerCase().includes('pool') ? 'water' : 'business'}
                      size={24} color="#4F46E5"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityName}>{a.name}</Text>
                    <Text style={styles.amenityLoc}>{a.location}</Text>
                    <Text style={styles.amenityTime}>{a.openTime} - {a.closeTime}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => { setSelectedAmenity(a); setBookModalVisible(true); }}
                  >
                    <Text style={styles.bookBtnText}>Book</Text>
                  </TouchableOpacity>
                </View>
              </AppCard>
            ))
          )
        ) : (
          bookings.length === 0 ? (
            <EmptyState title="No bookings yet" icon="calendar-outline" />
          ) : (
            bookings.map(b => (
              <AppCard key={b.id} style={styles.amenityCard}>
                <View style={styles.bookingHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityName}>{b.amenityName}</Text>
                    <Text style={styles.amenityLoc}>{formatDate(b.bookingDate)} • {b.timeSlot}</Text>
                    {b.purpose ? <Text style={styles.amenityTime}>Purpose: {b.purpose}</Text> : null}
                  </View>
                  <StatusBadge status={b.status} />
                </View>
              </AppCard>
            ))
          )
        )}
      </ScrollView>

      {/* Booking Modal */}
      <Modal visible={bookModalVisible} animationType="slide" transparent onRequestClose={() => setBookModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book {selectedAmenity?.name}</Text>
              <TouchableOpacity onPress={() => setBookModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.slotLabel}>Select Time Slot (Today)</Text>
            <View style={styles.slotGrid}>
              {TIME_SLOTS.map(slot => {
                const occ = selectedAmenity ? isSlotOccupied(selectedAmenity.id, slot) : false;
                const sel = selectedSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotChip, sel && styles.slotChipActive, occ && styles.slotChipDisabled]}
                    disabled={occ}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotText, sel && styles.slotTextActive, occ && styles.slotTextDisabled]}>{slot}</Text>
                    {occ && <Text style={styles.occupiedLabel}>Booked</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            <AppInput label="Purpose (optional)" placeholder="e.g., Birthday party" value={purpose} onChangeText={setPurpose} />
            <AppButton title="Submit Booking" onPress={handleBook} loading={booking} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>
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
  amenityCard: { marginBottom: 0 },
  amenityHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amenityIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  amenityName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  amenityLoc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  amenityTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  bookBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  bookBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  bookingHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  slotLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 10 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  slotChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center' },
  slotChipActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  slotChipDisabled: { borderColor: '#E2E8F0', backgroundColor: '#F1F5F9', opacity: 0.5 },
  slotText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  slotTextActive: { color: '#4F46E5' },
  slotTextDisabled: { color: '#94A3B8' },
  occupiedLabel: { fontSize: 9, color: '#DC2626', fontWeight: '700', marginTop: 2 },
});
