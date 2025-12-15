import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Switch,
  Linking,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../theme';
import PropertyImageSlider from '../components/PropertyImageSlider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSessionUser } from '../session';

const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://home-backend-zc1d.onrender.com';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);
const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';

const { width, height } = Dimensions.get('window');

export default function PropertyDetailsScreen({ route, navigation }) {
  const passedProperty = route?.params?.property || {};
  const propertyList = Array.isArray(route?.params?.propertyList)
    ? route.params.propertyList
    : null;
  const initialIndex = typeof route?.params?.index === 'number'
    ? route.params.index
    : 0;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const property = useMemo(() => {
    if (propertyList && propertyList[currentIndex]) {
      return propertyList[currentIndex];
    }
    return passedProperty;
  }, [propertyList, currentIndex, passedProperty]);
  const [isAvailable, setIsAvailable] = useState(
    property.status !== 'occupied',
  );
  const [openAmenities, setOpenAmenities] = useState(false);
  const [openRules, setOpenRules] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerData, setOfferData] = useState({
    offerRent: '',
    joiningDateEstimate: '',
    offerAdvance: '',
    offerBookingAmount: '',
    needsBikeParking: false,
    needsCarParking: false,
    tenantType: '',
    acceptsRules: false,
  });

  const roleFromParams = String(route?.params?.fromRole || '').trim().toLowerCase();
  const sessionRole = String(getSessionUser()?.role || '').trim().toLowerCase();
  const [storedRole, setStoredRole] = useState('');
  const resolvedRole = roleFromParams || sessionRole || storedRole;
  const isTenant = resolvedRole === 'tenant' || resolvedRole === 'tenent';

  React.useEffect(() => {
    let mounted = true;
    const loadRole = async () => {
      try {
        const json = await AsyncStorage.getItem('USER_PROFILE');
        const user = json ? JSON.parse(json) : null;
        if (!mounted) return;
        setStoredRole(String(user?.role || '').trim().toLowerCase());
      } catch (e) {}
    };
    loadRole();
    return () => {
      mounted = false;
    };
  }, []);

  const photos = Array.isArray(property.photos) ? property.photos : [];

  const title = property.propertyName || 'Property details';
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
    : 'Property type not set';

  const rentAmount = property.rentAmount
    ? `₹${property.rentAmount}/month`
    : 'Not set';
  const advanceAmount = property.advanceAmount
    ? `₹${property.advanceAmount}`
    : 'Not set';
  const utilitiesAmount = property.waterCharges || property.electricityPerUnit
    ? `${property.waterCharges || 0} / ${property.electricityPerUnit || 0}`
    : 'Not set';

  const amenitiesText =
    Array.isArray(property.amenities) && property.amenities.length
      ? property.amenities.join(', ')
      : 'No amenities added';

  const rulesSummary = [];
  if (property.drinksPolicy === 'not_allowed') rulesSummary.push('No drinks');
  if (property.smokingPolicy === 'not_allowed') rulesSummary.push('No smoking');
  if (property.lateNightPolicy === 'not_allowed')
    rulesSummary.push('No late night coming');
  const rulesText = rulesSummary.length
    ? rulesSummary.join(', ')
    : 'Rules not specified';

  const ownerTenantTypes = Array.isArray(property.preferredTenantTypes)
    ? property.preferredTenantTypes
    : [];

  const ownerParkingType = String(property.parkingType || 'none').trim().toLowerCase();
  const ownerAllowsBike = ownerParkingType === 'bike' || ownerParkingType === 'both';
  const ownerAllowsCar = ownerParkingType === 'car' || ownerParkingType === 'both';

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const parseMoney = (v) => {
    const n = Number(String(v || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  const computeOfferMatchPercent = () => {
    const ownerRent = parseMoney(property.rentAmount);
    const ownerAdvance = parseMoney(property.advanceAmount);
    const ownerBooking = parseMoney(property.bookingAdvance);

    const offerRent = parseMoney(offerData.offerRent);
    const offerAdvance = parseMoney(offerData.offerAdvance);
    const offerBooking = parseMoney(offerData.offerBookingAmount);

    let score = 0;
    let total = 0;

    const addBinary = (ok) => {
      total += 1;
      if (ok) score += 1;
    };

    const addMoney = (ownerVal, offerVal) => {
      if (ownerVal == null || ownerVal <= 0 || offerVal == null || offerVal < 0) return;
      total += 1;
      const ratio = offerVal / ownerVal;
      const closeness = Math.max(0, 1 - Math.abs(1 - ratio));
      score += Math.min(1, closeness);
    };

    addMoney(ownerRent, offerRent);
    addMoney(ownerAdvance, offerAdvance);
    addMoney(ownerBooking, offerBooking);

    if (ownerTenantTypes.length) {
      addBinary(ownerTenantTypes.includes(offerData.tenantType));
    }

    if (offerData.needsBikeParking) addBinary(ownerAllowsBike);
    if (offerData.needsCarParking) addBinary(ownerAllowsCar);

    if (rulesSummary.length) addBinary(offerData.acceptsRules);

    if (total === 0) return 0;
    return Math.round((score / total) * 100);
  };

  const offerMatchPercent = computeOfferMatchPercent();

  const statusLabel = property.status === 'occupied' ? 'Occupied' : 'Open';
  const statusBoxColor =
    property.status === 'occupied' ? '#ffe5e5' : '#dff6e6';
  const statusTextColor =
    property.status === 'occupied' ? '#c53030' : '#1b8a66';

  const handleOpenMap = () => {
    const raw = (property.mapLocation || '').trim();
    if (!raw) return;

    const isUrl = raw.startsWith('http://') || raw.startsWith('https://');
    const targetUrl = isUrl
      ? raw
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(raw)}`;

    Linking.openURL(targetUrl).catch(() => {});
  };

  const handleCall = () => {
    const phone = String(property.contactPhone || property.phone || property.ownerPhone || '').trim();
    if (!phone) {
      Alert.alert('Call', 'Phone number not available for this property.');
      return;
    }
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleChat = () => {
    navigation.navigate('Main', { screen: 'Chat' });
  };

  const handleMakeOffer = () => {
    navigation.navigate('MakeOffer', { property });
  };

  const submitOffer = async () => {
    console.log('[submitOffer] clicked');
    if (submittingOffer) return;

    const offerRent = parseMoney(offerData.offerRent);
    if (offerRent == null || offerRent <= 0) {
      console.log('[submitOffer] validation failed: offerRent', offerData.offerRent);
      Alert.alert('Offer', 'Please enter a valid offer price.');
      return;
    }
    if (!String(offerData.joiningDateEstimate || '').trim()) {
      console.log('[submitOffer] validation failed: joiningDateEstimate', offerData.joiningDateEstimate);
      Alert.alert('Offer', 'Please enter joining date estimate.');
      return;
    }
    if (rulesSummary.length && !offerData.acceptsRules) {
      console.log('[submitOffer] validation failed: acceptsRules false');
      Alert.alert('Offer', 'Please accept the owner rules / conditions.');
      return;
    }

    const payload = {
      propertyId: property?._id,
      offer: {
        offerRent,
        joiningDateEstimate: String(offerData.joiningDateEstimate || '').trim(),
        offerAdvance: parseMoney(offerData.offerAdvance),
        offerBookingAmount: parseMoney(offerData.offerBookingAmount),
        needsBikeParking: !!offerData.needsBikeParking,
        needsCarParking: !!offerData.needsCarParking,
        tenantType: String(offerData.tenantType || '').trim(),
        acceptsRules: !!offerData.acceptsRules,
        matchPercent: offerMatchPercent,
      },
    };

    try {
      setSubmittingOffer(true);
      const authHeaders = await getAuthHeaders();
      console.log('[submitOffer] API_BASE_URL:', API_BASE_URL);
      console.log('[submitOffer] has auth header:', !!authHeaders?.Authorization);
      if (!authHeaders?.Authorization) {
        Alert.alert('Session', 'Please login again. Token missing.');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      try {
        const clone = response.clone();
        const text = await clone.text();
        console.log('[submitOffer] status:', response.status);
        console.log('[submitOffer] response:', text);
      } catch (e) {}

      if (!response.ok) {
        let msg = 'Failed to submit offer.';
        try {
          const data = await response.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Offer', msg);
        return;
      }

      setOfferOpen(false);
      Alert.alert('Offer', 'Offer submitted to owner.');
    } catch (e) {
      Alert.alert('Offer', 'Network error while submitting offer.');
    } finally {
      setSubmittingOffer(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#2b2b2b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Property details</Text>
          <View style={styles.headerRightIcons}>
            {propertyList && propertyList.length > 1 && (
              <>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() =>
                    setCurrentIndex((prev) =>
                      propertyList && prev > 0 ? prev - 1 : prev,
                    )
                  }
                >
                  <Ionicons name="chevron-back" size={18} color="#2b2b2b" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() =>
                    setCurrentIndex((prev) =>
                      propertyList && prev < propertyList.length - 1
                        ? prev + 1
                        : prev,
                    )
                  }
                >
                  <Ionicons name="chevron-forward" size={18} color="#2b2b2b" />
                </TouchableOpacity>
              </>
            )}
            {!isTenant && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  navigation.navigate('Main', {
                    screen: 'Property',
                    params: { editFromDetails: property },
                  })
                }
              >
                <Ionicons name="pencil" size={18} color="#2b2b2b" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={22} color="#2b2b2b" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main image */}
          <View style={styles.imageCard}>
            <PropertyImageSlider
              photos={photos}
              maxImages={5}
              autoSlide
              autoSlideIntervalMs={3000}
              height={Math.round(height * 0.32)}
              borderRadius={12}
              showThumbnails
            />
          </View>

          {/* Title row + status */}
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.titleText}>{title}</Text>
              {!!address && (
                <Text style={styles.subtitleText}>{address}</Text>
              )}
              <Text style={styles.subtitleText}>{typeLabel}</Text>
            </View>
            <View
              style={[
                styles.statusBox,
                { backgroundColor: statusBoxColor },
              ]}
            >
              <Text style={[styles.statusText, { color: statusTextColor }]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Section: Property details */}
          <View style={styles.smallCard}>
            <Text style={styles.sectionHeading}>Property Details</Text>
            <RowLabel label="Name" value={property.propertyName || '-'} />
            <RowLabel label="Category" value={property.category || '-'} />
            <RowLabel label="Listing Type" value={property.listingType || '-'} />
            <RowLabel label="Mode" value={property.mode || '-'} />
            <RowLabel label="Configuration (BHK)" value={property.bhk || '-'} />
            <RowLabel label="Furnishing" value={property.furnishing || '-'} />
            <RowLabel
              label="Floor"
              value={property.floor || property.customFloor || '-'}
            />
            <RowLabel label="Total Rooms" value={property.totalRooms || '-'} />
          </View>

          {/* Section: Address & Map */}
          <View style={styles.smallCard}>
            <Text style={styles.sectionHeading}>Address & Location</Text>
            <RowLabel label="Address" value={property.address || '-'} />

            {property.mapLocation ? (
              <TouchableOpacity style={styles.mapRow} onPress={handleOpenMap}>
                <View>
                  <Text style={styles.rowLabelLeft}>Map Location</Text>
                </View>
                <View style={styles.mapRowRight}>
                  <Ionicons
                    name="map-outline"
                    size={16}
                    color={theme.colors.primary}
                    style={styles.mapIcon}
                  />
                  <Text style={styles.mapLinkText} numberOfLines={1}>
                    Open in Google Maps
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <RowLabel label="Map Location" value="-" />
            )}
          </View>

          {/* Section: Rent & Availability */}
          <View style={styles.infoCard}>
            {!isTenant && (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.roundIconRed}>
                    <MaterialCommunityIcons
                      name="home-city"
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoTitle}>
                      {isAvailable ? 'Open' : 'Closed'}
                    </Text>
                    <Text style={styles.infoSub}>
                      {isAvailable
                        ? 'Property is visible for tenants'
                        : 'Temporarily unavailable'}
                    </Text>
                  </View>
                  <Switch
                    value={isAvailable}
                    onValueChange={setIsAvailable}
                    trackColor={{ true: '#A7E3C4', false: '#e6e6e6' }}
                    thumbColor={isAvailable ? '#12a454' : '#ffffff'}
                  />
                </View>

                <View style={styles.divider} />
              </>
            )}

            <View style={styles.infoRow}>
              <View style={styles.roundIconBlue}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Rent & Charges</Text>
                <Text style={styles.infoSub}>Monthly Rent: {rentAmount}</Text>
              </View>
            </View>
          </View>

          {/* Charges small rows */}
          <View style={styles.smallCard}>
            <RowLabel label="Monthly Rent" value={rentAmount} />
            <RowLabel label="Security Deposit" value={advanceAmount} />
            <RowLabel label="Water / Electricity" value={utilitiesAmount} />
          </View>

          {/* Accordion: Amenities */}
          <TouchableOpacity
            style={styles.accordion}
            onPress={() => setOpenAmenities(!openAmenities)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.ovalIcon}>
                <MaterialCommunityIcons
                  name="basket"
                  size={18}
                  color="#fff"
                />
              </View>
              <Text style={styles.accordionTitle}>Amenities</Text>
            </View>
            <Ionicons
              name={openAmenities ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6b7a90"
            />
          </TouchableOpacity>
          {openAmenities && (
            <View style={styles.accordionContent}>
              <Text style={styles.contentText}>{amenitiesText}</Text>
            </View>
          )}

          {/* Accordion: Tenant & Rules */}
          <TouchableOpacity
            style={styles.accordion}
            onPress={() => setOpenRules(!openRules)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.ovalIconGray}>
                <MaterialCommunityIcons
                  name="account"
                  size={18}
                  color="#fff"
                />
              </View>
              <Text style={styles.accordionTitle}>Tenant & Rules</Text>
            </View>
            <Ionicons
              name={openRules ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6b7a90"
            />
          </TouchableOpacity>
          {openRules && (
            <View style={styles.accordionContent}>
              <Text style={styles.contentText}>{rulesText}</Text>
            </View>
          )}

          <View style={{ height: 90 }} />
        </ScrollView>

        <Modal
          transparent
          visible={offerOpen}
          animationType="slide"
          onRequestClose={() => setOfferOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Make Offer</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setOfferOpen(false)}
                >
                  <Ionicons name="close" size={22} color="#1b263b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.compareWrap}>
                  <View style={styles.compareCol}>
                    <Text style={styles.compareHeading}>Owner Terms</Text>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Rent</Text>
                      <Text style={styles.compareValue}>{rentAmount}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Advance</Text>
                      <Text style={styles.compareValue}>{advanceAmount}</Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Booking Amount</Text>
                      <Text style={styles.compareValue}>
                        {property.bookingAdvance ? `₹${property.bookingAdvance}` : 'Not set'}
                      </Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Booking Validity</Text>
                      <Text style={styles.compareValue}>
                        {property.bookingValidityDays
                          ? `${property.bookingValidityDays} days`
                          : 'Not set'}
                      </Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Parking</Text>
                      <Text style={styles.compareValue}>
                        {property.parkingType ? String(property.parkingType) : 'Not set'}
                      </Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Preferred Tenants</Text>
                      <Text style={styles.compareValue}>
                        {ownerTenantTypes.length ? ownerTenantTypes.join(', ') : 'Not set'}
                      </Text>
                    </View>
                    <View style={styles.compareRow}>
                      <Text style={styles.compareLabel}>Rules</Text>
                      <Text style={styles.compareValue}>{rulesText}</Text>
                    </View>
                  </View>

                  <View style={styles.compareDivider} />

                  <View style={styles.compareCol}>
                    <Text style={styles.compareHeading}>Your Offer</Text>

                    <Text style={styles.inputLabel}>Offer price (per month)</Text>
                    <TextInput
                      value={offerData.offerRent}
                      onChangeText={(t) =>
                        setOfferData((p) => ({ ...p, offerRent: t }))
                      }
                      keyboardType="numeric"
                      placeholder="Enter your offer rent"
                      style={styles.input}
                    />

                    <Text style={styles.inputLabel}>Joining date estimate</Text>
                    <TextInput
                      value={offerData.joiningDateEstimate}
                      onChangeText={(t) =>
                        setOfferData((p) => ({ ...p, joiningDateEstimate: t }))
                      }
                      placeholder="e.g. 10 Jan 2026"
                      style={styles.input}
                    />

                    <Text style={styles.inputLabel}>Advance (optional)</Text>
                    <TextInput
                      value={offerData.offerAdvance}
                      onChangeText={(t) =>
                        setOfferData((p) => ({ ...p, offerAdvance: t }))
                      }
                      keyboardType="numeric"
                      placeholder="Enter advance"
                      style={styles.input}
                    />

                    <Text style={styles.inputLabel}>Booking amount (optional)</Text>
                    <TextInput
                      value={offerData.offerBookingAmount}
                      onChangeText={(t) =>
                        setOfferData((p) => ({ ...p, offerBookingAmount: t }))
                      }
                      keyboardType="numeric"
                      placeholder="Enter booking amount"
                      style={styles.input}
                    />

                    <Text style={styles.inputLabel}>Parking needed</Text>
                    <View style={styles.checkRow}>
                      <TouchableOpacity
                        style={styles.checkItem}
                        onPress={() =>
                          setOfferData((p) => ({
                            ...p,
                            needsBikeParking: !p.needsBikeParking,
                          }))
                        }
                      >
                        <Ionicons
                          name={offerData.needsBikeParking ? 'checkbox' : 'square-outline'}
                          size={18}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.checkText}>Bike</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.checkItem}
                        onPress={() =>
                          setOfferData((p) => ({
                            ...p,
                            needsCarParking: !p.needsCarParking,
                          }))
                        }
                      >
                        <Ionicons
                          name={offerData.needsCarParking ? 'checkbox' : 'square-outline'}
                          size={18}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.checkText}>Car</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Tenant type</Text>
                    <TextInput
                      value={offerData.tenantType}
                      onChangeText={(t) =>
                        setOfferData((p) => ({ ...p, tenantType: t }))
                      }
                      placeholder="e.g. Working Boys / Small Family"
                      style={styles.input}
                    />

                    <TouchableOpacity
                      style={styles.checkItem}
                      onPress={() =>
                        setOfferData((p) => ({
                          ...p,
                          acceptsRules: !p.acceptsRules,
                        }))
                      }
                    >
                      <Ionicons
                        name={offerData.acceptsRules ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.checkText}>I accept owner rules & conditions</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.matchBox}>
                  <Text style={styles.matchLabel}>Matching profile</Text>
                  <Text style={styles.matchValue}>{offerMatchPercent}%</Text>
                </View>

                <TouchableOpacity
                  style={[styles.submitOfferBtn, submittingOffer && styles.submitOfferBtnDisabled]}
                  onPress={submitOffer}
                  disabled={submittingOffer}
                >
                  <Text style={styles.submitOfferBtnText}>
                    {submittingOffer ? 'Submitting...' : 'Submit Offer'}
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 12 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Bottom fixed actions */}
        <View style={styles.bottomBar}>
          {isTenant ? (
            <View style={styles.tenantActionsRow}>
              <TouchableOpacity style={styles.tenantBtn} onPress={handleCall}>
                <Text style={styles.tenantBtnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tenantBtn} onPress={handleChat}>
                <Text style={styles.tenantBtnText}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tenantBtnPrimary} onPress={handleMakeOffer}>
                <Text style={styles.tenantBtnPrimaryText}>Make Offer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Manage Property</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function RowLabel({ label, value }) {
  return (
    <View style={styles.rowLabel}>
      <Text style={styles.rowLabelLeft}>{label}</Text>
      <Text style={styles.rowLabelRight}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f2f5f9',
  },
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e6eaf2',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b263b',
  },
  iconBtn: {
    padding: 8,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 0,
  },
  imageCard: {
    width: '100%',
    height: Math.round(height * 0.32),
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#dfe9f3',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b2545',
  },
  subtitleText: {
    fontSize: 13,
    color: '#6b7a90',
    marginTop: 4,
  },
  statusBox: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  roundIconRed: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roundIconBlue: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#5b9dff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f3f8',
    marginVertical: 8,
  },
  smallCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: '#f0f3f8',
    borderBottomWidth: 1,
  },
  rowLabelLeft: {
    color: '#6b7a90',
    fontSize: 14,
  },
  rowLabelRight: {
    color: '#0b2545',
    fontWeight: '700',
    fontSize: 14,
  },
  accordion: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  ovalIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#7b61ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ovalIconGray: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#9aa4b2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b2545',
  },
  accordionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  contentText: {
    fontSize: 14,
    color: '#475569',
    marginVertical: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 0.5,
    borderTopColor: '#e6eaf2',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tenantActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tenantBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 10,
  },
  tenantBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  tenantBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenantBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  primaryBtn: {
    width: width - 32,
    backgroundColor: '#0b76ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0b2545',
  },
  modalCloseBtn: {
    padding: 6,
  },
  compareWrap: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e6eaf2',
    borderRadius: 12,
    overflow: 'hidden',
  },
  compareCol: {
    flex: 1,
    padding: 12,
  },
  compareDivider: {
    width: 1,
    backgroundColor: '#e6eaf2',
  },
  compareHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1b263b',
    marginBottom: 10,
  },
  compareRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f3f8',
  },
  compareLabel: {
    fontSize: 12,
    color: '#6b7a90',
    marginBottom: 4,
  },
  compareValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b2545',
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7a90',
    marginTop: 6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6eaf2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0b2545',
    backgroundColor: '#ffffff',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginRight: 14,
  },
  checkText: {
    fontSize: 13,
    color: '#0b2545',
    fontWeight: '600',
    marginLeft: 8,
  },
  matchBox: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f2f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchLabel: {
    fontSize: 13,
    color: '#6b7a90',
    fontWeight: '700',
  },
  matchValue: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '900',
  },
  submitOfferBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitOfferBtnDisabled: {
    opacity: 0.6,
  },
  submitOfferBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
});
