// src/components/NotificationComponent.js
import React from 'react';
import useFirebaseMessaging from '../hooks/useFirebaseMessaging';
import './NotificationComponent.css';

const NotificationComponent = () => {
  const {
    token,
    notification,
    isPermissionGranted,
    loading,
    error,
    isSupported,
    requestPermission,
    clearNotification
  } = useFirebaseMessaging();

  // Jika browser tidak support
  if (!isSupported) {
    return (
      <div className="notification-unsupported">
        <div className="unsupported-icon">❌</div>
        <div className="unsupported-content">
          <h4>Browser Tidak Mendukung</h4>
          <p>Browser Anda tidak mendukung push notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-component">
      {/* Header */}
      <div className="notification-header">
        <div className="notification-icon">🔔</div>
        <div className="notification-title-section">
          <h3 className="notification-title">Push Notifications</h3>
          <p className="notification-subtitle">
            Terima notifikasi real-time tentang pasien dan jadwal
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="notification-status">
        <div className="status-indicator">
          <div className={`status-dot ${isPermissionGranted ? 'active' : 'inactive'}`}></div>
          <span className="status-text">
            {isPermissionGranted ? 'Aktif' : 'Tidak Aktif'}
          </span>
        </div>

        {!isPermissionGranted && (
          <button
            onClick={requestPermission}
            disabled={loading}
            className="enable-button"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Mengaktifkan...
              </>
            ) : (
              <>
                <span className="button-icon">🔔</span>
                Aktifkan Notifikasi
              </>
            )}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="notification-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <strong>Terjadi Kesalahan:</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Success */}
      {isPermissionGranted && !error && (
        <div className="notification-success">
          <div className="success-icon">✅</div>
          <div className="success-content">
            <strong>Notifikasi Aktif!</strong>
            <p>Anda akan menerima update real-time tentang pasien, jadwal, dan informasi penting.</p>
          </div>
        </div>
      )}

      {/* Current Notification */}
      {notification && (
        <div className="current-notification">
          <div className="current-notification-header">
            <div className="current-notification-icon">📨</div>
            <h4 className="current-notification-title">
              {notification.notification?.title || 'Notifikasi Baru'}
            </h4>
            <button
              onClick={clearNotification}
              className="close-notification"
            >
              ×
            </button>
          </div>
          <div className="current-notification-body">
            {notification.notification?.body || 'Tidak ada pesan'}
          </div>
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div className="current-notification-data">
              <strong>Data:</strong>
              <pre>{JSON.stringify(notification.data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Features Info */}
      <div className="notification-features">
        <div className="feature-grid">
          <div className="feature-item">
            <div className="feature-icon">📱</div>
            <div className="feature-text">
              <strong>Update Pasien</strong>
              <p>Status kondisi, hasil lab, perubahan treatment</p>
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">⏰</div>
            <div className="feature-text">
              <strong>Reminder Jadwal</strong>
              <p>Jadwal visite, konsultasi, meeting</p>
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">🚨</div>
            <div className="feature-text">
              <strong>Alert Darurat</strong>
              <p>Kondisi kritis, situasi mendesak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info (development only) */}
      {token && process.env.NODE_ENV === 'development' && (
        <div className="notification-debug">
          <details>
            <summary>🔧 Debug Info (Development)</summary>
            <div className="debug-info">
              <strong>FCM Token:</strong>
              <textarea
                readOnly
                value={token}
                className="debug-token-textarea"
              />
              <p className="debug-note">
                Token ini digunakan untuk mengirim notifikasi ke device ini.
              </p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default NotificationComponent;
