import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Close dropdown when clicking outside
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
          
          {/* ✅ User Dropdown Menu - Top Right */}
          <div className="header-right">
            <div className="user-dropdown" ref={dropdownRef}>
              <button 
                className="user-dropdown-trigger"
                onClick={toggleDropdown}
                aria-expanded={dropdownOpen}
              >
                <div className="user-avatar">
                  <span className="user-initial">
                    {(user?.nm_dokter || user?.id_user || 'D').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="user-info-compact">
                  <p className="user-name-compact">
                    {user?.nm_dokter || `Dr. ${user?.id_user}`}
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

              {/* ✅ Dropdown Menu */}
              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      <span className="avatar-large">
                        {(user?.nm_dokter || user?.id_user || 'D').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="dropdown-user-info">
                      <h4 className="dropdown-name">
                        {user?.nm_dokter || `Dr. ${user?.id_user}`}
                      </h4>
                      <p className="dropdown-role">Dokter Penanggung Jawab</p>
                      <p className="dropdown-code">Kode: {user?.kd_dokter}</p>
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
              Selamat Datang, {user?.nm_dokter || `Dr. ${user?.id_user}`}
            </h2>
            <p className="welcome-text">
              Kelola data pasien rawat inap dengan mudah dan efisien
            </p>
          </div>

          {/* Single Main Action - Data Pasien Only */}
          <div className="quick-actions">
            <h3 className="section-title">Menu Utama</h3>
            <div className="actions-grid-single">
              
              <div className="action-card primary" onClick={navigateToPatients}>
                <div className="action-icon">👥</div>
                <h4 className="action-title">Data Pasien Rawat Inap</h4>
                <p className="action-description">
                  Lihat dan kelola daftar pasien rawat inap DPJP Anda
                </p>
                <div className="action-arrow">→</div>
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
