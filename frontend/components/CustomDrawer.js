import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import theme from '../theme';

export default function CustomDrawer(props) {
  const { state, descriptors, navigation } = props;

  const handleNavigate = (routeName) => {
    navigation.navigate(routeName);
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
