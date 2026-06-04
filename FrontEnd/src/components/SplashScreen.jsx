import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function SplashScreen({ onComplete }) {
  const { isDark } = useTheme();
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fading out after 1800ms
    const fadeTimeout = setTimeout(() => {
      setIsFadingOut(true);
    }, 1800);

    // Call onComplete after 2300ms (giving 500ms for fade out transition)
    const completeTimeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2300);

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  // Premium radial gradient background matching the warm theme
  const bgStyle = {
    background: isDark
      ? 'radial-gradient(circle, #2d1c16 0%, #120907 100%)'
      : 'radial-gradient(circle, #fdfbf9 0%, #f5eae2 100%)',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Num Num - Fresh food from local chefs"
      style={bgStyle}
      className={`fixed inset-0 z-50 flex flex-col justify-between items-center p-8 select-none transition-all duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Scoped CSS animations for premium fade-slide-up and loading dot pulse */}
      <style>{`
        @keyframes logoEntrance {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulseDot {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.25);
          }
        }
        .animate-logo {
          animation: logoEntrance 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-dot-1 {
          animation: pulseDot 1.4s infinite ease-in-out;
        }
        .animate-dot-2 {
          animation: pulseDot 1.4s infinite ease-in-out 0.2s;
        }
        .animate-dot-3 {
          animation: pulseDot 1.4s infinite ease-in-out 0.4s;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-logo {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .animate-dot-1, .animate-dot-2, .animate-dot-3 {
            animation: none !important;
            opacity: 0.8 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Top spacer to assist vertical balancing */}
      <div className="h-10" />

      {/* Centered Branding Area */}
      <div className="flex flex-col items-center text-center animate-logo opacity-0">
        {/* Custom Premium Icon - Lightning Bolt + Fork */}
        <div className="relative mb-6 drop-shadow-md">
          <img src="/logo.jpg" alt="Num Num Logo" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover transition-transform duration-300 hover:scale-105" />
        </div>

        {/* Large, bold premium typography */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wider text-brand-900 dark:text-brand-50 font-sans transition-colors duration-300">
          Num Num
        </h1>

        {/* Brand Tagline */}
        <p className="text-sm sm:text-base font-semibold tracking-wide text-brand-600/90 dark:text-brand-200/90 mt-2.5 transition-colors duration-300">
          Fresh food from local chefs
        </p>
      </div>

      {/* Elegant Loading Dots at bottom center */}
      <div className="flex items-center justify-center space-x-2.5 mb-6">
        <span className="sr-only">Loading...</span>
        <div className="w-2.5 h-2.5 rounded-full bg-brand-500 dark:bg-brand-200 animate-dot-1" />
        <div className="w-2.5 h-2.5 rounded-full bg-brand-500 dark:bg-brand-200 animate-dot-2" />
        <div className="w-2.5 h-2.5 rounded-full bg-brand-500 dark:bg-brand-200 animate-dot-3" />
      </div>
    </div>
  );
}
