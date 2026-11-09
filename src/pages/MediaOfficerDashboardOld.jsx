// frontend/src/pages/MediaOfficerDashboard.jsx
import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { newsAPI, matchesAPI, teamsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaNewspaper, FaCamera, FaCalendarAlt, FaPlus, FaEdit, FaTrash, 
  FaImage, FaTimes, FaUpload, FaCheckCircle, FaExclamationTriangle 
} from 'react-icons/fa';

const MediaOfficerDashboard = () => {
  const { user } = useAuth();
  const [news, setNews] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [teams, setTeams] = useState([]); // for future reference
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    excerpt: '', 
    content: '', 
    featured_image: '' 
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [newsRes, matchesRes, teamsRes] = await Promise.all([
        newsAPI.getAll(),
        matchesAPI.getUpcoming(),
        teamsAPI.getAll(),
      ]);
      setNews(newsRes.data);
      setUpcomingMatches(matchesRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to load data. Please refresh.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      if (editingNews) {
        await newsAPI.update(editingNews.id, formData);
        setMessage({ type: 'success', text: 'News article updated successfully!' });
      } else {
        await newsAPI.create(formData);
        setMessage({ type: 'success', text: 'News article published successfully!' });
      }
      setShowNewsForm(false);
      setEditingNews(null);
      setFormData({ title: '', excerpt: '', content: '', featured_image: '' });
      setImagePreview('');
      fetchData(); // refresh list
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to save news article.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this news article? This action cannot be undone.')) return;
    try {
      await newsAPI.delete(id);
      setMessage({ type: 'success', text: 'News article deleted successfully.' });
      fetchData();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Failed to delete news article.' });
    }
  };

  const editNews = (item) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      featured_image: item.featured_image || '',
    });
    setImagePreview(item.featured_image || '');
    setShowNewsForm(true);
  };

  const handleImageUrlChange = (url) => {
    setFormData({ ...formData, featured_image: url });
    setImagePreview(url);
  };

  if (loading) return (
    <div className="pt-24 text-center">
      <div className="inline-block w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-400">Loading dashboard...</p>
    </div>
  );

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6">
      {/* Success/Error message */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-6 z-50 glass p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'border-faz-green' : 'border-faz-red'
            }`}
          >
            {message.type === 'success' ? <FaCheckCircle className="text-faz-green" /> : <FaExclamationTriangle className="text-faz-red" />}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-4xl font-bold gradient-text">Media Officer Dashboard</h1>
        <button onClick={() => setShowNewsForm(true)} className="btn-primary flex items-center gap-2">
          <FaPlus /> Write News
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* News Management Section */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2"><FaNewspaper /> Manage News</h2>
            <span className="text-sm text-gray-400">{news.length} articles</span>
          </div>
          <div className="space-y-4">
            {news.length === 0 ? (
              <GlassCard className="text-center py-8 text-gray-400">
                No news articles yet. Click "Write News" to create your first article.
              </GlassCard>
            ) : (
              news.map(item => (
                <GlassCard key={item.id} className="hover:scale-[1.01] transition-transform duration-200">
                  <div className="flex gap-4">
                    {item.featured_image && (
                      <img src={item.featured_image} alt="" className="w-24 h-24 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="text-gray-400 text-xs mb-2">
                        {new Date(item.published_at).toLocaleDateString()} • {item.views} views
                      </p>
                      <p className="text-gray-300 line-clamp-2">{item.excerpt}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editNews(item)} className="p-2 hover:text-faz-green transition-colors">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 hover:text-faz-red transition-colors">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>

        {/* Upcoming matches & Media Tips */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><FaCalendarAlt /> Upcoming Fixtures</h2>
          <div className="space-y-3 mb-6">
            {upcomingMatches.length === 0 ? (
              <GlassCard className="text-center py-4 text-gray-400">No upcoming matches.</GlassCard>
            ) : (
              upcomingMatches.slice(0, 5).map(match => (
                <GlassCard key={match.id} className="hover:bg-white/10">
                  <p className="font-semibold">{match.home_team} vs {match.away_team}</p>
                  <p className="text-sm text-gray-400">{new Date(match.match_date).toLocaleString()}</p>
                  <p className="text-xs mt-1">{match.venue}</p>
                </GlassCard>
              ))
            )}
          </div>

          <GlassCard>
            <h3 className="font-semibold mb-2 flex items-center gap-2"><FaCamera /> Media Tips</h3>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li>Capture high‑resolution action shots</li>
              <li>Post match summaries within 2 hours</li>
              <li>Use #FAZ hashtag on social media</li>
              <li>Coordinate with match commissioner for official stats</li>
            </ul>
          </GlassCard>
        </div>
      </div>

      {/* News Form Modal */}
      {showNewsForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold gradient-text">{editingNews ? 'Edit News Article' : 'Create News Article'}</h2>
              <button onClick={() => { setShowNewsForm(false); setEditingNews(null); setImagePreview(''); }} className="text-gray-400 hover:text-white">
                <FaTimes size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  className="glass w-full p-3 rounded-lg focus:ring-2 focus:ring-faz-orange transition"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Excerpt (short summary) *</label>
                <input
                  type="text"
                  className="glass w-full p-3 rounded-lg"
                  value={formData.excerpt}
                  onChange={e => setFormData({...formData, excerpt: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Content *</label>
                <textarea
                  rows="8"
                  className="glass w-full p-3 rounded-lg font-mono"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Featured Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="glass flex-1 p-3 rounded-lg"
                    value={formData.featured_image}
                    onChange={e => handleImageUrlChange(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Paste image URL:');
                      if (url) handleImageUrlChange(url);
                    }}
                    className="glass p-3 rounded-lg hover:bg-white/20"
                  >
                    <FaUpload />
                  </button>
                </div>
                {imagePreview && (
                  <div className="mt-2 relative group">
                    <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => handleImageUrlChange('')}
                      className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowNewsForm(false); setEditingNews(null); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {editingNews ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default MediaOfficerDashboard;