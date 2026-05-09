import axios from 'axios';

const api = axios.create({
  baseURL: 'https://pontofacil-seven.vercel.app/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request
api.interceptors.request.use(
  async (config) => {
    const auth = await window.electron.auth.getAuth();
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle common errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await window.electron.auth.clearAuth();
      // Redirect or handle logout in the app state
      window.location.reload(); // Hard reload for simplicity in this case
    }
    return Promise.reject(error);
  }
);

export default api;

