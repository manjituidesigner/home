import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function MapPicker({ region, pin, onPick, style }) {
  const lat = pin?.latitude ?? region?.latitude;
  const lng = pin?.longitude ?? region?.longitude;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapSrc = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`
    : `https://www.google.com/maps?output=embed`;

  return (
    <View style={[styles.box, style]}>
      <View style={styles.row}>
        <MaterialIcons name="map" size={18} color="#2563eb" />
        <Text style={styles.title}>Pin Location</Text>
      </View>

      <View style={styles.mapFrame}>
        <iframe title="map" src={mapSrc} style={styles.iframe} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </View>

      <Text style={styles.sub}>Current pin</Text>
      <Text style={styles.coords}>{hasCoords ? lat.toFixed(6) : '-'} , {hasCoords ? lng.toFixed(6) : '-'}</Text>

      <TouchableOpacity
        style={styles.btn}
        activeOpacity={0.9}
        onPress={() => {
          if (hasCoords) onPick?.(lat, lng);
        }}
      >
        <Text style={styles.btnText}>Use These Coordinates</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    padding: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 13, fontWeight: '800', color: '#111418' },
  sub: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  coords: { marginTop: 4, fontSize: 12, fontWeight: '800', color: '#111418' },
  btn: { marginTop: 12, borderRadius: 10, backgroundColor: '#2563eb', paddingVertical: 10, alignItems: 'center' },
  btnText: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  mapFrame: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.10)',
    backgroundColor: '#fff',
    height: 160,
  },
  iframe: {
    border: 0,
    width: '100%',
    height: '100%',
  },
});
