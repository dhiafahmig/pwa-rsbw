import axios from 'axios';

// Create axios instance dengan config yang tepat
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1', // ✅ Use localhost
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token dan logging
api.interceptors.request.use(
  (config) => {
    // ✅ FIXED: Use correct token key
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug logging
    console.log('🔄 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token
    });

    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle responses dan errors
api.interceptors.response.use(
  (response) => {
    // Debug logging
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });

    return response;
  },
  (error) => {
    // Debug logging
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    // Handle unauthorized (401)
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - clearing auth data');
      localStorage.removeItem('auth_token'); // ✅ FIXED: Use correct key
      localStorage.removeItem('user_data');  // ✅ FIXED: Use correct key
      // Redirect to login jika tidak sedang di login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle network error
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error - Backend mungkin tidak running');
    }

    return Promise.reject(error);
  }
);

export default api;
