import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { leaguesAPI } from '../api';
import { motion } from 'framer-motion';
import { FaTrophy, FaUsers, FaFutbol, FaChartLine } from 'react-icons/fa';

const Leagues = () => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGender, setSelectedGender] = useState('all');

  useEffect(() => {
    fetchLeagues();
  }, [selectedGender]);

  const fetchLeagues = async () => {
    setLoading(true);
    try {
      const params = selectedGender !== 'all' ? { gender: selectedGender } : {};
      const res = await leaguesAPI.getAll(params);
      setLeagues(res.data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const genderFilters = [
    { value: 'all', label: 'All Leagues' },
    { value: 'male', label: 'Men\'s Leagues' },
    { value: 'female', label: 'Women\'s Leagues' },
  ];

  const getLeagueIcon = (tier) => {
    if (tier === 1) return <FaTrophy className="text-yellow-500" />;
    if (tier === 2) return <FaChartLine className="text-faz-orange" />;
    return <FaFutbol className="text-faz-green" />;
  };

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Leagues & Competitions</h1>
          <p className="text-gray-300">Explore all FAZ leagues, standings, and promotion battles</p>
        </motion.div>

        {/* Gender Filters */}
        <div className="flex justify-center gap-4 mb-8">
          {genderFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedGender(filter.value)}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                selectedGender === filter.value
                  ? 'bg-gradient-to-r from-faz-green to-faz-orange text-white'
                  : 'glass hover:bg-white/20'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.map((league, idx) => (
              <Link key={league.id} to={`/leagues/${league.id}`}>
                <GlassCard className="hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{getLeagueIcon(league.tier)}</div>
                    <div>
                      <h2 className="text-xl font-bold group-hover:text-faz-orange transition-colors">
                        {league.name}
                      </h2>
                      <p className="text-sm text-gray-400 capitalize">{league.gender} • Tier {league.tier}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">Season: {league.season}</p>
                  {league.current_champion && (
                    <p className="text-faz-green text-sm mt-2">
                      Defending Champions: {league.current_champion.name}
                    </p>
                  )}
                  <div className="mt-3 text-faz-orange text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Standings → 
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Leagues;