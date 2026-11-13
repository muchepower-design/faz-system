import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSignInAlt, FaEnvelope, FaLock, FaFutbol, FaEye, FaEyeSlash } from 'react-icons/fa';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef(null);

  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin':               return '/admin/dashboard';
      case 'super_admin':         return '/admin/dashboard';
      case 'faz_admin':           return '/admin/content';
      case 'finance_officer':     return '/finance/dashboard';
      case 'vendor':              return '/dashboard';
      case 'match_commissioner':  return '/commissioner/dashboard';
      case 'media_officer':       return '/media/dashboard';
      case 'club_rep':            return '/club/dashboard';
      case 'referee':             return '/referee/dashboard';
      case 'customer':            return '/dashboard';
      case 'viewer':              return '/dashboard';
      default:                    return '/dashboard';
    }
  };

  // Redirect away if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        navigate(getDashboardPath(decoded.role || 'viewer'));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  // Mount Google Sign-In button
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (!window.google?.accounts?.id) return;
    if (!googleButtonRef.current) return;

    const handleCredential = async (response) => {
      setError('');
      setLoading(true);
      try {
        const { user, new_user } = await loginWithGoogle(response.credential);
        if (new_user) {
          // Optional: toast or just navigate; the account is ready.
        }
        const role = user.role || jwtDecode(localStorage.getItem('token')).role || 'viewer';
        navigate(getDashboardPath(role));
      } catch (err) {
        setError(err.response?.data?.error || 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    };

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
      shape: 'rectangular',
    });
  }, [loginWithGoogle, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user } = await login(formData.email, formData.password);
      const decoded = jwtDecode(localStorage.getItem('token'));
      const role = user.role || decoded.role || 'viewer';
      window.location.href = getDashboardPath(role);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((v) => !v);

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-12 px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-faz-green/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-faz-orange/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-faz-green to-faz-orange rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FaFutbol className="text-white text-3xl" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">Welcome Back</h1>
            <p className="text-gray-400 mt-2">Sign in to your FAZ account</p>
          </div>

          {/* Google button */}
          {GOOGLE_CLIENT_ID ? (
            <div className="mb-5 flex justify-center">
              <div ref={googleButtonRef}></div>
            </div>
          ) : (
            <p className="text-xs text-center text-gray-500 mb-4">
              (Add <code>VITE_GOOGLE_CLIENT_ID</code> to enable Google sign-in)
            </p>
          )}

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-transparent px-3 text-gray-400">or use email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full glass pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-faz-orange transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full glass pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-faz-orange transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                  tabIndex="-1"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-faz-red/20 border border-faz-red/50 text-faz-red p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FaSignInAlt /> Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Need help? Contact your FAZ administrator.
          </div>
        </GlassCard>

        <p className="text-center text-gray-500 text-xs mt-6">
          © {new Date().getFullYear()} Football Association of Zambia. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;