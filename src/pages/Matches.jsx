// frontend/src/pages/Matches.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaSearch,
  FaList,
  FaTable,
  FaTh,
  FaTrophy,
  FaCalendar,
  FaMapMarker,
  FaTicketAlt,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

import MatchCard from '../components/MatchCard';
import GlassCard from '../components/GlassCard';
import CalendarExport from '../components/CalendarExport';
import { matchesAPI, teamsAPI } from '../api';
import {
  canBuyTickets,
  formatMatchDate,
  getDisplayStatus,
  getScoreText,
  getStatusColor,
  getTeamName,
  getTicketUrl,
  groupMatches,
  matchesSearch,
  matchesStatusFilter,
  resolveStatus,
} from '../utils/matchUtils';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */
const STATUS_FILTERS = [
  { value: 'all', label: 'All Matches' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'finished', label: 'Finished' },
];

const VIEWS = [
  { value: 'normal', label: 'List', icon: FaList },
  { value: 'table', label: 'Table', icon: FaTable },
  { value: 'grid', label: 'Grid', icon: FaTh },
];

const PAGE_SIZE_OPTIONS = [6, 9, 12, 18, 24, 36, 48, 96];
const DEFAULT_PAGE_SIZES = { normal: 6, table: 12, grid: 9 };

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */
const CompetitionHeading = ({ name, count }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-faz-green to-faz-orange flex items-center justify-center shrink-0">
      <FaTrophy className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <h2 className="text-xl md:text-2xl font-bold text-white leading-tight truncate">
        {name}
      </h2>
      <p className="text-xs text-gray-400">
        {count} match{count === 1 ? '' : 'es'} on this page
      </p>
    </div>
  </div>
);

const DateHeading = ({ label, count }) => (
  <div className="flex items-center gap-3 mb-3">
    <FaCalendar className="text-faz-orange shrink-0" />
    <span className="text-sm font-semibold uppercase tracking-wide text-gray-200">
      {label}
    </span>
    <span className="text-xs text-gray-500">({count})</span>
    <div className="flex-1 h-px bg-white/10" />
  </div>
);

