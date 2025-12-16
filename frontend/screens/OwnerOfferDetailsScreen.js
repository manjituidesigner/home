import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://home-backend-zc1d.onrender.com';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);
const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';

function moneyLabel(v, fallback = '-') {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return `₹${n.toLocaleString('en-IN')}`;
}

function Chip({ icon, label, tone }) {
  const toneStyle =
    tone === 'primary'
      ? styles.chipPrimary
      : tone === 'muted'
      ? styles.chipMuted
      : styles.chipDefault;
  const toneText =
    tone === 'primary'
      ? styles.chipPrimaryText
      : tone === 'muted'
      ? styles.chipMutedText
      : styles.chipDefaultText;

  return (
    <View style={[styles.chip, toneStyle]}>
      {!!icon && (
        <Ionicons
          name={icon}
          size={16}
          color={tone === 'primary' ? theme.colors.primary : theme.colors.textSecondary}
          style={{ marginTop: 1 }}
        />
      )}
      <Text style={[styles.chipText, toneText]}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, title, value, suffix, subLeft, subRight, accent }) {
  const accentColor = accent || theme.colors.primary;
  return (
    <View style={styles.statCard}>
      <View style={[styles.statBgIcon, { backgroundColor: `${accentColor}1A` }]}>
        <Ionicons name={icon} size={28} color={accentColor} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
        {!!suffix && <Text style={styles.statSuffix}>{suffix}</Text>}
      </View>
      {(subLeft || subRight) && (
        <View style={styles.statFooterRow}>
          {!!subLeft && <Text style={styles.statFooterPill}>{subLeft}</Text>}
          {!!subRight && <Text style={styles.statFooterStrike}>{subRight}</Text>}
        </View>
      )}
    </View>
  );
}

