// src/services/api.js
import axios from 'axios';

// ✅ Create axios instance dengan header yang aman
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // ✅ Enable credentials untuk CORS
  withCredentials: false,
});

// ✅ Request interceptor (tanpa ngrok header di default)
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Hanya tambah ngrok header jika benar-benar menggunakan ngrok
    const baseURL = config.baseURL || '';
    if (baseURL.includes('ngrok') || baseURL.includes('.ngrok.io')) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }

    // Debug logging
    console.log('🔄 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      headers: Object.keys(config.headers)
    });

    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor dengan error handling yang lebih baik
api.interceptors.response.use(
  (response) => {
    // Check if response is HTML (ngrok warning page atau CORS error page)
    if (typeof response.data === 'string' && response.data.includes('<html>')) {
      console.error('❌ Received HTML instead of JSON - likely CORS or server error');
      console.error('🔧 Solution: Check backend CORS configuration');
      throw new Error('Received HTML response instead of JSON - check server configuration');
    }

    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      dataType: typeof response.data,
      hasData: !!response.data
    });

    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      code: error.code,
      data: error.response?.data
    });

    // Handle specific error types
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error - Check if backend is running');
    }

    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - clearing auth data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      if (!window.location.pathname.includes('/login')) {
        console.log('🔄 Redirecting to login...');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
