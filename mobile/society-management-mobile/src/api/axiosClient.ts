import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/env';
import { authEvents } from '../utils/authEvents';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const selectedSocietyId = await SecureStore.getItemAsync('selectedSocietyId');
      if (selectedSocietyId && config.headers) {
        config.headers['X-Society-Id'] = selectedSocietyId;
      }
    } catch (error) {
      // SecureStore may fail on certain devices; continue without token
      console.warn('Failed to read from SecureStore:', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        await SecureStore.deleteItemAsync('selectedSocietyId');
      } catch {
        // Ignore cleanup errors
      }
      authEvents.emit();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
