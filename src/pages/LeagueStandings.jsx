import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { leaguesAPI, tableAPI } from '../api';
import { motion } from 'framer-motion';
import { FaTrophy, FaArrowUp, FaArrowDown, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

const LeagueStandings = () => {
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState('');
  const [availableSeasons, setAvailableSeasons] = useState([]);

  // Fetch available seasons on component mount
  useEffect(() => {
    fetchSeasons();
  }, []);

  // Fetch standings when leagueId or season changes
  useEffect(() => {
    if (season) {
      fetchStandings();
    }
  }, [leagueId, season]);

  const fetchSeasons = async () => {
    try {
      const res = await tableAPI.getSeasons();
      let seasons = res.data;
      
      // Sort descending (most recent first)
      seasons.sort((a, b) => b.localeCompare(a));
      setAvailableSeasons(seasons);
      
      // Set default season to the first available (most recent)
      if (seasons.length > 0) {
        setSeason(seasons[0]);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
      // Fallback to current year only if API fails
      const currentYear = new Date().getFullYear().toString();
      setSeason(currentYear);
      setAvailableSeasons([currentYear]);
    }
  };

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const [leagueRes, standingsRes] = await Promise.all([
        leaguesAPI.getById(leagueId),
        leaguesAPI.getStandings(leagueId, season),
      ]);
      console.log('League:', leagueRes.data);
      console.log('Standings:', standingsRes.data);
      setLeague(leagueRes.data);
      setStandings(standingsRes.data);
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <Link to="/leagues" className="text-faz-orange hover:text-faz-green mb-4 inline-block">
            ← Back to Leagues
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">{league?.name} Standings</h1>
          <p className="text-gray-300">Season {season}</p>
        </motion.div>

        <div className="mb-6 flex justify-end">
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="px-4 py-2 rounded-lg text-white bg-gray-900 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-faz-orange focus:border-transparent"
            style={{ backgroundColor: '#1f2937' }}
          >
            {availableSeasons.map((yr) => (
              <option key={yr} value={yr} className="bg-gray-800 text-white py-2">
                {yr} Season
              </option>
            ))}
          </select>
        </div>

        <GlassCard className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-4 px-4 text-left">Pos</th>
                <th className="py-4 px-4 text-left">Team</th>
                <th className="py-4 px-4 text-center">P</th>
                <th className="py-4 px-4 text-center">W</th>
                <th className="py-4 px-4 text-center">D</th>
                <th className="py-4 px-4 text-center">L</th>
                <th className="py-4 px-4 text-center">GF</th>
                <th className="py-4 px-4 text-center">GA</th>
                <th className="py-4 px-4 text-center">GD</th>
                <th className="py-4 px-4 text-center font-bold">Pts</th>
                <th className="py-4 px-4 text-center">Form</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, idx) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4 font-bold">
                    <div className="flex items-center gap-2">
                      {idx === 0 && <FaTrophy className="text-yellow-500" />}
                      <span>{idx + 1}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-semibold">
                    <Link to={`/teams/${entry.team_id}`} className="hover:text-faz-orange">
                      {entry.team?.name || `Team ID: ${entry.team_id}`}
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-center">{entry.played}</td>
                  <td className="py-4 px-4 text-center">{entry.won}</td>
                  <td className="py-4 px-4 text-center">{entry.drawn}</td>
                  <td className="py-4 px-4 text-center">{entry.lost}</td>
                  <td className="py-4 px-4 text-center">{entry.goals_for}</td>
                  <td className="py-4 px-4 text-center">{entry.goals_against}</td>
                  <td className="py-4 px-4 text-center">
                    {entry.goals_for - entry.goals_against}
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-faz-orange text-xl">
                    {entry.points}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex gap-1 justify-center">
                      {entry.recent_form?.slice(0, 5).map((result, i) => (
                        <span
                          key={i}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            result === 'W' ? 'bg-faz-green' :
                            result === 'D' ? 'bg-yellow-500' : 'bg-faz-red'
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </GlassCard>

        {/* Promotion/Relegation Zones */}
        {league && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className="text-xl font-bold gradient-text mb-3 flex items-center gap-2">
                <FaArrowUp className="text-faz-green" /> Promotion Zone
              </h3>
              <p className="text-gray-300 text-sm">
                Top {league.promotion_spots || 4} teams will be promoted to {league.promotion_to || 'higher division'}.
              </p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-xl font-bold gradient-text mb-3 flex items-center gap-2">
                <FaArrowDown className="text-faz-red" /> Relegation Zone
              </h3>
              <p className="text-gray-300 text-sm">
                Bottom {league.relegation_spots || 4} teams will be relegated to {league.relegation_to || 'lower division'}.
              </p>
            </GlassCard>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default LeagueStandings;