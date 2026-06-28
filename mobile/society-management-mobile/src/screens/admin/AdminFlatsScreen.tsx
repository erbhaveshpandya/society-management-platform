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
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { flatService } from '../../services/flatService';
import { FlatDto } from '../../types/common.types';

export const AdminFlatsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [flats, setFlats] = useState<FlatDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({});

  const fetchFlats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await flatService.getAllFlats();
      setFlats(data);

      // Auto expand all buildings by default
      const buildings: Record<string, boolean> = {};
      data.forEach((flat) => {
        const bName = flat.buildingName || 'Unassigned';
        buildings[bName] = true;
      });
      setExpandedBuildings(buildings);
    } catch (err) {
      console.error('Failed to fetch flats:', err);
      Alert.alert('Error', 'Failed to load flats directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFlats();
    }, [])
  );

  const toggleBuilding = (bName: string) => {
    setExpandedBuildings((prev) => ({
      ...prev,
      [bName]: !prev[bName],
    }));
  };

  // Group flats by building name
  const groupedFlats = flats.reduce((acc: Record<string, FlatDto[]>, flat: FlatDto) => {
    const bName = flat.buildingName || 'Unassigned';
    if (!acc[bName]) acc[bName] = [];
    acc[bName].push(flat);
    return acc;
  }, {} as Record<string, FlatDto[]>);

  if (loading) return <LoadingState message="Loading flats directory..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Flats & Residents"
        subtitle="Manage flat registry & occupancy"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchFlats(true)} colors={['#4F46E5']} />
        }
      >
        {Object.keys(groupedFlats).length === 0 ? (
          <EmptyState
            title="No Flats Registered"
            message="No blocks or flats have been onboarded in the database yet."
            icon="business-outline"
          />
        ) : (
          Object.entries(groupedFlats).map(([buildingName, buildingFlats]) => {
            const isExpanded = expandedBuildings[buildingName];
            const occupiedCount = buildingFlats.filter(f => f.isOccupied).length;

            return (
              <View key={buildingName} style={styles.buildingGroup}>
                <TouchableOpacity
                  style={styles.buildingHeader}
                  onPress={() => toggleBuilding(buildingName)}
                  activeOpacity={0.7}
                >
                  <View style={styles.buildingHeaderLeft}>
                    <View style={styles.buildingIconContainer}>
                      <Ionicons name="business" size={18} color="#4F46E5" />
                    </View>
                    <View>
                      <Text style={styles.buildingName}>{buildingName}</Text>
                      <Text style={styles.buildingStats}>
                        {occupiedCount} / {buildingFlats.length} Occupied
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.flatsList}>
                    {buildingFlats.map((flat) => (
                      <AppCard key={flat.id} style={styles.flatCard}>
                        <View style={styles.flatRow}>
                          <View style={styles.flatInfo}>
                            <View style={styles.flatBadgeRow}>
                              <Text style={styles.flatNumber}>{flat.flatNumber}</Text>
                              <View style={styles.typeBadge}>
                                <Text style={styles.typeText}>{flat.type || 'N/A'}</Text>
                              </View>
                            </View>

                            {flat.isOccupied ? (
                              <View style={styles.ownerRow}>
                                <Ionicons name="person" size={12} color="#64748B" style={styles.ownerIcon} />
                                <Text style={styles.ownerName} numberOfLines={1}>
                                  {flat.ownerName || 'Resident'}
                                </Text>
                              </View>
                            ) : (
                              <Text style={styles.vacantLabel}>Vacant / Unoccupied</Text>
                            )}
                          </View>

                          <View style={[
                            styles.occupancyStatus,
                            flat.isOccupied ? styles.statusOccupied : styles.statusVacant
                          ]}>
                            <Text style={[
                              styles.statusText,
                              flat.isOccupied ? styles.statusTextOccupied : styles.statusTextVacant
                            ]}>
                              {flat.isOccupied ? 'Occupied' : 'Vacant'}
                            </Text>
                          </View>
                        </View>
                      </AppCard>
                    ))}
                  </View>
                )}
              </View>
            );
          })
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
  buildingGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  buildingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  buildingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buildingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  buildingStats: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  flatsList: {
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  flatCard: {
    padding: 12,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  flatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flatInfo: {
    flex: 1,
    paddingRight: 8,
  },
  flatBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flatNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ownerIcon: {
    marginRight: 4,
  },
  ownerName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  vacantLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 6,
  },
  occupancyStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOccupied: {
    backgroundColor: '#D1FAE5',
  },
  statusVacant: {
    backgroundColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextOccupied: {
    color: '#065F46',
  },
  statusTextVacant: {
    color: '#64748B',
  },
});
