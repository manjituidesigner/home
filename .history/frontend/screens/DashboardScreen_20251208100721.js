import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';

export default function DashboardScreen({ navigation }) {
  return (
    <ScreenLayout
      title="Dashboard"
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.body}>
        <Text style={styles.bodyText}>Dashboard content will go here later.</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
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
