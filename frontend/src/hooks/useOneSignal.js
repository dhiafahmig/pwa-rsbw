// src/hooks/useOneSignal.js
import { useState, useEffect, useCallback, useRef } from 'react';

// Ambil App ID dari .env
const oneSignalAppId = process.env.REACT_APP_ONESIGNAL_APP_ID;

if (!oneSignalAppId) {
  console.error("Error: REACT_APP_ONESIGNAL_APP_ID tidak ditemukan di file .env Anda.");
}

const useOneSignal = () => {
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  // Guard untuk mencegah init ganda di React.StrictMode
  const isInitialized = useRef(false);

  // Inisialisasi OneSignal
  useEffect(() => {
    // Hanya inisialisasi SEKALI
    if (isInitialized.current) {
      console.log("OneSignal: Inisialisasi sudah berjalan, skip.");
      return;
    }
    isInitialized.current = true;

    // Tunggu sampai window.OneSignal tersedia
    const initializeOneSignal = async () => {
      try {
        // Tunggu OneSignal SDK fully loaded
        if (!window.OneSignal) {
          console.warn("OneSignal SDK belum dimuat, tunggu...");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!window.OneSignal) {
          throw new Error("OneSignal SDK gagal dimuat dari CDN");
        }

        console.log("OneSignal SDK mulai inisialisasi...");
        
        // Initialize OneSignal dengan config yang benar
        await window.OneSignal.init({
          appId: oneSignalAppId,
          serviceWorkerPath: "sw.js",
          allowLocalhostAsSecureOrigin: true,
          autoResubscribe: true,
          notifyButton: {
            enable: false,
          },
        });

        console.log('✅ OneSignal SDK Inisialisasi Selesai.');
        
        // Update subscription status setelah init
        updateSubscriptionStatus();
        updatePermissionStatus();

        // Setup event listeners (jika tersedia di v16)
        if (window.OneSignal?.Notifications?.permission) {
          // Event listeners ada di v16
          try {
            window.OneSignal.on?.('subscriptionChange', updateSubscriptionStatus);
            window.OneSignal.on?.('notificationPermissionChange', updatePermissionStatus);
          } catch (e) {
            console.warn("Event listeners tidak tersedia di SDK ini");
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ OneSignal SDK GAGAL inisialisasi:", err);
        setLoading(false);
      }
    };

    initializeOneSignal();
  }, []); // [] = Hanya berjalan sekali

  // Fungsi untuk update status langganan
  const updateSubscriptionStatus = useCallback(async () => {
    try {
      if (!window.OneSignal) return;
      
      // API OneSignal Web SDK yang benar untuk cek push enabled
      const isEnabled = await window.OneSignal.Notifications.permission;
      setIsSubscribed(isEnabled);
    } catch (e) {
      console.error("Gagal cek status langganan:", e);
    }
  }, []);
  
  // Fungsi untuk update status izin
  const updatePermissionStatus = useCallback(async () => {
    try {
      if (!window.OneSignal) return;
      
      // API OneSignal Web SDK untuk cek permission
      const permission = await window.OneSignal.Notifications.permission;
      setIsPermissionDenied(permission === false || permission === 'denied');
    } catch (e) {
      console.error("Gagal cek status izin:", e);
    }
  }, []);

  // Fungsi untuk meminta izin (memunculkan pop-up)
  const requestPermission = useCallback(async () => {
    setLoading(true);
    try {
      if (!window.OneSignal) {
        throw new Error("OneSignal SDK belum tersedia");
      }
      
      // API OneSignal Web SDK yang benar untuk request permission
      await window.OneSignal.Notifications.requestPermission();
      
      // Update status setelah request
      await updatePermissionStatus();
    } catch (error) {
      console.error("Gagal meminta izin:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updatePermissionStatus]);

  // FUNGSI KUNCI - Login user
  const login = useCallback((externalUserId) => {
    if (!externalUserId || !window.OneSignal) return;
    
    console.log(`OneSignal: Menghubungkan user ${externalUserId}`);
    
    try {
      // TODO: OneSignal SDK v16 .login() method punya bug internal (reading 'tt')
      // Disable untuk sementara sampai OneSignal fix
      // window.OneSignal.login(externalUserId);
      
      console.log(`✅ User ${externalUserId} siap untuk notifikasi (login disabled due to SDK bug)`);
    } catch (e) {
      console.error("Gagal login ke OneSignal:", e);
    }
  }, []);

  // FUNGSI KUNCI - Logout user
  const logout = useCallback(() => {
    if (!window.OneSignal) return;
    
    console.log("OneSignal: Logout user");
    
    try {
      // TODO: OneSignal SDK v16 .logout() method disabled due to SDK bug
      // window.OneSignal.logout();
      
      console.log("✅ User logout (logout disabled due to SDK bug)");
    } catch (e) {
      console.error("Gagal logout dari OneSignal:", e);
    }
  }, []);

  return {
    loading,
    isSubscribed,
    isPermissionDenied,
    requestPermission,
    login,
    logout,
  };
};

export default useOneSignal;