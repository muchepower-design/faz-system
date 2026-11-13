// frontend/src/pages/FazAdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import api from '../api';
import {
  FaTrophy, FaFutbol, FaUsers, FaHandshake, FaNewspaper, FaImages,
  FaIdCard, FaSignOutAlt, FaChartLine, FaArrowRight,
  FaRegNewspaper, FaCheckCircle, FaExclamationTriangle, FaSyncAlt, FaShieldAlt,
} from 'react-icons/fa';

export default function FazAdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [comp, clubs, nts, news, acc, videos, galleries] = await Promise.all([
        api.get('/competitions-management/competitions', { params: { active_only: true } }).catch(() => ({ data: [] })),
        api.get('/clubs/').catch(() => ({ data: [] })),
        api.get('/national-teams/').catch(() => ({ data: [] })),
        api.get('/news').catch(() => ({ data: [] })),
        api.get('/accreditation/admin/stats').catch(() => ({ data: null })),
        api.get('/media/videos').catch(() => ({ data: [] })),
        api.get('/media/galleries').catch(() => ({ data: [] })),
      ]);

      setStats({
        competitions: Array.isArray(comp.data) ? comp.data.length : 0,
        clubs: Array.isArray(clubs.data) ? clubs.data.length : 0,
        nationalTeams: Array.isArray(nts.data) ? nts.data.length : 0,
        news: Array.isArray(news.data) ? news.data.length : 0,
        videos: Array.isArray(videos.data) ? videos.data.length : 0,
        galleries: Array.isArray(galleries.data) ? galleries.data.length : 0,
        acc: acc.data || { pending: 0, approved: 0, rejected: 0, cancelled: 0 },
      });
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <div className="flex justify-center py-20">
          <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-16">
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold gradient-text">FAZ Admin</h1>
          <p className="text-gray-400">
            Welcome, {user?.full_name || user?.first_name || user?.email || 'FAZ Admin'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="glass px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10 disabled:opacity-50"
          >
            <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={logout}
            className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-500/20"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {error && (
        <GlassCard className="mb-6 text-center border-faz-red/50 bg-faz-red/10">
          <div className="flex items-center justify-center gap-2 text-faz-red">
            <FaExclamationTriangle /> {error}
          </div>
        </GlassCard>
      )}

      {/* KPI cards */}
      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <GlassCard className="text-center">
            <FaTrophy className="text-3xl text-faz-orange mx-auto mb-2" />
            <p className="text-3xl font-bold gradient-text">{stats.competitions}</p>
            <p className="text-xs text-gray-400">Active competitions</p>
          </GlassCard>
          <GlassCard className="text-center">
            <FaHandshake className="text-3xl text-faz-green mx-auto mb-2" />
            <p className="text-3xl font-bold gradient-text">{stats.clubs}</p>
            <p className="text-xs text-gray-400">Clubs</p>
          </GlassCard>
          <GlassCard className="text-center">
            <FaUsers className="text-3xl text-faz-red mx-auto mb-2" />
            <p className="text-3xl font-bold gradient-text">{stats.nationalTeams}</p>
            <p className="text-xs text-gray-400">National teams</p>
          </GlassCard>
          <GlassCard className="text-center">
            <FaIdCard className="text-3xl text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold gradient-text">{stats.acc.pending}</p>
            <p className="text-xs text-gray-400">Pending accreditations</p>
          </GlassCard>
        </div>
      )}

      {/* Quick access grid */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaChartLine className="text-faz-green" /> Quick Access
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/admin/competitions">
            <GlassCard className="hover:scale-105 transition cursor-pointer h-full">
              <FaTrophy className="text-4xl text-faz-orange mb-3" />
              <h3 className="text-lg font-bold">Competitions</h3>
              <p className="text-sm text-gray-400">Leagues, cups, seasons, and standings</p>
            </GlassCard>
          </Link>
          <Link to="/admin/friendlies">
            <GlassCard className="hover:scale-105 transition cursor-pointer h-full">
              <FaFutbol className="text-4xl text-faz-green mb-3" />
              <h3 className="text-lg font-bold">Friendlies</h3>
              <p className="text-sm text-gray-400">Create and manage friendly matches</p>
            </GlassCard>
          </Link>
          <Link to="/clubs">
            <GlassCard className="hover:scale-105 transition cursor-pointer h-full">
              <FaHandshake className="text-4xl text-faz-red mb-3" />
              <h3 className="text-lg font-bold">Clubs</h3>
              <p className="text-sm text-gray-400">Browse registered clubs</p>
            </GlassCard>
          </Link>
          <Link to="/admin/content">
            <GlassCard className="hover:scale-105 transition cursor-pointer h-full">
              <FaNewspaper className="text-4xl text-faz-orange mb-3" />
              <h3 className="text-lg font-bold">Content Manager</h3>
              <p className="text-sm text-gray-400">Hero slides, pages, partners, governance</p>
            </GlassCard>
          </Link>
          <Link to="/media/dashboard">
            <GlassCard className="hover:scale-105 transition cursor-pointer h-full">
              <FaRegNewspaper className="text-4xl text-faz-green mb-3" />
              <h3 className="text-lg font-bold">Media Centre</h3>
              <p className="text-sm text-gray-400">News, videos, and galleries</p>
            </GlassCard>
          </Link>
          <Link to="/media/accreditation">
            <GlassCard className="hover:scale-105 transition cursor-pointer h-full">
              <FaIdCard className="text-4xl text-yellow-500 mb-3" />
              <h3 className="text-lg font-bold">Accreditation</h3>
              <p className="text-sm text-gray-400">Review pending applications</p>
            </GlassCard>
          </Link>
          <Link to="/admin/audit-log">
  <GlassCard className="hover:scale-105 transition cursor-pointer h-full">
    <FaShieldAlt className="text-4xl text-blue-400 mb-3" />
    <h3 className="text-lg font-bold">Audit Log</h3>
    <p className="text-sm text-gray-400">Your recent admin actions</p>
  </GlassCard>
</Link>
        </div>
      </section>

      {/* Media content summary */}
      {stats && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaImages className="text-faz-orange" /> Content Snapshot
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard>
              <p className="text-xs text-gray-400 uppercase">Published News</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.news}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-xs text-gray-400 uppercase">Videos</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.videos}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-xs text-gray-400 uppercase">Galleries</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.galleries}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-xs text-gray-400 uppercase">Approved Cards</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.acc.approved}</p>
            </GlassCard>
          </div>
        </section>
      )}

      {/* Help footer */}
      <GlassCard className="mt-8">
        <div className="flex items-start gap-3">
          <FaCheckCircle className="text-faz-green mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold text-white">Need to manage users or roles?</p>
            <p className="text-sm text-gray-400">
              User account management is handled by Super Admins. Contact a super administrator if you need
              a new user created or existing roles adjusted.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}