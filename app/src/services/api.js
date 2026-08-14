import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../constants/config';
import { ENDPOINTS } from '../constants/endpoints';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('dms.accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_PATHS = [
  ENDPOINTS.login,
  ENDPOINTS.register,
  ENDPOINTS.refresh,
  ENDPOINTS.logout,
  ENDPOINTS.mfaVerify,
];
const isAuthPath = (url = '') => AUTH_PATHS.some((path) => url.includes(path));

let isRefreshing = false;
let waiting = [];

const releaseWaiting = (error, token = null) => {
  waiting.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  waiting = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && !isAuthPath(original.url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => waiting.push({ resolve, reject }))
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('dms.refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE_URL}${ENDPOINTS.refresh}`, { refreshToken });

        await AsyncStorage.setItem('dms.accessToken', data.accessToken);
        releaseWaiting(null, data.accessToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        releaseWaiting(refreshError, null);
        await AsyncStorage.multiRemove(['dms.accessToken', 'dms.user']);
        await SecureStore.deleteItemAsync('dms.refreshToken');

        const { useAuthStore } = require('../store/authStore');
        useAuthStore.setState({ user: null, token: null });

        return Promise.reject(toFriendlyError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toFriendlyError(error));
  }
);

function toFriendlyError(error) {
  if (error.response) {
    const friendly = new Error(
      error.response.data?.message || `Request failed (${error.response.status})`
    );
    friendly.status = error.response.status;
    return friendly;
  }
  if (error.request) {
    const offline = new Error('Network unavailable. Check your connection.');
    offline.status = 0;
    return offline;
  }
  return new Error(error.message || 'Something went wrong');
}

export default api;