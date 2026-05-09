import { create } from 'zustand';
import api from '../api/client';
import { useUiStore } from './uiStore';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: true, // Exclusive for startup auth handshake
  loading: false,       // For individual actions
  error: null,

  initialize: async () => {
    try {
      if (!window.electron?.auth) {
        console.warn('Electron API not found. Running in browser mode?');
        set({ isInitializing: false });
        return;
      }
      const auth = await window.electron.auth.getAuth();
      if (auth?.token) {
        set({ 
          token: auth.token, 
          user: auth.user, 
          isAuthenticated: false, // Force login screen even if token exists
          isInitializing: false 
        });
      } else {
        set({ isInitializing: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth from Electron Store:', error);
      set({ isInitializing: false });
    }
  },

  login: async (login, senha) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Autenticando', 'Verificando suas credenciais...');
    try {
      const response = await api.post('/auth/login', { login, senha });
      const { token, user } = response.data;

      await window.electron.auth.setAuth({ token, user });

      set({ 
        token, 
        user, 
        isAuthenticated: true, 
        loading: false 
      });
      useUiStore.getState().hideLoading();
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao realizar login';
      set({ error: message, loading: false });
      useUiStore.getState().hideLoading();
      return false;
    }
  },

  logout: async () => {
    await window.electron.auth.clearAuth();
    set({ 
      token: null, 
      user: null, 
      isAuthenticated: false 
    });
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Processando', 'Enviando e-mail de recuperação...');
    try {
      await api.post('/auth/forgot-password', { email });
      set({ loading: false });
      useUiStore.getState().hideLoading();
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao solicitar recuperação';
      set({ error: message, loading: false });
      useUiStore.getState().hideLoading();
      return false;
    }
  },

  resetPassword: async (email, token, newPassword) => {
    set({ loading: true, error: null });
    useUiStore.getState().showLoading('Processando', 'Redefinindo sua senha...');
    try {
      await api.post('/auth/reset-password', { email, token, newPassword });
      set({ loading: false });
      useUiStore.getState().hideLoading();
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao redefinir senha';
      set({ error: message, loading: false });
      useUiStore.getState().hideLoading();
      return false;
    }
  },

  clearError: () => set({ error: null })
}));

