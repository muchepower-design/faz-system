// frontend/src/utils/matchUtils.js
import { format, isValid } from 'date-fns';

export const TICKETS_BASE_URL = (import.meta.env.VITE_API_FRONTEND_TICKETS || '').replace(/\/$/, '');

const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;
const LIVE_WINDOW_BEFORE_MS = 15 * 60 * 1000;

/* ================================================================
 * Team names — country-aware, club-aware
 * ================================================================ */
export const getTeamName = (match, side) => {
  if (!match) return 'TBD';
  const info = side === 'home' ? match.home_team_info : match.away_team_info;
  const fallback = side === 'home' ? match.home_team : match.away_team;

  const isClubs =
    match.participant_type === 'clubs' ||
    (info && info.name && !info.country_name) ||
    (info && info.name && info.country_name && match.participant_type !== 'national');

  if (isClubs) {
    return (info && info.name) || fallback || 'TBD';
  }
  return (info && info.country_name) || fallback || 'TBD';
};

export const getTeamDisplayName = (match, side) => {
  if (!match) return 'TBD';
  const info = side === 'home' ? match.home_team_info : match.away_team_info;
  const fallback = side === 'home' ? match.home_team : match.away_team;
  const isClubs = match.participant_type === 'clubs';

  if (isClubs) {
    const clubName = (info && info.name) || fallback || 'TBD';
    return info?.country_name ? `[${info.country_name}] ${clubName}` : clubName;
  }
  return (info && info.country_name) || fallback || 'TBD';
};

/* ================================================================
 * Dates
 * ================================================================ */
export const getDateObject = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isValid(d) ? d : null;
};

export const getDateKey = (value) => {
  const d = getDateObject(value);
  return d ? format(d, 'yyyy-MM-dd') : 'tbd';
};

export const formatMatchDate = (value, pattern = 'EEE, MMM dd, yyyy') => {
  const d = getDateObject(value);
  return d ? format(d, pattern) : 'Date TBC';
};

export const formatMatchTime = (value) => {
  const d = getDateObject(value);
  return d ? format(d, 'HH:mm') : '';
};

/* ================================================================
 * Display status
 * ================================================================ */
export const getDisplayStatus = (match) => {
  const raw = (match?.status || '').toLowerCase();

  if (
    raw === 'live' ||
    raw === 'finished' ||
    raw === 'cancelled' ||
    raw === 'postponed' ||
    raw === 'abandoned'
  ) {
    return raw;
  }

  const d = getDateObject(match?.match_date);
  if (!d) return raw || 'scheduled';

  const now = Date.now();
  const start = d.getTime();
  const end = start + MATCH_DURATION_MS;

  if (now >= end) return 'finished';
  if (now >= start - LIVE_WINDOW_BEFORE_MS && now < end) return 'live';
  return 'scheduled';
};

export const resolveStatus = (match) =>
  match?._status || getDisplayStatus(match);

export const matchesStatusFilter = (match, filter) => {
  if (filter === 'all') return true;
  const status = resolveStatus(match);
  if (filter === 'upcoming') return status === 'scheduled';
  return status === filter;
};

/* ================================================================
 * Score / colors
 * ================================================================ */
export const isScoreVisible = (match) => {
  const s = resolveStatus(match);
  return s === 'live' || s === 'finished';
};

export const getScoreText = (match) => {
  if (!isScoreVisible(match)) return 'VS';
  return `${match?.home_score ?? 0} - ${match?.away_score ?? 0}`;
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'live':
      return 'text-red-500 animate-pulse';
    case 'finished':
      return 'text-faz-green';
    case 'cancelled':
    case 'postponed':
    case 'abandoned':
      return 'text-gray-400';
    default:
      return 'text-faz-orange';
  }
};

/* ================================================================
 * Ticketing
 * ================================================================ */
export const hasTicketTypes = (match) =>
  Array.isArray(match?.ticket_types) && match.ticket_types.length > 0;

export const isMatchTicketed = (match) => {
  if (!match) return false;
  return (
    match.is_ticketed === true ||
    match.is_ticketed === 'true' ||
    match.ticketed === true ||
    match.ticketed === 'true' ||
    match.status === 'ticketed'
  );
};

export const canBuyTickets = (match) => {
  if (!match) return false;

  const s = resolveStatus(match);
  if (['finished', 'cancelled', 'postponed', 'abandoned'].includes(s)) {
    return false;
  }

  if (Array.isArray(match.ticket_types) && match.ticket_types.length === 0) {
    return false;
  }

  return isMatchTicketed(match);
};

export const getTicketUrl = (match) => {
  if (!match?.id) return TICKETS_BASE_URL ? `${TICKETS_BASE_URL}/matches` : '/matches';
  return `${TICKETS_BASE_URL}/matches/${match.id}`;
};

/* ================================================================
 * Search
 * ================================================================ */
export const matchesSearch = (match, query) => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    getTeamName(match, 'home'),
    getTeamName(match, 'away'),
    match?.home_team,
    match?.away_team,
    match?.competition,
    match?.venue,
    resolveStatus(match),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
};

/* ================================================================
 * Grouping
 * ================================================================ */
export const groupMatches = (matches = []) => {
  const competitions = new Map();

  matches.forEach((match) => {
    const competitionName = match.competition || 'Other Competitions';
    const dateKey = getDateKey(match.match_date);

    if (!competitions.has(competitionName)) {
      competitions.set(competitionName, {
        key: competitionName,
        competition: competitionName,
        total: 0,
        dates: new Map(),
      });
    }

    const comp = competitions.get(competitionName);
    comp.total += 1;

    if (!comp.dates.has(dateKey)) {
      comp.dates.set(dateKey, {
        dateKey,
        label: formatMatchDate(match.match_date, 'EEEE, MMM dd, yyyy'),
        matches: [],
      });
    }

    comp.dates.get(dateKey).matches.push(match);
  });

  return Array.from(competitions.values()).map((comp) => ({
    key: comp.key,
    competition: comp.competition,
    total: comp.total,
    dates: Array.from(comp.dates.values()).sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey)
    ),
  }));
};