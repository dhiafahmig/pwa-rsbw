import api from './api';

export const patientService = {
  // Get daftar pasien - ✅ Fixed endpoint URL
  async getPatients() {
    try {
      console.log('📋 Fetching patients data...');
      
      // ✅ Endpoint yang benar: /ranap/pasien
      const response = await api.get('/ranap/pasien');
      
      if (response.data.status === 'success') {
        console.log('✅ Patients data received:', response.data.data);
        return { success: true, data: response.data.data };
      }
      
      return { success: false, message: response.data.message || 'Gagal mengambil data pasien' };
      
    } catch (error) {
      console.error('❌ Get patients error:', error);
      
      let errorMessage = 'Gagal mengambil data pasien';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Gagal terhubung ke server';
      } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint tidak ditemukan. Pastikan backend sudah running.';
      }
      
      return { success: false, message: errorMessage };
    }
  },

  // Get detail pasien by ID - ✅ Fixed endpoint URL  
  async getPatientById(id) {
    try {
      console.log('🔍 Fetching patient detail:', id);
      
      // ✅ Endpoint yang benar: /ranap/pasien/:id
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
  },

  // ✅ Get statistics - bonus endpoint if available
  async getPatientStats() {
    try {
      console.log('📊 Fetching patient statistics...');
      
      const response = await api.get('/ranap/statistik');
      
      if (response.data.status === 'success') {
        console.log('✅ Patient stats received:', response.data.data);
        return { success: true, data: response.data.data };
      }
      
      return { success: false, message: response.data.message || 'Gagal mengambil statistik' };
      
    } catch (error) {
      console.error('❌ Get patient stats error:', error);
      // Return default stats if API fails
      return { 
        success: true, 
        data: {
          total_pasien: 0,
          pasien_aktif: 0,
          pasien_keluar_hari_ini: 0,
          pasien_baru_hari_ini: 0
        }
      };
    }
  }
};
