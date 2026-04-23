import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  Inter_300Light, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_700Bold, 
  Inter_900Black 
} from '@expo-google-fonts/inter';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/db';
import { useAuthStore } from './src/store/useAuthStore';
import { useConfigStore } from './src/store/useConfigStore';

const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializeConfig = useConfigStore((state) => state.initialize);

  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    async function prepare() {
      try {
        await initializeDatabase();
        await initializeAuth();
        await initializeConfig();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsDbReady(true);
      }
    }

    prepare();
  }, [initializeAuth, initializeConfig]);

  useEffect(() => {
    if (isDbReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isDbReady, fontsLoaded]);

  if (!isDbReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff7ff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#631660" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
    </QueryClientProvider>
  );
}
