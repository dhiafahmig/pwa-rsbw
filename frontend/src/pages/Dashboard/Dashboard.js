// src/pages/Dashboard/Dashboard.js
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import useFirebaseMessaging from '../../hooks/useFirebaseMessaging';
import { patientService } from '../../services/patient'; 
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { 
    requestPermission, 
    isPermissionGranted, 
    loading: notificationLoading 
  } = useFirebaseMessaging();

  // ✅ PERUBAHAN: 1. Tambahkan 'pasienBaru' ke state
  const [dashboardStats, setDashboardStats] = useState({
    pasienAktif: 0,
    visiteHariIni: 0,
    pasienBaru: 0, // <-- DITAMBAHKAN
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Close dropdown when clicking outside
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

  // useEffect untuk mengambil data statistik
  useEffect(() => {
    const fetchDashboardStats = async () => {
      console.log('🔄 Memuat statistik dashboard...');
      setStatsLoading(true); 
      setStatsError(null);
      try {
        const result = await patientService.getPatients('all');
        if (result.success && result.data.cppt_summary) {
          const summary = result.data.cppt_summary;
          
          // ✅ PERUBAHAN: 2. Set state 'pasienBaru' dari summary
          setDashboardStats({
            pasienAktif: summary.total_pasien,
            visiteHariIni: summary.sudah_cppt_hari_ini,
            pasienBaru: summary.pasien_baru_hari_ini, // <-- DITAMBAHKAN
          });
          console.log('📊 Statistik dashboard dimuat:', summary);
        } else {
          throw new Error(result.message || 'Gagal mengambil data statistik');
        }
      } catch (error) {
        console.error("❌ Error fetching dashboard stats:", error);
        setStatsError(error.message);
        
        // ✅ PERUBAHAN: 3. Reset state 'pasienBaru' saat error
        setDashboardStats({ pasienAktif: 0, visiteHariIni: 0, pasienBaru: 0 }); 
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
    const intervalId = setInterval(fetchDashboardStats, 5 * 60 * 1000); 
    return () => clearInterval(intervalId); 
  }, []); 

  // Handler untuk notifikasi (tidak berubah)
  const handleEnableNotifications = async () => {
    if (isPermissionGranted) {
      alert('Notifikasi sudah aktif di browser ini.');
      return;
    }
    try {
      await requestPermission();
      alert('Terima kasih! Notifikasi berhasil diaktifkan.');
    } catch (error) {
      console.error('Gagal mengaktifkan notifikasi:', error);
      if (error.message && error.message.includes('denied')) {
        alert('Anda menolak izin notifikasi. Anda bisa mengubahnya nanti di pengaturan browser.');
      } else {
        alert('Gagal mengaktifkan notifikasi. Silakan coba lagi.');
      }
    }
  };

  // Handler lainnya (tidak berubah)
  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };
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
                      <span className="item-icon">👨‍⚕️</span>
                      <span className="item-text">Profil Saya</span>
                    </button>
                    <button 
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <span className="item-icon">🚪</span>
                      <span className="item-text">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Welcome Section (Tidak berubah) */}
          <div className="welcome-section">
            <h2 className="welcome-title">
              Selamat Datang, {getDoctorName()}
            </h2>
            <p className="welcome-text">
              Kelola data pasien rawat inap dengan mudah dan efisien
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

              {/* Notifikasi Card (Tidak berubah) */}
              <div 
                className="menu-card secondary" 
                onClick={handleEnableNotifications}
                style={{ cursor: 'pointer' }}
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
                </div>
                <div className="menu-card-footer">
                  <span className="menu-card-action">
                    {notificationLoading ? 'Memproses...' : (isPermissionGranted ? 'Sudah Aktif ✓' : 'Aktifkan →')}
                  </span>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="menu-card info">
                <div className="menu-card-header">
                  <div className="menu-card-icon">📈</div>
                  <div className="menu-card-badge">Info</div>
                </div>
                <div className="menu-card-content">
                  <h4 className="menu-card-title">Statistik Hari Ini</h4>
                  
                  {/* ✅ PERUBAHAN: 4. Tambahkan item "Pasien Baru" */}
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-number">
                        {statsLoading ? '...' : (statsError ? '!' : dashboardStats.pasienAktif)}
                      </span>
                      <span className="stat-label">Pasien Aktif</span>
                    </div>

                    {/* ITEM BARU */}
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