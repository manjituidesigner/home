import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import theme from '../theme';

export default function CustomDrawer(props) {
<<<<<<< HEAD
  const { state, navigation } = props;

  const menuItems = [
    { key: 'Dashboard', label: 'Dashboard', icon: '▢' },
    { key: 'Profile', label: 'Profile', icon: '👤' },
    { key: 'Property', label: 'Property', icon: '🏠' },
    { key: 'Wishlist', label: 'Wishlist', icon: '❤' },
    { key: 'Tenents', label: 'Tenents', icon: '👥' },
    { key: 'Payments', label: 'Payments', icon: '💳' },
    { key: 'Settings', label: 'Settings', icon: '⚙' },
    { key: 'Documents', label: 'Documents', icon: '📄' },
    { key: 'Ads', label: 'Ads', icon: '📢' },
    { key: 'subscription', label: 'Subscription', icon: '★' },
    { key: 'Logout', label: 'Logout', icon: '⎋' },
  ];

  const handleNavigate = (itemKey) => {
    if (itemKey === 'Logout') {
      handleLogout();
      return;
    }

    const targetRoute = state.routes.find((r) => r.name === itemKey);
    if (targetRoute) {
      navigation.navigate(itemKey);
    }
=======
  const { state, descriptors, navigation } = props;

  const handleNavigate = (routeName) => {
    navigation.navigate(routeName);
>>>>>>> main
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
<<<<<<< HEAD
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
=======
          {state.routes.map((route, index) => {
            const focused = index === state.index;
            const label = descriptors[route.key].options.drawerLabel ?? route.name;
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => handleNavigate(route.name)}
                style={[styles.menuItem, focused && styles.menuItemFocused]}
              >
                <Text style={[styles.menuLabel, focused && styles.menuLabelFocused]}>
                  {label}
                </Text>
>>>>>>> main
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>
<<<<<<< HEAD
=======
      <View style={styles.logoutBlock}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutLabel}>Logout</Text>
        </TouchableOpacity>
      </View>
>>>>>>> main
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
<<<<<<< HEAD
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
=======
>>>>>>> main
  menuLabel: {
    fontSize: 15,
    color: theme.colors.text,
  },
  menuLabelFocused: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
<<<<<<< HEAD
=======
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
>>>>>>> main
});
