import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { ScreenHeader } from '../../components/ScreenHeader';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { visitorService } from '../../services/visitorService';
import { VisitorLog } from '../../types/visitor.types';
import { formatTime } from '../../utils/dateUtils';

export const LiveVisitorsScreen: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutId, setCheckoutId] = useState<number | null>(null);

  const fetchVisitors = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await visitorService.getVisitors(true); // activeOnly = true
      setVisitors(data);
      setFilteredVisitors(data);
      setSearchQuery('');
    } catch (err) {
      console.error('Failed to load active visitors:', err);
      Alert.alert('Error', 'Failed to fetch active visitors logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVisitors();
    }, [])
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredVisitors(visitors);
      return;
    }
    const filtered = visitors.filter(v =>
      v.visitorName.toLowerCase().includes(query.toLowerCase()) ||
      v.flatNumber.toLowerCase().includes(query.toLowerCase()) ||
      (v.phone || '').includes(query) ||
      (v.vehicleNumber || '').toLowerCase().includes(query.toLowerCase())
    );
    setFilteredVisitors(filtered);
  };

  const handleCheckout = (visitor: VisitorLog) => {
    Alert.alert(
      'Checkout Visitor',
      `Are you sure visitor ${visitor.visitorName} is exiting the gate?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Checkout',
          onPress: async () => {
            setCheckoutId(visitor.id);
            try {
              await visitorService.checkoutVisitor(visitor.id);
              Alert.alert('Success', `Visitor ${visitor.visitorName} checked out successfully.`);
              fetchVisitors();
            } catch (err) {
              console.error('Checkout error:', err);
              Alert.alert('Error', 'Failed to checkout visitor.');
            } finally {
              setCheckoutId(null);
            }
          },
        },
      ]
    );
  };

  const renderVisitorItem = ({ item }: { item: VisitorLog }) => {
    const isCheckingOut = checkoutId === item.id;
    return (
      <AppCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.visitorMeta}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.visitorName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.visitorName}>{item.visitorName}</Text>
              <Text style={styles.visitorPhone}>
                <Ionicons name="call-outline" size={12} color="#64748B" /> {item.phone}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, isCheckingOut ? styles.disabledBtn : null]}
            onPress={() => handleCheckout(item)}
            disabled={isCheckingOut}
          >
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Visiting Flat</Text>
            <Text style={styles.detailValue}>Flat {item.flatNumber}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vehicle No.</Text>
            <Text style={styles.detailValue}>{item.vehicleNumber || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Check-In Time</Text>
            <Text style={styles.detailValue}>{formatTime(item.entryTime)}</Text>
          </View>
        </View>

        {item.purpose && (
          <View style={styles.purposeContainer}>
            <Text style={styles.detailLabel}>Purpose</Text>
            <Text style={styles.purposeText} numberOfLines={1}>
              {item.purpose}
            </Text>
          </View>
        )}
      </AppCard>
    );
  };

  if (loading) return <LoadingState message="Loading active visitors..." />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader title="Live Inside Society" />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <AppInput
            placeholder="Search visitor, flat, vehicle, phone..."
            icon="search-outline"
            value={searchQuery}
            onChangeText={handleSearch}
            containerStyle={styles.searchBar}
          />
        </View>

        <FlatList
          data={filteredVisitors}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVisitorItem}
          contentContainerStyle={filteredVisitors.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchVisitors(true)}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="walk-outline"
              title="No Active Visitors"
              message="There are currently no active visitors logged inside the society."
            />
          }
        />
      </View>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBar: {
    marginBottom: 0,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  visitorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  visitorPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
  purposeContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  purposeText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
});
