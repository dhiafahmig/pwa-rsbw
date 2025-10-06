import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './PWAInstall.css';

function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});
  const location = useLocation();

  useEffect(() => {
    // ✅ Detect device and browser
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isChrome = /Chrome/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isSamsungBrowser = /SamsungBrowser/.test(userAgent);
      const isEdge = /Edg/.test(userAgent);
      
      return {
        isIOS,
        isSafari,
        isChrome,
        isAndroid,
        isSamsungBrowser,
        isEdge,
        isMobile: /Mobi|Android/i.test(userAgent),
        userAgent
      };
    };

    const device = detectDevice();
    setDeviceInfo(device);
    console.log('📱 Device detected:', device);

    // ✅ Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkIfInstalled()) {
      console.log('📱 PWA already installed');
      return;
    }

    // ✅ Handle different platforms
    if (device.isIOS && device.isSafari) {
      // iOS Safari - Manual instructions
      console.log('📱 iOS Safari detected - showing manual install');
      setTimeout(() => setShowInstallPrompt(true), 5000);
    } else if (device.isChrome || device.isSamsungBrowser || device.isEdge) {
      // Chrome/Samsung/Edge - beforeinstallprompt
      console.log('📱 Chrome/Samsung/Edge detected - waiting for prompt');
      
      const handler = (e) => {
        console.log('📱 PWA: beforeinstallprompt fired on mobile!', e);
        e.preventDefault();
        setDeferredPrompt(e);
        
        // Show immediately on mobile (don't delay)
        setTimeout(() => setShowInstallPrompt(true), 2000);
      };

      window.addEventListener('beforeinstallprompt', handler);
      
      // ✅ Fallback: Show manual prompt if beforeinstallprompt doesn't fire
      setTimeout(() => {
        if (!deferredPrompt && device.isMobile) {
          console.log('📱 Fallback: Showing manual install for mobile');
          setShowInstallPrompt(true);
        }
      }, 10000);

      return () => window.removeEventListener('beforeinstallprompt', handler);
    } else {
      // Other browsers - show manual instructions
      console.log('📱 Other browser detected - showing manual install');
      setTimeout(() => setShowInstallPrompt(true), 5000);
    }

    // ✅ Listen for app installed
    const installedHandler = () => {
      console.log('✅ PWA: App installed on mobile');
      setIsInstalled(true);
      setShowInstallPrompt(false);
    };

    window.addEventListener('appinstalled', installedHandler);
    return () => window.removeEventListener('appinstalled', installedHandler);
  }, []);

  // ✅ Handle install for different platforms
  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome/Samsung/Edge - use prompt
      console.log('📱 Using native install prompt');
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('📱 User choice:', outcome);
        
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (error) {
        console.error('📱 Install error:', error);
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      // Manual instructions
      console.log('📱 Showing manual install instructions');
      setShowInstallPrompt(false);
      
      if (deviceInfo.isIOS) {
        showIOSInstructions();
      } else {
        showAndroidInstructions();
      }
    }
  };

  // ✅ iOS Manual Install Instructions
  const showIOSInstructions = () => {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
        background: rgba(0,0,0,0.8); z-index: 10000; 
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
      ">
        <div style="
          background: white; border-radius: 16px; padding: 24px; 
          max-width: 350px; text-align: center;
        ">
          <h3 style="margin: 0 0 16px 0; color: #059669;">📱 Install DPJP App</h3>
          <div style="font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            <p>1. Tap the <strong>Share</strong> button ⬆️</p>
            <p>2. Scroll down and tap <strong>"Add to Home Screen"</strong> ➕</p>
            <p>3. Tap <strong>"Add"</strong> to install</p>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: #059669; color: white; border: none; 
            padding: 12px 24px; border-radius: 8px; cursor: pointer;
          ">
            Got it!
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  // ✅ Android Manual Install Instructions
  const showAndroidInstructions = () => {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
        background: rgba(0,0,0,0.8); z-index: 10000; 
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
      ">
        <div style="
          background: white; border-radius: 16px; padding: 24px; 
          max-width: 350px; text-align: center;
        ">
          <h3 style="margin: 0 0 16px 0; color: #059669;">📱 Install DPJP App</h3>
          <div style="font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            <p>1. Tap browser <strong>Menu</strong> (⋮)</p>
            <p>2. Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></p>
            <p>3. Tap <strong>"Add"</strong> to install</p>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: #059669; color: white; border: none; 
            padding: 12px 24px; border-radius: 8px; cursor: pointer;
          ">
            Got it!
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // ✅ Don't show if conditions not met
  if (isInstalled || !showInstallPrompt || location.pathname === '/login') {
    return null;
  }

  if (sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  // ✅ Different UI for different platforms
  const isIOSManual = deviceInfo.isIOS && deviceInfo.isSafari;
  const hasNativePrompt = !!deferredPrompt;

  return (
    <div className="pwa-install-banner">
      <div className="pwa-install-content">
        <div className="pwa-install-icon">
          {isIOSManual ? '🍎' : '📱'}
        </div>
        <div className="pwa-install-text">
          <h4>Install DPJP App</h4>
          <p>
            {isIOSManual 
              ? 'Add to Home Screen untuk akses cepat'
              : hasNativePrompt 
                ? 'Install app untuk akses cepat'
                : 'Add to Home Screen dari browser menu'
            }
          </p>
        </div>
        <div className="pwa-install-actions">
          <button onClick={handleInstall} className="pwa-install-btn">
            {hasNativePrompt ? '📲 Install' : '📖 How to'}
          </button>
          <button onClick={handleDismiss} className="pwa-dismiss-btn">
            ✕
          </button>
        </div>
      </div>
      
      {/* ✅ Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          fontSize: '10px', opacity: 0.7, marginTop: '8px',
          padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px'
        }}>
          Device: {deviceInfo.isMobile ? 'Mobile' : 'Desktop'} | 
          Browser: {deviceInfo.isChrome ? 'Chrome' : deviceInfo.isSafari ? 'Safari' : 'Other'} | 
          Prompt: {hasNativePrompt ? 'Available' : 'Manual'}
        </div>
      )}
    </div>
  );
}

export default PWAInstall;
