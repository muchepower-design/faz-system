import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendar, FaEye, FaArrowRight } from 'react-icons/fa';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const NewsCard = ({ news, index }) => {
  // Always show only excerpt, never expand inline
  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="glass-card overflow-hidden cursor-pointer group h-full flex flex-col"
    >
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        <img
          src={news.featured_image || 'https://via.placeholder.com/400x300?text=FAZ+News'}
          alt={news.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-3 left-3 glass px-2 py-1 rounded text-xs">
          {format(new Date(news.published_at), 'MMM dd, yyyy')}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-3 group-hover:text-faz-orange transition-colors line-clamp-2">
          {news.title}
        </h3>
        
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
          {truncateText(news.excerpt || news.content, 120)}
        </p>
        
        <div className="flex justify-between items-center text-sm text-gray-400 mt-auto pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <FaCalendar className="text-faz-green" />
            <span>{format(new Date(news.published_at), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaEye className="text-faz-orange" />
            <span>{news.views} views</span>
          </div>
        </div>
        
        <Link
          to={`/news/${news.id}`}
          className="mt-3 text-faz-green hover:text-faz-orange transition-colors text-sm flex items-center gap-1 group-hover:gap-2"
        >
          Read full article <FaArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
};

export default NewsCard;