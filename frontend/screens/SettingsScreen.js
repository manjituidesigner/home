import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';

export default function SettingsScreen({ navigation }) {
  return (
    <ScreenLayout
      title="Settings"
      onPressMenu={() => {
        if (navigation?.toggleDrawer) {
          navigation.toggleDrawer();
          return;
        }
        if (navigation?.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Settings page content will be added later.</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
