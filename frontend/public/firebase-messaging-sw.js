// public/firebase-messaging-sw.js - Update yang sudah ada
importScripts('https://www.gstatic.com/firebasejs/10.11.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging-compat.js');

// ✅ Dynamic config handling
let firebaseApp = null;
let messaging = null;

console.log('🚀 Firebase messaging service worker loaded');

// Listen untuk config dari main thread
self.addEventListener('message', (event) => {
    console.log('📨 Service worker received message:', event.data);
    
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        const config = event.data.config;
        console.log('🔧 Initializing Firebase with received config');
        
        try {
            // Initialize Firebase
            firebaseApp = firebase.initializeApp(config);
            messaging = firebase.messaging();
            
            console.log('✅ Firebase initialized in service worker');
            
            // Setup background message handler
            messaging.onBackgroundMessage(function(payload) {
                console.log('📨 Background message received:', payload);
                
                const notificationTitle = payload.notification?.title || 'RS Bumi Waras';
                const notificationOptions = {
                    body: payload.notification?.body || 'You have a new message',
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'rsbw-notification',
                    data: payload.data,
                    requireInteraction: true
                };

                self.registration.showNotification(notificationTitle, notificationOptions);
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize Firebase in service worker:', error);
        }
    }
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    console.log('📱 Notification clicked');
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(function(clientList) {
                if (clientList.length > 0) {
                    return clientList[0].focus();
                }
                return clients.openWindow('/');
            })
    );
});
    