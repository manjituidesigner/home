import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../theme';

const { width, height } = Dimensions.get('window');

export default function PropertyDetailsScreen({ route, navigation }) {
  const property = route?.params?.property || {};
  const [isAvailable, setIsAvailable] = useState(
    property.status !== 'occupied',
  );
  const [openAmenities, setOpenAmenities] = useState(false);
  const [openRules, setOpenRules] = useState(false);

  const coverPhoto =
    Array.isArray(property.photos) && property.photos.length
      ? property.photos[0]
      : null;

  const title = property.propertyName || 'Selected Property';
  const address = property.floor || property.customFloor || '';
  const typeLabel = property.bhk
    ? `${property.bhk} ${
        property.category === 'house'
          ? 'House'
          : property.category === 'flat'
          ? 'Flat'
          : property.category === 'pg'
          ? 'PG / Hostel'
          : 'Property'
      }`
    : 'Property type not set';

  const rentAmount = property.rentAmount
    ? `₹${property.rentAmount}/month`
    : 'Not set';
  const advanceAmount = property.advanceAmount
    ? `₹${property.advanceAmount}`
    : 'Not set';
  const utilitiesAmount = property.waterCharges || property.electricityPerUnit
    ? `${property.waterCharges || 0} / ${property.electricityPerUnit || 0}`
    : 'Not set';

  const amenitiesText =
    Array.isArray(property.amenities) && property.amenities.length
      ? property.amenities.join(', ')
      : 'No amenities added';

  const rulesSummary = [];
  if (property.drinksPolicy === 'not_allowed') rulesSummary.push('No drinks');
  if (property.smokingPolicy === 'not_allowed') rulesSummary.push('No smoking');
  if (property.lateNightPolicy === 'not_allowed')
    rulesSummary.push('No late night coming');
  const rulesText = rulesSummary.length
    ? rulesSummary.join(', ')
    : 'Rules not specified';

  const statusLabel = property.status === 'occupied' ? 'Occupied' : 'Open';
  const statusBoxColor =
    property.status === 'occupied' ? '#ffe5e5' : '#dff6e6';
  const statusTextColor =
    property.status === 'occupied' ? '#c53030' : '#1b8a66';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#2b2b2b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Selected Property</Text>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Property')}
            >
              <Ionicons name="pencil" size={18} color="#2b2b2b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={22} color="#2b2b2b" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Large image */}
          <View style={styles.imageCard}>
            {coverPhoto ? (
              <Image
                source={{ uri: coverPhoto }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={40}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.imagePlaceholderText}>No image</Text>
              </View>
            )}
          </View>

          {/* Title row + status */}
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.titleText}>{title}</Text>
              {!!address && (
                <Text style={styles.subtitleText}>{address}</Text>
              )}
              <Text style={styles.subtitleText}>{typeLabel}</Text>
            </View>
            <View
              style={[
                styles.statusBox,
                { backgroundColor: statusBoxColor },
              ]}
            >
              <Text style={[styles.statusText, { color: statusTextColor }]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* Card: Availability and Rent */}
          <View style={styles.infoCard}>
            {/* Availability */}
            <View style={styles.infoRow}>
              <View style={styles.roundIconRed}>
                <MaterialCommunityIcons
                  name="home-city"
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>
                  {isAvailable ? 'Open' : 'Closed'}
                </Text>
                <Text style={styles.infoSub}>
                  {isAvailable
                    ? 'Property is visible for tenants'
                    : 'Temporarily unavailable'}
                </Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ true: '#A7E3C4', false: '#e6e6e6' }}
                thumbColor={isAvailable ? '#12a454' : '#ffffff'}
              />
            </View>

            <View style={styles.divider} />

            {/* Rent & charges card header */}
            <View style={styles.infoRow}>
              <View style={styles.roundIconBlue}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Rent & Charges</Text>
                <Text style={styles.infoSub}>Monthly Rent: {rentAmount}</Text>
              </View>
            </View>
          </View>

          {/* Charges small rows */}
          <View style={styles.smallCard}>
            <RowLabel label="Monthly Rent" value={rentAmount} />
            <RowLabel label="Security Deposit" value={advanceAmount} />
            <RowLabel label="Water / Electricity" value={utilitiesAmount} />
          </View>

          {/* Accordion: Amenities */}
          <TouchableOpacity
            style={styles.accordion}
            onPress={() => setOpenAmenities(!openAmenities)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.ovalIcon}>
                <MaterialCommunityIcons
                  name="basket"
                  size={18}
                  color="#fff"
                />
              </View>
              <Text style={styles.accordionTitle}>Amenities</Text>
            </View>
            <Ionicons
              name={openAmenities ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6b7a90"
            />
          </TouchableOpacity>
          {openAmenities && (
            <View style={styles.accordionContent}>
              <Text style={styles.contentText}>{amenitiesText}</Text>
            </View>
          )}

          {/* Accordion: Tenant & Rules */}
          <TouchableOpacity
            style={styles.accordion}
            onPress={() => setOpenRules(!openRules)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.ovalIconGray}>
                <MaterialCommunityIcons
                  name="account"
                  size={18}
                  color="#fff"
                />
              </View>
              <Text style={styles.accordionTitle}>Tenant & Rules</Text>
            </View>
            <Ionicons
              name={openRules ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#6b7a90"
            />
          </TouchableOpacity>
          {openRules && (
            <View style={styles.accordionContent}>
              <Text style={styles.contentText}>{rulesText}</Text>
            </View>
          )}

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Bottom fixed button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Manage Property</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function RowLabel({ label, value }) {
  return (
    <View style={styles.rowLabel}>
      <Text style={styles.rowLabelLeft}>{label}</Text>
      <Text style={styles.rowLabelRight}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f2f5f9',
  },
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e6eaf2',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b263b',
  },
  iconBtn: {
    padding: 8,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 0,
  },
  imageCard: {
    width: '100%',
    height: Math.round(height * 0.32),
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#dfe9f3',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: theme.colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b2545',
  },
  subtitleText: {
    fontSize: 13,
    color: '#6b7a90',
    marginTop: 4,
  },
  statusBox: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  roundIconRed: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roundIconBlue: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#5b9dff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f3f8',
    marginVertical: 8,
  },
  smallCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: '#f0f3f8',
    borderBottomWidth: 1,
  },
  rowLabelLeft: {
    color: '#6b7a90',
    fontSize: 14,
  },
  rowLabelRight: {
    color: '#0b2545',
    fontWeight: '700',
    fontSize: 14,
  },
  accordion: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  ovalIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#7b61ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ovalIconGray: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#9aa4b2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0b2545',
  },
  accordionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  contentText: {
    fontSize: 14,
    color: '#475569',
    marginVertical: 2,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: 'center',
  },
  primaryBtn: {
    width: width - 32,
    backgroundColor: '#0b76ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
