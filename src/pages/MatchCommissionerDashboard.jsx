// frontend/src/pages/MatchCommissionerDashboard.jsx
import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import MatchResultForm from '../components/MatchResultForm';
import { matchesAPI, matchEventsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaFutbol, FaCheckCircle, FaBroadcastTower } from 'react-icons/fa';

const MatchCommissionerDashboard = () => {
  const { user } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [finishedMatches, setFinishedMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const [upcomingRes, liveRes, finishedRes] = await Promise.all([
        matchesAPI.getAll({ status: 'upcoming' }),
        matchesAPI.getAll({ status: 'live' }),
        matchesAPI.getAll({ status: 'finished', limit: 10 }),
      ]);
      setUpcomingMatches(upcomingRes.data);
      setLiveMatches(liveRes.data);
      setFinishedMatches(finishedRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load matches. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const startMatch = async (matchId) => {
    try {
      await matchesAPI.updateStatus(matchId, 'live');
      // Refresh lists
      await fetchMatches();
    } catch (err) {
      alert('Could not start match: ' + err.message);
    }
  };

  const finishMatch = async (matchId, homeScore, awayScore) => {
    try {
      await matchesAPI.updateScore(matchId, homeScore, awayScore, 'finished');
      await fetchMatches();
      setSelectedMatch(null);
    } catch (err) {
      alert('Error finishing match: ' + err.message);
    }
  };

  if (loading) return <div className="pt-24 text-center">Loading matches...</div>;
  if (error) return <div className="pt-24 text-center text-faz-red">{error}</div>;

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6">
      <h1 className="text-4xl font-bold gradient-text mb-8">
        Match Commissioner Dashboard
      </h1>

      {/* Live matches section */}
      {liveMatches.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FaFutbol className="text-faz-red animate-pulse" /> Live Matches
          </h2>
          <div className="space-y-4">
            {liveMatches.map(match => (
              <GlassCard key={match.id} className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{match.home_team} vs {match.away_team}</p>
                  <p className="text-sm text-gray-400">{match.venue}</p>
                  <p className="text-sm text-faz-orange">
                    Current score: {match.home_score} - {match.away_score}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMatch(match)}
                  className="btn-primary"
                >
                  Enter Results
                </button>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming matches section */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaCalendarAlt /> Upcoming Matches
        </h2>
        {upcomingMatches.length === 0 ? (
          <GlassCard className="text-center py-6 text-gray-400">
            No upcoming matches scheduled.
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {upcomingMatches.map(match => (
              <GlassCard key={match.id} className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{match.home_team} vs {match.away_team}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(match.match_date).toLocaleString()} • {match.venue}
                  </p>
                </div>
                <button
                  onClick={() => startMatch(match.id)}
                  className="btn-secondary"
                >
                  Start Match
                </button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Recently finished matches */}
      {finishedMatches.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FaCheckCircle className="text-faz-green" /> Recently Finished
          </h2>
          <div className="space-y-2">
            {finishedMatches.map(match => (
              <GlassCard key={match.id} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">{match.home_team} {match.home_score} – {match.away_score} {match.away_team}</span>
                  <span className="text-gray-400">{new Date(match.match_date).toLocaleDateString()}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Result entry modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl">
            {/* Simple live score widget (inline) */}
            <GlassCard className="mb-4 p-3">
              <div className="flex items-center gap-2 text-faz-orange">
                <FaBroadcastTower className="animate-pulse" />
                <span className="font-semibold">LIVE: {selectedMatch.home_team} vs {selectedMatch.away_team}</span>
              </div>
              <div className="text-center text-2xl font-bold mt-2">
                {selectedMatch.home_score} – {selectedMatch.away_score}
              </div>
            </GlassCard>

            <MatchResultForm
              matchId={selectedMatch.id}
              onComplete={() => {
                setSelectedMatch(null);
                fetchMatches();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCommissionerDashboard;