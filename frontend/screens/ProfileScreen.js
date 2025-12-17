import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';
import LoadingOverlay from '../components/LoadingOverlay';

const PROFILE_STORAGE_KEY = 'PROFILE_SCREEN_DATA';
const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const USER_PROFILE_STORAGE_KEY = 'USER_PROFILE';
const LOCAL_DEV_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const RENDER_BASE_URL = 'https://apiv2-pnmqz54req-uc.a.run.app';
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || (__DEV__ ? LOCAL_DEV_BASE_URL : RENDER_BASE_URL);

export default function ProfileScreen({ navigation }) {
  const [isEditing, setIsEditing] = useState(true);
  const [sessionUserId, setSessionUserId] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageDataUrl, setProfileImageDataUrl] = useState(null);
  const [profileCompletionPercent, setProfileCompletionPercent] = useState(0);
  const [additionalAddresses, setAdditionalAddresses] = useState([]);
  const [mustConfirmPermanentSame, setMustConfirmPermanentSame] = useState(false);
  const [hasLoadedBackendProfile, setHasLoadedBackendProfile] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lockedProfile, setLockedProfile] = useState({
    fullName: '',
    email: '',
    mobile: '',
    username: '',
    profileImageUrl: '',
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    dob: '',
    currentAddress: {
      address: '',
      city: '',
      district: '',
      state: '',
      country: 'India',
      years: '',
      months: '',
    },
    permanentAddress: {
      address: '',
      city: '',
      district: '',
      state: '',
      country: 'India',
    },
  });

  const calculateCompletion = (candidate) => {
    const d = candidate || formData;
    const imgOk =
      !!String(lockedProfile.profileImageUrl || '').trim() ||
      !!String(profileImage || '').trim();

    const current = d.currentAddress || {};
    const currentOk =
      !!String(current.address || '').trim() &&
      !!String(current.city || '').trim() &&
      !!String(current.district || '').trim() &&
      !!String(current.state || '').trim();

    const sameOk = sameAsCurrent === true;
    const permanent = d.permanentAddress || {};
    const permanentOk =
      sameOk ||
      (!!String(permanent.address || '').trim() &&
        !!String(permanent.city || '').trim() &&
        !!String(permanent.district || '').trim() &&
        !!String(permanent.state || '').trim());

    const total = 3;
    const done = (imgOk ? 1 : 0) + (currentOk ? 1 : 0) + (permanentOk ? 1 : 0);
    return Math.round((done / total) * 100);
  };

  const computeMissingFields = (candidate) => {
    const d = candidate || formData;
    const missing = [];

    const imgOk =
      !!String(lockedProfile.profileImageUrl || '').trim() ||
      !!String(profileImage || '').trim();
    if (!imgOk) missing.push('Profile photo');

    const current = d.currentAddress || {};
    if (!String(current.address || '').trim()) missing.push('Current address');
    if (!String(current.city || '').trim()) missing.push('Current city');
    if (!String(current.district || '').trim()) missing.push('Current district');
    if (!String(current.state || '').trim()) missing.push('Current state');

    if (!sameAsCurrent) {
      const permanent = d.permanentAddress || {};
      if (!String(permanent.address || '').trim()) missing.push('Permanent address');
      if (!String(permanent.city || '').trim()) missing.push('Permanent city');
      if (!String(permanent.district || '').trim()) missing.push('Permanent district');
      if (!String(permanent.state || '').trim()) missing.push('Permanent state');
    }

    return missing;
  };

  const canSave = () => {
    const percent = calculateCompletion(formData);
    if (percent !== 100) return false;
    return true;
  };

  // Check if all required fields are filled
  useEffect(() => {
    const percent = calculateCompletion(formData);
    setProfileCompletionPercent(percent);
    setIsProfileComplete(percent === 100);
    setMissingFields(computeMissingFields(formData));
  }, [formData, profileImage, lockedProfile.profileImageUrl, sameAsCurrent]);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    let mounted = true;
    const loadBackendProfile = async () => {
      try {
        setLoading(true);
        const authHeaders = await getAuthHeaders();
        if (!authHeaders.Authorization) return;

        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.user) return;

        const user = data.user;
        const uid = user?._id || user?.id || null;
        setSessionUserId(uid);

        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        const email = user.email || '';
        const mobile = user.phone || '';
        const username = user.username || '';
        const profileImageUrl = user.profileImageUrl || '';

        const permanentSame = user.permanentAddressSameAsCurrent === true;
        setSameAsCurrent(permanentSame);
        setMustConfirmPermanentSame(false);
        setAdditionalAddresses(Array.isArray(user.additionalAddresses) ? user.additionalAddresses : []);

        setLockedProfile({ fullName, email, mobile, username, profileImageUrl });
        if (profileImageUrl) setProfileImage(profileImageUrl);

        setFormData((prev) => ({
          ...prev,
          fullName,
          email,
          mobile,
          dob: user.dob || prev.dob,
          currentAddress: {
            ...prev.currentAddress,
            ...(user.currentAddress || {}),
          },
          permanentAddress: {
            ...prev.permanentAddress,
            ...(user.permanentAddress || {}),
          },
        }));

        setHasLoadedBackendProfile(true);

        const completionUser = {
          ...user,
          profileCompletionPercent: calculateCompletion({
            ...formData,
            dob: user.dob || formData.dob,
            currentAddress: { ...formData.currentAddress, ...(user.currentAddress || {}) },
            permanentAddress: { ...formData.permanentAddress, ...(user.permanentAddress || {}) },
          }),
        };
        completionUser.isProfileComplete = Number(completionUser.profileCompletionPercent) >= 100;

        await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(completionUser));
      } catch (e) {
        // ignore backend load errors
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadBackendProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const pickImage = async () => {
    if (lockedProfile.profileImageUrl) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Sorry, we need camera roll permissions to upload images.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets?.[0];
      setProfileImage(asset?.uri || null);
      if (asset?.base64) {
        const mime = asset?.mimeType || 'image/jpeg';
        setProfileImageDataUrl(`data:${mime};base64,${asset.base64}`);
      }
    }
  };

  const takePhoto = async () => {
    if (lockedProfile.profileImageUrl) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Sorry, we need camera permissions to take a photo.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets?.[0];
      setProfileImage(asset?.uri || null);
      if (asset?.base64) {
        const mime = asset?.mimeType || 'image/jpeg';
        setProfileImageDataUrl(`data:${mime};base64,${asset.base64}`);
      }
    }
  };

  const handleInputChange = (
    field,
    value,
    isAddress = false,
    addressType = 'currentAddress',
  ) => {
    if (!isEditing) return; // Prevent changes when not in edit mode

    if (!isAddress && (field === 'fullName' || field === 'email' || field === 'mobile' || field === 'username')) {
      return;
    }

    if (isAddress) {
      setFormData(prev => {
        const newData = {
          ...prev,
          [addressType]: {
            ...prev[addressType],
            [field]: value,
          },
        };

        // If same as current is checked, update permanent address when current address changes
        if (addressType === 'currentAddress' && sameAsCurrent) {
          newData.permanentAddress = { ...newData.currentAddress };
        }

        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      if (!canSave()) {
        const list = computeMissingFields(formData);
        Alert.alert(
          'Complete Profile',
          list.length ? `Please complete: ${list.join(', ')}` : 'Please complete your profile to save.',
        );
        return;
      }
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders.Authorization) {
        Alert.alert('Session', 'Please login again.');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          dob: formData.dob,
          currentAddress: formData.currentAddress,
          permanentAddress: sameAsCurrent ? formData.currentAddress : formData.permanentAddress,
          permanentAddressSameAsCurrent: sameAsCurrent,
          additionalAddresses,
          profileImageDataUrl: lockedProfile.profileImageUrl ? undefined : profileImageDataUrl,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data?.message || `Failed to save profile (HTTP ${response.status}).`);
        return;
      }

      const completion = calculateCompletion(formData);
      if (completion === 100) {
        Alert.alert('Success', 'Profile 100% completed. You can access all pages now.');
      } else {
        Alert.alert('Success', 'Details have been saved.');
      }

      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
        userId: sessionUserId || data?.user?._id || data?.user?.id || null,
        data: {
          ...formData,
          profileImage,
          profileImageDataUrl,
          sameAsCurrent,
          additionalAddresses,
        },
      }));

      if (data?.user) {
        const updatedUser = {
          ...data.user,
          profileCompletionPercent: calculateCompletion(formData),
          isProfileComplete: calculateCompletion(formData) === 100,
        };
        await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updatedUser));

        try {
          const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
          });
          const meData = await meRes.json().catch(() => ({}));
          if (meRes.ok && meData?.user) {
            const syncedUser = {
              ...meData.user,
              profileCompletionPercent: calculateCompletion(formData),
              isProfileComplete: calculateCompletion(formData) === 100,
            };
            await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(syncedUser));
          }
        } catch (e) {
          // ignore
        }

        if (String(data.user.profileImageUrl || '').trim()) {
          setLockedProfile((prev) => ({
            ...prev,
            profileImageUrl: data.user.profileImageUrl,
          }));
          setProfileImage(data.user.profileImageUrl);
          setProfileImageDataUrl(null);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    await handleSave();
  };

  const renderAddressFields = (type) => {
    const address =
      type === 'current' ? formData.currentAddress : formData.permanentAddress;
    const isCurrent = type === 'current';
    const isPermanentEditable = type === 'permanent' && !sameAsCurrent;

    // If permanent is same as current, show note
    if (!isCurrent && sameAsCurrent) {
      return (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitleText}>Permanent Address</Text>
          </View>
          <Text style={styles.sameAsText}>Same as current address</Text>
        </View>
      );
    }

    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIndicator} />
          <Text style={styles.sectionTitleText}>
            {isCurrent ? 'Current Address' : 'Permanent Address'}
          </Text>
        </View>

        {!isCurrent && isEditing && (
          <TouchableOpacity
            style={styles.sameAsButton}
            onPress={() => setSameAsCurrent(!sameAsCurrent)}
          >
            <View style={[styles.checkbox, sameAsCurrent && styles.checkedBox]}>
              {sameAsCurrent && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
            <Text style={styles.sameAsLabel}>Same as current address (Mandatory)</Text>
          </TouchableOpacity>
        )}

        <View style={styles.inputGroup}>
          <MaterialIcons
            name="location-on"
            size={20}
            color={theme.colors.primary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder={`${isCurrent ? 'Current ' : 'Permanent '}Address`}
            value={address.address}
            onChangeText={(text) =>
              handleInputChange(
                'address',
                text,
                true,
                isCurrent ? 'currentAddress' : 'permanentAddress',
              )
            }
            editable={isEditing && (isCurrent || isPermanentEditable)}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <MaterialIcons
              name="location-city"
              size={20}
              color={theme.colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="City"
              value={address.city}
              onChangeText={(text) =>
                handleInputChange(
                  'city',
                  text,
                  true,
                  isCurrent ? 'currentAddress' : 'permanentAddress',
                )
              }
              editable={isEditing && (isCurrent || isPermanentEditable)}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <MaterialIcons
              name="map"
              size={20}
              color={theme.colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="District"
              value={address.district}
              onChangeText={(text) =>
                handleInputChange(
                  'district',
                  text,
                  true,
                  isCurrent ? 'currentAddress' : 'permanentAddress',
                )
              }
              editable={isEditing && (isCurrent || isPermanentEditable)}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <MaterialIcons
              name="public"
              size={20}
              color={theme.colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="State"
              value={address.state}
              onChangeText={(text) =>
                handleInputChange(
                  'state',
                  text,
                  true,
                  isCurrent ? 'currentAddress' : 'permanentAddress',
                )
              }
              editable={isEditing && (isCurrent || isPermanentEditable)}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <MaterialIcons
              name="flag"
              size={20}
              color={theme.colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Country"
              value={address.country}
              onChangeText={(text) =>
                handleInputChange(
                  'country',
                  text,
                  true,
                  isCurrent ? 'currentAddress' : 'permanentAddress',
                )
              }
              editable={false}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {isCurrent && (
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <MaterialIcons
                name="calendar-today"
                size={18}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Years lived here"
                value={address.years}
                onChangeText={(text) =>
                  handleInputChange(
                    'years',
                    text,
                    true,
                    'currentAddress',
                  )
                }
                keyboardType="numeric"
                editable={isEditing}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <MaterialIcons
                name="calendar-month"
                size={18}
                color={theme.colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Months"
                value={address.months}
                onChangeText={(text) =>
                  handleInputChange(
                    'months',
                    text,
                    true,
                    'currentAddress',
                  )
                }
                keyboardType="numeric"
                editable={isEditing}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        if (hasLoadedBackendProfile) return;
        const jsonValue = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (jsonValue) {
          const savedProfile = JSON.parse(jsonValue);
          const savedUserId = savedProfile?.userId || null;
          const savedData = savedProfile?.data || savedProfile;
          if (savedUserId && sessionUserId && String(savedUserId) !== String(sessionUserId)) {
            return;
          }
          setFormData(prev => ({
            ...prev,
            ...savedData,
            currentAddress: {
              ...prev.currentAddress,
              ...savedData.currentAddress,
            },
            permanentAddress: {
              ...prev.permanentAddress,
              ...savedData.permanentAddress,
            },
          }));
          if (savedData.profileImage) {
            setProfileImage(savedData.profileImage);
          }
          if (typeof savedData.sameAsCurrent === 'boolean') {
            setSameAsCurrent(savedData.sameAsCurrent);
          }
          if (Array.isArray(savedData.additionalAddresses)) {
            setAdditionalAddresses(savedData.additionalAddresses);
          }
        }
      } catch (e) {
        // ignore load errors
      }
    };

    loadSavedData();
  }, [hasLoadedBackendProfile, sessionUserId]);

  return (
    <ScreenLayout
      title="Profile"
      onPressMenu={() => {
        if (navigation?.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.pageWrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <View style={styles.titleRow}>
              <Text style={styles.cardTitle}>Edit Profile</Text>
              {!isEditing && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="create-outline" size={18} color="#111827" />
                  <Text style={styles.editButtonLabel}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.completionCard}>
              <View style={styles.completionRow}>
                <Text style={styles.completionLabel}>Profile completion</Text>
                <Text style={styles.completionValue}>{profileCompletionPercent}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(0, Math.min(100, profileCompletionPercent))}%` },
                  ]}
                />
              </View>
              {!isProfileComplete && (
                <Text style={styles.completionHint}>
                  Complete photo, current address and confirm permanent address to unlock all pages.
                </Text>
              )}
              {!isProfileComplete && missingFields?.length > 0 && (
                <Text style={styles.completionHint}>
                  Missing: {missingFields.slice(0, 4).join(', ')}{missingFields.length > 4 ? '...' : ''}
                </Text>
              )}
            </View>

            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={isEditing ? pickImage : null}
                disabled={!isEditing}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons
                      name="person-outline"
                      size={40}
                      color="#94a3b8"
                    />
                  </View>
                )}
                {isEditing && (
                  <View style={styles.cameraIcon}>
                    <Ionicons
                      name="camera-outline"
                      size={18}
                      color="#ffffff"
                    />
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.avatarLabel}>Add Photo</Text>
              <Text style={styles.avatarSubLabel}>SELFIE ONLY</Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIndicator} />
                <Text style={styles.sectionTitleText}>Basic Info</Text>
              </View>

              <View style={styles.inputGroup}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChangeText={text => handleInputChange('fullName', text)}
                  editable={false}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address (Optional)"
                  value={formData.email}
                  onChangeText={text => handleInputChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={false}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  value={formData.mobile}
                  onChangeText={text => handleInputChange('mobile', text)}
                  keyboardType="phone-pad"
                  editable={false}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Ionicons
                  name="at-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={lockedProfile.username}
                  editable={false}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Date of Birth (DD/MM/YYYY)"
                  value={formData.dob}
                  onChangeText={text => handleInputChange('dob', text)}
                  editable={isEditing}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {renderAddressFields('current')}
            {renderAddressFields('permanent')}

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIndicator} />
                <Text style={styles.sectionTitleText}>Additional Addresses</Text>
              </View>

              {additionalAddresses.map((addr, idx) => (
                <View key={`${idx}`} style={styles.additionalBlock}>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <MaterialIcons
                        name="badge"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Address Name (Owner/Broker)"
                        value={addr?.name || ''}
                        onChangeText={(text) => {
                          if (!isEditing) return;
                          setAdditionalAddresses((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, name: text } : a))
                          );
                        }}
                        editable={isEditing}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    {isEditing && (
                      <TouchableOpacity
                        style={styles.removeAddressBtn}
                        onPress={() =>
                          setAdditionalAddresses((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <Ionicons name="trash-outline" size={18} color="#ffffff" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Address"
                      value={addr?.address || ''}
                      onChangeText={(text) => {
                        if (!isEditing) return;
                        setAdditionalAddresses((prev) =>
                          prev.map((a, i) => (i === idx ? { ...a, address: text } : a))
                        );
                      }}
                      editable={isEditing}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <MaterialIcons
                        name="location-city"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="City"
                        value={addr?.city || ''}
                        onChangeText={(text) => {
                          if (!isEditing) return;
                          setAdditionalAddresses((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, city: text } : a))
                          );
                        }}
                        editable={isEditing}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <MaterialIcons
                        name="map"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="District"
                        value={addr?.district || ''}
                        onChangeText={(text) => {
                          if (!isEditing) return;
                          setAdditionalAddresses((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, district: text } : a))
                          );
                        }}
                        editable={isEditing}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <MaterialIcons
                        name="public"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="State"
                        value={addr?.state || ''}
                        onChangeText={(text) => {
                          if (!isEditing) return;
                          setAdditionalAddresses((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, state: text } : a))
                          );
                        }}
                        editable={isEditing}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <MaterialIcons
                        name="flag"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Country"
                        value={addr?.country || 'India'}
                        onChangeText={(text) => {
                          if (!isEditing) return;
                          setAdditionalAddresses((prev) =>
                            prev.map((a, i) => (i === idx ? { ...a, country: text } : a))
                          );
                        }}
                        editable={false}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                </View>
              ))}

              {isEditing && (
                <TouchableOpacity
                  style={styles.addMoreBtn}
                  onPress={() =>
                    setAdditionalAddresses((prev) => [
                      ...prev,
                      {
                        name: '',
                        address: '',
                        city: '',
                        district: '',
                        state: '',
                        country: 'India',
                      },
                    ])
                  }
                >
                  <Ionicons name="add-circle-outline" size={18} color="#111827" />
                  <Text style={styles.addMoreLabel}>Add More Address</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
        {isEditing && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.bottomButton, styles.bottomCancelButton]}
              onPress={() => setIsEditing(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.bottomButtonText, styles.bottomCancelText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bottomButton,
                styles.bottomUpdateButton,
                !canSave() ? styles.bottomUpdateButtonDisabled : null,
              ]}
              onPress={handleUpdate}
              disabled={!canSave()}
              activeOpacity={0.85}
            >
              <Text style={styles.bottomButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        )}
        <LoadingOverlay visible={loading} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.text,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editButtonLabel: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  completionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 16,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  completionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  completionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  completionHint: {
    marginTop: 10,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 12,
  },
  formSection: {
    marginBottom: 12,
  },
  additionalBlock: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  addMoreBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  removeAddressBtn: {
    width: 42,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 52,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#111827',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 15,
    color: theme.colors.text,
    outlineStyle: 'none',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sameAsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sameAsLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  sameAsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    marginHorizontal: 6,
  },
  bottomCancelButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bottomUpdateButton: {
    backgroundColor: '#111827',
  },
  bottomUpdateButtonDisabled: {
    opacity: 0.5,
  },
  bottomButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  bottomCancelText: {
    color: '#111827',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveHeaderButton: {
    marginRight: 16,
    padding: 8,
  },
  saveHeaderButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
