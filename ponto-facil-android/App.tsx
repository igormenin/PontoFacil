import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/db';
import { useAuthStore } from './src/store/useAuthStore';
import { useConfigStore } from './src/store/useConfigStore';

const queryClient = new QueryClient();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializeConfig = useConfigStore((state) => state.initialize);

  useEffect(() => {
    async function prepare() {
      try {
        await initializeDatabase();
        await initializeAuth();
        await initializeConfig();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, [initializeAuth, initializeConfig]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF00FF" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
    </QueryClientProvider>
  );
}
