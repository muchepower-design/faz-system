// frontend/src/pages/CompetitionDetail.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import api from '../api';
import { motion } from 'framer-motion';
import {
  FaTrophy, FaArrowLeft, FaHistory, FaChartLine, FaFilter,
} from 'react-icons/fa';

const CompetitionDetail = () => {
  const { competitionId } = useParams();

  const [competition, setCompetition] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('standings');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  // ---------- Helpers ----------
  const teamMap = useMemo(() => {
    const m = {};
    (teams || []).forEach(t => { m[t.id] = t; });
    return m;
  }, [teams]);

  const pickCurrentSeason = (list) => {
    if (!list || list.length === 0) return null;
    // prefer non-archived
    const active = list.find(s => !s.is_archived);
    if (active) return active;
    // otherwise the latest by started_at
    return [...list].sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''))[0];
  };

  // ---------- Fetch competition + seasons + teams ----------
  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [compRes, seasonsRes, teamsRes] = await Promise.all([
          api.get(`/competitions-management/competitions/${competitionId}`),
          api.get(`/competitions-management/competitions/${competitionId}/seasons`),
          api.get(`/competitions-management/teams/${competitionId}`, {
            params: { limit: 1000, skip_filter: 'true' }
          }),
        ]);

        if (cancelled) return;

        setCompetition(compRes.data);
        const sList = seasonsRes.data || [];
        setSeasons(sList);
        setTeams(teamsRes.data || []);

        const current = pickCurrentSeason(sList);
        if (current) setSelectedSeasonId(current.id);
      } catch (err) {
        console.error('Error loading competition:', err);
        if (!cancelled) setError('Failed to load competition details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, [competitionId]);

  // ---------- Fetch standings for selected season ----------
  const fetchStandings = useCallback(async (seasonId) => {
    if (!seasonId) {
      setStandings(null);
      return;
    }
    setStandingsLoading(true);
    try {
      const res = await api.get(`/competitions-management/seasons/${seasonId}/standings`);
      setStandings(res.data);
    } catch (err) {
      console.error('Error fetching standings:', err);
      setStandings(null);
    } finally {
      setStandingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSeasonId) fetchStandings(selectedSeasonId);
  }, [selectedSeasonId, fetchStandings]);

  // ---------- Derived: current season ----------
  const currentSeason = useMemo(() => pickCurrentSeason(seasons), [seasons]);

  // ---------- Standings rendering ----------
  const renderStandingsTable = (rows) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/20 text-sm">
            <th className="py-3 px-4 text-left">Pos</th>
            <th className="py-3 px-4 text-left">Team</th>
            <th className="py-3 px-4 text-center">P</th>
            <th className="py-3 px-4 text-center">W</th>
            <th className="py-3 px-4 text-center">D</th>
            <th className="py-3 px-4 text-center">L</th>
            <th className="py-3 px-4 text-center">GF</th>
            <th className="py-3 px-4 text-center">GA</th>
            <th className="py-3 px-4 text-center">GD</th>
            <th className="py-3 px-4 text-center font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, idx) => {
            const team = teamMap[entry.team_id];
            const gd = (entry.goals_for || 0) - (entry.goals_against || 0);
            return (
              <tr key={entry.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="py-3 px-4 font-bold">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <FaTrophy className="text-yellow-500" />}
                    <span>{idx + 1}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-semibold">
                  <Link
                    to={`/teams/${entry.team_id}`}
                    className="hover:text-faz-orange"
                  >
                    {team?.name || 'Unknown Team'}
                  </Link>
                </td>
                <td className="py-3 px-4 text-center">{entry.played ?? 0}</td>
                <td className="py-3 px-4 text-center">{entry.won ?? 0}</td>
                <td className="py-3 px-4 text-center">{entry.drawn ?? 0}</td>
                <td className="py-3 px-4 text-center">{entry.lost ?? 0}</td>
                <td className="py-3 px-4 text-center">{entry.goals_for ?? 0}</td>
                <td className="py-3 px-4 text-center">{entry.goals_against ?? 0}</td>
                <td className="py-3 px-4 text-center">
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td className="py-3 px-4 text-center font-bold text-faz-orange text-xl">
                  {entry.points ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderStandings = () => {
    if (standingsLoading) {
      return (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
        </div>
      );
    }

    if (!standings) {
      return (
        <div className="text-center py-12 text-gray-400">
          No standings available for this season yet.
        </div>
      );
    }

    // Grouped format: { "Group A": [...], "Group B": [...] }
    if (typeof standings === 'object' && !Array.isArray(standings)) {
      const groupNames = Object.keys(standings);
      if (groupNames.length === 0) {
        return (
          <div className="text-center py-12 text-gray-400">
            No standings available for this season yet.
          </div>
        );
      }
      return (
        <div className="space-y-8">
          {groupNames.map(groupName => {
            const rows = standings[groupName] || [];
            return (
              <div key={groupName}>
                <h4 className="text-lg font-bold text-white mb-3">{groupName}</h4>
                {rows.length === 0 ? (
                  <p className="text-sm text-gray-400">No standings in this group yet.</p>
                ) : (
                  renderStandingsTable(rows)
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Flat array format
    if (standings.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          No standings available for this season yet.
        </div>
      );
    }
    return renderStandingsTable(standings);
  };

  // ---------- Loading / error states ----------
  if (loading && !competition) {
    return (
      <div className="pt-24 text-center">
        <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (error || !competition) {
    return (
      <>
        <div className="pt-24 text-center container mx-auto px-6">
          <GlassCard className="max-w-md mx-auto">
            <p className="text-gray-400">{error || 'Competition not found.'}</p>
            <Link to="/competitions" className="btn-primary mt-4 inline-block">
              Back to Competitions
            </Link>
          </GlassCard>
        </div>
        <Footer />
      </>
    );
  }

  const typeIcon =
    competition.competition_type === 'league' ? '🏆' :
    competition.competition_type === 'cup' ? '🏅' :
    competition.competition_type === 'friendly_series' ? '🤝' : '⚽';

  const genderLabel =
    (competition.gender || '').toLowerCase() === 'male' ? "Men's" :
    (competition.gender || '').toLowerCase() === 'female' ? "Women's" : 'Mixed';

  // ---------- Render ----------
  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <Link
          to="/competitions"
          className="text-faz-orange hover:text-faz-green mb-4 inline-flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Competitions
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-6xl">{typeIcon}</div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                {competition.name}
              </h1>
              <p className="text-gray-300 mt-1">
                {genderLabel} • {competition.competition_type || 'Competition'}
                {competition.participant_type && (
                  <> • {competition.participant_type === 'countries' ? 'National Teams' : 'Clubs'}</>
                )}
              </p>
              {competition.description && (
                <p className="text-gray-400 text-sm mt-2 max-w-2xl">
                  {competition.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('standings')}
            className={`pb-2 px-4 flex items-center gap-2 transition-all duration-300 ${
              activeTab === 'standings'
                ? 'text-faz-orange border-b-2 border-faz-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaChartLine /> Standings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-4 flex items-center gap-2 transition-all duration-300 ${
              activeTab === 'history'
                ? 'text-faz-orange border-b-2 border-faz-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaHistory /> History
          </button>
        </div>

        {/* Standings tab */}
        {activeTab === 'standings' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">
                Current Season Standings
                {currentSeason && (
                  <span className="text-faz-orange text-sm ml-2">
                    ({currentSeason.season})
                  </span>
                )}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {currentSeason
                  ? 'Standings for the current season'
                  : 'No current season set'}
              </p>
            </div>

            <GlassCard className="p-4">
              {currentSeason ? renderStandings() : (
                <div className="text-center py-12 text-gray-400">
                  This competition doesn't have a current season yet.
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div>
            <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-2xl font-semibold">Historical Standings</h2>
              {seasons.length > 0 && (
                <div className="flex items-center gap-3">
                  <FaFilter className="text-faz-orange" />
                  <select
                    value={selectedSeasonId}
                    onChange={e => setSelectedSeasonId(e.target.value)}
                    className="px-4 py-2 rounded-lg text-white bg-gray-900 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-faz-orange"
                  >
                    {seasons.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.season} {s.is_archived ? '(Archived)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <GlassCard className="p-4">
              <h3 className="text-xl font-bold mb-4">
                Standings for{' '}
                {seasons.find(s => s.id === selectedSeasonId)?.season || '—'}
              </h3>
              {renderStandings()}
            </GlassCard>

            {seasons.length === 0 && (
              <GlassCard className="mt-6 p-6 text-center text-gray-400">
                <FaTrophy className="text-5xl mx-auto mb-3 text-gray-500" />
                <p>Historical data coming soon.</p>
              </GlassCard>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CompetitionDetail;