// src/firebase/firebaseConfig.js - Update yang sudah ada
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// ✅ Complete Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// ✅ VAPID Key for push notifications
export const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

// Validate configuration
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key]);

if (missingConfig.length > 0) {
  console.error('❌ Missing Firebase config:', missingConfig);
  throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
}

if (!vapidKey) {
  console.error('❌ Missing VAPID key');
  throw new Error('Missing REACT_APP_FIREBASE_VAPID_KEY in environment variables');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Messaging dengan improved error handling  
let messaging = null;
const initializeMessaging = async () => {
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const messagingSupported = await isSupported();
      
      if (messagingSupported) {
        messaging = getMessaging(app);
        console.log('✅ Firebase messaging initialized successfully');
        return messaging;
      } else {
        console.warn('⚠️ Firebase messaging not supported in this browser');
        return null;
      }
    }
  } catch (error) {
    console.error('❌ Firebase messaging initialization failed:', error);
    return null;
  }
};

// Auto initialize
initializeMessaging();

export { messaging, initializeMessaging };
export default app;
