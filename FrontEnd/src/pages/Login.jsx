import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(null);
  const [availableRoles, setAvailableRoles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loginPayload = { email, password };
      if (role) {
        loginPayload.role = role;
      }

      const response = await api.auth.login(loginPayload);
      localStorage.setItem('num_token', response.token);
      localStorage.setItem('num_user', JSON.stringify(response.user));

      const userRole = response.user.role;
      if (userRole === 'customer') {
        navigate('/customer/browse');
      } else if (userRole === 'chef') {
        navigate('/chef/kitchen');
      } else if (userRole === 'delivery') {
        navigate('/delivery/jobs');
      } else if (userRole === 'admin') {
        navigate('/admin/restaurants');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.multiple_roles) {
        setError(err.response.data.message);
        setAvailableRoles(err.response.data.roles);
      } else {
        setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreFill = (roleEmail, roleType) => {
    setEmail(roleEmail);
    setPassword('password');
    setRole(roleType);
    setAvailableRoles(null);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="max-w-md w-full min-h-screen flex flex-col mx-auto justify-center px-6 py-12 relative shadow-2xl border-x" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}>

        {/* Dark Mode Icon Toggle — top-right corner */}
        <div className="absolute top-5 right-5">
          <button
            onClick={toggleTheme}
            id="btn-theme-toggle-login"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer"
            style={{ color: isDark ? '#FCDEC0' : '#7D5A50', backgroundColor: isDark ? '#3e2820' : '#FCDEC0' }}
            aria-label="Toggle dark mode"
          >
            {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
        </div>

        {/* Brand Identity */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center text-white font-extrabold text-3xl shadow-md mx-auto mb-4 hover:scale-105 transition-transform"
            style={{ backgroundColor: '#B4846C' }}
          >
            N
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-head)' }}>Num Num</h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Sleek Operational Restaurant Platform MVP</p>
        </div>

        {/* Login Form */}
        <div className="card-solid shadow-xl p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-head)' }}>Welcome Back</h2>

          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-xs font-semibold mb-5" id="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Dynamic Role Picker (Only shown when multiple roles share the same email) */}
            {availableRoles && (
              <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl mb-4 transition-all duration-300">
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2 text-amber-800">
                  Select your login role:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className="py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer capitalize text-center"
                      style={
                        role === r
                          ? { backgroundColor: '#7D5A50', color: '#fff', borderColor: '#7D5A50', boxShadow: '0 4px 12px rgba(125, 90, 80, 0.2)' }
                          : { backgroundColor: 'var(--bg-panel)', color: 'var(--text-head)', borderColor: 'var(--border)' }
                      }
                    >
                      {r === 'delivery' ? 'Driver' : r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (role) setRole(null);
                  if (availableRoles) setAvailableRoles(null);
                }}
                className="w-full rounded-xl px-4 py-3 font-medium text-sm transition-all outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-head)',
                }}
                onFocus={e => e.target.style.borderColor = '#B4846C'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                placeholder="you@numnum.com"
                required
                id="input-email"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl pl-4 pr-12 py-3 font-medium text-sm transition-all outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-head)',
                  }}
                  onFocus={e => e.target.style.borderColor = '#B4846C'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  placeholder="••••••••"
                  required
                  id="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer transition-opacity opacity-60 hover:opacity-100"
                  style={{ background: 'none', border: 'none', color: 'var(--text-head)' }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 font-bold cursor-pointer"
              id="btn-login-submit"
            >
              {loading ? <LoadingSpinner size="sm" color="white" /> : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>New to Num Num? </span>
            <Link
              to="/register"
              className="text-xs font-extrabold transition-colors"
              style={{ color: '#7D5A50' }}
              onMouseEnter={e => e.target.style.color = '#B4846C'}
              onMouseLeave={e => e.target.style.color = '#7D5A50'}
              id="link-register"
            >
              Create an Account
            </Link>
          </div>
        </div>

        {/* Demo Fast Logins Section */}
        {import.meta.env.DEV && (
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="block text-center text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Demo Sandbox Logins (Pre-seeded accounts)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Customer',      email: 'customer@numnum.com', roleType: 'customer', color: '#7D5A50' },
                { label: 'Chef (Mario)',  email: 'chef@numnum.com',     roleType: 'chef',     color: '#B4846C' },
                { label: 'Driver (Dave)', email: 'driver@numnum.com',   roleType: 'delivery', color: '#7D5A50' },
                { label: 'Platform Admin',email: 'admin@numnum.com',    roleType: 'admin',    color: '#B4846C' },
              ].map(({ label, email: roleEmail, roleType, color }) => (
                <button
                  key={roleEmail}
                  onClick={() => handlePreFill(roleEmail, roleType)}
                  className="rounded-xl py-2 px-3 text-left transition-all cursor-pointer border hover:opacity-80"
                  style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)' }}
                >
                  <span className="block text-[10px] font-bold uppercase" style={{ color }}>{label}</span>
                  <span className="text-[11px] font-semibold truncate block" style={{ color: 'var(--text-body)' }}>{roleEmail}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
