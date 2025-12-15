import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../theme';

const USER_PROFILE_STORAGE_KEY = 'USER_PROFILE';

function isCompletion100(user) {
  const percent = Number(user?.profileCompletionPercent);
  if (Number.isFinite(percent) && percent >= 100) return true;
  if (user?.isProfileComplete === true) return true;
  return false;
}

export default function CustomDrawer(props) {
  const { state, navigation } = props;
  const [profileComplete, setProfileComplete] = useState(true);

  const menuItems = [
    { key: 'Dashboard', label: 'Dashboard', icon: '\u25a2' },
    { key: 'Profile', label: 'Profile', icon: '\ud83d\udc64' },
    { key: 'Property', label: 'Property', icon: '\ud83c\udfe0' },
    { key: 'Wishlist', label: 'Wishlist', icon: '\u2764' },
    { key: 'Tenents', label: 'Tenents', icon: '\ud83d\udc65' },
    { key: 'Payments', label: 'Payments', icon: '\ud83d\udcb3' },
    { key: 'Settings', label: 'Settings', icon: '\u2699' },
    { key: 'Documents', label: 'Documents', icon: '\ud83d\udcc4' },
    { key: 'Ads', label: 'Ads', icon: '\ud83d\udce2' },
    { key: 'subscription', label: 'Subscription', icon: '\u2605' },
    { key: 'Logout', label: 'Logout', icon: '\u23cb' },
  ];

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const json = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
        const user = json ? JSON.parse(json) : null;
        if (!mounted) return;
        setProfileComplete(isCompletion100(user));
      } catch (e) {
        if (!mounted) return;
        setProfileComplete(false);
      }
    };

    loadProfile();
    const unsub = navigation.addListener('focus', loadProfile);
    return () => {
      mounted = false;
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  const handleNavigate = (itemKey) => {
    if (itemKey === 'Logout') {
      handleLogout();
      return;
    }

    if (!profileComplete && itemKey !== 'Profile') {
      Alert.alert('Complete Profile', 'Please complete your profile 100% to access other pages.');
      navigation.navigate('Profile');
      return;
    }

    const targetRoute = state.routes.find((r) => r.name === itemKey);
    if (targetRoute) {
      navigation.navigate(itemKey);
    }
  };

  const handleLogout = () => {
    navigation.closeDrawer();
    const parent = navigation.getParent();
    if (parent) {
      parent.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  return (
    <View style={styles.root}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.menuBlock}>
          <Text style={styles.menuTitle}>Menu</Text>
          {menuItems.map((item) => {
            const focused = state.routes[state.index]?.name === item.key;
            const isLogout = item.key === 'Logout';

            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => handleNavigate(item.key)}
                style={[
                  styles.menuItem,
                  focused && styles.menuItemFocused,
                  isLogout && styles.menuItemLogout,
                ]}
              >
                <View style={styles.menuItemInner}>
                  <View
                    style={[
                      styles.iconBox,
                      focused && styles.iconBoxFocused,
                      isLogout && styles.iconBoxLogout,
                    ]}
                  >
                    <Text
                      style={[
                        styles.iconGlyph,
                        focused && styles.iconGlyphFocused,
                        isLogout && styles.iconGlyphLogout,
                      ]}
                    >
                      {item.icon}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.menuLabel,
                      focused && styles.menuLabelFocused,
                      isLogout && styles.menuLabelLogout,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>
      <View style={styles.logoutBlock}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutLabel}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  menuBlock: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 24,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemFocused: {
    backgroundColor: '#E8F5FD',
  },
  menuItemLogout: {
    marginTop: 16,
  },
  menuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxFocused: {
    borderColor: theme.colors.primary,
  },
  iconBoxLogout: {
    borderColor: '#b91c1c',
  },
  iconGlyph: {
    fontSize: 14,
    color: '#111827',
  },
  iconGlyphFocused: {
    color: theme.colors.primary,
  },
  iconGlyphLogout: {
    color: '#b91c1c',
  },
  menuLabel: {
    fontSize: 15,
    color: theme.colors.text,
  },
  menuLabelFocused: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  logoutBlock: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  logoutLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
