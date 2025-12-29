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
const STORAGE_SCHEMA_VERSION_KEY = 'APP_STORAGE_SCHEMA_VERSION';
const STORAGE_SCHEMA_VERSION = '2025-12-28-2';

function clearWebLocalStorageForKeys(keys) {
  try {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const storage = window?.localStorage;
    if (!storage) return;
    const targets = (Array.isArray(keys) ? keys : []).map((k) => String(k));
    const toRemove = [];
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i);
      if (!k) continue;
      for (const t of targets) {
        if (k === t || k.endsWith(`:${t}`) || k.endsWith(`/${t}`)) {
          toRemove.push(k);
          break;
        }
      }
    }
    toRemove.forEach((k) => {
      try {
        storage.removeItem(k);
      } catch (e) {}
    });
  } catch (e) {}
}

function WebMobileFrame({ children }) {
  const [viewport, setViewport] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: undefined, height: undefined };
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const body = document?.body;
    const prevBodyMargin = body?.style?.margin;
    if (body?.style) {
      body.style.margin = '0';
    }

    return () => {
      if (body?.style) {
        body.style.margin = prevBodyMargin || '';
      }
    };
  }, []);

  if (Platform.OS !== 'web') return children;

  return (
    <View style={styles.webPage}>
      <View style={styles.webMaxWidthInner}>{children}</View>
    </View>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator
      id="MainDrawer"
      drawerContent={(props) => <CustomDrawer {...props} />}
      defaultStatus="closed"
      screenListeners={({ navigation }) => ({
        focus: () => {
          if (Platform.OS === 'web' && navigation?.closeDrawer) {
            navigation.closeDrawer();
          }
        },
      })}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.35)',
        drawerStyle: Platform.OS === 'web' ? { width: 280 } : undefined,
        swipeEnabled: Platform.OS !== 'web',
      }}
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
        if (Platform.OS === 'web') {
          // eslint-disable-next-line no-console
          console.log('[APP_BUILD]', STORAGE_SCHEMA_VERSION);
        }

        const storedSchemaVersion = await AsyncStorage.getItem(STORAGE_SCHEMA_VERSION_KEY);
        if (storedSchemaVersion !== STORAGE_SCHEMA_VERSION) {
          clearWebLocalStorageForKeys([
            AUTH_TOKEN_STORAGE_KEY,
            USER_PROFILE_STORAGE_KEY,
            STORAGE_SCHEMA_VERSION_KEY,
            'PROFILE_SCREEN_DATA',
            'WISHLIST_PROPERTIES',
            'OFFER_SUBMISSIONS_V1',
          ]);
          await AsyncStorage.multiRemove([
            AUTH_TOKEN_STORAGE_KEY,
            USER_PROFILE_STORAGE_KEY,
            'PROFILE_SCREEN_DATA',
            'WISHLIST_PROPERTIES',
            'OFFER_SUBMISSIONS_V1',
          ]);
          await AsyncStorage.setItem(STORAGE_SCHEMA_VERSION_KEY, STORAGE_SCHEMA_VERSION);
          setSessionToken(null);
          setSessionUser(null);
          if (mounted) {
            setIsAuthed(false);
          }
        }

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
          <Stack.Screen name="Ads" component={AdsScreen} />
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
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  webMaxWidthInner: {
    flex: 1,
    width: '100%',
    maxWidth: 412,
  },
});
