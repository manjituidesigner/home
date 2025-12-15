import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';
import LoadingOverlay from '../components/LoadingOverlay';

const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://home-backend-zc1d.onrender.com';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);
const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';

export default function OffersScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState([]);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadOffers = async () => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      const resp = await fetch(`${API_BASE_URL}/api/offers/received`, {
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
      setOffers(list);
    } catch (e) {
      Alert.alert('Offers', 'Network error while fetching offers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
    const unsub = navigation?.addListener ? navigation.addListener('focus', loadOffers) : null;
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  return (
    <ScreenLayout
      title="Offers"
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.container}>
        <LoadingOverlay visible={loading} />

        {!offers.length ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No offers yet</Text>
            <Text style={styles.emptySub}>Offers sent by tenants will appear here.</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadOffers}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {offers.map((o) => {
              const property = o?.propertyId;
              const tenant = o?.tenantId;
              return (
                <View key={String(o?._id)} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>
                      {String(property?.propertyName || 'Property')}
                    </Text>
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>{Number(o?.matchPercent || 0)}%</Text>
                    </View>
                  </View>

                  {!!property?.address && (
                    <Text style={styles.metaText} numberOfLines={2}>
                      {String(property.address)}
                    </Text>
                  )}

                  <View style={styles.divider} />

                  <Text style={styles.sectionLabel}>Tenant</Text>
                  <Text style={styles.metaText}>
                    {String(tenant?.firstName || tenant?.username || '-')}
                    {tenant?.phone ? `  (${tenant.phone})` : ''}
                  </Text>

                  <View style={styles.divider} />

                  <Text style={styles.sectionLabel}>Offer</Text>
                  <View style={styles.kvRow}>
                    <Text style={styles.kLabel}>Offer Rent</Text>
                    <Text style={styles.kValue}>₹{Number(o?.offerRent || 0)}</Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={styles.kLabel}>Joining</Text>
                    <Text style={styles.kValue}>{String(o?.joiningDateEstimate || '-')}</Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={styles.kLabel}>Advance</Text>
                    <Text style={styles.kValue}>
                      {o?.offerAdvance != null ? `₹${Number(o.offerAdvance)}` : '-'}
                    </Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={styles.kLabel}>Booking</Text>
                    <Text style={styles.kValue}>
                      {o?.offerBookingAmount != null ? `₹${Number(o.offerBookingAmount)}` : '-'}
                    </Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={styles.kLabel}>Parking</Text>
                    <Text style={styles.kValue}>
                      {o?.needsBikeParking ? 'Bike ' : ''}
                      {o?.needsCarParking ? 'Car' : ''}
                      {!o?.needsBikeParking && !o?.needsCarParking ? '-' : ''}
                    </Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={styles.kLabel}>Tenant type</Text>
                    <Text style={styles.kValue}>{String(o?.tenantType || '-')}</Text>
                  </View>
                </View>
              );
            })}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
    flex: 1,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text,
    flex: 1,
    marginRight: 10,
  },
  metaText: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f3f8',
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#6b7a90',
    fontWeight: '800',
    marginBottom: 6,
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
});
