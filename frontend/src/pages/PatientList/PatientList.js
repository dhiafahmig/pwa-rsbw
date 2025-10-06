import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth';
import { patientService } from '../../services/patient';
import './PatientList.css';

function PatientList() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State management
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    total_pasien: 0,
    pasien_aktif: 0,
    pasien_keluar_hari_ini: 0,
    pasien_baru_hari_ini: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Format date untuk tampilan
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

  // Load patients data
  const loadPatients = async () => {
    try {
      setError('');
      console.log('🔄 Loading patients from: /ranap/pasien');
      
      const result = await patientService.getPatients();
      
      if (result.success) {
        const patientData = result.data || [];
        setPatients(patientData);
        
        // Calculate stats from real data
        const today = new Date().toDateString();
        const pasienHariIni = patientData.filter(p => {
          if (!p.tgl_masuk) return false;
          const tglMasuk = new Date(p.tgl_masuk).toDateString();
          return tglMasuk === today;
        });
        
        setStats({
          total_pasien: patientData.length,
          pasien_aktif: patientData.length, // Semua data yang ada dianggap aktif
          pasien_keluar_hari_ini: 0, // TODO: jika ada data keluar
          pasien_baru_hari_ini: pasienHariIni.length
        });
        
        console.log('✅ Loaded patients:', patientData.length);
      } else {
        setError(result.message);
        console.error('❌ Failed to load patients:', result.message);
        setPatients([]);
      }
    } catch (err) {
      console.error('❌ Load patients error:', err);
      setError('Gagal memuat data pasien dari server');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
  };

  // Loading state
  if (loading) {
    return (
      <div className="patient-list-page">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Memuat data pasien rawat inap...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-list-page">
      {/* Header */}
      <header className="patient-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={goBack} className="back-button">
              <span>←</span>
              Back
            </button>
            <div className="header-info">
              <h1 className="page-title">Daftar Pasien Rawat Inap</h1>
              <p className="page-subtitle">Dr. {user?.id_user} - Kode: {user?.kd_dokter}</p>
            </div>
          </div>
          
          <div className="header-right">
            <button onClick={handleLogout} className="logout-button">
              <span>🚪</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="patient-main">
        <div className="patient-container">
          
          {/* Error Alert */}
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <div className="error-content">
                <strong>Koneksi API Gagal:</strong> {error}
                <div className="error-details">
                  Pastikan backend running dan endpoint <code>/api/v1/ranap/pasien</code> tersedia.
                </div>
              </div>
              <button onClick={() => setError('')} className="error-close">×</button>
            </div>
          )}
          
          {/* Summary Cards */}
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

            <div className="summary-card">
              <div className="summary-icon">🔄</div>
              <div className="summary-info">
                <h3>{error ? 'Error' : 'Live'}</h3>
                <p>Status Data</p>
              </div>
            </div>
          </div>

          {/* Patient Table */}
          <div className="table-section">
            <div className="table-header">
              <h2 className="table-title">
                Data Pasien Rawat Inap
                <span className="data-count">({patients.length} pasien)</span>
              </h2>
              <div className="table-actions">
                <button 
                  onClick={handleRefresh} 
                  className={`refresh-button ${refreshing ? 'loading' : ''}`}
                  disabled={refreshing}
                >
                  <span>{refreshing ? '⏳' : '🔄'}</span>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>No. Rawat</th>
                    <th>No. RM</th>
                    <th>Nama Pasien</th>
                    <th>Penanggung Jawab</th>
                    <th>Dokter DPJP</th>
                    <th>Kamar</th>
                    <th>Bangsal</th>
                    <th>Diagnosa</th>
                    <th>Tgl Masuk</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient, index) => (
                    <tr key={patient.no_rawat || index}>
                      {/* No. Rawat */}
                      <td className="no-rawat">
                        {patient.no_rawat}
                      </td>

                      {/* No. RM */}
                      <td className="no-rm">
                        {patient.no_rkm_medis}
                      </td>

                      {/* Nama Pasien */}
                      <td className="nama-pasien">
                        <div className="patient-name">
                          <span className="name">{patient.nm_pasien}</span>
                        </div>
                      </td>

                      {/* Penanggung Jawab */}
                      <td className="penanggung-jawab">
                        <span className={`pj-badge ${patient.penanggung_jawab?.toLowerCase()}`}>
                          {patient.penanggung_jawab === 'BPJS' ? '🏥' : '💳'} 
                          {patient.penanggung_jawab}
                        </span>
                      </td>

                      {/* Dokter DPJP */}
                      <td className="dokter">
                        <div className="dokter-info">
                          <span className="dokter-kode">{patient.kd_dokter}</span>
                          <span className="dokter-nama">{patient.nm_dokter}</span>
                        </div>
                      </td>

                      {/* Kamar */}
                      <td className="kamar">
                        {patient.kd_kamar}
                      </td>

                      {/* Bangsal */}
                      <td className="bangsal">
                        {patient.nm_bangsal}
                      </td>

                      {/* Diagnosa */}
                      <td className="diagnosa">
                        {patient.diagnosa_awal}
                      </td>

                      {/* Tanggal Masuk */}
                      <td className="tgl-masuk">
                        {formatDate(patient.tgl_masuk)}
                      </td>

                      {/* Aksi */}
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-detail" 
                            title="Detail Pasien"
                            onClick={() => console.log('Detail:', patient.no_rawat)}
                          >
                            👁️
                          </button>
                          <button 
                            className="btn-edit" 
                            title="Edit Data"
                            onClick={() => console.log('Edit:', patient.no_rawat)}
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {patients.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Tidak ada data pasien</h3>
                <p>Tidak ada pasien rawat inap saat ini</p>
                <button onClick={handleRefresh} className="retry-button">
                  <span>🔄</span>
                  Coba Lagi
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default PatientList;
