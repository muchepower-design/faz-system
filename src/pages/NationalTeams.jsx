import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { nationalTeamsAPI } from '../api';
import { motion } from 'framer-motion';
import {
  FaFlag, FaSearch, FaThLarge, FaList,
  FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, 200];

/* Normalise a gender value into one of: 'male' | 'female' | 'mixed' | 'unknown' */
function normaliseGender(raw) {
  const g = String(raw || '').toLowerCase().trim();
  if (!g) return 'unknown';
  if (['Male', 'male', 'men', "men's", 'm', 'man', 'boys', 'boy'].some(x => g === x || g.includes(x))) {
    return 'male';
  }
  if (['Female', 'female', 'women', "women's", 'f', 'woman', 'girls', 'girl'].some(x => g === x || g.includes(x))) {
    return 'female';
  }
  if (['mixed', 'both', 'any', 'all'].includes(g)) return 'mixed';
  return 'unknown';
}

const ageGroups = {
  senior: 'Senior Team',
  u23: 'U-23 (Olympic)',
  u20: 'U-20',
  u17: 'U-17',
  u15: 'U-15',
};

/* -----------------------------------------------------------------------
 * Reusable flag block — renders the actual flag, or a graceful fallback
 * ----------------------------------------------------------------------- */
function TeamFlag({ team, size = 'md', rounded = false }) {
  const sizeMap = {
    sm: 'w-10 h-7',
    md: 'w-20 h-14',
    lg: 'w-32 h-24',
    xl: 'w-40 h-28',
  };
  const cls = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`${cls} ${
        rounded ? 'rounded-full' : 'rounded-lg'
      } overflow-hidden bg-gradient-to-br from-faz-green to-faz-orange flex items-center justify-center shadow-md flex-shrink-0`}
    >
      {team.country_flag_image_url ? (
        <img
          src={team.country_flag_image_url}
          alt={`${team.name} flag`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fall back to the icon if the URL is broken
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <FaFlag className="text-white text-xl" />
      )}
    </div>
  );
}

const NationalTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  /* ---------- Fetch all teams once ---------- */
  useEffect(() => {
    const fetchNationalTeams = async () => {
      setLoading(true);
      try {
        const res = await nationalTeamsAPI.getAll({ limit: 1000 });
        setTeams(res.data || []);
        console.log("Here Are the national teams", res.data);
      } catch (error) {
        console.error('Error fetching national teams:', error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNationalTeams();
  }, []);

  /* Reset to page 1 whenever filters change */
  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  /* ---------- Filtering (search only) ---------- */
  const filtered = useMemo(() => {
    let list = teams;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.short_name || '').toLowerCase().includes(q) ||
        (t.coach || '').toLowerCase().includes(q) ||
        (t.fifa_code || '').toLowerCase().includes(q) ||
        (t.nickname || '').toLowerCase().includes(q) ||
        (t.age_group || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [teams, search]);

  /* ---------- Pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  /* ---------- Badges ---------- */
  const genderBadge = (gender) => {
    const g = normaliseGender(gender);
    if (gender === 'Male')
      return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Men</span>;
    if (gender === 'Female')
      return <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full">Women</span>;
    return <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Mixed</span>;
  };

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            National Teams
          </h1>
          <p className="text-gray-300">
            Follow Zambia's national teams across all age groups
          </p>
        </motion.div>

        {/* ---------- Toolbar ---------- */}
        <div className="glass rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3 justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name, coach, code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-faz-orange"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Rows:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-faz-orange"
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

        {/* ---------- Content ---------- */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-400">
              {teams.length === 0
                ? 'No national teams available.'
                : 'No teams match your search.'}
            </p>
          </GlassCard>
        ) : viewMode === 'grid' ? (
          /* ---------- GRID VIEW ---------- */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map((team, idx) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link to={`/national-teams/${team.id}`}>
                  <GlassCard className="hover:scale-105 transition-all duration-300 group h-full flex flex-col">
                    {/* Flag hero */}
                    <div className="flex justify-center mb-4">
                      <TeamFlag team={team} size="lg" />
                    </div>

                    <div className="text-center mb-3">
                      <h2 className="text-xl font-bold group-hover:text-faz-orange transition-colors">
                        {team.country.name}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {ageGroups[team.age_group] || team.age_group || 'Senior'}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-3">
                      {genderBadge(team.gender)}
                      {team.fifa_code && (
                        <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-full">
                          {team.fifa_code}
                        </span>
                      )}
                    </div>

                    {team.nickname && (
                      <p className="text-gray-300 text-sm flex items-center justify-center gap-2">
                        {team.nickname}
                      </p>
                    )}

                    {team.name && (
                      <p className="text-sm text-gray-400">
                        {ageGroups[team.name] || team.name || 'Country Team'}
                      </p>
                    )}

                    <div className="mt-auto pt-4 text-faz-orange text-sm flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                      View Fixtures &amp; Results →
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          /* ---------- TABLE VIEW ---------- */
          <GlassCard className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-white w-12">#</th>
                  <th className="px-4 py-3 text-left text-white w-16">Flag</th>
                  <th className="px-4 py-3 text-left text-white">Name</th>
                  <th className="px-4 py-3 text-left text-white">Gender</th>
                  <th className="px-4 py-3 text-left text-white">Age Group</th>
                  <th className="px-4 py-3 text-left text-white">Nickname</th>
                  <th className="px-4 py-3 text-left text-white">FIFA Code</th>
                  <th className="px-4 py-3 text-right text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((team, idx) => (
                  <tr
                    key={team.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-gray-400">
                      {startIdx + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <TeamFlag team={team} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {team.name}
                    </td>
                    <td className="px-4 py-3">{genderBadge(team.gender)}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {ageGroups[team.age_group] || team.age_group || 'Senior'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {team.nickname || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {team.fifa_code || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/national-teams/${team.id}`}
                        className="text-faz-orange hover:underline text-sm"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}

        {/* ---------- Pagination ---------- */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
            <p className="text-sm text-gray-400">
              Showing <span className="text-white">{startIdx + 1}</span>–
              <span className="text-white">
                {Math.min(startIdx + pageSize, filtered.length)}
              </span>{' '}
              of <span className="text-white">{filtered.length}</span> team(s)
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
      <Footer />
    </>
  );
};

export default NationalTeams;