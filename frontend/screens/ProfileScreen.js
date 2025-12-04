import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';

export default function ProfileScreen() {
  return (
    <ScreenLayout title="Profile">
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Profile details form will be designed later.
        </Text>
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
