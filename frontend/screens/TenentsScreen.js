import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://home-backend-zc1d.onrender.com';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);
const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';

export default function TenentsScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState([]);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
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

  const fetchBookedTenants = async () => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Tenents', 'Please login again.');
        return;
      }

      const url = `${API_BASE_URL}/api/payments/incoming?paymentType=booking&ownerVerified=true&status=paid`;
      const resp = await fetch(url, { headers: { ...authHeaders } });
      if (!resp.ok) {
        let msg = 'Failed to load tenants.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Tenents', msg);
        return;
      }
      const data = await resp.json().catch(() => ({}));
      setBooked(Array.isArray(data?.payments) ? data.payments : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookedTenants();
    const unsub = navigation?.addListener
      ? navigation.addListener('focus', () => {
          fetchBookedTenants();
        })
      : null;
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  const tenantCards = useMemo(() => {
    const list = Array.isArray(booked) ? booked : [];
    return list.map((tx) => {
      const tenant = tx?.tenantId || {};
      const property = tx?.propertyId || {};
      const offer = tx?.offerId || {};
      const photos = Array.isArray(property?.photos) ? property.photos : [];

      return {
        key: String(tx?._id || tx?.transactionId || Math.random()),
        tx,
        offer,
        property,
        tenant,
        imageUrl: resolveImageUri(photos[0]),
        tenantName: `${String(tenant?.firstName || '').trim()} ${String(tenant?.lastName || '').trim()}`.trim(),
      };
    });
  }, [booked]);

  return (
    <ScreenLayout
      title="Tenents"
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Tenant Listing</Text>
          <TouchableOpacity
            style={[styles.refreshBtn, loading ? styles.btnDisabled : null]}
            onPress={fetchBookedTenants}
            activeOpacity={0.9}
            disabled={loading}
          >
            <Text style={styles.refreshBtnText}>{loading ? 'Loading...' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        {!tenantCards.length ? (
          <Text style={styles.subtitle}>No confirmed tenants yet.</Text>
        ) : (
          <View style={styles.listWrap}>
            {tenantCards.map((c) => {
              const propName = String(c?.property?.propertyName || '').trim();
              const tenantName = c?.tenantName || String(c?.tenant?.username || 'Tenant').trim();
              const ownerVerifiedAt = formatDateTime(c?.tx?.ownerVerifiedAt);
              return (
                <View key={c.key} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.imageWrap}>
                      {c.imageUrl ? (
                        <Image source={{ uri: c.imageUrl }} style={styles.image} />
                      ) : (
                        <View style={styles.imageFallback} />
                      )}
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {propName || 'Property'}
                      </Text>
                      <Text style={styles.cardSub} numberOfLines={1}>
                        Tenant: {tenantName}
                      </Text>
                      <Text style={styles.cardSub}>Booking Amount: {moneyLabel(c?.tx?.amount, '-')}</Text>
                      <Text style={styles.cardSub}>Verified: {ownerVerifiedAt}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => {
                      navigation.navigate('Agreement', {
                        source: 'make_agreement',
                        offer: c.offer,
                        property: c.property,
                        tenant: c.tenant,
                        bookingTx: c.tx,
                      });
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.primaryBtnText}>Make Agreement</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  refreshBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  refreshBtnText: {
    color: theme.colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  listWrap: {
    marginTop: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrap: {
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
  },
  cardSub: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
});
