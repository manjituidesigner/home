import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';
import { getSessionUser } from '../session';
import LoadingOverlay from '../components/LoadingOverlay';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { API_BASE_URL } from '../apiBaseUrl';

const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const WISHLIST_STORAGE_KEY = 'WISHLIST_PROPERTIES';
const OFFER_SUBMISSIONS_KEY = 'OFFER_SUBMISSIONS_V1';

function normalizeRole(role) {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'tenant' || r === 'tenent') return 'tenant';
  if (r === 'broker') return 'broker';
  if (r === 'owner') return 'owner';
  return r;
}

function roleLabel(role) {
  const r = normalizeRole(role);
  if (r === 'tenant') return 'Tenant';
  if (r === 'broker') return 'Broker';
  if (r === 'owner') return 'Owner';
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : '';
}

function formatPostedDate(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

function MiniBar({ label, value, max, color }) {
  const safeMax = Math.max(1, Number(max) || 1);
  const safeValue = Math.max(0, Number(value) || 0);
  const pct = Math.max(0, Math.min(1, safeValue / safeMax));
  return (
    <View style={styles.miniBarRow}>
      <View style={styles.miniBarLabelRow}>
        <Text style={styles.miniBarLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.miniBarValue}>{safeValue}</Text>
      </View>
      <View style={styles.miniBarTrack}>
        <View style={[styles.miniBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function StatCard({
  icon,
  accent,
  title,
  value,
  subtitle,
  onPressDetails,
  detailsLabel = 'View details',
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardTopRow}>
        <View style={[styles.statIconWrap, { backgroundColor: `${accent}22` }]}
        >
          <Ionicons name={icon} size={18} color={accent} />
        </View>
        <TouchableOpacity
          style={styles.statDetailsBtn}
          onPress={onPressDetails}
          activeOpacity={0.85}
        >
          <Text style={styles.statDetailsBtnLabel}>{detailsLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.statValue}>{String(value ?? '')}</Text>
      <Text style={styles.statTitle} numberOfLines={2}>
        {title}
      </Text>
      {!!subtitle && (
        <Text style={styles.statSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState('');
  const [sessionUserId, setSessionUserId] = useState(null);
  const [tenantFeed, setTenantFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [offerSubmittedKeys, setOfferSubmittedKeys] = useState({});
  const [ownerRequestByPropertyId, setOwnerRequestByPropertyId] = useState({});
  const [tenantSearch, setTenantSearch] = useState('');

  const normalizedRole = useMemo(() => normalizeRole(role), [role]);

  const resolveImageUri = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'string') {
      const s = raw.trim();
      if (!s) return null;
      if (s.startsWith('http://') || s.startsWith('https://')) return s;
      const path = s.startsWith('/') ? s : `/${s}`;
      return `${API_BASE_URL}${path}`;
    }
    if (typeof raw === 'object') {
      if (typeof raw.uri === 'string') return resolveImageUri(raw.uri);
      if (typeof raw.url === 'string') return resolveImageUri(raw.url);
      if (typeof raw.path === 'string') return resolveImageUri(raw.path);
    }
    return null;
  };

  const filteredTenantFeed = useMemo(() => {
    if (normalizedRole !== 'tenant') return tenantFeed;
    const q = String(tenantSearch || '').trim().toLowerCase();
    if (!q) return tenantFeed;
    return (Array.isArray(tenantFeed) ? tenantFeed : []).filter((p) => {
      const name = String(p?.propertyName || '').toLowerCase();
      const addr = String(p?.address || '').toLowerCase();
      const bhk = String(p?.bhk || '').toLowerCase();
      return name.includes(q) || addr.includes(q) || bhk.includes(q);
    });
  }, [normalizedRole, tenantFeed, tenantSearch]);

  const loadWishlist = async () => {
    try {
      const json = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      const list = json ? JSON.parse(json) : [];
      const ids = Array.isArray(list)
        ? list.map((p) => p?._id).filter(Boolean)
        : [];
      setWishlistIds(ids);
    } catch (e) {
      setWishlistIds([]);
    }
  };

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadOwnerRequestsForTenant = async () => {
    if (normalizedRole !== 'tenant') return;
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        setOwnerRequestByPropertyId({});
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/offers/sent`, {
        headers: {
          ...authHeaders,
        },
      });

      if (!resp.ok) {
        setOwnerRequestByPropertyId({});
        return;
      }

      const data = await resp.json().catch(() => ({}));
      const offers = Array.isArray(data?.offers) ? data.offers : [];
      const map = {};
      for (const o of offers) {
        const action = String(o?.actionType || '').toLowerCase();
        const status = String(o?.status || '').toLowerCase();
        const pid = String(o?.propertyId?._id || o?.propertyId || '');
        if (!pid) continue;
        if (status === 'rejected' || status === 'on_hold') continue;
        if (action === 'advance_requested') {
          map[pid] = true;
        }
      }
      setOwnerRequestByPropertyId(map);
    } catch (e) {
      setOwnerRequestByPropertyId({});
    }
  };

  const loadOfferSubmitted = async () => {
    try {
      const json = await AsyncStorage.getItem(OFFER_SUBMISSIONS_KEY);
      const map = json ? JSON.parse(json) : {};
      const safe = map && typeof map === 'object' ? map : {};
      const uid = sessionUserId ? String(sessionUserId) : null;
      if (uid && safe?.byUser && typeof safe.byUser === 'object') {
        setOfferSubmittedKeys(safe.byUser?.[uid] && typeof safe.byUser[uid] === 'object' ? safe.byUser[uid] : {});
      } else {
        // Backward compatibility: old format was a flat object keyed by "uid::pid"
        setOfferSubmittedKeys(safe && typeof safe === 'object' ? safe : {});
      }
    } catch (e) {
      setOfferSubmittedKeys({});
    }
  };

  const markOfferSubmitted = async (propertyId) => {
    const pid = propertyId ? String(propertyId) : '';
    const uid = sessionUserId ? String(sessionUserId) : '';
    if (!pid || !uid) return;
    const key = `${uid}::${pid}`;
    try {
      const json = await AsyncStorage.getItem(OFFER_SUBMISSIONS_KEY);
      const raw = json ? JSON.parse(json) : {};
      const safe = raw && typeof raw === 'object' ? raw : {};
      const next = { ...safe };

      // migrate old unknown_user key (used in older Dashboard builds)
      const unknownKey = `unknown_user::${pid}`;
      if (next?.[unknownKey]) {
        delete next[unknownKey];
      }

      // If using new structure, maintain byUser map
      if (!next.byUser || typeof next.byUser !== 'object') next.byUser = {};
      if (!next.byUser[uid] || typeof next.byUser[uid] !== 'object') next.byUser[uid] = {};
      next.byUser[uid][key] = { submittedAt: Date.now() };

      await AsyncStorage.setItem(OFFER_SUBMISSIONS_KEY, JSON.stringify(next));
      setOfferSubmittedKeys((prev) => ({ ...prev, [key]: { submittedAt: Date.now() } }));
    } catch (e) {
      setOfferSubmittedKeys((prev) => ({ ...prev, [key]: true }));
    }
  };

  const toggleWishlist = async (property) => {
    const id = property?._id;
    if (!id) return;
    try {
      const json = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      const list = json ? JSON.parse(json) : [];
      const arr = Array.isArray(list) ? list : [];
      const exists = arr.some((p) => p?._id === id);
      const next = exists ? arr.filter((p) => p?._id !== id) : [property, ...arr];
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      setWishlistIds(next.map((p) => p?._id).filter(Boolean));
    } catch (e) {}
  };

  useEffect(() => {
    const load = async () => {
      try {
        const sessionUser = getSessionUser();
        if (sessionUser) {
          if (sessionUser?.firstName) setFirstName(String(sessionUser.firstName));
          if (sessionUser?.role) setRole(String(sessionUser.role));
          if (sessionUser?._id || sessionUser?.id) setSessionUserId(sessionUser?._id || sessionUser?.id);
        }
        const json = await AsyncStorage.getItem('USER_PROFILE');
        if (!json) return;
        const user = JSON.parse(json);
        if (user?.firstName) setFirstName(String(user.firstName));
        if (user?.role) setRole(String(user.role));
        if (user?._id || user?.id) setSessionUserId(user?._id || user?.id);
      } catch (e) {}
    };
    load();
  }, []);

  useEffect(() => {
    loadWishlist();
    loadOfferSubmitted();
    loadOwnerRequestsForTenant();
    const unsub = navigation?.addListener
      ? navigation.addListener('focus', () => {
          loadWishlist();
          loadOfferSubmitted();
          loadOwnerRequestsForTenant();
        })
      : null;
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation, normalizedRole, sessionUserId]);

  useEffect(() => {
    const loadTenantFeed = async () => {
      if (normalizedRole !== 'tenant') return;
      try {
        setLoadingFeed(true);
        const response = await fetch(`${API_BASE_URL}/properties/tenant-feed`);

        const data = await response.json().catch(() => ([]));
        if (!response.ok) {
          setTenantFeed([]);
          return;
        }
        setTenantFeed(Array.isArray(data) ? data : []);
      } catch (e) {
        setTenantFeed([]);
      } finally {
        setLoadingFeed(false);
      }
    };

    loadTenantFeed();
  }, [normalizedRole]);

  return (
    <ScreenLayout
      title={firstName ? `Hi ${firstName}` : 'Dashboard'}
      subtitle={roleLabel(role) || undefined}
      showSearchRow
      onPressMenu={() => {
        if (navigation?.toggleDrawer) {
          navigation.toggleDrawer();
          return;
        }
        if (navigation?.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.root}>
        <LoadingOverlay visible={loadingFeed} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {normalizedRole === 'tenant' ? (
          <View style={styles.feedBlock}>
            <View style={styles.tenantSearchWrap}>
              <MaterialIcons name="search" size={20} color="#9ca3af" />
              <TextInput
                placeholder="Search locations, properties..."
                placeholderTextColor="#9ca3af"
                style={styles.tenantSearchInput}
                value={tenantSearch}
                onChangeText={setTenantSearch}
              />
              <TouchableOpacity style={styles.tenantFilterBtn} activeOpacity={0.85}>
                <MaterialIcons name="tune" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.tenantSectionTitle}>Available Properties</Text>

            {loadingFeed ? (
              <Text style={styles.bodyText}>Loading properties...</Text>
            ) : filteredTenantFeed.length === 0 ? (
              <Text style={styles.bodyText}>No tenant-visible properties found.</Text>
            ) : (
              <View style={styles.tenantList}>
                {filteredTenantFeed.map((item, index) => {
                  const photos = Array.isArray(item.photos) ? item.photos : [];
                  const cover = resolveImageUri(photos?.[0]);
                  const rentLabel = item.rentAmount ? `₹${item.rentAmount}` : '-';
                  const infoLabel = `${String(item.bhk || '').trim() || '1BHK'}${item.areaSqft ? ` • ${item.areaSqft} sqft` : ''}`;
                  const ownerLabel =
                    String(
                      item?.ownerName ||
                        item?.ownerId?.fullName ||
                        item?.ownerId?.firstName ||
                        item?.postedBy ||
                        '',
                    ).trim();
                  const unitLabel = String(item.floor || item.customFloor || '').trim();

                  const pid = String(item._id || '');
                  const uid = sessionUserId ? String(sessionUserId) : 'unknown_user';
                  const offerKey = `${uid}::${pid}`;
                  const raw = offerSubmittedKeys?.[offerKey];
                  const offerSubmitted = !!raw;
                  const requestFromOwner = !!ownerRequestByPropertyId?.[pid];
                  const wishActive = wishlistIds.includes(item._id);

                  return (
                    <View key={item._id || String(index)} style={styles.tenantCard}>
                      <ImageBackground
                        source={cover ? { uri: cover } : undefined}
                        style={styles.tenantCardImage}
                        imageStyle={styles.tenantCardImageStyle}
                      >
                        {offerSubmitted && (
                          <View style={styles.tenantOfferBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
                            <Text style={styles.tenantOfferBadgeText}>Offer submitted</Text>
                          </View>
                        )}
                        {requestFromOwner && (
                          <View
                            style={[
                              styles.tenantOwnerRequestBadge,
                              offerSubmitted ? styles.tenantOwnerRequestBadgeStacked : null,
                            ]}
                          >
                            <Ionicons name="mail-unread-outline" size={14} color="#ffffff" />
                            <Text style={styles.tenantOwnerRequestBadgeText}>Request from Owner</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.tenantFavBtn}
                          onPress={() => toggleWishlist(item)}
                          activeOpacity={0.85}
                        >
                          <MaterialIcons
                            name={wishActive ? 'favorite' : 'favorite-border'}
                            size={20}
                            color={wishActive ? '#ef4444' : '#111827'}
                          />
                        </TouchableOpacity>
                      </ImageBackground>

                      <View style={styles.tenantCardBody}>
                        <Text style={styles.tenantCardTitle} numberOfLines={1}>
                          {item.propertyName || 'Untitled Property'}
                        </Text>
                        <Text style={styles.tenantOwner} numberOfLines={1}>
                          {(ownerLabel || 'Owner').trim()}{unitLabel ? ` • ${unitLabel}` : ''}
                        </Text>

                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.tenantAddress} numberOfLines={2}>
                            {String(item.address || 'Location not set').trim()}
                          </Text>
                          <Text style={styles.tenantInfo} numberOfLines={1}>
                            {infoLabel}
                          </Text>
                        </View>

                        <View style={styles.tenantCardFooter}>
                          <Text style={styles.tenantPrice}>
                            {rentLabel}
                            <Text style={styles.tenantPerMonth}> /mo</Text>
                          </Text>

                          <TouchableOpacity
                            style={styles.tenantDetailsBtn}
                            onPress={() =>
                              navigation.navigate('PropertyDetails', {
                                property: item,
                                propertyList: filteredTenantFeed,
                                index,
                                fromRole: 'tenant',
                              })
                            }
                            activeOpacity={0.9}
                          >
                            <Text style={styles.tenantDetailsText}>View Details</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          (() => {
            const stats = {
              propertyPosts: 12,
              totalRooms: 48,
              activeTenants: 35,
              roomsEmpty: 5,
              flatsEmpty: 2,
              propertyViewsTotal: 1240,
              viewsTrendPct: 12,
              offersReceived: 18,
              agreementsBooked: 6,
            };

            const bookings = [
              {
                id: 'b1',
                name: 'Sarah Jenkins',
                property: 'Sunset Blvd Property • Apt 4B',
                statusLabel: 'Advance Paid',
                statusColor: '#22c55e',
                badge: '5 days left',
                badgeIcon: 'time-outline',
                badgeAccent: theme.colors.primary,
              },
              {
                id: 'b2',
                name: 'Michael Chen',
                property: 'Downtown Loft • Unit 12',
                statusLabel: 'Contract Signed',
                statusColor: '#3b82f6',
                badge: 'Nov 1st',
                badgeIcon: 'calendar-outline',
                badgeAccent: theme.colors.textSecondary,
              },
            ];

            const viewPoints = [
              { x: 0, y: 30 },
              { x: 20, y: 28 },
              { x: 60, y: 15 },
              { x: 100, y: 5 },
            ];

            const lineD = `M${viewPoints[0].x},${viewPoints[0].y} Q10,25 20,28 T40,20 T60,15 T80,22 T100,5`;
            const areaD = `M0,45 L0,30 Q10,25 20,28 T40,20 T60,15 T80,22 T100,5 L100,50 Z`;

            return (
              <View style={styles.ownerNewRoot}>
                <View style={styles.heroCard}>
                  <View style={styles.heroTopRow}>
                    <View>
                      <Text style={styles.heroKpiLabel}>Total Properties Posted</Text>
                      <Text style={styles.heroKpiValue}>{stats.propertyPosts}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.heroArrowBtn}
                      onPress={() => navigation.navigate('Property')}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.heroBottomRow}>
                    <View style={styles.heroPill}>
                      <Ionicons name="trending-up" size={14} color="#ffffff" />
                      <Text style={styles.heroPillText}>+2 this month</Text>
                    </View>
                    <Text style={styles.heroHint}>Across 3 cities</Text>
                  </View>
                </View>

                <View style={styles.newGrid}>
                  <View style={styles.newStatCard}>
                    <View style={styles.newStatTop}>
                      <View style={[styles.newStatIconWrap, { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="grid-outline" size={18} color="#2563eb" />
                      </View>
                      <TouchableOpacity
                        style={styles.newStatChevronBtn}
                        onPress={() => navigation.navigate('Property')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.newStatValue}>{stats.totalRooms}</Text>
                    <Text style={styles.newStatLabel}>Total Rooms</Text>
                  </View>

                  <View style={styles.newStatCard}>
                    <View style={styles.newStatTop}>
                      <View style={[styles.newStatIconWrap, { backgroundColor: '#F5F3FF' }]}>
                        <Ionicons name="people-outline" size={18} color="#7c3aed" />
                      </View>
                      <TouchableOpacity
                        style={styles.newStatChevronBtn}
                        onPress={() => navigation.navigate('Tenents')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.newStatValue}>{stats.activeTenants}</Text>
                    <Text style={styles.newStatLabel}>Active Tenants</Text>
                  </View>

                  <View style={styles.newStatCard}>
                    <View style={styles.newStatTop}>
                      <View style={[styles.newStatIconWrap, { backgroundColor: '#fff7ed' }]}>
                        <Ionicons name="log-out-outline" size={18} color="#ea580c" />
                      </View>
                      <TouchableOpacity
                        style={styles.newStatChevronBtn}
                        onPress={() => navigation.navigate('Property')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.newStatValue, { color: '#ea580c' }]}>{stats.roomsEmpty}</Text>
                    <Text style={styles.newStatLabel}>Empty Rooms</Text>
                  </View>

                  <View style={styles.newStatCard}>
                    <View style={styles.newStatTop}>
                      <View style={[styles.newStatIconWrap, { backgroundColor: '#F3F4F6' }]}>
                        <Ionicons name="business-outline" size={18} color="#6b7280" />
                      </View>
                      <TouchableOpacity
                        style={styles.newStatChevronBtn}
                        onPress={() => navigation.navigate('Property')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.newStatValue}>{stats.flatsEmpty}</Text>
                    <Text style={styles.newStatLabel}>Empty Flats</Text>
                  </View>
                </View>

                <View style={styles.viewsCard}>
                  <View style={styles.viewsHeaderRow}>
                    <View>
                      <Text style={styles.viewsTitle}>Property Views</Text>
                      <Text style={styles.viewsSubtitle}>Last 30 Days</Text>
                    </View>
                    <View style={styles.viewsHeaderRight}>
                      <View style={styles.viewsTrendPill}>
                        <Ionicons name="trending-up" size={14} color="#16a34a" />
                        <Text style={styles.viewsTrendText}>+{stats.viewsTrendPct}%</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.viewsOpenBtn}
                        onPress={() => navigation.navigate('Ads')}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="arrow-forward" size={16} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.viewsChartWrap}>
                    <Svg width="100%" height="100%" viewBox="0 0 100 50" preserveAspectRatio="none">
                      <Defs>
                        <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0%" stopColor="#5311ee" stopOpacity={0.15} />
                          <Stop offset="100%" stopColor="#5311ee" stopOpacity={0} />
                        </LinearGradient>
                      </Defs>
                      <Path d={areaD} fill="url(#chartGradient)" />
                      <Path
                        d={lineD}
                        fill="none"
                        stroke="#5311ee"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                      <Circle cx={20} cy={28} r={1.5} fill="#ffffff" stroke="#5311ee" strokeWidth={1.5} />
                      <Circle cx={60} cy={15} r={1.5} fill="#ffffff" stroke="#5311ee" strokeWidth={1.5} />
                      <Circle cx={100} cy={5} r={2} fill="#5311ee" stroke="#ffffff" strokeWidth={1} />
                    </Svg>

                    <View style={styles.viewsTooltip}>
                      <Text style={styles.viewsTooltipText}>{stats.propertyViewsTotal} Views</Text>
                    </View>
                  </View>

                  <View style={styles.viewsXAxis}>
                    <Text style={styles.viewsXAxisLabel}>Week 1</Text>
                    <Text style={styles.viewsXAxisLabel}>Week 2</Text>
                    <Text style={styles.viewsXAxisLabel}>Week 3</Text>
                    <Text style={styles.viewsXAxisLabel}>Week 4</Text>
                  </View>
                </View>

                <View style={styles.offerGrid}>
                  <View style={styles.offerCard}>
                    <View>
                      <View style={styles.offerTopRow}>
                        <Text style={styles.offerTag}>Offers</Text>
                        <View style={styles.offerPulseDot} />
                      </View>
                      <View style={styles.offerValueRow}>
                        <Text style={styles.offerValue}>{stats.offersReceived}</Text>
                        <Text style={styles.offerValueHint}>Total</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.offerBtn}
                      onPress={() => navigation.navigate('Offers')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.offerBtnText}>Review</Text>
                      <Ionicons name="arrow-forward" size={14} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.offerCard}>
                    <View>
                      <Text style={styles.offerTag}>Agreements</Text>
                      <View style={styles.offerValueRow}>
                        <Text style={[styles.offerValue, { color: theme.colors.primary }]}>
                          {stats.agreementsBooked}
                        </Text>
                        <Text style={styles.offerValueHint}>Booked</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.offerBtn}
                      onPress={() => navigation.navigate('Agreement')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.offerBtnText}>Details</Text>
                      <Ionicons name="arrow-forward" size={14} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.bookingsHeaderRow}>
                  <Text style={styles.bookingsTitle}>Active Bookings</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Tenents')} activeOpacity={0.85}>
                    <Text style={styles.bookingsSeeAll}>See All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bookingsList}>
                  {bookings.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={styles.bookingCard}
                      onPress={() => navigation.navigate('Tenents')}
                      activeOpacity={0.9}
                    >
                      <View style={styles.bookingTopRow}>
                        <View style={styles.bookingIdentityRow}>
                          <View style={styles.bookingAvatar}>
                            <Text style={styles.bookingAvatarText}>{String(b.name || 'T').slice(0, 1)}</Text>
                          </View>
                          <View style={styles.bookingMeta}>
                            <Text style={styles.bookingName}>{b.name}</Text>
                            <Text style={styles.bookingProperty} numberOfLines={1}>
                              {b.property}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.bookingChevronWrap}>
                          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                        </View>
                      </View>

                      <View style={styles.bookingBottomRow}>
                        <View style={styles.bookingStatusRow}>
                          <View style={[styles.bookingStatusDot, { backgroundColor: b.statusColor }]} />
                          <Text style={styles.bookingStatusText}>{b.statusLabel}</Text>
                        </View>
                        <View
                          style={[
                            styles.bookingBadge,
                            b.badgeAccent === theme.colors.primary ? styles.bookingBadgePrimary : null,
                          ]}
                        >
                          <Ionicons
                            name={b.badgeIcon}
                            size={14}
                            color={b.badgeAccent === theme.colors.primary ? theme.colors.primary : theme.colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.bookingBadgeText,
                              b.badgeAccent === theme.colors.primary ? styles.bookingBadgeTextPrimary : null,
                            ]}
                          >
                            {b.badge}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })()
        )}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  ownerNewRoot: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  heroCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroKpiLabel: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroKpiValue: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
  },
  heroArrowBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  heroHint: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    fontWeight: '700',
  },
  newGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  newStatCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 12,
  },
  newStatTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  newStatIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newStatChevronBtn: {
    padding: 4,
  },
  newStatValue: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 4,
  },
  newStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  viewsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 12,
  },
  viewsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text,
  },
  viewsSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  viewsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewsTrendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewsTrendText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#16a34a',
  },
  viewsOpenBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  viewsChartWrap: {
    height: 140,
    width: '100%',
    marginBottom: 10,
    position: 'relative',
  },
  viewsTooltip: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewsTooltipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  viewsXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  viewsXAxisLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  offerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  offerCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
  },
  offerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  offerTag: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  offerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 10,
  },
  offerValue: {
    fontSize: 30,
    fontWeight: '900',
    color: theme.colors.text,
  },
  offerValueHint: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9ca3af',
  },
  offerBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  offerBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text,
  },
  bookingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  bookingsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text,
  },
  bookingsSeeAll: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },
  bookingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookingIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 10,
  },
  bookingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingAvatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text,
  },
  bookingMeta: {
    flex: 1,
  },
  bookingName: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 2,
  },
  bookingProperty: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  bookingChevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  bookingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bookingStatusText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#374151',
  },
  bookingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingBadgePrimary: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(26,71,237,0.2)',
  },
  bookingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  bookingBadgeTextPrimary: {
    color: theme.colors.primary,
  },
  ownerBlock: {
    paddingTop: 12,
  },
  ownerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  ownerSubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 12,
  },
  statCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
  },
  statDetailsBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
  },
  statTitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  chartCard: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text,
  },
  chartDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
  },
  chartDetailsBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
  },
  miniBarRow: {
    marginBottom: 10,
  },
  miniBarLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  miniBarLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginRight: 10,
  },
  miniBarValue: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text,
  },
  miniBarTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  activationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  activationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 8,
  },
  activationDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  activationName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  activationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activationDays: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  feedBlock: {
    marginTop: 16,
  },
  tenantSearchWrap: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tenantSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  tenantFilterBtn: {
    padding: 4,
  },
  tenantSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 12,
  },
  tenantList: {
    gap: 20,
  },
  tenantCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  tenantCardImage: {
    height: 200,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#e5e7eb',
  },
  tenantCardImageStyle: {
    resizeMode: 'cover',
  },
  tenantFavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenantCardBody: {
    padding: 16,
    gap: 4,
  },
  tenantCardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  tenantOwner: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tenantAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  tenantInfo: {
    fontSize: 12,
    color: '#9ca3af',
  },
  tenantCardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tenantPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },
  tenantPerMonth: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  tenantDetailsBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tenantDetailsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  tenantOfferBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(17,24,39,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tenantOfferBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  tenantOwnerRequestBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37,99,235,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tenantOwnerRequestBadgeStacked: {
    top: 52,
  },
  tenantOwnerRequestBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardImageWrapper: {
    width: '100%',
    height: 190,
    backgroundColor: '#e6eef8',
  },
  wishIconBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  offerSubmittedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  offerSubmittedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  ownerRequestBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  ownerRequestBadgeWithOfferSubmitted: {
    top: 44,
  },
  ownerRequestBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardBody: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  cardPrice: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  cardActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  detailsBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
