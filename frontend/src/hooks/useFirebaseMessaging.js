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

  // Check initial permission status
  useEffect(() => {
    const checkInitialPermission = () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setIsSupported(true);
        
        const currentPermission = Notification.permission;
        setIsPermissionGranted(currentPermission === 'granted');
        
        // Jika sudah granted, setup listener langsung
        if (currentPermission === 'granted' && messaging) {
          setupForegroundMessageListener();
        }
      } else {
        setIsSupported(false);
      }
    };

    checkInitialPermission();
  }, []);

  // Setup foreground message listener
  const setupForegroundMessageListener = useCallback(() => {
    if (!messaging) return;

    console.log('📡 Setting up foreground message listener');
    
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📨 Foreground message received:', payload);
      setNotification(payload);
      
      // Show browser notification untuk messages yang diterima saat app active
      if (payload.notification) {
        showBrowserNotification(payload.notification, payload.data);
      }
    });

    return unsubscribe;
  }, [messaging]);

  // Show browser notification
  const showBrowserNotification = (notification, data = {}) => {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'rsbw-notification',
        data: data,
        requireInteraction: true
      });
    }
  };

  // Register service worker
  const registerServiceWorker = async () => {
    try {
      console.log('🔄 Registering service worker');
      
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' }
        );
        
        console.log('✅ Service Worker registered:', registration);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        
        return registration;
      } else {
        throw new Error('Service Worker not supported');
      }
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      throw error;
    }
  };

  // Request notification permission
  const requestPermission = async () => {
    if (!isSupported) {
      throw new Error('Notifications not supported in this browser');
    }

    if (!messaging) {
      throw new Error('Firebase messaging not initialized');
    }

    if (!vapidKey) {
      throw new Error('VAPID key not configured');
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Register service worker
      console.log('🔄 Step 1: Registering service worker');
      const registration = await registerServiceWorker();

      // Step 2: Request notification permission
      console.log('🔄 Step 2: Requesting notification permission');
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        setIsPermissionGranted(true);

        // Step 3: Get FCM token
        console.log('🔄 Step 3: Getting FCM token');
        const currentToken = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });

        if (currentToken) {
          console.log('✅ FCM token generated:', currentToken);
          setToken(currentToken);

          // Step 4: Setup message listener
          console.log('🔄 Step 4: Setting up message listener');
          setupForegroundMessageListener();

          // Step 5: Send token to backend (optional)
          await sendTokenToServer(currentToken);

          return currentToken;
        } else {
          throw new Error('Failed to generate FCM token');
        }
      } else {
        throw new Error('Notification permission denied');
      }
    } catch (err) {
      console.error('❌ Error requesting permission:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Send token to server
  const sendTokenToServer = async (fcmToken) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userdata') || '{}');
      const authToken = localStorage.getItem('authtoken');
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
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
        console.log('✅ Token sent to server:', result);
      } else {
        console.warn('⚠️ Failed to send token to server:', response.status);
      }
    } catch (err) {
      console.error('❌ Error sending token to server:', err);
      // Don't throw error - FCM still works without backend
    }
  };

  // Clear current notification
  const clearNotification = () => {
    setNotification(null);
  };

  // Get current token (if already exists)
  const getCurrentToken = async () => {
    if (!messaging || !vapidKey) return null;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const currentToken = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });
        
        if (currentToken) {
          setToken(currentToken);
          return currentToken;
        }
      }
    } catch (err) {
      console.error('❌ Error getting current token:', err);
    }
    
    return null;
  };

  return {
    // State
    token,
    notification,
    isPermissionGranted,
    loading,
    error,
    isSupported,
    
    // Actions
    requestPermission,
    clearNotification,
    getCurrentToken,
    sendTokenToServer
  };
};

export default useFirebaseMessaging;
