import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { cupsAPI } from '../api';
import { motion } from 'framer-motion';
import { FaTrophy, FaCalendarAlt, FaMapMarker, FaUsers, FaPlus } from 'react-icons/fa';

const CupDetail = () => {
  const { cupId } = useParams();
  const [cup, setCup] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCupData();
  }, [cupId]);

  const fetchCupData = async () => {
    setLoading(true);
    try {
      const cupRes = await cupsAPI.getById(cupId);
      setCup(cupRes.data);
      
      const seasonsRes = await cupsAPI.getSeasons(cupId);
      setSeasons(seasonsRes.data);
      if (seasonsRes.data.length > 0) {
        setSelectedSeason(seasonsRes.data[0]);
        const matchesRes = await cupsAPI.getMatches(seasonsRes.data[0].id);
        setMatches(matchesRes.data);
      }
    } catch (error) {
      console.error('Error fetching cup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonChange = async (seasonId) => {
    setSelectedSeason(seasons.find(s => s.id === parseInt(seasonId)));
    const matchesRes = await cupsAPI.getMatches(seasonId);
    setMatches(matchesRes.data);
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
          <Link to="/cups" className="text-faz-orange hover:text-faz-green mb-4 inline-block">
            ← Back to Cup Competitions
          </Link>
          <h1 className="text-4xl font-bold gradient-text">{cup?.name}</h1>
          <p className="text-gray-300">{cup?.gender === 'male' ? 'Men\'s' : 'Women\'s'} competition</p>
        </motion.div>

        {/* Season Selector */}
        {seasons.length > 0 && (
          <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
            <select
              value={selectedSeason?.id || ''}
              onChange={(e) => handleSeasonChange(e.target.value)}
              className="glass px-4 py-2 rounded-lg"
            >
              {seasons.map(season => (
                <option key={season.id} value={season.id}>{season.season}</option>
              ))}
            </select>
            {selectedSeason?.winner && (
              <div className="glass px-4 py-2 rounded-lg">
                <span className="text-gray-400">Winner:</span>
                <span className="text-faz-green font-semibold ml-2">{selectedSeason.winner.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Matches List */}
        <h2 className="text-2xl font-semibold mb-4">Matches</h2>
        {matches.length === 0 ? (
          <GlassCard className="text-center py-8 text-gray-400">
            No matches scheduled for this season yet.
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <GlassCard key={match.id}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-gray-400">{new Date(match.match_date).toLocaleDateString()}</p>
                    <p className="font-semibold">{match.round_name}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-1"><FaMapMarker /> {match.venue}</p>
                  </div>
                  <div className="text-center">
                    {match.is_played ? (
                      <>
                        <p className="text-2xl font-bold">
                          {match.home_team?.name || 'TBD'} {match.home_score} - {match.away_score} {match.away_team?.name || 'TBD'}
                        </p>
                        {match.winner && <p className="text-faz-green text-sm">Winner: {match.winner.name}</p>}
                      </>
                    ) : (
                      <p className="text-lg font-semibold">
                        {match.home_team?.name || 'TBD'} vs {match.away_team?.name || 'TBD'}
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CupDetail;