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

const PROFILE_STORAGE_KEY = 'PROFILE_SCREEN_DATA';
const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const USER_PROFILE_STORAGE_KEY = 'USER_PROFILE';
const API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';

export default function ProfileScreen({ navigation }) {
  const [isEditing, setIsEditing] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
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

  // Check if all required fields are filled
  useEffect(() => {
    const { fullName, email, mobile, currentAddress } = formData;
    const isComplete =
      fullName?.trim() &&
      email?.trim() &&
      mobile?.trim() &&
      currentAddress?.address?.trim() &&
      currentAddress?.city?.trim() &&
      currentAddress?.district?.trim() &&
      currentAddress?.state?.trim();
    setIsProfileComplete(!!isComplete);
  }, [formData]);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        if (!authHeaders.Authorization) return;

        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.user) return;

        const user = data.user;

        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        const email = user.email || '';
        const mobile = user.phone || '';
        const username = user.username || '';
        const profileImageUrl = user.profileImageUrl || '';

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

        await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user));
      } catch (e) {
        // ignore load errors
      }
    };

    loadFromBackend();
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
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
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
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
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
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          dob: formData.dob,
          currentAddress: formData.currentAddress,
          permanentAddress: sameAsCurrent ? formData.currentAddress : formData.permanentAddress,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data?.message || 'Failed to save profile.');
        return;
      }

      setIsEditing(false);
      Alert.alert('Success', 'Profile saved successfully!');

      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
        ...formData,
        profileImage,
      }));

      if (data?.user) {
        await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(data.user));
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to save profile.');
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

    // If permanent is same as current, just show note
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
            <Text style={styles.sameAsLabel}>Same as current address</Text>
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
        const jsonValue = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (jsonValue) {
          const savedProfile = JSON.parse(jsonValue);
          setFormData(prev => ({
            ...prev,
            ...savedProfile,
            currentAddress: {
              ...prev.currentAddress,
              ...savedProfile.currentAddress,
            },
            permanentAddress: {
              ...prev.permanentAddress,
              ...savedProfile.permanentAddress,
            },
          }));
          if (savedProfile.profileImage) {
            setProfileImage(savedProfile.profileImage);
          }
        }
      } catch (e) {
        // ignore load errors
      }
    };

    loadSavedData();
  }, []);

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
            <Text style={styles.cardTitle}>Edit Profile</Text>

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
                  placeholder="Email Address"
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
          </View>
        </ScrollView>

        {isEditing && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.bottomButton, styles.bottomCancelButton]}
              onPress={() => {
                setIsEditing(false);
                const loadSavedData = async () => {
                  try {
                    const jsonValue = await AsyncStorage.getItem(
                      PROFILE_STORAGE_KEY,
                    );
                    if (jsonValue) {
                      const savedProfile = JSON.parse(jsonValue);
                      setFormData(prev => ({
                        ...prev,
                        ...savedProfile,
                        currentAddress: {
                          ...prev.currentAddress,
                          ...savedProfile.currentAddress,
                        },
                        permanentAddress: {
                          ...prev.permanentAddress,
                          ...savedProfile.permanentAddress,
                        },
                      }));
                      if (savedProfile.profileImage) {
                        setProfileImage(savedProfile.profileImage);
                      }
                    }
                  } catch (e) {
                    // ignore load errors
                  }
                };
                loadSavedData();
              }}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.colors.textSecondary || '#6b7280' },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomButton, styles.bottomUpdateButton]}
              onPress={isProfileComplete ? handleUpdate : handleSave}
              disabled={!isProfileComplete}
            >
              <Ionicons name="checkmark" size={18} color="#ffffff" />
              <Text
                style={[
                  styles.buttonText,
                  { color: '#ffffff', marginLeft: 8 },
                  !isProfileComplete && { opacity: 0.7 },
                ]}
              >
                Save Details
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
