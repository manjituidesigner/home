import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';

const API_BASE_URL = 'https://home-backend-zc1d.onrender.com';

const PROPERTY_CATEGORIES = [
  { id: 'flat', label: 'Flat / Apartment', icon: 'home-outline' },
  { id: 'house', label: 'Independent House', icon: 'business-outline' },
  { id: 'pg', label: 'PG / Hostel', icon: 'bed-outline' },
  { id: 'commercial', label: 'Commercial', icon: 'briefcase-outline' },
];

const LISTING_TYPES = [
  { id: 'rent', label: 'For Rent' },
  { id: 'sell', label: 'For Sell' },
  { id: 'pg', label: 'For PG' },
];

const BHK_OPTIONS = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK'];

const FURNISHING_OPTIONS = [
  { id: 'semi', label: 'Semi Furnished' },
  { id: 'full', label: 'Fully Furnished' },
  { id: 'unfurnished', label: 'Unfurnished' },
];

const FLOOR_OPTIONS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
];

const AMENITIES = [
  'Fan',
  'Cooler',
  'AC',
  'Refrigerator',
  'Gas',
  'WiFi',
  'Kitchen',
  'Washing Machine',
];

const LIFESTYLE_RULES = [
  { id: 'drinksPolicy', label: 'Drinks' },
  { id: 'smokingPolicy', label: 'Smoking' },
  { id: 'lateNightPolicy', label: 'Late night coming' },
];

const RULE_OPTIONS = [
  { id: 'not_allowed', label: 'Not Allowed' },
  { id: 'allowed', label: 'Allowed' },
  { id: 'conditional', label: 'With Conditions' },
];

const PARKING_TYPES = [
  { id: 'none', label: 'No Parking' },
  { id: 'bike', label: 'Bike Only' },
  { id: 'car', label: 'Car Only' },
  { id: 'both', label: 'Bike & Car' },
];

const TENANT_TYPES = [
  'Married',
  'Unmarried',
  'Working Boys',
  'Student Boys',
  'Working Girls',
  'Student Girls',
  'Small Family',
  'Full Family',
];

function createEmptyRoom() {
  return {
    roomName: '',
    roomSize: '',
    roomCount: '1',
    roomBhk: '1BHK',
    roomFloor: '',
    roomRent: '',
  };
}

function createEmptyProperty() {
  return {
    propertyName: '',
    // start with no pre-selected chips; user will choose
    category: '',
    listingType: '',
    bhk: '',
    furnishing: '',
    rentRoomScope: '', // one room or all rooms
    floor: '',
    customFloor: '',
    // Section 2
    rentAmount: '',
    advanceAmount: '',
    waterCharges: '',
    electricityPerUnit: '',
    cleaningCharges: '',
    foodCharges: '',
    yearlyMaintenance: '',
    yearlyIncreasePercent: '',
    bookingAdvance: '',
    bookingValidityDays: '',
    amenities: [],
    mode: '', // full | room
    rooms: [createEmptyRoom()],
    // Tenant rules & preferences
    drinksPolicy: 'not_allowed',
    smokingPolicy: 'not_allowed',
    lateNightPolicy: 'not_allowed',
    visitorsAllowed: 'no', // yes / no
    visitorsMaxDays: '',
    noticePeriodDays: '',
    parkingType: 'none',
    parkingBikeCount: '',
    parkingCarCount: '',
    preferredTenantTypes: [],
    lateNightMode: 'anytime', // anytime | till_time
    lateNightLastTime: '',
    status: 'available',
  };
}

