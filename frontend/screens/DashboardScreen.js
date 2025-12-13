import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenLayout from '../layouts/ScreenLayout';
import theme from '../theme';

export default function DashboardScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const json = await AsyncStorage.getItem('USER_PROFILE');
        if (!json) return;
        const user = JSON.parse(json);
        if (user?.firstName) setFirstName(String(user.firstName));
      } catch (e) {}
    };
    load();
  }, []);

  return (
    <ScreenLayout
      title={firstName ? `Hi ${firstName}` : 'Dashboard'}
      showSearchRow
      onPressMenu={() => {
        if (navigation && navigation.openDrawer) {
          navigation.openDrawer();
        }
      }}
    >
      <View style={styles.body}>
        <Text style={styles.bodyText}>Dashboard content will go here later.</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F5FD',
  },
  menuLabel: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
