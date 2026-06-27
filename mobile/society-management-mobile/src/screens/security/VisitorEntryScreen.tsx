import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { visitorService } from '../../services/visitorService';
import { Flat } from '../../types/visitor.types';

export const VisitorEntryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);

  const [flats, setFlats] = useState<Flat[]>([]);
  const [filteredFlats, setFilteredFlats] = useState<Flat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [flatPickerVisible, setFlatPickerVisible] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFlats();
  }, []);

  const fetchFlats = async () => {
    setLoading(true);
    try {
      const data = await visitorService.getFlats();
      // Sort flats by building name and flat number
      const sorted = data.sort((a, b) => {
        const buildComp = (a.buildingName || '').localeCompare(b.buildingName || '');
        if (buildComp !== 0) return buildComp;
        return a.flatNumber.localeCompare(b.flatNumber);
      });
      setFlats(sorted);
      setFilteredFlats(sorted);
    } catch (err) {
      console.error('Failed to load flats:', err);
      Alert.alert('Error', 'Failed to load society flats list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFlat = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredFlats(flats);
      return;
    }
    const filtered = flats.filter(f => 
      f.flatNumber.toLowerCase().includes(query.toLowerCase()) ||
      (f.buildingName || '').toLowerCase().includes(query.toLowerCase())
    );
    setFilteredFlats(filtered);
  };

  const handleSelectFlat = (flat: Flat) => {
    setSelectedFlat(flat);
    setFlatPickerVisible(false);
    setSearchQuery('');
    setFilteredFlats(flats);
  };

  const handleSubmit = async () => {
    if (!visitorName.trim()) {
      Alert.alert('Validation Error', 'Visitor name is required');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return;
    }
    if (!selectedFlat) {
      Alert.alert('Validation Error', 'Please select a flat to visit');
      return;
    }
    if (!purpose.trim()) {
      Alert.alert('Validation Error', 'Purpose of visit is required');
      return;
    }

    setSubmitting(true);
    try {
      await visitorService.createVisitor({
        visitorName: visitorName.trim(),
        phone: phone.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        flatId: selectedFlat.id,
        purpose: purpose.trim(),
      });

      Alert.alert('Checked In', `Visitor ${visitorName} checked in successfully. Owner notified.`);
      // Reset form
      setVisitorName('');
      setPhone('');
      setVehicleNumber('');
      setPurpose('');
      setSelectedFlat(null);
      
      // Navigate to active visitors list
      navigation.navigate('LiveVisitors' as never);
    } catch (err) {
      console.error('Create visitor checkin error:', err);
      Alert.alert('Error', 'Failed to perform visitor check-in. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader title="New Visitor Check-In" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <AppInput
              label="Visitor Name"
              placeholder="Full name of visitor"
              icon="person-outline"
              value={visitorName}
              onChangeText={setVisitorName}
            />

            <AppInput
              label="Phone Number"
              placeholder="10-digit mobile number"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
            />

            <AppInput
              label="Vehicle Number"
              placeholder="e.g. MH12AB1234 (Optional)"
              icon="car-outline"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
            />

            {/* Flat Selection Trigger */}
            <Text style={styles.fieldLabel}>Flat to Visit</Text>
            <TouchableOpacity
              style={[styles.pickerTrigger, selectedFlat ? styles.pickerTriggerSelected : null]}
              onPress={() => setFlatPickerVisible(true)}
            >
              <View style={styles.pickerLeft}>
                <Ionicons 
                  name="home-outline" 
                  size={20} 
                  color={selectedFlat ? '#4F46E5' : '#94A3B8'} 
                  style={styles.pickerIcon}
                />
                <Text style={[styles.pickerText, selectedFlat ? styles.pickerTextSelected : null]}>
                  {selectedFlat 
                    ? `${selectedFlat.buildingName || 'Building'} - Flat ${selectedFlat.flatNumber}`
                    : 'Select target flat'
                  }
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <AppInput
              label="Purpose of Visit"
              placeholder="e.g. Delivery, Guest, Maintenance"
              icon="help-circle-outline"
              value={purpose}
              onChangeText={setPurpose}
            />

            <AppButton
              title="Submit Check-In"
              onPress={handleSubmit}
              loading={submitting}
              disabled={loading}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Flat Picker Modal */}
      <Modal
        visible={flatPickerVisible}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={() => setFlatPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Flat</Text>
              <TouchableOpacity onPress={() => setFlatPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBoxContainer}>
              <AppInput
                placeholder="Search flat number or building..."
                icon="search-outline"
                value={searchQuery}
                onChangeText={handleSearchFlat}
                containerStyle={styles.searchBar}
              />
            </View>

            {loading ? (
              <View style={styles.loader}>
                <Text style={styles.loadingText}>Fetching flats...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredFlats}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.flatItem}
                    onPress={() => handleSelectFlat(item)}
                  >
                    <View style={styles.flatItemLeft}>
                      <Ionicons name="business-outline" size={18} color="#4F46E5" />
                      <Text style={styles.flatItemBuilding}>{item.buildingName || 'Building'}</Text>
                    </View>
                    <View style={styles.flatItemRight}>
                      <Text style={styles.flatItemNumber}>Flat {item.flatNumber}</Text>
                      {item.ownerName && (
                        <Text style={styles.flatOwnerName} numberOfLines={1}>
                          ({item.ownerName})
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.flatListContent}
                ListEmptyComponent={
                  <View style={styles.emptySearch}>
                    <Text style={styles.emptySearchText}>No matching flats found</Text>
                  </View>
                }
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  pickerTriggerSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
  },
  pickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerIcon: {
    marginRight: 8,
  },
  pickerText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  pickerTextSelected: {
    color: '#1E293B',
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 12,
  },
  
  // Modal Picker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  searchBoxContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    marginBottom: 0,
  },
  loader: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
  },
  flatListContent: {
    padding: 16,
  },
  flatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  flatItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flatItemBuilding: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  flatItemRight: {
    alignItems: 'flex-end',
  },
  flatItemNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  flatOwnerName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 120,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  emptySearch: {
    padding: 32,
    alignItems: 'center',
  },
  emptySearchText: {
    color: '#94A3B8',
  },
});
