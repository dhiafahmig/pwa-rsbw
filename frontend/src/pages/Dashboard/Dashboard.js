// src/pages/Dashboard/Dashboard.js
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import useOneSignal from '../../hooks/useOneSignal'; 
import { patientService } from '../../services/patient'; 
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Gunakan hook useOneSignal
  const { 
    requestPermission, 
    isSubscribed, 
    isPermissionDenied,
    loading: notificationLoading,
    login: oneSignalLogin,
    logout: oneSignalLogout
  } = useOneSignal();

  const [dashboardStats, setDashboardStats] = useState({
    pasienAktif: 0,
    visiteHariIni: 0,
    pasienBaru: 0, 
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Close dropdown (tidak berubah)
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Hubungkan user DPJP ke OneSignal saat user terautentikasi
  useEffect(() => {
    // Gunakan kd_dokter atau id_user sebagai ID unik untuk OneSignal
    const doctorId = user?.kd_dokter || user?.id_user;
    
    if (doctorId) {
      console.log(`Menghubungkan DPJP (${doctorId}) ke OneSignal...`);
      oneSignalLogin(doctorId);
    }
  }, [user, oneSignalLogin]); // Berjalan saat 'user' atau 'oneSignalLogin' berubah

  // useEffect untuk ambil data statistik (tidak berubah)
  useEffect(() => {
    const fetchDashboardStats = async () => {
      console.log('🔄 Memuat statistik dashboard...');
      setStatsLoading(true); 
      setStatsError(null);
      try {
        const result = await patientService.getPatients('all');
        if (result.success && result.data.cppt_summary) {
          const summary = result.data.cppt_summary;
          
          setDashboardStats({
            pasienAktif: summary.total_pasien,
            visiteHariIni: summary.sudah_cppt_hari_ini,
            pasienBaru: summary.pasien_baru_hari_ini, 
          });
          console.log('📊 Statistik dashboard dimuat:', summary);
        } else {
          throw new Error(result.message || 'Gagal mengambil data statistik');
        }
      } catch (error) {
        console.error("❌ Error fetching dashboard stats:", error);
        setStatsError(error.message);
        setDashboardStats({ pasienAktif: 0, visiteHariIni: 0, pasienBaru: 0 }); 
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
    const intervalId = setInterval(fetchDashboardStats, 5 * 60 * 1000); 
    return () => clearInterval(intervalId); 
  }, []); 

  // Handler notifikasi
  const handleEnableNotifications = async () => {
    if (isSubscribed) {
      alert('✅ Notifikasi sudah aktif di browser ini.');
      return;
    }
    
    if (isPermissionDenied) {
      alert('⚠️ Anda menolak izin notifikasi sebelumnya.\n\n' +
            'Untuk mengaktifkan kembali:\n' +
            '1. Klik ikon 🔒 Gembok di address bar\n' +
            '2. Cari "Notifications" dan klik settingnya\n' +
            '3. Ubah dari "Block" ke "Allow"\n' +
            '4. Refresh halaman (F5)\n' +
            '5. Klik tombol "🔔 Aktifkan" lagi\n' +
            '6. Pilih "Allow" saat browser bertanya');
      return;
    }

    try {
      console.log('🔔 User klik tombol Aktifkan Notifikasi');
      await requestPermission();
      // Browser akan menampilkan native permission prompt
      // User tinggal klik "Allow" atau "Block"
    } catch (error) {
      console.error('Gagal mengaktifkan notifikasi:', error);
      alert('❌ Gagal mengaktifkan notifikasi. Silakan coba lagi.');
    }
  };

  // Panggil oneSignalLogout saat user logout
  const handleLogout = () => {
    setDropdownOpen(false);
    oneSignalLogout(); // <-- PENTING
    logout();
  };

  // Handler lainnya (tidak berubah)
  const navigateToPatients = () => {
    navigate('/patients');
  };
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  const getDoctorName = () => {
    if (user?.nm_dokter && user.nm_dokter.trim() !== '') {
      return user.nm_dokter;
    }
    return `Dr. ${user?.id_user || 'Unknown'}`;
  };
  const getUserInitial = () => {
    const name = getDoctorName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="dashboard-page">
      {/* Header (Tidak berubah) */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-small">
              <img 
                src="/images/logo/rs.png" 
                alt="RS Bumi Waras Logo" 
                className="logo-header-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="logo-header-fallback">🏥</span>';
                }}
              />
            </div>
            <div className="header-info">
              <h1 className="header-title">RS Bumi Waras</h1>
              <p className="header-subtitle">Sistem DPJP</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-dropdown" ref={dropdownRef}>
              <button 
                className="user-dropdown-trigger"
                onClick={toggleDropdown}
                aria-expanded={dropdownOpen}
              >
                <div className="user-avatar">
                  <span className="user-initial">
                    {getUserInitial()}
                  </span>
                </div>
                <div className="user-info-compact">
                  <p className="user-name-compact">
                    {getDoctorName()}
                  </p>
                  <p className="user-role-compact">DPJP</p>
                </div>
                <svg 
                  className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}
                  width="20" height="20" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      <span className="avatar-large">
                        {getUserInitial()}
                      </span>
                    </div>
                    <div className="dropdown-user-info">
                      <h4 className="dropdown-name">
                        {getDoctorName()}
                      </h4>
                      <p className="dropdown-role">Dokter Penanggung Jawab</p>
                      <p className="dropdown-code">Kode: {user?.kd_dokter || user?.id_user}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-actions">
                    <button 
                      className="dropdown-item profile-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="item-text">Profil Saya</span>
                    </button>
                    <button 
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <span className="item-text">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content (Tidak berubah) */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Welcome Section (Tidak berubah) */}
          <div className="welcome-section">
            <h2 className="welcome-title">
              Selamat Datang, {getDoctorName()}
            </h2>
            <p className="welcome-text">
              Pantau data pasien rawat inap dengan mudah dan efisien
            </p>
          </div>

          {/* MENU CARDS SECTION */}
          <div className="menu-cards-section">
            <h3 className="section-title">📋 Menu Utama</h3>
            
            <div className="menu-cards-grid">
              
              {/* Data Pasien Card (Tidak berubah) */}
              <div className="menu-card primary" onClick={navigateToPatients}>
                <div className="menu-card-header">
                  <div className="menu-card-icon">👥</div>
                  <div className="menu-card-badge">Utama</div>
                </div>
                <div className="menu-card-content">
                  <h4 className="menu-card-title">Data Pasien</h4>
                  <p className="menu-card-description">
                    Kelola daftar pasien rawat inap DPJP Anda
                  </p>
                </div>
                <div className="menu-card-footer">
                  <span className="menu-card-action">Buka →</span>
                </div>
              </div>

              {/* Notifikasi Card */}
              <div 
                className="menu-card secondary" 
                onClick={handleEnableNotifications}
                style={{ cursor: isPermissionDenied ? 'not-allowed' : 'pointer', opacity: isPermissionDenied ? 0.7 : 1 }}
              >
                <div className="menu-card-header">
                  <div className="menu-card-icon">🔔</div>
                  <div className="menu-card-badge">Utility</div>
                </div>
                <div className="menu-card-content">
                  <h4 className="menu-card-title">Notifikasi</h4>
                  <p className="menu-card-description">
                    Atur push notifications dan alert sistem
                  </p>
                  {isPermissionDenied && (
                    <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px', fontWeight: '500' }}>
                      ⚠️ Permission ditolak. Reset di browser settings untuk mengaktifkan.
                    </p>
                  )}
                </div>
                <div className="menu-card-footer">
                  <span className="menu-card-action">
                    {notificationLoading ? (
                      <span>⏳ Memproses...</span>
                    ) : isSubscribed ? (
                      <span>✅ Aktif</span>
                    ) : isPermissionDenied ? (
                      <span>⛔ Ditolak</span>
                    ) : (
                      <span>🔔 Aktifkan →</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Quick Stats Card (Tidak berubah) */}
              <div className="menu-card info">
                <div className="menu-card-header">
                  <div className="menu-card-icon">📈</div>
                  <div className="menu-card-badge">Info</div>
                </div>
                <div className="menu-card-content">
                  <h4 className="menu-card-title">Statistik Hari Ini</h4>
                  
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-number">
                        {statsLoading ? '...' : (statsError ? '!' : dashboardStats.pasienAktif)}
                      </span>
                      <span className="stat-label">Pasien Aktif</span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-number">
                        {statsLoading ? '...' : (statsError ? '!' : dashboardStats.pasienBaru)}
                      </span>
                      <span className="stat-label">Pasien Baru</span>
                    </div>

                    <div className="stat-item">
                      <span className="stat-number">
                        {statsLoading ? '...' : (statsError ? '!' : dashboardStats.visiteHariIni)}
                      </span>
                      <span className="stat-label">Visite Selesai</span>
                    </div>
                  </div>
                  
                  {statsError && (
                    <p className="stats-error-text">Gagal memuat data</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer (Tidak berubah) */}
      <footer className="dashboard-footer">
        <p>&copy; 2025 RS Bumi Waras - Sistem DPJP v1.0.0</p>
      </footer>
    </div>
  );
}

export default Dashboard;