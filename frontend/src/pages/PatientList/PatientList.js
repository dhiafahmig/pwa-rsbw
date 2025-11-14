import React, { useState, useEffect, useRef } from 'react'; 
import { patientService } from '../../services/patient'; 
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
  
  const [currentFilter, setCurrentFilter] = useState('all');

  // Ref ini akan menyimpan nilai 'currentFilter' yang terbaru
  const filterRef = useRef(currentFilter);

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

  const getPenjaminBadgeClass = (penjamin) => {
    if (!penjamin) return 'default';
    const p = penjamin.toLowerCase();
    if (p.includes('bpjs') || p.includes('jkn')) return 'bpjs';
    if (p.includes('umum') || p.includes('pribadi')) return 'umum';
    if (p.includes('asuransi') || p.includes('perusahaan') || p.includes('korporat')) return 'asuransi';
    return 'default';
  };

  // ===== FETCH PATIENTS DATA =====
  const fetchPatients = async (filter = 'all', showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      setCurrentFilter(filter); 
      
      console.log(`🔄 Fetching patients data (filter: ${filter})...`);
      
      const result = await patientService.getPatients(filter); 
      
      console.log('📋 Patient service result:', result);
      
      if (result.success) {
        const patientsList = result.data?.data || [];
        setPatients(patientsList);
        
        const summary = result.data?.cppt_summary || {
          total_pasien: 0,
          sudah_cppt_hari_ini: 0,
          belum_cppt_hari_ini: 0,
          pasien_baru_hari_ini: 0,
        };
        
        if (filter === 'all' || showLoadingState) {
          setStats({
            total_pasien: summary.total_pasien,
            pasien_aktif: summary.total_pasien,
            pasien_baru_hari_ini: summary.pasien_baru_hari_ini,
            cppt_done_today: summary.sudah_cppt_hari_ini,
            cppt_pending_today: summary.belum_cppt_hari_ini
          });
          console.log('📊 Dashboard Stats Updated:', summary);
        }
        
      } else {
        setError(result.message || 'Gagal mengambil data pasien');
        setPatients([]);
        if (showLoadingState) {
          setStats({ total_pasien: 0, pasien_aktif: 0, pasien_baru_hari_ini: 0, cppt_done_today: 0, cppt_pending_today: 0 });
        }
      }
    } catch (err) {
      console.error('❌ Error in fetchPatients:', err);
      setError(err.message || 'Gagal mengambil data pasien');
      setPatients([]);
      if (showLoadingState) {
        setStats({ total_pasien: 0, pasien_aktif: 0, pasien_baru_hari_ini: 0, cppt_done_today: 0, cppt_pending_today: 0 });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    filterRef.current = currentFilter;
  }, [currentFilter]); // Efek ini jalan setiap kali 'currentFilter' berubah

  useEffect(() => {
    // Ambil data "all" saat pertama kali load
    fetchPatients('all', true);
    
    // Fungsi yang akan dijalankan oleh interval
    const autoRefresh = () => {
      // Selalu BACA nilai TERBARU dari ref
      console.log(`🔄 Auto refresh data (filter: ${filterRef.current})...`);
      fetchPatients(filterRef.current, false); 
    };

    // Set SATU interval
    const intervalId = setInterval(autoRefresh, 5 * 60 * 1000); // 5 menit

    // Cleanup function: Hapus interval saat komponen unmount
    return () => clearInterval(intervalId);
    
  }, []); 

  // ===== EVENT HANDLERS =====
  const handleRefresh = () => {
    console.log(`🔄 Manual refresh triggered (filter: ${currentFilter})`);
    fetchPatients(currentFilter, false);
  };
  
  const handleFilterChange = (newFilter) => {
    if (loading || refreshing) return; 
    fetchPatients(newFilter, true); 
  };

  const handleBack = () => { window.history.back(); };
  
  const handleCloseError = () => { setError(null); };

  // Helper untuk warna baris
  const getRowClass = (cpptStatus) => {
    switch (cpptStatus) {
      case 'done':
        return 'cppt-done';
      case 'pending':
        return 'cppt-pending';
      case 'new':
        return 'cppt-new';
      default:
        return 'cppt-pending';
    }
  };

  // ===== LOADING STATE =====
  if (loading && !refreshing) { 
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
            
            <div className="header-controls">
              <img 
                src="/images/logo/rs.png" 
                alt="Logo RS - Kembali" 
                className="header-logo"
                onClick={handleBack}
                title="Kembali ke halaman sebelumnya"
              />
            </div>
            
            <div className="header-info">
              <h1 className="page-title">Data Pasien Rawat Inap</h1>
              <p className="page-subtitle">
                RS Bumi Waras - Sistem DPJP • {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
            
          </div>
          {/* ⛔ TOMBOL LOGOUT (header-right) SUDAH DIHAPUS */}

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
                <p>Pastikan backend berjalan dan terhubung.</p>
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
              <div 
                className="summary-icon"
                style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' }}
              >
                📅
              </div>
              <div className="summary-info">
                <h3>{stats.pasien_baru_hari_ini}</h3>
                <p>Masuk Hari Ini</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">✅</div>
              <div className="summary-info">
                <h3>{stats.cppt_done_today}</h3>
                <p>CPPT Selesai</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div 
                className="summary-icon" 
                style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
              >
                ⚠️
              </div>
              <div className="summary-info">
                <h3>{stats.cppt_pending_today}</h3>
                <p>Belum CPPT</p>
              </div>
            </div>
            
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
            <div className="table-header">
              <h2 className="table-title">
                Data Pasien Rawat Inap
                <span className="data-count">({patients.length} pasien ditampilkan)</span>
              </h2>
              <div className="table-actions">
                <button 
                  className={`refresh-button ${refreshing ? 'loading' : ''}`}
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  title="Refresh data pasien"
                >
                  🔄 {refreshing ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* ===== CPPT LEGEND / FILTERS ===== */}
            <div className="cppt-legend">
              <div className="legend-item" onClick={() => handleFilterChange('all')} title="Tampilkan semua pasien">
                <div className="legend-color" style={{background: '#9ca3af', border: currentFilter === 'all' ? '2px solid #1f2937' : '2px solid #fff'}}></div>
                <span className="legend-text" style={{fontWeight: currentFilter === 'all' ? '700' : '500'}}>
                  Semua ({stats.total_pasien})
                </span>
              </div>
              <div className="legend-item" onClick={() => handleFilterChange('belum_cppt')} title="Tampilkan hanya yang Belum CPPT">
                <div className="legend-color pending" style={{border: currentFilter === 'belum_cppt' ? '2px solid #b45309' : '2px solid #fff'}}></div>
                <span className="legend-text" style={{fontWeight: currentFilter === 'belum_cppt' ? '700' : '500'}}>
                  Belum CPPT ({stats.cppt_pending_today})
                </span>
              </div>
              <div className="legend-item" onClick={() => handleFilterChange('pasien_baru')} title="Tampilkan hanya Pasien Baru">
                <div className="legend-color new" style={{border: currentFilter === 'pasien_baru' ? '2px solid #1d4ed8' : '2px solid #fff'}}></div>
                <span className="legend-text" style={{fontWeight: currentFilter === 'pasien_baru' ? '700' : '500'}}>
                  Pasien Baru ({stats.pasien_baru_hari_ini})
                </span>
              </div>
              <div className="legend-item" onClick={() => handleFilterChange('sudah_cppt')} title="Tampilkan hanya yang Selesai CPPT">
                <div className="legend-color done" style={{border: currentFilter === 'sudah_cppt' ? '2px solid #065f46' : '2px solid #fff'}}></div>
                <span className="legend-text" style={{fontWeight: currentFilter === 'sudah_cppt' ? '700' : '500'}}>
                  Selesai CPPT ({stats.cppt_done_today})
                </span>
              </div>
            </div>

            {/* TABLE CONTAINER */}
            <div className="table-container">
              {refreshing && (
                <div style={{ padding: '20px', textAlign: 'center', background: '#f9fafb' }}>
                  <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }}></div>
                </div>
              )}
              
              {!loading && patients.length > 0 ? (
                <table className="patient-table">
                  <thead>
                    <tr>
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
                      const cpptStatus = patient.cppt_status;
                      
                      return (
                        <tr 
                          key={patient.no_rawat || `patient-${index}`}
                          className={getRowClass(cpptStatus)}
                        >
                          <td className="no-urut">{index + 1}</td>
                          <td className="no-rawat">{patient.no_rawat || '-'}</td>
                          <td className="no-rm">{patient.no_rkm_medis || patient.no_rm || '-'}</td>
                          <td className="nama-pasien">
                            <div className="patient-name">
                              <span className="name">{patient.nm_pasien || 'Nama tidak tersedia'}</span>
                              {cpptStatus === 'done' && (
                                <span className="cppt-indicator" title="Sudah CPPT hari ini">✅</span>
                              )}
                              {cpptStatus === 'new' && (
                                <span className="cppt-indicator" title="Pasien Baru" style={{animation: 'none', filter: 'grayscale(100%)'}}>🆕</span>
                              )}
                            </div>
                          </td>
                          <td className="penjamin">
                            <span className={`pj-badge ${getPenjaminBadgeClass(patient.penanggung_jawab || patient.penjamin || patient.png_jawab)}`}>
                              {patient.penanggung_jawab || patient.penjamin || patient.png_jawab || 'Umum'}
                            </span>
                          </td>
                          <td className="dokter">
                            <div className="dokter-info">
                              <div className="dokter-kode">{patient.kd_dokter || '-'}</div>
                              <div className="dokter-nama">{patient.nm_dokter || 'Dokter tidak tersedia'}</div>
                            </div>
                          </td>
                          <td className="kamar">
                            <div className="ruang">{patient.kd_kamar || patient.kamar || '-'}</div>
                          </td>
                          <td className="bangsal">
                            <span className="bangsal">{patient.nm_bangsal || patient.bangsal || '-'}</span>
                          </td>
                          <td className="diagnosa">
                            {patient.diagnosa_awal || patient.diagnosa || patient.diagnosis || '-'}
                          </td>
                          <td className="tgl-masuk">
                            {formatDate(patient.tgl_masuk || patient.tgl_registrasi)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                !loading && !refreshing && (
                  <div className="empty-state">
                    <div className="empty-icon">🏥</div>
                    <h3>Tidak ada data pasien</h3>
                    <p>
                      {error 
                        ? 'Terjadi kesalahan saat memuat data.'
                        : `Tidak ada pasien untuk filter "${currentFilter}" saat ini.`
                      }
                    </p>
                    {currentFilter !== 'all' && (
                      <button className="retry-button" onClick={() => handleFilterChange('all')} disabled={refreshing || loading}>
                        🔄 Tampilkan Semua Pasien
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          </section>

          {/* ===== FOOTER INFO ===== */}
          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '0.875rem' }}>
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