import React, { useState, useEffect } from 'react';
import { FiDownload, FiX, FiShare } from 'react-icons/fi';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already in standalone display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      return;
    }

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIos(ios);

    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini bar
      e.preventDefault();
      // Store event
      setDeferredPrompt(e);
      // Show prompt
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS Safari, we can show prompt since beforeinstallprompt doesn't fire on iOS Safari
    if (ios) {
      // Check if user has dismissed it before in this session
      const dismissed = sessionStorage.getItem('pwa_ios_prompt_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show prompt
    deferredPrompt.prompt();
    // Wait for response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    // Clear prompt event
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (isIos) {
      sessionStorage.setItem('pwa_ios_prompt_dismissed', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-bounce-short">
      <div 
        className="relative p-4 rounded-2xl shadow-2xl border flex flex-col gap-3 backdrop-blur-md"
        style={{ 
          backgroundColor: 'var(--bg-panel)', 
          borderColor: 'var(--border)',
          color: 'var(--text-head)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Dismiss Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Dismiss app install banner"
        >
          <FiX size={16} style={{ color: 'var(--text-muted)' }} />
        </button>

        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <img src="/logo.jpg" alt="Num Num Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 pr-6">
            <h4 className="text-xs font-black leading-tight">Install Num Num App</h4>
            <p className="text-[10px] font-semibold leading-normal mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Add to Home Screen for fast order tracking and instant notifications.
            </p>
          </div>
        </div>

        {isIos ? (
          <div 
            className="flex items-center gap-2 text-[10px] font-bold p-2 rounded-xl"
            style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}
          >
            <FiShare className="text-blue-500 flex-shrink-0" size={14} />
            <span>
              Tap <span className="font-extrabold">Share</span> then select <span className="font-extrabold">"Add to Home Screen"</span> to install.
            </span>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full py-2 bg-[#B4846C] hover:bg-[#7D5A50] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <FiDownload size={14} />
            <span>Install Now</span>
          </button>
        )}
      </div>
    </div>
  );
}
