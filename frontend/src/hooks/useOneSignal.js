import { useState, useEffect, useCallback, useRef } from 'react';

// Ambil App ID dari environment variables
const oneSignalAppId = process.env.REACT_APP_ONESIGNAL_APP_ID;
if (!oneSignalAppId) {
  console.error("Error: REACT_APP_ONESIGNAL_APP_ID tidak ditemukan.");
}

// Konfigurasi OneSignal
const oneSignalConfig = {
  appId: oneSignalAppId,
  serviceWorkerPath: "sw.js", // Gunakan SW kustom
  autoResubscribe: true,
  notifyButton: {
    enable: false, // Nonaktifkan tombol bawaan
  },
};

// Izinkan localhost hanya saat development
if (process.env.NODE_ENV === 'development') {
  console.log("OneSignal: Menjalankan mode development, mengizinkan localhost.");
  oneSignalConfig.allowLocalhostAsSecureOrigin = true;
}

/**
 * Custom hook untuk mengelola OneSignal SDK (v16+).
 * Mengatasi inisialisasi, status, izin, dan login/logout
 * dengan perlindungan terhadap race condition.
 */
const useOneSignal = () => {
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  
  // PERBAIKAN 3: Gunakan Ref untuk menyimpan Promise inisialisasi
  // Ini adalah kunci untuk mencegah race condition
  const initPromise = useRef(null);
  const isInitialized = useRef(false);

  // --- Pengecekan Status Langganan (Dipindahkan ke atas) ---
  // Gunakan pushSubscriptionId untuk cek apakah user sudah subscribe
  // PENTING: Cek JUGA permission status, karena pushId bisa ada tapi permission denied
  const updateSubscriptionStatus = useCallback(async () => {
    try {
      // Jangan tunggu initPromise jika sudah siap (hindari circular dependency)
      if (!window.OneSignal?.User?.PushSubscription) {
        console.log("PushSubscription belum tersedia");
        setIsSubscribed(false);
        return;
      }

      // Cek permission browser DULU
      const hasPermission = "Notification" in window && Notification.permission === 'granted';
      
      // Cek apakah ada subscription ID
      const pushId = window.OneSignal.User.PushSubscription.id;
      
      // PENTING: Hanya count sebagai subscribed jika KEDUANYA ada:
      // 1. Ada push subscription ID
      // 2. Permission browser adalah 'granted'
      const isSubscribed = !!pushId && hasPermission;
      
      console.log(`Push subscription ID: ${pushId}, Browser permission: ${Notification.permission}, isSubscribed: ${isSubscribed}`);
      setIsSubscribed(isSubscribed);
    } catch (e) {
      console.error("Gagal cek status langganan:", e);
      setIsSubscribed(false);
    }
  }, []); // dependensi kosong karena initPromise adalah ref
  
  
  // --- Pengecekan Status Izin Notifikasi (Dipindahkan ke atas) ---
  // Gunakan browser Notifications API untuk cek permission
  const updatePermissionStatus = useCallback(async () => {
    try {
      // Jangan tunggu initPromise jika sudah siap (hindari circular dependency)
      if (!("Notification" in window)) {
        console.log("Browser tidak support Notification API");
        setIsPermissionDenied(true);
        return;
      }

      // Cek permission dari browser Notifications API
      const permission = Notification.permission;
      console.log(`Notification permission: ${permission}`);
      
      // Logika permission:
      // - 'granted' = user accept
      // - 'denied' = user reject (dan tidak bisa prompt lagi tanpa reset)
      // - 'default' = belum ditanya
      const isDenied = permission === 'denied';
      setIsPermissionDenied(isDenied);
      
      if (isDenied) {
        console.warn('⚠️ Notifikasi DENY - User perlu reset di browser settings');
      }
    } catch (e) {
      console.error("Gagal cek status izin:", e);
    }
  }, []); // dependensi kosong karena initPromise adalah ref

  // --- Inisialisasi ---
  useEffect(() => {
    // Cek dengan isInitialized.current (bukan initPromise.current)
    if (isInitialized.current) {
      console.log("OneSignal: Inisialisasi sudah berjalan, skip.");
      return;
    }
    
    isInitialized.current = true;

    const initializeOneSignal = async () => {
      try {
        // Tunggu SDK OneSignal (dari index.html) dimuat
        let retries = 0;
        while (!window.OneSignal && retries < 5) {
          console.warn(`OneSignal SDK belum dimuat, tunggu... (${retries + 1}/5)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }

        if (!window.OneSignal) {
          throw new Error("OneSignal SDK gagal dimuat dari CDN (di index.html)");
        }
        
        console.log("OneSignal SDK mulai inisialisasi...");
        console.log("OneSignal config:", oneSignalConfig);
        
        // Mulai inisialisasi
        await window.OneSignal.init(oneSignalConfig);
        console.log('✅ OneSignal SDK Inisialisasi Selesai.');
        
        // Panggil pengecekan status SETELAH init selesai
        // TIDAK perlu await karena kedua fungsi tidak bergantung pada initPromise
        updateSubscriptionStatus();
        updatePermissionStatus();

        // Tambahkan event listener untuk perubahan status
        // Event: subscriptionChange dipicu ketika push subscription berubah
        if (window.OneSignal?.User?.PushSubscription?.addEventListener) {
          window.OneSignal.User.PushSubscription.addEventListener('change', () => {
            console.log("🔔 Push subscription berubah, update status...");
            updateSubscriptionStatus();
          });
        }

        // Event: pushPermissionDidChange dipicu ketika permission browser berubah
        if (window.OneSignal?.Notifications?.addEventListener) {
          window.OneSignal.Notifications.addEventListener('change', () => {
            console.log("🔔 Notification permission berubah, update status...");
            updatePermissionStatus();
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ OneSignal SDK GAGAL inisialisasi:", err);
        setLoading(false);
      }
    };

    // Simpan promise inisialisasi ke dalam ref
    // Ini akan dieksekusi HANYA SEKALI
    initPromise.current = initializeOneSignal();
    
  }, []); // [] = Hanya berjalan sekali saat komponen mount

  
  // --- Meminta Izin (Soft Prompt) ---
  const requestPermission = useCallback(async () => {
    setLoading(true);
    try {
      // Tunggu init selesai sebelum panggil Slidedown
      if (initPromise.current) {
        await initPromise.current;
      }
      
      console.log("🔔 Meminta izin notifikasi...");
      
      // PENTING: Gunakan browser Notifications.requestPermission() untuk lebih reliable
      // daripada OneSignal.Slidedown (yang sering tidak muncul)
      if ("Notification" in window && Notification.permission !== 'granted') {
        console.log("� Menampilkan browser native permission prompt...");
        const permission = await Notification.requestPermission();
        console.log(`📱 User response: ${permission}`);
        
        // Tunggu sebentar untuk sistem update
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (Notification.permission === 'granted') {
        console.log("✅ Notifikasi sudah granted, subscribe ke push...");
      }
      
      // Update status setelah user membuat keputusan
      updatePermissionStatus();
      updateSubscriptionStatus();
      
    } catch (error) {
      console.error("❌ Gagal meminta izin:", error);
      // Update manual jika gagal
      updatePermissionStatus(); 
      updateSubscriptionStatus();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updatePermissionStatus, updateSubscriptionStatus]); // dependensi


  // --- Menghubungkan User (Login) ---
  const login = useCallback(async (externalUserId) => {
    // Tunggu init selesai
    if (initPromise.current) {
      await initPromise.current;
    }

    if (!externalUserId || !window.OneSignal?.login) {
      console.warn("OneSignal.login tidak tersedia atau ID user kosong");
      return;
    }
    
    console.log(`OneSignal: Menghubungkan user ${externalUserId}`);
    // Gunakan .login() (alias untuk .User.identify())
    window.OneSignal.login(externalUserId).catch(e => {
      console.error(`Gagal OneSignal.login(${externalUserId}):`, e);
    });
  }, []); // dependensi kosong karena initPromise adalah ref

  
  // --- Memutus Hubungan User (Logout) ---
  const logout = useCallback(async () => {
    // Tunggu init selesai
    if (initPromise.current) {
      await initPromise.current;
    }

    if (!window.OneSignal?.logout) {
      console.warn("OneSignal.logout tidak tersedia");
      return;
    }
    
    console.log("OneSignal: Logout user");
    // Gunakan .logout() (alias untuk .User.removeIdentifier())
    window.OneSignal.logout().catch(e => {
      console.error("Gagal OneSignal.logout:", e);
    });
  }, []); // dependensi kosong karena initPromise adalah ref

  // Nilai yang dikembalikan oleh hook
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