function OptionCard({ label, selected, onPress, icon, compact = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.optionCard,
        compact && styles.optionCardCompact,
        selected && styles.optionCardSelected,
      ]}
    >
      <View style={styles.optionLeft}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={selected ? '#fff' : theme.colors.primary}
            style={styles.optionIcon}
          />
        ) : null}
        <Text
          style={[
            styles.optionLabel,
            selected && styles.optionLabelSelected,
          ]}
        >
          {label}
        </Text>
      </View>
      <View
        style={[
          styles.radioOuter,
          selected && styles.radioOuterSelected,
        ]}
      >
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          selected && styles.chipLabelSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PropertyScreen({ navigation }) {
  const [properties, setProperties] = useState([createEmptyProperty()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'list'
  const [currentStep, setCurrentStep] = useState(1); // 1..4 for add flow
  const [propertyList, setPropertyList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openMenuForId, setOpenMenuForId] = useState(null);

  const activeProperty = properties[activeIndex];

  const updateActiveProperty = (patch) => {
    setProperties((prev) => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], ...patch };
      return next;
    });
  };

  const togglePropertyStatus = async (item, currentStatus) => {
    if (!item?._id) return;
    const effectiveStatus = currentStatus || item.status || 'available';
    const nextStatus = effectiveStatus === 'available' ? 'occupied' : 'available';
    try {
      const response = await fetch(`${API_BASE_URL}/api/properties/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        return;
      }
      const updated = await response.json();
      setPropertyList((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p)),
      );
    } catch (e) {
      // ignore update errors for now
    }
  };

  const toggleAmenity = (name) => {
    const current = activeProperty.amenities || [];
    const exists = current.includes(name);
    const next = exists
      ? current.filter((a) => a !== name)
      : [...current, name];
    updateActiveProperty({ amenities: next });
  };

  const updateRoom = (roomIndex, patch) => {
    setProperties((prev) => {
      const next = [...prev];
      const current = next[activeIndex] || {};
      const rooms = current.rooms ? [...current.rooms] : [];
      rooms[roomIndex] = { ...rooms[roomIndex], ...patch };
      next[activeIndex] = { ...current, rooms };
      return next;
    });
  };

  const addRoom = () => {
    setProperties((prev) => {
      const next = [...prev];
      const current = next[activeIndex] || {};
      const rooms = current.rooms ? [...current.rooms] : [];
      rooms.push(createEmptyRoom());
      next[activeIndex] = { ...current, rooms };
      return next;
    });
  };

  const toggleTenantType = (name) => {
    const current = activeProperty.preferredTenantTypes || [];
    const exists = current.includes(name);
    const next = exists
      ? current.filter((t) => t !== name)
      : [...current, name];
    updateActiveProperty({ preferredTenantTypes: next });
  };

  const buildTenantSummary = () => {
    const parts = [];

    if (activeProperty.preferredTenantTypes?.length) {
      parts.push(
        `Preferred: ${activeProperty.preferredTenantTypes.join(', ')}`,
      );
    }

    const behaviourBits = [];
    if (activeProperty.drinksPolicy === 'not_allowed') behaviourBits.push('no drinks');
    if (activeProperty.smokingPolicy === 'not_allowed') behaviourBits.push('no smoking');

    if (activeProperty.lateNightPolicy === 'not_allowed') {
      behaviourBits.push('no late night coming');
    } else if (activeProperty.lateNightPolicy === 'allowed') {
      if (activeProperty.lateNightMode === 'till_time' && activeProperty.lateNightLastTime) {
        behaviourBits.push(`late night allowed till ${activeProperty.lateNightLastTime}`);
      } else {
        behaviourBits.push('late night allowed');
      }
    } else if (activeProperty.lateNightPolicy === 'conditional') {
      behaviourBits.push('late night with conditions');
    }
    if (behaviourBits.length) {
      parts.push(behaviourBits.join(', '));
    }

    if (activeProperty.parkingType && activeProperty.parkingType !== 'none') {
      parts.push('parking available');
    }

    if (!parts.length) return 'Set rules and preferences for ideal tenants.';
    return parts.join(' · ');
  };

  const buildTenantSummaryFor = (property) => {
    const parts = [];

    if (property.preferredTenantTypes?.length) {
      parts.push(`Preferred: ${property.preferredTenantTypes.join(', ')}`);
    }

    const behaviourBits = [];
    if (property.drinksPolicy === 'not_allowed') behaviourBits.push('no drinks');
    if (property.smokingPolicy === 'not_allowed') behaviourBits.push('no smoking');

    if (property.lateNightPolicy === 'not_allowed') {
      behaviourBits.push('no late night coming');
    } else if (property.lateNightPolicy === 'allowed') {
      if (property.lateNightMode === 'till_time' && property.lateNightLastTime) {
        behaviourBits.push(`late night allowed till ${property.lateNightLastTime}`);
      } else {
        behaviourBits.push('late night allowed');
      }
    } else if (property.lateNightPolicy === 'conditional') {
      behaviourBits.push('late night with conditions');
    }

    if (behaviourBits.length) {
      parts.push(behaviourBits.join(', '));
    }

    if (property.parkingType && property.parkingType !== 'none') {
      parts.push('parking available');
    }

    if (!parts.length) return '';
    return parts.join(' · ');
  };

  const fetchPropertyList = async () => {
    try {
      setLoadingList(true);
      const response = await fetch(`${API_BASE_URL}/api/properties`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setPropertyList(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore list load errors for now
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPropertyList();
  }, []);

  const handleSaveProperty = async () => {
    console.log('handleSaveProperty called with', activeProperty);
    if (!activeProperty.propertyName) {
      Alert.alert('Validation', 'Please enter a property name.');
      return;
    }

    try {
      setSaving(true);
      const isEditing = !!activeProperty._id || !!editingPropertyId;
      const targetId = activeProperty._id || editingPropertyId;
      const url = isEditing
        ? `${API_BASE_URL}/api/properties/${targetId}`
        : `${API_BASE_URL}/api/properties`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activeProperty),
      });

      if (!response.ok) {
        let message = 'Failed to save property.';
        try {
          const errorBody = await response.json();
          if (errorBody && errorBody.message) {
            message = errorBody.message;
          }
        } catch (e) {}
        Alert.alert('Error', message);
        return;
      }

      const saved = await response.json();
      Alert.alert('Success', isEditing ? 'Property updated successfully.' : 'Property saved successfully.');
      setEditingPropertyId(null);
      if (saved && saved._id) {
        // ensure local form has latest copy including id
        setProperties([{
          ...createEmptyProperty(),
          ...saved,
        }]);
      }
      fetchPropertyList();
      setActiveTab('list');
    } catch (error) {
      Alert.alert('Error', 'Unable to save property. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMoreProperty = () => {
    setProperties((prev) => [...prev, createEmptyProperty()]);
    setActiveIndex(properties.length); // new last index
  };

  const showAddMore = properties.length >= 1;

  const rooms = activeProperty.rooms || [];

  const startEditProperty = (item) => {
    if (!item || !item._id) return;
    const merged = {
      ...createEmptyProperty(),
      ...item,
      rooms: item.rooms && item.rooms.length ? item.rooms : [createEmptyRoom()],
    };
    setProperties([merged]);
    setActiveIndex(0);
    setEditingPropertyId(item._id);
    setActiveTab('add');
  };

  const confirmDeleteProperty = (item) => {
    if (!item || !item._id) return;
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !deleteTarget._id) {
      setShowDeleteModal(false);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/properties/${deleteTarget._id}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        setShowDeleteModal(false);
        return;
      }
      setPropertyList(prev => prev.filter(p => p._id !== deleteTarget._id));
      fetchPropertyList();
    } catch (e) {
      // ignore delete errors for now
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleShareProperty = async (item) => {
    if (!item) return;
    try {
      const lines = [];
      lines.push(`Property: ${item.propertyName || 'Untitled Property'}`);
      lines.push(`Category: ${item.category}`);
      lines.push(`Listing Type: ${item.listingType}`);
      lines.push(`Configuration: ${item.bhk}`);
      lines.push(`Furnishing: ${item.furnishing}`);
      if (item.rentAmount) lines.push(`Rent: ${item.rentAmount}`);
      if (item.advanceAmount) lines.push(`Advance: ${item.advanceAmount}`);
      if (item.waterCharges) lines.push(`Water Charges: ${item.waterCharges}`);
      if (item.electricityPerUnit) lines.push(`Electricity / Unit: ${item.electricityPerUnit}`);
      if (item.cleaningCharges) lines.push(`Cleaning Charges: ${item.cleaningCharges}`);
      if (item.foodCharges) lines.push(`Food Charges: ${item.foodCharges}`);
      if (item.floor || item.customFloor) lines.push(`Floor: ${item.floor || item.customFloor}`);
      if (Array.isArray(item.amenities) && item.amenities.length) {
        lines.push(`Amenities: ${item.amenities.join(', ')}`);
      }

      const message = lines.join('\n');
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Share', 'WhatsApp is not installed on this device.');
      }
    } catch (e) {
      Alert.alert('Share', 'Unable to open WhatsApp.');
    }
  };

  return (
    <ScreenLayout
      title="Property"
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setActiveTab('list')}
          style={[styles.tab, activeTab === 'list' && styles.tabActive]}
        >
          <Text
            style={[styles.tabLabel, activeTab === 'list' && styles.tabLabelActive]}
          >
            My Property
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('add')}
          style={[styles.tab, activeTab === 'add' && styles.tabActive]}
        >
          <Text
            style={[styles.tabLabel, activeTab === 'add' && styles.tabLabelActive]}
          >
            Add New
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'add' ? (
        <>
          {/* Top step progress */}
          <View style={styles.stepHeader}>
            <View style={styles.stepCirclesRow}>
              {[1, 2, 3, 4].map((step) => {
                const isCompleted = step < currentStep;
                const isActive = step === currentStep;
                const circleStyle = [
                  styles.stepCircle,
                  (isCompleted || isActive) && styles.stepCircleActive,
                ];
                const labelStyle = [
                  styles.stepCircleLabel,
                  (isCompleted || isActive) && styles.stepCircleLabelActive,
                ];
                return (
                  <View key={step} style={styles.stepCircleWrapper}>
                    <View style={circleStyle}>
                      <Text style={labelStyle}>{step}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.stepBarBackground}>
              <View
                style={[
                  styles.stepBarFill,
                  { width: `${(currentStep / 4) * 100}%` },
                ]}
              />
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          {/* Step 1: Basic details */}
          {currentStep === 1 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Property Details</Text>

          <Text style={styles.fieldLabel}>Mode</Text>
          <View style={styles.chipRow}>
            <Chip
              label="Full Property"
              selected={activeProperty.mode === 'full'}
              onPress={() => updateActiveProperty({ mode: 'full' })}
            />
            <Chip
              label="Room-wise"
              selected={activeProperty.mode === 'room'}
              onPress={() => updateActiveProperty({ mode: 'room' })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Property Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter property name"
              placeholderTextColor={theme.colors.textSecondary}
              value={activeProperty.propertyName}
              onChangeText={(text) => updateActiveProperty({ propertyName: text })}
            />
          </View>

          <Text style={styles.fieldLabel}>Property Category</Text>
          <View style={styles.optionsGrid}>
            {PROPERTY_CATEGORIES.map((cat) => (
              <OptionCard
                key={cat.id}
                label={cat.label}
                icon={cat.icon}
                selected={activeProperty.category === cat.id}
                onPress={() => updateActiveProperty({ category: cat.id })}
              />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Listing Type</Text>
          <View style={styles.chipRow}>
            {LISTING_TYPES.map((lt) => (
              <Chip
                key={lt.id}
                label={lt.label}
                selected={activeProperty.listingType === lt.id}
                onPress={() => updateActiveProperty({ listingType: lt.id })}
              />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Configuration</Text>
          {activeProperty.mode === 'full' && (
            <View style={styles.chipRow}>
              {BHK_OPTIONS.map((bhk) => (
                <Chip
                  key={bhk}
                  label={bhk}
                  selected={activeProperty.bhk === bhk}
                  onPress={() => updateActiveProperty({ bhk })}
                />
              ))}
            </View>
          )}

          <Text style={styles.fieldLabel}>Furnishing</Text>
          <View style={styles.chipRow}>
            {FURNISHING_OPTIONS.map((f) => (
              <Chip
                key={f.id}
                label={f.label}
                selected={activeProperty.furnishing === f.id}
                onPress={() => updateActiveProperty({ furnishing: f.id })}
              />
            ))}
          </View>

          {activeProperty.mode === 'full' &&
          (activeProperty.listingType === 'rent' || activeProperty.listingType === 'pg') ? (
            <View style={styles.fieldGroupRow}>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.fieldLabel}>For Rent Room</Text>
                <TextInput
                  style={styles.input}
                  placeholder="One room or all rooms"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={activeProperty.rentRoomScope}
                  onChangeText={(text) =>
                    updateActiveProperty({ rentRoomScope: text })
                  }
                />
              </View>
            </View>
          ) : null}

          {activeProperty.mode === 'full' && (
            <>
              <Text style={styles.fieldLabel}>Floor</Text>
              <View style={styles.chipRow}>
                {FLOOR_OPTIONS.map((floor) => (
                  <Chip
                    key={floor}
                    label={floor}
                    selected={activeProperty.floor === floor}
                    onPress={() => updateActiveProperty({ floor, customFloor: '' })}
                  />
                ))}
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Or enter floor manually</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 7th"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={activeProperty.customFloor}
                  onChangeText={(text) =>
                    updateActiveProperty({ customFloor: text, floor: '' })
                  }
                />
              </View>
            </>
          )}

          {activeProperty.mode === 'room' && (
            <View style={styles.roomSection}>
              <Text style={styles.subSectionTitle}>Room-wise Details</Text>
              {rooms.map((room, index) => (
                <View key={index} style={styles.roomCard}>
                  <Text style={styles.roomTitle}>{`Room ${index + 1}`}</Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Room name / label</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Front Room, Balcony Room"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={room.roomName}
                      onChangeText={(text) =>
                        updateRoom(index, { roomName: text })
                      }
                    />
                  </View>

                  <View style={styles.fieldGroupRow}>
                    <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
                      <Text style={styles.fieldLabel}>Size of room</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 10x12 ft"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={room.roomSize}
                        onChangeText={(text) =>
                          updateRoom(index, { roomSize: text })
                        }
                      />
                    </View>
                    <View style={[styles.fieldGroup, styles.flex1]}>
                      <Text style={styles.fieldLabel}>Number of this room</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="1"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={room.roomCount}
                        onChangeText={(text) =>
                          updateRoom(index, { roomCount: text })
                        }
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Configuration (BHK)</Text>
                  <View style={styles.chipRow}>
                    {BHK_OPTIONS.map((bhk) => (
                      <Chip
                        key={bhk}
                        label={bhk}
                        selected={room.roomBhk === bhk}
                        onPress={() => updateRoom(index, { roomBhk: bhk })}
                      />
                    ))}
                  </View>

                  <View style={styles.fieldGroupRow}>
                    <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
                      <Text style={styles.fieldLabel}>Floor</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 1st, 2nd"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={room.roomFloor}
                        onChangeText={(text) =>
                          updateRoom(index, { roomFloor: text })
                        }
                      />
                    </View>
                    <View style={[styles.fieldGroup, styles.flex1]}>
                      <Text style={styles.fieldLabel}>Room rent</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Rent for this room"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={room.roomRent}
                        onChangeText={(text) =>
                          updateRoom(index, { roomRent: text })
                        }
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addRoomButton}
                onPress={addRoom}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addMoreLabel}>Add More Room</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
          )}

        {/* Step 2: Financial details */}
        {currentStep === 2 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Rent & Charges</Text>

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
              <Text style={styles.fieldLabel}>Rent Amount</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Monthly rent"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.rentAmount}
                onChangeText={(text) =>
                  updateActiveProperty({ rentAmount: text })
                }
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>Advance Rent</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Advance amount"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.advanceAmount}
                onChangeText={(text) =>
                  updateActiveProperty({ advanceAmount: text })
                }
              />
            </View>
          </View>

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
              <Text style={styles.fieldLabel}>Water Charges</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Water bill (if any)"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.waterCharges}
                onChangeText={(text) =>
                  updateActiveProperty({ waterCharges: text })
                }
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>Electricity / Unit</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Electricity per unit"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.electricityPerUnit}
                onChangeText={(text) =>
                  updateActiveProperty({ electricityPerUnit: text })
                }
              />
            </View>
          </View>

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
              <Text style={styles.fieldLabel}>Cleaning Charges</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Cleaning charges"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.cleaningCharges}
                onChangeText={(text) =>
                  updateActiveProperty({ cleaningCharges: text })
                }
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>Food Charges</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Food charges (if applicable)"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.foodCharges}
                onChangeText={(text) =>
                  updateActiveProperty({ foodCharges: text })
                }
              />
            </View>
          </View>

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
              <Text style={styles.fieldLabel}>Yearly Maintenance</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Maintenance charges"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.yearlyMaintenance}
                onChangeText={(text) =>
                  updateActiveProperty({ yearlyMaintenance: text })
                }
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>% Increase after 1 year</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 5%"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.yearlyIncreasePercent}
                onChangeText={(text) =>
                  updateActiveProperty({ yearlyIncreasePercent: text })
                }
              />
            </View>
          </View>

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
              <Text style={styles.fieldLabel}>Advance Booking Charges</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Booking amount"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.bookingAdvance}
                onChangeText={(text) =>
                  updateActiveProperty({ bookingAdvance: text })
                }
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>Booking Validity (days)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Number of days"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.bookingValidityDays}
                onChangeText={(text) =>
                  updateActiveProperty({ bookingValidityDays: text })
                }
              />
            </View>
          </View>
        </View>
        )}

        {/* Step 3: Amenities */}
        {currentStep === 3 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Amenities Provided</Text>
          <View style={styles.chipRowWrap}>
            {AMENITIES.map((a) => (
              <Chip
                key={a}
                label={a}
                selected={activeProperty.amenities?.includes(a)}
                onPress={() => toggleAmenity(a)}
              />
            ))}
          </View>
        </View>
        )}

        {/* Step 4: Tenant rules & preferences */}
        {currentStep === 4 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tenant Rules & Preferences</Text>
          <Text style={styles.summaryText}>{buildTenantSummary()}</Text>

          {/* Lifestyle / behaviour */}
          <Text style={styles.subSectionTitle}>Behaviour Preferences</Text>
          {LIFESTYLE_RULES.map((rule) => (
            <View key={rule.id} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{rule.label}</Text>
              <View style={styles.chipRow}>
                {RULE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.id}
                    label={opt.label}
                    selected={activeProperty[rule.id] === opt.id}
                    onPress={() => updateActiveProperty({ [rule.id]: opt.id })}
                  />
                ))}
              </View>

              {rule.id === 'lateNightPolicy' &&
                activeProperty.lateNightPolicy === 'allowed' && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Late night details</Text>
                    <View style={styles.chipRow}>
                      <Chip
                        label="Any time"
                        selected={activeProperty.lateNightMode === 'anytime'}
                        onPress={() =>
                          updateActiveProperty({ lateNightMode: 'anytime', lateNightLastTime: '' })
                        }
                      />
                      <Chip
                        label="Till specific time"
                        selected={activeProperty.lateNightMode === 'till_time'}
                        onPress={() =>
                          updateActiveProperty({ lateNightMode: 'till_time' })
                        }
                      />
                    </View>

                    {activeProperty.lateNightMode === 'till_time' && (
                      <TextInput
                        style={styles.input}
                        placeholder="Last time to come home (e.g. 11:30 PM)"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={activeProperty.lateNightLastTime}
                        onChangeText={(text) =>
                          updateActiveProperty({ lateNightLastTime: text })
                        }
                      />
                    )}
                  </View>
                )}
            </View>
          ))}

          {/* Visitors & notice period */}
          <Text style={styles.subSectionTitle}>Visitors & Stay Rules</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Relatives or Friends Allowed</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Allowed"
                selected={activeProperty.visitorsAllowed === 'yes'}
                onPress={() => updateActiveProperty({ visitorsAllowed: 'yes' })}
              />
              <Chip
                label="Not Allowed"
                selected={activeProperty.visitorsAllowed === 'no'}
                onPress={() => updateActiveProperty({ visitorsAllowed: 'no' })}
              />
            </View>
          </View>

          {activeProperty.visitorsAllowed === 'yes' && (
            <View style={styles.fieldGroupRow}>
              <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
                <Text style={styles.fieldLabel}>Max visitor days (per month)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 5"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={activeProperty.visitorsMaxDays}
                  onChangeText={(text) =>
                    updateActiveProperty({ visitorsMaxDays: text })
                  }
                />
              </View>
            </View>
          )}

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>Notice time to leave home (days)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Notice period in days"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.noticePeriodDays}
                onChangeText={(text) =>
                  updateActiveProperty({ noticePeriodDays: text })
                }
              />
            </View>
          </View>

          {/* Parking rules */}
          <Text style={styles.subSectionTitle}>Parking Rules</Text>
          <View style={styles.chipRow}>
            {PARKING_TYPES.map((p) => (
              <Chip
                key={p.id}
                label={p.label}
                selected={activeProperty.parkingType === p.id}
                onPress={() => updateActiveProperty({ parkingType: p.id })}
              />
            ))}
          </View>

          {activeProperty.parkingType !== 'none' && (
            <View style={styles.fieldGroupRow}>
              <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
                <Text style={styles.fieldLabel}>No. of bikes</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={activeProperty.parkingBikeCount}
                  onChangeText={(text) =>
                    updateActiveProperty({ parkingBikeCount: text })
                  }
                />
              </View>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.fieldLabel}>No. of cars</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={activeProperty.parkingCarCount}
                  onChangeText={(text) =>
                    updateActiveProperty({ parkingCarCount: text })
                  }
                />
              </View>
            </View>
          )}

          {/* Preferred tenant type */}
          <Text style={styles.subSectionTitle}>Preferred Tenant Type</Text>
          <View style={styles.chipRowWrap}>
            {TENANT_TYPES.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={activeProperty.preferredTenantTypes?.includes(t)}
                onPress={() => toggleTenantType(t)}
              />
            ))}
          </View>
        </View>
        )}
      </ScrollView>
      <View style={styles.stepBottomBar}>
        <TouchableOpacity
          style={styles.stepPrimaryButton}
          onPress={
            currentStep === 4
              ? handleSaveProperty
              : () => setCurrentStep((prev) => Math.min(4, prev + 1))
          }
          disabled={saving}
        >
          <Text style={styles.stepPrimaryLabel}>
            {currentStep === 4
              ? saving
                ? 'Saving...'
                : 'Save Property'
              : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
      </>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingList ? (
            <Text style={styles.emptyText}>Loading properties...</Text>
          ) : propertyList.length === 0 ? (
            <Text style={styles.emptyText}>
              No properties found. Add a new property to get started.
            </Text>
          ) : (
            propertyList.map((item, index) => {
              const detailRows = [
                { label: 'Rent Amount', value: item.rentAmount },
                { label: 'Advance Rent', value: item.advanceAmount },
                { label: 'Water Charges', value: item.waterCharges },
                { label: 'Electricity / Unit', value: item.electricityPerUnit },
                { label: 'Cleaning Charges', value: item.cleaningCharges },
                { label: 'Food Charges', value: item.foodCharges },
                { label: 'Yearly Maintenance', value: item.yearlyMaintenance },
                { label: '% Increase after 1 year', value: item.yearlyIncreasePercent },
                { label: 'Advance Booking Charges', value: item.bookingAdvance },
                { label: 'Booking Validity (days)', value: item.bookingValidityDays },
                { label: 'For Rent Room', value: item.rentRoomScope },
                { label: 'Floor', value: item.floor || item.customFloor },
                { label: 'Notice Period (days)', value: item.noticePeriodDays },
              ].filter(row => row.value);

              const amenitiesText =
                Array.isArray(item.amenities) && item.amenities.length
                  ? item.amenities.join(', ')
                  : '';
              const tenantSummary = buildTenantSummaryFor(item);

              const derivedStatus = item.status || (index % 2 === 1 ? 'occupied' : 'available');
              const isOpen = derivedStatus === 'available';
              const isOccupied = !isOpen;

              return (
                <View
                  key={item._id}
                  style={[
                    styles.propertyCard,
                    !isOpen && styles.propertyCardClosed,
                  ]}
                >
                  <View style={styles.propertyHeaderRow}>
                    <View style={styles.propertyHeaderText}>
                      <Text style={styles.propertyName}>
                        {item.propertyName || 'Untitled Property'}
                      </Text>
                      <Text style={styles.propertySubtitle}>
                        {item.category} • {item.listingType} • {item.bhk} • {item.furnishing}
                      </Text>
                      {isOccupied && (
                        <Text style={styles.renterLabel}>
                          Rented to: Demo Tenant
                        </Text>
                      )}
                    </View>
                    <View style={styles.cardActionsColumn}>
                      <TouchableOpacity
                        onPress={() => togglePropertyStatus(item, derivedStatus)}
                        style={[
                          styles.statusPill,
                          isOpen
                            ? styles.statusAvailable
                            : styles.statusOccupied,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {isOpen ? 'Closed' : 'Open'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          setOpenMenuForId(prev =>
                            prev === item._id ? null : item._id,
                          )
                        }
                        style={styles.moreButton}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={18}
                          color={theme.colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {openMenuForId === item._id && (
                    <View style={styles.cardMenu}>
                      <TouchableOpacity
                        disabled={isOccupied}
                        onPress={() => {
                          setOpenMenuForId(null);
                          if (!isOccupied) startEditProperty(item);
                        }}
                        style={styles.cardMenuItem}
                      >
                        <Text
                          style={[
                            styles.cardMenuText,
                            isOccupied && styles.cardMenuTextDisabled,
                          ]}
                        >
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setOpenMenuForId(null);
                          confirmDeleteProperty(item);
                        }}
                        style={styles.cardMenuItem}
                      >
                        <Text style={[styles.cardMenuText, styles.cardMenuTextDelete]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setOpenMenuForId(null);
                          handleShareProperty(item);
                        }}
                        style={styles.cardMenuItem}
                      >
                        <Text style={styles.cardMenuText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {detailRows.length > 0 && (
                    <View style={styles.propertyDetailsSection}>
                      {detailRows.map((row) => (
                        <View key={row.label} style={styles.propertyMetaRow}>
                          <Text style={styles.metaLabel}>{row.label}</Text>
                          <Text style={styles.metaValue}>{row.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {amenitiesText ? (
                    <View style={styles.propertyDetailsSection}>
                      <Text style={styles.metaSectionLabel}>Amenities</Text>
                      <Text style={styles.metaValue}>{amenitiesText}</Text>
                    </View>
                  ) : null}

                  {tenantSummary ? (
                    <View style={styles.propertyDetailsSection}>
                      <Text style={styles.metaSectionLabel}>Tenant Rules & Preferences</Text>
                      <Text style={styles.metaValue}>{tenantSummary}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Property</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this property?
            </Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  stepHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  stepCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepCircleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: theme.colors.primary,
  },
  stepCircleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  stepCircleLabelActive: {
    color: '#ffffff',
  },
  stepBarBackground: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  stepBarFill: {
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    backgroundColor: '#ffffff',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    marginLeft: 'auto',
  },
  addMoreLabel: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md + 4,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.spacing.sm,
  },
  fieldGroup: {
    marginBottom: theme.spacing.sm,
  },
  fieldGroupRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
    color: theme.colors.text,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
    marginVertical: 4,
    flexBasis: '48%',
  },
  optionCardCompact: {
    flexBasis: 'auto',
  },
  optionCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  optionIcon: {
    marginRight: 6,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
    flexShrink: 1,
  },
  optionLabelSelected: {
    color: '#ffffff',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipLabel: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: '#ffffff',
  },
  flex1: {
    flex: 1,
  },
  mr8: {
    marginRight: 8,
  },
  saveButton: {
    marginTop: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyText: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  propertyCardClosed: {
    opacity: 0.5,
  },
  propertyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  propertyHeaderText: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  propertySubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  renterLabel: {
    marginTop: 2,
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  propertyDetailsSection: {
    marginTop: 8,
  },
  propertyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  metaSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  cardActionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  editCardButton: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
  },
  editCardButtonDisabled: {
    opacity: 0.4,
  },
  editCardButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  editCardButtonLabelDisabled: {
    color: theme.colors.textSecondary,
  },
  deleteCardButton: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 6,
  },
  deleteCardButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  statusPill: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusAvailable: {
    backgroundColor: theme.colors.primary,
  },
  statusOccupied: {
    backgroundColor: '#111827',
  },
  moreButton: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 6,
  },
  cardMenu: {
    position: 'absolute',
    top: 40,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 4,
    minWidth: 140,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    zIndex: 20,
  },
  cardMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cardMenuText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  cardMenuTextDisabled: {
    color: theme.colors.textSecondary,
  },
  cardMenuTextDelete: {
    color: '#dc2626',
    fontWeight: '600',
  },
  stepBottomBar: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: '#ffffff',
  },
  stepPrimaryButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPrimaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: theme.spacing.sm,
  },
  modalCancelButton: {
    backgroundColor: '#f3f4f6',
  },
  modalDeleteButton: {
    backgroundColor: '#dc2626',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});
