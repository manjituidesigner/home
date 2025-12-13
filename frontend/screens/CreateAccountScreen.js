import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import theme from '../theme';

const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://home-backend-zc1d.onrender.com';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);

export default function CreateAccountScreen({ navigation }) {
  const [role, setRole] = useState('Owner');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleCreate = async () => {
    const missing = [];
    if (!(fullName || '').trim()) missing.push('Full name');
    if (!(phone || '').trim()) missing.push('Phone number');
    if (!(identifier || '').trim()) missing.push('Username or email');
    if (!(password || '').trim()) missing.push('Password');

    if (missing.length) {
      Alert.alert('Validation', 'Please fill the details.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          identifier,
          role,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Register', data?.message || 'Failed to register');
        return;
      }

      navigation.navigate('VerifyOtp', {
        target: 'your phone number',
        otp: data?.otp,
        otpId: data?.otpId,
        phone,
      });
    } catch (e) {
      Alert.alert('Register', 'Unable to connect to server.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBackButton}
            activeOpacity={0.85}
          >
            <Text style={styles.iconBackLabel}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Create Account</Text>

        <View style={styles.segmentedWrapper}>
          {['Owner', 'Tenant', 'Broker'].map((item) => {
            const selected = role === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setRole(item)}
                style={[styles.segmentItem, selected && styles.segmentItemActive]}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    selected && styles.segmentLabelActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ex. Sarah Connor"
              placeholderTextColor={stylesVars.placeholderColor}
              style={styles.formInput}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={stylesVars.placeholderColor}
              style={styles.formInput}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Username or Email</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="@sarahc or sarah@example.com"
              placeholderTextColor={stylesVars.placeholderColor}
              style={styles.formInput}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={stylesVars.placeholderColor}
              style={styles.formInput}
              secureTextEntry
            />
          </View>

        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleCreate}
            activeOpacity={0.9}
          >
            <Text style={styles.registerLabel}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInStrong}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 30,
  },
  topBar: {
    paddingTop: 10,
    paddingBottom: 12,
  },
  iconBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(17,17,26,1)',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  iconBackLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: -2,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  segmentedWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 6,
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 18,
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentLabelActive: {
    color: '#4264DD',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarGroup: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    fontSize: 56,
    color: '#9CA3AF',
  },
  avatarCameraButton: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2455F5',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#2455F5',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  avatarCameraIcon: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: -1,
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  form: {
    marginTop: 6,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 8,
    paddingLeft: 12,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingLeft: 12,
    marginBottom: 8,
  },
  fieldLabelOptional: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  formInput: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.8)',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  footer: {
    marginTop: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  registerButton: {
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2B62FF',
    shadowColor: 'rgba(0,57,195,1)',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  registerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  signInLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  signInStrong: {
    fontWeight: '800',
    color: '#4264DD',
  },
});

const stylesVars = {
  placeholderColor: 'rgba(156,163,175,0.8)',
};