export default function OwnerOfferDetailsScreen({ route, navigation }) {
  const offer = route?.params?.offer || {};
  const property = offer?.propertyId || route?.params?.property || {};
  const tenant = offer?.tenantId || route?.params?.tenant || {};

  const initialStatus = String(offer?.status || 'pending').trim().toLowerCase();
  const isFinalDecision = initialStatus === 'rejected' || initialStatus === 'on_hold';

  const tenantName = String(
    tenant?.fullName ||
      [tenant?.firstName, tenant?.lastName].filter(Boolean).join(' ') ||
      tenant?.username ||
      'Tenant'
  ).trim();

  const tenantSubtitle = String(tenant?.profession || tenant?.occupation || tenant?.email || '').trim();
  const tenantMeta = String(tenant?.joinedAt || '').trim();

  const tenantAvatar = useMemo(() => {
    const raw = tenant?.avatar || tenant?.profileImage || tenant?.photo || null;
    if (!raw) return null;
    if (typeof raw === 'string') return raw;
    if (raw?.uri) return raw.uri;
    if (raw?.url) return raw.url;
    return null;
  }, [tenant]);

  const askedRent = Number(property?.rentAmount || offer?.ownerAskRent || offer?.askRent || 0);
  const offeredRent = Number(offer?.offerRent || offer?.offerPrice || 0);

  const matchPercent = Math.max(0, Math.min(100, Number(offer?.matchPercent || 0)));

  const vsAskPct = useMemo(() => {
    if (!askedRent || !offeredRent) return null;
    const pct = Math.round(((offeredRent - askedRent) / askedRent) * 100);
    return Number.isFinite(pct) ? pct : null;
  }, [askedRent, offeredRent]);

  const preferences = useMemo(() => {
    const prefs = offer?.tenantPreferences || offer?.preferences || {};

    const chips = [];

    if (prefs?.drinksOrSmoking) {
      chips.push({ icon: 'wine-outline', label: 'Allows Drinking', tone: 'primary' });
    } else {
      chips.push({ icon: 'wine-outline', label: 'No Drinking', tone: 'muted' });
    }

    if (prefs?.bikeParking) {
      chips.push({ icon: 'bicycle-outline', label: 'Bike Parking', tone: 'primary' });
    }

    if (prefs?.lateNightEntry) {
      chips.push({ icon: 'moon-outline', label: 'Late Night Coming', tone: 'primary' });
    } else {
      chips.push({ icon: 'moon-outline', label: 'No Late Night', tone: 'muted' });
    }

    if (prefs?.friendsOrVisitors) {
      chips.push({ icon: 'people-outline', label: 'Friends/Visitors', tone: 'primary' });
    }

    if (prefs?.familyStaying) {
      chips.push({ icon: 'home-outline', label: 'Family Staying', tone: 'primary' });
    }

    const tg = String(prefs?.tenantGroup || offer?.tenantType || '').trim();
    if (tg) {
      chips.push({ icon: 'person-outline', label: `Type: ${tg}`, tone: 'default' });
    }

    return chips;
  }, [offer]);

  const initiallySent = useMemo(() => {
    const action = String(offer?.actionType || '').toLowerCase();
    const amt = Number(offer?.requestedAdvanceAmount || 0);
    return action === 'advance_requested' && Number.isFinite(amt) && amt > 0;
  }, [offer]);

  const [advanceBooking, setAdvanceBooking] = useState('');
  const [validityDays, setValidityDays] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [sending, setSending] = useState(false);
  const [requestSent, setRequestSent] = useState(initiallySent);
  const [offerStatus, setOfferStatus] = useState(initialStatus);

  const isDecisionLocked = offerStatus === 'rejected' || offerStatus === 'on_hold';

  const [historyLoading, setHistoryLoading] = useState(false);
  const [offerHistory, setOfferHistory] = useState([]);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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

  const loadOfferHistory = async () => {
    const propertyId = String(property?._id || property?.id || offer?.propertyId?._id || offer?.propertyId || '');
    const tenantId = String(tenant?._id || tenant?.id || offer?.tenantId?._id || offer?.tenantId || '');
    if (!propertyId || !tenantId) {
      setOfferHistory([]);
      return;
    }

    try {
      setHistoryLoading(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        setOfferHistory([]);
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/api/offers/history/${propertyId}/${tenantId}`, {
        headers: {
          ...authHeaders,
        },
      });

      if (!resp.ok) {
        setOfferHistory([]);
        return;
      }

      const data = await resp.json().catch(() => ({}));
      const list = Array.isArray(data?.offers) ? data.offers : [];
      setOfferHistory(list);
    } catch (e) {
      setOfferHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const parseMoney = (v) => {
    const n = Number(String(v || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  const parsePositiveIntOrNull = (v) => {
    const s = String(v ?? '').trim();
    if (!s) return null;
    const n = Number(s.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n);
  };

  const toIsoFromMeetingInput = (value) => {
    const v = String(value || '').trim();
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const toIsoFromDateInput = (value) => {
    const v = String(value || '').trim();
    if (!v) return null;
    const d = new Date(`${v}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const onSendRequest = async () => {
    if (sending) return;
    if (offerStatus === 'rejected') {
      Alert.alert('Request', 'This offer is rejected.');
      return;
    }
    if (offerStatus === 'on_hold') {
      Alert.alert('Request', 'This offer is on hold.');
      return;
    }
    if (requestSent) {
      Alert.alert('Request', 'Already sent.');
      return;
    }
    const offerId = offer?._id || offer?.id;
    if (!offerId) {
      Alert.alert('Request', 'Offer not found. Please reopen offer details.');
      return;
    }

    const amount = parseMoney(advanceBooking);
    if (amount == null || amount <= 0) {
      Alert.alert('Request', 'Please enter a valid advance booking amount.');
      return;
    }

    const validity = parsePositiveIntOrNull(validityDays);
    if (validityDays && validity == null) {
      Alert.alert('Request', 'Please enter valid validity days.');
      return;
    }

    const meetingIso = toIsoFromMeetingInput(meetingTime);
    if (meetingTime && !meetingIso) {
      Alert.alert('Request', 'Please select a valid meeting date & time.');
      return;
    }

    const joiningIso = toIsoFromDateInput(joiningDate);
    if (joiningDate && !joiningIso) {
      Alert.alert('Request', 'Please select a valid joining date.');
      return;
    }

    const payload = {
      requestedAdvanceAmount: amount,
      requestedAdvanceValidityDays: validity == null ? undefined : validity,
      proposedMeetingTime: meetingIso == null ? undefined : meetingIso,
      desiredJoiningDate: joiningIso == null ? undefined : joiningIso,
    };

    try {
      setSending(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Session', 'Please login again. Token missing.');
        return;
      }

      const url = `${API_BASE_URL}/api/offers/${offerId}/request-advance`;
      try {
        console.log('[OwnerOfferDetails] request-advance url:', url);
        console.log('[OwnerOfferDetails] request-advance payload:', payload);
      } catch (e) {}

      const resp = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        let msg = 'Failed to send request.';
        try {
          const rawText = await resp.text();
          try {
            const data = rawText ? JSON.parse(rawText) : null;
            msg = String(data?.message || data?.error || msg);
          } catch (e) {
            msg = rawText ? String(rawText) : msg;
          }
        } catch (e) {}

        try {
          console.log('[OwnerOfferDetails] request-advance failed status:', resp.status);
          console.log('[OwnerOfferDetails] request-advance failed msg:', msg);
        } catch (e) {}

        Alert.alert('Request', msg);
        return;
      }

      Alert.alert('Request', 'Request sent successfully.');
      setRequestSent(true);
    } catch (e) {
      Alert.alert('Request', 'Network error while sending request.');
    } finally {
      setSending(false);
    }
  };

  const updateOfferStatus = async (nextStatus) => {
    if (sending) return;
    const offerId = offer?._id || offer?.id;
    if (!offerId) {
      Alert.alert('Offer', 'Offer not found. Please reopen offer details.');
      return;
    }
    const target = String(nextStatus || '').trim().toLowerCase();
    if (!target) return;
    if (offerStatus === target) {
      Alert.alert('Offer', `Already ${target.replace('_', ' ')}.`);
      return;
    }

    try {
      setSending(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Session', 'Please login again. Token missing.');
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/api/offers/${offerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ status: target }),
      });

      if (!resp.ok) {
        let msg = 'Failed to update status.';
        try {
          const rawText = await resp.text();
          try {
            const data = rawText ? JSON.parse(rawText) : null;
            msg = String(data?.message || data?.error || msg);
          } catch (e) {
            msg = rawText ? String(rawText) : msg;
          }
        } catch (e) {}
        Alert.alert('Offer', msg);
        return;
      }

      setOfferStatus(target);
      if (target === 'rejected') {
        Alert.alert('Offer', 'Offer rejected successfully.');
      } else if (target === 'on_hold') {
        Alert.alert('Offer', 'Offer put on hold successfully.');
      } else if (target === 'pending') {
        setRequestSent(false);
        Alert.alert('Offer', 'Decision changed successfully.');
      } else {
        Alert.alert('Offer', 'Status updated successfully.');
      }
    } catch (e) {
      Alert.alert('Offer', 'Network error while updating offer status.');
    } finally {
      setSending(false);
    }
  };

  const onReject = () => updateOfferStatus('rejected');
  const onHold = () => updateOfferStatus('on_hold');
  const onChangeDecision = () => updateOfferStatus('pending');

  useEffect(() => {
    loadOfferHistory();
    const unsub = navigation?.addListener
      ? navigation.addListener('focus', () => {
          loadOfferHistory();
        })
      : null;
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Offer Details</Text>
        <View style={styles.topBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.tenantCard}>
          <View style={styles.tenantRow}>
            <View style={styles.avatarWrap}>
              {tenantAvatar ? (
                <Image source={{ uri: tenantAvatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={26} color={theme.colors.textSecondary} />
                </View>
              )}
            </View>

            <View style={styles.tenantMeta}>
              <View style={styles.tenantTopRow}>
                <Text style={styles.tenantName} numberOfLines={1}>
                  {tenantName}
                </Text>
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={14} color="#a16207" />
                  <Text style={styles.ratingText}>{Number(tenant?.rating || 0) || 5.0}</Text>
                </View>
              </View>
              {!!tenantSubtitle && (
                <Text style={styles.tenantSub} numberOfLines={1}>
                  {tenantSubtitle}
                </Text>
              )}
              {!!tenantMeta && <Text style={styles.tenantHint}>{tenantMeta}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.cardHeader}>Offer History</Text>
          </View>

          {historyLoading ? (
            <Text style={styles.mutedText}>Loading offer history...</Text>
          ) : !offerHistory.length ? (
            <Text style={styles.mutedText}>No previous offers found.</Text>
          ) : (
            <View style={styles.historyWrap}>
              {offerHistory.map((h, idx) => {
                const isLast = idx === offerHistory.length - 1;
                const created = formatDateTime(h?.createdAt);
                const rentLabel = h?.offerRent ? moneyLabel(h.offerRent) : '-';
                const bookingLabel = h?.offerBookingAmount ? moneyLabel(h.offerBookingAmount) : '-';
                const status = String(h?.status || 'pending').toLowerCase();
                const statusLabel =
                  status === 'on_hold' ? 'On Hold' : status === 'rejected' ? 'Rejected' : status === 'accepted' ? 'Accepted' : 'Pending';

                return (
                  <View key={String(h?._id || idx)} style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <View style={styles.historyDot} />
                      {!isLast ? <View style={styles.historyLine} /> : <View style={styles.historyLineEnd} />}
                    </View>
                    <View style={styles.historyBody}>
                      <View style={styles.historyTopRow}>
                        <Text style={styles.historyDate}>{created || '-'}</Text>
                        <View style={styles.historyStatusPill}>
                          <Text style={styles.historyStatusText}>{statusLabel}</Text>
                        </View>
                      </View>
                      <Text style={styles.historyMeta}>Rent: {rentLabel} /mo</Text>
                      <Text style={styles.historyMeta}>Booking: {bookingLabel}</Text>
                      {!!h?.joiningDateEstimate ? (
                        <Text style={styles.historyMeta}>Joining: {String(h.joiningDateEstimate)}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.grid2}>
          <StatCard
            icon="cash-outline"
            title="Proposed Rent"
            value={offeredRent ? moneyLabel(offeredRent, '-') : '-'}
            suffix="/mo"
            subLeft={
              vsAskPct == null
                ? null
                : `${vsAskPct > 0 ? '+' : ''}${vsAskPct}% vs Ask`
            }
            subRight={askedRent ? moneyLabel(askedRent, '') : null}
            accent={theme.colors.primary}
          />
          <StatCard
            icon="analytics-outline"
            title="Profile Match"
            value={`${matchPercent}%`}
            suffix={null}
            subLeft={matchPercent >= 80 ? 'Excellent' : matchPercent >= 60 ? 'Good' : 'Low'}
            subRight={null}
            accent={theme.colors.primary}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="options-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.cardHeader}>Tenant Preferences</Text>
          </View>

          <View style={styles.chipsWrap}>
            {preferences.length ? (
              preferences.map((c, idx) => (
                <Chip key={`${c.label}_${idx}`} icon={c.icon} label={c.label} tone={c.tone} />
              ))
            ) : (
              <Text style={styles.mutedText}>No preferences provided.</Text>
            )}
          </View>
        </View>

        <View style={styles.acceptCard}>
          <View style={styles.acceptHeader}>
            <View style={styles.acceptHeaderLeft}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.acceptTitle}>Acceptance Details</Text>
            </View>
            <Text style={styles.acceptTag}>Action Required</Text>
          </View>

          <View style={styles.acceptBody}>
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Advance Booking Charges</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>₹</Text>
                <TextInput
                  value={advanceBooking}
                  onChangeText={setAdvanceBooking}
                  keyboardType="numeric"
                  placeholder="e.g. 5000"
                  style={styles.input}
                  editable={!isDecisionLocked}
                />
              </View>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Validity Days (optional)</Text>
              <View style={styles.inputWrapIcon}>
                <Ionicons name="hourglass-outline" size={18} color={theme.colors.textSecondary} />
                <TextInput
                  value={validityDays}
                  onChangeText={setValidityDays}
                  keyboardType="numeric"
                  placeholder="e.g. 3"
                  style={styles.input}
                  editable={!isDecisionLocked}
                />
              </View>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Propose Meeting Time (optional)</Text>
              <View style={styles.inputWrapIcon}>
                <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
                <TextInput
                  value={meetingTime}
                  onChangeText={setMeetingTime}
                  placeholder="YYYY-MM-DD HH:mm"
                  style={styles.input}
                  editable={!isDecisionLocked}
                  {...(Platform.OS === 'web'
                    ? {
                        type: 'datetime-local',
                      }
                    : {})}
                />
              </View>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Desired Joining Date (optional)</Text>
              <View style={styles.inputWrapIcon}>
                <Ionicons name="time-outline" size={18} color={theme.colors.textSecondary} />
                <TextInput
                  value={joiningDate}
                  onChangeText={setJoiningDate}
                  placeholder="YYYY-MM-DD"
                  style={styles.input}
                  editable={!isDecisionLocked}
                  {...(Platform.OS === 'web'
                    ? {
                        type: 'date',
                      }
                    : {})}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, sending ? { opacity: 0.7 } : null]}
              onPress={onSendRequest}
              activeOpacity={0.9}
              disabled={sending || requestSent || offerStatus === 'rejected' || offerStatus === 'on_hold'}
            >
              <Text style={styles.sendBtnText}>
                {sending ? 'Sending...' : requestSent ? 'Request Sent' : 'Send Request'}
              </Text>
              <Ionicons name="send" size={18} color="#ffffff" />
            </TouchableOpacity>

            <Text style={styles.acceptHint}>Tenant will be notified to confirm these terms.</Text>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        {offerStatus === 'rejected' || offerStatus === 'on_hold' ? (
          <View
            style={[
              styles.decisionBanner,
              styles.decisionBannerBottom,
              offerStatus === 'rejected' ? styles.decisionBannerRejected : styles.decisionBannerHold,
            ]}
          >
            <Text
              style={[
                styles.decisionBannerText,
                offerStatus === 'rejected' ? styles.decisionBannerTextRejected : styles.decisionBannerTextHold,
              ]}
            >
              {offerStatus === 'rejected' ? 'Rejected by you' : 'On Hold by you'}
            </Text>
            <TouchableOpacity
              style={[styles.changeDecisionBtn, sending ? { opacity: 0.7 } : null]}
              onPress={onChangeDecision}
              activeOpacity={0.9}
              disabled={sending}
            >
              <Text style={styles.changeDecisionText}>Change Decision</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={onReject}
              activeOpacity={0.9}
              disabled={sending || offerStatus === 'rejected' || offerStatus === 'on_hold'}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.holdBtn}
              onPress={onHold}
              activeOpacity={0.9}
              disabled={sending || offerStatus === 'on_hold' || offerStatus === 'rejected'}
            >
              <Text style={styles.holdBtnText}>On Hold</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  decisionBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  decisionBannerBottom: {
    marginBottom: 0,
  },
  decisionBannerRejected: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.20)',
  },
  decisionBannerHold: {
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.22)',
  },
  decisionBannerText: {
    fontSize: 18,
    fontWeight: '900',
  },
  decisionBannerTextRejected: {
    color: '#dc2626',
  },
  decisionBannerTextHold: {
    color: '#b45309',
  },
  changeDecisionBtn: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeDecisionText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
  historyWrap: {
    marginTop: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  historyLeft: {
    width: 18,
    alignItems: 'center',
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    marginTop: 3,
  },
  historyLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.10)',
    marginTop: 6,
  },
  historyLineEnd: {
    width: 2,
    height: 10,
    backgroundColor: 'transparent',
    marginTop: 6,
  },
  historyBody: {
    flex: 1,
    paddingLeft: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  historyDate: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text,
  },
  historyStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.10)',
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  historyMeta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  topBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: theme.colors.text,
  },
  body: {
    padding: 16,
    paddingBottom: 24,
  },
  tenantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 14,
  },
  tenantRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  tenantMeta: {
    flex: 1,
    minWidth: 0,
  },
  tenantTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  tenantName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#a16207',
  },
  tenantSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tenantHint: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    minHeight: 132,
    overflow: 'hidden',
  },
  statBgIcon: {
    position: 'absolute',
    right: -12,
    top: -12,
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  statSuffix: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statFooterRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statFooterPill: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ea580c',
    backgroundColor: '#ffedd5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statFooterStrike: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  chipDefault: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  chipDefaultText: {
    color: theme.colors.text,
  },
  chipMuted: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  chipMutedText: {
    color: theme.colors.textSecondary,
  },
  chipPrimary: {
    backgroundColor: '#ede9fe',
    borderColor: '#ddd6fe',
  },
  chipPrimaryText: {
    color: theme.colors.primary,
  },
  mutedText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  acceptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.22)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  acceptHeader: {
    backgroundColor: 'rgba(59,130,246,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  acceptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  acceptTag: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(59,130,246,0.75)',
    textTransform: 'uppercase',
  },
  acceptBody: {
    padding: 14,
    gap: 12,
  },
  inputBlock: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textSecondary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  inputWrapIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.textSecondary,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    paddingVertical: 0,
  },
  sendBtn: {
    marginTop: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  acceptHint: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textAlign: 'center',
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
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#dc2626',
  },
  holdBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  holdBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
  },
});
