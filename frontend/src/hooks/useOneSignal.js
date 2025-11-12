// src/hooks/useOneSignal.js
import { useState, useEffect, useCallback } from 'react';

// Dapatkan OneSignal SDK dari window. 
const OneSignal = window.OneSignal || [];

// ✅ Ambil App ID dari .env (Ini sudah benar)
const oneSignalAppId = process.env.REACT_APP_ONESIGNAL_APP_ID;

if (!oneSignalAppId) {
  console.error("Error: REACT_APP_ONESIGNAL_APP_ID tidak ditemukan di file .env Anda.");
}

const useOneSignal = () => {
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  // Inisialisasi OneSignal
  useEffect(() => {
    OneSignal.push(() => {
      console.log("OneSignal SDK mulai inisialisasi...");
      OneSignal.init({
        
        appId: oneSignalAppId, // <-- Sudah benar
        
        // Cek apakah Anda masih menggunakan sw.js kustom
        // Jika ya, baris ini harus ada:
        serviceWorkerPath: "sw.js", 
        // Jika Anda kembali ke default, hapus baris di atas
        
        allowLocalhostAsSecureOrigin: true,
        autoResubscribe: true,
        notifyButton: {
          enable: false,
        },
      }).then(() => {
        console.log('✅ OneSignal SDK Inisialisasi Selesai.');
        setLoading(false);
        
        updateSubscriptionStatus();
        updatePermissionStatus();

        OneSignal.on('subscriptionChange', updateSubscriptionStatus);
        OneSignal.on('notificationPermissionChange', updatePermissionStatus);
      });
    });
  }, []); // [] = Hanya berjalan sekali

  // Fungsi untuk update status langganan
  const updateSubscriptionStatus = async () => {
    OneSignal.push(async () => {
      const isSubscribed = await OneSignal.isPushNotificationsEnabled();
      setIsSubscribed(isSubscribed);
    });
  };
  
  // Fungsi untuk update status izin
  const updatePermissionStatus = async () => {
    OneSignal.push(async () => {
      const permission = await OneSignal.getNotificationPermission();
      setIsPermissionDenied(permission === 'denied');
    });
  };

  // Fungsi untuk meminta izin (memunculkan pop-up)
  const requestPermission = useCallback(async () => {
    setLoading(true);
    try {
      await OneSignal.push(async () => {
        await OneSignal.Slidedown.promptPush();
      });
    } catch (error) {
      console.error("Gagal meminta izin:", error);
      updatePermissionStatus();
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FUNGSI KUNCI (PERBAIKAN)
  const login = useCallback((externalUserId) => {
    if (!externalUserId) return;
    console.log(`OneSignal: Menghubungkan user ${externalUserId}`);
    
    // PERBAIKAN: Gunakan 'setExternalUserId', bukan 'login'
    // Dibungkus 'push' untuk memastikan SDK sudah init
    OneSignal.push(() => {
      OneSignal.setExternalUserId(externalUserId);
    });
  }, []);

  // ✅ FUNGSI KUNCI (PERBAIKAN)
  const logout = useCallback(() => {
    console.log("OneSignal: Logout user");
    
    // PERBAIKAN: Gunakan 'removeExternalUserId', bukan 'logout'
    // Dibungkus 'push' untuk memastikan SDK sudah init
    OneSignal.push(() => {
      OneSignal.removeExternalUserId();
    });
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