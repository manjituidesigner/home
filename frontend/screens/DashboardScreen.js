import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';

export default function DashboardScreen({ navigation }) {
  return (
    <ScreenLayout
      title="Dashboard"
<<<<<<< HEAD
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
=======
      headerRight={
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
        >
          <Text style={styles.menuLabel}>Menu</Text>
        </TouchableOpacity>
      }
>>>>>>> main
    >
      <View style={styles.body}>
        <Text style={styles.bodyText}>Dashboard content will go here later.</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
=======
  menuButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F5FD',
  },
  menuLabel: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
>>>>>>> main
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
