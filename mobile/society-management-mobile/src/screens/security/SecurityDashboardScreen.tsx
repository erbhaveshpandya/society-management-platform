import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { LoadingState } from '../../components/LoadingState';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { SecurityDashboard } from '../../types/common.types';
import axiosClient from '../../api/axiosClient';

export const SecurityDashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [triggeringSOS, setTriggeringSOS] = useState(false);

  const fetchDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await dashboardService.getSecurityDashboard();
      setDashboard(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Security dashboard error:', err);
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

  const handleTriggerSOS = (type: 'Fire' | 'Theft' | 'Medical' | 'Other') => {
    Alert.alert(
      'Trigger Emergency Alarm',
      `Are you sure you want to broadcast a society-wide ${type} alert?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger',
          style: 'destructive',
          onPress: async () => {
            setTriggeringSOS(true);
            try {
              await axiosClient.post('emergency-alerts', {
                type,
                description: `Emergency alert triggered by Security Guard ${user?.fullName}`,
              });
              Alert.alert('Emergency Activated', `Society-wide ${type} alarm has been broadcasted.`);
              fetchDashboard();
            } catch (err) {
              console.error('Failed to trigger emergency:', err);
              Alert.alert('Error', 'Failed to trigger emergency alert.');
            } finally {
              setTriggeringSOS(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingState message="Loading security terminal..." />;

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
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Security Gate Terminal</Text>
            <Text style={styles.userName}>{user?.fullName || 'Guard'}</Text>
            {user?.societyName && (
              <Text style={styles.societyName} numberOfLines={1}>
                {user.societyName}
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

        {/* Action Quicklinks */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4F46E5' }]}
            onPress={() => navigation.navigate('VisitorEntry')}
          >
            <Ionicons name="person-add" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Visitor Check-In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => navigation.navigate('LiveVisitors')}
          >
            <Ionicons name="people" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Active Visitors</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Numbers */}
        {dashboard && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Gate Statistics</Text>
            <View style={styles.statsGrid}>
              <AppCard
                title="Active Visitors"
                icon="walk-outline"
                iconColor="#F59E0B"
                iconBgColor="#FFFBEB"
                value={dashboard.activeVisitors}
                style={styles.statCard}
                onPress={() => navigation.navigate('LiveVisitors')}
              />
              <AppCard
                title="Today's Check-ins"
                icon="checkmark-circle-outline"
                iconColor="#10B981"
                iconBgColor="#ECFDF5"
                value={dashboard.todayVisitors}
                style={styles.statCard}
              />
            </View>
            <View style={styles.statsGrid}>
              <AppCard
                title="Staff Present"
                icon="people-outline"
                iconColor="#3B82F6"
                iconBgColor="#EFF6FF"
                value={dashboard.staffCheckedIn}
                style={styles.statCard}
              />
              <AppCard
                title="Parking Alerts"
                icon="alert-circle-outline"
                iconColor="#DC2626"
                iconBgColor="#FEF2F2"
                value={dashboard.parkingAlerts}
                style={styles.statCard}
              />
            </View>
          </View>
        )}

        {/* Emergency SOS Alarm Buttons */}
        <View style={styles.sosContainer}>
          <Text style={styles.sectionTitle}>Quick SOS Alarm</Text>
          <View style={styles.sosGrid}>
            <TouchableOpacity
              style={[styles.sosButton, { backgroundColor: '#EF4444' }]}
              onPress={() => handleTriggerSOS('Fire')}
              disabled={triggeringSOS}
            >
              <Ionicons name="flame" size={28} color="#FFFFFF" />
              <Text style={styles.sosText}>Fire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sosButton, { backgroundColor: '#F59E0B' }]}
              onPress={() => handleTriggerSOS('Theft')}
              disabled={triggeringSOS}
            >
              <Ionicons name="shield-half" size={28} color="#FFFFFF" />
              <Text style={styles.sosText}>Theft</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sosButton, { backgroundColor: '#3B82F6' }]}
              onPress={() => handleTriggerSOS('Medical')}
              disabled={triggeringSOS}
            >
              <Ionicons name="medical" size={28} color="#FFFFFF" />
              <Text style={styles.sosText}>Medical</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sosButton, { backgroundColor: '#6B7280' }]}
              onPress={() => handleTriggerSOS('Other')}
              disabled={triggeringSOS}
            >
              <Ionicons name="warning" size={28} color="#FFFFFF" />
              <Text style={styles.sosText}>Other</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
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
  societyName: {
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
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
  },
  sosContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  sosButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
