import React, { useState, useEffect, useMemo } from 'react';
import GlassCard from '../components/GlassCard';
import api, { clubsAPI } from '../api';
import { motion } from 'framer-motion';
import {
  FaSearch, FaThLarge, FaList, FaChevronLeft, FaChevronRight,
  FaShieldAlt, FaMapMarkerAlt, FaUsers,
} from 'react-icons/fa';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, 200];

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  /* ---------------- Fetch ---------------- */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clubsRes, countriesRes] = await Promise.all([
          clubsAPI.getAll({ limit: 1000 }),
          api.get('/countries/').catch(() => ({ data: [] })),
        ]);
        setClubs(clubsRes.data || []);
        setCountries(countriesRes.data || []);
      } catch (error) {
        console.error('Error fetching clubs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const countryName = (id) => {
    if (!id) return '—';
    const c = countries.find((x) => x.id === id);
    return c?.name || '—';
  };

  /* ---------------- Filter ---------------- */
  const filtered = useMemo(() => {
    if (!search.trim()) return clubs;
    const q = search.toLowerCase();
    return clubs.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.short_name || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        countryName(c.country_id).toLowerCase().includes(q)
    );
  }, [clubs, search, countries]);

  /* ---------------- Pagination ---------------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  /* ---------------- Helpers ---------------- */
  const genderBadge = (gender) => {
    const g = (gender || '').toLowerCase();
    if (g === 'male')
      return (
        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
          Men
        </span>
      );
    if (g === 'female')
      return (
        <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full">
          Women
        </span>
      );
    return (
      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
        Mixed
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading clubs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
            Clubs
          </h1>
          <p className="text-xl text-gray-300">
            Meet the clubs competing in Zambian football
          </p>
        </motion.div>

        {/* Toolbar */}
        <div className="glass rounded-xl p-4 mb-8 flex flex-wrap items-center gap-3 justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, description, country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-faz-orange"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Rows:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-faz-orange"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-gray-800/60 border border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded transition ${
                viewMode === 'grid'
                  ? 'bg-faz-orange text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <FaThLarge />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded transition ${
                viewMode === 'table'
                  ? 'bg-faz-orange text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Table view"
            >
              <FaList />
            </button>
          </div>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-400">No clubs found.</p>
          </GlassCard>
        ) : viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map((club, idx) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
              >
                <GlassCard className="text-center hover:scale-105 transition-all duration-300 h-full flex flex-col">
                  <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-faz-green to-faz-orange flex items-center justify-center">
                    {club.logo_url ? (
                      <img
                        src={club.logo_url}
                        alt={club.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <FaShieldAlt className="text-white text-4xl" />
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-1">{club.name}</h3>
                  <p className="text-faz-orange mb-3 text-sm">
                    {club.short_name || '—'}
                  </p>

                  <div className="flex justify-center mb-4">
                    {genderBadge(club.gender)}
                  </div>

                  <div className="space-y-2 text-left text-sm flex-1">
                    <div className="flex items-center gap-2 text-gray-300">
                      <FaMapMarkerAlt className="text-faz-green" />
                      <span>{countryName(club.country_id)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <FaUsers className="text-faz-orange" />
                      <span>{club.age || 'Senior'}</span>
                    </div>
                  </div>

                  {club.description && (
                    <p className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 line-clamp-2">
                      {club.description}
                    </p>
                  )}

                  {club.is_active === false && (
                    <span className="mt-3 inline-block text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
                      Inactive
                    </span>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <GlassCard className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-white">#</th>
                  <th className="px-4 py-3 text-left text-white">Club Name</th>
                  <th className="px-4 py-3 text-left text-white">Short Name</th>
                  <th className="px-4 py-3 text-left text-white">Country</th>
                  <th className="px-4 py-3 text-left text-white">Gender</th>
                  <th className="px-4 py-3 text-left text-white">Age</th>
                  <th className="px-4 py-3 text-left text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((club, idx) => (
                  <tr
                    key={club.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-gray-400">{startIdx + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{club.name}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {club.short_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {countryName(club.country_id)}
                    </td>
                    <td className="px-4 py-3">{genderBadge(club.gender)}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {club.age || 'Senior'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          club.is_active === false
                            ? 'bg-gray-500/20 text-gray-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {club.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
            <p className="text-sm text-gray-400">
              Showing <span className="text-white">{startIdx + 1}</span>–
              <span className="text-white">
                {Math.min(startIdx + pageSize, filtered.length)}
              </span>{' '}
              of <span className="text-white">{filtered.length}</span> clubs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="glass px-3 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition flex items-center gap-2"
              >
                <FaChevronLeft className="text-xs" /> Prev
              </button>
              <span className="text-sm text-gray-300 px-3">
                Page <span className="text-white font-medium">{currentPage}</span>{' '}
                of <span className="text-white font-medium">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="glass px-3 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition flex items-center gap-2"
              >
                Next <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}