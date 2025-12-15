import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';
import PropertyImageSlider from '../components/PropertyImageSlider';
import { getSessionUser } from '../session';
import LoadingOverlay from '../components/LoadingOverlay';
import { Ionicons } from '@expo/vector-icons';

const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://home-backend-zc1d.onrender.com';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);
const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const WISHLIST_STORAGE_KEY = 'WISHLIST_PROPERTIES';

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

export default function DashboardScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState('');
  const [tenantFeed, setTenantFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);

  const normalizedRole = useMemo(() => normalizeRole(role), [role]);

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
        }
        const json = await AsyncStorage.getItem('USER_PROFILE');
        if (!json) return;
        const user = JSON.parse(json);
        if (user?.firstName) setFirstName(String(user.firstName));
        if (user?.role) setRole(String(user.role));
      } catch (e) {}
    };
    load();
  }, []);

  useEffect(() => {
    loadWishlist();
    const unsub = navigation?.addListener
      ? navigation.addListener('focus', loadWishlist)
      : null;
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  useEffect(() => {
    const loadTenantFeed = async () => {
      if (normalizedRole !== 'tenant') return;
      try {
        setLoadingFeed(true);
        const response = await fetch(`${API_BASE_URL}/api/properties/tenant-feed`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

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
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.root}>
        <LoadingOverlay visible={loadingFeed} />
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {normalizedRole === 'tenant' ? (
          <View style={styles.feedBlock}>
            <Text style={styles.sectionTitle}>Available properties</Text>
            {loadingFeed ? (
              <Text style={styles.bodyText}>Loading properties...</Text>
            ) : tenantFeed.length === 0 ? (
              <Text style={styles.bodyText}>
                No tenant-visible properties found.
              </Text>
            ) : (
              tenantFeed.map((item, index) => {
                const photos = Array.isArray(item.photos) ? item.photos : [];
                const city = (item.address || '').split(',').slice(-2, -1)[0] || '';
                const rentLabel = item.rentAmount ? `₹${item.rentAmount}/month` : 'Rent not set';
                const posted = formatPostedDate(item.createdAt);

                return (
                  <View key={item._id || String(index)} style={styles.card}>
                    <View style={styles.cardImageWrapper}>
                      <PropertyImageSlider
                        photos={photos}
                        maxImages={5}
                        autoSlide
                        autoSlideIntervalMs={2500}
                        height={190}
                        borderRadius={0}
                        showThumbnails
                      />
                      <TouchableOpacity
                        style={styles.wishIconBtn}
                        onPress={() => toggleWishlist(item)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name={wishlistIds.includes(item._id) ? 'heart' : 'heart-outline'}
                          size={20}
                          color={wishlistIds.includes(item._id) ? '#ef4444' : '#111827'}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.propertyName || 'Untitled Property'}
                      </Text>
                      <Text style={styles.cardSub} numberOfLines={1}>
                        {(city || item.address || 'Location not set').trim()}
                      </Text>
                      <Text style={styles.cardSub}>
                        {(item.bhk || '1BHK').trim()}
                      </Text>

                      <Text style={styles.cardPrice}>{rentLabel}</Text>
                      {!!posted && (
                        <Text style={styles.cardMeta}>Posted: {posted}</Text>
                      )}

                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() =>
                            navigation.navigate('PropertyDetails', {
                              property: item,
                              propertyList: tenantFeed,
                              index,
                              fromRole: 'tenant',
                            })
                          }
                          activeOpacity={0.9}
                        >
                          <Text style={styles.detailsBtnLabel}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <Text style={styles.bodyText}>Dashboard content will go here later.</Text>
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
  body: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  bodyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 18,
  },
  feedBlock: {
    marginTop: 16,
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
