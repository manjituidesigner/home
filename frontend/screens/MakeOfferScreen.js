import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../theme';
import { getSessionUser } from '../session';
import { API_BASE_URL } from '../apiBaseUrl';

const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const OFFER_SUBMISSIONS_KEY = 'OFFER_SUBMISSIONS_V1';

function moneyLabel(v, fallback = '-') {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatValue(value) {
  if (value == null) return '-';
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length ? t : '-';
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const list = value.map((x) => String(x ?? '').trim()).filter(Boolean);
    return list.length ? list.join(', ') : '-';
  }
  if (typeof value === 'object') {
    if (typeof value.label === 'string') return value.label.trim() || '-';
    if (typeof value.name === 'string') return value.name.trim() || '-';
    if (typeof value.value === 'string') return value.value.trim() || '-';
    try {
      const json = JSON.stringify(value);
      return json && json !== '{}' ? json : '-';
    } catch (e) {
      return '-';
    }
  }
  return String(value);
}

function FieldRow({ icon, label, value, isLast }) {
  const v = formatValue(value);
  return (
    <View style={[styles.fieldRow, !isLast ? styles.fieldRowDivider : null]}>
      <View style={styles.fieldLabelWrap}>
        {!!icon && (
          <Ionicons name={icon} size={14} color={theme.colors.textSecondary} style={styles.fieldLabelIcon} />
        )}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <Text style={styles.fieldValue} numberOfLines={2}>
        {v}
      </Text>
    </View>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </View>
  );
}

function CheckboxRow({ title, subtitle, value, onToggle }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.85}>
      <Ionicons
        name={value ? 'checkbox' : 'square-outline'}
        size={22}
        color={value ? theme.colors.primary : theme.colors.textSecondary}
      />
      <View style={styles.checkTextWrap}>
        <Text style={styles.checkTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.checkSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );
}

