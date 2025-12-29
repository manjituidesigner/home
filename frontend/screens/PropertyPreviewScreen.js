import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../apiBaseUrl";

const AUTH_TOKEN_STORAGE_KEY = "AUTH_TOKEN";

export default function PropertyPreviewScreen({ route, navigation }) {
  const property = route?.params?.property || {};

  const [publishing, setPublishing] = useState(false);
  const [publishSuccessVisible, setPublishSuccessVisible] = useState(false);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const publishProperty = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const authHeaders = await getAuthHeaders();
      const createDraftResp = await fetch(`${API_BASE_URL}/property-drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(property),
      });
      if (!createDraftResp.ok) {
        let msg = "Failed to save draft";
        try {
          const body = await createDraftResp.json();
          if (body?.message) msg = body.message;
          if (body?.error) msg = `${msg}: ${body.error}`;
        } catch (e) {}
        throw new Error(msg);
      }
      const draft = await createDraftResp.json().catch(() => ({}));
      const draftId = draft?._id;
      if (!draftId) throw new Error("Draft not created");

      const publishResp = await fetch(`${API_BASE_URL}/property-drafts/${draftId}/publish`, {
        method: "POST",
        headers: { ...authHeaders },
      });
      if (!publishResp.ok) {
        let msg = "Failed to publish property";
        try {
          const body = await publishResp.json();
          if (body?.message) msg = body.message;
          if (body?.error) msg = `${msg}: ${body.error}`;
        } catch (e) {}
        throw new Error(msg);
      }

      setPublishSuccessVisible(true);
    } catch (e) {
      Alert.alert("Publish", e?.message || "Unable to publish property. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const resolveImageUri = (raw) => {
    if (!raw) return null;
    if (typeof raw === "string") {
      const s = raw.trim();
      if (!s) return null;
      return s;
    }
    if (typeof raw === "object") {
      if (typeof raw.uri === "string") return resolveImageUri(raw.uri);
      if (typeof raw.url === "string") return resolveImageUri(raw.url);
      if (typeof raw.path === "string") return resolveImageUri(raw.path);
    }
    return null;
  };

  const images = useMemo(() => {
    const photos = Array.isArray(property.photos) ? property.photos : [];
    const uris = photos.map(resolveImageUri).filter(Boolean);
    if (uris.length) return uris;
    return [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
    ];
  }, [property.photos]);

  const amenityIcon = (label) => {
    const s = String(label || "").trim().toLowerCase();
    if (s.includes("wifi")) return "wifi";
    if (s.includes("parking")) return "directions-car";
    if (s.includes("gym")) return "fitness-center";
    if (s.includes("pool")) return "pool";
    if (s === "ac" || s.includes("ac")) return "ac-unit";
    if (s.includes("cctv")) return "videocam";
    if (s.includes("fan")) return "mode-fan";
    if (s.includes("kitchen")) return "countertops";
    if (s.includes("laundry") || s.includes("washing")) return "local-laundry-service";
    if (s.includes("gas")) return "gas-meter";
    return "check";
  };

  const amenities = useMemo(() => {
    const list = Array.isArray(property.amenities) ? property.amenities : [];
    return list.slice(0, 12).map((label) => ({ icon: amenityIcon(label), label }));
  }, [property.amenities]);

  const currency = (v) => {
    const s = String(v ?? "").trim();
    if (!s) return "";
    return s.startsWith("₹") ? s : `₹${s}`;
  };

  const rent = currency(property.rentAmount) || "₹0";
  const deposit = currency(property.advanceAmount) || "₹0";
  const maintenanceMonthly = (() => {
    const n = Number(property.yearlyMaintenance || 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    return `₹${Math.round(n / 12)} / month`;
  })();

  const title = property.propertyName || "Review Property";
  const category = property.category || "Property";

  const furnishing = property.furnishing || "";
  const bathrooms = property.bathrooms ? `${property.bathrooms} Baths` : "";
  const bhk = property.bhk ? `${property.bhk} BHK` : "";
  const size = property.builtUpAreaSqft || property.carpetAreaSqft ? `${property.builtUpAreaSqft || property.carpetAreaSqft} sq.ft` : "";

  const address = property.address || property.floor || property.customFloor || property.mapLocation || "";

  const preferred = Array.isArray(property.preferredTenantTypes) && property.preferredTenantTypes.length
    ? property.preferredTenantTypes.slice(0, 3).join(" / ")
    : "";

  const smoking = property.smokingPolicy === "allowed" ? "Allowed" : "Not Allowed";
  const petsAllowed = property.petsAllowed ? "Yes" : "No";

  const agreementDuration = String(property.agreementDurationMonths || "").trim();

  return (
    <LinearGradient
      colors={["#DCEBFF", "#E6DBFF", "#D8E6FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrapper}
    >
      <Modal
        transparent
        visible={publishSuccessVisible}
        animationType="fade"
        onRequestClose={() => setPublishSuccessVisible(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Your property Successfully Posted</Text>
            <Text style={styles.successSub}>Your listing is now saved and visible in My Property.</Text>
            <TouchableOpacity
              style={styles.successBtn}
              activeOpacity={0.9}
              onPress={() => {
                setPublishSuccessVisible(false);
                if (navigation?.reset) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Main", params: { screen: "Property" } }],
                  });
                  return;
                }
                navigation?.navigate?.("Main", { screen: "Property" });
              }}
            >
              <Text style={styles.successBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <MaterialIcons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Property</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Images & Media</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation?.goBack?.()}>
              <Text style={styles.editText}>Edit</Text>
              <MaterialIcons name="edit" size={14} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((img, index) => (
              <Image key={index} source={{ uri: img }} style={styles.image} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation?.goBack?.()}>
              <Text style={styles.editText}>Edit</Text>
              <MaterialIcons name="edit" size={14} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <Text style={styles.badge}>{String(category || "Property")}</Text>
          <Text style={styles.propertyTitle}>{title}</Text>

          <View style={styles.grid}>
            <InfoBox label="Bedrooms" value={bhk || "-"} />
            <InfoBox label="Bathrooms" value={bathrooms || "-"} />
            <InfoBox label="Size" value={size || "-"} />
            <InfoBox label="Furnishing" value={furnishing || "-"} />
          </View>

          <Text style={styles.subLabel}>Description</Text>
          <Text style={styles.description}>
            {property.description || "No description provided."}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rent & Charges</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation?.goBack?.()}>
              <Text style={styles.editText}>Edit</Text>
              <MaterialIcons name="edit" size={14} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <View style={styles.priceBox}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Monthly Rent</Text>
              <Text style={styles.price}>{rent}</Text>
            </View>
            <Row label="Security Deposit" value={deposit} />
            {maintenanceMonthly ? <Row label="Maintenance" value={maintenanceMonthly} /> : null}
            <Row
              label="Negotiable"
              value={property.rentNegotiable ? "Yes" : "No"}
              valueStyle={{ color: property.rentNegotiable ? "#16a34a" : "#dc2626" }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation?.goBack?.()}>
              <Text style={styles.editText}>Edit</Text>
              <MaterialIcons name="edit" size={14} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={20} color="#6b7280" />
            <View>
              <Text style={styles.locationText}>{address || "-"}</Text>
              <Text style={styles.locationSub}>India</Text>
            </View>
          </View>

          <View style={styles.mapPlaceholder}>
            <MaterialIcons name="home" size={24} color="#fff" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation?.goBack?.()}>
              <Text style={styles.editText}>Edit</Text>
              <MaterialIcons name="edit" size={14} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <View style={styles.amenitiesWrap}>
            {amenities.length ? (
              amenities.map((item, index) => (
                <View key={index} style={styles.amenity}>
                  <MaterialIcons name={item.icon} size={18} color="#6b7280" />
                  <Text style={styles.amenityText}>{item.label}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.locationSub}>No amenities added</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Availability & Rules</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation?.goBack?.()}>
              <Text style={styles.editText}>Edit</Text>
              <MaterialIcons name="edit" size={14} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <Row label="Available From" value={property.availableFrom || "-"} />
          <Row label="Lease Duration" value={agreementDuration ? `${agreementDuration} Months` : "-"} />
          <Row label="Preferred Tenant" value={preferred || "-"} />
          <Row label="Pets Allowed" value={petsAllowed} />
          <Row
            label="Smoking"
            value={smoking}
            valueStyle={{ color: smoking === "Allowed" ? "#16a34a" : "#dc2626" }}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visit & Contact</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation?.goBack?.()}>
              <Text style={styles.editText}>Edit</Text>
              <MaterialIcons name="edit" size={14} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <View style={styles.contactBox}>
            <MaterialIcons name="person" size={22} color="#2563eb" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.contactTitle}>Contact Details</Text>
              <Text style={styles.contactSub}>Visible to verified tenants only</Text>

              <View style={styles.contactActions}>
                <Tag icon="call" label="Phone" />
                <Tag icon="chat" label="Chat" />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.publishBtn}
          onPress={publishProperty}
          disabled={publishing}
        >
          <MaterialIcons name="publish" size={18} color="#fff" />
          <Text style={styles.publishText}>{publishing ? "Publishing..." : "Publish Property"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Text style={styles.draftText}>Save as Draft</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const InfoBox = ({ label, value }) => (
  <View style={styles.infoBox}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const Row = ({ label, value, valueStyle }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
  </View>
);

const Tag = ({ icon, label }) => (
  <View style={styles.tag}>
    <MaterialIcons name={icon} size={14} />
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "transparent",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.10)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: "#111418",
  },

  section: {
    backgroundColor: "transparent",
    marginBottom: 8,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111418",
  },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  editText: { fontSize: 13, color: "#2563eb", fontWeight: "600" },

  image: {
    width: 260,
    height: 160,
    borderRadius: 16,
    marginRight: 12,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    color: "#2563eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: "800",
  },
  propertyTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "900",
    color: "#111418",
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  infoBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.12)",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  infoLabel: { fontSize: 11, fontWeight: "800", color: "#6b7280" },
  infoValue: { marginTop: 6, fontSize: 13, fontWeight: "900", color: "#111418" },

  subLabel: { marginTop: 16, fontSize: 12, fontWeight: "800", color: "#111418" },
  description: { marginTop: 8, fontSize: 13, lineHeight: 18, fontWeight: "600", color: "#374151" },

  priceBox: {
    borderWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.12)",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  priceLabel: { fontSize: 12, fontWeight: "800", color: "#6b7280" },
  price: { fontSize: 18, fontWeight: "900", color: "#111418" },

  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  rowLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  rowValue: { fontSize: 12, fontWeight: "800", color: "#111418" },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  locationText: { fontSize: 13, fontWeight: "800", color: "#111418" },
  locationSub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#6b7280" },
  mapPlaceholder: {
    marginTop: 12,
    height: 120,
    borderRadius: 14,
    backgroundColor: "rgba(17, 24, 39, 0.30)",
    alignItems: "center",
    justifyContent: "center",
  },

  amenitiesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amenity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.12)",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  amenityText: { fontSize: 12, fontWeight: "800", color: "#111418" },

  contactBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.28)",
    backgroundColor: "rgba(37, 99, 235, 0.10)",
    borderRadius: 16,
    padding: 14,
  },
  contactTitle: { fontSize: 14, fontWeight: "900", color: "#111418" },
  contactSub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#6b7280" },
  contactActions: { marginTop: 10, flexDirection: "row", gap: 10 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.12)",
  },
  tagText: { fontSize: 12, fontWeight: "800", color: "#111418" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderTopWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.10)",
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2563eb",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
  },
  publishText: { color: "#fff", fontWeight: "900" },
  draftText: { textAlign: "center", marginTop: 14, fontWeight: "700", color: "#374151" },

  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  successCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
  },
  successTitle: { fontSize: 16, fontWeight: "900", color: "#111418" },
  successSub: { marginTop: 6, fontSize: 13, fontWeight: "600", color: "#6b7280" },
  successBtn: {
    marginTop: 14,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  successBtnText: { color: "#fff", fontWeight: "900" },
});
