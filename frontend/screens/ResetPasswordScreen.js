import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import theme from '../theme';
import { API_BASE_URL } from '../apiBaseUrl';

export default function ResetPasswordScreen({ navigation, route }) {
  const resetToken = route?.params?.resetToken;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!resetToken) {
      Alert.alert('Reset Password', 'Missing reset session. Please try again.');
      return;
    }

    if (!(newPassword || '').trim() || !(confirmPassword || '').trim()) {
      Alert.alert('Validation', 'Please enter new password and confirm password.');
      return;
    }

    if (String(newPassword) !== String(confirmPassword)) {
      Alert.alert('Validation', 'Password and confirm password do not match.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Reset Password', data?.message || 'Failed to reset password');
        return;
      }

      navigation.replace('PasswordChangedSuccess');
    } catch (e) {
      Alert.alert('Reset Password', 'Unable to connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.85}
          >
            <Text style={styles.backLabel}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Create a new password for your account.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={stylesVars.placeholderColor}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={stylesVars.placeholderColor}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleUpdate}
            activeOpacity={0.9}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonLabel}>
              {submitting ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F5FF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  header: {
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4B5563',
    marginTop: -1,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.8)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D1D3A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 8,
    paddingLeft: 6,
  },
  input: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.8)',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButton: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
});

const stylesVars = {
  placeholderColor: 'rgba(156,163,175,0.8)',
};
