import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../apiBaseUrl';

const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const USER_PROFILE_STORAGE_KEY = 'USER_PROFILE';

export default function VerifyOtpScreen({ navigation, route }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const refs = useRef([]);

  const subtitle = useMemo(() => {
    const target = route?.params?.target || 'your email address';
    return `Enter the verification code we just sent on ${target}.`;
  }, [route?.params?.target]);

  const setDigit = (index, value) => {
    const v = (value || '').replace(/\D/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });

    if (v && index < 3) {
      const nextRef = refs.current[index + 1];
      if (nextRef && nextRef.focus) nextRef.focus();
    }
  };

  const handleKeyPress = (index, e) => {
    const key = e?.nativeEvent?.key;
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const prevRef = refs.current[index - 1];
      if (prevRef && prevRef.focus) prevRef.focus();
    }
  };

  const handleVerify = () => {
    const code = digits.join('');
    if (code.length !== 4) {
      Alert.alert('OTP', 'Please enter the 4-digit code.');
      return;
    }
    const mode = route?.params?.mode;
    const otpId = route?.params?.otpId;
    const resetOtpId = route?.params?.resetOtpId;
    if (mode === 'reset_password') {
      if (!resetOtpId) {
        Alert.alert('OTP', 'Missing OTP session. Please try again.');
        return;
      }
    } else {
      if (!otpId) {
        Alert.alert('OTP', 'Missing OTP session. Please register again.');
        return;
      }
    }

    (async () => {
      try {
        const url =
          mode === 'reset_password'
            ? `${API_BASE_URL}/auth/verify-reset-otp`
            : `${API_BASE_URL}/auth/verify-otp`;
        const body =
          mode === 'reset_password'
            ? { resetOtpId, code }
            : { otpId, code };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          Alert.alert('OTP', data?.message || 'Invalid OTP');
          return;
        }

        if (mode === 'reset_password') {
          navigation.replace('ResetPassword', { resetToken: data?.resetToken });
          return;
        }

        if (data?.token) {
          await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, String(data.token));
        }

        if (data?.user) {
          await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(data.user));
        }

        navigation.replace('Welcome');
      } catch (e) {
        Alert.alert('OTP', 'Unable to connect to server.');
      }
    })();
  };

  const handleResend = () => {
    Alert.alert('OTP', 'Code resent.');
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

        <View style={styles.main}>
          <View style={styles.card}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>OTP Verification</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.otpOuter}>
              <View style={styles.otpRow}>
                {digits.map((d, idx) => (
                  <TextInput
                    key={idx}
                    ref={(r) => {
                      refs.current[idx] = r;
                    }}
                    value={d}
                    onChangeText={(t) => setDigit(idx, t)}
                    onKeyPress={(e) => handleKeyPress(idx, e)}
                    style={styles.otpInput}
                    maxLength={1}
                    inputMode={Platform.OS === 'web' ? 'numeric' : undefined}
                    keyboardType={Platform.OS === 'web' ? 'numeric' : 'number-pad'}
                    textAlign="center"
                    autoFocus={idx === 0}
                    placeholder=""
                  />
                ))}
              </View>
            </View>

            {!!route?.params?.otp && (
              <Text style={styles.testingOtp}>
                OTP: {route?.params?.otp}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerify}
            activeOpacity={0.9}
          >
            <Text style={styles.verifyLabel}>Verify</Text>
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive code? </Text>
            <TouchableOpacity onPress={handleResend} activeOpacity={0.8}>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#F0F5FF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 10,
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
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  backLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4B5563',
    marginTop: -1,
  },
  main: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0D1D3A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  otpOuter: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 10,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpInput: {
    height: 64,
    width: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    color: '#0D1D3A',
    outlineStyle: 'none',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 10,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  verifyButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#2866F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2866F6',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  verifyLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  resendRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  resendText: {
    fontSize: 13,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F26464',
  },
  testingOtp: {
    marginTop: 12,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
