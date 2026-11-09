import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { playersAPI, teamsAPI } from '../api';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, teamsRes] = await Promise.all([
          playersAPI.getAll({}),
          teamsAPI.getAll(),
        ]);
        setPlayers(playersRes.data);
        setTeams(teamsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchFilteredPlayers = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedTeam) params.team_id = selectedTeam;
        if (selectedPosition) params.position = selectedPosition;
        const response = await playersAPI.getAll(params);
        setPlayers(response.data);
      } catch (error) {
        console.error('Error fetching filtered players:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFilteredPlayers();
  }, [selectedTeam, selectedPosition]);

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

  return (
    <div className="pt-24 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
            Players
          </h1>
          <p className="text-xl text-gray-300">
            Meet the stars of Zambian football
          </p>
        </motion.div>

        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="glass px-6 py-3 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-faz-orange"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="glass px-6 py-3 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-faz-orange"
          >
            <option value="">All Positions</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {players.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlassCard className="text-center">
                  <div className="relative">
                    <div className="w-28 h-28 mx-auto bg-gradient-to-br from-faz-green to-faz-orange rounded-full flex items-center justify-center mb-4">
                      <span className="text-3xl font-bold text-white">
                        {player.jersey_number}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{player.name}</h3>
                  <p className="text-faz-orange text-sm mb-2">{player.position}</p>
                  <p className="text-gray-400 text-sm mb-3">{player.team?.name}</p>
                  <div className="flex justify-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Goals</span>
                      <p className="text-xl font-bold gradient-text">{player.goals}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Assists</span>
                      <p className="text-xl font-bold text-white">{player.assists}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Apps</span>
                      <p className="text-xl font-bold text-white">{player.appearances}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && players.length === 0 && (
          <GlassCard className="text-center py-12">
            <FaSearch className="text-6xl mx-auto mb-4 text-gray-500" />
            <h3 className="text-2xl font-semibold mb-2">No players found</h3>
            <p className="text-gray-400">Try adjusting your filters</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default Players;