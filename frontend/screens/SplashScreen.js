import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import theme from '../theme';

const HERO_IMAGE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBaO83xHLK05hL3v3RWE196WGKocJXL8liyzH9Dyx6EJ3_hkM76p8SzmvjBhVHf5hReCln97TdzStWLM1dr21002Y0SEyHR7aDzpa5C0V2rTetl9zyeuMa5UD_tN9HxFFT14SNRRjGP4trKA87DHu32KekBYrKtzucCg9_gS5suIkL22zqrYaQICVDR76CxU4-QY1f9muVixehNJhsUZO_-D3s29Sz5Wuae9V_Yx8C7_VQpmXsZrfwWCDWvsTQAu2xikaiJ2Enqjw';

export default function SplashScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        <View style={styles.bgTopTint} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroImageWrapper}>
            <Image
              source={{ uri: HERO_IMAGE_URI }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title}>Welcome to Estately</Text>
            <Text style={styles.subtitle}>
              The smartest way to manage, rent, and discover properties. Your real
              estate journey starts here.
            </Text>
          </View>

          <View style={styles.ctaBlock}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateAccount')}
              style={styles.createAccountButton}
              activeOpacity={0.9}
            >
              <Text style={styles.createAccountLabel}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.loginLink}
              activeOpacity={0.8}
            >
              <Text style={styles.loginLabel}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  background: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  bgTopTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: '#EFF6FF',
    opacity: 0.8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 24 : 16,
    paddingBottom: 32,
    alignItems: 'center',
    flexGrow: 1,
  },
  heroImageWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    marginTop: 24,
    marginBottom: 22,
  },
  heroImage: {
    width: '100%',
    height: 240,
  },
  textBlock: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    flex: 1,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 320,
  },
  ctaBlock: {
    width: '100%',
    maxWidth: 380,
    marginTop: 28,
  },
  createAccountButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  createAccountLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  loginLink: {
    marginTop: 18,
    alignSelf: 'center',
  },
  loginLabel: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
