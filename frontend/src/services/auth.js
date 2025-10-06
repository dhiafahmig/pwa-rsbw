import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('👤 User restored from localStorage:', parsedUser);
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (id_user, password) => {
    try {
      console.log('🔐 Attempting login:', { id_user });
      
      // Call backend login API
      const response = await api.post('/auth/login', {
        id_user: id_user,
        password: password
      });
      
      console.log('🔐 Login response:', response.data);
      
      if (response.data.status === 'success') {
        const { token, id_user: userId, kd_dokter, expires_at } = response.data.data;
        
        const userData = {
          id_user: userId,
          kd_dokter: kd_dokter,
          expires_at: expires_at
        };
        
        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        console.log('✅ Login successful:', userData);
        return { success: true, data: userData };
      }
      
      console.log('❌ Login failed:', response.data.message);
      return { success: false, message: response.data.message || 'Login gagal' };
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login gagal. Silakan coba lagi.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Gagal terhubung ke server. Pastikan backend sudah running.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Server tidak merespons.';
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
