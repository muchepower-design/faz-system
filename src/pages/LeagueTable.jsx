import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { tableAPI } from '../api';
import { motion } from 'framer-motion';
import { FaTrophy } from 'react-icons/fa';

const LeagueTable = () => {
  const [table, setTable] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [season, setSeason] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSeasons, setLoadingSeasons] = useState(true);

  // Fetch available seasons
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const res = await tableAPI.getSeasons();
        let seasonsList = res.data;
        // Ensure current year is in the list (backend already does this, but just in case)
        const currentYear = new Date().getFullYear().toString();
        if (!seasonsList.includes(currentYear)) {
          seasonsList = [currentYear, ...seasonsList];
        }
        seasonsList.sort((a, b) => b.localeCompare(a));
        setSeasons(seasonsList);
        // Set default season to current year
        if (seasonsList.includes(currentYear)) {
          setSeason(currentYear);
        } else if (seasonsList.length > 0) {
          setSeason(seasonsList[0]);
        }
      } catch (error) {
        console.error('Error fetching seasons:', error);
        const currentYear = new Date().getFullYear().toString();
        setSeasons([currentYear]);
        setSeason(currentYear);
      } finally {
        setLoadingSeasons(false);
      }
    };
    fetchSeasons();
  }, []);

  // Fetch league table when season changes
  useEffect(() => {
    if (!season) return;
    const fetchTable = async () => {
      setLoading(true);
      try {
        const response = await tableAPI.getTable(season);
        console.log('Table data with team names:', response.data);
        setTable(response.data);
      } catch (error) {
        console.error('Error fetching table:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTable();
  }, [season]);

  const getPositionIcon = (position) => {
    if (position === 1) return <FaTrophy className="text-yellow-500" />;
    if (position === 2) return <FaTrophy className="text-gray-400" />;
    if (position === 3) return <FaTrophy className="text-amber-600" />;
    return null;
  };

  if (loadingSeasons) {
    return (
      <div className="pt-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
        <p className="mt-4 text-gray-400">Loading seasons...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
            League Table
          </h1>
          <p className="text-xl text-gray-300">
            FAZ Super League Standings
          </p>
        </motion.div>

        <div className="mb-8 flex justify-center">
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="glass px-6 py-3 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-faz-orange"
          >
            {seasons.map((yr) => (
              <option key={yr} value={yr}>
                {yr} Season
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
          </div>
        ) : (
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
                </tr>
              </thead>
              <tbody>
                {table.map((entry, idx) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold">
                      <div className="flex items-center gap-2">
                        {getPositionIcon(idx + 1)}
                        <span>{idx + 1}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold">
                      {entry.team?.name || `Team ID: ${entry.team_id}`}
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
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default LeagueTable;