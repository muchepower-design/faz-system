// frontend/src/pages/Competitions.jsx
import React, { useState, useEffect, useMemo } from 'react';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
import { FaTrophy, FaSearch, FaArchive, FaFilter } from 'react-icons/fa';

const Competitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchives, setShowArchives] = useState(false);
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/competitions-management/competitions', {
        params: { active_only: false }
      });
      setCompetitions(res.data || []);
    } catch (err) {
      console.error('Error fetching competitions:', err);
      setError('Failed to load competitions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = competitions;

    // Archive / active filter
    if (!showArchives) {
      list = list.filter(c => c.is_active !== false);
    }

    // Gender
    if (selectedGender !== 'all') {
      list = list.filter(c => (c.gender || '').toLowerCase() === selectedGender);
    }

    // Type
    if (selectedType !== 'all') {
      list = list.filter(c => (c.competition_type || '').toLowerCase() === selectedType.toLowerCase());
    }

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        c =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [competitions, showArchives, selectedGender, selectedType, searchTerm]);

  const genderFilters = [
    { value: 'all', label: 'All', icon: '🌍' },
    { value: 'male', label: "Men's", icon: '⚽' },
    { value: 'female', label: "Women's", icon: '👩‍⚽' },
    { value: 'both', label: 'Mixed', icon: '🤝' },
  ];

  const typeFilters = [
    { value: 'all', label: 'All Types' },
    { value: 'league', label: 'Leagues' },
    { value: 'cup', label: 'Cups' },
    { value: 'tournament', label: 'Tournaments' },
    { value: 'friendly_series', label: 'Friendlies' },
  ];

  const getCompetitionIcon = (competition) => {
    switch ((competition.competition_type || '').toLowerCase()) {
      case 'league': return '🏆';
      case 'cup': return '🏅';
      case 'tournament': return '⭐';
      case 'friendly_series': return '🤝';
      default: return '⚽';
    }
  };

  const getGenderBadge = (gender) => {
    const g = (gender || '').toLowerCase();
    if (g === 'male') return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Men</span>;
    if (g === 'female') return <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full">Women</span>;
    return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Mixed</span>;
  };

  const clearFilters = () => {
    setSelectedGender('all');
    setSelectedType('all');
    setSearchTerm('');
    setShowArchives(false);
  };

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Competitions</h1>
          <p className="text-gray-300">
            All football competitions organised by FAZ – from grassroots to elite.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="glass rounded-xl p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Gender */}
            <div className="flex flex-wrap gap-2">
              {genderFilters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setSelectedGender(f.value)}
                  className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                    selectedGender === f.value
                      ? 'bg-gradient-to-r from-faz-green to-faz-orange text-white'
                      : 'glass hover:bg-white/20'
                  }`}
                >
                  <span>{f.icon}</span>
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              ))}
            </div>

            {/* Type */}
            <div className="flex flex-wrap gap-2">
              {typeFilters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setSelectedType(f.value)}
                  className={`px-3 py-2 rounded-full text-sm transition-all duration-300 ${
                    selectedType === f.value
                      ? 'bg-gradient-to-r from-faz-green to-faz-orange text-white'
                      : 'glass hover:bg-white/20'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Archives toggle */}
            <button
              onClick={() => setShowArchives(!showArchives)}
              className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 ${
                showArchives ? 'bg-faz-orange text-white' : 'glass hover:bg-white/20'
              }`}
            >
              <FaArchive /> {showArchives ? 'Showing Archives' : 'Archives'}
            </button>

            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search competitions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="glass pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-faz-orange w-full md:w-64"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
          </div>
        ) : error ? (
          <GlassCard className="text-center py-12">
            <p className="text-red-400">{error}</p>
            <button onClick={fetchCompetitions} className="btn-secondary mt-4">
              Retry
            </button>
          </GlassCard>
        ) : filtered.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-400">No competitions found for the selected filters.</p>
            <button onClick={clearFilters} className="btn-secondary mt-4">
              Clear Filters
            </button>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((comp, idx) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={`/competitions/${comp.id}`}>
                  <GlassCard className="hover:scale-105 transition-all duration-300 group h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-5xl">{getCompetitionIcon(comp)}</div>
                      {getGenderBadge(comp.gender)}
                    </div>
                    <h2 className="text-xl font-bold group-hover:text-faz-orange transition-colors mb-2">
                      {comp.name}
                    </h2>
                    {comp.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{comp.description}</p>
                    )}
                    <div className="mt-auto pt-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {comp.participant_type && (
                          <span className="bg-white/10 px-2 py-1 rounded-full text-gray-300">
                            {comp.participant_type === 'countries' ? '🌍 National Teams' : '🏟️ Clubs'}
                          </span>
                        )}
                        {comp.scope && (
                          <span className="bg-white/10 px-2 py-1 rounded-full text-gray-300">
                            {comp.scope}
                          </span>
                        )}
                        {!comp.is_active && (
                          <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
                            Archived
                          </span>
                        )}
                      </div>
                      <div className="mt-3 text-faz-orange text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Details →
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-12 glass rounded-xl p-6">
          <h3 className="text-xl font-bold gradient-text mb-4">Competition Types</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span className="text-gray-300">Leagues – Points-based standings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏅</span>
              <span className="text-gray-300">Cups – Knockout tournaments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="text-gray-300">Tournaments – Special events</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤝</span>
              <span className="text-gray-300">Friendlies – Exhibition series</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Competitions;