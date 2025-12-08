import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import PropertyScreen from './screens/PropertyScreen';
import WishlistScreen from './screens/WishlistScreen';
import TenentsScreen from './screens/TenentsScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import SettingsScreen from './screens/SettingsScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import AdsScreen from './screens/AdsScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import CustomDrawer from './components/CustomDrawer';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

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
      <Drawer.Screen name="Payments" component={PaymentsScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Documents" component={DocumentsScreen} />
      <Drawer.Screen name="Ads" component={AdsScreen} />
      <Drawer.Screen name="subscription" component={SubscriptionScreen} />
    </Drawer.Navigator>
  );
}
/* -- 
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
