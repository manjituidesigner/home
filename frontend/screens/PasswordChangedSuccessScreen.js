import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function PasswordChangedSuccessScreen({ navigation }) {
  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace('Login');
    }, 1200);

    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Successful</Text>
          <Text style={styles.subtitle}>Your password has been changed.</Text>
          <Text style={styles.hint}>Redirecting to login...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F5FF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.8)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D1D3A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
