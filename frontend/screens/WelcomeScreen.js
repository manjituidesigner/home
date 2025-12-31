import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  const handleProceed = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <View style={styles.dimmedBackground} />

        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalInner}>
              <View style={styles.iconOuter}>
                <View style={styles.iconInner}>
                  <Text style={styles.icon}>🛡️</Text>
                </View>
              </View>

              <Text style={styles.title}>Congratulations!</Text>
              <Text style={styles.subtitle}>
                Your account is ready. Proceed to find your best ever dream house.
              </Text>

              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleProceed}
                activeOpacity={0.9}
              >
                <Text style={styles.proceedLabel}>Proceed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  dimmedBackground: {
    flex: 1,
    opacity: 0.2,
    backgroundColor: '#F1F5F9',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '100%',
    maxWidth: 412,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  modalInner: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconOuter: {
    height: 96,
    width: 96,
    borderRadius: 48,
    backgroundColor: '#ffffff',
    padding: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    height: '100%',
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 44,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
  },
  proceedButton: {
    marginTop: 28,
    height: 56,
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#17A3E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17A3E8',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  proceedLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});
