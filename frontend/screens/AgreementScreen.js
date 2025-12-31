import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../apiBaseUrl';

const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';

function moneyLabel(v, fallback = '-') {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDateTime(raw) {
  if (!raw) return '-';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  } catch (e) {
    return '-';
  }
}

function resolveImageUri(apiBaseUrl, raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return null;
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    const path = s.startsWith('/') ? s : `/${s}`;
    return `${apiBaseUrl}${path}`;
  }
  if (typeof raw === 'object') {
    if (typeof raw.uri === 'string') return resolveImageUri(apiBaseUrl, raw.uri);
    if (typeof raw.url === 'string') return resolveImageUri(apiBaseUrl, raw.url);
    if (typeof raw.path === 'string') return resolveImageUri(apiBaseUrl, raw.path);
  }
  return null;
}

export default function AgreementScreen({ navigation, route }) {
  const params = route?.params || {};
  const offer = params?.offer || {};
  const property = params?.property || offer?.propertyId || {};
  const tenant = params?.tenant || offer?.tenantId || {};
  const bookingTx = params?.bookingTx || null;

  const propertyPhotos = Array.isArray(property?.photos) ? property.photos : [];
  const propertyImage = useMemo(() => resolveImageUri(API_BASE_URL, propertyPhotos[0]), [propertyPhotos]);

  const propertyName = String(property?.propertyName || '').trim();
  const propertyAddress = String(property?.address || '').trim();
  const propertyCity = String(property?.city || '').trim();

  const ownerName = useMemo(() => {
    const o = offer?.ownerId || {};
    return `${String(o?.firstName || '').trim()} ${String(o?.lastName || '').trim()}`.trim();
  }, [offer]);

  const ownerPhone = String(offer?.ownerId?.phone || '').trim();
  const ownerEmail = String(offer?.ownerId?.email || '').trim();

  const tenantName = useMemo(() => {
    return `${String(tenant?.firstName || '').trim()} ${String(tenant?.lastName || '').trim()}`.trim();
  }, [tenant]);
  const tenantPhone = String(tenant?.phone || '').trim();
  const tenantEmail = String(tenant?.email || '').trim();

  const monthlyRent = Number(offer?.offerRent || property?.rentAmount || 0) || 0;
  const bookingAmount = Number(bookingTx?.amount || offer?.requestedAdvanceAmount || 0) || 0;
  const bookingVerifiedAt = bookingTx?.ownerVerifiedAt || offer?.bookingVerifiedAt || null;

  const [joiningDate, setJoiningDate] = useState('');
  const [advanceRentDate, setAdvanceRentDate] = useState('');
  const [monthlyPayableDay, setMonthlyPayableDay] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [plannedStayMonths, setPlannedStayMonths] = useState('');

  const [advanceRentAmount, setAdvanceRentAmount] = useState('');
  const [waterBill, setWaterBill] = useState('');
  const [electricityPerUnit, setElectricityPerUnit] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  const [saving, setSaving] = useState(false);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const toIsoFromDateInput = (value) => {
    const v = String(value || '').trim();
    if (!v) return null;
    const d = new Date(`${v}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };

  const parsePositiveIntOrNull = (v) => {
    const s = String(v ?? '').trim();
    if (!s) return null;
    const n = Number(s.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n);
  };

  const parseMoneyOrNull = (v) => {
    const s = String(v ?? '').trim();
    if (!s) return null;
    const n = Number(s.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  };

  const onSubmit = async () => {
    if (saving) return;
    const offerId = offer?._id || offer?.id;
    if (!offerId) {
      Alert.alert('Agreement', 'Offer not found. Please go back and open again.');
      return;
    }

    const joiningIso = toIsoFromDateInput(joiningDate);
    if (joiningDate && !joiningIso) {
      Alert.alert('Agreement', 'Please enter valid joining date (YYYY-MM-DD).');
      return;
    }

    const advanceRentIso = toIsoFromDateInput(advanceRentDate);
    if (advanceRentDate && !advanceRentIso) {
      Alert.alert('Agreement', 'Please enter valid advance rent date (YYYY-MM-DD).');
      return;
    }

    const payableDay = monthlyPayableDay ? parsePositiveIntOrNull(monthlyPayableDay) : null;
    if (monthlyPayableDay && payableDay == null) {
      Alert.alert('Agreement', 'Monthly rent payable date must be a valid day number.');
      return;
    }
    if (payableDay != null && (payableDay < 1 || payableDay > 31)) {
      Alert.alert('Agreement', 'Monthly rent payable date must be between 1 and 31.');
      return;
    }

    const plannedMonths = plannedStayMonths ? parsePositiveIntOrNull(plannedStayMonths) : null;
    if (plannedStayMonths && plannedMonths == null) {
      Alert.alert('Agreement', 'Planned stay months must be a valid number.');
      return;
    }

    const elec = electricityPerUnit ? parseMoneyOrNull(electricityPerUnit) : null;
    if (electricityPerUnit && elec == null) {
      Alert.alert('Agreement', 'Electricity per unit must be a valid number.');
      return;
    }

    const advRent = advanceRentAmount ? parseMoneyOrNull(advanceRentAmount) : null;
    if (advanceRentAmount && advRent == null) {
      Alert.alert('Agreement', 'Advance rent amount must be a valid number.');
      return;
    }

    try {
      setSaving(true);
      const authHeaders = await getAuthHeaders();
      if (!authHeaders?.Authorization) {
        Alert.alert('Agreement', 'Please login again.');
        return;
      }

      const payload = {
        offerId,
        paymentTransactionId: bookingTx?._id,
        propertySnapshot: {
          propertyName,
          address: propertyAddress,
          city: propertyCity,
          imageUrl: propertyImage || undefined,
        },
        ownerSnapshot: {
          name: ownerName,
          phone: ownerPhone,
          email: ownerEmail,
        },
        tenantSnapshot: {
          name: tenantName,
          phone: tenantPhone,
          email: tenantEmail,
          address: String(tenant?.currentAddress?.address || '').trim(),
        },
        booking: {
          amount: bookingAmount,
          paidAt: bookingTx?.paidAt,
          verifiedAt: bookingVerifiedAt,
          transactionId: bookingTx?.transactionId,
        },
        rent: {
          monthlyRent,
          advanceRent: advRent == null ? undefined : advRent,
          joiningDate: joiningIso == null ? undefined : joiningIso,
          advanceRentDate: advanceRentIso == null ? undefined : advanceRentIso,
          monthlyPayableDay: payableDay == null ? undefined : payableDay,
          plannedStayMonths: plannedMonths == null ? undefined : plannedMonths,
        },
        charges: {
          waterBill: waterBill ? String(waterBill).trim() : undefined,
          electricityPerUnit: elec == null ? undefined : elec,
          extraNotes: extraNotes ? String(extraNotes).trim() : undefined,
        },
        tenantDetails: {
          familyMembers: familyMembers ? String(familyMembers).trim() : undefined,
          vehicleDetails: vehicleDetails ? String(vehicleDetails).trim() : undefined,
        },
      };

      const resp = await fetch(`${API_BASE_URL}/agreements/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        let msg = 'Failed to send agreement.';
        try {
          const data = await resp.json();
          msg = String(data?.message || data?.error || msg);
        } catch (e) {}
        Alert.alert('Agreement', msg);
        return;
      }

      Alert.alert('Agreement', 'Agreement sent to tenant.');
      if (navigation?.goBack) navigation.goBack();
    } catch (e) {
      Alert.alert('Agreement', 'Network error while sending agreement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout
      title="Agreement"
      onPressMenu={() => {
        if (navigation?.toggleDrawer) {
          navigation.toggleDrawer();
          return;
        }
        if (navigation?.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerImgWrap}>
              {propertyImage ? (
                <Image source={{ uri: propertyImage }} style={styles.headerImg} />
              ) : (
                <View style={styles.headerImgFallback} />
              )}
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {propertyName || 'Property'}
              </Text>
              <Text style={styles.headerSub} numberOfLines={2}>
                {propertyAddress || propertyCity || '-'}
              </Text>
              <Text style={styles.headerSub}>Owner: {ownerName || '-'}</Text>
            </View>
          </View>

          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Booking Amount</Text>
            <Text style={styles.kvValue}>{moneyLabel(bookingAmount, '-')}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Booking Verified</Text>
            <Text style={styles.kvValue}>{formatDateTime(bookingVerifiedAt)}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Monthly Rent</Text>
            <Text style={styles.kvValue}>{monthlyRent ? `${moneyLabel(monthlyRent, '-')}/mo` : '-'}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Owner Details</Text>
          <Text style={styles.infoLine}>Name: {ownerName || '-'}</Text>
          <Text style={styles.infoLine}>Phone: {ownerPhone || '-'}</Text>
          <Text style={styles.infoLine}>Email: {ownerEmail || '-'}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tenant Details (Auto)</Text>
          <Text style={styles.infoLine}>Name: {tenantName || '-'}</Text>
          <Text style={styles.infoLine}>Phone: {tenantPhone || '-'}</Text>
          <Text style={styles.infoLine}>Email: {tenantEmail || '-'}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tenant Fields (Fill Later)</Text>

          <Text style={styles.inputLabel}>Joining Date</Text>
          <TextInput
            value={joiningDate}
            onChangeText={setJoiningDate}
            placeholder="YYYY-MM-DD"
            style={styles.input}
            {...(Platform.OS === 'web' ? { type: 'date' } : {})}
          />

          <Text style={styles.inputLabel}>Advance Rent Date</Text>
          <TextInput
            value={advanceRentDate}
            onChangeText={setAdvanceRentDate}
            placeholder="YYYY-MM-DD"
            style={styles.input}
            {...(Platform.OS === 'web' ? { type: 'date' } : {})}
          />

          <Text style={styles.inputLabel}>Every Month Rent Payable Date (1-31)</Text>
          <TextInput
            value={monthlyPayableDay}
            onChangeText={setMonthlyPayableDay}
            placeholder="e.g. 5"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Family Members</Text>
          <TextInput
            value={familyMembers}
            onChangeText={setFamilyMembers}
            placeholder="e.g. 3"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Vehicle Details</Text>
          <TextInput
            value={vehicleDetails}
            onChangeText={setVehicleDetails}
            placeholder="e.g. Bike - 1, Car - 0"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Plan How Many Months to Stay</Text>
          <TextInput
            value={plannedStayMonths}
            onChangeText={setPlannedStayMonths}
            placeholder="e.g. 11"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Charges (Owner)</Text>

          <Text style={styles.inputLabel}>Advance Rent Amount</Text>
          <TextInput
            value={advanceRentAmount}
            onChangeText={setAdvanceRentAmount}
            placeholder="e.g. 10000"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Water Bill</Text>
          <TextInput
            value={waterBill}
            onChangeText={setWaterBill}
            placeholder="e.g. Included / 500 per month"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Electricity Per Unit Price</Text>
          <TextInput
            value={electricityPerUnit}
            onChangeText={setElectricityPerUnit}
            placeholder="e.g. 9"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Extra Notes</Text>
          <TextInput
            value={extraNotes}
            onChangeText={setExtraNotes}
            placeholder="Any additional terms"
            style={[styles.input, styles.textArea]}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, saving ? styles.btnDisabled : null]}
          onPress={onSubmit}
          activeOpacity={0.9}
          disabled={saving}
        >
          <Text style={styles.submitBtnText}>{saving ? 'Sending...' : 'Send'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  headerImgWrap: {
    width: 86,
    height: 86,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  headerImg: {
    width: '100%',
    height: '100%',
  },
  headerImgFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  headerMeta: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text,
  },
  headerSub: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  kvLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  kvValue: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 8,
  },
  infoLine: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  inputLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.text,
  },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#ffffff',
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
