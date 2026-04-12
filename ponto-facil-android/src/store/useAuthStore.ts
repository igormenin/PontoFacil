import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
    set({ token: null, user: null, isAuthenticated: false });
  },
  initialize: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    const userData = await SecureStore.getItemAsync('user_data');
    if (token && userData) {
      set({ token, user: JSON.parse(userData), isAuthenticated: true });
    }
  },
}));
