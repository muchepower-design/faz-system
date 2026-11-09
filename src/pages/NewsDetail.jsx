import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { newsAPI } from '../api';
import { motion } from 'framer-motion';
import { FaCalendar, FaEye, FaArrowLeft, FaShare } from 'react-icons/fa';
import { format } from 'date-fns';

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await newsAPI.getById(id);
        setNews(response.data);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="pt-24 text-center">
        <GlassCard className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-faz-red">Article Not Found</h2>
          <Link to="/news" className="btn-primary mt-4 inline-block">Back to News</Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <>
      <div className="pt-24 min-h-screen">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to="/news" className="text-faz-orange hover:text-faz-green mb-4 inline-flex items-center gap-2">
              <FaArrowLeft /> Back to News
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">{news.title}</h1>
            
            <div className="flex items-center gap-4 text-gray-400 text-sm mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FaCalendar className="text-faz-green" />
                <span>{format(new Date(news.published_at), 'MMMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEye className="text-faz-orange" />
                <span>{news.views} views</span>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 hover:text-faz-green transition ml-auto"
              >
                <FaShare /> Share
              </button>
            </div>
            
            {news.featured_image && (
              <div className="mb-8 rounded-xl overflow-hidden">
                <img
                  src={news.featured_image}
                  alt={news.title}
                  className="w-full h-auto object-cover max-h-96"
                />
              </div>
            )}
            
            <GlassCard className="p-6 md:p-8">
              <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-xl text-gray-300 font-medium mb-4">{news.excerpt}</p>
                <div className="text-gray-300 space-y-4 leading-relaxed">
                  {news.content.split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NewsDetail;