import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { leaguesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaCheckCircle } from 'react-icons/fa';

const PromotionRelegation = () => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [standings, setStandings] = useState({});
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState(null);
  const [season, setSeason] = useState('2025-2026');

  useEffect(() => {
    fetchLeagues();
  }, [season]);

  const fetchLeagues = async () => {
    setLoading(true);
    try {
      const res = await leaguesAPI.getAll({ season });
      setLeagues(res.data);
      
      // Fetch standings for each league
      const standingsMap = {};
      for (const league of res.data) {
        const standingsRes = await leaguesAPI.getStandings(league.id, season);
        standingsMap[league.id] = standingsRes.data;
      }
      setStandings(standingsMap);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyPromotionRelegation = async () => {
    if (!window.confirm('Are you sure you want to apply promotion/relegation for this season? This action cannot be undone.')) {
      return;
    }
    setApplying(true);
    try {
      const res = await leaguesAPI.applyPromotionRelegation(season);
      setMessage({ type: 'success', text: `Promotion/Relegation applied successfully! ${res.data.results.length} teams affected.` });
      // Refresh data
      await fetchLeagues();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to apply promotion/relegation' });
    } finally {
      setApplying(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="pt-24 text-center">
        <GlassCard className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-faz-red">Access Denied</h2>
          <p className="text-gray-300 mt-2">This page is only accessible to FAZ administrators.</p>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-24 text-center">
        <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Promotion & Relegation Manager</h1>
          <p className="text-gray-300">Manage end-of-season promotion and relegation between leagues</p>
        </motion.div>

        {/* Season Selector */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="glass px-4 py-2 rounded-lg"
          >
            <option value="2025-2026">2025-2026 Season</option>
            <option value="2024-2025">2024-2025 Season</option>
          </select>
          
          <button
            onClick={applyPromotionRelegation}
            disabled={applying}
            className="btn-primary flex items-center gap-2"
          >
            {applying ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FaCheckCircle />
            )}
            Apply Promotion/Relegation
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-faz-green/20 text-faz-green' : 'bg-faz-red/20 text-faz-red'
          }`}>
            {message.text}
          </div>
        )}

        {/* League Pyramid Display */}
        <div className="space-y-8">
          {/* Men's Pyramid */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaArrowUp className="text-faz-green" /> Men's Pyramid
            </h2>
            {leagues.filter(l => l.gender === 'male').map((league) => (
              <div key={league.id} className="mb-6">
                <GlassCard>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{league.name}</h3>
                      <p className="text-sm text-gray-400">Tier {league.tier}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-faz-green">↑ {league.promotion_spots || 4} promoted</p>
                      <p className="text-sm text-faz-red">↓ {league.relegation_spots || 4} relegated</p>
                    </div>
                  </div>
                  
                  {standings[league.id] && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="py-2 text-left">Pos</th>
                            <th className="py-2 text-left">Team</th>
                            <th className="py-2 text-center">Pts</th>
                            <th className="py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings[league.id].slice(0, 6).map((entry, idx) => (
                            <tr key={entry.id} className="border-b border-white/5">
                              <td className="py-2">{idx + 1}</td>
                              <td>{entry.team?.name}</td>
                              <td className="text-center font-bold">{entry.points}</td>
                              <td className="text-center">
                                {idx < (league.promotion_spots || 4) && league.tier > 1 && (
                                  <span className="text-faz-green text-xs">↑ Promotion</span>
                                )}
                                {standings[league.id].length - idx <= (league.relegation_spots || 4) && league.tier < 3 && (
                                  <span className="text-faz-red text-xs">↓ Relegation</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </GlassCard>
              </div>
            ))}
          </div>

          {/* Women's Pyramid */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaArrowUp className="text-faz-green" /> Women's Pyramid
            </h2>
            {leagues.filter(l => l.gender === 'female').map((league) => (
              <div key={league.id} className="mb-6">
                <GlassCard>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{league.name}</h3>
                      <p className="text-sm text-gray-400">Tier {league.tier}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-faz-green">↑ {league.promotion_spots || 4} promoted</p>
                      <p className="text-sm text-faz-red">↓ {league.relegation_spots || 4} relegated</p>
                    </div>
                  </div>
                  
                  {standings[league.id] && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="py-2 text-left">Pos</th>
                            <th className="py-2 text-left">Team</th>
                            <th className="py-2 text-center">Pts</th>
                            <th className="py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings[league.id].slice(0, 6).map((entry, idx) => (
                            <tr key={entry.id} className="border-b border-white/5">
                              <td className="py-2">{idx + 1}</td>
                              <td>{entry.team?.name}</td>
                              <td className="text-center font-bold">{entry.points}</td>
                              <td className="text-center">
                                {idx < (league.promotion_spots || 4) && league.tier > 1 && (
                                  <span className="text-faz-green text-xs">↑ Promotion</span>
                                )}
                                {standings[league.id].length - idx <= (league.relegation_spots || 4) && league.tier < 2 && (
                                  <span className="text-faz-red text-xs">↓ Relegation</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </GlassCard>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Promotion/Relegation is typically applied at the end of each season.</p>
          <p>Teams finishing in promotion spots move up to the next tier; teams in relegation spots move down.</p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PromotionRelegation;