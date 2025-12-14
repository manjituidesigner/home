import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import theme from '../theme';

const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://home-backend-zc1d.onrender.com';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);

export default function ForgotPasswordScreen({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSendOtp = async () => {
    const missing = [];
    if (!(identifier || '').trim()) missing.push('Username or email');

    if (missing.length) {
      Alert.alert('Validation', 'Please fill the details.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Forgot Password', data?.message || 'Failed to request OTP');
        return;
      }

      navigation.navigate('VerifyOtp', {
        mode: 'reset_password',
        target: data?.target || 'your phone number',
        otp: data?.otp,
        resetOtpId: data?.resetOtpId,
      });
    } catch (e) {
      Alert.alert('Forgot Password', 'Unable to connect to server.');
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
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your username/email. We will send an OTP.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Username or Email</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              placeholder="@username or email"
              placeholderTextColor={stylesVars.placeholderColor}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleSendOtp}
            activeOpacity={0.9}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonLabel}>
              {submitting ? 'Sending...' : 'Send OTP'}
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
