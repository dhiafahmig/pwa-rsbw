// src/hooks/useFirebaseMessaging.js
import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, vapidKey } from '../firebase/firebaseConfig';

const useFirebaseMessaging = () => {
  // State management
  const [token, setToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  // Fungsi untuk mengambil atau me-refresh token FCM
  const fetchAndSetToken = useCallback(async () => {
    if (!messaging || !vapidKey) {
      console.warn("⚠️ Firebase Messaging or VAPID key is not available.");
      return null;
    }

    try {
      console.log('🔄 Getting/Refreshing FCM token...');
      const registration = await navigator.serviceWorker.ready; // Menunggu service worker siap
      const currentToken = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      });
      
      if (currentToken) {
        console.log('✅ FCM token available:', currentToken);
        setToken(currentToken);
        return currentToken;
      } else {
        console.warn("⚠️ Failed to get FCM token. User may need to grant permission again.");
        return null;
      }
    } catch (err) {
      console.error('❌ Error getting/refreshing FCM token:', err);
      setError('Gagal mendapatkan token notifikasi. Coba segarkan halaman atau aktifkan ulang.');
      return null;
    }
  }, []);

  // useEffect untuk setup awal: memeriksa dukungan browser dan izin yang sudah ada
  useEffect(() => {
    const setup = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
        setIsSupported(true);
        const currentPermission = Notification.permission;
        
        if (currentPermission === 'granted') {
          setIsPermissionGranted(true);
          const currentToken = await fetchAndSetToken();
          // Secara proaktif sinkronisasi token ke server jika sudah ada
          if (currentToken) {
             sendTokenToServer(currentToken, false); // `false` agar tidak menampilkan loading
          }
        }
      } else {
        setIsSupported(false);
      }
    };
    setup();
  }, [fetchAndSetToken]); // Bergantung pada fetchAndSetToken

  // useEffect untuk memasang listener notifikasi HANYA jika izin sudah diberikan
  useEffect(() => {
    if (isPermissionGranted && messaging) {
      console.log('📡 Izin diberikan, memasang listener notifikasi foreground...');
      
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('📨 Foreground message received:', payload);
        setNotification(payload);
        if (payload.notification) {
          showBrowserNotification(payload.notification, payload.data);
        }
      });

      // Cleanup function: melepaskan listener saat komponen tidak lagi digunakan
      return () => {
        console.log('🔌 Melepaskan listener notifikasi foreground.');
        unsubscribe();
      };
    }
  }, [isPermissionGranted]); // Efek ini akan berjalan setiap kali `isPermissionGranted` berubah


  // Fungsi untuk meminta izin dari pengguna
  const requestPermission = async () => {
    if (!isSupported || !messaging) {
      setError('Notifikasi tidak didukung di browser ini.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Minta izin pop-up ke pengguna
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Izin notifikasi diberikan oleh pengguna');
        setIsPermissionGranted(true); // Ini akan memicu useEffect di atas untuk memasang listener

        // Ambil token baru setelah izin diberikan
        const newToken = await fetchAndSetToken();
        if (newToken) {
          // Kirim token baru ke server
          await sendTokenToServer(newToken, true);
        } else {
          throw new Error('Gagal mendapatkan token setelah izin diberikan.');
        }
      } else {
        throw new Error('Izin notifikasi ditolak oleh pengguna.');
      }
    } catch (err) {
      console.error('❌ Error saat meminta izin:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Fungsi untuk mengirim token ke backend Anda
  const sendTokenToServer = async (fcmToken, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_data') || '{}');
      const authToken = localStorage.getItem('auth_token');
      
      if (!authToken) {
        console.warn("⚠️ Token otentikasi tidak ditemukan. Tidak bisa mengirim FCM token ke server.");
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token: fcmToken,
          user_id: userInfo.id_user || null,
          kd_dokter: userInfo.kd_dokter || null,
          device_type: 'web',
          user_agent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Token berhasil dikirim ke server:', result);
      } else {
        const errorBody = await response.text();
        console.warn(`⚠️ Gagal mengirim token ke server. Status: ${response.status}. Body: ${errorBody}`);
      }
    } catch (err) {
      console.error('❌ Error saat mengirim token ke server:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fungsi untuk menampilkan notifikasi browser asli
  const showBrowserNotification = (notification, data = {}) => {
    if (Notification.permission === 'granted') {
      const options = {
        body: notification.body,
        icon: '/logo192.png', // Pastikan path icon benar
        badge: '/logo72.png',  // Pastikan path badge benar
        tag: 'rsbw-notification', // Mengganti notifikasi lama dengan tag yang sama
        data: data,
        requireInteraction: true, // Notifikasi tidak akan hilang sampai di-klik atau ditutup
      };
      new Notification(notification.title, options);
    }
  };

  // Fungsi untuk membersihkan state notifikasi di UI
  const clearNotification = () => {
    setNotification(null);
  };
  
  return {
    token,
    notification,
    isPermissionGranted,
    loading,
    error,
    isSupported,
    requestPermission,
    clearNotification,
  };
};

export default useFirebaseMessaging;