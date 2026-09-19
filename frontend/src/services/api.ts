import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    let token = null;

    if (Platform.OS === 'web') {
      token = localStorage.getItem('token');
    }

    if (!token) {
      token = await AsyncStorage.getItem('token');
    }

    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
