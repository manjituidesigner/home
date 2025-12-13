import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import theme from '../theme';

export default function PrimaryButton({ title, onPress, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      activeOpacity={0.85}
    >
      <Text style={styles.label}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: 999,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
  },
  label: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});
