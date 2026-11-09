// frontend/src/pages/ViewerDashboard.jsx
import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import NewsCard from '../components/NewsCard';
import { newsAPI, matchesAPI, playersAPI, tableAPI, vendorAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  FaFire, FaChartLine, FaTrophy, FaFutbol, FaExclamationTriangle,
  FaSyncAlt, FaStore, FaShoppingBag, FaTicketAlt, FaArrowRight,
  FaFacebookF, FaInstagram, FaYoutube, FaBolt, FaCalendarAlt,
  FaClock, FaUserPlus, FaShieldAlt,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import {
  getTeamName,
  getScoreText,
  formatMatchDate,
  formatMatchTime,
  canBuyTickets,
  getTicketUrl,
  isMatchTicketed,
  resolveStatus,
} from '../utils/matchUtils';

const TICKETS_URL = (import.meta.env.VITE_API_FRONTEND_TICKETS || 'https://tickets.faz.kanchtech.com').replace(/\/$/, '');
const SHOP_URL = (import.meta.env.VITE_API_FRONTEND_SHOP || 'https://shop.faz.kanchtech.com').replace(/\/$/, '');

const ViewerDashboard = () => {
  const { user } = useAuth();

  // Data
  const [featuredNews, setFeaturedNews] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [leagueLeaders, setLeagueLeaders] = useState(null);

  // UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('');

  // Vendor state (definitive — from API, not role)
  const [vendorState, setVendorState] = useState({
    loading: true,
    hasAccount: false,
    status: null, // 'approved' | 'pending' | 'rejected' | 'suspended'
  });

  // ---------- Load available seasons ----------
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await tableAPI.getSeasons();
        const seasons = res.data || [];
        if (seasons.length === 0) {
          setSelectedSeason(new Date().getFullYear().toString());
          return;
        }
        seasons.sort((a, b) => b.localeCompare(a));
        setSelectedSeason(seasons[0]);
      } catch (err) {
        console.error('Failed to fetch seasons:', err);
        setSelectedSeason(new Date().getFullYear().toString());
      }
    };
    fetchSeasons();
  }, []);

  // ---------- Check vendor status definitively ----------
  useEffect(() => {
    if (!user) {
      setVendorState({ loading: false, hasAccount: false, status: null });
      return;
    }
    let cancelled = false;
    vendorAPI.getMe()
      .then((res) => {
        if (!cancelled) {
          setVendorState({
            loading: false,
            hasAccount: true,
            status: res.data?.status || 'pending',
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVendorState({ loading: false, hasAccount: false, status: null });
        }
      });
    return () => { cancelled = true; };
  }, [user]);

  // ---------- Re-check vendor status when tab regains focus ----------
  // Handles the case where the user registered in another tab or returned
  // from /vendor/register without a hard reload.
  useEffect(() => {
    if (!user) return;
    const recheck = () => {
      vendorAPI.getMe()
        .then((res) => {
          setVendorState({
            loading: false,
            hasAccount: true,
            status: res.data?.status || 'pending',
          });
        })
        .catch(() => {
          setVendorState({ loading: false, hasAccount: false, status: null });
        });
    };
    window.addEventListener('focus', recheck);
    return () => window.removeEventListener('focus', recheck);
  }, [user]);

  // ---------- Load dashboard data ----------
  useEffect(() => {
    if (!selectedSeason) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeason]);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [news, latest, upcoming, scorers, table] = await Promise.all([
        newsAPI.getFeatured(),
        matchesAPI.getLatest(),
        matchesAPI.getUpcoming(),
        playersAPI.getTopScorers(),
        tableAPI.getTable(selectedSeason),
      ]);
      setFeaturedNews(news.data || []);
      setRecentMatches(latest.data || []);
      setUpcomingMatches(upcoming.data || []);
      setTopScorers(scorers.data || []);
      setLeagueTable(table.data || []);
      setLeagueLeaders(table.data && table.data.length > 0 ? table.data[0] : null);
    } catch (err) {
      console.error(err);
      setError('Unable to load latest data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => fetchData(true);

  // ---------- Derived ----------
  const nextMatch = upcomingMatches[0] || null;
  const latestResult = recentMatches[0] || null;
  const topScorer = topScorers[0] || null;
  const isVendor = vendorState.hasAccount;

  // ---------- Vendor CTA (toggle) ----------
  //   hasAccount === true   → "View Vendor Dashboard"
  //   hasAccount === false  → "Register as Vendor"
  //   loading (user only)   → spinner
  const renderVendorCTA = () => {
    if (user && vendorState.loading) {
      return (
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 text-center w-[200px]">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs opacity-70">Checking vendor status…</p>
        </div>
      );
    }

    if (isVendor) {
      const colorMap = {
        approved: 'from-green-500 to-emerald-600',
        pending: 'from-yellow-500 to-orange-500',
        rejected: 'from-red-500 to-red-600',
        suspended: 'from-gray-500 to-gray-600',
      };
      const color = colorMap[vendorState.status] || 'from-green-500 to-emerald-600';
      return (
        <Link
          to="/vendor/dashboard"
          className={`inline-flex flex-col items-center bg-gradient-to-br ${color} text-white rounded-2xl px-6 py-4 hover:scale-105 transition shadow-xl`}
        >
          <FaStore className="w-7 h-7 mb-1" />
          <span className="text-sm font-bold">View Vendor Dashboard</span>
          <span className="text-[10px] uppercase tracking-wider opacity-90 mt-0.5">
            {vendorState.status}
          </span>
        </Link>
      );
    }

    return (
      <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 text-center w-[200px]">
        <FaStore className="w-7 h-7 text-faz-orange mx-auto mb-2" />
        <p className="text-xs mb-2 leading-tight">
          {user ? 'Start selling on FAZ Shop' : "Sell to Zambia's football community"}
        </p>
        <Link
          to="/vendor/register"
          className="inline-flex items-center gap-1 bg-white text-faz-green font-bold text-xs px-3 py-2 rounded-lg hover:bg-faz-orange hover:text-white transition"
        >
          <FaUserPlus /> {user ? 'Register as Vendor' : 'Become a Vendor'}
        </Link>
      </div>
    );
  };

  // ---------- Loading skeleton ----------
  if (loading) {
    return (
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <div className="animate-pulse space-y-8">
          <div className="h-48 bg-gray-700 rounded-3xl" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-gray-700 rounded w-1/4" />
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 bg-gray-700 rounded-xl" />
                <div className="h-64 bg-gray-700 rounded-xl" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-700 rounded-xl" />
              <div className="h-48 bg-gray-700 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-16">
      {/* ==================== HERO ==================== */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-faz-green via-faz-black to-faz-orange text-white shadow-2xl"
      >
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-widest text-faz-orange font-bold mb-2 flex items-center gap-2">
                <FaBolt /> Fan Zone
              </p>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">
                Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
              </h1>
              <p className="text-white/90 text-sm md:text-lg mb-4">
                Your home base for Zambian football — news, stats, fixtures, tickets, and everything Chipolopolo.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
                <a
                  href={`${TICKETS_URL}/matches`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-faz-orange hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold transition"
                >
                  <FaTicketAlt /> Buy Tickets
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">{renderVendorCTA()}</div>
          </div>
        </div>
      </motion.section>

      {error && (
        <GlassCard className="mb-6 text-center border-faz-red/50 bg-faz-red/10">
          <div className="flex items-center justify-center gap-2 text-faz-red">
            <FaExclamationTriangle /> {error}
          </div>
        </GlassCard>
      )}

      {/* ==================== QUICK STATS ==================== */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {/* League Leaders */}
        <GlassCard className="relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-10">
            <FaTrophy className="w-16 h-16 text-yellow-500" />
          </div>
          <p className="text-xs uppercase text-yellow-400 font-bold tracking-wider mb-1">
            League Leaders
          </p>
          {leagueLeaders?.team ? (
            <>
              <p className="text-xl font-bold text-white truncate">{leagueLeaders.team.name}</p>
              <p className="text-3xl font-extrabold gradient-text">
                {leagueLeaders.points}{' '}
                <span className="text-sm font-normal text-gray-300">pts</span>
              </p>
              <p className="text-xs text-gray-400">
                {leagueLeaders.played} played · GD{' '}
                {leagueLeaders.goals_for - leagueLeaders.goals_against}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-3">No table data for {selectedSeason}.</p>
          )}
        </GlassCard>

        {/* Top Scorer */}
        <GlassCard className="relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-10">
            <FaFutbol className="w-16 h-16 text-faz-green" />
          </div>
          <p className="text-xs uppercase text-faz-green font-bold tracking-wider mb-1">
            Top Scorer
          </p>
          {topScorer ? (
            <>
              <p className="text-xl font-bold text-white truncate">{topScorer.name}</p>
              <p className="text-3xl font-extrabold gradient-text">
                {topScorer.goals}{' '}
                <span className="text-sm font-normal text-gray-300">goals</span>
              </p>
              <p className="text-xs text-gray-400">{topScorer.team || 'Leading the chart'}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-3">No scorer data.</p>
          )}
        </GlassCard>

        {/* Latest Result */}
        <GlassCard className="relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-10">
            <FaClock className="w-16 h-16 text-faz-orange" />
          </div>
          <p className="text-xs uppercase text-faz-orange font-bold tracking-wider mb-1">
            Latest Result
          </p>
          {latestResult ? (
            <>
              <div className="flex items-center justify-between text-sm font-semibold text-white mt-2 gap-2">
                <span className="truncate" title={getTeamName(latestResult, 'home')}>
                  {getTeamName(latestResult, 'home')}
                </span>
                <span className="font-mono text-lg px-2 whitespace-nowrap">
                  {getScoreText(latestResult)}
                </span>
                <span className="truncate text-right" title={getTeamName(latestResult, 'away')}>
                  {getTeamName(latestResult, 'away')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {formatMatchDate(latestResult.match_date, 'MMM dd, yyyy')}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-3">No recent results.</p>
          )}
        </GlassCard>

        {/* Next Match */}
        <GlassCard className="relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-10">
            <FaCalendarAlt className="w-16 h-16 text-faz-red" />
          </div>
          <p className="text-xs uppercase text-faz-red font-bold tracking-wider mb-1">
            Next Match
          </p>
          {nextMatch ? (
            <>
              <p className="text-sm font-semibold text-white truncate mt-2">
                {getTeamName(nextMatch, 'home')} vs {getTeamName(nextMatch, 'away')}
              </p>
              <p className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                <FaClock size={10} />
                {formatMatchDate(nextMatch.match_date, 'MMM dd')} · {formatMatchTime(nextMatch.match_date) || 'TBC'}
              </p>
              {canBuyTickets(nextMatch) ? (
                <a
                  href={getTicketUrl(nextMatch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-faz-orange text-xs font-semibold mt-2 hover:underline"
                >
                  Buy Tickets <FaArrowRight size={10} />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-400 text-xs mt-2">
                  Tickets not yet on sale
                </span>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-3">No upcoming matches.</p>
          )}
        </GlassCard>
      </section>

      {/* ==================== NEWS + SIDEBAR ==================== */}
      <section className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <FaFire className="text-faz-orange" /> Latest News
            </h2>
            <Link
              to="/news"
              className="text-faz-green hover:text-faz-orange text-sm font-medium flex items-center gap-1"
            >
              View all <FaArrowRight size={10} />
            </Link>
          </div>
          {featuredNews.length === 0 ? (
            <GlassCard className="text-center py-8 text-gray-400">
              No news articles yet.
            </GlassCard>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {featuredNews.map((news, idx) => (
                <NewsCard key={news.id} news={news} index={idx} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Quick actions */}
          <GlassCard>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FaBolt className="text-faz-orange" /> Quick Actions
            </h3>
            <div className="space-y-2">
              <a
                href={`${TICKETS_URL}/matches`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition group"
              >
                <span className="w-9 h-9 rounded-lg bg-faz-orange/20 flex items-center justify-center text-faz-orange group-hover:bg-faz-orange group-hover:text-white transition">
                  <FaTicketAlt />
                </span>
                <span className="text-sm font-medium flex-1">Buy Match Tickets</span>
                <FaArrowRight size={10} className="text-gray-400" />
              </a>

              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition group"
              >
                <span className="w-9 h-9 rounded-lg bg-faz-green/20 flex items-center justify-center text-faz-green group-hover:bg-faz-green group-hover:text-white transition">
                  <FaShoppingBag />
                </span>
                <span className="text-sm font-medium flex-1">FAZ Shop</span>
                <FaArrowRight size={10} className="text-gray-400" />
              </a>

              <Link
                to="/matches"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition group"
              >
                <span className="w-9 h-9 rounded-lg bg-faz-red/20 flex items-center justify-center text-faz-red group-hover:bg-faz-red group-hover:text-white transition">
                  <FaFutbol />
                </span>
                <span className="text-sm font-medium flex-1">All Matches</span>
                <FaArrowRight size={10} className="text-gray-400" />
              </Link>

              <Link
                to="/national-teams"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition group"
              >
                <span className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white transition">
                  <FaShieldAlt />
                </span>
                <span className="text-sm font-medium flex-1">National Teams</span>
                <FaArrowRight size={10} className="text-gray-400" />
              </Link>
            </div>
          </GlassCard>

          {/* Top scorers */}
          <GlassCard>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FaChartLine className="text-faz-green" /> Top Scorers
            </h3>
            {topScorers.length === 0 ? (
              <p className="text-gray-400 text-sm">No scoring data available.</p>
            ) : (
              <div className="space-y-2">
                {topScorers.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={`w-5 text-center text-xs font-bold ${
                          i === 0
                            ? 'text-yellow-400'
                            : i === 1
                              ? 'text-gray-300'
                              : i === 2
                                ? 'text-orange-400'
                                : 'text-gray-500'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="font-bold text-faz-orange ml-2 whitespace-nowrap">
                      {p.goals} ⚽
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link
              to="/players"
              className="block mt-3 text-center text-faz-green hover:text-faz-orange text-sm"
            >
              All players →
            </Link>
          </GlassCard>

          {/* Mini table */}
          {leagueTable.length > 0 && (
            <GlassCard>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaTrophy className="text-yellow-500" /> League Top 5
              </h3>
              <div className="space-y-1.5">
                {leagueTable.slice(0, 5).map((row, i) => (
                  <div key={row.team?.id || i} className="flex items-center text-xs gap-2">
                    <span className="w-4 text-gray-400 font-mono">{i + 1}</span>
                    <span className="flex-1 truncate">{row.team?.name || '—'}</span>
                    <span className="font-mono text-gray-300">{row.played}</span>
                    <span className="font-mono text-faz-orange font-bold w-6 text-right">
                      {row.points}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to="/league-table"
                className="block mt-3 text-center text-faz-green hover:text-faz-orange text-sm"
              >
                Full table →
              </Link>
            </GlassCard>
          )}
        </div>
      </section>

      {/* ==================== UPCOMING FIXTURES ==================== */}
      {upcomingMatches.length > 0 && (
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <FaCalendarAlt className="text-faz-orange" /> Upcoming Fixtures
            </h2>
            <Link
              to="/matches"
              className="text-faz-green hover:text-faz-orange text-sm font-medium flex items-center gap-1"
            >
              All matches <FaArrowRight size={10} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMatches.slice(0, 6).map((m) => {
              const status = resolveStatus(m);
              const ticketed = isMatchTicketed(m);
              const buyable = canBuyTickets(m);
              const homeName = getTeamName(m, 'home');
              const awayName = getTeamName(m, 'away');

              return (
                <GlassCard key={m.id} className="flex flex-col">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatMatchDate(m.match_date, 'MMM dd')}</span>
                      {formatMatchTime(m.match_date) && (
                        <>
                          <span className="text-gray-600">·</span>
                          <span className="font-mono">{formatMatchTime(m.match_date)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {ticketed && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-faz-orange/20 text-faz-orange border border-faz-orange/30">
                          Ticketed
                        </span>
                      )}
                      {status === 'live' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span className="font-semibold text-sm truncate flex-1" title={homeName}>
                      {homeName}
                    </span>
                    <span className="text-xs text-faz-orange font-bold px-2 whitespace-nowrap">
                      {status === 'live' || status === 'finished' ? getScoreText(m) : 'VS'}
                    </span>
                    <span className="font-semibold text-sm truncate flex-1 text-right" title={awayName}>
                      {awayName}
                    </span>
                  </div>

                  {m.venue && (
                    <p className="text-[11px] text-gray-400 mb-3 truncate">📍 {m.venue}</p>
                  )}

                  {buyable ? (
                    <a
                      href={getTicketUrl(m)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center justify-center gap-2 bg-faz-orange hover:bg-red-600 text-white text-sm font-bold py-2 rounded-lg transition"
                    >
                      <FaTicketAlt /> Buy Tickets
                    </a>
                  ) : (
                    <div className="mt-auto text-center text-xs text-gray-500 italic py-2 border border-white/5 rounded-lg">
                      Tickets not yet on sale
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================== SOCIAL ==================== */}
      <section>
        <GlassCard className="text-center bg-gradient-to-br from-faz-green/20 via-transparent to-faz-orange/20">
          <h2 className="text-xl font-bold mb-1">Follow the Chipolopolo</h2>
          <p className="text-sm text-gray-400 mb-4">
            Never miss a moment — follow FAZ everywhere.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <a
              href="https://web.facebook.com/FootballAssociationZambia"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://x.com/FAZFootball"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-black hover:bg-gray-800 flex items-center justify-center transition"
              aria-label="X"
            >
              <FaXTwitter />
            </a>
            <a
              href="https://www.youtube.com/@FAZTVOfficial"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition"
              aria-label="YouTube"
            >
              <FaYoutube />
            </a>
            <a
              href="https://instagram.com/FAZ"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-500 hover:opacity-90 flex items-center justify-center transition"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};

export default ViewerDashboard;