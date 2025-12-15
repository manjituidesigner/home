import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import theme from '../theme';

export default function PrimaryButton({ title, onPress, style, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      activeOpacity={0.85}
      disabled={disabled}
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
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});
