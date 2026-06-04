import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon, FiEye, FiEyeOff } from 'react-icons/fi';
import SEO from '../components/SEO';

export default function Register() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const [generalError, setGeneralError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors(null);
    setGeneralError('');

    if (password !== confirmPassword) {
      setErrors({ password: ['Passwords do not match.'] });
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.register({ 
        name, 
        email, 
        phone, 
        password, 
        password_confirmation: confirmPassword, 
        role 
      });
      localStorage.setItem('num_token', response.token);
      localStorage.setItem('num_user', JSON.stringify(response.user));

      if (role === 'customer') {
        navigate('/customer/browse');
      } else if (role === 'chef') {
        navigate('/chef/kitchen');
      } else if (role === 'delivery') {
        navigate('/delivery/jobs');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setGeneralError(err.response?.data?.message || 'Registration failed. Please check details.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Shared input style helper
  const inputStyle = {
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    color: 'var(--text-head)',
  };
  const inputFocus = (e) => { e.target.style.borderColor = '#B4846C'; };
  const inputBlur  = (e) => { e.target.style.borderColor = 'var(--border)'; };

  // Password complexity checkers
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-page)' }}>
      <SEO title="Join Num Num - Create a New Account" description="Sign up as a customer, register as a chef, or join our driver fleet to earn on the Num Num platform." />
      <div
        className="max-w-md w-full min-h-screen flex flex-col mx-auto justify-center px-6 py-8 relative shadow-2xl border-x"
        style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}
      >

        {/* Dark Mode Toggle — top-right corner */}
        <div className="absolute top-5 right-5">
          <button
            onClick={toggleTheme}
            id="btn-theme-toggle-register"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer"
            style={{ color: isDark ? '#FCDEC0' : '#7D5A50', backgroundColor: isDark ? '#3e2820' : '#FCDEC0' }}
            aria-label="Toggle dark mode"
          >
            {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
        </div>

        {/* Brand */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.jpg" alt="Num Num Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-head)' }}>Num Num</h1>
          </div>
          <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>Sleek, direct setup to get started</p>
        </div>

        {/* Form Panel */}
        <div className="card-solid shadow-xl p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text-head)' }}>Create New Account</h2>

          {generalError && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-xs font-semibold mb-4">
              {generalError}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Role Tab Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                I want to join as a:
              </label>
              <div
                className="grid grid-cols-3 gap-2 p-1 rounded-xl"
                style={{ backgroundColor: isDark ? '#1e1410' : '#f3ece7' }}
              >
                {['customer', 'chef', 'delivery'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="py-2 text-xs font-bold rounded-lg transition-all cursor-pointer capitalize"
                    style={
                      role === r
                        ? { backgroundColor: 'var(--bg-panel)', color: '#7D5A50', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                        : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
                    }
                  >
                    {r === 'delivery' ? 'Driver' : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="input-name" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Full Name
              </label>
              <input
                type="text"
                id="input-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 font-medium text-sm outline-none transition-all"
                style={{ ...inputStyle, ...(errors?.name ? { borderColor: '#e11d48' } : {}) }}
                onFocus={inputFocus} onBlur={inputBlur}
                placeholder="John Doe"
                required
              />
              {errors?.name && <span className="text-[10px] text-rose-600 font-bold block mt-1">{errors.name[0]}</span>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="input-email" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <input
                type="email"
                id="input-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 font-medium text-sm outline-none transition-all"
                style={{ ...inputStyle, ...(errors?.email ? { borderColor: '#e11d48' } : {}) }}
                onFocus={inputFocus} onBlur={inputBlur}
                placeholder="john@numnum.com"
                required
              />
              {errors?.email && <span className="text-[10px] text-rose-600 font-bold block mt-1">{errors.email[0]}</span>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="input-phone" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Phone Number
              </label>
              <input
                type="tel"
                id="input-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 font-medium text-sm outline-none transition-all"
                style={{ ...inputStyle, ...(errors?.phone ? { borderColor: '#e11d48' } : {}) }}
                onFocus={inputFocus} onBlur={inputBlur}
                placeholder="1234567890"
                required
              />
              {errors?.phone && <span className="text-[10px] text-rose-600 font-bold block mt-1">{errors.phone[0]}</span>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="input-password" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl pl-4 pr-12 py-2.5 font-medium text-sm outline-none transition-all"
                  style={{ ...inputStyle, ...(errors?.password ? { borderColor: '#e11d48' } : {}) }}
                  onFocus={inputFocus} onBlur={inputBlur}
                  placeholder="••••••••"
                  required
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

              {/* Dynamic strength criteria checklist */}
              <div className="mt-2.5 p-3 rounded-xl space-y-1.5 text-[11px] font-semibold border" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
                <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Password Requirements:
                </span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1.5 transition-all duration-200" style={{ color: hasMinLength ? '#10b981' : 'var(--text-muted)' }}>
                    <span className="text-xs">{hasMinLength ? '✓' : '•'}</span>
                    <span>Min 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-all duration-200" style={{ color: hasUppercase ? '#10b981' : 'var(--text-muted)' }}>
                    <span className="text-xs">{hasUppercase ? '✓' : '•'}</span>
                    <span>Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-all duration-200" style={{ color: hasLowercase ? '#10b981' : 'var(--text-muted)' }}>
                    <span className="text-xs">{hasLowercase ? '✓' : '•'}</span>
                    <span>Lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-all duration-200" style={{ color: hasNumber ? '#10b981' : 'var(--text-muted)' }}>
                    <span className="text-xs">{hasNumber ? '✓' : '•'}</span>
                    <span>Number (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1.5 transition-all duration-200 col-span-2" style={{ color: hasSymbol ? '#10b981' : 'var(--text-muted)' }}>
                    <span className="text-xs">{hasSymbol ? '✓' : '•'}</span>
                    <span>Special character</span>
                  </div>
                </div>
              </div>

              {errors?.password && <span className="text-[10px] text-rose-600 font-bold block mt-1">{errors.password[0]}</span>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="input-confirm-password" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="input-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl pl-4 pr-12 py-2.5 font-medium text-sm outline-none transition-all"
                  style={{ ...inputStyle }}
                  onFocus={inputFocus} onBlur={inputBlur}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer transition-opacity opacity-60 hover:opacity-100"
                  style={{ background: 'none', border: 'none', color: 'var(--text-head)' }}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-3 font-bold cursor-pointer"
            >
              {loading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                `Register as ${role === 'customer' ? 'Customer' : role === 'chef' ? 'Chef' : 'Driver'}`
              )}
            </button>
          </form>

          <div className="text-center mt-5">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
            <Link
              to="/login"
              className="text-xs font-extrabold transition-colors"
              style={{ color: '#7D5A50' }}
              onMouseEnter={e => e.target.style.color = '#B4846C'}
              onMouseLeave={e => e.target.style.color = '#7D5A50'}
            >
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
