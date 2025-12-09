import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../layouts/ScreenLayout';
import PrimaryButton from '../components/PrimaryButton';
import theme from '../theme';

const DEMO_USERNAME = 'Admin';
const DEMO_PASSWORD = '123';
const LOGIN_STORAGE_KEY = 'LOGIN_REMEMBER_CREDENTIALS';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

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

  const handleLogin = () => {
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      if (rememberMe) {
        AsyncStorage.setItem(
          LOGIN_STORAGE_KEY,
          JSON.stringify({ username, password }),
        ).catch(() => {});
      } else {
        AsyncStorage.removeItem(LOGIN_STORAGE_KEY).catch(() => {});
      }
      navigation.replace('Main');
    } else {
      Alert.alert('Login failed', 'Invalid username or password');
    }
  };

  return (
    <ScreenLayout title="Login" showHeader={false}>
      <View style={styles.container}>
        <View style={styles.heroBlock}>
          <Text style={styles.heroTitle}>Welcome Back </Text>
          <Text style={styles.heroSubtitle}>
            Sign in with the demo credentials to continue.
          </Text>
        </View>

        <View style={styles.formBlock}>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
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
            <PrimaryButton title="Login" onPress={handleLogin} />
          </View>

          <Text style={styles.hint}>
            Demo credentials: username "Admin" and password "123".
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
});
