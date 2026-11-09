import React, { useState, useEffect } from 'react';
import NewsCard from '../components/NewsCard';
import GlassCard from '../components/GlassCard';
import { newsAPI } from '../api';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaCalendarAlt } from 'react-icons/fa';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [months, setMonths] = useState([]);
  const [years, setYears] = useState([]);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchNews();
    // Extract available months and years from news data
    const extractDates = async () => {
      try {
        const response = await newsAPI.getAll({ limit: 1000 });
        const allNews = response.data;
        const uniqueMonths = [...new Set(allNews.map(item => 
          new Date(item.published_at).toLocaleString('default', { month: 'long' })
        ))];
        const uniqueYears = [...new Set(allNews.map(item => 
          new Date(item.published_at).getFullYear()
        ))];
        setMonths(uniqueMonths);
        setYears(uniqueYears.sort((a, b) => b - a));
      } catch (error) {
        console.error('Error extracting dates:', error);
      }
    };
    extractDates();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      let response;
      if (searchTerm) {
        response = await newsAPI.search(searchTerm);
      } else if (filterMonth || filterYear) {
        response = await newsAPI.filterByDate(filterMonth, filterYear);
      } else {
        response = await newsAPI.getAll();
      }
      
      let filteredNews = response.data;
      
      // Apply date filtering if not already done by API
      if (!(filterMonth || filterYear) && (filterMonth || filterYear)) {
        filteredNews = filteredNews.filter(item => {
          const date = new Date(item.published_at);
          const monthMatch = filterMonth ? date.toLocaleString('default', { month: 'long' }) === filterMonth : true;
          const yearMatch = filterYear ? date.getFullYear() === parseInt(filterYear) : true;
          return monthMatch && yearMatch;
        });
      }
      
      // Pagination
      const total = filteredNews.length;
      setTotalPages(Math.ceil(total / itemsPerPage));
      const start = (currentPage - 1) * itemsPerPage;
      const paginatedNews = filteredNews.slice(start, start + itemsPerPage);
      setNews(paginatedNews);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchNews();
  }, [searchTerm, filterMonth, filterYear]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchNews();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMonth('');
    setFilterYear('');
    setCurrentPage(1);
  };

  if (loading && news.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading news...</p>
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
            Latest News
          </h1>
          <p className="text-xl text-gray-300">
            All the latest updates from the Football Association of Zambia
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 justify-center mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search news..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass pl-10 pr-4 py-2 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-faz-orange"
              />
            </div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="glass px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-faz-orange"
            >
              <option value="">All Months</option>
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
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
            {(searchTerm || filterMonth || filterYear) && (
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

        {/* News Grid */}
        {news.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-gray-400">No news articles found matching your criteria.</p>
          </GlassCard>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((item, idx) => (
                <NewsCard key={item.id} news={item} index={idx} />
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
    </div>
  );
};

export default News;