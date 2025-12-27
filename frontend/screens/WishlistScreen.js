import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';
import PropertyImageSlider from '../components/PropertyImageSlider';
import { Ionicons } from '@expo/vector-icons';

const WISHLIST_STORAGE_KEY = 'WISHLIST_PROPERTIES';

export default function WishlistScreen({ navigation }) {
  const [list, setList] = useState([]);

  const loadWishlist = async () => {
    try {
      const json = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      const parsed = json ? JSON.parse(json) : [];
      setList(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setList([]);
    }
  };

  const removeFromWishlist = async (id) => {
    if (!id) return;
    try {
      const json = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      const parsed = json ? JSON.parse(json) : [];
      const arr = Array.isArray(parsed) ? parsed : [];
      const next = arr.filter((p) => p?._id !== id);
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      setList(next);
    } catch (e) {}
  };

  useEffect(() => {
    loadWishlist();
    const unsub = navigation?.addListener
      ? navigation.addListener('focus', loadWishlist)
      : null;
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  return (
    <ScreenLayout
      title="Wishlist"
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {list.length === 0 ? (
          <Text style={styles.subtitle}>No properties added to wishlist yet.</Text>
        ) : (
          list.map((item, index) => {
            const photos = Array.isArray(item.photos) ? item.photos : [];
            const rentLabel = item.rentAmount ? `₹${item.rentAmount}/month` : 'Rent not set';
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
                    style={styles.removeIconBtn}
                    onPress={() => removeFromWishlist(item._id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close" size={18} color="#111827" />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.propertyName || 'Untitled Property'}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {(item.address || item.floor || item.customFloor || 'Location not set').trim()}
                  </Text>
                  <Text style={styles.cardPrice}>{rentLabel}</Text>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() =>
                      navigation.navigate('PropertyDetails', {
                        property: item,
                        propertyList: list,
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
            );
          })
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
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
  removeIconBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
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
  detailsBtn: {
    marginTop: 12,
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
