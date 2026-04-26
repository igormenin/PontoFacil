import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { LayoutDashboard, Calendar, Users, Settings as SettingsIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/DashboardScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ClientsScreen from '../screens/ClientsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DayScreen from '../screens/DayScreen';
import ReportsScreen from '../screens/ReportsScreen';
import LoginScreen from '../screens/LoginScreen';
import FeriadosScreen from '../screens/FeriadosScreen';
import ValorHoraScreen from '../screens/ValorHoraScreen';
import DatabaseDebugScreen from '../screens/DatabaseDebugScreen';
import { useAuthStore } from '../store/useAuthStore';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const isLeitor = user?.leitor === true;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#631660', // Vinho/Marsala
        tabBarInactiveTintColor: '#82737D',
        tabBarStyle: {
          backgroundColor: '#FFF7FF',
          borderTopWidth: 1,
          borderTopColor: '#EEE5F0',
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#631660', // Vinho
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Calendário" 
        component={CalendarScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      {!isLeitor && (
        <Tab.Screen 
          name="Clientes" 
          component={ClientsScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
      )}
      <Tab.Screen 
        name="Configuração" 
        component={SettingsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Day" component={DayScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Feriados" component={FeriadosScreen} />
            <Stack.Screen name="ValorHora" component={ValorHoraScreen} />
            <Stack.Screen name="DatabaseDebug" component={DatabaseDebugScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
