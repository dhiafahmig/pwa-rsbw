import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ CRITICAL: Register service worker (NOT unregister!)
// This is the key difference from video!
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('✅ PWA: Service worker registered successfully');
  },
  onUpdate: (registration) => {
    console.log('🔄 PWA: New content available');
    // You can add update notification here
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
