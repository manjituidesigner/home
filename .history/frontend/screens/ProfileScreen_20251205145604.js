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
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';

export default function ProfileScreen({ navigation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
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
      months: ''
    },
    permanentAddress: {
      address: '',
      city: '',
      district: '',
      state: '',
      country: 'India'
    }
  });

  // Check if all required fields are filled
  useEffect(() => {
    const { fullName, email, mobile, currentAddress } = formData;
    const isComplete = fullName && email && mobile && currentAddress.address && 
                      currentAddress.city && currentAddress.district && currentAddress.state;
    setIsProfileComplete(!!isComplete);
  }, [formData]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload images.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
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
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera permissions to take a photo.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleInputChange = (field, value, isAddress = false, addressType = 'currentAddress') => {
    if (isAddress) {
      setFormData(prev => ({
        ...prev,
        [addressType]: {
          ...prev[addressType],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = () => {
    Alert.alert('Success', 'Profile saved successfully!');
    setIsEditing(false);
  };

  const handleUpdate = () => {
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  const renderAddressFields = (type) => {
    const address = type === 'current' ? formData.currentAddress : formData.permanentAddress;
    const isCurrent = type === 'current';
    const isPermanentEditable = type === 'permanent' && !sameAsCurrent;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isCurrent ? 'Current Address' : 'Permanent Address'}
          {!isCurrent && sameAsCurrent && (
            <Text style={styles.sameAsText}> (Same as current address)</Text>
          )}
        </Text>
        
        {!isCurrent && isEditing && (
          <TouchableOpacity 
            style={styles.sameAsButton}
            onPress={() => setSameAsCurrent(!sameAsCurrent)}
          >
            <View style={[styles.checkbox, sameAsCurrent && styles.checkedBox]}>
              {sameAsCurrent && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={styles.sameAsLabel}>Same as current address</Text>
          </TouchableOpacity>
        )}

        {(!isCurrent && sameAsCurrent) ? null : (
          <>
            <View style={styles.inputGroup}>
              <MaterialIcons name="location-on" size={20} color={theme.colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={`${isCurrent ? 'Current ' : 'Permanent '}Address`}
                value={isCurrent ? address.address : (sameAsCurrent ? formData.currentAddress.address : address.address)}
                onChangeText={(text) => handleInputChange('address', text, true, isCurrent ? 'currentAddress' : 'permanentAddress')}
                editable={isEditing && (isCurrent || isPermanentEditable)}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <MaterialIcons name="location-city" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  value={isCurrent ? address.city : (sameAsCurrent ? formData.currentAddress.city : address.city)}
                  onChangeText={(text) => handleInputChange('city', text, true, isCurrent ? 'currentAddress' : 'permanentAddress')}
                  editable={isEditing && (isCurrent || isPermanentEditable)}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <MaterialIcons name="map" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="District"
                  value={isCurrent ? address.district : (sameAsCurrent ? formData.currentAddress.district : address.district)}
                  onChangeText={(text) => handleInputChange('district', text, true, isCurrent ? 'currentAddress' : 'permanentAddress')}
                  editable={isEditing && (isCurrent || isPermanentEditable)}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <MaterialIcons name="public" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  value={isCurrent ? address.state : (sameAsCurrent ? formData.currentAddress.state : address.state)}
                  onChangeText={(text) => handleInputChange('state', text, true, isCurrent ? 'currentAddress' : 'permanentAddress')}
                  editable={isEditing && (isCurrent || isPermanentEditable)}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <MaterialIcons name="flag" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Country"
                  value={address.country}
                  onChangeText={(text) => handleInputChange('country', text, true, isCurrent ? 'currentAddress' : 'permanentAddress')}
                  editable={isEditing && (isCurrent || isPermanentEditable) && false} // Disabled for demo
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {isCurrent && (
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <MaterialIcons name="calendar-today" size={18} color={theme.colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Years lived here"
                    value={address.years}
                    onChangeText={(text) => handleInputChange('years', text, true, 'currentAddress')}
                    keyboardType="numeric"
                    editable={isEditing}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <MaterialIcons name="calendar-month" size={18} color={theme.colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Months"
                    value={address.months}
                    onChangeText={(text) => handleInputChange('months', text, true, 'currentAddress')}
                    keyboardType="numeric"
                    editable={isEditing}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  // Set header right button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        isEditing ? (
          <TouchableOpacity 
            style={styles.saveHeaderButton}
            onPress={isProfileComplete ? handleUpdate : handleSave}
          >
            <Text style={styles.saveHeaderButtonText}>
              {isProfileComplete ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        ) : null
      ),
    });
  }, [navigation, isEditing, isProfileComplete]);

  return (
    <ScreenLayout
      title="Profile"
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={isEditing ? pickImage : null}
            disabled={!isEditing}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            {isEditing && (
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            {isProfileComplete && !isEditing && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isEditing && (
          <View style={styles.photoOptions}>
            <TouchableOpacity 
              style={styles.photoOptionButton}
              onPress={pickImage}
            >
              <Ionicons name="image" size={18} color={theme.colors.primary} />
              <Text style={styles.photoOptionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.photoOptionButton}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={18} color={theme.colors.primary} />
              <Text style={styles.photoOptionText}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
              editable={isEditing}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={isEditing}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="call-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              value={formData.mobile}
              onChangeText={(text) => handleInputChange('mobile', text)}
              keyboardType="phone-pad"
              editable={isEditing}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Date of Birth (DD/MM/YYYY)"
              value={formData.dob}
              onChangeText={(text) => handleInputChange('dob', text)}
              editable={isEditing}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {renderAddressFields('current')}
        {renderAddressFields('permanent')}

        {isEditing && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => {
              setIsEditing(false);
              // Reset form data if needed
            }}
          >
            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  },
  photoOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  photoOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  photoOptionText: {
    marginLeft: 6,
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    paddingLeft: 12,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    color: '#111827',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
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
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
