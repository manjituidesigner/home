import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../layouts/ScreenLayout';
import PrimaryButton from '../components/PrimaryButton';
import theme from '../theme';
import { setSessionToken, setSessionUser } from '../session';
import LoadingOverlay from '../components/LoadingOverlay';

const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://home-backend-zc1d.onrender.com';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);
const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const USER_PROFILE_STORAGE_KEY = 'USER_PROFILE';
const LOGIN_STORAGE_KEY = 'LOGIN_REMEMBER_CREDENTIALS';

function isProfileComplete(user) {
  const u = user || {};
  const imageOk = !!String(u.profileImageUrl || '').trim();

  const current = u.currentAddress || {};
  const currentOk =
    !!String(current.address || '').trim() &&
    !!String(current.city || '').trim() &&
    !!String(current.district || '').trim() &&
    !!String(current.state || '').trim();

  const sameAs = u.permanentAddressSameAsCurrent === true;
  const permanent = u.permanentAddress || {};
  const permanentOk = sameAs
    ? true
    : !!String(permanent.address || '').trim() &&
      !!String(permanent.city || '').trim() &&
      !!String(permanent.district || '').trim() &&
      !!String(permanent.state || '').trim();

  return imageOk && currentOk && permanentOk;
}

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const json = await AsyncStorage.getItem(LOGIN_STORAGE_KEY);
        if (json) {
          const saved = JSON.parse(json);
          if (saved?.username && saved?.password) {
            setUsername(saved.username);
            setPassword(saved.password);
            setRememberMe(true);
          }
        }
      } catch (e) {
        // ignore load errors for now
      }
    };

    loadSavedCredentials();
  }, []);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Login failed', data?.message || 'Invalid username or password');
        return;
      }

      if (data?.token) {
        setSessionToken(data.token);
        AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, String(data.token)).catch(() => {});
      }

      if (data?.user) {
        const userWithCompletion = {
          ...data.user,
          profileCompletionPercent: isProfileComplete(data.user) ? 100 : 0,
          isProfileComplete: isProfileComplete(data.user),
        };
        setSessionUser(userWithCompletion);
        AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(userWithCompletion)).catch(() => {});
      }

      if (rememberMe) {
        AsyncStorage.setItem(
          LOGIN_STORAGE_KEY,
          JSON.stringify({ username, password }),
        ).catch(() => {});
      } else {
        AsyncStorage.removeItem(LOGIN_STORAGE_KEY).catch(() => {});
      }

      const nextUser = data?.user;
      const needsProfile = nextUser ? !isProfileComplete(nextUser) : false;
      navigation.replace('Main');
      setTimeout(() => {
        navigation.navigate('Main', {
          screen: needsProfile ? 'Profile' : 'Dashboard',
        });
      }, 0);
    } catch (e) {
      Alert.alert('Login failed', 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Login" showHeader={false}>
      <View style={styles.container}>
        <LoadingOverlay visible={loading} />
        <View style={styles.heroBlock}>
          <Text style={styles.heroTitle}>Welcome Back </Text>
          <Text style={styles.heroSubtitle}>
            Sign in with your account to continue.
          </Text>
        </View>

        <View style={styles.formBlock}>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Username or Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter username or email"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(prev => !prev)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkbox,
                rememberMe && styles.checkboxChecked,
              ]}
            >
              {rememberMe && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.rememberLabel}>Remember me</Text>
          </TouchableOpacity>

          <View style={styles.buttonBlock}>
            <PrimaryButton title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.8}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Use your registered username and password.
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  heroBlock: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  formBlock: {
    width: '100%',
    maxWidth: 420,
    gap: theme.spacing.md,
  },
  fieldBlock: {
    marginBottom: theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxTick: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  rememberLabel: {
    fontSize: 13,
    color: theme.colors.text,
  },
  buttonBlock: {
    marginTop: theme.spacing.md,
  },
  hint: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  forgotLink: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
