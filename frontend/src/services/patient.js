import api from './api';

export const patientService = {
  // ✅ FIXED: Get daftar pasien dengan struktur data yang benar
  async getPatients() {
    try {
      console.log('📋 Fetching patients data...');
      
      // ✅ Endpoint yang benar: /ranap/pasien
      const response = await api.get('/ranap/pasien');
      
      console.log('🔍 Full API response:', response.data);
      
      if (response.data.status === 'success') {
        console.log('✅ Patients data received:', response.data);
        // ✅ FIXED: Return the full response data, not just response.data.data
        return { success: true, data: response.data };
      }
      
      return { success: false, message: response.data.message || 'Gagal mengambil data pasien' };
    } catch (error) {
      console.error('❌ Get patients error:', error);
      let errorMessage = 'Gagal mengambil data pasien';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Gagal terhubung ke server - Pastikan backend running di http://localhost:8080';
      } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint tidak ditemukan. Pastikan backend sudah running.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired - redirecting to login';
      }
      
      return { success: false, message: errorMessage };
    }
  },

  // Get detail pasien by ID
  async getPatientById(id) {
    try {
      console.log('🔍 Fetching patient detail:', id);
      const response = await api.get(`/ranap/pasien/${id}`);
      
      if (response.data.status === 'success') {
        console.log('✅ Patient detail received:', response.data.data);
        return { success: true, data: response.data.data };
      }
      
      return { success: false, message: response.data.message || 'Gagal mengambil detail pasien' };
    } catch (error) {
      console.error('❌ Get patient detail error:', error);
      return { success: false, message: 'Gagal mengambil detail pasien' };
    }
  }
};
