import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { mediaAPI } from '../api';
import { motion } from 'framer-motion';
import { FaCamera, FaCalendarAlt, FaSearch, FaImage } from 'react-icons/fa';
import { format } from 'date-fns';

const MediaGalleries = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterYear, setFilterYear] = useState('');
  const [years, setYears] = useState([]);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchGalleries();
    extractYears();
  }, []);

  const extractYears = async () => {
    try {
      const res = await mediaAPI.getGalleries({ limit: 1000 });
      const allGalleries = res.data;
      const uniqueYears = [...new Set(allGalleries.map(gallery => 
        gallery.event_date ? new Date(gallery.event_date).getFullYear() : new Date(gallery.created_at).getFullYear()
      ))];
      setYears(uniqueYears.sort((a, b) => b - a));
    } catch (error) {
      console.error('Error extracting years:', error);
    }
  };

  const fetchGalleries = async () => {
    setLoading(true);
    try {
      let allGalleries = [];
      
      if (searchTerm) {
        const res = await mediaAPI.searchGalleries(searchTerm);
        allGalleries = res.data;
      } else {
        const res = await mediaAPI.getGalleries({ limit: 1000 });
        allGalleries = res.data;
      }
      
      // Apply year filter
      let filteredGalleries = allGalleries;
      if (filterYear) {
        filteredGalleries = allGalleries.filter(gallery => {
          const date = gallery.event_date ? new Date(gallery.event_date) : new Date(gallery.created_at);
          return date.getFullYear() === parseInt(filterYear);
        });
      }
      
      // Pagination
      const total = filteredGalleries.length;
      setTotalPages(Math.ceil(total / itemsPerPage));
      const start = (currentPage - 1) * itemsPerPage;
      const paginatedGalleries = filteredGalleries.slice(start, start + itemsPerPage);
      setGalleries(paginatedGalleries);
    } catch (error) {
      console.error('Error fetching galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchGalleries();
  }, [searchTerm, filterYear]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchGalleries();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterYear('');
    setCurrentPage(1);
  };

  if (loading && galleries.length === 0) {
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
        <h1 className="text-4xl font-bold gradient-text mb-6">Photo Galleries</h1>
        
        {/* Search and Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 justify-center mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search galleries..."
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
        
        {galleries.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-400">No photo galleries found matching your criteria.</p>
          </GlassCard>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleries.map((gallery, idx) => (
                <motion.div
                  key={gallery.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link to={`/media/galleries/${gallery.id}`}>
                    <GlassCard className="overflow-hidden p-0 hover:scale-105 transition duration-300 group h-full flex flex-col">
                      <div className="relative h-48">
                        <img 
                          src={gallery.cover_image || 'https://images.unsplash.com/photo-1522778119026-d647f0596c67?w=400'} 
                          alt={gallery.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-3 left-3">
                          <FaCamera className="text-white text-xl" />
                        </div>
                        {gallery.images && (
                          <div className="absolute top-3 right-3 glass px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <FaImage size={10} /> {gallery.images.length}
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{gallery.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-2">{gallery.description}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-auto">
                          <FaCalendarAlt size={10} /> 
                          {gallery.event_date 
                            ? format(new Date(gallery.event_date), 'MMMM dd, yyyy')
                            : format(new Date(gallery.created_at), 'MMMM dd, yyyy')}
                        </div>
                        <div className="mt-3 text-faz-orange text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                          View {gallery.images?.length || 0} photos →
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
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

export default MediaGalleries;