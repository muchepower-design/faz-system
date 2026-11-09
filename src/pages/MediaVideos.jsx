import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { mediaAPI } from '../api';
import { motion } from 'framer-motion';
import { FaYoutube, FaEye, FaCalendarAlt, FaSearch, FaFilter } from 'react-icons/fa';
import { format } from 'date-fns';

const MediaVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterYear, setFilterYear] = useState('');
  const [years, setYears] = useState([]);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchVideos();
    extractYears();
  }, []);

  const extractYears = async () => {
    try {
      const res = await mediaAPI.getVideos({ limit: 1000 });
      const allVideos = res.data;
      const uniqueYears = [...new Set(allVideos.map(video => 
        new Date(video.published_at).getFullYear()
      ))];
      setYears(uniqueYears.sort((a, b) => b - a));
    } catch (error) {
      console.error('Error extracting years:', error);
    }
  };

  const fetchVideos = async () => {
    setLoading(true);
    try {
      let allVideos = [];
      
      if (searchTerm) {
        const res = await mediaAPI.searchVideos(searchTerm);
        allVideos = res.data;
      } else {
        const res = await mediaAPI.getVideos({ limit: 1000 });
        allVideos = res.data;
      }
      
      // Apply year filter
      let filteredVideos = allVideos;
      if (filterYear) {
        filteredVideos = allVideos.filter(video => 
          new Date(video.published_at).getFullYear() === parseInt(filterYear)
        );
      }
      
      // Pagination
      const total = filteredVideos.length;
      setTotalPages(Math.ceil(total / itemsPerPage));
      const start = (currentPage - 1) * itemsPerPage;
      const paginatedVideos = filteredVideos.slice(start, start + itemsPerPage);
      setVideos(paginatedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchVideos();
  }, [searchTerm, filterYear]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVideos();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterYear('');
    setCurrentPage(1);
  };

  if (loading && videos.length === 0) {
    return (
      <div className="pt-24 text-center">
        <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <Link to="/media" className="text-faz-orange hover:text-faz-green mb-4 inline-flex items-center gap-2">
          ← Back to Media Centre
        </Link>
        <h1 className="text-4xl font-bold gradient-text mb-6">Videos</h1>
        
        {/* Search and Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 justify-center mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass pl-10 pr-4 py-2 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-faz-orange"
              />
            </div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="glass px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-faz-orange"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary px-6 py-2 rounded-full">
              Apply Filters
            </button>
            {(searchTerm || filterYear) && (
              <button
                type="button"
                onClick={clearFilters}
                className="glass px-6 py-2 rounded-full hover:bg-white/20"
              >
                Clear Filters
              </button>
            )}
          </form>
        </div>
        
        {videos.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-400">No videos found matching your criteria.</p>
          </GlassCard>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video, idx) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard className="overflow-hidden p-0 hover:scale-105 transition duration-300 h-full flex flex-col">
                    <div className="relative aspect-video">
                      <img 
                        src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`} 
                        alt={video.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition">
                        <FaYoutube className="text-6xl text-red-500" />
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">{video.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                        <span className="flex items-center gap-1"><FaEye size={12} /> {video.views} views</span>
                        <span className="flex items-center gap-1"><FaCalendarAlt size={12} /> {format(new Date(video.published_at), 'MMM dd, yyyy')}</span>
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-2 mb-3">{video.description}</p>
                      <a 
                        href={video.youtube_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-faz-orange text-sm mt-auto inline-block hover:underline"
                      >
                        Watch on YouTube →
                      </a>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="glass px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-white/20 transition"
                >
                  Previous
                </button>
                <span className="glass px-4 py-2 rounded-lg">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="glass px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-white/20 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MediaVideos;