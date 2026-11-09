import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { teamsAPI } from '../api';
import { motion } from 'framer-motion';
import { FaUsers, FaCalendar, FaMapMarker, FaUserTie } from 'react-icons/fa';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await teamsAPI.getAll();
        setTeams(response.data);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading teams...</p>
        </div>
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
            Clubs
          </h1>
          <p className="text-xl text-gray-300">
            Meet the teams competing in the FAZ Super League
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teams.map((team, idx) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GlassCard className="text-center hover:scale-105 transition-all duration-300">
                <div className="relative">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-faz-green to-faz-orange rounded-full flex items-center justify-center mb-4">
                    <FaUsers className="text-white text-5xl" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">{team.name}</h3>
                <p className="text-faz-orange mb-4">{team.short_name}</p>
                
                <div className="space-y-2 text-left text-sm">
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-faz-green" />
                    <span>Founded: {team.founded}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarker className="text-faz-orange" />
                    <span>Stadium: {team.stadium}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUserTie className="text-faz-red" />
                    <span>Coach: {team.coach}</span>
                  </div>
                </div>
                
                {team.description && (
                  <p className="mt-4 text-gray-300 text-sm">{team.description}</p>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teams;