import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { cupsAPI } from '../api';
import { motion } from 'framer-motion';
import { FaTrophy, FaFutbol, FaCalendarAlt } from 'react-icons/fa';

const CupCompetitions = () => {
  const [cups, setCups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGender, setSelectedGender] = useState('all');

  useEffect(() => {
    fetchCups();
  }, [selectedGender]);

  const fetchCups = async () => {
    setLoading(true);
    try {
      const params = selectedGender !== 'all' ? { gender: selectedGender } : {};
      const res = await cupsAPI.getAll(params);
      setCups(res.data);
    } catch (error) {
      console.error('Error fetching cup competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const genderFilters = [
    { value: 'all', label: 'All Cups' },
    { value: 'male', label: 'Men\'s Cups' },
    { value: 'female', label: 'Women\'s Cups' },
  ];

  const getCupIcon = (type) => {
    if (type === 'super_cup') return '🏆';
    if (type === 'continental') return '🌍';
    return '🏅';
  };

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Cup Competitions</h1>
          <p className="text-gray-300">Domestic and continental cup tournaments</p>
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
            {cups.map((cup) => (
              <Link key={cup.id} to={`/cups/${cup.id}`}>
                <GlassCard className="hover:scale-105 transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{getCupIcon(cup.competition_type)}</div>
                    <div>
                      <h2 className="text-xl font-bold group-hover:text-faz-orange transition-colors">
                        {cup.name}
                      </h2>
                      <p className="text-sm text-gray-400 capitalize">{cup.gender}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">Season: {cup.season}</p>
                  {cup.current_champion && (
                    <p className="text-faz-green text-sm mt-2">
                      Defending Champions: {cup.current_champion.name}
                    </p>
                  )}
                  <div className="mt-3 text-faz-orange text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Details → 
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

export default CupCompetitions;