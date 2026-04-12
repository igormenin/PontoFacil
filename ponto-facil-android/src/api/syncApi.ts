import axios from 'axios';
import * as Application from 'expo-application';
import { useAuthStore } from '../store/useAuthStore';

// Point to Render production API
const API_URL = 'https://pontofacil-72p0.onrender.com/api';

const syncApi = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

syncApi.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  const deviceId = Application.androidId;

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

export const pullSync = async (lastSyncAt: string | null) => {
  const response = await syncApi.get('/sync/pull', {
    params: { lastSyncAt }
  });
  return response.data;
};

export default syncApi;
