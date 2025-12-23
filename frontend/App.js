import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useFonts } from 'expo-font';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import CreateAccountScreen from './screens/CreateAccountScreen';
import VerifyOtpScreen from './screens/VerifyOtpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import PasswordChangedSuccessScreen from './screens/PasswordChangedSuccessScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import PropertyScreen from './screens/PropertyScreen';
import PropertyDetailsScreen from './screens/PropertyDetailsScreen';
import PropertyPreviewScreen from './screens/PropertyPreviewScreen';
import WishlistScreen from './screens/WishlistScreen';
import TenentsScreen from './screens/TenentsScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import SettingsScreen from './screens/SettingsScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import OwnersScreen from './screens/OwnersScreen';
import OffersScreen from './screens/OffersScreen';
import AgreementScreen from './screens/AgreementScreen';
import ChatScreen from './screens/ChatScreen';
import DocsScreen from './screens/DocsScreen';
import AdsScreen from './screens/AdsScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import MakeOfferScreen from './screens/MakeOfferScreen';
import OwnerOfferDetailsScreen from './screens/OwnerOfferDetailsScreen';
import CustomDrawer from './components/CustomDrawer';
import { setSessionToken, setSessionUser } from './session';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const AUTH_TOKEN_STORAGE_KEY = 'AUTH_TOKEN';
const USER_PROFILE_STORAGE_KEY = 'USER_PROFILE';

function WebMobileFrame({ children }) {
  const [viewport, setViewport] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: undefined, height: undefined };
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const html = document?.documentElement;
    const body = document?.body;
    const prevHtmlOverflow = html?.style?.overflow;
    const prevBodyOverflow = body?.style?.overflow;
    const prevBodyMargin = body?.style?.margin;

    if (html?.style) html.style.overflow = 'hidden';
    if (body?.style) {
      body.style.overflow = 'hidden';
      body.style.margin = '0';
    }

    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
      if (html?.style) html.style.overflow = prevHtmlOverflow || '';
      if (body?.style) {
        body.style.overflow = prevBodyOverflow || '';
        body.style.margin = prevBodyMargin || '';
      }
    };
  }, []);

  if (Platform.OS !== 'web') return children;

  const frameHeight = viewport.height
    ? Math.max(0, Math.min(915, viewport.height - 40))
    : 915;

  return (
    <View style={[styles.webPage, viewport.height ? { height: viewport.height } : null]}>
      <View style={styles.webPageContent}>
        <View style={styles.webFrameSlot}>
          <View style={[styles.webFrame, { height: frameHeight }]}>
            <View style={styles.webFrameInner}>{children}</View>
          </View>
        </View>
      </View>
    </View>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Property" component={PropertyScreen} />
      <Drawer.Screen name="Wishlist" component={WishlistScreen} />
      <Drawer.Screen name="Tenents" component={TenentsScreen} />
      <Drawer.Screen name="Owners" component={OwnersScreen} />
      <Drawer.Screen name="Payments" component={PaymentsScreen} />
      <Drawer.Screen name="Offers" component={OffersScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Documents" component={DocumentsScreen} />
      <Drawer.Screen name="Docs" component={DocsScreen} />
      <Drawer.Screen name="Agreement" component={AgreementScreen} />
      <Drawer.Screen name="Chat" component={ChatScreen} />
      <Drawer.Screen name="Ads" component={AdsScreen} />
      <Drawer.Screen name="subscription" component={SubscriptionScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  const defaultTextProps = useMemo(
    () => ({
      ...(Text.defaultProps || {}),
      style: [
        { fontFamily: 'Roboto_400Regular' },
        ...(Array.isArray(Text.defaultProps?.style) ? Text.defaultProps.style : Text.defaultProps?.style ? [Text.defaultProps.style] : []),
      ],
    }),
    []
  );

  useEffect(() => {
    Text.defaultProps = defaultTextProps;
  }, [defaultTextProps]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [token, userJson] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY),
        ]);

        if (!mounted) return;

        if (token) {
          setSessionToken(token);
          setIsAuthed(true);
        } else {
          setSessionToken(null);
          setIsAuthed(false);
        }

        if (userJson) {
          try {
            setSessionUser(JSON.parse(userJson));
          } catch (e) {
            setSessionUser(null);
          }
        } else {
          setSessionUser(null);
        }
      } catch (e) {
        if (!mounted) return;
        setSessionToken(null);
        setSessionUser(null);
        setIsAuthed(false);
      } finally {
        if (!mounted) return;
        setBootstrapped(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!bootstrapped || !fontsLoaded) return null;

  return (
    <WebMobileFrame>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={isAuthed ? 'Main' : 'Splash'}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="PasswordChangedSuccess" component={PasswordChangedSuccessScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Main" component={MainDrawer} />
          <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
          <Stack.Screen name="PropertyPreview" component={PropertyPreviewScreen} />
          <Stack.Screen name="MakeOffer" component={MakeOfferScreen} />
          <Stack.Screen name="OwnerOfferDetails" component={OwnerOfferDetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </WebMobileFrame>
  );
}

const styles = StyleSheet.create({
  webPage: {
    width: '100%',
    backgroundColor: '#0b0f19',
    overflow: 'hidden',
  },
  webPageContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
    flex: 1,
  },
  webFrameSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  webFrame: {
    width: 412,
    height: 915,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 20,
  },
  webFrameInner: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
