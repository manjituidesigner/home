import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommonActions } from '@react-navigation/native';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import MapPicker from '../components/MapPicker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../layouts/ScreenLayout';
import { API_BASE_URL } from '../apiBaseUrl';

const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';

const ADS_FORM_MAX_WIDTH = Platform.OS === 'web' ? 960 : 520;

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      activeOpacity={0.9}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function AddPropertyTopBar({ title, step, totalSteps, onBack, onCancel }) {
  const safeTotal = typeof totalSteps === 'number' && totalSteps > 0 ? totalSteps : 1;
  const safeStep = typeof step === 'number' && step > 0 ? Math.min(step, safeTotal) : 1;
  const progress = Math.round((safeStep / safeTotal) * 100);

  return (
    <View style={styles.apTopWrap}>
      <View style={styles.apHeaderRow}>
        <TouchableOpacity style={styles.apHeaderLeft} activeOpacity={0.9} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={22} color="#111418" />
        </TouchableOpacity>
        <Text style={styles.apHeaderTitle}>{title}</Text>
        <TouchableOpacity style={styles.apHeaderRight} activeOpacity={0.9} onPress={onCancel}>
          <Text style={styles.apHeaderRightText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.apProgressWrap}>
        <View style={styles.apProgressTop}>
          <Text style={styles.apProgressStep}>{`Step ${safeStep} of ${safeTotal}`}</Text>
          <Text style={styles.apProgressPercent}>{`${progress}% completed`}</Text>
        </View>
        <View style={styles.apProgressBar}>
          <View style={[styles.apProgressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </View>
  );
}

function SimpleRadioRow({ title, subtitle, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.pubRadioRow, selected && styles.pubRadioRowSelected]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.pubRadioTitle}>{title}</Text>
        <Text style={styles.pubRadioSub}>{subtitle}</Text>
      </View>
      <View style={[styles.pubRadioDotOuter, selected && styles.pubRadioDotOuterSelected]}>
        <View style={[styles.pubRadioDotInner, selected && styles.pubRadioDotInnerSelected]} />
      </View>
    </TouchableOpacity>
  );
}

function StatusOption({ icon, label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.pubStatusOption, selected && styles.pubStatusOptionSelected]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <MaterialIcons name={icon} size={20} color={selected ? '#2563eb' : '#64748b'} />
      <Text style={[styles.pubStatusLabel, selected && styles.pubStatusLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DayPill({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.dayPill, selected ? styles.dayPillOn : styles.dayPillOff]}
    >
      <Text style={[styles.dayPillText, selected ? styles.dayPillTextOn : styles.dayPillTextOff]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PrefChip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.prefChip, selected && styles.prefChipSelected]}
    >
      <Text style={[styles.prefChipText, selected && styles.prefChipTextSelected]}>{label}</Text>
      {selected ? <MaterialIcons name="check" size={18} color="#2563eb" style={{ marginLeft: 6 }} /> : null}
    </TouchableOpacity>
  );
}

