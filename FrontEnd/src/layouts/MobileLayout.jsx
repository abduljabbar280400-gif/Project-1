import { FaRupeeSign } from 'react-icons/fa';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiLayers, FiTruck, FiCoffee, FiLogOut, FiHome, FiSettings, FiActivity, FiUser, FiSun, FiMoon, FiSmile } from 'react-icons/fi';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function MobileLayout({ children, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('num_user') || '{}');
  const activeRole = role || user.role;
  const { isDark, toggleTheme, isSimpleMode, toggleSimpleMode } = useTheme();

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // Clean up locally regardless
    }
    localStorage.removeItem('num_token');
    localStorage.removeItem('num_user');
    navigate('/login');
  };

  // Define tab navigation based on role
  const getTabs = () => {
    switch (activeRole) {
      case 'customer':
        return [
          { label: 'Browse', path: '/customer/browse', icon: <FiHome size={22} /> },
          { label: 'My Orders', path: '/customer/orders', icon: <FiShoppingBag size={22} /> },
          { label: 'Profile', path: '/profile', icon: <FiUser size={22} /> },
        ];
      case 'chef':
        return [
          { label: 'Kitchen', path: '/chef/kitchen', icon: <FiCoffee size={22} /> },
          { label: 'Menu', path: '/chef/menu', icon: <FiLayers size={22} /> },
          { label: 'Earnings', path: '/chef/earnings', icon: <FaRupeeSign size={22} /> },
          { label: 'Profile', path: '/profile', icon: <FiUser size={22} /> },
        ];
      case 'delivery':
        return [
          { label: 'Jobs', path: '/delivery/jobs', icon: <FiTruck size={22} /> },
          { label: 'Active', path: '/delivery/active', icon: <FiActivity size={22} /> },
          { label: 'Earnings', path: '/delivery/earnings', icon: <FaRupeeSign size={22} /> },
          { label: 'Profile', path: '/profile', icon: <FiUser size={22} /> },
        ];
      case 'admin':
        return [
          { label: 'Restaurants', path: '/admin/restaurants', icon: <FiSettings size={22} /> },
          { label: 'Payouts', path: '/admin/payouts', icon: <FaRupeeSign size={22} /> },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabs();

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="max-w-md w-full min-h-screen flex flex-col mx-auto relative shadow-2xl border-x" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}>

        {/* Solid Top Header */}
        <header
          className="sticky top-0 z-40 h-16 px-4 flex items-center justify-between select-none border-b"
          style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)', transition: 'background-color 0.3s ease' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: '#B4846C' }}>
              N
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-none" style={{ color: 'var(--text-head)' }}>Num Num</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{activeRole} hub</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold truncate max-w-[80px]" style={{ color: 'var(--text-body)' }}>
              {user.name || 'Account'}
            </span>

            {/* Simple / Senior Mode Toggle */}
            <button
              onClick={toggleSimpleMode}
              id="btn-simple-mode-toggle"
              title={isSimpleMode ? 'Switch to Advanced Mode' : 'Switch to Senior/Simple Mode'}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer"
              style={{ 
                color: isSimpleMode ? '#ffffff' : '#7D5A50',
                backgroundColor: isSimpleMode ? '#B4846C' : 'transparent',
                border: isSimpleMode ? '1px solid #B4846C' : '1px solid var(--border)'
              }}
              aria-label="Toggle simple accessibility mode"
            >
              <FiSmile size={18} className={isSimpleMode ? 'scale-110' : ''} />
            </button>

            {/* Dark Mode Icon Toggle */}
            <button
              onClick={toggleTheme}
              id="btn-theme-toggle"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer"
              style={{ color: isDark ? '#FCDEC0' : '#7D5A50', }}
              aria-label="Toggle dark mode"
            >
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Logout"
              aria-label="Logout"
              id="btn-logout"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </header>


        {/* Primary Page Content Wrapper */}
        <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
          {children}
        </main>

        {/* Solid Bottom Navigation Bar */}
        {tabs.length > 0 && (
          <nav
            className="sticky bottom-0 left-0 right-0 z-45 h-18 px-6 flex items-center justify-around shadow-lg border-t"
            style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)', transition: 'background-color 0.3s ease' }}
          >
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`flex flex-col items-center justify-center w-16 h-14 ${isActive ? 'nav-tab-active' : 'nav-tab-inactive'}`}
                  id={`nav-tab-${tab.label.toLowerCase().replace(' ', '-')}`}
                  aria-label={tab.label}
                >
                  <div className="mb-1 touch-target flex items-center justify-center" aria-hidden="true">{tab.icon}</div>
                  <span className="text-[10px] uppercase tracking-wider">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
