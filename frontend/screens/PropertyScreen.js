import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';

const PROPERTY_CATEGORIES = [
  { id: 'flat', label: 'Flat / Apartment', icon: 'home-outline' },
  { id: 'house', label: 'Independent House', icon: 'business-outline' },
  { id: 'pg', label: 'PG / Hostel', icon: 'bed-outline' },
  { id: 'commercial', label: 'Commercial', icon: 'briefcase-outline' },
];

const LISTING_TYPES = [
  { id: 'rent', label: 'For Rent' },
  { id: 'sell', label: 'For Sell' },
  { id: 'pg', label: 'For PG' },
];

const BHK_OPTIONS = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK'];

const FURNISHING_OPTIONS = [
  { id: 'semi', label: 'Semi Furnished' },
  { id: 'full', label: 'Fully Furnished' },
  { id: 'unfurnished', label: 'Unfurnished' },
];

const FLOOR_OPTIONS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
];

const AMENITIES = [
  'Fan',
  'Cooler',
  'AC',
  'Refrigerator',
  'Gas',
  'WiFi',
  'Kitchen',
  'Washing Machine',
];

const LIFESTYLE_RULES = [
  { id: 'drinksPolicy', label: 'Drinks' },
  { id: 'smokingPolicy', label: 'Smoking' },
  { id: 'lateNightPolicy', label: 'Late night coming' },
];

const RULE_OPTIONS = [
  { id: 'not_allowed', label: 'Not Allowed' },
  { id: 'allowed', label: 'Allowed' },
  { id: 'conditional', label: 'With Conditions' },
];

const PARKING_TYPES = [
  { id: 'none', label: 'No Parking' },
  { id: 'bike', label: 'Bike Only' },
  { id: 'car', label: 'Car Only' },
  { id: 'both', label: 'Bike & Car' },
];

const TENANT_TYPES = [
  'Married',
  'Unmarried',
  'Working Boys',
  'Student Boys',
  'Working Girls',
  'Student Girls',
  'Small Family',
  'Full Family',
];

function createEmptyRoom() {
  return {
    roomName: '',
    roomSize: '',
    roomCount: '1',
    roomBhk: '1BHK',
    roomFloor: '',
    roomRent: '',
  };
}

function createEmptyProperty() {
  return {
    propertyName: '',
    category: 'flat',
    listingType: 'rent',
    bhk: '1BHK',
    furnishing: 'semi',
    rentRoomScope: '', // one room or all rooms
    floor: '',
    customFloor: '',
    // Section 2
    rentAmount: '',
    advanceAmount: '',
    waterCharges: '',
    electricityPerUnit: '',
    cleaningCharges: '',
    foodCharges: '',
    yearlyMaintenance: '',
    yearlyIncreasePercent: '',
    bookingAdvance: '',
    bookingValidityDays: '',
    amenities: [],
    mode: 'full', // full | room
    rooms: [createEmptyRoom()],
    // Tenant rules & preferences
    drinksPolicy: 'not_allowed',
    smokingPolicy: 'not_allowed',
    lateNightPolicy: 'not_allowed',
    visitorsAllowed: 'no', // yes / no
    visitorsMaxDays: '',
    noticePeriodDays: '',
    parkingType: 'none',
    parkingBikeCount: '',
    parkingCarCount: '',
    preferredTenantTypes: [],
    lateNightMode: 'anytime', // anytime | till_time
    lateNightLastTime: '',
  };
}

