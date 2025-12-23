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
  Image,
  Switch,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';
import PropertyImageSlider from '../components/PropertyImageSlider';
import LoadingOverlay from '../components/LoadingOverlay';
import { API_BASE_URL } from '../apiBaseUrl';

const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const PROPERTY_DRAFT_STORAGE_KEY = 'PROPERTY_DRAFT_V1';

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

const AMENITIES_GRID = [
  { id: 'fan', label: 'Fan', icon: 'mode-fan' },
  { id: 'cooler', label: 'Cooler', icon: 'toys' },
  { id: 'ac', label: 'AC', icon: 'ac-unit' },
  { id: 'gas', label: 'Gas', icon: 'gas-meter' },
  { id: 'wifi', label: 'WiFi', icon: 'wifi' },
  { id: 'kitchen', label: 'Kitchen', icon: 'countertops' },
  { id: 'parking', label: 'Parking', icon: 'local-parking' },
  { id: 'laundry', label: 'Laundry', icon: 'local-laundry-service' },
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

const ADD_PROPERTY_TOTAL_STEPS = 12;

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
    // defaults aligned with backend Property schema enums
    category: 'flat',
    listingType: 'rent',
    bhk: '1BHK',
    furnishing: 'semi',
    rentRoomScope: '', // one room or all rooms
    floor: '',
    customFloor: '',
    address: '',
    mapLocation: '',
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
    photos: [],
    carpetAreaSqft: '',
    builtUpAreaSqft: '',
    bathrooms: '2',
    balconies: '1',
    electricityChargeType: 'unit', // unit | included
    rentNegotiable: true,
    availableFrom: '',
    minStayMonths: 11,
    lockInEnabled: true,
    lockInMonths: 6,
    mode: 'full', // full | room
    rooms: [createEmptyRoom()],
    // Tenant rules & preferences (backend defaults)
    drinksPolicy: 'not_allowed',
    smokingPolicy: 'not_allowed',
    lateNightPolicy: 'not_allowed',
    visitorsAllowed: 'no', // yes / no
    visitorsMaxDays: '',
    visitorsPolicyNotes: '',
    noticePeriodDays: '',
    parkingType: 'none',
    parkingBikeCount: '',
    parkingCarCount: '',
    // Optional notes when rules are "with conditions"
    drinksPolicyNotes: '',
    smokingPolicyNotes: '',
    lateNightPolicyNotes: '',
    preferredTenantTypes: [],
    bachelorAllowed: true,
    petsAllowed: false,
    nonVegAllowed: true,
    gatedSociety: true,
    cctvSurveillance: false,
    securityGuard: false,
    ownershipProofUri: '',
    contactStartTime: '09:00',
    contactEndTime: '18:00',
    contactDays: [true, true, true, true, true, false, false],
    visitType: 'appointment',
    agreementType: 'owner', // owner | app
    agreementDurationMonths: '12',
    totalRooms: '',
    lateNightMode: 'anytime', // anytime | till_time
    lateNightLastTime: '',
    status: 'available',
    visibleForTenants: false,
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

function AddChip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.addChip, selected && styles.addChipSelected]}
      activeOpacity={0.9}
    >
      <Text style={[styles.addChipText, selected && styles.addChipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MediaPhotoTile({ uri, cover, onRemove }) {
  return (
    <View style={styles.mediaPhotoBox}>
      <Image source={{ uri }} style={styles.mediaPhotoImg} />
      {cover ? (
        <View style={styles.mediaCoverBadge}>
          <Text style={styles.mediaCoverText}>Cover</Text>
        </View>
      ) : null}
      <TouchableOpacity style={styles.mediaRemoveBtn} onPress={onRemove}>
        <MaterialIcons name="close" size={16} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}

export default function PropertyScreen({ navigation, route }) {
  const [properties, setProperties] = useState([createEmptyProperty()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('list'); // 'list' | 'add'
  const [currentStep, setCurrentStep] = useState(1); // 1..12 for add flow
  const [propertyList, setPropertyList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openMenuForId, setOpenMenuForId] = useState(null);
  const [customAmenity, setCustomAmenity] = useState('');
  const [showAmenityInput, setShowAmenityInput] = useState(false);
  const [addressDetails, setAddressDetails] = useState({
    houseNo: '',
    buildingName: '',
    street: '',
    locality: '',
  });

  const activeProperty = properties[activeIndex];

  const saveDraft = async () => {
    try {
      const payload = {
        property: activeProperty,
        step: currentStep,
        updatedAt: Date.now(),
      };
      await AsyncStorage.setItem(PROPERTY_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      Alert.alert('Draft', 'Draft saved locally.');
    } catch (e) {
      Alert.alert('Draft', 'Unable to save draft right now.');
    }
  };

  const loadDraft = async () => {
    try {
      const json = await AsyncStorage.getItem(PROPERTY_DRAFT_STORAGE_KEY);
      const payload = json ? JSON.parse(json) : null;
      if (!payload || typeof payload !== 'object') return;
      if (payload.property && typeof payload.property === 'object') {
        setProperties([{ ...createEmptyProperty(), ...payload.property }]);
        setActiveIndex(0);
      }
      if (typeof payload.step === 'number' && payload.step >= 1 && payload.step <= ADD_PROPERTY_TOTAL_STEPS) {
        setCurrentStep(payload.step);
      }
    } catch (e) {}
  };

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/properties/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
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

  const handleSelectAllTenantTypes = () => {
    const allSelected =
      Array.isArray(activeProperty.preferredTenantTypes) &&
      activeProperty.preferredTenantTypes.length === TENANT_TYPES.length;
    updateActiveProperty({
      preferredTenantTypes: allSelected ? [] : [...TENANT_TYPES],
    });
  };

  const handleAddCustomAmenity = () => {
    const value = (customAmenity || '').trim();
    if (!value) return;
    const current = activeProperty.amenities || [];
    if (current.includes(value)) {
      setCustomAmenity('');
      return;
    }
    updateActiveProperty({ amenities: [...current, value] });
    setCustomAmenity('');
    setShowAmenityInput(false);
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

  const handleAddPhoto = async () => {
    try {
      console.log('handleAddPhoto: upload tile pressed');
      const current = activeProperty.photos || [];
      if (current.length >= 5) {
        Alert.alert('Photos', 'You can upload up to 5 images.');
        return;
      }
      const maxBytes = 5 * 1024 * 1024; // 5MB

      // Web: use a native file input for reliable picker behavior
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = () => {
          const file = input.files && input.files[0];
          if (!file) return;

          if (file.size > maxBytes) {
            Alert.alert(
              'Image too large',
              'Your image size is larger than 5MB. Please choose a smaller file.',
            );
            return;
          }

          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const result = reader.result;
              if (typeof result !== 'string') return;

              const resp = await fetch(`${API_BASE_URL}/properties/upload-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataUrl: result }),
              });
              if (!resp.ok) {
                Alert.alert('Photos', 'Failed to upload image. Please try again.');
                return;
              }
              const body = await resp.json();
              if (!body?.url) {
                Alert.alert('Photos', 'Upload did not return an image URL.');
                return;
              }
              updateActiveProperty({ photos: [...current, body.url] });
            } catch (err) {
              Alert.alert('Photos', 'Unable to upload image. Please try again.');
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }

      // Native (Android/iOS): use Expo Image Picker
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please allow access to your photos to upload property images.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsMultipleSelection: false,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || !result.assets.length) return;

      const asset = result.assets[0];
      const base64 = asset.base64 || '';
      const approxBytes = (base64.length * 3) / 4;

      if (!base64) {
        Alert.alert('Photos', 'Unable to read selected image. Please try another file.');
        return;
      }

      if (approxBytes > maxBytes) {
        Alert.alert(
          'Image too large',
          'Your image size is larger than 5MB. Please choose a smaller file.',
        );
        return;
      }

      try {
        const resp = await fetch(`${API_BASE_URL}/properties/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: `data:image/jpeg;base64,${base64}` }),
        });
        if (!resp.ok) {
          Alert.alert('Photos', 'Failed to upload image. Please try again.');
          return;
        }
        const body = await resp.json();
        if (!body?.url) {
          Alert.alert('Photos', 'Upload did not return an image URL.');
          return;
        }
        updateActiveProperty({ photos: [...current, body.url] });
      } catch (err) {
        Alert.alert('Photos', 'Unable to upload image. Please try again.');
      }
    } catch (e) {
      Alert.alert('Photos', 'Unable to pick image. Please try again.');
    }
  };

  const handleRemovePhoto = (index) => {
    const current = activeProperty.photos || [];
    const next = current.filter((_, i) => i !== index);
    updateActiveProperty({ photos: next });
  };

  const fetchPropertyList = async () => {
    try {
      setLoadingList(true);
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: {
          ...authHeaders,
        },
      });
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
        ? `${API_BASE_URL}/properties/${targetId}`
        : `${API_BASE_URL}/properties`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
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
      setMode('list');
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
    setMode('add');
  };

  // When coming from PropertyDetailsScreen with a property to edit
  useEffect(() => {
    const paramItem = route?.params?.editFromDetails;
    if (paramItem && paramItem._id) {
      startEditProperty(paramItem);
      // clear param so it doesn't re-trigger
      navigation.setParams({ editFromDetails: null });
    }
  }, [route?.params?.editFromDetails]);

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
        `${API_BASE_URL}/properties/${deleteTarget._id}`,
        { method: 'DELETE', headers: { ...(await getAuthHeaders()) } },
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
      title={mode === 'add' ? 'Add Property' : 'My Property'}
      showHeader={mode !== 'add'}
      headerLeft={
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => {
            if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            if (navigation && typeof navigation.navigate === 'function') {
              navigation.navigate('Dashboard');
            }
          }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      }
      headerRight={
        mode === 'add' ? (
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              setMode('list');
              setEditingPropertyId(null);
              setCurrentStep(1);
            }}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.headerAddButton}
            onPress={() => {
              setMode('add');
              setProperties([createEmptyProperty()]);
              setActiveIndex(0);
              setEditingPropertyId(null);
              setCurrentStep(1);
            }}
          >
            <Text style={styles.headerAddButtonLabel}>+</Text>
          </TouchableOpacity>
        )
      }
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.fullBleed}>
        <LoadingOverlay visible={saving || loadingList} />
        {mode === 'add' ? (
          <>
            <View style={styles.addGradient}>
              <View style={styles.addContainer}>
                <View style={styles.addHeader}>
                  <TouchableOpacity
                    style={styles.addIconBtn}
                    onPress={() => {
                      if (currentStep > 1) {
                        setCurrentStep((prev) => Math.max(1, prev - 1));
                        return;
                      }
                      setMode('list');
                      setEditingPropertyId(null);
                      setCurrentStep(1);
                    }}
                  >
                    <MaterialIcons name="chevron-left" size={22} color="#111827" />
                  </TouchableOpacity>

                  <Text style={styles.addHeaderTitle}>
                    {currentStep === 1
                      ? 'Add Property'
                      : currentStep === 2
                        ? 'Media'
                        : currentStep === 3
                          ? 'Address'
                          : currentStep === 4
                            ? 'Area & Size Details'
                            : currentStep === 5
                              ? 'Rent & Charges'
                              : currentStep === 6
                                ? 'Availability & Duration'
                                : currentStep === 7
                                  ? 'Amenities'
                                  : currentStep === 8
                                    ? 'Rules'
                                    : currentStep === 9
                                      ? 'Tenant Preference'
                                      : currentStep === 10
                                        ? 'Security'
                                        : currentStep === 11
                                          ? 'Visit & Contact'
                                          : currentStep === 12
                                            ? 'Agreement & Publishing'
                              : 'Add Property'}
                  </Text>

                  <TouchableOpacity
                    style={styles.addHelpBtn}
                    onPress={() => Alert.alert('Help', 'Complete details step by step and tap Next.')}
                  >
                    <Text style={styles.addHeaderAction}>Help</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.addProgressWrap}>
                  <View style={styles.addProgressTop}>
                    <Text style={styles.addStepText}>{`Step ${currentStep} of ${ADD_PROPERTY_TOTAL_STEPS}`}</Text>
                    <Text style={styles.addPercentText}>{`${Math.round((currentStep / ADD_PROPERTY_TOTAL_STEPS) * 100)}% completed`}</Text>
                  </View>
                  <View style={styles.addProgressBar}>
                    <View style={[styles.addProgressFill, { width: `${(currentStep / ADD_PROPERTY_TOTAL_STEPS) * 100}%` }]} />
                  </View>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.addScrollContent}
                >
                  {currentStep === 1 ? (
                    <View style={styles.addTitleWrap}>
                      <Text style={styles.addTitle}>Property Basic Information</Text>
                      <Text style={styles.addSubtitle}>Tell us about your property to get started.</Text>
                    </View>
                  ) : currentStep === 2 ? (
                    <View style={styles.addTitleWrap}>
                      <Text style={styles.addTitle}>Showcase your property</Text>
                      <Text style={styles.addSubtitle}>Great photos increase tenant interest by 40%.</Text>
                    </View>
                  ) : currentStep === 3 ? (
                    <View style={styles.addTitleWrap}>
                      <Text style={styles.addTitle}>Address & Location</Text>
                      <Text style={styles.addSubtitle}>Where is your property located?</Text>
                    </View>
                  ) : currentStep === 4 ? (
                    <View style={styles.addTitleWrap}>
                      <Text style={styles.addTitle}>Property measurements</Text>
                      <Text style={styles.addSubtitle}>
                        Provide accurate measurements to help tenants visualize the space.
                      </Text>
                    </View>
                  ) : currentStep === 5 ? (
                    <View style={styles.addTitleWrap}>
                      <Text style={styles.addTitle}>Rent & Charges</Text>
                      <Text style={styles.addSubtitle}>Set pricing and monthly charges.</Text>
                    </View>
                  ) : currentStep === 6 ? (
                    <View style={styles.addTitleWrap}>
                      <Text style={styles.addTitle}>Lease Details</Text>
                      <Text style={styles.addSubtitle}>Set the timeline and terms for your property rental.</Text>
                    </View>
                  ) : null}

          {/* Step 1: Basic details */}
          {currentStep === 1 && (
            <View style={styles.addForm}>
              <Text style={styles.addLabel}>Property Name</Text>
              <TextInput
                style={styles.addInput}
                placeholder="e.g. 3BHK Flat in Mohali"
                placeholderTextColor="#6b7280"
                value={activeProperty.propertyName}
                onChangeText={(text) => updateActiveProperty({ propertyName: text })}
              />

              <Text style={styles.addLabel}>Property Mode</Text>
              <View style={styles.addSegment}>
                <TouchableOpacity
                  style={[styles.addSegmentItem, activeProperty.mode === 'full' && styles.addSegmentActive]}
                  onPress={() => updateActiveProperty({ mode: 'full' })}
                >
                  <Text style={[styles.addSegmentText, activeProperty.mode === 'full' && styles.addSegmentTextActive]}>Full Property</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addSegmentItem, activeProperty.mode === 'room' && styles.addSegmentActive]}
                  onPress={() => updateActiveProperty({ mode: 'room' })}
                >
                  <Text style={[styles.addSegmentText, activeProperty.mode === 'room' && styles.addSegmentTextActive]}>Room-wise</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.addLabel}>Property Category</Text>
              <View style={styles.addRowWrap}>
                {PROPERTY_CATEGORIES.map((c) => (
                  <AddChip
                    key={c.id}
                    label={c.label}
                    selected={activeProperty.category === c.id}
                    onPress={() => updateActiveProperty({ category: c.id })}
                  />
                ))}
              </View>

              <Text style={styles.addLabel}>Listing Type</Text>
              <View style={styles.addRowWrap}>
                {LISTING_TYPES.map((lt) => (
                  <AddChip
                    key={lt.id}
                    label={lt.id === 'rent' ? 'For Rent' : lt.id === 'sell' ? 'For Sell' : 'For PG'}
                    selected={activeProperty.listingType === lt.id}
                    onPress={() => updateActiveProperty({ listingType: lt.id })}
                  />
                ))}
              </View>

              <Text style={styles.addLabel}>Configuration</Text>
              {activeProperty.mode === 'full' ? (
                <View style={styles.addRowWrap}>
                  {BHK_OPTIONS.map((bhk) => (
                    <AddChip
                      key={bhk}
                      label={bhk.replace('BHK', ' BHK')}
                      selected={activeProperty.bhk === bhk}
                      onPress={() => updateActiveProperty({ bhk })}
                    />
                  ))}
                </View>
              ) : null}

              <Text style={styles.addLabel}>Furnishing Type</Text>
              <View style={styles.addRowWrap}>
                {FURNISHING_OPTIONS.map((f) => (
                  <AddChip
                    key={f.id}
                    label={f.id === 'full' ? 'Fully Furnished' : f.id === 'semi' ? 'Semi Furnished' : 'Unfurnished'}
                    selected={activeProperty.furnishing === f.id}
                    onPress={() => updateActiveProperty({ furnishing: f.id })}
                  />
                ))}
              </View>

              <View style={styles.addGrid}>
                <View style={styles.addFlex1}>
                  <Text style={styles.addLabel}>Total Rooms</Text>
                  <TextInput
                    style={styles.addInput}
                    keyboardType="number-pad"
                    placeholder="e.g. 4"
                    placeholderTextColor="#6b7280"
                    value={String(activeProperty.totalRooms || '')}
                    onChangeText={(text) => updateActiveProperty({ totalRooms: text })}
                  />
                </View>
                <View style={styles.addFlex1}>
                  <Text style={styles.addLabel}>Floor Number</Text>
                  <TextInput
                    style={styles.addInput}
                    keyboardType="number-pad"
                    placeholder="e.g. 2"
                    placeholderTextColor="#6b7280"
                    value={String(activeProperty.customFloor || activeProperty.floor || '')}
                    onChangeText={(text) => updateActiveProperty({ customFloor: text, floor: '' })}
                  />
                </View>
              </View>

              <Text style={styles.addLabel}>Property Address</Text>
              <TextInput
                style={styles.addInput}
                placeholder="Full address (street, area, city)"
                placeholderTextColor="#6b7280"
                value={activeProperty.address}
                onChangeText={(text) => updateActiveProperty({ address: text })}
              />

              <Text style={styles.addLabel}>Map Location Link</Text>
              <TextInput
                style={styles.addInput}
                placeholder="Paste Google Maps link (optional)"
                placeholderTextColor="#6b7280"
                value={activeProperty.mapLocation}
                onChangeText={(text) => updateActiveProperty({ mapLocation: text })}
              />

              {activeProperty.mode === 'full' ? (
                <>
                  <Text style={styles.addLabel}>Floor</Text>
                  <TextInput
                    style={styles.addInput}
                    placeholder="e.g. 2nd Floor"
                    placeholderTextColor="#6b7280"
                    value={String(activeProperty.floor || activeProperty.customFloor || '')}
                    onChangeText={(text) => updateActiveProperty({ customFloor: text, floor: '' })}
                  />
                </>
              ) : null}
            </View>
          )}

          {currentStep === 1 && activeProperty.mode === 'room' ? (
            <View style={styles.addForm}>
              <Text style={styles.addTitle}>Room-wise Details</Text>
              {rooms.map((room, index) => (
                <View key={index} style={styles.roomCard}>
                  <Text style={styles.roomTitle}>{`Room ${index + 1}`}</Text>

                  <Text style={styles.addLabel}>Room name / label</Text>
                  <TextInput
                    style={styles.addInput}
                    placeholder="e.g. Front Room, Balcony Room"
                    placeholderTextColor="#6b7280"
                    value={room.roomName}
                    onChangeText={(text) => updateRoom(index, { roomName: text })}
                  />

                  <View style={styles.addGrid}>
                    <View style={styles.addFlex1}>
                      <Text style={styles.addLabel}>Size of room</Text>
                      <TextInput
                        style={styles.addInput}
                        placeholder="e.g. 10x12 ft"
                        placeholderTextColor="#6b7280"
                        value={room.roomSize}
                        onChangeText={(text) => updateRoom(index, { roomSize: text })}
                      />
                    </View>
                    <View style={styles.addFlex1}>
                      <Text style={styles.addLabel}>Count</Text>
                      <TextInput
                        style={styles.addInput}
                        keyboardType="numeric"
                        placeholder="1"
                        placeholderTextColor="#6b7280"
                        value={room.roomCount}
                        onChangeText={(text) => updateRoom(index, { roomCount: text })}
                      />
                    </View>
                  </View>

                  <Text style={styles.addLabel}>Configuration (BHK)</Text>
                  <View style={styles.addRowWrap}>
                    {BHK_OPTIONS.map((bhk) => (
                      <AddChip
                        key={bhk}
                        label={bhk.replace('BHK', ' BHK')}
                        selected={room.roomBhk === bhk}
                        onPress={() => updateRoom(index, { roomBhk: bhk })}
                      />
                    ))}
                  </View>

                  <View style={styles.addGrid}>
                    <View style={styles.addFlex1}>
                      <Text style={styles.addLabel}>Floor</Text>
                      <TextInput
                        style={styles.addInput}
                        placeholder="e.g. 1st, 2nd"
                        placeholderTextColor="#6b7280"
                        value={room.roomFloor}
                        onChangeText={(text) => updateRoom(index, { roomFloor: text })}
                      />
                    </View>
                    <View style={styles.addFlex1}>
                      <Text style={styles.addLabel}>Room rent</Text>
                      <TextInput
                        style={styles.addInput}
                        keyboardType="numeric"
                        placeholder="Rent for this room"
                        placeholderTextColor="#6b7280"
                        value={room.roomRent}
                        onChangeText={(text) => updateRoom(index, { roomRent: text })}
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addRoomButton} onPress={addRoom}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addMoreLabel}>Add More Room</Text>
              </TouchableOpacity>
            </View>
          ) : null}

        {currentStep === 2 && (
          <>
            <View style={styles.mediaCard}>
              <View style={styles.mediaCardHeader}>
                <View>
                  <Text style={styles.mediaCardTitle}>Property Photos</Text>
                  <Text style={styles.mediaCardSub}>Upload 3–5 photos. First photo is cover.</Text>
                </View>
                <View style={styles.mediaCountBadge}>
                  <MaterialIcons name="check" size={12} color="#16a34a" />
                  <Text style={styles.mediaCountText}>{(activeProperty.photos || []).length}/5</Text>
                </View>
              </View>

              <View style={styles.mediaGrid}>
                {(activeProperty.photos || []).map((uri, index) => (
                  <MediaPhotoTile
                    key={`${uri}-${index}`}
                    uri={uri}
                    cover={index === 0}
                    onRemove={() => handleRemovePhoto(index)}
                  />
                ))}

                {(activeProperty.photos || []).length < 5 ? (
                  <TouchableOpacity style={styles.mediaAddPhoto} onPress={handleAddPhoto}>
                    <View style={styles.mediaAddIcon}>
                      <MaterialIcons name="add-a-photo" size={22} color="#2563eb" />
                    </View>
                    <Text style={styles.mediaAddText}>Add Photo</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.mediaCard}>
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.mediaCardTitle}>Property Walkthrough</Text>
                  <Text style={styles.mediaOptional}>Optional</Text>
                </View>
                <Text style={styles.mediaCardSub}>Upload 30–60 sec video. Max 50MB.</Text>
              </View>

              <TouchableOpacity
                style={styles.mediaVideoBtn}
                onPress={() => Alert.alert('Video', 'Video upload will be added in next steps.')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.mediaVideoIcon}>
                    <MaterialIcons name="videocam" size={22} color="#2563eb" />
                  </View>
                  <View>
                    <Text style={styles.mediaVideoTitle}>Upload Video</Text>
                    <Text style={styles.mediaVideoSub}>MP4, MOV supported</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {currentStep === 12 && (
          <>
            <View style={styles.pubCard}>
              <View style={styles.pubCardHeader}>
                <MaterialIcons name="description" size={22} color="#2563eb" />
                <Text style={styles.pubCardTitle}>Rental Agreement</Text>
              </View>

              <Text style={styles.pubCardDesc}>Who will manage the legal paperwork?</Text>

              <TouchableOpacity
                onPress={() => updateActiveProperty({ agreementType: 'owner' })}
                style={[styles.pubRadioCard, activeProperty.agreementType === 'owner' && styles.pubRadioActive]}
                activeOpacity={0.9}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pubRadioTitle}>Owner Managed</Text>
                  <Text style={styles.pubRadioDesc}>You handle the agreement yourself</Text>
                </View>
                {activeProperty.agreementType === 'owner' ? (
                  <MaterialIcons name="radio-button-checked" size={20} color="#2563eb" />
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateActiveProperty({ agreementType: 'app' })}
                style={[styles.pubRadioCard, activeProperty.agreementType === 'app' && styles.pubRadioActive]}
                activeOpacity={0.9}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pubRadioTitle}>App Assisted</Text>
                  <Text style={styles.pubRadioDesc}>We generate the paperwork for you</Text>
                </View>
                {activeProperty.agreementType === 'app' ? (
                  <MaterialIcons name="radio-button-checked" size={20} color="#2563eb" />
                ) : null}
              </TouchableOpacity>

              <View style={{ marginTop: 16 }}>
                <Text style={styles.pubLabel}>Agreement Duration</Text>
                <View style={styles.pubInputBox}>
                  <TextInput
                    style={styles.pubInputText}
                    keyboardType="numeric"
                    value={String(activeProperty.agreementDurationMonths || '')}
                    onChangeText={(t) => updateActiveProperty({ agreementDurationMonths: t })}
                    placeholder="12"
                    placeholderTextColor="#6b7280"
                  />
                  <Text style={styles.pubUnit}>Months</Text>
                </View>
              </View>
            </View>

            <View style={styles.pubCard}>
              <View style={styles.pubCardHeader}>
                <MaterialIcons name="calendar-month" size={22} color="#2563eb" />
                <Text style={styles.pubCardTitle}>Availability</Text>
              </View>

              <Text style={styles.pubCardDesc}>Set the initial status of your property listing.</Text>

              <View style={styles.pubStatusRow}>
                {[{ key: 'available', label: 'Available', icon: 'check-circle' },
                  { key: 'booked', label: 'Booked', icon: 'bookmark' },
                  { key: 'rented', label: 'Rented', icon: 'vpn-key' }].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => updateActiveProperty({ status: item.key })}
                    style={[styles.pubStatusCard, activeProperty.status === item.key && styles.pubStatusActive]}
                    activeOpacity={0.9}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={20}
                      color={activeProperty.status === item.key ? '#2563eb' : '#6b7280'}
                    />
                    <Text style={[styles.pubStatusText, activeProperty.status === item.key && { color: '#2563eb' }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.pubPreviewBtn}
              onPress={() => {
                if (navigation && typeof navigation.navigate === 'function') {
                  navigation.navigate('PropertyPreview', { property: activeProperty });
                }
              }}
              activeOpacity={0.9}
            >
              <MaterialIcons name="visibility" size={20} color="#111827" />
              <Text style={styles.pubPreviewText}>Preview Property</Text>
            </TouchableOpacity>

            <Text style={styles.pubHelperText}>
              By publishing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </>
        )}

        {currentStep === 11 && (
          <>
            <View style={styles.visitSection}>
              <Text style={styles.visitTitle}>Visit & Contact Preferences</Text>
              <Text style={styles.visitDesc}>
                Let potential tenants know when they can reach you and how they can view the property.
              </Text>
            </View>

            <View style={styles.visitCardMain}>
              <Text style={styles.visitCardTitle}>Preferred Contact Time</Text>

              <View style={styles.visitTimeRow}>
                <View style={styles.visitTimeBox}>
                  <Text style={styles.visitTimeLabel}>START TIME</Text>
                  <View style={styles.visitTimeInput}>
                    <TextInput
                      style={styles.visitTimeText}
                      value={activeProperty.contactStartTime}
                      onChangeText={(t) => updateActiveProperty({ contactStartTime: t })}
                      placeholder="09:00"
                      placeholderTextColor="#6b7280"
                    />
                  </View>
                </View>

                <Text style={styles.visitDash}>-</Text>

                <View style={styles.visitTimeBox}>
                  <Text style={styles.visitTimeLabel}>END TIME</Text>
                  <View style={styles.visitTimeInput}>
                    <TextInput
                      style={styles.visitTimeText}
                      value={activeProperty.contactEndTime}
                      onChangeText={(t) => updateActiveProperty({ contactEndTime: t })}
                      placeholder="18:00"
                      placeholderTextColor="#6b7280"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.visitDaysWrap}>
                <Text style={styles.visitDaysLabel}>AVAILABLE DAYS</Text>
                <View style={styles.visitDaysRow}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
                    const days = Array.isArray(activeProperty.contactDays)
                      ? activeProperty.contactDays
                      : [true, true, true, true, true, false, false];
                    const on = !!days[i];
                    return (
                      <TouchableOpacity
                        key={`${d}-${i}`}
                        onPress={() => {
                          const next = [...days];
                          next[i] = !next[i];
                          updateActiveProperty({ contactDays: next });
                        }}
                        style={[styles.visitDayBtn, on && styles.visitDayBtnActive]}
                        activeOpacity={0.9}
                      >
                        <Text style={[styles.visitDayText, on && styles.visitDayTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.visitTypeWrap}>
              <Text style={styles.visitCardTitle}>Property Visit Type</Text>

              <TouchableOpacity
                onPress={() => updateActiveProperty({ visitType: 'appointment' })}
                style={[styles.visitTypeCard, activeProperty.visitType === 'appointment' && styles.visitTypeActive]}
                activeOpacity={0.9}
              >
                <View style={styles.visitTypeIconActive}>
                  <MaterialIcons name="lock-clock" size={22} color="#2563eb" />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.visitTypeHeader}>
                    <Text style={styles.visitTypeTitle}>Appointment Required</Text>
                    {activeProperty.visitType === 'appointment' ? (
                      <MaterialIcons name="check-circle" size={20} color="#2563eb" />
                    ) : null}
                  </View>
                  <Text style={styles.visitTypeDesc}>
                    Tenants must request a time slot. You approve each visit.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateActiveProperty({ visitType: 'open' })}
                style={[styles.visitTypeCard, activeProperty.visitType === 'open' && styles.visitTypeActive]}
                activeOpacity={0.9}
              >
                <View style={styles.visitTypeIcon}>
                  <MaterialIcons name="meeting-room" size={22} color="#6b7280" />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.visitTypeHeader}>
                    <Text style={styles.visitTypeTitle}>Open Visit</Text>
                    {activeProperty.visitType === 'open' ? (
                      <MaterialIcons name="check-circle" size={20} color="#2563eb" />
                    ) : null}
                  </View>
                  <Text style={styles.visitTypeDesc}>
                    Tenants can visit freely during available hours.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}

        {currentStep === 10 && (
          <>
            <View style={styles.secStepRow}>
              <Text style={styles.secStep}>Step 10 of 12</Text>
              <Text style={styles.secStepLabel}>Security</Text>
            </View>

            <View style={styles.secSection}>
              <Text style={styles.secTitle}>Security & Verification</Text>
              <Text style={styles.secDesc}>
                Verified properties get{' '}
                <Text style={styles.secHighlight}>3x more views</Text>. Add security details to build trust.
              </Text>
            </View>

            <View style={styles.secCard}>
              <View style={styles.secCardHeader}>
                <MaterialIcons name="verified-user" size={20} color="#2563eb" />
                <Text style={styles.secCardTitle}>Ownership Proof</Text>
                <View style={styles.secOptional}>
                  <Text style={styles.secOptionalText}>Optional</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.secUploadBox}
                activeOpacity={0.9}
                onPress={() => Alert.alert('Upload', 'Document upload will be added in next steps.')}
              >
                <View style={styles.secUploadIcon}>
                  <MaterialIcons name="cloud-upload" size={32} color="#2563eb" />
                </View>

                <Text style={styles.secUploadTitle}>Upload Deed or Electricity Bill</Text>
                <Text style={styles.secUploadSub}>PDF, JPG, PNG (Max 5MB)</Text>

                <View style={styles.secBrowseBtn}>
                  <Text style={styles.secBrowseText}>Browse Files</Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.secSectionLabel}>Amenities & Safety</Text>

            <View style={styles.secToggleCard}>
              <View style={styles.secToggleRow}>
                <View style={styles.secToggleLeft}>
                  <View style={[styles.secIconWrap, { backgroundColor: '#f9731620' }]}>
                    <MaterialIcons name="fence" size={22} color="#f97316" />
                  </View>
                  <View>
                    <Text style={styles.secToggleTitle}>Gated Society</Text>
                    <Text style={styles.secToggleSub}>Controlled entrance for residents</Text>
                  </View>
                </View>
                <Switch
                  value={!!activeProperty.gatedSociety}
                  onValueChange={(val) => updateActiveProperty({ gatedSociety: !!val })}
                  trackColor={{ true: '#2563eb' }}
                />
              </View>

              <View style={styles.secDivider} />

              <View style={styles.secToggleRow}>
                <View style={styles.secToggleLeft}>
                  <View style={[styles.secIconWrap, { backgroundColor: '#2563eb20' }]}>
                    <MaterialIcons name="videocam" size={22} color="#2563eb" />
                  </View>
                  <View>
                    <Text style={styles.secToggleTitle}>CCTV Surveillance</Text>
                    <Text style={styles.secToggleSub}>24/7 video monitoring available</Text>
                  </View>
                </View>
                <Switch
                  value={!!activeProperty.cctvSurveillance}
                  onValueChange={(val) => updateActiveProperty({ cctvSurveillance: !!val })}
                  trackColor={{ true: '#2563eb' }}
                />
              </View>

              <View style={styles.secDivider} />

              <View style={styles.secToggleRow}>
                <View style={styles.secToggleLeft}>
                  <View style={[styles.secIconWrap, { backgroundColor: '#16a34a20' }]}>
                    <MaterialIcons name="local-police" size={22} color="#16a34a" />
                  </View>
                  <View>
                    <Text style={styles.secToggleTitle}>Security Guard</Text>
                    <Text style={styles.secToggleSub}>On-site physical security personnel</Text>
                  </View>
                </View>
                <Switch
                  value={!!activeProperty.securityGuard}
                  onValueChange={(val) => updateActiveProperty({ securityGuard: !!val })}
                  trackColor={{ true: '#2563eb' }}
                />
              </View>
            </View>
          </>
        )}

        {currentStep === 9 && (
          <>
            <View style={styles.prefSection}>
              <Text style={styles.prefTitle}>Who are you looking for?</Text>
              <Text style={styles.prefDesc}>
                Select the type of tenants you prefer for your property.
              </Text>

              <View style={styles.prefChipsWrap}>
                {['All', ...TENANT_TYPES].map((item) => {
                  const selectedArray = Array.isArray(activeProperty.preferredTenantTypes)
                    ? activeProperty.preferredTenantTypes
                    : [];

                  const allSelected = selectedArray.length === TENANT_TYPES.length;
                  const active = item === 'All' ? allSelected || selectedArray.length === 0 : selectedArray.includes(item);

                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        if (item === 'All') {
                          updateActiveProperty({ preferredTenantTypes: [...TENANT_TYPES] });
                          return;
                        }

                        const base = allSelected ? [] : selectedArray;
                        const exists = base.includes(item);
                        const next = exists ? base.filter((t) => t !== item) : [...base, item];
                        updateActiveProperty({
                          preferredTenantTypes: next.length ? next : [...TENANT_TYPES],
                        });
                      }}
                      style={[styles.prefChip, active && styles.prefChipActive]}
                      activeOpacity={0.9}
                    >
                      <Text style={[styles.prefChipText, active && styles.prefChipTextActive]}>
                        {item}
                      </Text>

                      {active ? (
                        <MaterialIcons
                          name="check"
                          size={16}
                          color="#2563eb"
                          style={{ marginLeft: 6 }}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.prefSection}>
              <Text style={styles.prefSectionTitle}>House Rules</Text>

              <View style={styles.prefRuleRow}>
                <View>
                  <Text style={styles.prefRuleTitle}>Bachelors Allowed</Text>
                  <Text style={styles.prefRuleSub}>Allow single tenants to rent</Text>
                </View>
                <Switch
                  value={!!activeProperty.bachelorAllowed}
                  onValueChange={(val) => updateActiveProperty({ bachelorAllowed: !!val })}
                  trackColor={{ true: '#2563eb' }}
                />
              </View>

              <View style={styles.prefDivider} />

              <View style={styles.prefRuleRow}>
                <View>
                  <Text style={styles.prefRuleTitle}>Pets Allowed</Text>
                  <Text style={styles.prefRuleSub}>Cats, dogs, or other pets</Text>
                </View>
                <Switch
                  value={!!activeProperty.petsAllowed}
                  onValueChange={(val) => updateActiveProperty({ petsAllowed: !!val })}
                  trackColor={{ true: '#2563eb' }}
                />
              </View>

              <View style={styles.prefDivider} />

              <View style={styles.prefRuleRow}>
                <View>
                  <Text style={styles.prefRuleTitle}>Non-Veg Allowed</Text>
                  <Text style={styles.prefRuleSub}>Cooking or consuming non-veg food</Text>
                </View>
                <Switch
                  value={!!activeProperty.nonVegAllowed}
                  onValueChange={(val) => updateActiveProperty({ nonVegAllowed: !!val })}
                  trackColor={{ true: '#2563eb' }}
                />
              </View>
            </View>
          </>
        )}

        {currentStep === 3 && (
          <>
            <View style={styles.addrField}>
              <Text style={styles.addrLabel}>Use Saved Address</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.addrSelectBox}
                onPress={() => Alert.alert('Address', 'Saved addresses will be added in next steps.')}
              >
                <Text style={styles.addrPlaceholder}>Select from saved addresses</Text>
                <MaterialIcons name="expand-more" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.addrDivider} />

            <View style={styles.addrRow}>
              <View style={styles.addrCol}>
                <Text style={styles.addrLabel}>Flat / House No.</Text>
                <TextInput
                  placeholder="e.g. A-402"
                  style={styles.addrInput}
                  placeholderTextColor="#6b7280"
                  value={addressDetails.houseNo}
                  onChangeText={(text) => {
                    setAddressDetails((prev) => ({ ...prev, houseNo: text }));
                    const parts = [
                      text,
                      addressDetails.buildingName,
                      addressDetails.street,
                      addressDetails.locality,
                    ].filter(Boolean);
                    updateActiveProperty({ address: parts.join(', ') });
                  }}
                />
              </View>

              <View style={styles.addrCol}>
                <Text style={styles.addrLabel}>Floor</Text>
                <TextInput
                  placeholder="e.g. 4"
                  style={styles.addrInput}
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  value={String(activeProperty.customFloor || '')}
                  onChangeText={(text) => updateActiveProperty({ customFloor: text, floor: '' })}
                />
              </View>
            </View>

            <View style={styles.addrField}>
              <Text style={styles.addrLabel}>Building / Tower Name</Text>
              <TextInput
                placeholder="e.g. Sunshine Heights"
                style={styles.addrInput}
                placeholderTextColor="#6b7280"
                value={addressDetails.buildingName}
                onChangeText={(text) => {
                  setAddressDetails((prev) => ({ ...prev, buildingName: text }));
                  const parts = [
                    addressDetails.houseNo,
                    text,
                    addressDetails.street,
                    addressDetails.locality,
                  ].filter(Boolean);
                  updateActiveProperty({ address: parts.join(', ') });
                }}
              />
            </View>

            <View style={styles.addrField}>
              <Text style={styles.addrLabel}>Street / Road Name</Text>
              <TextInput
                placeholder="Street, Road, or Landmark"
                style={styles.addrInput}
                placeholderTextColor="#6b7280"
                value={addressDetails.street}
                onChangeText={(text) => {
                  setAddressDetails((prev) => ({ ...prev, street: text }));
                  const parts = [
                    addressDetails.houseNo,
                    addressDetails.buildingName,
                    text,
                    addressDetails.locality,
                  ].filter(Boolean);
                  updateActiveProperty({ address: parts.join(', ') });
                }}
              />
            </View>

            <View style={styles.addrField}>
              <Text style={styles.addrLabel}>Society / Area / Locality</Text>
              <View style={styles.addrSearchWrap}>
                <MaterialIcons name="search" size={20} color="#6b7280" />
                <TextInput
                  placeholder="Search Area..."
                  style={styles.addrSearchInput}
                  placeholderTextColor="#6b7280"
                  value={addressDetails.locality}
                  onChangeText={(text) => {
                    setAddressDetails((prev) => ({ ...prev, locality: text }));
                    const parts = [
                      addressDetails.houseNo,
                      addressDetails.buildingName,
                      addressDetails.street,
                      text,
                    ].filter(Boolean);
                    updateActiveProperty({ address: parts.join(', ') });
                  }}
                />
              </View>
            </View>

            <View style={styles.addrMapHeader}>
              <Text style={styles.addrLabel}>Pin Location</Text>
              <TouchableOpacity onPress={() => Alert.alert('Pin Location', 'Pin location editing will be added later.')}
              >
                <Text style={styles.addrEditPin}>Edit Pin Location</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.addrMapBox}
              onPress={() => Alert.alert('Map', 'Map UI will be added later. For now paste a map link.')}
            >
              <View style={styles.addrMapOverlay} />
              <View style={styles.addrPinWrap}>
                <MaterialIcons name="location-on" size={40} color="#2563eb" />
                <View style={styles.addrPinShadow} />
              </View>

              <View style={styles.addrMapHint}>
                <Text style={styles.addrMapHintText}>Drag map to pin exact entrance</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.addrField}>
              <Text style={styles.addrLabel}>Map Location Link</Text>
              <TextInput
                placeholder="Paste Google Maps link (optional)"
                style={styles.addrInput}
                placeholderTextColor="#6b7280"
                value={activeProperty.mapLocation}
                onChangeText={(text) => updateActiveProperty({ mapLocation: text })}
              />
            </View>
          </>
        )}

        {currentStep === 4 && (
          <>
            <View style={styles.areaField}>
              <Text style={styles.areaLabel}>
                Carpet Area <Text style={{ color: '#2563eb' }}>*</Text>
              </Text>
              <View style={styles.areaInputWrap}>
                <TextInput
                  placeholder="e.g. 1200"
                  keyboardType="numeric"
                  style={styles.areaInput}
                  placeholderTextColor="#6b7280"
                  value={String(activeProperty.carpetAreaSqft || '')}
                  onChangeText={(text) => updateActiveProperty({ carpetAreaSqft: text })}
                />
                <Text style={styles.areaUnit}>sq.ft</Text>
              </View>
            </View>

            <View style={styles.areaField}>
              <View style={styles.areaLabelRow}>
                <Text style={styles.areaLabel}>Built-up Area</Text>
                <Text style={styles.areaOptional}>Optional</Text>
              </View>
              <View style={styles.areaInputWrap}>
                <TextInput
                  placeholder="e.g. 1450"
                  keyboardType="numeric"
                  style={styles.areaInput}
                  placeholderTextColor="#6b7280"
                  value={String(activeProperty.builtUpAreaSqft || '')}
                  onChangeText={(text) => updateActiveProperty({ builtUpAreaSqft: text })}
                />
                <Text style={styles.areaUnit}>sq.ft</Text>
              </View>
            </View>

            <View style={styles.areaDivider} />

            <View style={styles.areaField}>
              <Text style={styles.areaLabel}>Number of Bathrooms</Text>
              <View style={styles.areaChipRow}>
                {['1', '2', '3', '4', '5+'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => updateActiveProperty({ bathrooms: item })}
                    style={[styles.areaChip, activeProperty.bathrooms === item && styles.areaChipActive]}
                  >
                    <Text style={[styles.areaChipText, activeProperty.bathrooms === item && styles.areaChipTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.areaField}>
              <Text style={styles.areaLabel}>Number of Balconies</Text>
              <View style={styles.areaChipRow}>
                {['0', '1', '2', '3', '3+'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => updateActiveProperty({ balconies: item })}
                    style={[styles.areaChip, activeProperty.balconies === item && styles.areaChipActive]}
                  >
                    <Text style={[styles.areaChipText, activeProperty.balconies === item && styles.areaChipTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {currentStep === 5 && (
          <>
            <View style={styles.rentSection}>
              <Text style={styles.rentSectionTitle}>Core Financials</Text>
              <View style={styles.rentCard}>
                <View style={styles.rentField}>
                  <Text style={styles.rentLabel}>Monthly Rent Amount *</Text>
                  <View style={styles.rentInputWrap}>
                    <MaterialIcons name="currency-rupee" size={18} color="#6b7280" />
                    <TextInput
                      placeholder="e.g. 15,000"
                      keyboardType="numeric"
                      style={styles.rentInput}
                      placeholderTextColor="#6b7280"
                      value={activeProperty.rentAmount}
                      onChangeText={(text) => updateActiveProperty({ rentAmount: text })}
                    />
                  </View>
                </View>

                <View style={styles.rentField}>
                  <Text style={styles.rentLabel}>Security Deposit</Text>
                  <View style={styles.rentInputWrap}>
                    <MaterialIcons name="lock" size={18} color="#6b7280" />
                    <TextInput
                      placeholder="e.g. 50,000"
                      keyboardType="numeric"
                      style={styles.rentInput}
                      placeholderTextColor="#6b7280"
                      value={activeProperty.advanceAmount}
                      onChangeText={(text) => updateActiveProperty({ advanceAmount: text })}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.rentSection}>
              <Text style={styles.rentSectionTitle}>Utilities & Maintenance</Text>
              <View style={styles.rentCard}>
                <View style={styles.rentField}>
                  <Text style={styles.rentLabel}>Electricity Charges</Text>
                  <View style={styles.rentSegment}>
                    <TouchableOpacity
                      onPress={() => updateActiveProperty({ electricityChargeType: 'unit' })}
                      style={[styles.rentSegmentBtn, activeProperty.electricityChargeType === 'unit' && styles.rentSegmentActive]}
                    >
                      <Text style={[styles.rentSegmentText, activeProperty.electricityChargeType === 'unit' && styles.rentSegmentTextActive]}>Per Unit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateActiveProperty({ electricityChargeType: 'included', electricityPerUnit: '' })}
                      style={[styles.rentSegmentBtn, activeProperty.electricityChargeType === 'included' && styles.rentSegmentActive]}
                    >
                      <Text style={[styles.rentSegmentText, activeProperty.electricityChargeType === 'included' && styles.rentSegmentTextActive]}>Included</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {activeProperty.electricityChargeType === 'unit' ? (
                  <View style={styles.rentField}>
                    <Text style={styles.rentLabel}>Electricity / Unit</Text>
                    <View style={styles.rentInputWrap}>
                      <MaterialIcons name="bolt" size={18} color="#6b7280" />
                      <TextInput
                        placeholder="₹ 0"
                        keyboardType="numeric"
                        style={styles.rentInput}
                        placeholderTextColor="#6b7280"
                        value={activeProperty.electricityPerUnit}
                        onChangeText={(text) => updateActiveProperty({ electricityPerUnit: text })}
                      />
                    </View>
                  </View>
                ) : null}

                <View style={styles.rentRow}>
                  <View style={styles.rentFlex1}>
                    <Text style={styles.rentLabel}>Water</Text>
                    <View style={styles.rentInputWrap}>
                      <MaterialIcons name="water-drop" size={18} color="#6b7280" />
                      <TextInput
                        placeholder="₹ 0"
                        keyboardType="numeric"
                        style={styles.rentInput}
                        placeholderTextColor="#6b7280"
                        value={activeProperty.waterCharges}
                        onChangeText={(text) => updateActiveProperty({ waterCharges: text })}
                      />
                    </View>
                  </View>
                  <View style={styles.rentFlex1}>
                    <Text style={styles.rentLabel}>Maintenance / Yr</Text>
                    <View style={styles.rentInputWrap}>
                      <MaterialIcons name="engineering" size={18} color="#6b7280" />
                      <TextInput
                        placeholder="₹ 0"
                        keyboardType="numeric"
                        style={styles.rentInput}
                        placeholderTextColor="#6b7280"
                        value={activeProperty.yearlyMaintenance}
                        onChangeText={(text) => updateActiveProperty({ yearlyMaintenance: text })}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.rentRow}>
                  <View style={styles.rentFlex1}>
                    <Text style={styles.rentLabel}>Cleaning</Text>
                    <View style={styles.rentInputWrap}>
                      <MaterialIcons name="cleaning-services" size={18} color="#6b7280" />
                      <TextInput
                        placeholder="₹ 0"
                        keyboardType="numeric"
                        style={styles.rentInput}
                        placeholderTextColor="#6b7280"
                        value={activeProperty.cleaningCharges}
                        onChangeText={(text) => updateActiveProperty({ cleaningCharges: text })}
                      />
                    </View>
                  </View>
                  <View style={styles.rentFlex1}>
                    <Text style={styles.rentLabel}>Food (PG)</Text>
                    <View style={styles.rentInputWrap}>
                      <MaterialIcons name="restaurant" size={18} color="#6b7280" />
                      <TextInput
                        placeholder="₹ 0"
                        keyboardType="numeric"
                        style={styles.rentInput}
                        placeholderTextColor="#6b7280"
                        value={activeProperty.foodCharges}
                        onChangeText={(text) => updateActiveProperty({ foodCharges: text })}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.rentSection}>
              <Text style={styles.rentSectionTitle}>Lease Terms</Text>
              <View style={styles.rentCard}>
                <View style={styles.rentRow}>
                  <View style={styles.rentFlex1}>
                    <Text style={styles.rentLabel}>Rent Increase <Text style={styles.rentSub}>(after 11 months)</Text></Text>
                    <View style={styles.rentInputWrap}>
                      <TextInput
                        placeholder="0"
                        keyboardType="numeric"
                        style={styles.rentInput}
                        placeholderTextColor="#6b7280"
                        value={activeProperty.yearlyIncreasePercent}
                        onChangeText={(text) => updateActiveProperty({ yearlyIncreasePercent: text })}
                      />
                      <Text style={styles.rentUnit}>%</Text>
                    </View>
                  </View>
                  <View style={styles.rentFlex1}>
                    <Text style={styles.rentLabel}>Booking Validity <Text style={styles.rentSub}>(token expiry)</Text></Text>
                    <View style={styles.rentInputWrap}>
                      <TextInput
                        placeholder="0"
                        keyboardType="numeric"
                        style={styles.rentInput}
                        placeholderTextColor="#6b7280"
                        value={activeProperty.bookingValidityDays}
                        onChangeText={(text) => updateActiveProperty({ bookingValidityDays: text })}
                      />
                      <Text style={styles.rentUnit}>Days</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rentField}>
                  <Text style={styles.rentLabel}>Advance Booking Token Amount</Text>
                  <View style={styles.rentInputWrap}>
                    <MaterialIcons name="payments" size={18} color="#6b7280" />
                    <TextInput
                      placeholder="e.g. 2,000"
                      keyboardType="numeric"
                      style={styles.rentInput}
                      placeholderTextColor="#6b7280"
                      value={activeProperty.bookingAdvance}
                      onChangeText={(text) => updateActiveProperty({ bookingAdvance: text })}
                    />
                  </View>
                </View>

                <View style={styles.rentToggleRow}>
                  <View>
                    <Text style={styles.rentToggleTitle}>Price Negotiable</Text>
                    <Text style={styles.rentToggleSub}>Can tenants bargain on rent?</Text>
                  </View>
                  <Switch
                    value={!!activeProperty.rentNegotiable}
                    onValueChange={(val) => updateActiveProperty({ rentNegotiable: !!val })}
                    trackColor={{ true: '#2563eb' }}
                  />
                </View>
              </View>
            </View>
          </>
        )}

        {currentStep === 6 && (
          <>
            <View style={styles.leaseCard}>
              <View style={styles.leaseCardHeader}>
                <View style={styles.leaseIconCircle}>
                  <MaterialIcons name="calendar-month" size={20} color="#2563eb" />
                </View>
                <Text style={styles.leaseCardTitle}>Availability</Text>
              </View>

              <Text style={styles.leaseLabel}>Available From</Text>
              <TouchableOpacity
                style={styles.leaseInputWrap}
                onPress={() => Alert.alert('Date', 'Date picker will be added later. You can type a date for now.')}
              >
                <Text style={styles.leaseInputText}>
                  {activeProperty.availableFrom || 'Select date'}
                </Text>
                <MaterialIcons name="event" size={22} color="#2563eb" />
              </TouchableOpacity>
              <TextInput
                style={[styles.leaseInput, { marginTop: 10 }]}
                placeholder="e.g. Oct 24, 2023"
                placeholderTextColor="#6b7280"
                value={activeProperty.availableFrom}
                onChangeText={(text) => updateActiveProperty({ availableFrom: text })}
              />
              <Text style={styles.leaseHelper}>Tenants can move in starting from this date.</Text>
            </View>

            <View style={styles.leaseCard}>
              <View style={styles.leaseCardHeader}>
                <View style={styles.leaseIconCircle}>
                  <MaterialIcons name="schedule" size={20} color="#2563eb" />
                </View>
                <Text style={styles.leaseCardTitle}>Duration Terms</Text>
              </View>

              <Text style={styles.leaseLabel}>Minimum Stay Duration</Text>

              <View style={styles.leaseRow}>
                <View style={styles.leaseFlex1}>
                  <View style={styles.leaseInputWrap}>
                    <TextInput
                      value={String(activeProperty.minStayMonths ?? 0)}
                      keyboardType="numeric"
                      onChangeText={(v) =>
                        updateActiveProperty({ minStayMonths: Number(v || 0) })
                      }
                      style={styles.leaseInput}
                      placeholderTextColor="#6b7280"
                    />
                    <Text style={styles.leaseUnit}>Months</Text>
                  </View>
                </View>

                <View style={styles.leaseStepper}>
                  <TouchableOpacity
                    onPress={() =>
                      updateActiveProperty({ minStayMonths: Math.max(1, Number(activeProperty.minStayMonths || 0) - 1) })
                    }
                    style={styles.leaseStepBtn}
                  >
                    <MaterialIcons name="remove" size={20} color="#111827" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      updateActiveProperty({ minStayMonths: Number(activeProperty.minStayMonths || 0) + 1 })
                    }
                    style={styles.leaseStepBtn}
                  >
                    <MaterialIcons name="add" size={20} color="#2563eb" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.leaseHelper}>Standard leases are usually 11 or 12 months.</Text>

              <View style={styles.leaseDivider} />

              <View style={styles.leaseToggleRow}>
                <View>
                  <Text style={styles.leaseToggleTitle}>Lock-in Period</Text>
                  <Text style={styles.leaseToggleSub}>Is there a mandatory stay period?</Text>
                </View>

                <Switch
                  value={!!activeProperty.lockInEnabled}
                  onValueChange={(val) => updateActiveProperty({ lockInEnabled: !!val })}
                  trackColor={{ true: '#2563eb' }}
                />
              </View>

              {activeProperty.lockInEnabled ? (
                <View style={styles.leaseLockBox}>
                  <Text style={styles.leaseLabel}>Lock-in Duration</Text>
                  <View style={styles.leaseInputWrap}>
                    <TextInput
                      value={String(activeProperty.lockInMonths ?? 0)}
                      keyboardType="numeric"
                      onChangeText={(v) =>
                        updateActiveProperty({ lockInMonths: Number(v || 0) })
                      }
                      style={styles.leaseInput}
                      placeholderTextColor="#6b7280"
                    />
                    <Text style={styles.leaseUnit}>Months</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </>
        )}

        {currentStep === 7 && (
          <>
            <View style={styles.amenIntro}>
              <Text style={styles.amenTitle}>What amenities do you provide?</Text>
              <Text style={styles.amenSubtitle}>Select all the facilities available to the tenant.</Text>
            </View>

            <View style={styles.amenGrid}>
              {AMENITIES_GRID.map((item) => {
                const current = activeProperty.amenities || [];
                const isActive = current.includes(item.label);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.amenCard, isActive && styles.amenCardActive]}
                    onPress={() => toggleAmenity(item.label)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.amenCardTop}>
                      <View style={[styles.amenIconCircle, isActive && styles.amenIconCircleActive]}>
                        <MaterialIcons
                          name={item.icon}
                          size={22}
                          color={isActive ? '#ffffff' : '#111827'}
                        />
                      </View>

                      {isActive ? (
                        <MaterialIcons name="check-circle" size={22} color="#2563eb" />
                      ) : (
                        <View style={styles.amenEmptyDot} />
                      )}
                    </View>

                    <Text style={styles.amenCardText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.amenAddCard}
                onPress={() => setShowAmenityInput(true)}
                activeOpacity={0.9}
              >
                <MaterialIcons name="add" size={30} color="#2563eb" />
                <Text style={styles.amenAddText}>Add amenity</Text>
              </TouchableOpacity>
            </View>

            {showAmenityInput ? (
              <View style={styles.amenCustomWrap}>
                <Text style={styles.amenCustomLabel}>Custom amenity</Text>
                <View style={styles.amenCustomRow}>
                  <TextInput
                    style={styles.amenCustomInput}
                    placeholder="e.g. CCTV, Geyser"
                    placeholderTextColor="#6b7280"
                    value={customAmenity}
                    onChangeText={setCustomAmenity}
                  />
                  <TouchableOpacity
                    style={styles.amenCustomAddBtn}
                    onPress={handleAddCustomAmenity}
                  >
                    <Text style={styles.amenCustomAddText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </>
        )}

        {currentStep === 8 && (
          <>
            <View style={styles.rulesSection}>
              <Text style={styles.rulesSectionTitle}>Behaviour Preferences</Text>

              <View style={styles.rulesToggleRow}>
                <View style={styles.rulesToggleLeft}>
                  <View style={styles.rulesToggleIcon}>
                    <MaterialIcons name="smoke-free" size={20} color="#374151" />
                  </View>
                  <View>
                    <Text style={styles.rulesToggleTitle}>Smoking Allowed</Text>
                    <Text style={styles.rulesToggleSub}>Includes e-cigarettes</Text>
                  </View>
                </View>
                <Switch
                  value={activeProperty.smokingPolicy === 'allowed'}
                  onValueChange={(val) => updateActiveProperty({ smokingPolicy: val ? 'allowed' : 'not_allowed' })}
                  trackColor={{ true: '#2563eb' }}
                />
              </View>

              <View style={styles.rulesToggleRow}>
                <View style={styles.rulesToggleLeft}>
                  <View style={styles.rulesToggleIcon}>
                    <MaterialIcons name="wine-bar" size={20} color="#374151" />
                  </View>
                  <View>
                    <Text style={styles.rulesToggleTitle}>Drinking Allowed</Text>
                    <Text style={styles.rulesToggleSub}>Responsible consumption</Text>
                  </View>
                </View>
                <Switch
                  value={activeProperty.drinksPolicy === 'allowed'}
                  onValueChange={(val) => updateActiveProperty({ drinksPolicy: val ? 'allowed' : 'not_allowed' })}
                  trackColor={{ true: '#2563eb' }}
                />
              </View>
            </View>

            <View style={styles.rulesSection}>
              <Text style={styles.rulesSectionTitle}>Entry & Visitors</Text>

              <View style={styles.rulesInputBlock}>
                <Text style={styles.rulesLabel}>Late Night Entry</Text>
                <TouchableOpacity
                  style={styles.rulesSelectBox}
                  onPress={() => {
                    const current =
                      activeProperty.lateNightPolicy === 'not_allowed'
                        ? 'not_allowed'
                        : activeProperty.lateNightMode === 'till_time'
                          ? 'till_time'
                          : 'anytime';
                    const next = current === 'anytime' ? 'till_time' : current === 'till_time' ? 'not_allowed' : 'anytime';
                    if (next === 'not_allowed') {
                      updateActiveProperty({ lateNightPolicy: 'not_allowed', lateNightMode: 'anytime', lateNightLastTime: '' });
                    } else if (next === 'till_time') {
                      updateActiveProperty({ lateNightPolicy: 'allowed', lateNightMode: 'till_time' });
                    } else {
                      updateActiveProperty({ lateNightPolicy: 'allowed', lateNightMode: 'anytime', lateNightLastTime: '' });
                    }
                  }}
                >
                  <Text style={styles.rulesSelectText}>
                    {activeProperty.lateNightPolicy === 'not_allowed'
                      ? 'No Restriction'
                      : activeProperty.lateNightMode === 'till_time'
                        ? 'Till Specific Time'
                        : 'No Restriction'}
                  </Text>
                  <MaterialIcons name="expand-more" size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {activeProperty.lateNightPolicy === 'allowed' && activeProperty.lateNightMode === 'till_time' ? (
                <View style={styles.rulesInputBlock}>
                  <Text style={styles.rulesLabel}>Late Entry Time</Text>
                  <TextInput
                    style={styles.rulesTextArea}
                    placeholder="e.g. 11:30 PM"
                    placeholderTextColor="#6b7280"
                    value={activeProperty.lateNightLastTime}
                    onChangeText={(text) => updateActiveProperty({ lateNightLastTime: text })}
                  />
                </View>
              ) : null}

              <View style={styles.rulesInputBlock}>
                <Text style={styles.rulesLabel}>Visitor Policy</Text>
                <TextInput
                  style={styles.rulesTextArea}
                  placeholder="No overnight guests without notice..."
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={4}
                  value={activeProperty.visitorsPolicyNotes}
                  onChangeText={(text) => updateActiveProperty({ visitorsPolicyNotes: text })}
                />
              </View>
            </View>

            <View style={styles.rulesSection}>
              <Text style={styles.rulesSectionTitle}>Parking Rules</Text>
              <View style={styles.rulesGrid}>
                {[{ id: 'none', icon: 'block', label: 'No Parking' },
                  { id: 'bike', icon: 'pedal-bike', label: 'Bike Only' },
                  { id: 'car', icon: 'directions-car', label: 'Car Only' },
                  { id: 'both', icon: 'commute', label: 'Bike & Car' }].map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => updateActiveProperty({ parkingType: p.id })}
                    style={[styles.rulesParkingCard, activeProperty.parkingType === p.id && styles.rulesParkingActive]}
                  >
                    <MaterialIcons
                      name={p.icon}
                      size={30}
                      color={activeProperty.parkingType === p.id ? '#2563eb' : '#9ca3af'}
                    />
                    <Text style={[styles.rulesParkingText, activeProperty.parkingType === p.id && { color: '#2563eb' }]}>
                      {p.label}
                    </Text>
                    {activeProperty.parkingType === p.id ? (
                      <MaterialIcons name="check-circle" size={20} color="#2563eb" style={styles.rulesCheckIcon} />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rulesSection}>
              <Text style={styles.rulesSectionTitle}>Notice Period to Vacate</Text>
              <View style={styles.rulesNoticeBox}>
                <MaterialIcons name="calendar-month" size={22} color="#6b7280" />
                <TextInput
                  style={styles.rulesNoticeInput}
                  keyboardType="numeric"
                  value={String(activeProperty.noticePeriodDays || '')}
                  onChangeText={(text) => updateActiveProperty({ noticePeriodDays: text })}
                  placeholder="30"
                  placeholderTextColor="#6b7280"
                />
                <Text style={styles.rulesNoticeUnit}>Days</Text>
              </View>
              <Text style={styles.rulesHelperText}>Minimum notice required from tenant.</Text>
            </View>
          </>
        )}
                </ScrollView>

                <View style={styles.addFooter}>
                  <View style={styles.addFooterRight}>
                    <TouchableOpacity style={styles.addDraftBtn} onPress={saveDraft} disabled={saving}>
                      <Text style={styles.addDraftText}>Save Draft</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.addNextBtn}
                      onPress={
                        currentStep === ADD_PROPERTY_TOTAL_STEPS
                          ? handleSaveProperty
                          : () => setCurrentStep((prev) => Math.min(ADD_PROPERTY_TOTAL_STEPS, prev + 1))
                      }
                      disabled={saving}
                    >
                      <Text style={styles.addNextText}>
                        {currentStep === ADD_PROPERTY_TOTAL_STEPS ? (saving ? 'Saving...' : 'Save') : 'Next'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {loadingList ? (
            <Text style={styles.emptyText}>Loading properties...</Text>
          ) : propertyList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Still you didn't add any property yet. Please add a property.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => {
                  setMode('add');
                  setProperties([createEmptyProperty()]);
                  setActiveIndex(0);
                  setEditingPropertyId(null);
                  setCurrentStep(1);
                }}
              >
                <Text style={styles.emptyAddButtonLabel}>Add Property</Text>
              </TouchableOpacity>
            </View>
          ) : (
            propertyList.map((item, index) => {
              const amenitiesText =
                Array.isArray(item.amenities) && item.amenities.length
                  ? item.amenities.join(', ')
                  : '';
              const tenantSummary = buildTenantSummaryFor(item);

              const derivedStatus = item.status || (index % 2 === 1 ? 'occupied' : 'available');
              const isOpen = derivedStatus === 'available';
              const isOccupied = !isOpen;

              const photos = Array.isArray(item.photos) ? item.photos : [];

              const typeLabel =
                item.category === 'house'
                  ? 'Independent'
                : item.category === 'flat'
                    ? 'Flat'
                    : item.category === 'pg'
                      ? 'PG / Hostel'
                      : 'Property';

              const rentLabel = item.rentAmount
                ? `₹${item.rentAmount}/month`
                : 'Rent not set';

              const statusTextLine = isOpen ? 'Open for rent' : 'Booked';
              const statusActionLabel = isOpen ? 'Booked' : 'Open';

              const addressLine = item.floor || item.customFloor || '';

              return (
                <View
                  key={item._id}
                  style={[
                    styles.propertyCard,
                    !isOpen && styles.propertyCardClosed,
                  ]}
                >
                  {/* Image wrapper */}
                  <View style={styles.propertyImageWrapper}>
                    <PropertyImageSlider
                      photos={photos}
                      maxImages={5}
                      autoSlide
                      autoSlideIntervalMs={2500}
                      height={170}
                      borderRadius={0}
                      showThumbnails
                    />
                  </View>

                  {/* Content */}
                  <View style={styles.propertyCardBody}>
                    {/* Status row as badge */}
                    <View style={styles.propertyStatusRow}>
                      <View style={styles.propertyStatusBadge}>
                        <Text style={styles.propertyStatusBadgeLabel}>Status:</Text>
                        <Text style={styles.propertyStatusBadgeText}> {statusTextLine}</Text>
                      </View>
                    </View>

                    {/* Title row with three-dot menu on right */}
                    <View style={styles.propertyTitleRow}>
                      <Text style={styles.propertyName} numberOfLines={2}>
                        {item.propertyName || 'Untitled Property'}
                      </Text>
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

                    {/* Address (small) */}
                    {addressLine ? (
                      <Text style={styles.propertyAddress} numberOfLines={1}>
                        {addressLine}
                      </Text>
                    ) : null}

                    {/* Subtitle / type */}
                    <Text style={styles.propertySubtitle} numberOfLines={1}>
                      {item.bhk || '1BHK'} {typeLabel}
                    </Text>

                    {/* Amenities / tenant summary */}
                    {amenitiesText ? (
                      <Text style={styles.propertyAmenitiesText} numberOfLines={1}>
                        {amenitiesText}
                      </Text>
                    ) : null}

                    {tenantSummary ? (
                      <Text style={styles.propertyTenantText} numberOfLines={1}>
                        {tenantSummary}
                      </Text>
                    ) : null}

                    {/* Bottom row: price + buttons */}
                    <View style={styles.propertyFooterRow}>
                      <View>
                        <Text style={styles.propertyPrice}>{rentLabel}</Text>
                      </View>

                      <View style={styles.propertyFooterActions}>
                        <TouchableOpacity
                          style={styles.viewDetailsButton}
                          onPress={() =>
                            navigation.navigate('PropertyDetails', {
                              property: item,
                              propertyList,
                              index,
                            })
                          }
                        >
                          <Text style={styles.viewDetailsLabel}>View Details</Text>
                        </TouchableOpacity>
                      </View>
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
                </View>
              );
            })
          )}
        </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );

}

const styles = StyleSheet.create({
  addGradient: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  addContainer: {
    flex: 1,
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  addIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Roboto_700Bold',
  },
  addHelpBtn: {
    height: 40,
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  addHeaderAction: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
    fontFamily: 'Roboto_500Medium',
  },
  addProgressWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  addProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Roboto_700Bold',
  },
  addPercentText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    fontFamily: 'Roboto_500Medium',
  },
  addProgressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    marginTop: 8,
    overflow: 'hidden',
  },
  addProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 999,
  },
  addSectionHint: {
    marginTop: 6,
    color: '#6b7280',
    fontWeight: '600',
  },
  addTitleWrap: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  addTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  addSubtitle: {
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '600',
  },
  addScrollContent: { paddingBottom: 140 },
  addForm: { padding: 16, gap: 20 },
  addLabel: { fontWeight: '700', color: '#111827', fontSize: 13, marginBottom: 8 },
  addInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
    marginBottom: 12,
  },
  addSegment: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addSegmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  addSegmentActive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  addSegmentText: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
  addSegmentTextActive: { color: '#111827', fontWeight: '700', fontSize: 13, fontFamily: 'Roboto_700Bold' },
  addRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  addChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  addChipSelected: { borderColor: '#2563eb', backgroundColor: '#2563eb15' },
  addChipText: { color: '#6b7280', fontWeight: '600', fontSize: 12 },
  addChipTextSelected: { color: '#2563eb', fontWeight: '700', fontFamily: 'Roboto_700Bold' },
  addGrid: { flexDirection: 'row', gap: 14 },
  addFlex1: { flex: 1 },
  addFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addBackBtn: {
    paddingHorizontal: 10,
    height: 44,
    justifyContent: 'center',
  },
  addBackText: {
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Roboto_700Bold',
  },
  addFooterRight: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  addDraftBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  addDraftText: {
    color: '#2563eb',
    fontWeight: '700',
    fontFamily: 'Roboto_700Bold',
  },
  addNextBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  addNextText: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'Roboto_700Bold',
  },

  mediaCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mediaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mediaCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  mediaCardSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  mediaCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mediaCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaPhotoBox: {
    width: '48%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  mediaPhotoImg: { width: '100%', height: '100%' },
  mediaCoverBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mediaCoverText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '800',
  },
  mediaRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 2,
  },
  mediaAddPhoto: {
    width: '48%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c7d2fe',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
  },
  mediaAddIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  mediaAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  mediaOptional: {
    fontSize: 11,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  mediaVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mediaVideoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaVideoTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  mediaVideoSub: {
    fontSize: 12,
    color: '#6b7280',
  },

  addrField: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  addrLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Roboto_700Bold',
    marginBottom: 8,
  },
  addrInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  addrSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  addrPlaceholder: {
    color: '#6b7280',
    fontWeight: '600',
  },
  addrDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  addrRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  addrCol: {
    flex: 1,
  },
  addrSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  addrSearchInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  addrMapHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addrEditPin: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  addrMapBox: {
    margin: 16,
    height: 190,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addrMapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  addrPinWrap: {
    alignItems: 'center',
  },
  addrPinShadow: {
    width: 18,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 999,
    marginTop: -2,
  },
  addrMapHint: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: '#ffffffee',
    borderRadius: 8,
    padding: 6,
  },
  addrMapHintText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6b7280',
  },

  areaField: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  areaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Roboto_700Bold',
    marginBottom: 8,
  },
  areaLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  areaOptional: {
    fontSize: 12,
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  areaInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    height: 54,
  },
  areaInput: {
    flex: 1,
    fontSize: 16,
  },
  areaUnit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  areaDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
    marginHorizontal: 16,
  },
  areaChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  areaChip: {
    width: 56,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  areaChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb15',
  },
  areaChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  areaChipTextActive: {
    color: '#2563eb',
    fontWeight: '800',
  },
  rentSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  rentSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    color: '#111827',
  },
  rentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rentField: {
    gap: 6,
    marginBottom: 12,
  },
  rentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Roboto_700Bold',
    marginBottom: 8,
  },
  rentSub: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  rentInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#fff',
  },
  rentInput: {
    flex: 1,
    fontSize: 15,
  },
  rentUnit: {
    fontWeight: '600',
    color: '#6b7280',
  },
  rentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rentFlex1: {
    flex: 1,
  },
  rentSegment: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 4,
  },
  rentSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  rentSegmentActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rentSegmentText: {
    fontWeight: '600',
    color: '#6b7280',
  },
  rentSegmentTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  rentToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentToggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  rentToggleSub: {
    fontSize: 12,
    color: '#6b7280',
  },
  leaseCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  leaseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  leaseIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaseCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  leaseLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
    fontFamily: 'Roboto_700Bold',
  },
  leaseHelper: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  leaseInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  leaseInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  leaseInputText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  leaseUnit: {
    color: '#6b7280',
    fontWeight: '600',
  },
  leaseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  leaseFlex1: {
    flex: 1,
  },
  leaseStepper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  leaseStepBtn: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaseDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 14,
  },
  leaseToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaseToggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  leaseToggleSub: {
    fontSize: 12,
    color: '#6b7280',
  },
  leaseLockBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  amenIntro: {
    padding: 16,
  },
  amenTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    color: '#111827',
  },
  amenSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  amenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  amenCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  amenCardActive: {
    borderWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: '#2563eb14',
  },
  amenCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  amenIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenIconCircleActive: {
    backgroundColor: '#2563eb',
  },
  amenEmptyDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  amenCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  amenAddCard: {
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#c7d2fe',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
  },
  amenAddText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  amenCustomWrap: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  amenCustomLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  amenCustomRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  amenCustomInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  amenCustomAddBtn: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenCustomAddText: {
    color: '#fff',
    fontWeight: '800',
  },
  rulesProgressWrap: {
    padding: 16,
  },
  rulesProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rulesStep: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  rulesPercent: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
  },
  rulesProgressBar: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
    overflow: 'hidden',
  },
  rulesProgressFill: {
    width: '66%',
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  rulesPageTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
    color: '#111827',
  },
  rulesPageDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  rulesSection: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  rulesSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    color: '#111827',
  },
  rulesToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  rulesToggleLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  rulesToggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesToggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  rulesToggleSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  rulesInputBlock: {
    marginBottom: 14,
  },
  rulesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111827',
  },
  rulesSelectBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rulesSelectText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
  },
  rulesTextArea: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    textAlignVertical: 'top',
    color: '#111827',
  },
  rulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rulesParkingCard: {
    width: '47%',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  rulesParkingActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb14',
  },
  rulesParkingText: {
    marginTop: 6,
    fontWeight: '700',
    color: '#111827',
  },
  rulesCheckIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  rulesNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rulesNoticeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 10,
    color: '#111827',
  },
  rulesNoticeUnit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  rulesHelperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  prefProgressWrap: {
    padding: 16,
  },
  prefProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  prefStep: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '700',
  },
  prefPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  prefProgressBar: {
    height: 8,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  prefProgressFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  prefSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 8,
    borderColor: '#f3f4f6',
  },
  prefTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    color: '#111827',
  },
  prefDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  prefChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  prefChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  prefChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb14',
  },
  prefChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  prefChipTextActive: {
    color: '#2563eb',
  },
  prefSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
  },
  prefRuleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  prefRuleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  prefRuleSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  prefDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  secProgressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
  },
  secProgressFill: {
    width: '83%',
    height: '100%',
    backgroundColor: '#2563eb',
  },
  secStepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  secStep: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  secStepLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  secSection: {
    padding: 16,
  },
  secTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  secDesc: {
    marginTop: 6,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  secHighlight: {
    color: '#2563eb',
    fontWeight: '800',
  },
  secCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  secCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  secOptional: {
    marginLeft: 'auto',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  secOptionalText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  secUploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  secUploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  secUploadTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  secUploadSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  secBrowseBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  secBrowseText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#111827',
  },
  secSectionLabel: {
    marginTop: 24,
    marginLeft: 16,
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  secToggleCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  secToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  secToggleLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  secIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secToggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  secToggleSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  secDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  visitProgressWrap: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  visitProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  visitStep: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  visitPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  visitProgressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  visitProgressFill: {
    width: '92%',
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  visitSection: {
    padding: 16,
  },
  visitTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  visitDesc: {
    marginTop: 6,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  visitCardMain: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  visitCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    color: '#111827',
  },
  visitTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitTimeBox: {
    flex: 1,
  },
  visitDash: {
    marginHorizontal: 10,
    marginTop: 18,
    color: '#9ca3af',
  },
  visitTimeLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
    fontFamily: 'Roboto_700Bold',
    marginBottom: 6,
  },
  visitTimeInput: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  visitTimeText: {
    fontWeight: '700',
    color: '#111827',
  },
  visitDaysWrap: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  visitDaysLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    fontFamily: 'Roboto_700Bold',
    marginBottom: 10,
  },
  visitDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visitDayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  visitDayBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  visitDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  visitDayTextActive: {
    color: '#fff',
  },
  visitTypeWrap: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  visitTypeCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginTop: 12,
  },
  visitTypeActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb10',
  },
  visitTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  visitTypeIconActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  visitTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visitTypeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  visitTypeDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  pubProgressWrap: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  pubProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pubStep: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  pubPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  pubProgressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  pubProgressFill: {
    width: '95%',
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  pubCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  pubCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pubCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  pubCardDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  pubRadioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pubRadioActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb10',
  },
  pubRadioTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  pubRadioDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  pubLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Roboto_700Bold',
    color: '#111827',
  },
  pubInputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pubInputText: {
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  pubUnit: {
    color: '#6b7280',
    fontWeight: '600',
  },
  pubStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pubStatusCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  pubStatusActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb10',
  },
  pubStatusText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  pubPreviewBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pubPreviewText: {
    fontWeight: '700',
    color: '#111827',
  },
  pubHelperText: {
    marginTop: 10,
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  fullBleed: {
    flex: 1,
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  headerAddButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddButtonLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerIconButton: {
    padding: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  stepHeader: {
    marginBottom: theme.spacing.lg,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  stepBarBackground: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  stepBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  // Step sections: full-width, no card background
  sectionCard: {
    marginBottom: theme.spacing.lg,
  },
  // Large section heading with light underline
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitleAccent: {
    width: 4,
    height: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    marginRight: 10,
  },
  sectionTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  photoSection: {
    marginBottom: theme.spacing.lg,
  },
  photoGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  photoAddTile: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  photoAddTileLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  photoThumbWrapper: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    marginBottom: 10,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
  emptyText: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  emptyTextLink: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: theme.spacing.md,
  },
  fieldGroupRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#F1F5F9',
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
  headerAddButtonLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
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
    marginTop: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  chipLabelSelected: {
    color: '#ffffff',
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  roomSection: {
    marginTop: theme.spacing.md,
  },
  roomCard: {
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: theme.spacing.md,
    shadowColor: 'transparent',
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  roomTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  addRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  addMoreLabel: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  summaryText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  flex1: {
    flex: 1,
  },
  mr8: {
    marginRight: 8,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  propertyCardClosed: {
    opacity: 0.5,
  },
  propertyImageWrapper: {
    width: '100%',
    height: 170,
    backgroundColor: '#e6eef8',
  },
  propertyCardBody: {
    padding: theme.spacing.md,
  },
  propertyStatusRow: {
    marginBottom: 6,
  },
  propertyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaf6f1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  propertyStatusBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1b8a66',
  },
  propertyStatusBadgeText: {
    fontSize: 12,
    color: '#1b8a66',
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  propertyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  propertyAddress: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  propertySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  propertyAmenitiesText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  propertyTenantText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  propertyFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  propertyPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  propertyFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  viewDetailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cardActionsColumn: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusAvailable: {
    backgroundColor: theme.colors.price,
  },
  statusOccupied: {
    backgroundColor: theme.colors.textSecondary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  moreButton: {
    marginTop: 6,
    padding: 4,
    borderRadius: 999,
    backgroundColor: '#EFF0F6',
  },
  cardMenu: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#F9FAFB',
  },
  cardMenuItem: {
    paddingVertical: 6,
  },
  cardMenuText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  cardMenuTextDisabled: {
    color: theme.colors.textSecondary,
  },
  cardMenuTextDelete: {
    color: theme.colors.error,
  },
  stepBottomBar: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#ffffff',
  },
  stepBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepSecondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    marginRight: 16,
  },
  stepSecondaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  stepSecondarySpacer: {
    flex: 1,
    marginRight: 16,
  },
  stepPrimaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPrimaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyState: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyAddButton: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  emptyAddButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '80%',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  modalMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  modalButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: theme.spacing.sm,
  },
  modalCancelButton: {
    backgroundColor: '#E5E7EB',
  },
  modalDeleteButton: {
    backgroundColor: theme.colors.error,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  modalDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
