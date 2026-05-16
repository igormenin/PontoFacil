import axios from 'axios';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

import { API_CONFIG } from '../config/api.config';

const syncApi = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

syncApi.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  const deviceId = Platform.OS === 'android' ? Application.getAndroidId() : 'ios-device';

  if (config.headers) {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (deviceId) {
      config.headers['x-device-id'] = deviceId;
    }
  }

  return config;
});

export const pushSync = async (mutations: any[]) => {
  const response = await syncApi.post('/sync/push', { mutations });
  return response.data;
};

export const pullSync = async (force: boolean = false) => {
  const response = await syncApi.get(`/sync/pull${force ? '?force=true' : ''}`);
  return response.data;
};

export default syncApi;
