// src/services/auth.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api'; // Pastikan ini di-import dari api.js Anda

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Dimulai dengan true

  // ✅ PERBAIKAN: Verifikasi token saat aplikasi dimuat
  useEffect(() => {
    const verifyAuthOnLoad = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        // Jika tidak ada token sama sekali, langsung selesai loading
        setLoading(false);
        return;
      }
      
      try {
        // 1. Set token di header axios (interceptor juga melakukan ini,
        //    tapi ini untuk memastikan panggilan pertama ini memilikinya)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // 2. Panggil endpoint validasi baru Anda
        const response = await api.get('/auth/validate'); 
        
        if (response.data.status === 'success') {
          // 3. Token valid. Set user dari data response
          const userData = {
             id_user: response.data.data.id_user,
             kd_dokter: response.data.data.kd_dokter,
             nm_dokter: response.data.data.nm_dokter,
             token: token // token lama masih valid
          };
          
          // Perbarui localStorage dengan data terbaru
          localStorage.setItem('user_data', JSON.stringify(userData)); 
          
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Seharusnya tidak terjadi, tapi untuk jaga-jaga
          throw new Error('Validasi gagal');
        }
        
      } catch (error) {
        // 4. Jika call GAGAL (entah 401 atau Network Error/Backend mati)
        //    Interceptor 401 akan otomatis logout.
        //    Jika ini error lain (Network Error), kita logout manual di sini.
        console.error('Verifikasi auth gagal:', error.message);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setUser(null);
        setIsAuthenticated(false);
        delete api.defaults.headers.common['Authorization'];
        // Interceptor 401 akan menangani redirect jika errornya 401.
      } finally {
        // 5. Selesai loading, apapun hasilnya
        setLoading(false);
      }
    };
    
    verifyAuthOnLoad();
  }, []); // <-- Array kosong, hanya jalan sekali saat app dimuat

  const login = async (id_user, password) => {
    try {
      const response = await api.post('/auth/login', {
        id_user,
        password
      });

      if (response.data.status === 'success') {
        const responseData = response.data.data;
        
        const userData = {
          id_user: responseData.id_user || id_user,
          kd_dokter: responseData.kd_dokter || responseData.id_user || 'N/A',
          nm_dokter: responseData.nm_dokter || '', // Field nm_dokter dari backend
          token: responseData.token
        };
        
        // Store in localStorage
        localStorage.setItem('auth_token', responseData.token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Set header default axios setelah login berhasil
        api.defaults.headers.common['Authorization'] = `Bearer ${responseData.token}`;

        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.data.message || 'Login gagal' };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Terjadi kesalahan saat login';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Tidak dapat terhubung ke server';
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setIsAuthenticated(false);
    // Hapus juga header default axios
    delete api.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    isAuthenticated,
    loading, // <-- Kirim loading state ke komponen
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Trik ini mencegah "kedipan" (flicker).
        Aplikasi Anda (children) tidak akan di-render 
        sebelum verifikasi token selesai.
      */}
      {!loading && children}
    </AuthContext.Provider>
  );
};