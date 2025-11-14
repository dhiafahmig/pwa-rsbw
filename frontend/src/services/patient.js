// src/services/patient.js
import api from './api';

export const patientService = {
  // ✅ FUNGSI getPatients ANDA (Sudah benar, tapi saya hapus '/' di awal)
  async getPatients(filter = 'all') {
    try {
      console.log(`📋 Fetching patients data... (filter: ${filter})`);
      
      // ✨ DIPERBAIKI: Menghapus '/' di awal
      const response = await api.get(`ranap/pasien?filter=${filter}`);
      
      console.log('🔍 Full API response:', response.data);
      
      if (response.data.status === 'success') {
        console.log('✅ Patients data received:', response.data);
        return { success: true, data: response.data };
      }
      
      return { success: false, message: response.data.message || 'Gagal mengambil data pasien' };
    } catch (error) {
      console.error('❌ Get patients error:', error);
      let errorMessage = 'Gagal mengambil data pasien';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Gagal terhubung ke server - Pastikan backend running';
      } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint tidak ditemukan. Pastikan backend sudah running.';
      }
      // Kita biarkan interceptor di api.js menangani 401
      
      return { success: false, message: errorMessage };
    }
  },

  // ✅ FUNGSI getPatientById (URL DIPERBAIKI)
  async getPatientById(id) {
    try {
      console.log('🔍 Fetching patient detail:', id);
      
      // ✨ DIPERBAIKI: URL diubah agar cocok dengan main.go
      const response = await api.get(`ranap/pasien/detail/${id}`);
      
      if (response.data.status === 'success') {
        console.log('✅ Patient detail received:', response.data.data);
        return { success: true, data: response.data.data };
      }
      
      return { success: false, message: response.data.message || 'Gagal mengambil detail pasien' };
    } catch (error) {
      console.error('❌ Get patient detail error:', error);
      return { success: false, message: 'Gagal mengambil detail pasien' };
    }
  },

  // ✅ FUNGSI getCpptHistory (URL DIPERBAIKI)
  async getCpptHistory(noRawat) {
    try {
      console.log(`📋 Fetching CPPT history for: ${noRawat}`);
      
      // ✨ DIPERBAIKI: URL diubah agar cocok dengan main.go
      const response = await api.get(`ranap/pasien/cppt/${noRawat}`);
      
      if (response.data.status === 'success') {
        return { success: true, data: response.data.data };
      }
      
      return { success: false, message: response.data.message || 'Gagal mengambil riwayat' };
    } catch (error) {
      console.error('❌ Get CPPT history error:', error);
      
      // Log spesifik untuk 404
      if (error.response?.status === 404) {
        console.warn(`⚠️ CPPT history for ${noRawat} returned 404. Server says:`, error.response?.data?.message);
        // Kembalikan array kosong jika 404 (data tidak ditemukan / bukan DPJP)
        return { success: true, data: [] }; 
      }
      
      return { success: false, message: 'Gagal mengambil riwayat CPPT' };
    }
  }
};