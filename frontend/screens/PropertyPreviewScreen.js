import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function PropertyPreviewScreen({ route, navigation }) {
  const property = route?.params?.property || {};

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
    <View style={styles.wrapper}>
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
          onPress={() => Alert.alert("Publish", "Go back and tap Publish Property to submit.")}
        >
          <MaterialIcons name="publish" size={18} color="#fff" />
          <Text style={styles.publishText}>Publish Property</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Text style={styles.draftText}>Save as Draft</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    backgroundColor: "#f6f7f8",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
  },

  section: {
    backgroundColor: "#fff",
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
    backgroundColor: "#2563eb20",
    color: "#2563eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#111827",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoBox: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  infoLabel: { fontSize: 11, color: "#6b7280" },
  infoValue: { fontSize: 13, fontWeight: "700", color: "#111827" },

  subLabel: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  description: { fontSize: 13, marginTop: 4, lineHeight: 18, color: "#111827" },

  priceBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 14,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  priceLabel: { fontSize: 13, color: "#6b7280" },
  price: { fontSize: 18, fontWeight: "800", color: "#2563eb" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rowLabel: { fontSize: 13, color: "#6b7280" },
  rowValue: { fontSize: 13, fontWeight: "600", color: "#111827" },

  locationRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  locationText: { fontSize: 13, fontWeight: "600", color: "#111827" },
  locationSub: { fontSize: 12, color: "#6b7280" },

  mapPlaceholder: {
    height: 140,
    backgroundColor: "#9ca3af",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  amenitiesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  amenityText: { fontSize: 12, color: "#111827" },

  contactBox: {
    flexDirection: "row",
    padding: 14,
    backgroundColor: "#2563eb10",
    borderRadius: 14,
  },
  contactTitle: { fontWeight: "700", color: "#111827" },
  contactSub: { fontSize: 11, color: "#6b7280", marginTop: 2 },

  contactActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  tagText: { fontSize: 11, color: "#111827" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    gap: 10,
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2563eb",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
  },
  publishText: {
    color: "#fff",
    fontWeight: "800",
  },
  draftText: {
    fontSize: 13,
    color: "#6b7280",
  },
});
