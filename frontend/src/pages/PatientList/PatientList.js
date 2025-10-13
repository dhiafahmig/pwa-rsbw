import React, { useState, useEffect } from 'react';
import { patientService } from '../../services/patient'; // Sesuaikan path
import './PatientList.css';

const PatientList = () => {
  // ===== STATE MANAGEMENT =====
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total_pasien: 0,
    pasien_aktif: 0,
    pasien_baru_hari_ini: 0,
    cppt_done_today: 0,
    cppt_pending_today: 0
  });

  // ===== UTILITY FUNCTIONS =====
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // ✅ PENJAMIN BADGE CLASSIFICATION
  const getPenjaminBadgeClass = (penjamin) => {
    if (!penjamin) return 'default';
    
    const p = penjamin.toLowerCase();
    if (p.includes('bpjs') || p.includes('jkn') || p.includes('jamkesmas') || p.includes('jamkesda')) {
      return 'bpjs';
    }
    if (p.includes('umum') || p.includes('pribadi') || p.includes('bayar sendiri')) {
      return 'umum';
    }
    if (p.includes('asuransi') || p.includes('insurance') || p.includes('prudential') || 
        p.includes('allianz') || p.includes('aia') || p.includes('sinar mas')) {
      return 'asuransi';
    }
    if (p.includes('perusahaan') || p.includes('korporat') || p.includes('company')) {
      return 'asuransi';
    }
    
    return 'default';
  };

  // ===== FETCH PATIENTS DATA =====
  const fetchPatients = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      setError(null);
      
      console.log('🔄 Fetching patients data...');
      const result = await patientService.getPatients();
      console.log('📋 Patient service result:', result);
      
      if (result.success) {
        // Akses data sesuai struktur response service
        const patientsList = result.data?.data || result.data?.patients || result.data || [];
        console.log('👥 Patients list:', patientsList);
        
        setPatients(patientsList);
        
        // ✅ HITUNG STATISTIK TERMASUK CPPT
        const today = new Date().toISOString().split('T')[0];
        
        const pasienBaruHariIni = patientsList.filter(p => {
          if (!p.tgl_masuk) return false;
          const tglMasuk = new Date(p.tgl_masuk).toISOString().split('T')[0];
          return tglMasuk === today;
        }).length;
        
        const cpptDoneToday = patientsList.filter(p => p.cppt_hari_ini === true || p.cppt_hari_ini === 1).length;
        const cpptPendingToday = patientsList.length - cpptDoneToday;
        
        setStats({
          total_pasien: patientsList.length,
          pasien_aktif: patientsList.length,
          pasien_baru_hari_ini: pasienBaruHariIni,
          cppt_done_today: cpptDoneToday,
          cppt_pending_today: cpptPendingToday
        });
        
        console.log('📊 Stats updated:', {
          total: patientsList.length,
          cppt_done: cpptDoneToday,
          cppt_pending: cpptPendingToday,
          baru_hari_ini: pasienBaruHariIni
        });
        
      } else {
        setError(result.message || 'Gagal mengambil data pasien');
        setPatients([]);
        
        // Set default stats on error
        setStats({
          total_pasien: 0,
          pasien_aktif: 0,
          pasien_baru_hari_ini: 0,
          cppt_done_today: 0,
          cppt_pending_today: 0
        });
      }
      
    } catch (err) {
      console.error('❌ Error in fetchPatients:', err);
      setError(err.message || 'Gagal mengambil data pasien');
      setPatients([]);
      
      // Set default stats on error
      setStats({
        total_pasien: 0,
        pasien_aktif: 0,
        pasien_baru_hari_ini: 0,
        cppt_done_today: 0,
        cppt_pending_today: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===== COMPONENT LIFECYCLE =====
  useEffect(() => {
    fetchPatients(true);
    
    // ✅ AUTO REFRESH SETIAP 5 MENIT
    const interval = setInterval(() => {
      console.log('🔄 Auto refresh patients data...');
      fetchPatients(false);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // ===== EVENT HANDLERS =====
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchPatients(false);
  };

  const handleBack = () => {
    // Option 1: React Router (jika menggunakan useNavigate)
    // navigate(-1);
    
    // Option 2: Browser back
    window.history.back();
    
    // Option 3: Specific route
    // window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    console.log('🚪 Logout triggered');
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  };

  const handleCloseError = () => {
    setError(null);
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Memuat data pasien...</p>
          <small>Menghubungi server RS Bumi Waras</small>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="patient-list-page">
      {/* ===== HEADER SECTION ===== */}
      <header className="patient-header">
        <div className="header-content">
          <div className="header-left">
            {/* ✅ TOMBOL KEMBALI */}
            <button className="back-button" onClick={handleBack} title="Kembali ke halaman sebelumnya">
              ← Kembali
            </button>
            <div className="header-info">
              <h1 className="page-title">Data Pasien Rawat Inap</h1>
              <p className="page-subtitle">
                RS Bumi Waras - Sistem DPJP • {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="header-right">
            <button className="logout-button" onClick={handleLogout} title="Logout dari sistem">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="patient-main">
        <div className="patient-container">
          
          {/* ===== ERROR BANNER ===== */}
          {error && (
            <div className="error-banner">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <strong>Koneksi API Gagal:</strong>
                <div className="error-details">
                  <code>{error}</code>
                </div>
                <p>Pastikan backend berjalan di <code>/api/v1/ranap/pasien</code> dan gunakan <code>localhost</code>.</p>
              </div>
              <button className="error-close" onClick={handleCloseError} title="Tutup pesan error">×</button>
            </div>
          )}

          {/* ===== SUMMARY CARDS ===== */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">👥</div>
              <div className="summary-info">
                <h3>{stats.total_pasien}</h3>
                <p>Total Pasien</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">🏥</div>
              <div className="summary-info">
                <h3>{stats.pasien_aktif}</h3>
                <p>Rawat Inap</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">📅</div>
              <div className="summary-info">
                <h3>{stats.pasien_baru_hari_ini}</h3>
                <p>Masuk Hari Ini</p>
              </div>
            </div>
            
            {/* ✅ CPPT DONE CARD */}
            <div className="summary-card">
              <div className="summary-icon">✅</div>
              <div className="summary-info">
                <h3>{stats.cppt_done_today}</h3>
                <p>CPPT Hari Ini</p>
              </div>
            </div>
            
            {/* ✅ STATUS CARD */}
            <div className="summary-card">
              <div className="summary-icon">{error ? '❌' : refreshing ? '🔄' : '📊'}</div>
              <div className="summary-info">
                <h3>{error ? 'Error' : refreshing ? 'Loading' : 'Live'}</h3>
                <p>Status Data</p>
              </div>
            </div>
          </div>

          {/* ===== TABLE SECTION ===== */}
          <section className="table-section">
            {/* TABLE HEADER */}
            <div className="table-header">
              <h2 className="table-title">
                Data Pasien Rawat Inap
                <span className="data-count">({patients.length} pasien)</span>
              </h2>
              <div className="table-actions">
                <button 
                  className={`refresh-button ${refreshing ? 'loading' : ''}`}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh data pasien"
                >
                  🔄 {refreshing ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* ✅ CPPT STATUS LEGEND - MIRIP DESKTOP, RESPONSIVE */}
            <div className="cppt-legend">
              <div className="legend-item">
                <div className="legend-color done"></div>
                <span className="legend-text">Sudah CPPT Hari Ini ({stats.cppt_done_today})</span>
              </div>
              <div className="legend-item">
                <div className="legend-color pending"></div>
                <span className="legend-text">Belum CPPT Hari Ini ({stats.cppt_pending_today})</span>
              </div>
            </div>

            {/* TABLE CONTAINER */}
            <div className="table-container">
              {patients.length > 0 ? (
                <table className="patient-table">
                  <thead>
                    <tr>
                      {/* ✅ NOMOR URUT */}
                      <th>No</th>
                      <th>No. Rawat</th>
                      <th>No. RM</th>
                      <th>Nama Pasien</th>
                      <th>Penjamin</th>
                      <th>Dokter DPJP</th>
                      <th>Kamar</th>
                      <th>Bangsal</th>
                      <th>Diagnosa</th>
                      <th>Tgl Masuk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient, index) => {
                      const hasCpptToday = patient.cppt_hari_ini === true || patient.cppt_hari_ini === 1;
                      
                      return (
                        <tr 
                          key={patient.no_rawat || `patient-${index}`}
                          className={hasCpptToday ? 'cppt-done' : 'cppt-pending'}
                        >
                          {/* ✅ NOMOR URUT */}
                          <td className="no-urut">{index + 1}</td>
                          
                          {/* No. Rawat */}
                          <td className="no-rawat">
                            {patient.no_rawat || '-'}
                          </td>
                          
                          {/* No. RM */}
                          <td className="no-rm">
                            {patient.no_rkm_medis || patient.no_rm || '-'}
                          </td>
                          
                          {/* Nama Pasien */}
                          <td className="nama-pasien">
                            <div className="patient-name">
                              <span className="name">{patient.nm_pasien || 'Nama tidak tersedia'}</span>
                              {/* ✅ CPPT Indicator seperti desktop */}
                              {hasCpptToday && (
                                <span className="cppt-indicator" title="Sudah CPPT hari ini">✅</span>
                              )}
                            </div>
                          </td>
                          
                          {/* ✅ KOLOM PENJAMIN */}
                          <td className="penjamin">
                            <span className={`pj-badge ${getPenjaminBadgeClass(patient.penanggung_jawab || patient.penjamin || patient.png_jawab)}`}>
                              {patient.penanggung_jawab || patient.penjamin || patient.png_jawab || 'Umum'}
                            </span>
                          </td>
                          
                          {/* Dokter DPJP */}
                          <td className="dokter">
                            <div className="dokter-info">
                              <div className="dokter-kode">
                                {patient.kd_dokter || '-'}
                              </div>
                              <div className="dokter-nama">
                                {patient.nm_dokter || 'Dokter tidak tersedia'}
                              </div>
                            </div>
                          </td>
                          
                          {/* Kamar */}
                          <td className="kamar">
                            <div className="ruang">
                              {patient.kd_kamar || patient.kamar || '-'}
                            </div>
                          </td>
                          
                          {/* Bangsal */}
                          <td className="bangsal">
                            <span className="bangsal">
                              {patient.nm_bangsal || patient.bangsal || '-'}
                            </span>
                          </td>
                          
                          {/* Diagnosa */}
                          <td className="diagnosa">
                            {patient.diagnosa_awal || patient.diagnosa || patient.diagnosis || '-'}
                          </td>
                          
                          {/* Tanggal Masuk */}
                          <td className="tgl-masuk">
                            {formatDate(patient.tgl_masuk || patient.tgl_registrasi)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* ===== EMPTY STATE ===== */
                <div className="empty-state">
                  <div className="empty-icon">🏥</div>
                  <h3>Tidak ada data pasien</h3>
                  <p>
                    {error 
                      ? 'Terjadi kesalahan saat memuat data. Silakan coba lagi.'
                      : 'Tidak ada pasien rawat inap saat ini.'
                    }
                  </p>
                  <button className="retry-button" onClick={handleRefresh} disabled={refreshing}>
                    🔄 {refreshing ? 'Loading...' : 'Coba Lagi'}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ===== FOOTER INFO ===== */}
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#6b7280', 
            fontSize: '0.875rem' 
          }}>
            <p>
              🏥 RS Bumi Waras - Sistem DPJP |  {new Date().toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientList;