/* ------------------------------------------------------------------ */
/* Grid card                                                           */
/* ------------------------------------------------------------------ */
const GridMatchCard = ({ match }) => {
  const status = resolveStatus(match);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-5 flex flex-col gap-4 hover:bg-white/15 transition-all duration-300"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="px-2.5 py-1 rounded-full bg-white/10 font-semibold text-gray-200">
          #{match._sn}
        </span>
        <span className={`font-semibold ${getStatusColor(status)}`}>
          {status.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-bold text-white text-right leading-tight">
          {getTeamName(match, 'home')}
        </span>
        <span className="text-lg font-bold gradient-text whitespace-nowrap px-1">
          {getScoreText(match)}
        </span>
        <span className="flex-1 text-sm font-bold text-white leading-tight">
          {getTeamName(match, 'away')}
        </span>
      </div>

      <div className="mt-auto space-y-2 text-xs text-gray-300 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <FaCalendar className="text-faz-green shrink-0" />
          <span>{formatMatchDate(match.match_date, 'EEE, MMM dd, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
          <FaMapMarker className="text-faz-orange shrink-0" />
          <span className="truncate">{match.venue || 'Venue TBC'}</span>
        </div>
      </div>

      {canBuyTickets(match) && (
        <a
          href={getTicketUrl(match)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                     bg-gradient-to-r from-faz-green to-faz-orange text-white text-sm
                     font-semibold hover:opacity-90 transition"
        >
          <FaTicketAlt /> Buy Tickets
        </a>
      )}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* View 1 — Normal (list)                                              */
/* ------------------------------------------------------------------ */
const NormalView = ({ groups }) => (
  <div className="space-y-10">
    {groups.map((comp) => (
      <section key={comp.key}>
        <CompetitionHeading name={comp.competition} count={comp.total} />
        <div className="space-y-6">
          {comp.dates.map((date) => (
            <div key={date.dateKey}>
              <DateHeading label={date.label} count={date.matches.length} />
              <div className="space-y-4">
                {date.matches.map((match, idx) => (
                  <MatchCard key={match.id} match={match} index={idx} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* View 2 — Table                                                      */
/* ------------------------------------------------------------------ */
const TableView = ({ groups }) => (
  <div className="glass overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left border-collapse">
        <thead className="bg-white/10 text-[11px] uppercase tracking-wider text-gray-300">
          <tr>
            <th className="px-4 py-3 w-14">SN</th>
            <th className="px-4 py-3 whitespace-nowrap">Date</th>
            <th className="px-4 py-3">Home Team</th>
            <th className="px-4 py-3 text-center whitespace-nowrap">Score</th>
            <th className="px-4 py-3">Away Team</th>
            <th className="px-4 py-3">Venue</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Tickets</th>
          </tr>
        </thead>

        <tbody>
          {groups.map((comp) => (
            <React.Fragment key={comp.key}>
              <tr className="bg-faz-green/10">
                <td
                  colSpan={8}
                  className="px-4 py-3 text-sm font-bold uppercase tracking-wide text-faz-green"
                >
                  <FaTrophy className="inline mr-2" />
                  {comp.competition}
                  <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                    ({comp.total} match{comp.total === 1 ? '' : 'es'})
                  </span>
                </td>
              </tr>

              {comp.dates.map((date) => (
                <React.Fragment key={date.dateKey}>
                  <tr className="bg-white/5">
                    <td
                      colSpan={8}
                      className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-faz-orange"
                    >
                      <FaCalendar className="inline mr-2" />
                      {date.label}
                    </td>
                  </tr>

                  {date.matches.map((match) => {
                    const status = resolveStatus(match);
                    return (
                      <tr
                        key={match.id}
                        className="border-t border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-400 font-mono text-sm">
                          {match._sn}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {formatMatchDate(match.match_date, 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">
                          {getTeamName(match, 'home')}
                        </td>
                        <td className="px-4 py-3 text-center font-bold gradient-text whitespace-nowrap">
                          {getScoreText(match)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">
                          {getTeamName(match, 'away')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {match.venue || 'Venue TBC'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold ${getStatusColor(
                              status
                            )}`}
                          >
                            {status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canBuyTickets(match) ? (
                            <a
                              href={getTicketUrl(match)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                                         font-semibold text-white bg-gradient-to-r
                                         from-faz-green to-faz-orange hover:opacity-90 transition"
                            >
                              <FaTicketAlt /> Buy
                            </a>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* View 3 — Grid                                                       */
/* ------------------------------------------------------------------ */
const GridView = ({ groups }) => (
  <div className="space-y-10">
    {groups.map((comp) => (
      <section key={comp.key}>
        <CompetitionHeading name={comp.competition} count={comp.total} />
        <div className="space-y-6">
          {comp.dates.map((date) => (
            <div key={date.dateKey}>
              <DateHeading label={date.label} count={date.matches.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {date.matches.map((match) => (
                  <GridMatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */
const Pagination = ({ page, totalPages, totalItems, pageSize, onChange }) => {
  if (totalPages <= 1) return null;

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const navBtn =
    'w-10 h-10 flex items-center justify-center rounded-full glass transition ' +
    'hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-gray-400">
        Showing{' '}
        <span className="text-white font-semibold">
          {from}–{to}
        </span>{' '}
        of <span className="text-white font-semibold">{totalItems}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={navBtn}
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <FaChevronLeft className="text-xs" />
        </button>

        {start > 1 && (
          <>
            <button type="button" className={navBtn} onClick={() => onChange(1)}>
              1
            </button>
            {start > 2 && <span className="text-gray-500 px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`w-10 h-10 rounded-full text-sm font-semibold transition ${
              p === page
                ? 'bg-gradient-to-r from-faz-green to-faz-orange text-white'
                : 'glass hover:bg-white/20 text-gray-300'
            }`}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="text-gray-500 px-1">…</span>
            )}
            <button
              type="button"
              className={navBtn}
              onClick={() => onChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className={navBtn}
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <FaChevronRight className="text-xs" />
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */
const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('normal');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Per-view rows-per-page (remembered when switching views)
  const [pageSizes, setPageSizes] = useState(DEFAULT_PAGE_SIZES);
  const pageSize = pageSizes[view];

  /* --------------------------- data fetching --------------------------- */
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamsAPI.getAll();
        setTeams(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching teams:', error);
        setTeams([]);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        // Fetch once — status filtering now happens client-side so the
        // (currently broken) backend status filter can't hide matches.
        const response = await matchesAPI.getAll();
        setMatches(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  /* ------------------------------ derived ------------------------------ */
  // Decorate each match once with its derived display status.
  const decorated = useMemo(
    () => matches.map((m) => ({ ...m, _status: getDisplayStatus(m) })),
    [matches]
  );

  const filtered = useMemo(
    () =>
      decorated.filter(
        (m) => matchesStatusFilter(m, filter) && matchesSearch(m, search)
      ),
    [decorated, filter, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageMatches = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered
      .slice(startIndex, startIndex + pageSize)
      .map((match, i) => ({ ...match, _sn: startIndex + i + 1 }));
  }, [filtered, currentPage, pageSize]);

  const groups = useMemo(() => groupMatches(pageMatches), [pageMatches]);

  /* ------------------------------ effects ------------------------------ */
  useEffect(() => {
    setPage(1);
  }, [filter, search, view]);

  const handlePageChange = (next) => {
    setPage(next);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (size) => {
    setPageSizes((prev) => ({ ...prev, [view]: size }));
    setPage(1);
  };

  /* ------------------------------- render ------------------------------ */
  return (
    <div className="pt-24 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Matches
            </h1>
            <p className="text-gray-300">
              Follow all the action from FAZ competitions
            </p>
          </div>
          <CalendarExport teams={teams} />
        </motion.div>

        {/* Status filters */}
        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                filter === f.value
                  ? 'bg-gradient-to-r from-faz-green to-faz-orange text-white'
                  : 'glass hover:bg-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search + controls */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team, competition or venue…"
              className="w-full glass rounded-full pl-11 pr-4 py-3 text-white
                         placeholder-gray-400 outline-none focus:ring-2
                         focus:ring-faz-green/70 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            {/* View switcher */}
            <div className="glass rounded-full p-1 flex items-center gap-1">
              {VIEWS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  title={label}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm
                              font-medium transition-all ${
                                view === value
                                  ? 'bg-gradient-to-r from-faz-green to-faz-orange text-white'
                                  : 'text-gray-300 hover:bg-white/10'
                              }`}
                >
                  <Icon className="text-xs" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Rows-per-page dropdown */}
            <div className="glass rounded-full pl-4 pr-2 py-2 flex items-center gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                Per page
              </span>
              <select
                value={pageSize}
                onChange={(e) =>
                  handlePageSizeChange(Number(e.target.value))
                }
                className="bg-transparent text-white text-sm font-semibold outline-none cursor-pointer py-1 pr-1"
                aria-label="Rows per page"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n} className="bg-slate-800 text-white">
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Result count */}
        {!loading && filtered.length > 0 && (
          <p className="text-sm text-gray-400 mb-4">
            {filtered.length} match{filtered.length === 1 ? '' : 'es'} found
            {search.trim() && (
              <>
                {' '}
                for “<span className="text-white">{search.trim()}</span>”
              </>
            )}
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="text-center py-12">
            <FaSearch className="text-6xl mx-auto mb-4 text-gray-500" />
            <h3 className="text-2xl font-semibold mb-2">No matches found</h3>
            <p className="text-gray-400">
              {search.trim()
                ? 'Try a different search term'
                : 'Check back later for updates'}
            </p>
          </GlassCard>
        ) : (
          <>
            {view === 'normal' && <NormalView groups={groups} />}
            {view === 'table' && <TableView groups={groups} />}
            {view === 'grid' && <GridView groups={groups} />}

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Matches;