// frontend/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import NewsCard from '../components/NewsCard';
import MatchCard from '../components/MatchCard';
import GlassCard from '../components/GlassCard';
import PartnerSlider from '../components/PartnerSlider';
import Footer from '../components/Footer';
import api from '../api';
import { newsAPI, matchesAPI, playersAPI } from '../api';
import { FaNewspaper, FaFutbol, FaChartLine } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Home = () => {
  
  const [featuredNews, setFeaturedNews] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, matchesRes, scorersRes, compRes] = await Promise.all([
          newsAPI.getFeatured(),
          matchesAPI.getUpcoming(),
          playersAPI.getTopScorers(),
          api.get('/competitions-management/competitions', {
            params: { active_only: true }
          }),
        ]);
        setFeaturedNews(newsRes.data || []);
        setUpcomingMatches(matchesRes.data || []);
        setTopScorers(scorersRes.data || []);
        setCompetitions(compRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCompetitionIcon = (competition) => {
    switch ((competition.competition_type || '').toLowerCase()) {
      case 'league': return '🏆';
      case 'cup': return '🏅';
      case 'tournament': return '⭐';
      case 'friendly_series': return '🤝';
      default: return '⚽';
    }
  };

  const getGenderLabel = (gender) => {
    const g = (gender || '').toLowerCase();
    if (g === 'male') return "Men's";
    if (g === 'female') return "Women's";
    return 'Mixed';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeroCarousel />

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-black/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FaNewspaper, value: '50+', label: 'News Articles', color: 'from-faz-green' },
              { icon: FaFutbol, value: '100+', label: 'Professional Matches', color: 'from-faz-orange' },
              { icon: FaChartLine, value: '1000+', label: 'Registered Players', color: 'from-faz-red' },
            ].map((stat, idx) => (
              <GlassCard key={idx} className="text-center">
                <stat.icon
                  className={`text-5xl mx-auto mb-4 bg-gradient-to-r ${stat.color} to-transparent bg-clip-text text-transparent`}
                />
                <h3 className="text-4xl font-bold gradient-text mb-2">{stat.value}</h3>
                <p className="text-gray-300">{stat.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Featured News Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Latest News</span>
            </h2>
            <p className="text-gray-300">Stay updated with the latest from FAZ</p>
          </motion.div>

          {featuredNews.length === 0 ? (
            <p className="text-center text-gray-400">No news available yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredNews.slice(0, 6).map((news, idx) => (
                <NewsCard key={news.id} news={news} index={idx} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Matches */}
      <section className="py-20 bg-black/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Upcoming Matches</span>
            </h2>
            <p className="text-gray-300">Don't miss any action</p>
          </motion.div>

          {upcomingMatches.length === 0 ? (
            <p className="text-center text-gray-400">No upcoming matches scheduled.</p>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.slice(0, 5).map((match, idx) => (
                <MatchCard key={match.id} match={match} index={idx} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Scorers */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Top Scorers</span>
            </h2>
            <p className="text-gray-300">Leading goal scorers this season</p>
          </motion.div>

          {topScorers.length === 0 ? (
            <p className="text-center text-gray-400">Top scorers will appear here.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topScorers.slice(0, 4).map((player, idx) => (
                <GlassCard key={player.id} className="text-center">
                  <div className="relative">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-faz-green to-faz-orange rounded-full flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-white">
                        {player.jersey_number || '⚽'}
                      </span>
                    </div>
                    {idx === 0 && (
                      <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-2xl">👑</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{player.name}</h3>
                  <p className="text-faz-orange mb-3">{player.position}</p>
                  <div className="flex justify-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Goals</span>
                      <p className="text-2xl font-bold gradient-text">{player.goals ?? 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Assists</span>
                      <p className="text-2xl font-bold text-white">{player.assists ?? 0}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Competitions Section — now dynamic */}
      <section className="py-20 bg-gradient-to-b from-black/30 to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text">Competitions</h2>
            <p className="text-gray-300 mt-2">
              News, fixtures, results and draws from all our leagues and cups
            </p>
          </div>

          {competitions.length === 0 ? (
            <GlassCard className="text-center py-12 max-w-md mx-auto">
              <p className="text-gray-400">No competitions available yet.</p>
              <Link to="/competitions" className="btn-secondary mt-4 inline-block">
                Browse Competitions
              </Link>
            </GlassCard>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {competitions.slice(0, 4).map((comp, idx) => (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link to={`/competitions/${comp.id}`}>
                      <GlassCard className="group overflow-hidden h-full flex flex-col hover:scale-105 transition-all duration-300">
                        <div className="p-6 flex flex-col h-full">
                          <div className="text-5xl mb-4">{getCompetitionIcon(comp)}</div>
                          <h3 className="text-xl font-bold text-white group-hover:text-faz-orange transition-colors mb-2">
                            {comp.name}
                          </h3>
                          {comp.description && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {comp.description}
                            </p>
                          )}
                          <div className="mt-auto pt-3">
                            <div className="flex flex-wrap gap-2 text-xs mb-3">
                              <span className="bg-white/10 px-2 py-1 rounded-full text-gray-300">
                                {getGenderLabel(comp.gender)}
                              </span>
                              {comp.participant_type && (
                                <span className="bg-white/10 px-2 py-1 rounded-full text-gray-300">
                                  {comp.participant_type === 'countries' ? '🌍 National' : '🏟️ Clubs'}
                                </span>
                              )}
                            </div>
                            <div className="text-faz-orange text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                              View Details →
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-10">
                <Link to="/competitions" className="btn-secondary inline-flex items-center gap-2">
                  View All Competitions <span>→</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Women's Football Section */}
      <section className="py-20 bg-black/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text">Women's Football</h2>
            <p className="text-gray-300 mt-2">Empowering girls and women through the beautiful game</p>
          </div>
          {featuredNews.length >= 2 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {featuredNews.slice(0, 2).map((news, idx) => (
                <NewsCard key={news.id} news={news} index={idx} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">Women's football news coming soon.</p>
          )}
          <div className="text-center mt-8">
            <Link to="/news?category=women" className="btn-secondary inline-flex items-center gap-2">
              All Women's Football News <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Explore FAZ Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text">Explore FAZ</h2>
            <p className="text-gray-300 mt-2">
              Everything you need to know about Zambian football
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'About FAZ', icon: '🏛️', link: '/about' },
              { name: 'Governance', icon: '⚖️', link: '/governance' },
              { name: 'Club Licensing', icon: '📋', link: '/documents' },
              { name: 'Media Centre', icon: '📺', link: '/media' },
            ].map((item, idx) => (
              <Link key={idx} to={item.link}>
                <GlassCard className="text-center hover:bg-white/15 transition-all duration-300 group">
                  <div className="text-5xl mb-3">{item.icon}</div>
                  <h3 className="text-xl font-semibold group-hover:text-faz-orange transition-colors">
                    {item.name}
                  </h3>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Slider */}
      <PartnerSlider />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;