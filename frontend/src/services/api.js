import axios from 'axios';

// ✅ Create axios instance with ngrok bypass header
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://eloquently-bewhiskered-blake.ngrok-free.dev/api/v1',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true', // ✅ Skip ngrok browser warning
  },
});

// ✅ Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Always add ngrok bypass header
    config.headers['ngrok-skip-browser-warning'] = 'true';

    // Debug logging
    console.log('🔄 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      headers: config.headers
    });

    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor with HTML detection
api.interceptors.response.use(
  (response) => {
    // ✅ Check if response is HTML (ngrok warning page)
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      console.error('❌ Received HTML instead of JSON - likely ngrok warning page');
      console.error('🔧 Solution: Visit ngrok URL in browser first or add bypass header');
      throw new Error('Received ngrok warning page instead of API response');
    }

    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });

    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

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
