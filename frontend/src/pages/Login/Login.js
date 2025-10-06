import React, { useState } from 'react';
import { useAuth } from '../../services/auth';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    id_user: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_user || !formData.password) {
      setError('ID User dan Password wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(formData.id_user, formData.password);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          {/* ✅ Logo - Real Hospital Logo */}
          <div className="logo-section">
            <div className="logo-circle">
              <img 
                src="/images/logo/rs.png" 
                alt="RS Bumi Waras Logo" 
                className="logo-image"
                onError={(e) => {
                  // ✅ Fallback jika image tidak ditemukan
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="logo-icon-fallback">🏥</span>';
                }}
              />
            </div>
          </div>

          {/* Header */}
          <div className="header-section">
            <h1 className="main-title">RS Bumi Waras</h1>
            <h2 className="sub-title">Sistem DPJP</h2>
            <p className="description">Sistem Monitoring Rawat Inap</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="id_user" className="form-label">
                <span className="label-icon">👤</span>
                <span>ID User</span>
              </label>
              <input
                type="text"
                id="id_user"
                name="id_user"
                value={formData.id_user}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Masukkan ID User"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <span className="label-icon">🔒</span>
                <span>Password</span>
              </label>
              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input password-input"
                  placeholder="Masukkan Password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {/* ✅ Standard Password Icons */}
                  {showPassword ? (
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      {/* Eye Slash - Hide Password */}
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      {/* Eye - Show Password */}
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Sedang Login...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="footer-section">
            <p className="footer-text">Rumah Sakit Bumi Waras</p>
            <p className="version-text">Sistem Informasi Rawat Inap v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
