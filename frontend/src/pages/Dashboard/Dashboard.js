// src/pages/Dashboard/Dashboard.js
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import useFirebaseMessaging from '../../hooks/useFirebaseMessaging'; // ✅ 1. Import hook
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ 2. Gunakan hook untuk mendapatkan fungsi dan status
  const { 
    requestPermission, 
    isPermissionGranted, 
    loading: notificationLoading // Ganti nama 'loading' agar tidak bentrok jika ada state loading lain
  } = useFirebaseMessaging();

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

  // ✅ 3. Buat fungsi handler untuk kartu notifikasi
  const handleEnableNotifications = async () => {
    // Jika notifikasi sudah diizinkan, beri tahu pengguna dan jangan lakukan apa-apa.
    if (isPermissionGranted) {
      alert('Notifikasi sudah aktif di browser ini.');
      return;
    }

    try {
      // Panggil fungsi inti dari hook Anda
      await requestPermission();
      alert('Terima kasih! Notifikasi berhasil diaktifkan. Anda akan menerima notifikasi jika ada update.');
    } catch (error) {
      console.error('Gagal mengaktifkan notifikasi:', error);
      // Beri tahu pengguna jika mereka menolak izin
      if (error.message && error.message.includes('denied')) {
        alert('Anda menolak izin notifikasi. Anda bisa mengubahnya nanti di pengaturan browser.');
      } else {
        alert('Gagal mengaktifkan notifikasi. Silakan coba lagi.');
      }
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const navigateToPatients = () => {
    navigate('/patients');
  };

  // Kita tidak lagi menggunakan fungsi ini, tapi biarkan saja jika dibutuhkan di tempat lain
  const navigateToNotifications = () => {
    navigate('/notifications');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Helper function untuk get nama dokter yang benar
  const getDoctorName = () => {
    if (user?.nm_dokter && user.nm_dokter.trim() !== '') {
      return user.nm_dokter;
    }
    return `Dr. ${user?.id_user || 'Unknown'}`;
  };

  // Get initial untuk avatar
  const getUserInitial = () => {
    const name = getDoctorName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
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
          
          {/* User Dropdown Menu - Top Right */}
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
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>

              {/* Dropdown Menu */}
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
          {/* Welcome Section */}
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
              
              {/* Data Pasien Card */}
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
                onClick={handleEnableNotifications} // ✅ 4. Hubungkan handler ke kartu
                style={{ cursor: 'pointer' }} // Menambahkan indikator visual bahwa kartu bisa diklik
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
                    {/* ✅ 5. Beri feedback visual berdasarkan status */}
                    {notificationLoading ? 'Memproses...' : (isPermissionGranted ? 'Sudah Aktif ✓' : 'Aktifkan →')}
                  </span>
                </div>
              </div>

              {/* Quick Stats Card - Info only */}
              <div className="menu-card info">
                <div className="menu-card-header">
                  <div className="menu-card-icon">📈</div>
                  <div className="menu-card-badge">Info</div>
                </div>
                <div className="menu-card-content">
                  <h4 className="menu-card-title">Statistik Hari Ini</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-number">12</span>
                      <span className="stat-label">Pasien Aktif</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">5</span>
                      <span className="stat-label">Visite Hari Ini</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>&copy; 2025 RS Bumi Waras - Sistem DPJP v1.0.0</p>
      </footer>
    </div>
  );
}

export default Dashboard;