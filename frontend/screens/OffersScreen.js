import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../theme';
import LoadingOverlay from '../components/LoadingOverlay';

const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://apiv2-pnmqz54req-uc.a.run.app';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);
const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const USER_PROFILE_STORAGE_KEY = 'USER_PROFILE';
const OFFER_SUBMISSIONS_KEY = 'OFFER_SUBMISSIONS_V1';

export default function OffersScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [role, setRole] = useState('');
  const [tenantOffers, setTenantOffers] = useState([]);

  const formatDateTime = (raw) => {
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString();
    } catch (e) {
      return '';
    }
  };

  const formatDateOnly = (raw) => {
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  const toTenantCardModel = (offerDoc) => {
    const o = offerDoc || {};
    const property = o?.propertyId || {};
    const photos = Array.isArray(property?.photos) ? property.photos : [];
    const requested = Number(o?.requestedAdvanceAmount || 0) || 0;
    const validityDays = Number(o?.requestedAdvanceValidityDays || 0) || 0;
    const meetingLabel = formatDateTime(o?.proposedMeetingTime);
    const joiningLabel = formatDateOnly(o?.desiredJoiningDate);
    const actionType = String(o?.actionType || '').trim().toLowerCase();

    const subtitleParts = [];
    if (requested > 0) subtitleParts.push(`Advance: ${moneyLabel(requested, '-')}`);
    if (validityDays > 0) subtitleParts.push(`Valid: ${validityDays} day${validityDays === 1 ? '' : 's'}`);
    if (meetingLabel) subtitleParts.push(`Meeting: ${meetingLabel}`);
    if (joiningLabel) subtitleParts.push(`Joining: ${joiningLabel}`);

    return {
      key: String(o?._id || o?.id || ''),
      propertyId: String(property?._id || property?.id || ''),
      propertyName: String(property?.propertyName || 'Property').trim(),
      address: String(property?.address || '').trim(),
      city: String(property?.city || '').trim(),
      photo: resolveImageUri(photos[0]),
      offeredRent: Number(o?.offerRent || 0) || 0,
      status: String(o?.status || 'pending').trim().toLowerCase(),
      actionType,
      requestAmount: requested,
      requestValidityDays: validityDays,
      requestedDetails: subtitleParts.join('  •  '),
      submittedAt: o?.createdAt ? new Date(o.createdAt).getTime() : 0,
    };
  };

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

  const moneyLabel = (v, fallback = '-') => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const clampPercent = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(100, Math.round(n)));
  };

  const groupedOffers = useMemo(() => {
    const map = new Map();
    for (const o of Array.isArray(offers) ? offers : []) {
      const property = o?.propertyId;
      const pid = String(property?._id || property?.id || o?.propertyId?._id || 'unknown_property');
      if (!map.has(pid)) {
        map.set(pid, { property, offers: [] });
      }
      map.get(pid).offers.push(o);
    }

    const groups = Array.from(map.values());
    for (const g of groups) {
      g.offers.sort((a, b) => {
        const ar = Number(a?.offerRent || a?.offerPrice || 0);
        const br = Number(b?.offerRent || b?.offerPrice || 0);
        if (activeFilter === 'highest_rent') {
          if (br !== ar) return br - ar;
        }

        const aRating = Number(a?.tenantId?.rating || a?.tenantId?.starRating || 0);
        const bRating = Number(b?.tenantId?.rating || b?.tenantId?.starRating || 0);
        if (activeFilter === 'best_rating') {
          if (bRating !== aRating) return bRating - aRating;
        }

        const at = Number(a?.createdAt ? new Date(a.createdAt).getTime() : a?.submittedAt || 0);
        const bt = Number(b?.createdAt ? new Date(b.createdAt).getTime() : b?.submittedAt || 0);
        if (activeFilter === 'newest') {
          if (bt !== at) return bt - at;
        }

        if (br !== ar) return br - ar;
        const am = Number(a?.matchPercent || 0);
        const bm = Number(b?.matchPercent || 0);
        return bm - am;
      });
    }
    return groups;
  }, [offers, activeFilter]);

  const offerKey = (o, index, pid) => {
    const oid = o?._id || o?.id;
    if (oid != null) return String(oid);
    const tid = o?.tenantId?._id || o?.tenantId?.id || o?.tenantId;
    const created = o?.createdAt || o?.submittedAt || '';
    return `${String(pid || 'p')}::${String(tid || 't')}::${String(created)}::${String(index)}`;
  };

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeRole = (r) => {
    const s = String(r || '').trim().toLowerCase();
    if (s === 'tenant' || s === 'tenent') return 'tenant';
    if (s === 'owner') return 'owner';
    if (s === 'broker') return 'broker';
    return s;
  };

  const loadRole = async () => {
    try {
      const json = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
      const user = json ? JSON.parse(json) : null;
      setRole(normalizeRole(user?.role));
      return user;
    } catch (e) {
      setRole('');
      return null;
    }
  };

  const loadTenantOfferStatus = async () => {
    try {
      setLoading(true);
      await loadRole();
      const authHeaders = await getAuthHeaders();
      const resp = await fetch(`${API_BASE_URL}/offers/sent`, {
        headers: {
          ...authHeaders,
        },
      });

      if (!resp.ok) {
        let msg = 'Failed to load offers.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Offers', msg);
        setTenantOffers([]);
        return;
      }

      const data = await resp.json();
      const list = Array.isArray(data?.offers) ? data.offers : [];
      setTenantOffers(list.map(toTenantCardModel));
    } catch (e) {
      setTenantOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      const resp = await fetch(`${API_BASE_URL}/offers/received`, {
        headers: {
          ...authHeaders,
        },
      });

      if (!resp.ok) {
        let msg = 'Failed to load offers.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Offers', msg);
        return;
      }

      const data = await resp.json();
      const list = Array.isArray(data?.offers) ? data.offers : [];
      try {
        console.log('[OffersScreen] /offers/received raw payload keys:', Object.keys(data || {}));
        console.log('[OffersScreen] offers count:', Array.isArray(list) ? list.length : -1);
      } catch (e) {}
      setOffers(list);
    } catch (e) {
      Alert.alert('Offers', 'Network error while fetching offers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const user = await loadRole();
      const r = normalizeRole(user?.role);
      if (r === 'tenant') {
        loadTenantOfferStatus();
      } else {
        loadOffers();
      }
    })();

    const unsub = navigation?.addListener
      ? navigation.addListener('focus', () => {
          if (normalizeRole(role) === 'tenant') {
            loadTenantOfferStatus();
          } else {
            loadOffers();
          }
        })
      : null;
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation, role]);

  const tenantFilterChips = [
    { key: 'all', label: 'All' },
    { key: 'action_required', label: 'Action Required' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'on_hold', label: 'On Hold' },
    { key: 'pending', label: 'Pending' },
  ];

  const tenantFiltered = useMemo(() => {
    const list = Array.isArray(tenantOffers) ? tenantOffers : [];
    if (activeFilter === 'all') return list;
    if (activeFilter === 'action_required') {
      return list.filter((x) => String(x?.actionType || '').toLowerCase() === 'advance_requested');
    }
    return list.filter((x) => String(x?.status || '').toLowerCase() === activeFilter);
  }, [tenantOffers, activeFilter]);

  const statusBadge = (item) => {
    const status = String(item?.status || '').toLowerCase();
    const action = String(item?.actionType || '').toLowerCase();

    if (status === 'rejected') return { label: 'Rejected', tone: 'rejected' };
    if (status === 'on_hold') return { label: 'On Hold', tone: 'on_hold' };
    if (action === 'advance_requested') {
      return { label: 'Advance Requested', tone: 'primary' };
    }
    if (status === 'accepted') return { label: 'Accepted', tone: 'accepted' };
    return { label: 'Pending', tone: 'pending' };
  };

  return (
    <View style={styles.safe}>
      <View style={styles.headerWrap}>
        <View style={styles.topAppBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => (navigation?.goBack ? navigation.goBack() : null)}
            activeOpacity={0.85}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{normalizeRole(role) === 'tenant' ? 'Offer Status' : 'Received Offers'}</Text>
          <View style={{ width: 40, height: 40 }} />
        </View>

        {normalizeRole(role) === 'tenant' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {tenantFilterChips.map((c) => {
              const isActive = activeFilter === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.filterChip, isActive ? styles.filterChipActivePrimary : styles.filterChipLight]}
                  onPress={() => setActiveFilter(c.key)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : styles.filterChipText]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'all' ? styles.filterChipActive : null]}
              onPress={() => setActiveFilter('all')}
              activeOpacity={0.9}
            >
              <Text style={[styles.filterChipText, activeFilter === 'all' ? styles.filterChipTextActive : null]}>
                All Offers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'highest_rent' ? styles.filterChipActiveMuted : null]}
              onPress={() => setActiveFilter('highest_rent')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'highest_rent' ? styles.filterChipTextMutedActive : null,
                ]}
              >
                Highest Rent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'best_rating' ? styles.filterChipActiveMuted : null]}
              onPress={() => setActiveFilter('best_rating')}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'best_rating' ? styles.filterChipTextMutedActive : null,
                ]}
              >
                Best Rating
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'newest' ? styles.filterChipActiveMuted : null]}
              onPress={() => setActiveFilter('newest')}
              activeOpacity={0.9}
            >
              <Text
                style={[styles.filterChipText, activeFilter === 'newest' ? styles.filterChipTextMutedActive : null]}
              >
                Newest
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      <View style={styles.container}>
        <LoadingOverlay visible={loading} />

        {normalizeRole(role) === 'tenant' ? (
          !tenantFiltered.length ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No offers yet</Text>
              <Text style={styles.emptySub}>Offers you submit will appear here with status updates.</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={loadTenantOfferStatus}>
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listPad}>
              {tenantFiltered.map((it) => {
                const badge = statusBadge(it);
                const isPrimary = badge.tone === 'primary';
                const toneStyle =
                  badge.tone === 'accepted'
                    ? styles.badgeAccepted
                    : badge.tone === 'rejected'
                      ? styles.badgeRejected
                      : badge.tone === 'on_hold'
                        ? styles.badgeOnHold
                      : badge.tone === 'counter'
                        ? styles.badgeCounter
                        : badge.tone === 'pending'
                          ? styles.badgePending
                          : styles.badgePrimary;

                return (
                  <TouchableOpacity
                    key={it.key}
                    activeOpacity={0.9}
                    style={[styles.offerStatusCard, isPrimary ? styles.offerStatusCardPrimary : null]}
                    onPress={() => {
                      // placeholder navigation for now
                      Alert.alert('Offer', 'Details screen can be connected here.');
                    }}
                  >
                    {isPrimary ? <View style={styles.offerStatusLeftBar} /> : null}
                    <View style={styles.offerStatusInner}>
                      <View style={styles.offerStatusTopRow}>
                        <View style={styles.offerStatusImageWrap}>
                          {it.photo ? (
                            <Image source={{ uri: it.photo }} style={styles.offerStatusImage} />
                          ) : (
                            <View style={styles.offerStatusImageFallback} />
                          )}
                        </View>

                        <View style={styles.offerStatusContent}>
                          <View style={styles.offerStatusBadgeRow}>
                            <View style={[styles.statusBadge, toneStyle]}>
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  badge.tone === 'primary' ? styles.statusBadgeTextPrimary : null,
                                ]}
                              >
                                {badge.label}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.offerStatusTitle} numberOfLines={2}>
                            {it.propertyName || 'Property'}
                          </Text>
                          <Text style={styles.offerStatusAddress} numberOfLines={1}>
                            {it.address || it.city || ''}
                          </Text>

                          <Text style={styles.offerStatusRentRow}>
                            Offered Rent:{' '}
                            <Text style={styles.offerStatusRentStrong}>
                              {it.offeredRent ? `${moneyLabel(it.offeredRent)}/mo` : '-'}
                            </Text>
                          </Text>
                        </View>
                      </View>

                      {badge.tone === 'primary' ? (
                        <View style={styles.offerStatusActionRow}>
                          <View style={styles.requestBox}>
                            <Text style={styles.requestLabel}>Request Amount</Text>
                            <Text style={styles.requestValue}>
                              {it.requestAmount ? moneyLabel(it.requestAmount, '-') : moneyLabel(0, '₹0')}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.primaryActionBtn}
                            activeOpacity={0.9}
                            onPress={() => {
                              navigation.navigate('Payments', {
                                source: 'offer_advance_request',
                                amount: it.requestAmount || 0,
                                offerId: it.key,
                                propertyId: it.propertyId,
                                propertyName: it.propertyName,
                                validityDays: it.requestValidityDays || 0,
                              });
                            }}
                          >
                            <Text style={styles.primaryActionText}>Pay Advance</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.offerStatusFooterRow}>
                          <TouchableOpacity
                            style={styles.secondaryLink}
                            activeOpacity={0.85}
                            onPress={() =>
                              navigation.navigate('PropertyDetails', {
                                property: {
                                  _id: it.propertyId,
                                  propertyName: it.propertyName,
                                  address: it.address,
                                  city: it.city,
                                  photos: it.photo ? [it.photo] : [],
                                },
                                fromRole: 'tenant',
                              })
                            }
                          >
                            <Text style={styles.secondaryLinkText}>View Details</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 18 }} />
            </ScrollView>
          )
        ) : !offers.length ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No offers yet</Text>
            <Text style={styles.emptySub}>Offers sent by tenants will appear here.</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadOffers}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listPad}>
            {groupedOffers.map((g) => {
              const property = g?.property || {};
              const ownerAsk = Number(property?.rentAmount || 0);
              const propertyName = String(property?.propertyName || 'Property');
              const locationText = String(property?.address || property?.city || property?.location || '').trim();
              const cityText = String(property?.city || '').trim();
              const pid = String(property?._id || property?.id || propertyName);

              const previewUri = (() => {
                const photos = Array.isArray(property?.photos) ? property.photos : [];
                return resolveImageUri(photos[0]);
              })();

              const bestOffer = (g?.offers || []).reduce((max, x) => {
                const v = Number(x?.offerRent || x?.offerPrice || 0);
                return Number.isFinite(v) && v > max ? v : max;
              }, 0);

              return (
                <View key={pid} style={styles.groupWrap}>
                  <View style={styles.currentListingCard}>
                    <View style={styles.currentListingLeft}>
                      <Text style={styles.currentListingLabel}>Current Listing</Text>
                      <Text style={styles.currentListingTitle} numberOfLines={1}>
                        {propertyName}
                      </Text>
                      <View style={styles.currentListingMetaRow}>
                        {!!cityText ? <Text style={styles.currentListingMeta}>{cityText}</Text> : null}
                        {!!cityText ? <Text style={styles.currentListingMeta}>•</Text> : null}
                        <Text style={styles.currentListingMetaStrong}>
                          {ownerAsk ? `${moneyLabel(ownerAsk)}/mo` : '-'}
                        </Text>
                      </View>
                      {!!locationText && (
                        <Text style={styles.currentListingAddress} numberOfLines={2}>
                          {locationText}
                        </Text>
                      )}
                      <View style={styles.currentListingPills}>
                        <View style={styles.smallPill}>
                          <Text style={styles.smallPillText}>Best: {bestOffer ? moneyLabel(bestOffer, '-') : '-'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.currentListingThumbWrap}>
                      {previewUri ? (
                        <Image source={{ uri: previewUri }} style={styles.currentListingThumbImg} />
                      ) : (
                        <View style={styles.currentListingThumbFallback} />
                      )}
                    </View>
                  </View>

                  <View style={styles.tenantCardsWrap}>
                    {(g?.offers || []).map((o, index) => {
                      const tenant = o?.tenantId || {};
                      const tenantAvatar = resolveImageUri(
                        tenant?.avatar || tenant?.profileImage || tenant?.photo || tenant?.image
                      );
                      const tenantName = String(
                        tenant?.fullName ||
                          [tenant?.firstName, tenant?.lastName].filter(Boolean).join(' ') ||
                          tenant?.username ||
                          '-'
                      ).trim();
                      const tenantCity = String(tenant?.city || tenant?.address?.city || '').trim();
                      const tenantType = String(
                        o?.tenantType || o?.offer?.tenantType || o?.tenantPreferences?.tenantGroup || '-'
                      ).trim();
                      const rating = Number(tenant?.rating || tenant?.starRating || 0) || 0;
                      const matchPercent = clampPercent(
                        o?.matchPercent ??
                          o?.offerMatchPercent ??
                          o?.matchPercentage ??
                          o?.match_score ??
                          o?.matchScore
                      ) ?? null;
                      const offered = Number(o?.offerRent || o?.offerPrice || 0);
                      const createdAtLabel = String(o?.createdAt || '').trim();
                      const isRequestSent = String(o?.actionType || '').toLowerCase() === 'advance_requested';
                      const offerStatus = String(o?.status || '').toLowerCase();
                      const ownerStatusLabel =
                        offerStatus === 'rejected' ? 'Rejected' : offerStatus === 'on_hold' ? 'On Hold' : '';

                      return (
                        <View key={offerKey(o, index, pid)} style={styles.tenantCard}>
                          <View style={styles.tenantCardTop}>
                            <View style={styles.tenantCardLeft}>
                              <View style={styles.tenantAvatarLgWrap}>
                                {tenantAvatar ? (
                                  <Image source={{ uri: tenantAvatar }} style={styles.tenantAvatarLgImg} />
                                ) : (
                                  <View style={styles.tenantAvatarLgFallback} />
                                )}
                              </View>
                              <View style={styles.tenantCardInfo}>
                                <View style={styles.tenantCardNameRow}>
                                  <Text style={styles.tenantCardName} numberOfLines={1}>
                                    {tenantName}
                                  </Text>
                                  <View style={styles.typeBadge}>
                                    <Text style={styles.typeBadgeText}>{tenantType}</Text>
                                  </View>
                                </View>
                                {isRequestSent ? (
                                  <View style={styles.ownerRequestSentPill}>
                                    <Text style={styles.ownerRequestSentPillText}>Request Sent</Text>
                                  </View>
                                ) : null}
                                {!!ownerStatusLabel && (
                                  <View
                                    style={[
                                      styles.ownerStatusPill,
                                      offerStatus === 'rejected' ? styles.ownerStatusPillRejected : styles.ownerStatusPillHold,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.ownerStatusPillText,
                                        offerStatus === 'rejected'
                                          ? styles.ownerStatusPillTextRejected
                                          : styles.ownerStatusPillTextHold,
                                      ]}
                                    >
                                      {ownerStatusLabel}
                                    </Text>
                                  </View>
                                )}
                                <View style={styles.tenantCardSubRow}>
                                  <Text style={styles.tenantCardSubText}>{tenantCity || '-'}</Text>
                                  <Text style={styles.tenantCardSubText}>•</Text>
                                  <View style={styles.starRow}>
                                    <Text style={styles.starIcon}>★</Text>
                                    <Text style={styles.starText}>{rating ? rating.toFixed(1) : '0.0'}</Text>
                                  </View>
                                  {matchPercent != null ? (
                                    <>
                                      <Text style={styles.tenantCardSubText}>•</Text>
                                      <Text style={styles.matchText}>{matchPercent}% Match</Text>
                                    </>
                                  ) : null}
                                </View>
                              </View>
                            </View>

                            <View style={styles.tenantCardRight}>
                              <Text style={styles.offeredLabel}>Offered</Text>
                              <Text style={styles.offeredValue}>
                                {offered ? moneyLabel(offered, '-') : '-'}
                                <Text style={styles.offeredSuffix}>/mo</Text>
                              </Text>
                            </View>
                          </View>

                          <View style={styles.tenantCardFooter}>
                            <Text style={styles.appliedText}>{createdAtLabel ? `Applied ${createdAtLabel}` : ''}</Text>
                            <TouchableOpacity
                              style={styles.viewDetailsBtn}
                              onPress={() => navigation.navigate('OwnerOfferDetails', { offer: o })}
                              activeOpacity={0.9}
                            >
                              <Text style={styles.viewDetailsText}>View Details</Text>
                              <Text style={styles.viewDetailsArrow}>›</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            <View style={{ height: 18 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerWrap: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    paddingBottom: 10,
  },
  topAppBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    marginTop: -2,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: theme.colors.text,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#111827',
  },
  filterChipActivePrimary: {
    backgroundColor: theme.colors.primary,
  },
  filterChipLight: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActiveMuted: {
    backgroundColor: '#e5e7eb',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterChipTextMutedActive: {
    color: '#111827',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(249,250,251,0.7)',
  },
  listPad: {
    paddingTop: 10,
    paddingBottom: 16,
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  refreshBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  refreshBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  groupWrap: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  currentListingCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.06)',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.12)',
  },
  currentListingLeft: {
    flex: 1,
    minWidth: 0,
  },
  currentListingLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  currentListingTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text,
  },
  currentListingMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentListingMeta: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  currentListingMetaStrong: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text,
  },
  currentListingAddress: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  currentListingPills: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  smallPill: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  smallPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.text,
  },
  currentListingThumbWrap: {
    width: 78,
    height: 78,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  currentListingThumbImg: {
    width: '100%',
    height: '100%',
  },
  currentListingThumbFallback: {
    flex: 1,
    backgroundColor: '#d1d5db',
  },
  tenantCardsWrap: {
    marginTop: 10,
    gap: 12,
  },
  tenantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tenantCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  tenantCardLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    minWidth: 0,
  },
  tenantAvatarLgWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#e5e7eb',
  },
  tenantAvatarLgImg: {
    width: '100%',
    height: '100%',
  },
  tenantAvatarLgFallback: {
    flex: 1,
    backgroundColor: '#d1d5db',
  },
  tenantCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  tenantCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tenantCardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803d',
    textTransform: 'capitalize',
  },
  ownerRequestSentPill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.22)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ownerRequestSentPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  ownerStatusPill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ownerStatusPillRejected: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.22)',
  },
  ownerStatusPillHold: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.22)',
  },
  ownerStatusPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  ownerStatusPillTextRejected: {
    color: '#dc2626',
  },
  ownerStatusPillTextHold: {
    color: '#b45309',
  },
  tenantCardSubRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tenantCardSubText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    fontSize: 14,
    color: '#f4b400',
    marginRight: 4,
  },
  starText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
  matchText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
  offeredLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  tenantCardRight: {
    alignItems: 'flex-end',
  },
  offeredValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  offeredSuffix: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  tenantCardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  appliedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9ca3af',
    flex: 1,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.10)',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  viewDetailsArrow: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.primary,
    marginTop: -1,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  kLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  kValue: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#e8f0ff',
  },
  pillText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '900',
  },
  viewBtn: {
    marginTop: 14,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },

  offerStatusCard: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  offerStatusCardPrimary: {
    borderColor: 'rgba(83,17,238,0.20)',
  },
  offerStatusLeftBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: theme.colors.primary,
  },
  offerStatusInner: {
    padding: 14,
  },
  offerStatusTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  offerStatusImageWrap: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  offerStatusImage: {
    width: '100%',
    height: '100%',
  },
  offerStatusImageFallback: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
  offerStatusContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
  },
  offerStatusBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111827',
  },
  statusBadgeTextPrimary: {
    color: theme.colors.primary,
  },
  badgePrimary: {
    backgroundColor: 'rgba(83,17,238,0.10)',
  },
  badgeAccepted: {
    backgroundColor: 'rgba(34,197,94,0.10)',
  },
  badgeRejected: {
    backgroundColor: 'rgba(239,68,68,0.10)',
  },
  badgeOnHold: {
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  badgeCounter: {
    backgroundColor: 'rgba(234,179,8,0.12)',
  },
  badgePending: {
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  offerStatusTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 4,
  },
  offerStatusAddress: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  offerStatusRentRow: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  offerStatusRentStrong: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.text,
  },
  offerStatusActionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestBox: {
    width: 110,
  },
  requestLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  requestValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
  offerStatusFooterRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  secondaryLink: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  secondaryLinkText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.primary,
  },
});