function OptionCard({ label, selected, onPress, icon, compact = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.optionCard,
        compact && styles.optionCardCompact,
        selected && styles.optionCardSelected,
      ]}
    >
      <View style={styles.optionLeft}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={selected ? '#fff' : theme.colors.primary}
            style={styles.optionIcon}
          />
        ) : null}
        <Text
          style={[
            styles.optionLabel,
            selected && styles.optionLabelSelected,
          ]}
        >
          {label}
        </Text>
      </View>
      <View
        style={[
          styles.radioOuter,
          selected && styles.radioOuterSelected,
        ]}
      >
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          selected && styles.chipLabelSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PropertyScreen({ navigation }) {
  const [properties, setProperties] = useState([createEmptyProperty()]);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeProperty = properties[activeIndex];

  const updateActiveProperty = (patch) => {
    setProperties((prev) => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], ...patch };
      return next;
    });
  };

  const toggleAmenity = (name) => {
    const current = activeProperty.amenities || [];
    const exists = current.includes(name);
    const next = exists
      ? current.filter((a) => a !== name)
      : [...current, name];
    updateActiveProperty({ amenities: next });
  };

  const updateRoom = (roomIndex, patch) => {
    setProperties((prev) => {
      const next = [...prev];
      const current = next[activeIndex] || {};
      const rooms = current.rooms ? [...current.rooms] : [];
      rooms[roomIndex] = { ...rooms[roomIndex], ...patch };
      next[activeIndex] = { ...current, rooms };
      return next;
    });
  };

  const addRoom = () => {
    setProperties((prev) => {
      const next = [...prev];
      const current = next[activeIndex] || {};
      const rooms = current.rooms ? [...current.rooms] : [];
      rooms.push(createEmptyRoom());
      next[activeIndex] = { ...current, rooms };
      return next;
    });
  };

  const toggleTenantType = (name) => {
    const current = activeProperty.preferredTenantTypes || [];
    const exists = current.includes(name);
    const next = exists
      ? current.filter((t) => t !== name)
      : [...current, name];
    updateActiveProperty({ preferredTenantTypes: next });
  };

  const buildTenantSummary = () => {
    const parts = [];

    if (activeProperty.preferredTenantTypes?.length) {
      parts.push(
        `Preferred: ${activeProperty.preferredTenantTypes.join(', ')}`,
      );
    }

    const behaviourBits = [];
    if (activeProperty.drinksPolicy === 'not_allowed') behaviourBits.push('no drinks');
    if (activeProperty.smokingPolicy === 'not_allowed') behaviourBits.push('no smoking');

    if (activeProperty.lateNightPolicy === 'not_allowed') {
      behaviourBits.push('no late night coming');
    } else if (activeProperty.lateNightPolicy === 'allowed') {
      if (activeProperty.lateNightMode === 'till_time' && activeProperty.lateNightLastTime) {
        behaviourBits.push(`late night allowed till ${activeProperty.lateNightLastTime}`);
      } else {
        behaviourBits.push('late night allowed');
      }
    } else if (activeProperty.lateNightPolicy === 'conditional') {
      behaviourBits.push('late night with conditions');
    }
    if (behaviourBits.length) {
      parts.push(behaviourBits.join(', '));
    }

    if (activeProperty.parkingType && activeProperty.parkingType !== 'none') {
      parts.push('parking available');
    }

    if (!parts.length) return 'Set rules and preferences for ideal tenants.';
    return parts.join(' · ');
  };

  const handleAddMoreProperty = () => {
    setProperties((prev) => [...prev, createEmptyProperty()]);
    setActiveIndex(properties.length); // new last index
  };

  const showAddMore = properties.length >= 1;

  const rooms = activeProperty.rooms || [];

  return (
    <ScreenLayout
      title="Property"
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.tabsRow}>
        {properties.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setActiveIndex(index)}
            style={[
              styles.tab,
              activeIndex === index && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                activeIndex === index && styles.tabLabelActive,
              ]}
            >
              {`Property ${index + 1}`}
            </Text>
          </TouchableOpacity>
        ))}
        {showAddMore && (
          <TouchableOpacity
            onPress={handleAddMoreProperty}
            style={styles.addMoreButton}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addMoreLabel}>Add More</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Basic details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Property Details</Text>

          <Text style={styles.fieldLabel}>Mode</Text>
          <View style={styles.chipRow}>
            <Chip
              label="Full Property"
              selected={activeProperty.mode === 'full'}
              onPress={() => updateActiveProperty({ mode: 'full' })}
            />
            <Chip
              label="Room-wise"
              selected={activeProperty.mode === 'room'}
              onPress={() => updateActiveProperty({ mode: 'room' })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Property Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter property name"
              placeholderTextColor={theme.colors.textSecondary}
              value={activeProperty.propertyName}
              onChangeText={(text) => updateActiveProperty({ propertyName: text })}
            />
          </View>

          <Text style={styles.fieldLabel}>Property Category</Text>
          <View style={styles.optionsGrid}>
            {PROPERTY_CATEGORIES.map((cat) => (
              <OptionCard
                key={cat.id}
                label={cat.label}
                icon={cat.icon}
                selected={activeProperty.category === cat.id}
                onPress={() => updateActiveProperty({ category: cat.id })}
              />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Listing Type</Text>
          <View style={styles.chipRow}>
            {LISTING_TYPES.map((lt) => (
              <Chip
                key={lt.id}
                label={lt.label}
                selected={activeProperty.listingType === lt.id}
                onPress={() => updateActiveProperty({ listingType: lt.id })}
              />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Configuration</Text>
          {activeProperty.mode === 'full' && (
            <View style={styles.chipRow}>
              {BHK_OPTIONS.map((bhk) => (
                <Chip
                  key={bhk}
                  label={bhk}
                  selected={activeProperty.bhk === bhk}
                  onPress={() => updateActiveProperty({ bhk })}
                />
              ))}
            </View>
          )}

          <Text style={styles.fieldLabel}>Furnishing</Text>
          <View style={styles.chipRow}>
            {FURNISHING_OPTIONS.map((f) => (
              <Chip
                key={f.id}
                label={f.label}
                selected={activeProperty.furnishing === f.id}
                onPress={() => updateActiveProperty({ furnishing: f.id })}
              />
            ))}
          </View>

          {activeProperty.mode === 'full' &&
          (activeProperty.listingType === 'rent' || activeProperty.listingType === 'pg') ? (
            <View style={styles.fieldGroupRow}>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.fieldLabel}>For Rent Room</Text>
                <TextInput
                  style={styles.input}
                  placeholder="One room or all rooms"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={activeProperty.rentRoomScope}
                  onChangeText={(text) =>
                    updateActiveProperty({ rentRoomScope: text })
                  }
                />
              </View>
            </View>
          ) : null}

          {activeProperty.mode === 'full' && (
            <>
              <Text style={styles.fieldLabel}>Floor</Text>
              <View style={styles.chipRow}>
                {FLOOR_OPTIONS.map((floor) => (
                  <Chip
                    key={floor}
                    label={floor}
                    selected={activeProperty.floor === floor}
                    onPress={() => updateActiveProperty({ floor, customFloor: '' })}
                  />
                ))}
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Or enter floor manually</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 7th"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={activeProperty.customFloor}
                  onChangeText={(text) =>
                    updateActiveProperty({ customFloor: text, floor: '' })
                  }
                />
              </View>
            </>
          )}

          {activeProperty.mode === 'room' && (
            <View style={styles.roomSection}>
              <Text style={styles.subSectionTitle}>Room-wise Details</Text>
              {rooms.map((room, index) => (
                <View key={index} style={styles.roomCard}>
                  <Text style={styles.roomTitle}>{`Room ${index + 1}`}</Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Room name / label</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Front Room, Balcony Room"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={room.roomName}
                      onChangeText={(text) =>
                        updateRoom(index, { roomName: text })
                      }
                    />
                  </View>

                  <View style={styles.fieldGroupRow}>
                    <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
                      <Text style={styles.fieldLabel}>Size of room</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 10x12 ft"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={room.roomSize}
                        onChangeText={(text) =>
                          updateRoom(index, { roomSize: text })
                        }
                      />
                    </View>
                    <View style={[styles.fieldGroup, styles.flex1]}>
                      <Text style={styles.fieldLabel}>Number of this room</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="1"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={room.roomCount}
                        onChangeText={(text) =>
                          updateRoom(index, { roomCount: text })
                        }
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Configuration (BHK)</Text>
                  <View style={styles.chipRow}>
                    {BHK_OPTIONS.map((bhk) => (
                      <Chip
                        key={bhk}
                        label={bhk}
                        selected={room.roomBhk === bhk}
                        onPress={() => updateRoom(index, { roomBhk: bhk })}
                      />
                    ))}
                  </View>

                  <View style={styles.fieldGroupRow}>
                    <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
                      <Text style={styles.fieldLabel}>Floor</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 1st, 2nd"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={room.roomFloor}
                        onChangeText={(text) =>
                          updateRoom(index, { roomFloor: text })
                        }
                      />
                    </View>
                    <View style={[styles.fieldGroup, styles.flex1]}>
                      <Text style={styles.fieldLabel}>Room rent</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="Rent for this room"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={room.roomRent}
                        onChangeText={(text) =>
                          updateRoom(index, { roomRent: text })
                        }
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addRoomButton}
                onPress={addRoom}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addMoreLabel}>Add More Room</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section 2: Financial details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Rent & Charges</Text>

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
              <Text style={styles.fieldLabel}>Rent Amount</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Monthly rent"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.rentAmount}
                onChangeText={(text) =>
                  updateActiveProperty({ rentAmount: text })
                }
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>Advance Rent</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Advance amount"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.advanceAmount}
                onChangeText={(text) =>
                  updateActiveProperty({ advanceAmount: text })
                }
              />
            </View>
          </View>

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
              <Text style={styles.fieldLabel}>Water Charges</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Water bill (if any)"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.waterCharges}
                onChangeText={(text) =>
                  updateActiveProperty({ waterCharges: text })
                }
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>Electricity / Unit</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Electricity per unit"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.electricityPerUnit}
                onChangeText={(text) =>
                  updateActiveProperty({ electricityPerUnit: text })
                }
              />
            </View>
          </View>

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
              <Text style={styles.fieldLabel}>Cleaning Charges</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Cleaning charges"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.cleaningCharges}
                onChangeText={(text) =>
                  updateActiveProperty({ cleaningCharges: text })
                }
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>Food Charges</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Food charges (if applicable)"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.foodCharges}
                onChangeText={(text) =>
                  updateActiveProperty({ foodCharges: text })
                }
              />
            </View>
          </View>

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
              <Text style={styles.fieldLabel}>Yearly Maintenance</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Maintenance charges"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.yearlyMaintenance}
                onChangeText={(text) =>
                  updateActiveProperty({ yearlyMaintenance: text })
                }
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>% Increase after 1 year</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 5%"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.yearlyIncreasePercent}
                onChangeText={(text) =>
                  updateActiveProperty({ yearlyIncreasePercent: text })
                }
              />
            </View>
          </View>

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
              <Text style={styles.fieldLabel}>Advance Booking Charges</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Booking amount"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.bookingAdvance}
                onChangeText={(text) =>
                  updateActiveProperty({ bookingAdvance: text })
                }
              />
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>Booking Validity (days)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Number of days"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.bookingValidityDays}
                onChangeText={(text) =>
                  updateActiveProperty({ bookingValidityDays: text })
                }
              />
            </View>
          </View>
        </View>

        {/* Section 3: Amenities */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Amenities Provided</Text>
          <View style={styles.chipRowWrap}>
            {AMENITIES.map((a) => (
              <Chip
                key={a}
                label={a}
                selected={activeProperty.amenities?.includes(a)}
                onPress={() => toggleAmenity(a)}
              />
            ))}
          </View>
        </View>

        {/* Section 4: Tenant rules & preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tenant Rules & Preferences</Text>
          <Text style={styles.summaryText}>{buildTenantSummary()}</Text>

          {/* Lifestyle / behaviour */}
          <Text style={styles.subSectionTitle}>Behaviour Preferences</Text>
          {LIFESTYLE_RULES.map((rule) => (
            <View key={rule.id} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{rule.label}</Text>
              <View style={styles.chipRow}>
                {RULE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.id}
                    label={opt.label}
                    selected={activeProperty[rule.id] === opt.id}
                    onPress={() => updateActiveProperty({ [rule.id]: opt.id })}
                  />
                ))}
              </View>

              {rule.id === 'lateNightPolicy' &&
                activeProperty.lateNightPolicy === 'allowed' && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Late night details</Text>
                    <View style={styles.chipRow}>
                      <Chip
                        label="Any time"
                        selected={activeProperty.lateNightMode === 'anytime'}
                        onPress={() =>
                          updateActiveProperty({ lateNightMode: 'anytime', lateNightLastTime: '' })
                        }
                      />
                      <Chip
                        label="Till specific time"
                        selected={activeProperty.lateNightMode === 'till_time'}
                        onPress={() =>
                          updateActiveProperty({ lateNightMode: 'till_time' })
                        }
                      />
                    </View>

                    {activeProperty.lateNightMode === 'till_time' && (
                      <TextInput
                        style={styles.input}
                        placeholder="Last time to come home (e.g. 11:30 PM)"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={activeProperty.lateNightLastTime}
                        onChangeText={(text) =>
                          updateActiveProperty({ lateNightLastTime: text })
                        }
                      />
                    )}
                  </View>
                )}
            </View>
          ))}

          {/* Visitors & notice period */}
          <Text style={styles.subSectionTitle}>Visitors & Stay Rules</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Relatives or Friends Allowed</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Allowed"
                selected={activeProperty.visitorsAllowed === 'yes'}
                onPress={() => updateActiveProperty({ visitorsAllowed: 'yes' })}
              />
              <Chip
                label="Not Allowed"
                selected={activeProperty.visitorsAllowed === 'no'}
                onPress={() => updateActiveProperty({ visitorsAllowed: 'no' })}
              />
            </View>
          </View>

          {activeProperty.visitorsAllowed === 'yes' && (
            <View style={styles.fieldGroupRow}>
              <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
                <Text style={styles.fieldLabel}>Max visitor days (per month)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="e.g. 5"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={activeProperty.visitorsMaxDays}
                  onChangeText={(text) =>
                    updateActiveProperty({ visitorsMaxDays: text })
                  }
                />
              </View>
            </View>
          )}

          <View style={styles.fieldGroupRow}>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text style={styles.fieldLabel}>Notice time to leave home (days)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Notice period in days"
                placeholderTextColor={theme.colors.textSecondary}
                value={activeProperty.noticePeriodDays}
                onChangeText={(text) =>
                  updateActiveProperty({ noticePeriodDays: text })
                }
              />
            </View>
          </View>

          {/* Parking rules */}
          <Text style={styles.subSectionTitle}>Parking Rules</Text>
          <View style={styles.chipRow}>
            {PARKING_TYPES.map((p) => (
              <Chip
                key={p.id}
                label={p.label}
                selected={activeProperty.parkingType === p.id}
                onPress={() => updateActiveProperty({ parkingType: p.id })}
              />
            ))}
          </View>

          {activeProperty.parkingType !== 'none' && (
            <View style={styles.fieldGroupRow}>
              <View style={[styles.fieldGroup, styles.flex1, styles.mr8]}>
                <Text style={styles.fieldLabel}>No. of bikes</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={activeProperty.parkingBikeCount}
                  onChangeText={(text) =>
                    updateActiveProperty({ parkingBikeCount: text })
                  }
                />
              </View>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.fieldLabel}>No. of cars</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={activeProperty.parkingCarCount}
                  onChangeText={(text) =>
                    updateActiveProperty({ parkingCarCount: text })
                  }
                />
              </View>
            </View>
          )}

          {/* Preferred tenant type */}
          <Text style={styles.subSectionTitle}>Preferred Tenant Type</Text>
          <View style={styles.chipRowWrap}>
            {TENANT_TYPES.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={activeProperty.preferredTenantTypes?.includes(t)}
                onPress={() => toggleTenantType(t)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    backgroundColor: '#ffffff',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  tabLabelActive: {
    color: '#ffffff',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    marginLeft: 'auto',
  },
  addMoreLabel: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.spacing.sm,
  },
  fieldGroup: {
    marginBottom: theme.spacing.sm,
  },
  fieldGroupRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
    color: theme.colors.text,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
    marginVertical: 4,
    flexBasis: '48%',
  },
  optionCardCompact: {
    flexBasis: 'auto',
  },
  optionCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  optionIcon: {
    marginRight: 6,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
    flexShrink: 1,
  },
  optionLabelSelected: {
    color: '#ffffff',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#ffffff',
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipLabel: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: '#ffffff',
  },
  flex1: {
    flex: 1,
  },
  mr8: {
    marginRight: 8,
  },
});
