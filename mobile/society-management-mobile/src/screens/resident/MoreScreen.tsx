import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { name: 'Notices', label: 'Notice Board', icon: 'megaphone-outline', color: '#4F46E5', bg: '#EEF2FF' },
  { name: 'Polls', label: 'Opinion Polls', icon: 'bar-chart-outline', color: '#10B981', bg: '#ECFDF5' },
  { name: 'Amenities', label: 'Amenity Booking', icon: 'calendar-outline', color: '#F59E0B', bg: '#FFFBEB' },
  { name: 'Staff', label: 'Domestic Staff', icon: 'people-outline', color: '#06B6D4', bg: '#ECFEFF' },
  { name: 'Vehicles', label: 'My Vehicles', icon: 'car-outline', color: '#6366F1', bg: '#EEF2FF' },
];

export const MoreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <Text style={styles.subtitle}>Explore secondary resident features</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.name}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={26} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={styles.arrow} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  content: { padding: 20, gap: 24 },
  grid: { gap: 10 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
  },
  iconWrapper: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B', flex: 1, marginLeft: 12 },
  arrow: { opacity: 0.8 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 14, marginTop: 12,
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
