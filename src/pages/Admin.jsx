import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { authAPI } from '../api';
import { motion } from 'framer-motion';
import { FaUserPlus, FaSignInAlt, FaLock } from 'react-icons/fa';

const Admin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      if (isLogin) {
        const response = await authAPI.login(formData.username, formData.password);
        localStorage.setItem('token', response.data.access_token);
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 1500);
      } else {
        await authAPI.register(formData);
        setMessage('Registration successful! You can now login.');
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (error) {
      setMessage(error.response?.data?.detail || 'An error occurred');
    }
  };

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-6 py-12 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-faz-green to-faz-orange rounded-full flex items-center justify-center mx-auto mb-4">
                {isLogin ? <FaSignInAlt className="text-white text-3xl" /> : <FaUserPlus className="text-white text-3xl" />}
              </div>
              <h2 className="text-3xl font-bold gradient-text">
                {isLogin ? 'Admin Login' : 'Create Account'}
              </h2>
              <p className="text-gray-400 mt-2">
                {isLogin ? 'Access the FAZ administration panel' : 'Register as a new administrator'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full glass pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-faz-orange"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full glass px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-faz-orange"
                    placeholder="Enter email"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full glass px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-faz-orange"
                  placeholder="Enter password"
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-center ${message.includes('successful') ? 'bg-faz-green/20 text-faz-green' : 'bg-faz-red/20 text-faz-red'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="w-full btn-primary py-3"
              >
                {isLogin ? 'Login' : 'Register'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-faz-orange hover:text-faz-green transition-colors"
              >
                {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;