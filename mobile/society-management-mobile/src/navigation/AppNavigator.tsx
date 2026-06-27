import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, ActivityIndicator, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useAuth } from '../contexts/AuthContext';
import { AuthStack } from './AuthStack';
import { ResidentStack } from './ResidentStack';
import { SecurityStack } from './SecurityStack';
import { AdminStack } from './AdminStack';
import { LoadingState } from '../components/LoadingState';
import { EmergencyAlert } from '../types/common.types';
import axiosClient from '../api/axiosClient';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { token, user, isLoading } = useAuth();
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [residentEmergency, setResidentEmergency] = useState<EmergencyAlert | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<number[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Background polling for emergencies
  useEffect(() => {
    if (!token || !user) {
      setActiveAlert(null);
      setResidentEmergency(null);
      return;
    }

    const checkEmergencies = async () => {
      try {
        const res = await axiosClient.get<EmergencyAlert[]>('emergency-alerts');
        const unresolved = res.data.find((alert) => !alert.isResolved);

        if (unresolved) {
          // If guard or admin, show overlay if they haven't acknowledged it locally yet
          if (
            (user.role === 'SecurityGuard' || user.role === 'SocietyAdmin') &&
            !acknowledgedIds.includes(unresolved.id)
          ) {
            setActiveAlert(unresolved);
          } else {
            setActiveAlert(null);
          }
          // For residents, set the active alert so we can show the banner
          if (user.role === 'Resident') {
            setResidentEmergency(unresolved);
          } else {
            setResidentEmergency(null);
          }
        } else {
          setActiveAlert(null);
          setResidentEmergency(null);
        }
      } catch (err) {
        console.error('Failed to poll emergency alerts in mobile:', err);
      }
    };

    checkEmergencies();
    const interval = setInterval(checkEmergencies, 8000); // Poll every 8 seconds

    return () => clearInterval(interval);
  }, [token, user, acknowledgedIds]);

  // Handle playing and stopping siren sound
  const playSiren = async () => {
    try {
      // Set audio options for playback on device speaker
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav' }, // Warning siren buzzer sfx
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        soundRef.current = sound;
      } else {
        await soundRef.current.playAsync();
      }
    } catch (err) {
      console.warn('Failed to play mobile siren:', err);
    }
  };

  const stopSiren = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (err) {
      console.warn('Failed to stop mobile siren:', err);
    }
  };

  // Trigger siren audio and vibration feedback
  useEffect(() => {
    const hasEmergency = activeAlert !== null || residentEmergency !== null;
    
    if (hasEmergency) {
      // Vibrate continuously: [wait 500ms, vibrate 500ms]
      Vibration.vibrate([500, 500], true);
      playSiren();
    } else {
      Vibration.cancel();
      stopSiren();
    }

    return () => {
      Vibration.cancel();
      stopSiren();
    };
  }, [activeAlert, residentEmergency]);

  const handleAcknowledge = async () => {
    if (activeAlert) {
      setIsResolving(true);
      try {
        await axiosClient.post(`emergency-alerts/${activeAlert.id}/resolve`);
        setAcknowledgedIds([...acknowledgedIds, activeAlert.id]);
        setActiveAlert(null);
        Alert.alert('SOS Resolved', 'Emergency alert has been resolved successfully.');
      } catch (err) {
        console.error('Failed to resolve SOS in mobile:', err);
        Alert.alert('Error', 'Failed to resolve emergency distress signal.');
      } finally {
        setIsResolving(false);
      }
    }
  };

  if (isLoading) {
    return <LoadingState message="Restoring session..." fullScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token === null || user === null ? (
            <Stack.Screen name="Auth" component={AuthStack} />
          ) : (
            <>
              {user.role === 'Resident' && (
                <Stack.Screen name="Resident" component={ResidentStack} />
              )}
              {user.role === 'SecurityGuard' && (
                <Stack.Screen name="Security" component={SecurityStack} />
              )}
              {(user.role === 'SuperAdmin' || user.role === 'SocietyAdmin') && (
                <Stack.Screen name="Admin" component={AdminStack} />
              )}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Flashing Resident Emergency Banner */}
      {residentEmergency && (
        <SafeAreaView style={styles.residentEmergencyBanner} edges={['top']}>
          <View style={styles.bannerContent}>
            <Ionicons name="warning" size={20} color="#FFFFFF" />
            <Text style={styles.bannerText}>
              ACTIVE SOS: {residentEmergency.type.toUpperCase()} alert reported by {residentEmergency.reportedByName}
              {residentEmergency.flatNumber ? ` (Flat ${residentEmergency.flatNumber})` : ''} - "{residentEmergency.description}"
            </Text>
          </View>
        </SafeAreaView>
      )}

      {/* Global SOS Full-screen Overlay for Guards / Admins */}
      <Modal
        visible={activeAlert !== null}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.sosOverlayContainer}>
          <View style={styles.sosAlertBox}>
            <View style={styles.sosAlertHeader}>
              <Ionicons name="alert-circle" size={88} color="#DC2626" />
              <Text style={styles.sosOverlayTitle}>🚨 EMERGENCY SOS SIGNAL 🚨</Text>
              <Text style={styles.sosOverlaySubtitle}>ACTIVE DISTRESS ALERT RECORDED IN THE SOCIETY</Text>
            </View>

            {activeAlert && (
              <View style={styles.sosDetailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reported By</Text>
                  <Text style={styles.detailText}>{activeAlert.reportedByName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User Role</Text>
                  <Text style={styles.roleBadge}>
                    {activeAlert.reportedByRole === 'SocietyAdmin' ? 'Society Admin' : 
                     activeAlert.reportedByRole === 'SecurityGuard' ? 'Security Guard' : 
                     activeAlert.reportedByRole === 'SuperAdmin' ? 'System Super Admin' : 'Resident'}
                  </Text>
                </View>
                {(activeAlert.buildingName || activeAlert.flatNumber) && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Flat / Location</Text>
                    <Text style={styles.locationText}>{activeAlert.buildingName} - Flat {activeAlert.flatNumber}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Alert Category</Text>
                  <Text style={styles.categoryText}>{activeAlert.type.toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.descriptionText}>{activeAlert.description}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.acknowledgeBtn, isResolving ? styles.disabledBtn : null]}
              onPress={handleAcknowledge}
              disabled={isResolving}
            >
              {isResolving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.acknowledgeBtnText}>ACKNOWLEDGE & MUTE ALARM</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  residentEmergencyBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#DC2626',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    lineHeight: 16,
  },
  sosOverlayContainer: {
    flex: 1,
    backgroundColor: '#7F1D1D', // Dark crimson background
  },
  sosAlertBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  sosAlertHeader: {
    alignItems: 'center',
    gap: 12,
  },
  sosOverlayTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sosOverlaySubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCA5A5',
    textAlign: 'center',
  },
  sosDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    padding: 20,
    gap: 14,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  acknowledgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    gap: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  acknowledgeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
