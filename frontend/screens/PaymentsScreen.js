import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://home-backend-zc1d.onrender.com';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);
const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const USER_PROFILE_STORAGE_KEY = 'USER_PROFILE';

const normalizeRole = (r) => {
  const s = String(r || '').trim().toLowerCase();
  if (s === 'tenant' || s === 'tenent') return 'tenant';
  if (s === 'owner') return 'owner';
  return s;
};

const formatDateTime = (raw) => {
  if (!raw) return '-';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  } catch (e) {
    return '-';
  }
};

const moneyLabel = (v, fallback = '-') => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return `₹${n.toLocaleString('en-IN')}`;
};

export default function PaymentsScreen({ navigation, route }) {
  const params = route?.params || {};
  const amount = Number(params?.amount || 0) || 0;
  const propertyName = String(params?.propertyName || '').trim();
  const validityDays = Number(params?.validityDays || 0) || 0;
  const offerId = String(params?.offerId || '').trim();

  const [role, setRole] = useState('');
  const normalizedRole = useMemo(() => normalizeRole(role), [role]);
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [myPayments, setMyPayments] = useState([]);
  const [incomingPayments, setIncomingPayments] = useState([]);
  const [incomingRents, setIncomingRents] = useState([]);
  const [ownerTab, setOwnerTab] = useState('all_tenants');

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadRole = async () => {
    try {
      const json = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
      const user = json ? JSON.parse(json) : null;
      setRole(normalizeRole(user?.role));
    } catch (e) {
      setRole('');
    }
  };

  const fetchMyPayments = async () => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Payments', 'Please login again.');
        return;
      }
      const resp = await fetch(`${API_BASE_URL}/api/payments/my`, { headers: { ...authHeaders } });
      if (!resp.ok) {
        let msg = 'Failed to load payments.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Payments', msg);
        return;
      }
      const data = await resp.json().catch(() => ({}));
      setMyPayments(Array.isArray(data?.payments) ? data.payments : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomingPayments = async () => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Payments', 'Please login again.');
        return;
      }
      const resp = await fetch(`${API_BASE_URL}/api/payments/incoming`, { headers: { ...authHeaders } });
      if (!resp.ok) {
        let msg = 'Failed to load payments.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Payments', msg);
        return;
      }
      const data = await resp.json().catch(() => ({}));
      setIncomingPayments(Array.isArray(data?.payments) ? data.payments : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomingRents = async (status = 'pending') => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Payments', 'Please login again.');
        return;
      }
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      const resp = await fetch(`${API_BASE_URL}/api/rents/incoming${qs}`, { headers: { ...authHeaders } });
      if (!resp.ok) {
        let msg = 'Failed to load rent records.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Payments', msg);
        return;
      }
      const data = await resp.json().catch(() => ({}));
      setIncomingRents(Array.isArray(data?.rents) ? data.rents : []);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async () => {
    if (!offerId) {
      Alert.alert('Payments', 'Offer not found. Please open offer again.');
      return;
    }
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Payments', 'Please login again.');
        return;
      }
      const resp = await fetch(`${API_BASE_URL}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ offerId }),
      });
      if (!resp.ok) {
        let msg = 'Failed to start payment.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Payments', msg);
        return;
      }
      const data = await resp.json().catch(() => ({}));
      setTransaction(data?.transaction || null);
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async () => {
    const txnId = String(transaction?.transactionId || '').trim();
    if (!txnId) {
      Alert.alert('Payments', 'Transaction not created yet.');
      return;
    }
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Payments', 'Please login again.');
        return;
      }
      const resp = await fetch(`${API_BASE_URL}/api/payments/${encodeURIComponent(txnId)}/mark-paid`, {
        method: 'PATCH',
        headers: { ...authHeaders },
      });
      if (!resp.ok) {
        let msg = 'Payment failed.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Payments', msg);
        return;
      }
      const data = await resp.json().catch(() => ({}));
      setTransaction(data?.transaction || null);
      await fetchMyPayments();
      Alert.alert('Payments', 'Payment successful.');
    } finally {
      setLoading(false);
    }
  };

  const verifyReceived = async (txnId) => {
    const id = String(txnId || '').trim();
    if (!id) return;
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Payments', 'Please login again.');
        return;
      }
      const resp = await fetch(`${API_BASE_URL}/api/payments/${encodeURIComponent(id)}/verify`, {
        method: 'PATCH',
        headers: { ...authHeaders },
      });
      if (!resp.ok) {
        let msg = 'Failed to verify payment.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Payments', msg);
        return;
      }
      await fetchIncomingPayments();
      Alert.alert('Payments', 'Marked as verified.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRole();
    const unsub = navigation?.addListener
      ? navigation.addListener('focus', () => {
          loadRole();
        })
      : null;
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  useEffect(() => {
    if (normalizedRole === 'tenant') {
      fetchMyPayments();
    }
    if (normalizedRole === 'owner') {
      fetchIncomingPayments();
      fetchIncomingRents('pending');
    }
  }, [normalizedRole]);

  const ownerTabs = [
    { key: 'all_tenants', label: 'All Tenants' },
    { key: 'received_rent', label: 'Received Rent' },
    { key: 'new_booking', label: 'New Booking Payment' },
    { key: 'pending_rent', label: 'Pending Rent' },
  ];

  const ownerFilteredPayments = useMemo(() => {
    const list = Array.isArray(incomingPayments) ? incomingPayments : [];
    if (ownerTab === 'received_rent') {
      return list.filter((p) => !!p?.ownerVerified);
    }
    if (ownerTab === 'new_booking') {
      return list.filter((p) => String(p?.status || '').toLowerCase() === 'paid' && !p?.ownerVerified);
    }
    if (ownerTab === 'pending_rent') {
      // Current system tracks advance/booking payments. Pending rent management needs a monthly rent schedule.
      // For now, show transactions that are not paid yet.
      return list.filter((p) => String(p?.status || '').toLowerCase() !== 'paid');
    }
    return list;
  }, [incomingPayments, ownerTab]);

  const ownerFilteredRents = useMemo(() => {
    const list = Array.isArray(incomingRents) ? incomingRents : [];
    if (ownerTab === 'pending_rent') return list;
    return [];
  }, [incomingRents, ownerTab]);

  const isGatewayFlow = params?.source === 'offer_advance_request';
  const txStatus = String(transaction?.status || '').toLowerCase();
  const paid = txStatus === 'paid';
  const verified = !!transaction?.ownerVerified;

  return (
    <ScreenLayout
      title="Payments"
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {isGatewayFlow && normalizedRole === 'tenant' ? (
          <View style={styles.card}>
            <Text style={styles.title}>Pay Advance</Text>
            {!!propertyName && <Text style={styles.meta}>Property: {propertyName}</Text>}
            <Text style={styles.meta}>Amount: {moneyLabel(amount, '-')}
            </Text>
            {validityDays > 0 ? <Text style={styles.meta}>Validity: {validityDays} day(s)</Text> : null}

            {!transaction ? (
              <TouchableOpacity
                style={[styles.primaryBtn, loading ? styles.btnDisabled : null]}
                onPress={createTransaction}
                activeOpacity={0.9}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>{loading ? 'Starting...' : 'Start Payment'}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.receiptBox}>
                  <Text style={styles.receiptTitle}>Receipt</Text>
                  <Text style={styles.meta}>Transaction ID: {String(transaction?.transactionId || '-')}</Text>
                  <Text style={styles.meta}>Status: {String(transaction?.status || '-')}</Text>
                  <Text style={styles.meta}>Created: {formatDateTime(transaction?.createdAt)}</Text>
                  <Text style={styles.meta}>Paid: {formatDateTime(transaction?.paidAt)}</Text>
                  <Text style={styles.meta}>Owner Verified: {verified ? 'Yes' : 'No'}</Text>
                  <Text style={styles.meta}>Verified At: {formatDateTime(transaction?.ownerVerifiedAt)}</Text>
                </View>

                {!paid ? (
                  <TouchableOpacity
                    style={[styles.primaryBtn, loading ? styles.btnDisabled : null]}
                    onPress={markPaid}
                    activeOpacity={0.9}
                    disabled={loading}
                  >
                    <Text style={styles.primaryBtnText}>{loading ? 'Processing...' : 'Pay Now (Mock Gateway)'}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        ) : normalizedRole === 'owner' ? (
          <View style={styles.card}>
            <Text style={styles.title}>Incoming Payments</Text>
            <Text style={styles.subtitle}>Verify received payments.</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
              {ownerTabs.map((t) => {
                const active = ownerTab === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.tabChip, active ? styles.tabChipActive : null]}
                    onPress={() => setOwnerTab(t.key)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.tabChipText, active ? styles.tabChipTextActive : null]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.secondaryBtn, loading ? styles.btnDisabled : null]}
              onPress={async () => {
                await fetchIncomingPayments();
                await fetchIncomingRents('pending');
              }}
              activeOpacity={0.9}
              disabled={loading}
            >
              <Text style={styles.secondaryBtnText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
            </TouchableOpacity>

            {ownerTab === 'pending_rent' ? (
              !ownerFilteredRents.length ? (
                <Text style={styles.emptyText}>No pending rent records yet.</Text>
              ) : (
                <View style={styles.listWrap}>
                  {ownerFilteredRents.map((r) => {
                    const key = String(r?._id || r?.rentMonth || Math.random());
                    const tenantName = `${String(r?.tenantId?.firstName || '').trim()} ${String(
                      r?.tenantId?.lastName || '',
                    ).trim()}`.trim();
                    const propName = String(r?.propertyId?.propertyName || '').trim();
                    return (
                      <View key={key} style={styles.paymentRow}>
                        <Text style={styles.rowTitle}>{propName || 'Property'}</Text>
                        <Text style={styles.rowMeta}>Tenant: {tenantName || '-'}</Text>
                        <Text style={styles.rowMeta}>Rent Month: {String(r?.rentMonth || '-')}</Text>
                        <Text style={styles.rowMeta}>Due Date: {formatDateTime(r?.dueDate)}</Text>
                        <Text style={styles.rowMeta}>Amount: {moneyLabel(r?.amount, '-')}</Text>
                        <Text style={styles.rowMeta}>Status: {String(r?.status || '-')}</Text>
                      </View>
                    );
                  })}
                </View>
              )
            ) : !ownerFilteredPayments.length ? (
              <Text style={styles.emptyText}>No incoming payments yet.</Text>
            ) : (
              <View style={styles.listWrap}>
                {ownerFilteredPayments.map((p) => {
                  const txnId = String(p?.transactionId || '');
                  const tenantName = `${String(p?.tenantId?.firstName || '').trim()} ${String(
                    p?.tenantId?.lastName || '',
                  ).trim()}`.trim();
                  const propName = String(p?.propertyId?.propertyName || '').trim();
                  const isPaid = String(p?.status || '').toLowerCase() === 'paid';
                  const isVerified = !!p?.ownerVerified;
                  return (
                    <View key={txnId || String(p?._id)} style={styles.paymentRow}>
                      {isVerified ? (
                        <View style={styles.verifiedHeaderRow}>
                          <View style={styles.verifiedIconWrap}>
                            <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                          </View>
                          <Text style={styles.verifiedHeading}>Payment successfully received</Text>
                        </View>
                      ) : null}
                      <Text style={styles.rowTitle}>{propName || 'Property'}</Text>
                      <Text style={styles.rowMeta}>Tenant: {tenantName || '-'}</Text>
                      <Text style={styles.rowMeta}>Amount: {moneyLabel(p?.amount, '-')}</Text>
                      <Text style={styles.rowMeta}>Txn: {txnId || '-'}</Text>
                      <Text style={styles.rowMeta}>Paid: {formatDateTime(p?.paidAt)}</Text>
                      <Text style={styles.rowMeta}>Verified: {isVerified ? 'Yes' : 'No'}</Text>

                      {isPaid && !isVerified ? (
                        <TouchableOpacity
                          style={[styles.primaryBtn, loading ? styles.btnDisabled : null]}
                          onPress={() => verifyReceived(txnId)}
                          activeOpacity={0.9}
                          disabled={loading}
                        >
                          <Text style={styles.primaryBtnText}>Verify Received</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>Payments</Text>
            <Text style={styles.subtitle}>Login to view payments.</Text>
          </View>
        )}

        {normalizedRole === 'tenant' && !isGatewayFlow ? (
          <View style={styles.card}>
            <Text style={styles.title}>My Payments</Text>
            <TouchableOpacity
              style={[styles.secondaryBtn, loading ? styles.btnDisabled : null]}
              onPress={fetchMyPayments}
              activeOpacity={0.9}
              disabled={loading}
            >
              <Text style={styles.secondaryBtnText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
            </TouchableOpacity>

            {!myPayments.length ? (
              <Text style={styles.emptyText}>No payments yet.</Text>
            ) : (
              <View style={styles.listWrap}>
                {myPayments.map((p) => {
                  const txnId = String(p?.transactionId || '');
                  const ownerName = `${String(p?.ownerId?.firstName || '').trim()} ${String(
                    p?.ownerId?.lastName || '',
                  ).trim()}`.trim();
                  const propName = String(p?.propertyId?.propertyName || '').trim();
                  return (
                    <View key={txnId || String(p?._id)} style={styles.paymentRow}>
                      <Text style={styles.rowTitle}>{propName || 'Property'}</Text>
                      <Text style={styles.rowMeta}>Owner: {ownerName || '-'}</Text>
                      <Text style={styles.rowMeta}>Amount: {moneyLabel(p?.amount, '-')}</Text>
                      <Text style={styles.rowMeta}>Txn: {txnId || '-'}</Text>
                      <Text style={styles.rowMeta}>Paid: {formatDateTime(p?.paidAt)}</Text>
                      <Text style={styles.rowMeta}>Verified: {p?.ownerVerified ? 'Yes' : 'No'}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  secondaryBtn: {
    marginTop: 8,
    backgroundColor: '#eef2ff',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  secondaryBtnText: {
    color: theme.colors.primary,
    fontWeight: '900',
    fontSize: 13,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  receiptBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#f9fafb',
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 6,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  listWrap: {
    marginTop: 10,
    gap: 10,
  },
  paymentRow: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 4,
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  verifiedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(22,163,74,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.20)',
    marginBottom: 10,
  },
  verifiedIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,163,74,0.12)',
  },
  verifiedHeading: {
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    color: '#166534',
  },
  tabRow: {
    marginTop: 6,
    paddingBottom: 8,
    gap: 10,
  },
  tabChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
  },
  tabChipActive: {
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.25)',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textSecondary,
  },
  tabChipTextActive: {
    color: theme.colors.primary,
  },
});
