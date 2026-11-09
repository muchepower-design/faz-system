// frontend/src/pages/NationalTeamDetail.jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { nationalTeamsAPI } from '../api';
import { motion } from 'framer-motion';
import {
  FaCalendarAlt,
  FaTrophy,
  FaUsers,
  FaChartLine,
  FaFutbol,
  FaFlag,
  FaMapMarker,
  FaTicketAlt,
  FaSearch,
  FaList,
  FaTable,
  FaTh,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import {
  resolveStatus,
  formatMatchDate,
  getStatusColor,
  getTicketUrl,
  getTeamDisplayName,
} from '../utils/matchUtils';

/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */
const VIEWS = [
  { value: 'normal', label: 'List', icon: FaList },
  { value: 'table', label: 'Table', icon: FaTable },
  { value: 'grid', label: 'Grid', icon: FaTh },
];

const PAGE_SIZE_OPTIONS = [3, 5, 6, 9, 10, 12, 15, 20, 30, 50];
const DEFAULT_PAST_PAGE_SIZES = { normal: 5, table: 10, grid: 6 };

/* ------------------------------------------------------------------ */
/* Result badge                                                       */
/* ------------------------------------------------------------------ */
const ResultBadge = ({ result, small }) => {
  const size = small ? 'text-[11px] px-2 py-0.5' : 'text-sm px-3 py-1';
  if (!result) {
    return <span className={`glass ${size} rounded-full`}>Upcoming</span>;
  }
  if (result === 'win') {
    return (
      <span className={`bg-faz-green/20 text-faz-green ${size} rounded-full`}>
        Win
      </span>
    );
  }
  if (result === 'loss') {
    return (
      <span className={`bg-faz-red/20 text-faz-red ${size} rounded-full`}>
        Loss
      </span>
    );
  }
  return (
    <span className={`bg-yellow-500/20 text-yellow-500 ${size} rounded-full`}>
      Draw
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Team flag (with graceful fallback to nothing)                      */
/* ------------------------------------------------------------------ */
const TeamFlag = ({ info, size = 'md' }) => {
  const url = info?.country_flag_image_url;
  if (!url) return null;
  const cls = size === 'sm' ? 'w-5 h-3.5' : 'w-6 h-4';
  return (
    <img
      src={url}
      alt=""
      className={`${cls} rounded-sm object-cover shrink-0 border border-white/10`}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Ticket section                                                     */
/* ------------------------------------------------------------------ */
const TicketSection = ({ fixture }) => {
  const available = Number(fixture.total_available) || 0;
  const capacity = Number(fixture.total_capacity) || 0;
  const sold = Number(fixture.total_tickets_sold) || 0;
  const ticketTypes = Array.isArray(fixture.ticket_types)
    ? fixture.ticket_types
    : [];

  const soldPercent =
    capacity > 0 ? Math.min(100, (sold / capacity) * 100) : 0;

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-faz-orange">
          <FaTicketAlt /> Tickets
        </div>
        {capacity > 0 && (
          <div className="text-xs text-gray-400">
            <span className="text-white font-semibold">{available}</span> of{' '}
            <span className="text-white font-semibold">{capacity}</span>{' '}
            available
          </div>
        )}
      </div>

      {capacity > 0 && (
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-faz-green to-faz-orange transition-all"
            style={{ width: `${soldPercent}%` }}
          />
        </div>
      )}

      {ticketTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {ticketTypes.map((tt, i) => (
            <span
              key={i}
              className="glass px-3 py-1.5 rounded-lg text-xs flex items-center gap-2"
            >
              <span className="text-gray-300">
                {tt.name || tt.type || 'Ticket'}
              </span>
              {tt.price != null && (
                <span className="text-faz-green font-semibold">
                  {tt.currency || 'ZMW'} {tt.price}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <a
        href={getTicketUrl(fixture)}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                   bg-gradient-to-r from-faz-green to-faz-orange text-white font-semibold
                   hover:opacity-90 transition"
      >
        <FaTicketAlt /> Buy Match Ticket
      </a>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Fixture card (normal / list view)                                  */
/* ------------------------------------------------------------------ */
const FixtureCard = ({ fixture }) => {
  const { _status, _isPlayed, _result } = fixture;

  const homeName = getTeamDisplayName(fixture, 'home');
  const awayName = getTeamDisplayName(fixture, 'away');

  const homeScore = fixture.home_score ?? 0;
  const awayScore = fixture.away_score ?? 0;

  const isTicketed = fixture.is_ticketed === true && _status !== 'finished';

  return (
    <GlassCard>
      {/* Header: date + status */}
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <p className="text-xs text-gray-400">
          <FaCalendarAlt className="inline mr-1.5 text-faz-green" />
          {formatMatchDate(fixture.match_date, 'EEE, MMM dd, yyyy • HH:mm')}
        </p>
        <span
          className={`glass px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(
            _status
          )}`}
        >
          {_status.toUpperCase()}
        </span>
      </div>

      {/* Home vs Away */}
      <div className="flex items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="font-semibold text-sm md:text-base truncate text-right text-white">
            {homeName}
          </span>
          <TeamFlag info={fixture.home_team_info} />
        </div>

        <div className="shrink-0 text-center px-2">
          {_isPlayed ? (
            <div className="text-xl md:text-2xl font-bold gradient-text whitespace-nowrap">
              {homeScore} - {awayScore}
            </div>
          ) : (
            <div className="text-sm md:text-base font-bold text-gray-500">
              vs
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-start">
          <TeamFlag info={fixture.away_team_info} />
          <span className="font-semibold text-sm md:text-base truncate text-white">
            {awayName}
          </span>
        </div>
      </div>

      {/* Venue */}
      <p className="text-center text-xs text-gray-500 mt-2">
        <FaMapMarker className="inline mr-1 text-faz-orange" />
        Venue: {fixture.venue || 'Venue TBC'}
      </p>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-1.5 justify-center mt-3">
        {fixture.competition && (
          <span className="glass px-2.5 py-1 rounded-full text-[11px] font-medium">
            {fixture.competition}
          </span>
        )}
        {fixture.competition_type && (
          <span className="glass px-2.5 py-1 rounded-full text-[11px] font-medium text-faz-orange capitalize">
            {fixture.competition_type}
          </span>
        )}
        {fixture.season && (
          <span className="glass px-2.5 py-1 rounded-full text-[11px] font-medium">
            {fixture.season}
          </span>
        )}
        {fixture.stage && (
          <span className="glass px-2.5 py-1 rounded-full text-[11px] font-medium text-faz-green">
            {fixture.stage}
          </span>
        )}
        {fixture.group && (
          <span className="glass px-2.5 py-1 rounded-full text-[11px] font-medium">
            {fixture.group}
          </span>
        )}
      </div>

      {/* Result badge */}
      <div className="flex justify-center mt-3">
        <ResultBadge result={_isPlayed ? _result : null} />
      </div>

      {/* Tickets */}
      {isTicketed && <TicketSection fixture={fixture} />}
    </GlassCard>
  );
};

/* ------------------------------------------------------------------ */
/* Fixture grid card                                                  */
/* ------------------------------------------------------------------ */
const FixtureGridCard = ({ fixture }) => {
  const { _status, _isPlayed, _result } = fixture;

  const homeName = getTeamDisplayName(fixture, 'home');
  const awayName = getTeamDisplayName(fixture, 'away');
  const homeScore = fixture.home_score ?? 0;
  const awayScore = fixture.away_score ?? 0;
  const isTicketed = fixture.is_ticketed === true && _status !== 'finished';

  return (
    <GlassCard className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="glass px-2 py-0.5 rounded-full font-mono text-gray-300">
          #{fixture._sn}
        </span>
        <span
          className={`glass px-2 py-0.5 rounded-full font-semibold ${getStatusColor(
            _status
          )}`}
        >
          {_status.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className="text-xs md:text-sm font-semibold text-white truncate text-right">
            {homeName}
          </span>
          <TeamFlag info={fixture.home_team_info} size="sm" />
        </div>

        <div className="shrink-0 text-center px-1">
          {_isPlayed ? (
            <div className="text-base md:text-lg font-bold gradient-text whitespace-nowrap">
              {homeScore} - {awayScore}
            </div>
          ) : (
            <div className="text-xs font-bold text-gray-500">vs</div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-start">
          <TeamFlag info={fixture.away_team_info} size="sm" />
          <span className="text-xs md:text-sm font-semibold text-white truncate">
            {awayName}
          </span>
        </div>
      </div>

      <div className="text-[11px] text-gray-400 space-y-1 mt-auto pt-2 border-t border-white/10">
        <div>
          <FaCalendarAlt className="inline mr-1 text-faz-green" />
          {formatMatchDate(fixture.match_date, 'EEE, MMM dd, yyyy')}
        </div>
        <div className="truncate">
          <FaMapMarker className="inline mr-1 text-faz-orange" />
          {fixture.venue || 'Venue TBC'}
        </div>
      </div>

      {fixture.competition && (
        <div className="flex flex-wrap gap-1">
          <span className="glass px-2 py-0.5 rounded-full text-[10px]">
            {fixture.competition}
          </span>
          {fixture.competition_type && (
            <span className="glass px-2 py-0.5 rounded-full text-[10px] text-faz-orange capitalize">
              {fixture.competition_type}
            </span>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <ResultBadge result={_isPlayed ? _result : null} small />
      </div>

      {isTicketed && (
        <a
          href={getTicketUrl(fixture)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs
                     bg-gradient-to-r from-faz-green to-faz-orange text-white font-semibold
                     hover:opacity-90 transition"
        >
          <FaTicketAlt /> Buy Match Ticket
        </a>
      )}
    </GlassCard>
  );
};

/* ------------------------------------------------------------------ */
/* Fixture table                                                      */
/* ------------------------------------------------------------------ */
const FixtureTable = ({ fixtures }) => (
  <div className="glass overflow-hidden rounded-2xl">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left border-collapse">
        <thead className="bg-white/10 text-[11px] uppercase tracking-wider text-gray-300">
          <tr>
            <th className="px-3 py-3 w-12">SN</th>
            <th className="px-3 py-3 whitespace-nowrap">Date</th>
            <th className="px-3 py-3 text-right">Home Team</th>
            <th className="px-3 py-3 text-center whitespace-nowrap">Score</th>
            <th className="px-3 py-3">Away Team</th>
            <th className="px-3 py-3">Competition</th>
            <th className="px-3 py-3">Venue</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3 text-center">Result</th>
          </tr>
        </thead>
        <tbody>
          {fixtures.map((fx) => {
            const homeName = getTeamDisplayName(fx, 'home');
            const awayName = getTeamDisplayName(fx, 'away');
            const homeScore = fx.home_score ?? 0;
            const awayScore = fx.away_score ?? 0;

            return (
              <tr
                key={fx.id}
                className="border-t border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="px-3 py-3 text-gray-400 font-mono text-xs">
                  {fx._sn}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-300">
                  {formatMatchDate(fx.match_date, 'MMM dd, yyyy')}
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-white">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="truncate max-w-[220px]">{homeName}</span>
                    <TeamFlag info={fx.home_team_info} size="sm" />
                  </div>
                </td>
                <td className="px-3 py-3 text-center font-bold gradient-text whitespace-nowrap">
                  {fx._isPlayed ? `${homeScore} - ${awayScore}` : 'vs'}
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <TeamFlag info={fx.away_team_info} size="sm" />
                    <span className="truncate max-w-[220px]">{awayName}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-gray-300">
                  {fx.competition ? (
                    <div className="flex flex-col">
                      <span>{fx.competition}</span>
                      {fx.competition_type && (
                        <span className="text-[10px] text-faz-orange capitalize">
                          {fx.competition_type}
                        </span>
                      )}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-gray-300 truncate max-w-[180px]">
                  {fx.venue || 'TBC'}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`text-[11px] font-semibold ${getStatusColor(
                      fx._status
                    )}`}
                  >
                    {fx._status.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <ResultBadge
                    result={fx._isPlayed ? fx._result : null}
                    small
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Pagination                                                         */
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
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
/* Page                                                               */
/* ------------------------------------------------------------------ */
const NationalTeamDetail = () => {
  const { teamId } = useParams();

  const [team, setTeam] = useState(null);
  const [rawFixtures, setRawFixtures] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('fixtures');

  /* ---- All Past Matches: view / search / pagination state ---- */
  const [pastView, setPastView] = useState('normal');
  const [pastSearch, setPastSearch] = useState('');
  const [pastPage, setPastPage] = useState(1);
  const [pastPageSizes, setPastPageSizes] = useState(DEFAULT_PAST_PAGE_SIZES);
  const pastPageSize = pastPageSizes[pastView];

  /* --------------------------- fetch --------------------------- */
  useEffect(() => {
    if (!teamId) return;

    let cancelled = false;
    setLoading(true);
    setError('');

    const fetchTeamData = async () => {
      try {
        const [teamRes, fixturesRes, tournamentsRes] = await Promise.all([
          nationalTeamsAPI.getById(teamId),
          nationalTeamsAPI.getFixtures(teamId),
          nationalTeamsAPI.getTournaments(teamId),
        ]);

        if (cancelled) return;

        setTeam(teamRes?.data || null);
        setRawFixtures(
          Array.isArray(fixturesRes?.data) ? fixturesRes.data : []
        );
        setTournaments(
          Array.isArray(tournamentsRes?.data) ? tournamentsRes.data : []
        );
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTeamData();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  /* ------------------------------------------------------------
     Derive status / result / home-away per fixture
     ------------------------------------------------------------ */
  const fixtures = useMemo(() => {
    if (!teamId) return [];
    const tid = String(teamId);

    return rawFixtures.map((fx) => {
      const status = resolveStatus(fx);
      const isHome = String(fx.home_team_id) === tid;

      const teamScore = isHome ? fx.home_score : fx.away_score;
      const opponentScore = isHome ? fx.away_score : fx.home_score;

      const isPlayed = status === 'finished';

      let result = null;
      if (isPlayed) {
        const t = Number(teamScore) || 0;
        const o = Number(opponentScore) || 0;
        if (t > o) result = 'win';
        else if (t < o) result = 'loss';
        else result = 'draw';
      }

      return {
        ...fx,
        _status: status,
        _isHome: isHome,
        _teamScore: teamScore ?? 0,
        _opponentScore: opponentScore ?? 0,
        _isPlayed: isPlayed,
        _result: result,
      };
    });
  }, [rawFixtures, teamId]);

  const now = Date.now();
  const upcomingFixtures = fixtures
    .filter((f) => !f._isPlayed && new Date(f.match_date).getTime() > now)
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

  const pastFixtures = fixtures
    .filter((f) => f._isPlayed)
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date));

  /* First 5 most-recent past matches */
  const recentPastFixtures = pastFixtures.slice(0, 5);

  /* All past matches — search + paginate */
  const filteredPastFixtures = useMemo(() => {
    const q = pastSearch.trim().toLowerCase();
    if (!q) return pastFixtures;

    return pastFixtures.filter((fx) => {
      const homeName = getTeamDisplayName(fx, 'home');
      const awayName = getTeamDisplayName(fx, 'away');
      const haystack = [
        homeName,
        awayName,
        fx.competition,
        fx.competition_type,
        fx.venue,
        fx.season,
        fx.stage,
        fx.group,
        fx._status,
        fx._result,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [pastFixtures, pastSearch]);

  const pastTotalPages = Math.max(
    1,
    Math.ceil(filteredPastFixtures.length / pastPageSize)
  );
  const pastCurrentPage = Math.min(pastPage, pastTotalPages);

  const pastPageItems = useMemo(() => {
    const startIndex = (pastCurrentPage - 1) * pastPageSize;
    return filteredPastFixtures
      .slice(startIndex, startIndex + pastPageSize)
      .map((fx, i) => ({ ...fx, _sn: startIndex + i + 1 }));
  }, [filteredPastFixtures, pastCurrentPage, pastPageSize]);

  useEffect(() => {
    setPastPage(1);
  }, [pastSearch, pastView]);

  const handlePastPageSizeChange = (size) => {
    setPastPageSizes((prev) => ({ ...prev, [pastView]: size }));
    setPastPage(1);
  };

  const handlePastPageChange = (next) => {
    setPastPage(next);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getTournamentIcon = (category) => {
    switch (category) {
      case 'fifa_world_cup':
        return '🏆';
      case 'afcon':
      case 'wafcon':
        return '🌍';
      case 'cosafa':
        return '🇿🇦';
      case 'olympics':
        return '🏅';
      case 'chan':
        return '⭐';
      default:
        return '⚽';
    }
  };

  /* ----------------------------- loading ---------------------- */
  if (loading) {
    return (
      <div className="pt-24 text-center">
        <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  /* ------------------------------ error ----------------------- */
  if (error || !team) {
    return (
      <>
        <div className="pt-24 min-h-screen container mx-auto px-6">
          <Link
            to="/national-teams"
            className="text-faz-orange hover:text-faz-green mb-4 inline-block"
          >
            ← Back to National Teams
          </Link>
          <GlassCard className="text-center py-12 text-gray-400">
            <FaFlag className="text-5xl mx-auto mb-4 opacity-40" />
            <p className="text-lg">{error || 'Team not found.'}</p>
          </GlassCard>
        </div>
        <Footer />
      </>
    );
  }

  /* --------------------------- derived stats ------------------ */
  const countryName =
    team.country?.name || team.country_name || team.name || 'National Team';
  const teamNickname = team.nickname || null;
  const fifaCode = team.fifa_code || null;
  const flagUrl = team.flag_image_url || team.country_flag_image_url || null;

  const playedFixtures = fixtures.filter((f) => f._isPlayed);
  const winCount = playedFixtures.filter((f) => f._result === 'win').length;
  const drawCount = playedFixtures.filter((f) => f._result === 'draw').length;
  const lossCount = playedFixtures.filter((f) => f._result === 'loss').length;
  const winRate =
    playedFixtures.length > 0
      ? Math.round((winCount / playedFixtures.length) * 100)
      : 0;
  const titles = tournaments.filter(
    (t) => t.round_reached === 'Winner'
  ).length;

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/national-teams"
            className="text-faz-orange hover:text-faz-green mb-4 inline-block"
          >
            ← Back to National Teams
          </Link>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-32 h-24 rounded-lg overflow-hidden shadow-lg bg-gradient-to-br from-faz-green to-faz-orange flex items-center justify-center flex-shrink-0">
              {flagUrl ? (
                <img
                  src={flagUrl}
                  alt={`${team.name || countryName} flag`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <FaFlag className="text-white text-4xl" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                  {countryName}
                </h1>
                {fifaCode && (
                  <span className="glass px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider">
                    {fifaCode}
                  </span>
                )}
              </div>

              <p className="text-gray-300 mt-1">
                {team.gender === 'Female' ? "Women's" : "Men's"}
                {team.age_group ? ` • ${team.age_group.toUpperCase()}` : ''}
              </p>

              {teamNickname && (
                <p className="text-faz-orange text-sm italic mt-0.5">
                  “{teamNickname}”
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <GlassCard>
            <div className="flex items-center gap-3">
              <FaUsers className="text-2xl text-faz-orange" />
              <div>
                <p className="text-gray-400 text-sm">Head Coach</p>
                <p className="font-semibold">{team.coach || 'TBA'}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <FaTrophy className="text-2xl text-yellow-500" />
              <div>
                <p className="text-gray-400 text-sm">Major Titles</p>
                <p className="font-semibold">{titles}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <FaChartLine className="text-2xl text-faz-green" />
              <div>
                <p className="text-gray-400 text-sm">Record (W-D-L)</p>
                <p className="font-semibold">
                  {winCount}-{drawCount}-{lossCount}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <FaFutbol className="text-2xl text-faz-orange" />
              <div>
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="font-semibold">{winRate}%</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 mb-6 overflow-x-auto">
          {['fixtures', 'tournaments', 'squad'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-4 capitalize transition-all duration-300 whitespace-nowrap ${
                activeTab === tab
                  ? 'text-faz-orange border-b-2 border-faz-orange'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'fixtures'
                ? 'Fixtures & Results'
                : tab === 'tournaments'
                ? 'Tournament History'
                : 'Squad'}
            </button>
          ))}
        </div>

        {/* Fixtures tab */}
        {activeTab === 'fixtures' && (
          <div className="space-y-10">
            {/* Upcoming Fixtures */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-faz-orange" /> Upcoming Fixtures
              </h2>
              {upcomingFixtures.length === 0 ? (
                <GlassCard className="text-center py-6 text-gray-400">
                  No upcoming fixtures scheduled.
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {upcomingFixtures.map((fixture) => (
                    <FixtureCard key={fixture.id} fixture={fixture} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Results (immediate past 5) */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FaTrophy className="text-faz-green" /> Recent Results
              </h2>
              {recentPastFixtures.length === 0 ? (
                <GlassCard className="text-center py-6 text-gray-400">
                  No past matches recorded.
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {recentPastFixtures.map((fixture) => (
                    <FixtureCard key={fixture.id} fixture={fixture} />
                  ))}
                </div>
              )}
            </div>

            {/* All Past Matches — search + 3 views + pagination */}
            <div>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <FaList className="text-faz-orange" /> All Past Matches
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative w-full sm:w-72">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      value={pastSearch}
                      onChange={(e) => setPastSearch(e.target.value)}
                      placeholder="Search team, competition, venue…"
                      className="w-full glass rounded-full pl-10 pr-4 py-2 text-sm text-white
                                 placeholder-gray-400 outline-none focus:ring-2
                                 focus:ring-faz-green/70 transition"
                    />
                  </div>

                  {/* View switcher */}
                  <div className="glass rounded-full p-1 flex items-center gap-1">
                    {VIEWS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPastView(value)}
                        title={label}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs
                                    font-medium transition-all ${
                                      pastView === value
                                        ? 'bg-gradient-to-r from-faz-green to-faz-orange text-white'
                                        : 'text-gray-300 hover:bg-white/10'
                                    }`}
                      >
                        <Icon className="text-[10px]" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Rows-per-page dropdown */}
                  <div className="glass rounded-full pl-3 pr-2 py-1.5 flex items-center gap-2">
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      Per page
                    </span>
                    <select
                      value={pastPageSize}
                      onChange={(e) =>
                        handlePastPageSizeChange(Number(e.target.value))
                      }
                      className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer py-0.5 pr-1"
                      aria-label="Rows per page"
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option
                          key={n}
                          value={n}
                          className="bg-slate-800 text-white"
                        >
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {filteredPastFixtures.length === 0 ? (
                <GlassCard className="text-center py-12 text-gray-400">
                  <FaSearch className="text-4xl mx-auto mb-3 opacity-40" />
                  <p>
                    {pastSearch.trim()
                      ? `No matches found for “${pastSearch.trim()}”.`
                      : 'No past matches recorded.'}
                  </p>
                </GlassCard>
              ) : (
                <>
                  {pastView === 'normal' && (
                    <div className="space-y-4">
                      {pastPageItems.map((fixture) => (
                        <FixtureCard key={fixture.id} fixture={fixture} />
                      ))}
                    </div>
                  )}

                  {pastView === 'table' && (
                    <FixtureTable fixtures={pastPageItems} />
                  )}

                  {pastView === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {pastPageItems.map((fixture) => (
                        <FixtureGridCard
                          key={fixture.id}
                          fixture={fixture}
                        />
                      ))}
                    </div>
                  )}

                  <Pagination
                    page={pastCurrentPage}
                    totalPages={pastTotalPages}
                    totalItems={filteredPastFixtures.length}
                    pageSize={pastPageSize}
                    onChange={handlePastPageChange}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Tournaments tab */}
        {activeTab === 'tournaments' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Major Tournament History
            </h2>

            {tournaments.length === 0 ? (
              <GlassCard className="text-center py-12 text-gray-400 mb-8">
                <FaTrophy className="text-5xl mx-auto mb-4 opacity-40" />
                <p>No tournament history recorded yet.</p>
              </GlassCard>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {tournaments
                  .filter(
                    (t) => t.tournament_name !== 'International Friendly'
                  )
                  .map((tournament) => (
                    <GlassCard key={tournament.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-3xl">
                          {getTournamentIcon(tournament.category)}
                        </div>
                        {tournament.round_reached === 'Winner' && (
                          <FaTrophy className="text-yellow-500 text-xl" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold">
                        {tournament.tournament_name}
                      </h3>
                      <p className="text-gray-400">{tournament.year}</p>
                      <div className="mt-3">
                        <span
                          className={`glass px-3 py-1 rounded-full text-sm ${
                            tournament.round_reached === 'Winner'
                              ? 'text-yellow-500'
                              : tournament.round_reached ===
                                'Did Not Qualify'
                              ? 'text-faz-red'
                              : 'text-faz-green'
                          }`}
                        >
                          {tournament.round_reached || 'Participated'}
                        </span>
                      </div>
                    </GlassCard>
                  ))}
              </div>
            )}

            <GlassCard>
              <h3 className="text-xl font-bold mb-4">Tournament Information</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-faz-orange mb-2">
                    Men's Tournaments
                  </h4>
                  <ul className="space-y-1 text-gray-300">
                    <li>
                      • <strong>AFCON</strong> – Qualifiers → Main Tournament
                    </li>
                    <li>
                      • <strong>FIFA World Cup</strong> – Qualifiers → Main
                      Tournament
                    </li>
                    <li>
                      • <strong>CHAN</strong> (U-23) – Qualifiers → Main
                      Tournament
                    </li>
                    <li>
                      • <strong>COSAFA Cup</strong> – Regional tournament
                    </li>
                    <li>
                      • <strong>Four Nations</strong> – Invitational friendly
                    </li>
                    <li>
                      • <strong>Olympics</strong> (Senior) – Qualifiers → Main
                      Tournament
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-faz-orange mb-2">
                    Women's Tournaments
                  </h4>
                  <ul className="space-y-1 text-gray-300">
                    <li>
                      • <strong>WAFCON</strong> – Qualifiers → Main Tournament
                    </li>
                    <li>
                      • <strong>FIFA Women's World Cup</strong> – Qualifiers →
                      Main Tournament
                    </li>
                    <li>
                      • <strong>COSAFA Women's Cup</strong> – Regional
                      tournament
                    </li>
                    <li>
                      • <strong>Olympics</strong> – Qualifiers → Main
                      Tournament
                    </li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Squad tab */}
        {activeTab === 'squad' && (
          <GlassCard className="text-center py-8 text-gray-400">
            <FaUsers className="text-5xl mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">
              Squad Information Coming Soon
            </h3>
            <p>
              Player profiles and squad list will be available in the next
              update.
            </p>
          </GlassCard>
        )}
      </div>
      <Footer />
    </>
  );
};

export default NationalTeamDetail;