function SegmentButton({ label, icon, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.segmentBtn, selected ? styles.segmentBtnActive : null]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons
        name={icon}
        size={16}
        color={selected ? theme.colors.primary : theme.colors.textSecondary}
      />
      <Text style={[styles.segmentBtnLabel, selected ? styles.segmentBtnLabelActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function MakeOfferScreen({ route, navigation }) {
  const property = route?.params?.property || {};

  const [sessionUserId, setSessionUserId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadUid = async () => {
      try {
        const session = await getSessionUser();
        const uid = session?._id || session?.id || session?.user?._id || session?.user?.id || null;
        if (mounted) setSessionUserId(uid);
      } catch (e) {
        if (mounted) setSessionUserId(null);
      }
    };
    loadUid();
    return () => {
      mounted = false;
    };
  }, []);

  const propertyId = property?._id || property?.id || property?.propertyId || null;

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const parseMoney = (v) => {
    const n = Number(String(v || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  const title = property.propertyName || 'Property';
  const address = property.address || property.floor || property.customFloor || '';
  const typeLabel = property.bhk
    ? `${property.bhk} ${
        property.category === 'house'
          ? 'House'
          : property.category === 'flat'
          ? 'Flat'
          : property.category === 'pg'
          ? 'PG / Hostel'
          : 'Property'
      }`
    : 'Property';

  const statusLabel = property.status === 'occupied' ? 'Occupied' : 'Available';

  const rent = moneyLabel(property.rentAmount, '₹15,000');
  const advance = moneyLabel(property.advanceAmount, '₹30,000');
  const booking = moneyLabel(property.bookingAdvance, '₹5,000');
  const maintenance = property.maintenanceAmount
    ? `${moneyLabel(property.maintenanceAmount, '')}/mo`
    : '₹1,200/mo';

  const dealDetails = useMemo(() => {
    const amenitiesList = Array.isArray(property.amenities) ? property.amenities : [];
    const preferredTenantTypes = Array.isArray(property.preferredTenantTypes)
      ? property.preferredTenantTypes
      : [];

    const safeText = (v) => {
      const t = String(v ?? '').trim();
      return t.length ? t : '-';
    };

    return {
      property: {
        propertyType: safeText(property.category || property.propertyType),
        listingType: safeText(property.listingType || property.listingFor),
        configuration: safeText(property.bhk ? `${property.bhk} BHK` : property.configuration),
        furnishing: safeText(property.furnishing),
        numberOfRooms: safeText(property.rooms || property.numberOfRooms),
        floor: safeText(property.floor || property.customFloor),
      },
      charges: {
        waterCharges: safeText(property.waterCharges),
        electricityUnitPrice: safeText(property.electricityPerUnit || property.electricityUnitPrice),
        cleaningCharges: safeText(property.cleaningCharges),
        foodCharges: safeText(property.foodCharges),
        yearlyMaintenance: safeText(property.yearlyMaintaines || property.yearlyMaintenance),
        percentIncrease: safeText(property.percentIncrease || property.increasePercent),
        bookingCharges: safeText(property.bookingAdvance || property.bookingCharges),
      },
      validity: {
        validity: safeText(property.validity),
        bookingDays: safeText(property.bookingDays || property.validityDays),
      },
      amenities: {
        list: amenitiesList.map((x) => String(x ?? '').trim()).filter(Boolean),
      },
      rules: {
        drinksPolicy: safeText(property.drinksPolicy),
        smokingPolicy: safeText(property.smokingPolicy),
        lateNightPolicy: safeText(property.lateNightPolicy),
        friendsAllowed: property.friendsAllowed === true || property.allowFriends === true || property.allowedFriends === true || property.visitorsAllowed === true,
        parkingType: safeText(property.parkingType),
        preferredTenantTypes,
      },
    };
  }, [property]);

  const ownerParkingType = String(property.parkingType || 'none').trim().toLowerCase();
  const ownerAllowsBike = ownerParkingType === 'bike' || ownerParkingType === 'both';
  const ownerAllowsCar = ownerParkingType === 'car' || ownerParkingType === 'both';

  const ownerRules = useMemo(() => {
    const drinksAllowed = property.drinksPolicy !== 'not_allowed';
    const smokingAllowed = property.smokingPolicy !== 'not_allowed';
    const lateNightAllowed = property.lateNightPolicy !== 'not_allowed';

    const friendsAllowed =
      property.friendsAllowed === true ||
      property.allowFriends === true ||
      property.allowedFriends === true ||
      property.visitorsAllowed === true;

    return {
      drinksAllowed,
      smokingAllowed,
      lateNightAllowed,
      friendsAllowed,
      bikeAllowed: ownerAllowsBike,
      carAllowed: ownerAllowsCar,
    };
  }, [property, ownerAllowsBike, ownerAllowsCar]);

  const ownerAmenities = useMemo(() => {
    const list = Array.isArray(property.amenities) ? property.amenities : [];
    const has = (needle) =>
      list.some((x) => String(x || '').trim().toLowerCase().includes(needle));

    return {
      kitchen: property.kitchen === true || has('kitchen'),
      bed: property.bed === true || has('bed'),
      ac: property.ac === true || has('ac') || has('air'),
      furnished: String(property.furnishing || '').trim().length ? String(property.furnishing) : null,
    };
  }, [property]);

  const previewUri = useMemo(() => {
    const photos = Array.isArray(property.photos) ? property.photos : [];
    const first = photos[0];
    if (!first) return null;
    if (typeof first === 'string') return first;
    if (first?.uri) return first.uri;
    if (first?.url) return first.url;
    return null;
  }, [property]);

  const [offerPrice, setOfferPrice] = useState(property.rentAmount ? String(property.rentAmount) : '15000');

  const [offerAdvance, setOfferAdvance] = useState(property.advanceAmount ? String(property.advanceAmount) : '');
  const [offerBooking, setOfferBooking] = useState(property.bookingAdvance ? String(property.bookingAdvance) : '');

  const [joiningDateEstimate, setJoiningDateEstimate] = useState('');
  const [acceptsRules, setAcceptsRules] = useState(false);

  const [prefDrinks, setPrefDrinks] = useState(false);
  const [prefLateEntry, setPrefLateEntry] = useState(false);
  const [prefBikeParking, setPrefBikeParking] = useState(false);
  const [prefFriends, setPrefFriends] = useState(false);
  const [prefFamily, setPrefFamily] = useState(false);

  const [tenantGroup, setTenantGroup] = useState('single');

  const matchPercent = useMemo(() => {
    let score = 60;
    const add = (v) => {
      score += v;
    };

    if (prefBikeParking && ownerRules.bikeAllowed) add(10);
    if (prefBikeParking && !ownerRules.bikeAllowed) add(-10);

    if (prefDrinks && ownerRules.drinksAllowed) add(8);
    if (prefDrinks && !ownerRules.drinksAllowed) add(-12);

    if (prefLateEntry && ownerRules.lateNightAllowed) add(6);
    if (prefLateEntry && !ownerRules.lateNightAllowed) add(-10);

    if (prefFriends && ownerRules.friendsAllowed) add(6);
    if (prefFriends && !ownerRules.friendsAllowed) add(-8);

    if (prefFamily) add(4);
    if (tenantGroup === 'students') add(-2);

    return Math.max(0, Math.min(100, score));
  }, [prefBikeParking, prefDrinks, prefLateEntry, prefFriends, prefFamily, tenantGroup, ownerRules]);

  const circleDash = useMemo(() => {
    const pct = Math.max(0, Math.min(100, Number(matchPercent) || 0));
    return `${pct}, 100`;
  }, [matchPercent]);

  const expectedRentInfo = useMemo(() => {
    const ownerRent = Number(property.rentAmount);
    if (!Number.isFinite(ownerRent) || ownerRent <= 0) return null;
    const lo = Math.round(ownerRent * 0.9);
    const hi = Math.round(ownerRent * 1.1);
    return { ownerRent, lo, hi };
  }, [property]);

  const submissionKey = useMemo(() => {
    const pid = propertyId ? String(propertyId) : 'unknown_property';
    const uid = sessionUserId ? String(sessionUserId) : String(route?.params?.userId || 'unknown_user');
    return `${uid}::${pid}`;
  }, [propertyId, sessionUserId, route?.params?.userId]);

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resubmitConfirmVisible, setResubmitConfirmVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const json = await AsyncStorage.getItem(OFFER_SUBMISSIONS_KEY);
        const map = json ? JSON.parse(json) : {};
        const safe = map && typeof map === 'object' ? map : {};
        const uid = String(submissionKey.split('::')[0] || '');
        const scoped = safe?.byUser && typeof safe.byUser === 'object' ? safe.byUser?.[uid] : null;
        const hasSubmitted = !!(scoped && typeof scoped === 'object' ? scoped?.[submissionKey] : safe?.[submissionKey]);
        if (mounted) setAlreadySubmitted(hasSubmitted);
      } catch (e) {
        if (mounted) setAlreadySubmitted(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [submissionKey]);

  const submitOffer = async (isResubmit = false) => {
    setSubmitting(true);
    try {
      if (!propertyId) {
        Alert.alert('Offer', 'Property not found. Please open property again.');
        return;
      }

      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Session', 'Please login again. Token missing.');
        return;
      }

      const offerRent = parseMoney(offerPrice);
      if (offerRent == null || offerRent <= 0) {
        Alert.alert('Offer', 'Please enter a valid offer price.');
        return;
      }

      const payload = {
        propertyId,
        offer: {
          offerRent,
          joiningDateEstimate: String(joiningDateEstimate || '').trim(),
          offerAdvance: parseMoney(offerAdvance),
          offerBookingAmount: parseMoney(offerBooking),
          needsBikeParking: !!prefBikeParking,
          needsCarParking: false,
          tenantType: String(tenantGroup || '').trim(),
          acceptsRules: true,
          matchPercent: Number(matchPercent) || 0,
        },
      };

      const resp = await fetch(`${API_BASE_URL}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        let msg = 'Failed to submit offer.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Offer', msg);
        return;
      }

      const json = await AsyncStorage.getItem(OFFER_SUBMISSIONS_KEY);
      const map = json ? JSON.parse(json) : {};
      const safe = map && typeof map === 'object' ? map : {};
      const uid = String(submissionKey.split('::')[0] || '');
      const next = { ...safe };
      if (!next.byUser || typeof next.byUser !== 'object') next.byUser = {};
      if (!next.byUser[uid] || typeof next.byUser[uid] !== 'object') next.byUser[uid] = {};
      next.byUser[uid][submissionKey] = {
        submittedAt: Date.now(),
        offer: {
          offerPrice: String(offerPrice || '').trim(),
          offerAdvance: String(offerAdvance || '').trim(),
          offerBooking: String(offerBooking || '').trim(),
          joiningDateEstimate: String(joiningDateEstimate || '').trim(),
          tenantPreferences: {
            drinksOrSmoking: !!prefDrinks,
            lateNightEntry: !!prefLateEntry,
            bikeParking: !!prefBikeParking,
            friendsOrVisitors: !!prefFriends,
            familyStaying: !!prefFamily,
            tenantGroup,
          },
        },
        dealSnapshot: dealDetails,
      };
      await AsyncStorage.setItem(OFFER_SUBMISSIONS_KEY, JSON.stringify(next));
      setAlreadySubmitted(true);
      setSuccessMessage(isResubmit ? 'Offer resubmitted successfully.' : 'Offer submitted successfully.');
      setSuccessVisible(true);
    } catch (e) {
      Alert.alert('Offer', 'Network error while submitting offer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (submitting) return;
    if (!String(offerPrice || '').trim()) {
      Alert.alert('Offer', 'Please enter offer price.');
      return;
    }
    if (!String(joiningDateEstimate || '').trim()) {
      Alert.alert('Offer', 'Please enter joining date estimate.');
      return;
    }
    if (!acceptsRules) {
      Alert.alert('Offer', 'Please accept owner rules / conditions.');
      return;
    }
    if (alreadySubmitted) {
      setResubmitConfirmVisible(true);
      return;
    }

    submitOffer(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Modal
        visible={resubmitConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResubmitConfirmVisible(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Resubmit Offer?</Text>
            <Text style={styles.confirmSubtitle}>You already submitted an offer for this property.</Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                activeOpacity={0.9}
                onPress={() => setResubmitConfirmVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmResubmitBtn}
                activeOpacity={0.9}
                onPress={() => {
                  setResubmitConfirmVisible(false);
                  submitOffer(true);
                }}
                disabled={submitting}
              >
                <Text style={styles.confirmResubmitText}>Resubmit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={successVisible} transparent animationType="fade" onRequestClose={() => setSuccessVisible(false)}>
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={44} color={theme.colors.primary} />
            </View>
            <Text style={styles.successTitle}>Successful</Text>
            <Text style={styles.successSubtitle}>{successMessage || 'Offer submitted successfully.'}</Text>
            <TouchableOpacity
              style={styles.successOkBtn}
              activeOpacity={0.9}
              onPress={() => {
                setSuccessVisible(false);
                if (navigation?.reset) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main', params: { screen: 'Dashboard' } }],
                  });
                  return;
                }
                if (navigation?.navigate) navigation.navigate('Main', { screen: 'Dashboard' });
              }}
            >
              <Text style={styles.successOkBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make Offer</Text>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="close" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionPad}>
          <View style={styles.propertyCard}>
            <View style={styles.propertyTopRow}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.propertyImage} />
              ) : (
                <View style={styles.propertyImagePlaceholder}>
                  <Ionicons name="image-outline" size={24} color={theme.colors.textSecondary} />
                </View>
              )}

              <View style={styles.propertyTopMeta}>
                <Text style={styles.propertyTitle} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.propertyAddress} numberOfLines={2}>
                  {address || 'Address not set'}
                </Text>
                <View style={styles.badgesRow}>
                  <View style={styles.badgeGreen}>
                    <Text style={styles.badgeGreenText}>{typeLabel}</Text>
                  </View>
                  <View style={styles.badgeBlue}>
                    <Text style={styles.badgeBlueText}>{statusLabel}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.propGrid}>
              <View style={styles.propGridItem}>
                <Text style={styles.propGridLabel}>Monthly Rent</Text>
                <Text style={styles.propGridValue}>{rent}</Text>
              </View>
              <View style={styles.propGridItem}>
                <Text style={styles.propGridLabel}>Advance Amount</Text>
                <Text style={styles.propGridValue}>{advance}</Text>
              </View>
              <View style={styles.propGridItem}>
                <Text style={styles.propGridLabel}>Booking Charges</Text>
                <Text style={styles.propGridValue}>{booking}</Text>
              </View>
              <View style={styles.propGridItem}>
                <Text style={styles.propGridLabel}>Maintenance</Text>
                <Text style={styles.propGridValue}>{maintenance}</Text>
              </View>
            </View>

            <View style={styles.ownerInfoBlock}>
              <Text style={styles.ownerInfoTitle}>Owner posted</Text>
              <View style={styles.ownerPillsRow}>
                <View style={[styles.ownerPill, ownerRules.drinksAllowed ? styles.ownerPillOk : styles.ownerPillNo]}>
                  <Ionicons name={ownerRules.drinksAllowed ? 'checkmark' : 'close'} size={14} color={ownerRules.drinksAllowed ? '#166534' : '#991b1b'} />
                  <Text style={[styles.ownerPillText, ownerRules.drinksAllowed ? styles.ownerPillTextOk : styles.ownerPillTextNo]}>
                    Drinks
                  </Text>
                </View>
                <View style={[styles.ownerPill, ownerRules.smokingAllowed ? styles.ownerPillOk : styles.ownerPillNo]}>
                  <Ionicons name={ownerRules.smokingAllowed ? 'checkmark' : 'close'} size={14} color={ownerRules.smokingAllowed ? '#166534' : '#991b1b'} />
                  <Text style={[styles.ownerPillText, ownerRules.smokingAllowed ? styles.ownerPillTextOk : styles.ownerPillTextNo]}>
                    Smoking
                  </Text>
                </View>
                <View style={[styles.ownerPill, ownerRules.lateNightAllowed ? styles.ownerPillOk : styles.ownerPillNo]}>
                  <Ionicons name={ownerRules.lateNightAllowed ? 'checkmark' : 'close'} size={14} color={ownerRules.lateNightAllowed ? '#166534' : '#991b1b'} />
                  <Text style={[styles.ownerPillText, ownerRules.lateNightAllowed ? styles.ownerPillTextOk : styles.ownerPillTextNo]}>
                    Late coming
                  </Text>
                </View>
                <View style={[styles.ownerPill, ownerRules.friendsAllowed ? styles.ownerPillOk : styles.ownerPillNo]}>
                  <Ionicons name={ownerRules.friendsAllowed ? 'checkmark' : 'close'} size={14} color={ownerRules.friendsAllowed ? '#166534' : '#991b1b'} />
                  <Text style={[styles.ownerPillText, ownerRules.friendsAllowed ? styles.ownerPillTextOk : styles.ownerPillTextNo]}>
                    Friends
                  </Text>
                </View>
                <View style={[styles.ownerPill, ownerRules.bikeAllowed ? styles.ownerPillOk : styles.ownerPillNo]}>
                  <Ionicons name={ownerRules.bikeAllowed ? 'checkmark' : 'close'} size={14} color={ownerRules.bikeAllowed ? '#166534' : '#991b1b'} />
                  <Text style={[styles.ownerPillText, ownerRules.bikeAllowed ? styles.ownerPillTextOk : styles.ownerPillTextNo]}>
                    Bike
                  </Text>
                </View>
              </View>
              <View style={styles.ownerAmenitiesRow}>
                {!!ownerAmenities.furnished && (
                  <Text style={styles.ownerAmenityText}>Furnishing: {ownerAmenities.furnished}</Text>
                )}
                {ownerAmenities.kitchen ? <Text style={styles.ownerAmenityText}>Kitchen</Text> : null}
                {ownerAmenities.bed ? <Text style={styles.ownerAmenityText}>Bed</Text> : null}
                {ownerAmenities.ac ? <Text style={styles.ownerAmenityText}>AC</Text> : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.contentPad}>
          <Text style={styles.sectionTitle}>Your Offer</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Offer Price (Monthly Rent)</Text>
            <View style={styles.moneyInputWrap}>
              <Text style={styles.moneyPrefix}>₹</Text>
              <TextInput
                value={offerPrice}
                onChangeText={setOfferPrice}
                keyboardType="numeric"
                placeholder="15000"
                style={styles.moneyInput}
              />
              <Text style={styles.moneySuffix}>/mo</Text>
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Joining date estimate</Text>
            <View style={styles.moneyInputWrap}>
              <TextInput
                value={joiningDateEstimate}
                onChangeText={setJoiningDateEstimate}
                placeholder="e.g. 10 Jan 2026"
                style={[styles.moneyInput, { paddingLeft: 0 }]}
              />
            </View>

            {expectedRentInfo ? (
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.infoText}>
                  Owner expects {moneyLabel(expectedRentInfo.ownerRent)}. Offers within 10% range ({moneyLabel(expectedRentInfo.lo)} - {moneyLabel(expectedRentInfo.hi)}) are more likely to be accepted.
                </Text>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.infoText}>Enter your best offer for monthly rent.</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Offer details</Text>
            <View style={styles.inlineTwoCol}>
              <View style={styles.inlineCol}>
                <Text style={styles.label}>Advance (optional)</Text>
                <View style={styles.moneyInputWrapSm}>
                  <Text style={styles.moneyPrefix}>₹</Text>
                  <TextInput
                    value={offerAdvance}
                    onChangeText={setOfferAdvance}
                    keyboardType="numeric"
                    placeholder="30000"
                    style={styles.moneyInputSm}
                  />
                </View>
              </View>
              <View style={styles.inlineCol}>
                <Text style={styles.label}>Booking (optional)</Text>
                <View style={styles.moneyInputWrapSm}>
                  <Text style={styles.moneyPrefix}>₹</Text>
                  <TextInput
                    value={offerBooking}
                    onChangeText={setOfferBooking}
                    keyboardType="numeric"
                    placeholder="5000"
                    style={styles.moneyInputSm}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.subSectionTitle}>Confirm options</Text>
            <Text style={styles.cardSubtitle}>
              Tick the boxes that apply to you. This will be compared with owner rules.
            </Text>

            <CheckboxRow
              title="Drinks / Smoking"
              subtitle={ownerRules.drinksAllowed || ownerRules.smokingAllowed ? 'Owner allows (as per post)' : 'Owner does not allow (as per post)'}
              value={prefDrinks}
              onToggle={() => setPrefDrinks((v) => !v)}
            />
            <CheckboxRow
              title="Bike Parking"
              subtitle={ownerRules.bikeAllowed ? 'Owner allows bike parking' : 'Owner does not allow bike parking'}
              value={prefBikeParking}
              onToggle={() => setPrefBikeParking((v) => !v)}
            />
            <CheckboxRow
              title="Late Night Entry"
              subtitle={ownerRules.lateNightAllowed ? 'Owner allows late entry' : 'Owner does not allow late entry'}
              value={prefLateEntry}
              onToggle={() => setPrefLateEntry((v) => !v)}
            />
            <CheckboxRow
              title="Friends / Visitors"
              subtitle={ownerRules.friendsAllowed ? 'Owner allows friends/visitors' : 'Owner does not allow friends/visitors'}
              value={prefFriends}
              onToggle={() => setPrefFriends((v) => !v)}
            />
            <CheckboxRow
              title="Family staying"
              subtitle="Family members will stay with me"
              value={prefFamily}
              onToggle={() => setPrefFamily((v) => !v)}
            />

            <CheckboxRow
              title="I accept owner rules & conditions"
              subtitle="Required to submit offer"
              value={acceptsRules}
              onToggle={() => setAcceptsRules((v) => !v)}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Who will be staying?</Text>
            <View style={styles.segmentGrid}>
              <SegmentButton
                label="Single"
                icon="person-outline"
                selected={tenantGroup === 'single'}
                onPress={() => setTenantGroup('single')}
              />
              <SegmentButton
                label="Married"
                icon="people-outline"
                selected={tenantGroup === 'married'}
                onPress={() => setTenantGroup('married')}
              />
              <SegmentButton
                label="Family"
                icon="home-outline"
                selected={tenantGroup === 'family'}
                onPress={() => setTenantGroup('family')}
              />
              <SegmentButton
                label="Students"
                icon="school-outline"
                selected={tenantGroup === 'students'}
                onPress={() => setTenantGroup('students')}
              />
            </View>
          </View>

          <View style={styles.matchCard}>
            <View>
              <Text style={styles.matchTitle}>Profile Match</Text>
              <Text style={styles.matchSubtitle}>Based on owner preferences</Text>
            </View>
            <View style={styles.ringWrap}>
              <Svg width={64} height={64} viewBox="0 0 36 36" style={styles.ringSvg}>
                <Path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={3}
                />
                <Path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={3}
                  strokeDasharray={circleDash}
                />
              </Svg>
              <Text style={styles.ringText}>{matchPercent}%</Text>
            </View>
          </View>

          <Text style={styles.matchHint}>
            High match scores increase acceptance probability by 3x.
          </Text>

          <Text style={styles.sectionTitle}>Full Details</Text>

          <View style={styles.card}>
            <SectionHeader title="Property" />
            <FieldRow icon="business-outline" label="Property type" value={dealDetails.property.propertyType} />
            <FieldRow icon="pricetags-outline" label="Listing type" value={dealDetails.property.listingType} />
            <FieldRow icon="grid-outline" label="Configuration" value={dealDetails.property.configuration} />
            <FieldRow icon="shirt-outline" label="Furnishing" value={dealDetails.property.furnishing} />
            <FieldRow icon="apps-outline" label="Number of rooms" value={dealDetails.property.numberOfRooms} />
            <FieldRow icon="layers-outline" label="Floor" value={dealDetails.property.floor} isLast />
          </View>

          <View style={styles.card}>
            <SectionHeader title="Charges & Utilities" />
            <FieldRow icon="water-outline" label="Water charges" value={dealDetails.charges.waterCharges} />
            <FieldRow icon="flash-outline" label="Electricity unit price" value={dealDetails.charges.electricityUnitPrice} />
            <FieldRow icon="sparkles-outline" label="Cleaning charges" value={dealDetails.charges.cleaningCharges} />
            <FieldRow icon="restaurant-outline" label="Food charges" value={dealDetails.charges.foodCharges} />
            <FieldRow icon="construct-outline" label="Yearly maintenance" value={dealDetails.charges.yearlyMaintenance} />
            <FieldRow icon="trending-up-outline" label="% of increase" value={dealDetails.charges.percentIncrease} />
            <FieldRow icon="card-outline" label="Booking charges" value={dealDetails.charges.bookingCharges} isLast />
          </View>

          <View style={styles.card}>
            <SectionHeader title="Validity" />
            <FieldRow icon="calendar-outline" label="Validity" value={dealDetails.validity.validity} />
            <FieldRow icon="time-outline" label="Booking days" value={dealDetails.validity.bookingDays} isLast />
          </View>

          <View style={styles.card}>
            <SectionHeader title="Amenities provided" />
            <Text style={styles.simpleText}>
              {dealDetails.amenities.list.length ? dealDetails.amenities.list.join(', ') : 'No amenities added'}
            </Text>
          </View>

          <View style={styles.card}>
            <SectionHeader title="Tenant rules & preferences" />
            <FieldRow icon="wine-outline" label="Drinks policy" value={dealDetails.rules.drinksPolicy} />
            <FieldRow icon="flame-outline" label="Smoking policy" value={dealDetails.rules.smokingPolicy} />
            <FieldRow icon="moon-outline" label="Late night policy" value={dealDetails.rules.lateNightPolicy} />
            <FieldRow icon="people-outline" label="Friends/visitors" value={dealDetails.rules.friendsAllowed ? 'Allowed' : 'Not allowed'} />
            <FieldRow icon="car-sport-outline" label="Parking type" value={dealDetails.rules.parkingType} />
            <FieldRow
              icon="person-outline"
              label="Preferred tenant"
              value={dealDetails.rules.preferredTenantTypes.length ? dealDetails.rules.preferredTenantTypes.join(', ') : '-'}
              isLast
            />
          </View>

          <View style={{ height: 90 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomInner}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, submitting ? styles.submitBtnDisabled : null]}
            onPress={handleSubmit}
            activeOpacity={0.9}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? 'Submitting...' : alreadySubmitted ? 'Resubmit Offer' : 'Submit Offer'}
            </Text>
            {!submitting && <Ionicons name="send" size={16} color="#ffffff" />}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: theme.colors.text,
  },
  body: {
    paddingBottom: 24,
  },
  sectionPad: {
    padding: 16,
  },
  contentPad: {
    paddingHorizontal: 16,
  },
  propertyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  propertyTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  propertyImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  propertyTopMeta: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  propertyAddress: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badgeGreen: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
  },
  badgeGreenText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  badgeBlue: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
  },
  badgeBlueText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  propGrid: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  propGridItem: {
    width: '50%',
    paddingVertical: 8,
    paddingRight: 10,
  },
  propGridLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  propGridValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text,
  },
  ownerInfoBlock: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ownerInfoTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 8,
  },
  ownerPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  ownerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ownerPillOk: {
    backgroundColor: '#dcfce7',
  },
  ownerPillNo: {
    backgroundColor: '#fee2e2',
  },
  ownerPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  ownerPillTextOk: {
    color: '#166534',
  },
  ownerPillTextNo: {
    color: '#991b1b',
  },
  ownerAmenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ownerAmenityText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  moneyInputWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moneyPrefix: {
    fontSize: 16,
    fontWeight: '900',
    color: '#6b7280',
    marginRight: 6,
  },
  moneyInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
    paddingVertical: 2,
  },
  moneyInputWrapSm: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moneyInputSm: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text,
    paddingVertical: 2,
  },
  moneySuffix: {
    fontSize: 13,
    fontWeight: '900',
    color: '#6b7280',
    marginLeft: 6,
  },
  infoRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  inlineTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  inlineCol: {
    flex: 1,
  },
  subSectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
  },
  checkTextWrap: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text,
  },
  checkSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  fieldLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabelIcon: {
    marginTop: 1,
  },
  fieldRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textSecondary,
  },
  fieldValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text,
    lineHeight: 16,
  },
  simpleText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
  },
  segmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  segmentBtn: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
  },
  segmentBtnActive: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: '#dbeafe',
  },
  segmentBtnLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#374151',
  },
  segmentBtnLabelActive: {
    color: theme.colors.primary,
  },
  matchCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 2,
  },
  matchSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
  },
  ringWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  ringText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  matchHint: {
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomInner: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  successCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  successIconWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  successTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  successSubtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  successOkBtn: {
    marginTop: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOkBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  confirmSubtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  confirmBtnRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontWeight: '900',
    fontSize: 14,
    color: '#111827',
  },
  confirmResubmitBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmResubmitText: {
    fontWeight: '900',
    fontSize: 14,
    color: '#ffffff',
  },
});