function ParkingRuleOption({ label, icon, selected, onPress }) {
  return (
    <TouchableOpacity style={styles.rulesParkOptionWrap} activeOpacity={0.9} onPress={onPress}>
      <View style={[styles.rulesParkOption, selected && styles.rulesParkOptionSelected]}>
        <MaterialIcons
          name={icon}
          size={30}
          color={selected ? '#2563eb' : '#9ca3af'}
          style={styles.rulesParkIcon}
        />
        <Text style={[styles.rulesParkLabel, selected && styles.rulesParkLabelSelected]}>{label}</Text>
      </View>
      {selected ? (
        <View style={styles.rulesParkCheck}>
          <MaterialIcons name="check-circle" size={20} color="#2563eb" />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function AmenityCard({ label, icon, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.amenCard, selected && styles.amenCardSelected]}
    >
      <View style={styles.amenCardTop}>
        <View style={[styles.amenIconCircle, selected && styles.amenIconCircleSelected]}>
          <MaterialIcons name={icon} size={20} color={selected ? '#ffffff' : '#111418'} />
        </View>
        {selected ? (
          <MaterialIcons name="check-circle" size={22} color="#2563eb" />
        ) : (
          <View style={styles.amenEmptyDot} />
        )}
      </View>
      <Text style={styles.amenLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SquareOption({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.areaSquare, selected && styles.areaSquareSelected]}
    >
      <Text style={[styles.areaSquareText, selected && styles.areaSquareTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function IconInput({ iconName, placeholder, value, onChangeText, keyboardType = 'numeric', rightAffix, required }) {
  return (
    <View style={styles.rentInputWrap}>
      <MaterialIcons name={iconName} size={18} color="#9ca3af" style={styles.rentLeftIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.rentInput, !!rightAffix && styles.rentInputWithAffix]}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
      />
      {rightAffix ? (
        <View style={styles.rentRightAffixWrap}>
          <Text style={styles.rentRightAffixText}>{rightAffix}</Text>
        </View>
      ) : null}
      {required ? <Text style={styles.rentRequiredMark}>*</Text> : null}
    </View>
  );
}

export default function AdsScreen({ navigation }) {
  const categories = useMemo(
    () => [
      { id: 'flat', label: 'Flat/Apartment' },
      { id: 'house', label: 'Independent House' },
      { id: 'pg', label: 'PG/Hostel' },
      { id: 'commercial', label: 'Commercial' },
    ],
    [],
  );

  const listingTypes = useMemo(
    () => [
      { id: 'rent', label: 'For Rent' },
      { id: 'sell', label: 'For Sell' },
      { id: 'pg', label: 'For PG' },
    ],
    [],
  );

  const configs = useMemo(() => ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'], []);
  const furnishingTypes = useMemo(
    () => ['Fully Furnished', 'Semi-Furnished', 'Unfurnished'],
    [],
  );

  const [propertyName, setPropertyName] = useState('Sunset Apartments 402');
  const [propertyMode, setPropertyMode] = useState('full');
  const [category, setCategory] = useState('flat');
  const [listingType, setListingType] = useState('rent');
  const [configuration, setConfiguration] = useState('3 BHK');
  const [furnishing, setFurnishing] = useState('Semi-Furnished');
  const [totalRooms, setTotalRooms] = useState('4');
  const [floorNumber, setFloorNumber] = useState('');

  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState([]);

  const [savedAddress, setSavedAddress] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [addrFloor, setAddrFloor] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [streetName, setStreetName] = useState('');
  const [locality, setLocality] = useState('');

  const [mapRegion, setMapRegion] = useState(null);
  const [mapPin, setMapPin] = useState(null);
  const [mapLocation, setMapLocation] = useState('');

  const [carpetArea, setCarpetArea] = useState('');
  const [builtUpArea, setBuiltUpArea] = useState('');
  const [bathrooms, setBathrooms] = useState('2');
  const [balconies, setBalconies] = useState('1');

  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [electricityMode, setElectricityMode] = useState('per_unit');
  const [waterCharge, setWaterCharge] = useState('');
  const [maintenanceCharge, setMaintenanceCharge] = useState('');
  const [cleaningCharge, setCleaningCharge] = useState('');
  const [foodCharge, setFoodCharge] = useState('');
  const [rentIncrease, setRentIncrease] = useState('');
  const [bookingValidity, setBookingValidity] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [priceNegotiable, setPriceNegotiable] = useState(true);

  const [availableFrom, setAvailableFrom] = useState('Oct 24, 2023');
  const [minStayMonths, setMinStayMonths] = useState('11');
  const [lockInEnabled, setLockInEnabled] = useState(true);
  const [lockInMonths, setLockInMonths] = useState('6');

  const amenityItems = useMemo(
    () => [
      { id: 'fan', label: 'Fan', icon: 'toys' },
      { id: 'cooler', label: 'Cooler', icon: 'ac-unit' },
      { id: 'ac', label: 'AC', icon: 'ac-unit' },
      { id: 'gas', label: 'Gas', icon: 'local-fire-department' },
      { id: 'wifi', label: 'WiFi', icon: 'wifi' },
      { id: 'kitchen', label: 'Kitchen', icon: 'countertops' },
      { id: 'parking', label: 'Parking', icon: 'local-parking' },
      { id: 'laundry', label: 'Laundry', icon: 'local-laundry-service' },
    ],
    [],
  );
  const [amenityOptions, setAmenityOptions] = useState(() => amenityItems);
  const [selectedAmenities, setSelectedAmenities] = useState(['fan', 'wifi', 'parking']);
  const [amenityInputOpen, setAmenityInputOpen] = useState(false);
  const [amenityInputText, setAmenityInputText] = useState('');

  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [drinkingAllowed, setDrinkingAllowed] = useState(true);
  const [lateNightEntry, setLateNightEntry] = useState('No Restriction');
  const [visitorPolicy, setVisitorPolicy] = useState('');
  const [parkingRule, setParkingRule] = useState('car');
  const [noticeDays, setNoticeDays] = useState('');

  const tenantTypeOptions = useMemo(
    () => [
      'All',
      'Married',
      'Unmarried',
      'Working Boys',
      'Student Boys',
      'Working Girls',
      'Student Girls',
      'Small Family',
      'Full Family',
    ],
    [],
  );
  const [preferredTenantTypes, setPreferredTenantTypes] = useState(['All']);
  const [bachelorsAllowed, setBachelorsAllowed] = useState(true);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [nonVegAllowed, setNonVegAllowed] = useState(true);

  const [gatedSociety, setGatedSociety] = useState(true);
  const [cctvEnabled, setCctvEnabled] = useState(false);
  const [securityGuard, setSecurityGuard] = useState(false);

  const [contactStart, setContactStart] = useState('09:00');
  const [contactEnd, setContactEnd] = useState('18:00');
  const [contactDays, setContactDays] = useState(['M', 'T', 'W', 'T2', 'F']);
  const [visitType, setVisitType] = useState('appointment');

  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const [publishSuccessVisible, setPublishSuccessVisible] = useState(false);

  const [draftId, setDraftId] = useState(null);
  const [draftBusy, setDraftBusy] = useState(false);

  const [agreementType, setAgreementType] = useState('owner');
  const [agreementDuration, setAgreementDuration] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('available');

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const updateMapFromCoords = (lat, lng) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setMapPin({ latitude: lat, longitude: lng });
    setMapRegion((prev) => {
      const latitudeDelta = prev?.latitudeDelta ?? 0.01;
      const longitudeDelta = prev?.longitudeDelta ?? 0.01;
      return { latitude: lat, longitude: lng, latitudeDelta, longitudeDelta };
    });
    setMapLocation(`${lat},${lng}`);
  };

  const initMapLocation = async () => {
    if (mapRegion) return;
    try {
      const builtAddress = [houseNo, buildingName, streetName, locality]
        .map((x) => String(x || '').trim())
        .filter(Boolean)
        .join(', ');

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        // fallback region (India-ish) so map still renders
        const fallback = { latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.1, longitudeDelta: 0.1 };
        setMapRegion(fallback);
        setMapPin({ latitude: fallback.latitude, longitude: fallback.longitude });
        setMapLocation(`${fallback.latitude},${fallback.longitude}`);
        return;
      }

      if (builtAddress) {
        try {
          const geocoded = await Location.geocodeAsync(builtAddress);
          const first = geocoded && geocoded[0];
          if (first && Number.isFinite(first.latitude) && Number.isFinite(first.longitude)) {
            const region = { latitude: first.latitude, longitude: first.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
            setMapRegion(region);
            setMapPin({ latitude: first.latitude, longitude: first.longitude });
            setMapLocation(`${first.latitude},${first.longitude}`);
            return;
          }
        } catch (e) {
          // ignore geocode errors
        }
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos?.coords?.latitude;
      const lng = pos?.coords?.longitude;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const region = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
        setMapRegion(region);
        setMapPin({ latitude: lat, longitude: lng });
        setMapLocation(`${lat},${lng}`);
      }
    } catch (e) {
      // fallback region
      const fallback = { latitude: 28.6139, longitude: 77.209, latitudeDelta: 0.1, longitudeDelta: 0.1 };
      setMapRegion(fallback);
      setMapPin({ latitude: fallback.latitude, longitude: fallback.longitude });
      setMapLocation(`${fallback.latitude},${fallback.longitude}`);
    }
  };

  useEffect(() => {
    if (step !== 3) return;
    initMapLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const uploadPropertyImageDataUrl = async (dataUrl) => {
    const resp = await fetch(`${API_BASE_URL}/properties/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    });
    if (!resp.ok) throw new Error('UPLOAD_FAILED');
    const body = await resp.json().catch(() => ({}));
    if (!body?.url) throw new Error('UPLOAD_NO_URL');
    return body.url;
  };

  const handleAddPhotos = async () => {
    try {
      const current = Array.isArray(photos) ? photos : [];
      if (current.length >= 5) {
        Alert.alert('Photos', 'You can upload up to 5 images.');
        return;
      }

      const remaining = 5 - current.length;
      const maxBytes = 5 * 1024 * 1024;

      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.onchange = async () => {
          try {
            const files = Array.from(input.files || []).slice(0, remaining);
            if (!files.length) return;

            const nextUrls = [];
            for (const file of files) {
              if (file.size > maxBytes) {
                Alert.alert('Image too large', 'Each image must be under 5MB.');
                continue;
              }
              const reader = new FileReader();
              const dataUrl = await new Promise((resolve, reject) => {
                reader.onerror = reject;
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
              });
              if (typeof dataUrl !== 'string') continue;
              const url = await uploadPropertyImageDataUrl(dataUrl);
              nextUrls.push(url);
            }

            if (nextUrls.length) {
              setPhotos((prev) => [...(Array.isArray(prev) ? prev : []), ...nextUrls].slice(0, 5));
            }
          } catch (e) {
            Alert.alert('Photos', 'Unable to upload image(s). Please try again.');
          }
        };

        input.click();
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos to upload property images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || !result.assets.length) return;

      const nextUrls = [];
      for (const asset of result.assets.slice(0, remaining)) {
        const base64 = asset.base64 || '';
        if (!base64) {
          Alert.alert('Photos', 'Unable to read selected image. Please try another file.');
          continue;
        }
        const approxBytes = (base64.length * 3) / 4;
        if (approxBytes > maxBytes) {
          Alert.alert('Image too large', 'Each image must be under 5MB.');
          continue;
        }
        const dataUrl = `data:image/jpeg;base64,${base64}`;
        const url = await uploadPropertyImageDataUrl(dataUrl);
        nextUrls.push(url);
      }

      if (nextUrls.length) {
        setPhotos((prev) => [...(Array.isArray(prev) ? prev : []), ...nextUrls].slice(0, 5));
      }
    } catch (e) {
      Alert.alert('Photos', 'Unable to pick/upload image(s). Please try again.');
    }
  };

  const handleRemovePhoto = (idx) => {
    setPhotos((prev) => (Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : []));
  };

  const goNextFromMedia = () => {
    const count = Array.isArray(photos) ? photos.length : 0;
    if (count < 3) {
      Alert.alert('Photos', 'Please add at least 3 images for your property.');
      return;
    }
    goToStep(3);
  };

  const validateForStep = (targetStep) => {
    const nextStep = typeof targetStep === 'number' ? targetStep : step;
    const errors = [];

    const name = String(propertyName || '').trim();
    const rent = String(rentAmount || '').trim();
    const carpet = String(carpetArea || '').trim();
    const photosCount = Array.isArray(photos) ? photos.length : 0;

    if (nextStep >= 2 && !name) errors.push('Property name is required.');
    if (nextStep >= 3 && photosCount < 3) errors.push('Please add at least 3 property photos.');
    if (nextStep >= 5 && !carpet) errors.push('Carpet area is required.');
    if (nextStep >= 6 && !rent) errors.push('Monthly rent amount is required.');

    if (errors.length) {
      Alert.alert('Validation', errors.join('\n'));
      return false;
    }
    return true;
  };

  const goToStep = (targetStep) => {
    if (!validateForStep(targetStep)) return;
    setStep(targetStep);
  };

  const openPreviewValidated = () => {
    if (!validateForStep(12)) return;
    if (!navigation || typeof navigation.navigate !== 'function') return;
    navigation.navigate('PropertyPreview', { property: buildDraftPayload() });
  };

  const requestCancel = () => {
    setCancelModalVisible(true);
  };

  const cancelWithoutSaving = () => {
    setCancelModalVisible(false);
    navigateToPropertyList();
  };

  const cancelAndSaveDraft = async () => {
    try {
      await saveDraft();
    } catch (e) {}
    setCancelModalVisible(false);
    navigateToPropertyList();
  };

  const buildDraftPayload = () => {
    const mappedStatus = propertyStatus === 'available' ? 'available' : 'occupied';

    const normalizeBhk = (val) => {
      const s = String(val || '').trim();
      if (!s) return '';
      const m = s.match(/(\d+)/);
      if (m && m[1]) return `${m[1]}BHK`;
      if (/5\+/.test(s)) return '5BHK';
      return s.replace(/\s+/g, '').toUpperCase();
    };

    const normalizeFurnishing = (val) => {
      const s = String(val || '').toLowerCase();
      if (s.includes('semi')) return 'semi';
      if (s.includes('full')) return 'full';
      if (s.includes('unfurnished')) return 'unfurnished';
      if (s.includes('un')) return 'unfurnished';
      return 'semi';
    };

    const boolToPolicy = (b) => (b ? 'allowed' : 'not_allowed');
    const normalizeLateNightPolicy = (val) => {
      const s = String(val || '').toLowerCase();
      if (!s) return 'not_allowed';
      if (s.includes('no restriction') || s.includes('allowed')) return 'allowed';
      if (s.includes('not') && s.includes('allow')) return 'not_allowed';
      if (s.includes('conditional')) return 'conditional';
      return 'allowed';
    };

    const normalizeVisitorsAllowed = (val) => {
      const s = String(val || '').toLowerCase().trim();
      if (s === 'yes' || s === 'no') return s;
      if (s.includes('yes') || s.includes('allow')) return 'yes';
      return 'no';
    };

    const builtAddress = [houseNo, buildingName, streetName, locality]
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .join(', ');

    return {
      propertyName,
      category,
      listingType,
      bhk: normalizeBhk(configuration),
      furnishing: normalizeFurnishing(furnishing),
      mode: propertyMode,
      rentRoomScope: propertyMode,
      totalRooms,
      floor: floorNumber,
      address: builtAddress,
      mapLocation,
      photos,
      amenities: selectedAmenities,

      rentAmount,
      advanceAmount: depositAmount,
      electricityPerUnit: electricityMode,
      waterCharges: waterCharge,
      yearlyMaintenance: maintenanceCharge,
      cleaningCharges: cleaningCharge,
      foodCharges: foodCharge,
      yearlyIncreasePercent: rentIncrease,
      bookingValidityDays: bookingValidity,
      bookingAdvance: tokenAmount,
      priceNegotiable,

      availableFrom,
      minStayMonths,
      lockInEnabled,
      lockInMonths,

      drinksPolicy: boolToPolicy(!!drinkingAllowed),
      smokingPolicy: boolToPolicy(!!smokingAllowed),
      lateNightPolicy: normalizeLateNightPolicy(lateNightEntry),
      visitorsAllowed: normalizeVisitorsAllowed(visitorPolicy),
      parkingType: parkingRule,
      noticePeriodDays: noticeDays,

      preferredTenantTypes,
      bachelorsAllowed,
      petsAllowed,
      nonVegAllowed,

      gatedSociety,
      cctvEnabled,
      securityGuard,

      contactStart,
      contactEnd,
      contactDays,
      visitType,

      agreementDurationMonths: agreementDuration,
      agreementType,
      status: mappedStatus,
    };
  };

  const navigateToPropertyList = () => {
    try {
      if (navigation?.dispatch) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Main',
                state: {
                  index: 0,
                  routes: [{ name: 'Property' }],
                },
              },
            ],
          })
        );
        return;
      }
    } catch (e) {}

    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Main', { screen: 'Property' });
      return;
    }

    if (navigation && typeof navigation.goBack === 'function') navigation.goBack();
  };

  const saveDraft = async (options = {}) => {
    const skipBusy = !!options?.skipBusy;
    if (draftBusy && !skipBusy) return;
    if (!skipBusy) setDraftBusy(true);
    try {
      const authHeaders = await getAuthHeaders();
      const payload = buildDraftPayload();
      const url = draftId
        ? `${API_BASE_URL}/property-drafts/${draftId}`
        : `${API_BASE_URL}/property-drafts`;
      const method = draftId ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error('Failed to save draft');
      }
      const json = await resp.json();
      if (!draftId && json?._id) setDraftId(json._id);
      return json;
    } finally {
      if (!skipBusy) setDraftBusy(false);
    }
  };

  const publishFromDraft = async () => {
    if (!validateForStep(12)) return;
    if (draftBusy) return;
    setDraftBusy(true);
    try {
      const authHeaders = await getAuthHeaders();
      let effectiveDraftId = draftId;

      if (!effectiveDraftId) {
        const created = await saveDraft({ skipBusy: true });
        effectiveDraftId = created?._id;
        if (!effectiveDraftId) throw new Error('Unable to create draft. Please try again.');
      }

      const resp = await fetch(`${API_BASE_URL}/property-drafts/${effectiveDraftId}/publish`, {
        method: 'POST',
        headers: { ...authHeaders },
      });
      if (!resp.ok) {
        let msg = 'Failed to publish property';
        try {
          const body = await resp.json();
          if (body?.message) msg = body.message;
          if (body?.error) msg = `${msg}: ${body.error}`;
        } catch (e) {}
        throw new Error(msg);
      }

      setDraftId(null);
      setPublishSuccessVisible(true);
    } catch (e) {
      Alert.alert('Publish', e?.message || 'Unable to publish property. Please try again.');
    } finally {
      setDraftBusy(false);
    }
  };

  const openPreview = () => {
    if (!navigation || typeof navigation.navigate !== 'function') return;
    navigation.navigate('PropertyPreview', { property: buildDraftPayload() });
  };

  return (
    <ScreenLayout showHeader={false} contentStyle={styles.layoutContent}>
      <LinearGradient
        colors={['#DCEBFF', '#E6DBFF', '#D8E6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.root}
      >
        <Modal
          transparent
          visible={cancelModalVisible}
          animationType="fade"
          onRequestClose={() => setCancelModalVisible(false)}
        >
          <View style={styles.cancelOverlay}>
            <View style={styles.cancelCard}>
              <Text style={styles.cancelTitle}>Cancel listing?</Text>
              <Text style={styles.cancelSub}>Do you want to save this as a draft before exiting?</Text>
              <View style={styles.cancelBtns}>
                <TouchableOpacity style={styles.cancelBtnGhost} activeOpacity={0.9} onPress={cancelWithoutSaving}>
                  <Text style={styles.cancelBtnGhostText}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtnPrimary} activeOpacity={0.9} onPress={cancelAndSaveDraft}>
                  <Text style={styles.cancelBtnPrimaryText}>Yes, Save Draft</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          transparent
          visible={publishSuccessVisible}
          animationType="fade"
          onRequestClose={() => setPublishSuccessVisible(false)}
        >
          <View style={styles.cancelOverlay}>
            <View style={styles.cancelCard}>
              <Text style={styles.cancelTitle}>Your property Successfully Posted</Text>
              <Text style={styles.cancelSub}>Your listing is now saved and visible in My Property.</Text>
              <View style={styles.cancelBtns}>
                <TouchableOpacity
                  style={styles.cancelBtnPrimary}
                  activeOpacity={0.9}
                  onPress={() => {
                    setPublishSuccessVisible(false);
                    navigateToPropertyList();
                  }}
                >
                  <Text style={styles.cancelBtnPrimaryText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {step === 1 ? (
          <>
            <AddPropertyTopBar
              title="Add Property"
              step={step}
              totalSteps={12}
              onBack={() => {
                if (navigation && typeof navigation.goBack === 'function' && navigation.canGoBack?.()) {
                  navigation.goBack();
                  return;
                }
                if (navigation && typeof navigation.openDrawer === 'function') {
                  navigation.openDrawer();
                }
              }}
              onCancel={requestCancel}
            />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.headline}>
                <Text style={styles.headlineTitle}>Property Basic Information</Text>
                <Text style={styles.headlineSub}>Tell us about your property to get started.</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>Property Name</Text>
                  <TextInput
                    value={propertyName}
                    onChangeText={setPropertyName}
                    style={styles.input}
                    placeholder="e.g. 3BHK Flat in Mohali"
                    placeholderTextColor="#617289"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Property Mode</Text>
                  <View style={styles.segment}>
                    <TouchableOpacity
                      style={[styles.segmentItem, propertyMode === 'full' && styles.segmentItemActive]}
                      onPress={() => setPropertyMode('full')}
                      activeOpacity={0.9}
                    >
                      <Text
                        style={[styles.segmentText, propertyMode === 'full' && styles.segmentTextActive]}
                      >
                        Full Property
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.segmentItem, propertyMode === 'room' && styles.segmentItemActive]}
                      onPress={() => setPropertyMode('room')}
                      activeOpacity={0.9}
                    >
                      <Text
                        style={[styles.segmentText, propertyMode === 'room' && styles.segmentTextActive]}
                      >
                        Room-wise
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fieldWide}>
                  <Text style={styles.label}>Property Category</Text>
                  <View style={styles.chipsWrap}>
                    {categories.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.label}
                        selected={category === c.id}
                        onPress={() => setCategory(c.id)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.fieldWide}>
                  <Text style={styles.label}>Listing Type</Text>
                  <View style={styles.chipsWrap}>
                    {listingTypes.map((lt) => (
                      <Chip
                        key={lt.id}
                        label={lt.label}
                        selected={listingType === lt.id}
                        onPress={() => setListingType(lt.id)}
                      />
                    ))}
                  </View>
                </View>

                {propertyMode === 'full' ? (
                  <View style={styles.fieldWide}>
                    <Text style={styles.label}>Configuration</Text>
                    <View style={styles.chipsWrap}>
                      {configs.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          selected={configuration === c}
                          onPress={() => setConfiguration(c)}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={styles.fieldWide}>
                  <Text style={styles.label}>Furnishing Type</Text>
                  <View style={styles.chipsWrap}>
                    {furnishingTypes.map((f) => (
                      <Chip
                        key={f}
                        label={f}
                        selected={furnishing === f}
                        onPress={() => setFurnishing(f)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Total Rooms</Text>
                    <TextInput
                      value={totalRooms}
                      onChangeText={setTotalRooms}
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#617289"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Floor Number</Text>
                    <TextInput
                      value={floorNumber}
                      onChangeText={setFloorNumber}
                      style={styles.input}
                      placeholder="e.g. 2"
                      placeholderTextColor="#617289"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={{ height: 8 }} />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={() => goToStep(2)}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 2 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(1)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.mediaScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.mediaBody}>
                <View style={styles.mediaHeadline}>
                  <Text style={styles.mediaHeadlineTitle}>Showcase your property</Text>
                  <Text style={styles.mediaHeadlineSub}>Great photos increase tenant interest by 40%.</Text>
                </View>

                <View style={styles.mediaCard}>
                  <View style={styles.mediaCardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mediaCardTitle}>Property Photos</Text>
                      <Text style={styles.mediaCardSub}>Upload 3-5 photos. First photo is the cover.</Text>
                    </View>
                    <View style={styles.mediaCountBadge}>
                      <MaterialIcons name="check" size={12} color="#15803d" />
                      <Text style={styles.mediaCountText}>{photos.length}/5</Text>
                    </View>
                  </View>

                  <View style={styles.mediaGrid}>
                    {photos.map((uri, idx) => (
                      <View key={`${uri}-${idx}`} style={styles.mediaPhotoTile}>
                        <Image source={{ uri }} style={styles.mediaPhotoImg} />
                        <View style={styles.mediaPhotoOverlay} />
                        {idx === 0 ? (
                          <View style={styles.mediaCoverBadge}>
                            <Text style={styles.mediaCoverText}>Cover Photo</Text>
                          </View>
                        ) : null}
                        <TouchableOpacity
                          style={styles.mediaRemoveBtn}
                          activeOpacity={0.9}
                          onPress={() => handleRemovePhoto(idx)}
                        >
                          <MaterialIcons name="close" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {photos.length < 5 ? (
                      <TouchableOpacity style={styles.mediaAddSlot} activeOpacity={0.9} onPress={handleAddPhotos}>
                      <View style={styles.mediaAddIconCircle}>
                        <MaterialIcons name="add-a-photo" size={22} color="#2563eb" />
                      </View>
                      <Text style={styles.mediaAddLabel}>Add Photo</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <View style={[styles.mediaCard, { marginBottom: 0 }]}>
                  <View style={styles.mediaWalkHeader}>
                    <View style={styles.mediaWalkTitleRow}>
                      <Text style={styles.mediaCardTitle}>Property Walkthrough</Text>
                      <View style={styles.mediaOptionalBadge}>
                        <Text style={styles.mediaOptionalText}>Optional</Text>
                      </View>
                    </View>
                    <Text style={styles.mediaCardSub}>Upload a 30-60 sec video tour. Max 50MB.</Text>
                  </View>

                  <TouchableOpacity style={styles.mediaVideoBtn} activeOpacity={0.9} onPress={() => {}}>
                    <View style={styles.mediaVideoLeft}>
                      <View style={styles.mediaVideoIconCircle}>
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
              </View>
            </ScrollView>

            <View style={styles.mediaFooter}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={goNextFromMedia}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 3 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(2)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.addrScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.addrBody}>
                <View style={styles.addrTitleWrap}>
                  <Text style={styles.addrTitle}>Address & Location</Text>
                  <Text style={styles.addrSub}>Where is your property located?</Text>
                </View>

                <View style={styles.addrFieldBlock}>
                  <Text style={styles.addrLabel}>Use Saved Address</Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.addrSelect}
                    onPress={() => {
                      setSavedAddress((prev) => (prev ? '' : 'home'));
                    }}
                  >
                    <Text style={[styles.addrSelectText, !savedAddress && styles.addrSelectPlaceholder]}>
                      {savedAddress ? 'Home - 123 Main St' : 'Select from saved addresses'}
                    </Text>
                    <MaterialIcons name="expand-more" size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.addrDivider} />

                <View style={styles.addrForm}>
                  <View style={styles.addrTwoCol}>
                    <View style={styles.addrCol}>
                      <Text style={styles.addrLabel}>Flat / House No.</Text>
                      <TextInput
                        value={houseNo}
                        onChangeText={setHouseNo}
                        style={styles.addrInput}
                        placeholder="e.g. A-402"
                        placeholderTextColor="#617289"
                      />
                    </View>
                    <View style={styles.addrCol}>
                      <Text style={styles.addrLabel}>Floor</Text>
                      <TextInput
                        value={addrFloor}
                        onChangeText={setAddrFloor}
                        style={styles.addrInput}
                        placeholder="e.g. 4"
                        placeholderTextColor="#617289"
                      />
                    </View>
                  </View>

                  <View style={styles.addrCol}>
                    <Text style={styles.addrLabel}>Building / Tower Name</Text>
                    <TextInput
                      value={buildingName}
                      onChangeText={setBuildingName}
                      style={styles.addrInput}
                      placeholder="e.g. Sunshine Heights"
                      placeholderTextColor="#617289"
                    />
                  </View>

                  <View style={styles.addrCol}>
                    <Text style={styles.addrLabel}>Street / Road Name</Text>
                    <TextInput
                      value={streetName}
                      onChangeText={setStreetName}
                      style={styles.addrInput}
                      placeholder="Street, Road, or Landmark"
                      placeholderTextColor="#617289"
                    />
                  </View>

                  <View style={styles.addrCol}>
                    <Text style={styles.addrLabel}>Society / Area / Locality</Text>
                    <View style={styles.addrSearchWrap}>
                      <MaterialIcons name="search" size={20} color="#6b7280" style={styles.addrSearchIcon} />
                      <TextInput
                        value={locality}
                        onChangeText={setLocality}
                        style={styles.addrSearchInput}
                        placeholder="Search Area..."
                        placeholderTextColor="#617289"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.addrMapSection}>
                  <View style={styles.addrMapTop}>
                    <Text style={styles.addrLabel}>Pin Location</Text>
                    <TouchableOpacity activeOpacity={0.9} onPress={() => {}}>
                      <Text style={styles.addrEditPin}>Edit Pin Location</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addrMapBox}>
                    {mapRegion ? (
                      <MapPicker
                        style={styles.addrMapImg}
                        region={mapRegion}
                        pin={mapPin}
                        onPick={(lat, lng) => updateMapFromCoords(lat, lng)}
                        onRegionChange={(r) => setMapRegion(r)}
                      />
                    ) : (
                      <View style={[styles.addrMapImg, { alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ color: '#6b7280', fontWeight: '600' }}>Loading map…</Text>
                      </View>
                    )}
                    <View style={styles.addrMapHelper}>
                      <Text style={styles.addrMapHelperText}>Drag map to pin exact entrance</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.addrFooter}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={() => goToStep(4)}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 4 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(3)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.areaScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.areaBody}>
                <View style={styles.areaHeadline}>
                  <Text style={styles.areaHeadlineTitle}>Property measurements</Text>
                  <Text style={styles.areaHeadlineSub}>
                    Provide accurate measurements and configuration details to help potential tenants visualize the space.
                  </Text>
                </View>

                <View style={styles.areaForm}>
                  <View style={styles.areaField}>
                    <Text style={styles.areaLabel}>
                      Carpet Area <Text style={{ color: '#2563eb' }}>*</Text>
                    </Text>
                    <View style={styles.areaInputWrap}>
                      <TextInput
                        value={carpetArea}
                        onChangeText={setCarpetArea}
                        style={styles.areaInput}
                        placeholder="e.g. 1200"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                      />
                      <View style={styles.areaUnitWrap}>
                        <Text style={styles.areaUnitText}>sq.ft</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.areaField}>
                    <View style={styles.areaLabelRow}>
                      <Text style={styles.areaLabel}>Built-up Area</Text>
                      <View style={styles.areaOptionalBadge}>
                        <Text style={styles.areaOptionalText}>Optional</Text>
                      </View>
                    </View>
                    <View style={styles.areaInputWrap}>
                      <TextInput
                        value={builtUpArea}
                        onChangeText={setBuiltUpArea}
                        style={styles.areaInput}
                        placeholder="e.g. 1450"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                      />
                      <View style={styles.areaUnitWrap}>
                        <Text style={styles.areaUnitText}>sq.ft</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.areaDivider} />

                  <View style={styles.areaFieldWide}>
                    <Text style={styles.areaLabel}>Number of Bathrooms</Text>
                    <View style={styles.areaSquaresWrap}>
                      {['1', '2', '3', '4', '5+'].map((b) => (
                        <SquareOption key={b} label={b} selected={bathrooms === b} onPress={() => setBathrooms(b)} />
                      ))}
                    </View>
                  </View>

                  <View style={styles.areaFieldWide}>
                    <Text style={styles.areaLabel}>Number of Balconies</Text>
                    <View style={styles.areaSquaresWrap}>
                      {['0', '1', '2', '3', '3+'].map((b) => (
                        <SquareOption key={b} label={b} selected={balconies === b} onPress={() => setBalconies(b)} />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.areaFooter}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={() => goToStep(5)}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 5 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(4)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.rentScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.rentSection}>
                <Text style={styles.rentSectionTitle}>Core Financials</Text>
                <View style={styles.rentCard}>
                  <View style={styles.rentField}>
                    <View style={styles.rentFieldLabelRow}>
                      <Text style={styles.rentLabel}>
                        Monthly Rent Amount <Text style={styles.rentRequiredMark}>*</Text>
                      </Text>
                    </View>
                    <IconInput
                      iconName="currency-rupee"
                      placeholder="e.g. 15,000"
                      value={rentAmount}
                      onChangeText={setRentAmount}
                      required
                    />
                  </View>

                  <View style={styles.rentField}>
                    <Text style={styles.rentLabel}>Security Deposit</Text>
                    <IconInput
                      iconName="lock"
                      placeholder="e.g. 50,000"
                      value={depositAmount}
                      onChangeText={setDepositAmount}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.rentSection}>
                <Text style={styles.rentSectionTitle}>Utilities & Maintenance</Text>
                <View style={styles.rentCardLarge}>
                  <View style={styles.rentField}>
                    <Text style={styles.rentLabel}>Electricity Charges</Text>
                    <View style={styles.rentSegment}>
                      <TouchableOpacity
                        style={[styles.rentSegmentBtn, electricityMode === 'per_unit' && styles.rentSegmentBtnActive]}
                        activeOpacity={0.9}
                        onPress={() => setElectricityMode('per_unit')}
                      >
                        <Text
                          style={[
                            styles.rentSegmentText,
                            electricityMode === 'per_unit' && styles.rentSegmentTextActive,
                          ]}
                        >
                          Per Unit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rentSegmentBtn, electricityMode === 'included' && styles.rentSegmentBtnActive]}
                        activeOpacity={0.9}
                        onPress={() => setElectricityMode('included')}
                      >
                        <Text
                          style={[
                            styles.rentSegmentText,
                            electricityMode === 'included' && styles.rentSegmentTextActive,
                          ]}
                        >
                          Included
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.rentTwoCol}>
                    <View style={styles.rentCol}>
                      <Text style={styles.rentLabel}>Water</Text>
                      <IconInput
                        iconName="water-drop"
                        placeholder="₹ 0"
                        value={waterCharge}
                        onChangeText={setWaterCharge}
                      />
                    </View>
                    <View style={styles.rentCol}>
                      <Text style={styles.rentLabel}>Maintenance/Yr</Text>
                      <IconInput
                        iconName="engineering"
                        placeholder="₹ 0"
                        value={maintenanceCharge}
                        onChangeText={setMaintenanceCharge}
                      />
                    </View>
                  </View>

                  <View style={styles.rentTwoCol}>
                    <View style={styles.rentCol}>
                      <Text style={styles.rentLabel}>Cleaning</Text>
                      <IconInput
                        iconName="cleaning-services"
                        placeholder="₹ 0"
                        value={cleaningCharge}
                        onChangeText={setCleaningCharge}
                      />
                    </View>
                    <View style={styles.rentCol}>
                      <Text style={styles.rentLabel}>Food (PG)</Text>
                      <IconInput
                        iconName="restaurant"
                        placeholder="₹ 0"
                        value={foodCharge}
                        onChangeText={setFoodCharge}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.rentSection, { paddingBottom: 16 }]}>
                <Text style={styles.rentSectionTitle}>Lease Terms</Text>
                <View style={styles.rentCard}>
                  <View style={styles.rentTwoCol}>
                    <View style={styles.rentCol}>
                      <Text style={styles.rentLabel}>Rent Increase</Text>
                      <Text style={styles.rentHint}>(after 11 mo)</Text>
                      <View style={styles.rentInputPlainWrap}>
                        <TextInput
                          value={rentIncrease}
                          onChangeText={setRentIncrease}
                          style={[styles.rentPlainInput, styles.rentPlainWithAffix]}
                          placeholder="5"
                          placeholderTextColor="#9ca3af"
                          keyboardType="numeric"
                        />
                        <Text style={styles.rentPlainAffix}>%</Text>
                      </View>
                    </View>
                    <View style={styles.rentCol}>
                      <Text style={styles.rentLabel}>Booking Validity</Text>
                      <Text style={styles.rentHint}>(token expiration)</Text>
                      <View style={styles.rentInputPlainWrap}>
                        <TextInput
                          value={bookingValidity}
                          onChangeText={setBookingValidity}
                          style={[styles.rentPlainInput, styles.rentPlainWithAffix]}
                          placeholder="7"
                          placeholderTextColor="#9ca3af"
                          keyboardType="numeric"
                        />
                        <Text style={styles.rentPlainAffix}>Days</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.rentField}>
                    <Text style={styles.rentLabel}>Advance Booking Token Amount</Text>
                    <IconInput
                      iconName="payments"
                      placeholder="e.g. 2,000"
                      value={tokenAmount}
                      onChangeText={setTokenAmount}
                    />
                  </View>

                  <View style={styles.rentDivider} />

                  <View style={styles.rentToggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rentToggleTitle}>Price Negotiable</Text>
                      <Text style={styles.rentToggleSub}>Can tenants bargain on rent?</Text>
                    </View>
                    <Switch
                      value={priceNegotiable}
                      onValueChange={setPriceNegotiable}
                      trackColor={{ false: '#e5e7eb', true: '#2563eb' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>
              </View>

              <View style={{ height: 12 }} />
            </ScrollView>

            <View style={styles.rentFooter}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={() => goToStep(6)}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 6 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(5)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.availScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.availBody}>
                <View style={styles.availIntro}>
                  <Text style={styles.availIntroTitle}>Lease Details</Text>
                  <Text style={styles.availIntroSub}>Set the timeline and terms for your property rental.</Text>
                </View>

                <View style={styles.availCard}>
                  <View style={styles.availCardHead}>
                    <View style={styles.availIconCircle}>
                      <MaterialIcons name="calendar-month" size={18} color="#2563eb" />
                    </View>
                    <Text style={styles.availCardTitle}>Availability</Text>
                  </View>

                  <View style={styles.availField}>
                    <Text style={styles.availLabel}>Available From</Text>
                    <TouchableOpacity style={styles.availDateInput} activeOpacity={0.9} onPress={() => {}}>
                      <Text style={styles.availDateText}>{availableFrom || 'Select Date'}</Text>
                      <MaterialIcons name="event" size={22} color="#2563eb" />
                    </TouchableOpacity>
                    <Text style={styles.availHelper}>Tenants can move in starting from this date.</Text>
                  </View>
                </View>

                <View style={styles.availCard}>
                  <View style={styles.availCardHead}>
                    <View style={styles.availIconCircle}>
                      <MaterialIcons name="schedule" size={18} color="#2563eb" />
                    </View>
                    <Text style={styles.availCardTitle}>Duration Terms</Text>
                  </View>

                  <View style={styles.availField}>
                    <Text style={styles.availLabel}>Minimum Stay Duration</Text>
                    <View style={styles.availMinStayRow}>
                      <View style={styles.availMinStayInputWrap}>
                        <TextInput
                          value={minStayMonths}
                          onChangeText={setMinStayMonths}
                          style={styles.availMinStayInput}
                          placeholder="e.g. 11"
                          placeholderTextColor="#94a3b8"
                          keyboardType="numeric"
                        />
                        <Text style={styles.availMinStayAffix}>Months</Text>
                      </View>
                      <View style={styles.availStepper}>
                        <TouchableOpacity
                          style={styles.availStepBtn}
                          activeOpacity={0.9}
                          onPress={() => {
                            const n = parseInt(minStayMonths || '0', 10);
                            setMinStayMonths(String(Math.max(0, (Number.isFinite(n) ? n : 0) - 1)));
                          }}
                        >
                          <MaterialIcons name="remove" size={20} color="#64748b" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.availStepBtn}
                          activeOpacity={0.9}
                          onPress={() => {
                            const n = parseInt(minStayMonths || '0', 10);
                            setMinStayMonths(String((Number.isFinite(n) ? n : 0) + 1));
                          }}
                        >
                          <MaterialIcons name="add" size={20} color="#2563eb" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.availHelper}>Standard leases are usually 11 or 12 months.</Text>
                  </View>

                  <View style={styles.availDivider} />

                  <View style={styles.availToggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.availToggleTitle}>Lock-in Period</Text>
                      <Text style={styles.availToggleSub}>Is there a mandatory stay period?</Text>
                    </View>
                    <Switch
                      value={lockInEnabled}
                      onValueChange={setLockInEnabled}
                      trackColor={{ false: '#e2e8f0', true: '#2563eb' }}
                      thumbColor="#ffffff"
                    />
                  </View>

                  {lockInEnabled ? (
                    <View style={styles.availLockInBox}>
                      <Text style={styles.availLabel}>Lock-in Duration</Text>
                      <View style={styles.availMinStayInputWrap}>
                        <TextInput
                          value={lockInMonths}
                          onChangeText={setLockInMonths}
                          style={styles.availMinStayInput}
                          placeholder="e.g. 6"
                          placeholderTextColor="#94a3b8"
                          keyboardType="numeric"
                        />
                        <Text style={styles.availMinStayAffix}>Months</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={{ height: 8 }} />
              </View>
            </ScrollView>

            <View style={styles.availFooter}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={() => goToStep(7)}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 7 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(6)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.amenScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.amenBody}>
                <View style={styles.amenHeadline}>
                  <Text style={styles.amenHeadlineTitle}>What amenities do you provide?</Text>
                  <Text style={styles.amenHeadlineSub}>
                    Select all the facilities available to the tenant to attract better leads.
                  </Text>
                </View>

                <View style={styles.amenTagWrap}>
                  {amenityOptions.map((a) => {
                    const active = selectedAmenities.includes(a.id);
                    return (
                      <TouchableOpacity
                        key={a.id}
                        style={[styles.amenTag, active && styles.amenTagSelected]}
                        activeOpacity={0.9}
                        onPress={() => {
                          setSelectedAmenities((prev) =>
                            prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id],
                          );
                        }}
                      >
                        <Text style={[styles.amenTagText, active && styles.amenTagTextSelected]}>{a.label}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.amenAddTag}
                    activeOpacity={0.9}
                    onPress={() => setAmenityInputOpen((prev) => !prev)}
                  >
                    <MaterialIcons name="add" size={18} color="#2563eb" />
                    <Text style={styles.amenAddTagText}>Add amenity</Text>
                  </TouchableOpacity>
                </View>

                {amenityInputOpen ? (
                  <View style={styles.amenAddInputRow}>
                    <TextInput
                      value={amenityInputText}
                      onChangeText={setAmenityInputText}
                      style={styles.amenAddInput}
                      placeholder="e.g. Gym, Lift, Swimming Pool"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="words"
                    />
                    <TouchableOpacity
                      style={styles.amenAddBtn}
                      activeOpacity={0.9}
                      onPress={() => {
                        const parts = amenityInputText
                          .split(',')
                          .map((x) => x.trim())
                          .filter(Boolean);

                        if (!parts.length) return;

                        setAmenityOptions((prev) => {
                          const existingLabels = new Set(prev.map((x) => x.label.toLowerCase()));
                          const next = [...prev];

                          parts.forEach((label) => {
                            const lower = label.toLowerCase();
                            if (existingLabels.has(lower)) return;

                            const id = `custom_${lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
                            next.push({ id, label, icon: 'check' });
                            existingLabels.add(lower);
                          });

                          return next;
                        });

                        setSelectedAmenities((prev) => {
                          const existing = new Set(prev);
                          const toAdd = parts
                            .map((label) => label.toLowerCase())
                            .map((lower) => `custom_${lower.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`)
                            .filter((id) => !existing.has(id));
                          return toAdd.length ? [...prev, ...toAdd] : prev;
                        });

                        setAmenityInputText('');
                        setAmenityInputOpen(false);
                      }}
                    >
                      <Text style={styles.amenAddBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.amenFooter}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={() => goToStep(8)}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 8 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(7)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.rulesScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.rulesProgressBlock}>
                <Text style={styles.rulesTitle}>Tenant Rules & Preferences</Text>
                <Text style={styles.rulesSub}>
                  Set clear expectations for future tenants regarding lifestyle and property usage.
                </Text>
              </View>

              <View style={styles.rulesDivider} />

              <View style={styles.rulesSection}>
                <Text style={styles.rulesSectionTitle}>Behaviour Preferences</Text>

                <View style={styles.rulesToggleCard}>
                  <View style={styles.rulesToggleLeft}>
                    <View style={styles.rulesToggleIconBox}>
                      <MaterialIcons name="smoke-free" size={22} color="#6b7280" />
                    </View>
                    <View style={styles.rulesToggleTextCol}>
                      <Text style={styles.rulesToggleLabel}>Smoking Allowed</Text>
                      <Text style={styles.rulesToggleHint}>Includes e-cigarettes</Text>
                    </View>
                  </View>
                  <Switch
                    value={smokingAllowed}
                    onValueChange={setSmokingAllowed}
                    trackColor={{ false: '#e5e7eb', true: '#2563eb' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={styles.rulesToggleCard}>
                  <View style={styles.rulesToggleLeft}>
                    <View style={styles.rulesToggleIconBox}>
                      <MaterialIcons name="wine-bar" size={22} color="#6b7280" />
                    </View>
                    <View style={styles.rulesToggleTextCol}>
                      <Text style={styles.rulesToggleLabel}>Drinking Allowed</Text>
                      <Text style={styles.rulesToggleHint}>Responsible consumption</Text>
                    </View>
                  </View>
                  <Switch
                    value={drinkingAllowed}
                    onValueChange={setDrinkingAllowed}
                    trackColor={{ false: '#e5e7eb', true: '#2563eb' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              <View style={[styles.rulesSection, { marginTop: 16 }]}> 
                <Text style={styles.rulesSectionTitle}>Entry & Visitors</Text>

                <View style={styles.rulesField}>
                  <Text style={styles.rulesFieldLabel}>Late Night Entry</Text>
                  <TouchableOpacity
                    style={styles.rulesSelect}
                    activeOpacity={0.9}
                    onPress={() => {
                      const values = ['No Restriction', 'Before 10:00 PM', 'Before 11:00 PM', 'Before 12:00 AM'];
                      const idx = Math.max(0, values.indexOf(lateNightEntry));
                      setLateNightEntry(values[(idx + 1) % values.length]);
                    }}
                  >
                    <Text style={styles.rulesSelectText}>{lateNightEntry}</Text>
                    <MaterialIcons name="expand-more" size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.rulesField}>
                  <Text style={styles.rulesFieldLabel}>Visitor Policy</Text>
                  <TextInput
                    value={visitorPolicy}
                    onChangeText={setVisitorPolicy}
                    style={styles.rulesTextArea}
                    placeholder="e.g. No overnight guests allowed without prior notice..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={[styles.rulesSection, { marginTop: 16 }]}>
                <Text style={styles.rulesSectionTitle}>Parking Rules</Text>
                <View style={styles.rulesParkGrid}>
                  <ParkingRuleOption
                    label="No Parking"
                    icon="block"
                    selected={parkingRule === 'none'}
                    onPress={() => setParkingRule('none')}
                  />
                  <ParkingRuleOption
                    label="Bike Only"
                    icon="pedal-bike"
                    selected={parkingRule === 'bike'}
                    onPress={() => setParkingRule('bike')}
                  />
                  <ParkingRuleOption
                    label="Car Only"
                    icon="directions-car"
                    selected={parkingRule === 'car'}
                    onPress={() => setParkingRule('car')}
                  />
                  <ParkingRuleOption
                    label="Bike & Car"
                    icon="commute"
                    selected={parkingRule === 'both'}
                    onPress={() => setParkingRule('both')}
                  />
                </View>
              </View>

              <View style={[styles.rulesSection, { marginTop: 16, paddingBottom: 24 }]}>
                <Text style={styles.rulesSectionTitle}>Notice Period to Vacate</Text>
                <View style={styles.rulesNoticeInputWrap}>
                  <View style={styles.rulesNoticeLeftIcon}>
                    <MaterialIcons name="calendar-month" size={22} color="#6b7280" />
                  </View>
                  <TextInput
                    value={noticeDays}
                    onChangeText={setNoticeDays}
                    style={styles.rulesNoticeInput}
                    placeholder="30"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                  <View style={styles.rulesNoticeSuffix}>
                    <Text style={styles.rulesNoticeSuffixText}>Days</Text>
                  </View>
                </View>
                <Text style={styles.rulesHelper}>Minimum notice required from the tenant before leaving.</Text>
              </View>
            </ScrollView>

            <View style={styles.rulesFooter}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={() => goToStep(9)}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 9 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(8)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.prefScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.prefSection}>
                <Text style={styles.prefH2}>Who are you looking for?</Text>
                <Text style={styles.prefP}>Select the type of tenants you prefer for your property.</Text>

                <View style={styles.prefChipWrap}>
                  {tenantTypeOptions.map((opt) => {
                    const selected = preferredTenantTypes.includes(opt);
                    return (
                      <PrefChip
                        key={opt}
                        label={opt}
                        selected={selected}
                        onPress={() => {
                          setPreferredTenantTypes((prev) => {
                            if (opt === 'All') return ['All'];
                            const next = prev.filter((x) => x !== 'All');
                            return next.includes(opt) ? next.filter((x) => x !== opt) : [...next, opt];
                          });
                        }}
                      />
                    );
                  })}
                </View>
              </View>

              <View style={styles.prefSection2}>
                <Text style={styles.prefH3}>House Rules</Text>

                <View style={styles.prefRuleRow}>
                  <View style={styles.prefRuleLeft}>
                    <Text style={styles.prefRuleTitle}>Bachelors Allowed</Text>
                    <Text style={styles.prefRuleSub}>Allow single tenants to rent</Text>
                  </View>
                  <Switch
                    value={bachelorsAllowed}
                    onValueChange={setBachelorsAllowed}
                    trackColor={{ false: '#e5e7eb', true: '#2563eb' }}
                    thumbColor="#ffffff"
                  />
                </View>
                <View style={styles.prefRuleDivider} />

                <View style={styles.prefRuleRow}>
                  <View style={styles.prefRuleLeft}>
                    <Text style={styles.prefRuleTitle}>Pets Allowed</Text>
                    <Text style={styles.prefRuleSub}>Cats, dogs, or other pets</Text>
                  </View>
                  <Switch
                    value={petsAllowed}
                    onValueChange={setPetsAllowed}
                    trackColor={{ false: '#e5e7eb', true: '#2563eb' }}
                    thumbColor="#ffffff"
                  />
                </View>
                <View style={styles.prefRuleDivider} />

                <View style={styles.prefRuleRow}>
                  <View style={styles.prefRuleLeft}>
                    <Text style={styles.prefRuleTitle}>Non-Veg Allowed</Text>
                    <Text style={styles.prefRuleSub}>Cooking or consuming non-veg food</Text>
                  </View>
                  <Switch
                    value={nonVegAllowed}
                    onValueChange={setNonVegAllowed}
                    trackColor={{ false: '#e5e7eb', true: '#2563eb' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.prefFooter}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={() => goToStep(10)}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 10 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(9)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.secScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.secBody}>
                <View style={styles.secHeadline}>
                  <Text style={styles.secH2}>Security & Verification</Text>
                  <Text style={styles.secP}>
                    Verified properties get <Text style={styles.secPStrong}>3x more views</Text>. Add security details to build trust.
                  </Text>
                </View>

                <View style={styles.secCard}>
                  <View style={styles.secCardHead}>
                    <MaterialIcons name="verified-user" size={20} color="#2563eb" />
                    <Text style={styles.secCardTitle}>Ownership Proof</Text>
                    <View style={styles.secOptionalPill}>
                      <Text style={styles.secOptionalText}>Optional</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.secUploadBox} activeOpacity={0.9} onPress={() => {}}>
                    <View style={styles.secUploadIconCircle}>
                      <MaterialIcons name="cloud-upload" size={30} color="#2563eb" />
                    </View>
                    <View style={styles.secUploadTextCol}>
                      <Text style={styles.secUploadTitle}>Upload Deed or Electricity Bill</Text>
                      <Text style={styles.secUploadSub}>Supported formats: PDF, JPG, PNG (Max 5MB)</Text>
                    </View>
                    <View style={styles.secBrowseBtn}>
                      <Text style={styles.secBrowseText}>Browse Files</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.secSectionLabel}>Amenities & Safety</Text>
                <View style={styles.secListCard}>
                  <View style={[styles.secListRow, styles.secListRowFirst]}>
                    <View style={styles.secListLeft}>
                      <View style={[styles.secIconSquare, styles.secIconOrange]}>
                        <MaterialIcons name="fence" size={20} color="#ea580c" />
                      </View>
                      <View style={styles.secListTextCol}>
                        <Text style={styles.secListTitle}>Gated Society</Text>
                        <Text style={styles.secListSub}>Controlled entrance for residents</Text>
                      </View>
                    </View>
                    <Switch
                      value={gatedSociety}
                      onValueChange={setGatedSociety}
                      trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
                      thumbColor="#ffffff"
                    />
                  </View>

                  <View style={styles.secListRow}>
                    <View style={styles.secListLeft}>
                      <View style={[styles.secIconSquare, styles.secIconBlue]}>
                        <MaterialIcons name="videocam" size={20} color="#2563eb" />
                      </View>
                      <View style={styles.secListTextCol}>
                        <Text style={styles.secListTitle}>CCTV Surveillance</Text>
                        <Text style={styles.secListSub}>24/7 video monitoring available</Text>
                      </View>
                    </View>
                    <Switch
                      value={cctvEnabled}
                      onValueChange={setCctvEnabled}
                      trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
                      thumbColor="#ffffff"
                    />
                  </View>

                  <View style={styles.secListRow}>
                    <View style={styles.secListLeft}>
                      <View style={[styles.secIconSquare, styles.secIconGreen]}>
                        <MaterialIcons name="local-police" size={20} color="#16a34a" />
                      </View>
                      <View style={styles.secListTextCol}>
                        <Text style={styles.secListTitle}>Security Guard</Text>
                        <Text style={styles.secListSub}>On-site physical security personnel</Text>
                      </View>
                    </View>
                    <Switch
                      value={securityGuard}
                      onValueChange={setSecurityGuard}
                      trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.secFooter}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={() => goToStep(11)}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 11 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(10)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.vcScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.vcBody}>

              <View style={styles.vcTitleBlock}>
                <Text style={styles.vcH1}>Visit & Contact Preferences</Text>
                <Text style={styles.vcSub}>
                  Let potential tenants know when they can reach you and how they can view the property.
                </Text>
              </View>

              <View style={styles.vcSection}>
                <Text style={styles.vcSectionTitle}>Preferred Contact Time</Text>
                <View style={styles.vcCard}>
                  <View style={styles.vcTimeRow}>
                    <View style={styles.vcTimeCol}>
                      <Text style={styles.vcFieldLabel}>Start Time</Text>
                      <TextInput
                        value={contactStart}
                        onChangeText={setContactStart}
                        style={styles.vcTimeInput}
                        placeholder="09:00"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <Text style={styles.vcDash}>-</Text>
                    <View style={styles.vcTimeCol}>
                      <Text style={styles.vcFieldLabel}>End Time</Text>
                      <TextInput
                        value={contactEnd}
                        onChangeText={setContactEnd}
                        style={styles.vcTimeInput}
                        placeholder="18:00"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  <View style={styles.vcDaysWrap}>
                    <Text style={styles.vcFieldLabel}>Available Days</Text>
                    <View style={styles.vcDaysRow}>
                      {[
                        { id: 'M', label: 'M' },
                        { id: 'T', label: 'T' },
                        { id: 'W', label: 'W' },
                        { id: 'T2', label: 'T' },
                        { id: 'F', label: 'F' },
                        { id: 'S', label: 'S' },
                        { id: 'S2', label: 'S' },
                      ].map((d) => {
                        const on = contactDays.includes(d.id);
                        return (
                          <DayPill
                            key={d.id}
                            label={d.label}
                            selected={on}
                            onPress={() => {
                              setContactDays((prev) =>
                                prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id],
                              );
                            }}
                          />
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.vcSection, { marginTop: 16, paddingBottom: 24 }]}>
                <Text style={styles.vcSectionTitle}>Property Visit Type</Text>
                <View style={styles.vcRadioStack}>
                  <TouchableOpacity
                    style={[styles.vcRadioCard, visitType === 'appointment' && styles.vcRadioCardOn]}
                    activeOpacity={0.9}
                    onPress={() => setVisitType('appointment')}
                  >
                    <View style={[styles.vcRadioIcon, visitType === 'appointment' && styles.vcRadioIconOn]}>
                      <MaterialIcons name="lock-clock" size={20} color={visitType === 'appointment' ? '#2563eb' : '#64748b'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.vcRadioTitleRow}>
                        <Text style={styles.vcRadioTitle}>Appointment Required</Text>
                        {visitType === 'appointment' ? (
                          <MaterialIcons name="check-circle" size={20} color="#2563eb" />
                        ) : (
                          <MaterialIcons name="check-circle" size={20} color="transparent" />
                        )}
                      </View>
                      <Text style={styles.vcRadioDesc}>
                        Tenants must request a time slot to visit the property. You approve each visit.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.vcRadioCard, visitType === 'open' && styles.vcRadioCardOn]}
                    activeOpacity={0.9}
                    onPress={() => setVisitType('open')}
                  >
                    <View style={[styles.vcRadioIcon, visitType === 'open' && styles.vcRadioIconOn]}>
                      <MaterialIcons name="meeting-room" size={20} color={visitType === 'open' ? '#2563eb' : '#64748b'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.vcRadioTitleRow}>
                        <Text style={styles.vcRadioTitle}>Open Visit</Text>
                        {visitType === 'open' ? (
                          <MaterialIcons name="check-circle" size={20} color="#2563eb" />
                        ) : (
                          <MaterialIcons name="check-circle" size={20} color="transparent" />
                        )}
                      </View>
                      <Text style={styles.vcRadioDesc}>
                        Tenants can visit freely during the hours specified above without prior approval.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            </ScrollView>

            <View style={styles.vcFooter}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerNextBtn} activeOpacity={0.9} onPress={() => goToStep(12)}>
                  <Text style={styles.footerNextText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : step === 12 ? (
          <>
            <AddPropertyTopBar title="Add Property" step={step} totalSteps={12} onBack={() => setStep(11)} onCancel={requestCancel} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.pubScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.pubBody}>
                <View style={styles.pubCard}>
                  <View style={styles.pubCardHead}>
                    <View style={styles.pubIconBadge}>
                      <MaterialIcons name="description" size={22} color="#2563eb" />
                    </View>
                    <Text style={styles.pubCardTitle}>Rental Agreement</Text>
                  </View>
                  <Text style={styles.pubCardHint}>Who will manage the legal paperwork?</Text>

                  <View style={styles.pubRadioStack}>
                    <SimpleRadioRow
                      title="Owner Managed"
                      subtitle="You handle the agreement yourself"
                      selected={agreementType === 'owner'}
                      onPress={() => setAgreementType('owner')}
                    />
                    <SimpleRadioRow
                      title="App Assisted"
                      subtitle="We generate the paperwork for you"
                      selected={agreementType === 'app'}
                      onPress={() => setAgreementType('app')}
                    />
                  </View>

                  <View style={styles.pubField}>
                    <Text style={styles.pubFieldLabel}>Agreement Duration</Text>
                    <View style={styles.pubInputWrap}>
                      <TextInput
                        value={agreementDuration}
                        onChangeText={setAgreementDuration}
                        style={styles.pubInput}
                        placeholder="12"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                      />
                      <Text style={styles.pubInputAffix}>Months</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.pubCard}>
                  <View style={styles.pubCardHead}>
                    <View style={styles.pubIconBadge}>
                      <MaterialIcons name="calendar-month" size={22} color="#2563eb" />
                    </View>
                    <Text style={styles.pubCardTitle}>Availability</Text>
                  </View>
                  <Text style={styles.pubCardHint}>Set the initial status of your property listing.</Text>

                  <View style={styles.pubStatusGrid}>
                    <StatusOption
                      icon="check-circle"
                      label="Available"
                      selected={propertyStatus === 'available'}
                      onPress={() => setPropertyStatus('available')}
                    />
                    <StatusOption
                      icon="bookmark"
                      label="Booked"
                      selected={propertyStatus === 'booked'}
                      onPress={() => setPropertyStatus('booked')}
                    />
                    <StatusOption
                      icon="key"
                      label="Rented"
                      selected={propertyStatus === 'rented'}
                      onPress={() => setPropertyStatus('rented')}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.pubPreviewBtn} activeOpacity={0.9} onPress={openPreviewValidated}>
                  <MaterialIcons name="visibility" size={20} color="#111418" />
                  <Text style={styles.pubPreviewText}>Preview Property</Text>
                </TouchableOpacity>

                <Text style={styles.pubTermsText}>
                  By publishing, you agree to our Terms of Service and Privacy Policy.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.pubFooter}>
              <View style={styles.pubFooterRow}>
                <TouchableOpacity style={styles.footerDraftBtn} activeOpacity={0.9} onPress={saveDraft}>
                  <Text style={styles.footerDraftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pubFooterPublish} activeOpacity={0.9} onPress={publishFromDraft}>
                  <Text style={styles.pubFooterPublishText}>Publish</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : null}
      </LinearGradient>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  layoutContent: { paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent' },
  root: { flex: 1 },
  apTopWrap: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17, 24, 39, 0.08)',
  },
  apHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  apHeaderLeft: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  apHeaderRight: { width: 56, alignItems: 'flex-end', justifyContent: 'center', height: 40 },
  apHeaderRightText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  apProgressWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  apProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  apProgressStep: { fontSize: 12, fontWeight: '700', color: '#111827' },
  apProgressPercent: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  apProgressBar: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  apProgressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 999 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17, 24, 39, 0.08)',
    backgroundColor: 'transparent',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerHelpBtn: { width: 56, alignItems: 'flex-end', justifyContent: 'center', height: 40 },
  headerHelpText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  progressWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  progressStep: { fontSize: 12, fontWeight: '700', color: '#111827' },
  progressPercent: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  progressBar: { height: 6, width: '100%', backgroundColor: 'rgba(37, 99, 235, 0.18)', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', width: '8%', backgroundColor: '#2563eb', borderRadius: 999 },
  progressHint: { marginTop: 6, fontSize: 13, color: '#6b7280', fontWeight: '600' },

  headline: { paddingHorizontal: 16, paddingBottom: 8 },
  headlineTitle: { fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: 0 },
  headlineSub: { marginTop: 4, fontSize: 12, fontWeight: '600', color: '#6b7280' },

  form: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 18 },
  field: { gap: 8 },
  fieldWide: { gap: 12 },
  label: { fontSize: 12, fontWeight: '700', color: '#111827' },
  input: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.18)',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#111827',
  },

  segment: { flexDirection: 'row', padding: 4, backgroundColor: 'rgba(255, 255, 255, 0.55)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(17, 24, 39, 0.10)' },
  segmentItem: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  segmentTextActive: { color: '#111827', fontWeight: '800' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbe0e6',
    backgroundColor: '#ffffff',
  },
  chipSelected: { borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.10)' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#617289' },
  chipTextSelected: { fontWeight: '700', color: '#2563eb' },

  twoCol: { flexDirection: 'row', gap: 16 },
  flex1: { flex: 1, gap: 8 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  footerBackBtn: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBackText: { fontSize: 14, fontWeight: '800', color: '#111418' },
  footerCancelBtn: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCancelText: { fontSize: 14, fontWeight: '800', color: '#111418' },
  footerDraftBtn: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerDraftBtnText: { fontSize: 14, fontWeight: '800', color: '#2563eb' },
  footerNextBtn: {
    height: 48,
    flex: 1,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.30,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  footerNextText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  draftBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  draftText: { color: '#2563eb', fontSize: 16, fontWeight: '800' },
  nextBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.30,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  nextText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  mediaCloseBtn: {
    width: 48,
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  mediaHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#111418',
    letterSpacing: -0.2,
  },
  mediaHeaderRight: { width: 48, alignItems: 'flex-end', justifyContent: 'center' },
  mediaHelpIconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  mediaProgressBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  mediaProgressTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 },
  mediaProgressStep: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mediaProgressPercent: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  mediaProgressTrack: { height: 6, borderRadius: 999, backgroundColor: '#dbe0e6', overflow: 'hidden' },
  mediaProgressFill: { height: '100%', width: '16%', borderRadius: 999, backgroundColor: '#2563eb' },

  mediaScrollContent: { paddingBottom: 160 },
  mediaBody: { paddingHorizontal: 16, paddingTop: 24, gap: 20 },
  mediaHeadline: { gap: 4 },
  mediaHeadlineTitle: { fontSize: 18, fontWeight: '800', color: '#111418', letterSpacing: -0.2 },
  mediaHeadlineSub: { fontSize: 16, fontWeight: '400', color: '#617289', lineHeight: 22 },

  mediaCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mediaCardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  mediaCardTitle: { fontSize: 18, fontWeight: '800', color: '#111418' },
  mediaCardSub: { marginTop: 4, fontSize: 14, color: '#617289', fontWeight: '400', lineHeight: 20 },
  mediaCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mediaCountText: { fontSize: 12, fontWeight: '700', color: '#15803d' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mediaPhotoTile: {
    width: '48%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  mediaPhotoImg: { width: '100%', height: '100%' },
  mediaPhotoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.08)' },
  mediaCoverBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.90)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  mediaCoverText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.8, textTransform: 'uppercase' },
  mediaRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaAddSlot: {
    width: '48%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaAddIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaAddLabel: { fontSize: 12, fontWeight: '700', color: '#2563eb' },

  mediaWalkHeader: { gap: 8, marginBottom: 16 },
  mediaWalkTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mediaOptionalBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  mediaOptionalText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },

  mediaVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  mediaVideoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mediaVideoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaVideoTitle: { fontSize: 14, fontWeight: '700', color: '#111418' },
  mediaVideoSub: { marginTop: 2, fontSize: 12, fontWeight: '500', color: '#6b7280' },

  mediaFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  mediaFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  mediaBackBtn: { height: 48, minWidth: 80, justifyContent: 'center' },
  mediaBackText: { fontSize: 16, fontWeight: '800', color: '#111418' },
  mediaFooterActions: { flexDirection: 'row', gap: 12 },
  mediaSaveBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaSaveText: { fontSize: 16, fontWeight: '800', color: '#2563eb' },
  mediaNextBtn: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.30,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  mediaNextText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  addrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  addrHeaderBack: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#111418',
    paddingRight: 40,
  },
  addrHeaderRight: { width: 40, height: 40 },

  addrScrollContent: { paddingBottom: 180 },
  addrBody: { padding: 16, gap: 24 },

  addrProgressWrap: { gap: 12 },
  addrProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addrProgressStep: { fontSize: 14, fontWeight: '600', color: '#111418' },
  addrProgressPill: {
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  addrProgressPillText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  addrProgressBar: { height: 8, borderRadius: 999, backgroundColor: '#dbe0e6', overflow: 'hidden' },
  addrProgressFill: { height: '100%', width: '25%', backgroundColor: '#2563eb', borderRadius: 999 },

  addrTitleWrap: { gap: 4 },
  addrTitle: { fontSize: 18, fontWeight: '800', color: '#111418', letterSpacing: -0.2 },
  addrSub: { fontSize: 14, color: '#617289', fontWeight: '500' },

  addrFieldBlock: { gap: 8 },
  addrLabel: { fontSize: 14, fontWeight: '600', color: '#111418' },
  addrSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dbe0e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  addrSelectText: { fontSize: 16, color: '#111418', flex: 1, paddingRight: 8 },
  addrSelectPlaceholder: { color: '#617289' },

  addrDivider: {
    borderTopWidth: 1,
    borderTopColor: '#dbe0e6',
    borderStyle: 'dashed',
  },

  addrForm: { gap: 16 },
  addrTwoCol: { flexDirection: 'row', gap: 16 },
  addrCol: { flex: 1, gap: 8 },
  addrInput: {
    borderWidth: 1,
    borderColor: '#dbe0e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111418',
  },
  addrSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe0e6',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingLeft: 12,
  },
  addrSearchIcon: { marginRight: 8 },
  addrSearchInput: { flex: 1, paddingVertical: 12, paddingRight: 16, fontSize: 16, color: '#111418' },

  addrMapSection: { gap: 12, paddingTop: 8 },
  addrMapTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  addrEditPin: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  addrMapBox: {
    height: 192,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dbe0e6',
    backgroundColor: '#f3f4f6',
  },
  addrMapImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.85 },
  addrMapGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, backgroundColor: 'rgba(0,0,0,0.08)' },
  addrMapPin: { position: 'absolute', left: '50%', top: '50%', transform: [{ translateX: -19 }, { translateY: -28 }], alignItems: 'center' },
  addrPinShadow: { width: 16, height: 6, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 999, marginTop: -4 },
  addrMapHelper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addrMapHelperText: { textAlign: 'center', fontSize: 12, color: '#617289', fontWeight: '500' },

  addrFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  addrFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  addrBackBtn: {
    borderWidth: 1,
    borderColor: '#dbe0e6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  addrBackText: { fontSize: 16, fontWeight: '600', color: '#111418' },
  addrFooterRight: { flex: 1 },
  addrNextBtn: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  addrNextText: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  addrFooterDraftRow: { alignItems: 'center', marginTop: 10 },
  addrDraftMobile: { fontSize: 14, fontWeight: '500', color: '#617289' },

  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  areaHeaderBtn: {
    padding: 8,
    marginHorizontal: -8,
    borderRadius: 999,
  },
  areaHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#111418', letterSpacing: -0.2 },

  areaProgressWrap: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, backgroundColor: '#ffffff' },
  areaProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  areaProgressStep: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  areaProgressPercent: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  areaProgressTrack: { height: 4, borderRadius: 999, backgroundColor: '#e5e7eb', overflow: 'hidden' },
  areaProgressFill: { height: '100%', width: '33%', borderRadius: 999, backgroundColor: '#2563eb' },

  areaScrollContent: { paddingBottom: 120 },
  areaBody: { paddingHorizontal: 16, paddingTop: 16 },
  areaHeadline: { marginBottom: 32 },
  areaHeadlineTitle: { fontSize: 18, fontWeight: '800', color: '#111418', marginBottom: 8, letterSpacing: -0.2 },
  areaHeadlineSub: { fontSize: 16, fontWeight: '400', color: '#6b7280', lineHeight: 22 },

  areaForm: { gap: 24, paddingBottom: 12 },
  areaField: { gap: 8 },
  areaFieldWide: { gap: 12 },
  areaLabel: { fontSize: 16, fontWeight: '600', color: '#111418' },
  areaLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  areaOptionalBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  areaOptionalText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },

  areaInputWrap: {
    height: 56,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  areaInput: { paddingHorizontal: 16, paddingRight: 72, fontSize: 16, color: '#111418', height: 56 },
  areaUnitWrap: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  areaUnitText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },

  areaDivider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 8 },

  areaSquaresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  areaSquare: {
    width: 56,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaSquareSelected: { borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.10)' },
  areaSquareText: { fontSize: 16, fontWeight: '600', color: '#111418' },
  areaSquareTextSelected: { color: '#2563eb' },

  areaFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  areaFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  areaSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  areaSaveText: { fontSize: 16, fontWeight: '800', color: '#111418' },
  areaNextBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.30,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  areaNextText: { fontSize: 16, fontWeight: '800', color: '#ffffff' },

  rentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rentHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rentHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#111418', paddingRight: 40 },

  rentScrollContent: { paddingBottom: 140 },
  rentProgressWrap: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8, gap: 12 },
  rentProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rentProgressStep: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  rentProgressPct: { fontSize: 14, fontWeight: '800', color: '#2563eb' },
  rentProgressTrack: { height: 8, borderRadius: 999, backgroundColor: '#dbe0e6', overflow: 'hidden' },
  rentProgressFill: { width: '42%', height: '100%', borderRadius: 999, backgroundColor: '#2563eb' },

  rentSection: { paddingHorizontal: 16, paddingTop: 24 },
  rentSectionTitle: { fontSize: 18, fontWeight: '800', color: '#111418', marginBottom: 12 },
  rentCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rentCardLarge: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 16,
    gap: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rentField: { gap: 8 },
  rentFieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rentLabel: { fontSize: 14, fontWeight: '600', color: '#111418' },
  rentRequiredMark: { color: '#ef4444', fontWeight: '800' },

  rentInputWrap: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 40,
    paddingRight: 14,
    height: 48,
  },
  rentLeftIcon: { position: 'absolute', left: 12 },
  rentInput: { flex: 1, fontSize: 16, color: '#111418', paddingVertical: 10 },
  rentInputWithAffix: { paddingRight: 64 },
  rentRightAffixWrap: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  rentRightAffixText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },

  rentSegment: { flexDirection: 'row', padding: 4, borderRadius: 10, backgroundColor: '#f3f4f6' },
  rentSegmentBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  rentSegmentBtnActive: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
  rentSegmentText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  rentSegmentTextActive: { color: '#2563eb' },

  rentTwoCol: { flexDirection: 'row', gap: 16 },
  rentCol: { flex: 1, gap: 8 },
  rentHint: { marginTop: 2, fontSize: 12, color: '#6b7280', fontWeight: '500' },

  rentInputPlainWrap: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    height: 44,
    justifyContent: 'center',
  },
  rentPlainInput: { height: 44, fontSize: 16, color: '#111418', paddingHorizontal: 12 },
  rentPlainWithAffix: { paddingRight: 54 },
  rentPlainAffix: { position: 'absolute', right: 12, fontSize: 14, fontWeight: '700', color: '#6b7280' },

  rentDivider: { height: 1, backgroundColor: '#f3f4f6' },
  rentToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  rentToggleTitle: { fontSize: 16, fontWeight: '700', color: '#111418' },
  rentToggleSub: { marginTop: 2, fontSize: 12, fontWeight: '500', color: '#6b7280' },

  rentFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  rentFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rentFooterBack: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  rentFooterBackText: { fontSize: 14, fontWeight: '700', color: '#111418' },
  rentFooterMid: { flex: 1, alignItems: 'center' },
  rentFooterDraft: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  rentFooterNext: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOpacity: 0.20,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  rentFooterNextText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },

  availHeader: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  availHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  availHeaderBtn: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  availHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.2 },
  availHeaderSpacer: { width: 40, height: 40 },
  availProgressWrap: { paddingBottom: 12 },
  availProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  availProgressLeft: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  availProgressRight: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  availProgressTrack: { height: 4, backgroundColor: '#e2e8f0' },
  availProgressFill: { height: '100%', width: '50%', backgroundColor: '#2563eb', borderTopRightRadius: 999, borderBottomRightRadius: 999 },

  availScrollContent: { paddingBottom: 160 },
  availBody: { paddingHorizontal: 16, paddingTop: 16, width: '100%', maxWidth: ADS_FORM_MAX_WIDTH, alignSelf: 'center', gap: 16 },
  availIntro: { paddingVertical: 8 },
  availIntroTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.2 },
  availIntroSub: { marginTop: 4, fontSize: 14, fontWeight: '500', color: '#64748b' },

  availCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 16,
  },
  availCardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  availIconCircle: { width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(37,99,235,0.10)', alignItems: 'center', justifyContent: 'center' },
  availCardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  availField: { gap: 8 },
  availLabel: { fontSize: 14, fontWeight: '700', color: '#334155' },
  availDateInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availDateText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  availHelper: { fontSize: 12, fontWeight: '500', color: '#64748b' },

  availMinStayRow: { flexDirection: 'row', alignItems: 'center' },
  availMinStayInputWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availMinStayInput: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0f172a', padding: 0 },
  availMinStayAffix: { fontSize: 14, fontWeight: '700', color: '#94a3b8', marginLeft: 10 },
  availStepper: {
    marginLeft: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  availStepBtn: { paddingHorizontal: 12, paddingVertical: 12 },

  availDivider: { height: 1, backgroundColor: '#f1f5f9' },
  availToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availToggleTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  availToggleSub: { marginTop: 2, fontSize: 13, fontWeight: '500', color: '#64748b' },
  availLockInBox: { borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, gap: 10 },

  availFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  availFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16, width: '100%', maxWidth: ADS_FORM_MAX_WIDTH, alignSelf: 'center' },
  availFooterBack: { height: 48, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center' },
  availFooterBackText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  availFooterMid: { flex: 1, alignItems: 'center' },
  availFooterDraft: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  availFooterNext: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOpacity: 0.30,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  availFooterNextText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  availFooterSafe: { height: 18, width: '100%', backgroundColor: '#ffffff' },

  amenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  amenBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#111418' },
  amenCancelBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  amenCancelText: { fontSize: 14, fontWeight: '800', color: '#617289' },

  amenProgress: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  amenProgressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  amenProgressStep: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280' },
  amenProgressPct: { fontSize: 12, fontWeight: '900', color: '#2563eb' },
  amenProgressTrack: { height: 6, borderRadius: 999, backgroundColor: '#dbe0e6', overflow: 'hidden' },
  amenProgressFill: { height: '100%', width: '58%', borderRadius: 999, backgroundColor: '#2563eb' },

  amenScrollContent: { paddingBottom: 160 },
  amenBody: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 0 },
  amenHeadline: { marginBottom: 24 },
  amenHeadlineTitle: { fontSize: 18, fontWeight: '800', color: '#111418', letterSpacing: -0.2, marginBottom: 8 },
  amenHeadlineSub: { fontSize: 16, fontWeight: '400', color: '#617289', lineHeight: 22 },

  amenTagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbe0e6',
    backgroundColor: '#ffffff',
  },
  amenTagSelected: { borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.10)' },
  amenTagText: { fontSize: 14, fontWeight: '500', color: '#617289' },
  amenTagTextSelected: { fontWeight: '700', color: '#2563eb' },
  amenAddTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
  },
  amenAddTagText: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  amenAddInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  amenAddInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.18)',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111827',
  },
  amenAddBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenAddBtnText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },

  amenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  amenCardSelected: { borderWidth: 2, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)' },
  amenCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  amenIconCircle: { width: 40, height: 40, borderRadius: 999, backgroundColor: '#f0f2f4', alignItems: 'center', justifyContent: 'center' },
  amenIconCircleSelected: { backgroundColor: '#2563eb' },
  amenEmptyDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db' },
  amenLabel: { fontSize: 16, fontWeight: '900', color: '#111418' },
  amenAddCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#dbe0e6',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  amenAddText: { fontSize: 16, fontWeight: '900', color: '#2563eb' },

  amenFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  amenFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  amenFooterBack: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999 },
  amenFooterBackText: { fontSize: 16, fontWeight: '900', color: '#617289' },
  amenFooterDraft: { paddingHorizontal: 16, paddingVertical: 12 },
  amenFooterDraftText: { fontSize: 16, fontWeight: '900', color: '#2563eb' },
  amenFooterNext: { flex: 1, borderRadius: 999, paddingVertical: 14, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOpacity: 0.30, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  amenFooterNextText: { fontSize: 16, fontWeight: '900', color: '#ffffff' },

  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  rulesHeaderBtn: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  rulesHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#111418' },
  rulesHeaderRight: { paddingHorizontal: 10, paddingVertical: 6 },
  rulesHeaderRightText: { fontSize: 16, fontWeight: '700', color: '#2563eb' },

  rulesScrollContent: { paddingBottom: 140 },
  rulesProgressBlock: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8, gap: 10 },
  rulesProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rulesProgressStep: { fontSize: 14, fontWeight: '700', color: '#111418', textTransform: 'uppercase', letterSpacing: 0.6 },
  rulesProgressPct: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  rulesProgressTrack: { height: 8, borderRadius: 999, backgroundColor: '#e5e7eb', overflow: 'hidden' },
  rulesProgressFill: { height: '100%', width: '66%', borderRadius: 999, backgroundColor: '#2563eb' },
  rulesTitle: { marginTop: 2, fontSize: 18, fontWeight: '800', color: '#111418' },
  rulesSub: { fontSize: 13, fontWeight: '500', color: '#617289', lineHeight: 18 },
  rulesDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 24, marginTop: 10, marginBottom: 16 },

  rulesSection: { paddingHorizontal: 24, gap: 12 },
  rulesSectionTitle: { fontSize: 18, fontWeight: '900', color: '#111418' },
  rulesToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  rulesToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, paddingRight: 10 },
  rulesToggleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesToggleTextCol: { flex: 1 },
  rulesToggleLabel: { fontSize: 16, fontWeight: '700', color: '#111418' },
  rulesToggleHint: { marginTop: 2, fontSize: 12, fontWeight: '600', color: '#6b7280' },

  rulesField: { gap: 6 },
  rulesFieldLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  rulesSelect: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rulesSelectText: { fontSize: 16, fontWeight: '600', color: '#111418' },
  rulesTextArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111418',
    minHeight: 96,
  },

  rulesParkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rulesParkOptionWrap: { width: '48%' },
  rulesParkOption: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesParkOptionSelected: { borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.05)' },
  rulesParkIcon: { marginBottom: 10 },
  rulesParkLabel: { fontSize: 13, fontWeight: '800', color: '#111418' },
  rulesParkLabelSelected: { color: '#2563eb' },
  rulesParkCheck: { position: 'absolute', top: 8, right: 8 },

  rulesNoticeInputWrap: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rulesNoticeLeftIcon: { paddingLeft: 14, paddingRight: 10 },
  rulesNoticeInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 0, fontSize: 16, fontWeight: '700', color: '#111418' },
  rulesNoticeSuffix: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
  },
  rulesNoticeSuffixText: { fontSize: 13, fontWeight: '800', color: '#6b7280' },
  rulesHelper: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#6b7280' },

  rulesFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  rulesFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rulesFooterBack: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  rulesFooterBackText: { fontSize: 16, fontWeight: '900', color: '#111418' },
  rulesFooterNext: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.20,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  rulesFooterNextText: { fontSize: 16, fontWeight: '900', color: '#ffffff' },

  prefHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  prefHeaderBtn: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  prefHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111418', paddingRight: 40 },
  prefHeaderSpacer: { width: 40, height: 40 },
  prefScrollContent: { paddingTop: 56, paddingBottom: 140 },

  prefProgressBlock: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, backgroundColor: 'transparent' },
  prefProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  prefProgressLeft: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  prefProgressRight: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  prefProgressTrack: { height: 8, borderRadius: 999, backgroundColor: '#f3f4f6', overflow: 'hidden' },
  prefProgressFill: { height: '100%', width: '75%', borderRadius: 999, backgroundColor: '#2563eb' },

  prefSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: 'transparent' },
  prefH2: { fontSize: 18, fontWeight: '800', color: '#111418', marginBottom: 6 },
  prefP: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 16 },
  prefChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  prefChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  prefChipSelected: { borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.10)' },
  prefChipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  prefChipTextSelected: { color: '#2563eb' },

  prefSection2: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: 'transparent', marginTop: 8 },
  prefH3: { fontSize: 18, fontWeight: '900', color: '#111418', marginBottom: 14 },
  prefRuleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prefRuleLeft: { flex: 1, paddingRight: 12 },
  prefRuleTitle: { fontSize: 16, fontWeight: '700', color: '#111418' },
  prefRuleSub: { marginTop: 2, fontSize: 12, fontWeight: '600', color: '#6b7280' },
  prefRuleDivider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 },

  prefFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  prefFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  prefFooterDraft: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  prefFooterBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefFooterBack: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  prefFooterBackText: { fontSize: 14, fontWeight: '800', color: '#374151' },
  prefFooterNext: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2563eb' },
  prefFooterNextText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },

  secHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  secHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  secHeaderIconBtn: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  secHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  secHeaderHelpBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  secHeaderHelpText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  secProgressTrack: { height: 4, width: '100%', backgroundColor: '#e2e8f0' },
  secProgressFill: { height: '100%', width: '83.33%', backgroundColor: '#2563eb' },
  secStepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  secStepLeft: { fontSize: 12, fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1 },
  secStepRight: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },

  secScrollContent: { paddingBottom: 150 },
  secBody: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  secHeadline: { marginBottom: 4 },
  secH2: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.2 },
  secP: { marginTop: 8, fontSize: 14, fontWeight: '500', color: '#64748b', lineHeight: 20 },
  secPStrong: { fontWeight: '900', color: '#2563eb' },

  secCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 16,
  },
  secCardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secCardTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  secOptionalPill: { marginLeft: 'auto', borderRadius: 8, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4 },
  secOptionalText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },

  secUploadBox: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 12,
  },
  secUploadIconCircle: { width: 56, height: 56, borderRadius: 999, backgroundColor: 'rgba(37,99,235,0.10)', alignItems: 'center', justifyContent: 'center' },
  secUploadTextCol: { alignItems: 'center', gap: 4 },
  secUploadTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  secUploadSub: { fontSize: 12, fontWeight: '600', color: '#64748b', textAlign: 'center' },
  secBrowseBtn: { marginTop: 6, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', paddingHorizontal: 14, paddingVertical: 10 },
  secBrowseText: { fontSize: 13, fontWeight: '900', color: '#0f172a' },

  secSectionLabel: { marginTop: 2, fontSize: 12, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 2 },
  secListCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  secListRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  secListRowFirst: { borderTopWidth: 0 },
  secListLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 12 },
  secIconSquare: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secIconOrange: { backgroundColor: 'rgba(234,88,12,0.12)' },
  secIconBlue: { backgroundColor: 'rgba(37,99,235,0.12)' },
  secIconGreen: { backgroundColor: 'rgba(22,163,74,0.12)' },
  secListTextCol: { flex: 1 },
  secListTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  secListSub: { marginTop: 2, fontSize: 12, fontWeight: '600', color: '#64748b' },

  secFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  secFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  secFooterBack: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  secFooterBackText: { fontSize: 14, fontWeight: '900', color: '#64748b' },
  secFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-end' },
  secFooterDraft: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f1f5f9' },
  secFooterDraftText: { fontSize: 14, fontWeight: '900', color: '#334155' },
  secFooterNext: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, backgroundColor: '#2563eb', flex: 1, maxWidth: 160, alignItems: 'center' },
  secFooterNextText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },

  vcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  vcHeaderBtn: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  vcHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#0f172a' },
  vcHeaderHelp: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  vcHeaderHelpText: { fontSize: 14, fontWeight: '800', color: '#64748b' },

  vcScrollContent: { paddingBottom: 150 },
  vcProgressBlock: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff' },
  vcProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  vcProgressLeft: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  vcProgressRight: { fontSize: 12, fontWeight: '800', color: '#2563eb' },
  vcProgressTrack: { height: 6, borderRadius: 999, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  vcProgressFill: { height: '100%', width: '92%', borderRadius: 999, backgroundColor: '#2563eb' },

  vcTitleBlock: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  vcH1: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  vcSub: { fontSize: 13, fontWeight: '600', color: '#64748b', lineHeight: 18 },

  vcSection: { paddingHorizontal: 20, paddingTop: 12 },
  vcSectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  vcCard: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 16,
  },
  vcTimeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  vcTimeCol: { flex: 1 },
  vcFieldLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  vcTimeInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  vcDash: { marginTop: 32, fontSize: 16, fontWeight: '700', color: '#94a3b8' },

  vcDaysWrap: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, gap: 10 },
  vcDaysRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },

  dayPill: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayPillOn: { backgroundColor: '#2563eb', shadowColor: '#2563eb', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  dayPillOff: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  dayPillText: { fontSize: 12, fontWeight: '800' },
  dayPillTextOn: { color: '#ffffff' },
  dayPillTextOff: { color: '#64748b' },

  vcRadioStack: { gap: 12 },
  vcRadioCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  vcRadioCardOn: { borderWidth: 2, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.06)' },
  vcRadioIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  vcRadioIconOn: { backgroundColor: '#ffffff' },
  vcRadioTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  vcRadioTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  vcRadioDesc: { fontSize: 12, fontWeight: '600', color: '#64748b', lineHeight: 16 },

  vcFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  vcFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  vcFooterBack: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  vcFooterBackText: { fontSize: 14, fontWeight: '900', color: '#64748b' },
  vcFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vcFooterDraft: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  vcFooterDraftText: { fontSize: 14, fontWeight: '900', color: '#2563eb' },
  vcFooterNext: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#2563eb', shadowOpacity: 0.30, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  vcFooterNextText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },

  pubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pubHeaderBtn: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pubHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#111418', paddingRight: 40 },
  pubHeaderSpacer: { width: 40, height: 40 },

  pubScrollContent: { paddingBottom: 140 },
  pubProgress: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, backgroundColor: '#ffffff' },
  pubProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  pubProgressLeft: { fontSize: 14, fontWeight: '600', color: '#111418' },
  pubProgressRight: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  pubProgressTrack: { height: 8, borderRadius: 999, backgroundColor: '#dbe0e6', overflow: 'hidden' },
  pubProgressFill: { height: '100%', width: '95%', borderRadius: 999, backgroundColor: '#2563eb' },

  pubBody: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },
  pubCard: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  pubCardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pubIconBadge: { backgroundColor: 'rgba(37,99,235,0.10)', padding: 8, borderRadius: 10 },
  pubCardTitle: { fontSize: 18, fontWeight: '900', color: '#111418' },
  pubCardHint: { fontSize: 13, fontWeight: '600', color: '#617289' },

  pubRadioStack: { gap: 12, marginTop: 4 },
  pubRadioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pubRadioRowSelected: { borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.05)' },
  pubRadioTitle: { fontSize: 14, fontWeight: '800', color: '#111418', marginBottom: 2 },
  pubRadioSub: { fontSize: 12, fontWeight: '600', color: '#617289' },
  pubRadioDotOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  pubRadioDotOuterSelected: { borderColor: '#2563eb', backgroundColor: '#2563eb' },
  pubRadioDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffffff', opacity: 0 },
  pubRadioDotInnerSelected: { opacity: 1 },

  pubField: { marginTop: 8, gap: 8 },
  pubFieldLabel: { fontSize: 14, fontWeight: '700', color: '#111418' },
  pubInputWrap: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, backgroundColor: '#ffffff' },
  pubInput: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '700', color: '#111418', paddingRight: 84 },
  pubInputAffix: { position: 'absolute', right: 14, top: '50%', marginTop: -9, fontSize: 13, fontWeight: '700', color: '#617289' },

  pubStatusGrid: { flexDirection: 'row', gap: 8, marginTop: 6 },
  pubStatusOption: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pubStatusOptionSelected: { borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.10)' },
  pubStatusLabel: { fontSize: 12, fontWeight: '800', color: '#111418' },
  pubStatusLabelSelected: { color: '#2563eb' },

  pubPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  pubPreviewText: { fontSize: 14, fontWeight: '900', color: '#111418' },
  pubTermsText: { textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#617289' },

  pubFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  pubFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pubFooterBack: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  pubFooterBackText: { fontSize: 16, fontWeight: '900', color: '#617289' },
  pubFooterPublish: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.30,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  pubFooterPublishText: { fontSize: 16, fontWeight: '900', color: '#ffffff' },

  cancelOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  cancelCard: { width: '100%', borderRadius: 16, backgroundColor: '#ffffff', padding: 18, borderWidth: 1, borderColor: '#e5e7eb' },
  cancelTitle: { fontSize: 16, fontWeight: '900', color: '#111418', marginBottom: 6 },
  cancelSub: { fontSize: 13, fontWeight: '600', color: '#617289', lineHeight: 18 },
  cancelBtns: { marginTop: 16, gap: 10 },
  cancelBtnGhost: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelBtnGhostText: { fontSize: 14, fontWeight: '900', color: '#111418' },
  cancelBtnPrimary: { paddingVertical: 12, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center' },
  cancelBtnPrimaryText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  cancelBtnDanger: { paddingVertical: 12, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center' },
  cancelBtnDangerText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
});
