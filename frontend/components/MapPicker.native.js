import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapPicker({ region, pin, onPick, onRegionChange, style }) {
  return (
    <MapView
      style={[styles.map, style]}
      region={region}
      onPress={(e) => {
        const c = e?.nativeEvent?.coordinate;
        if (c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) {
          onPick?.(c.latitude, c.longitude);
        }
      }}
      onRegionChangeComplete={(r) => {
        if (!r) return;
        onRegionChange?.(r);
      }}
    >
      {pin ? (
        <Marker
          coordinate={pin}
          draggable
          onDragEnd={(e) => {
            const c = e?.nativeEvent?.coordinate;
            if (c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) {
              onPick?.(c.latitude, c.longitude);
            }
          }}
        />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
});
