// frontend/src/pages/MediaOfficerDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { mediaDashboardAPI } from '../api';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import {
  FaNewspaper, FaVideo, FaImages, FaIdCard, FaPlus, FaEdit,
  FaCheckCircle, FaClock, FaChartLine, FaSyncAlt, FaArrowRight,
  FaSignOutAlt, FaFileAlt, FaUpload, FaBullhorn, FaCalendarAlt,
  FaUsers, FaRss, FaChevronRight,
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

export default function MediaOfficerDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);

  // Poll the pending-accreditation count so the tab badge stays fresh
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      api.get('/accreditation/admin/stats')
        .then((res) => { if (!cancelled) setPendingCount(res.data?.pending || 0); })
        .catch(() => { if (!cancelled) setPendingCount(0); });
    };
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'publishing', label: 'Publishing' },
    { id: 'media-assets', label: 'Media Assets' },
    {
      id: 'accreditation',
      label: (
        <span className="flex items-center gap-2">
          Accreditation
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
              {pendingCount}
            </span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 py-8">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-faz-orange font-bold mb-1">
            Media & Communications
          </p>
          <h1 className="text-4xl font-bold gradient-text">Editorial Hub</h1>
          <p className="text-gray-400 text-sm mt-1">
            Publish news, manage media assets, and process match accreditation.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {pendingCount > 0 && (
            <Link
              to="/media/accreditation"
              className="bg-faz-orange hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg animate-pulse"
            >
              <FaIdCard /> Review {pendingCount} pending
            </Link>
          )}
          <Link to="/news" className="glass px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10">
            <FaRss /> Public News
          </Link>
          <button onClick={logout} className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-500/20">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition ${
              tab === t.id
                ? 'text-faz-orange border-b-2 border-faz-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab user={user} />}
      {tab === 'publishing' && <PublishingTab />}
      {tab === 'media-assets' && <MediaAssetsTab />}
      {tab === 'accreditation' && <AccreditationTab />}
    </div>
  );
}

/* =====================================================================
 * OVERVIEW TAB
 * ===================================================================== */
function OverviewTab({ user }) {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [windowDays, setWindowDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [s, t] = await Promise.all([
        mediaDashboardAPI.getStats(),
        mediaDashboardAPI.getPublishingTrend(windowDays),
      ]);
      setStats(s.data);
      setTrend(t.data.trend || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [windowDays]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" /></div>;
  if (!stats) return null;

  const maxTrend = Math.max(1, ...trend.map((t) => t.count));
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6">
      <GlassCard className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {greeting}, {user?.first_name || user?.email || 'Editor'} 👋
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            You have <strong className="text-faz-orange">{stats.accreditation.pending}</strong> accreditation requests
            {' '}awaiting review and <strong className="text-faz-orange">{stats.news.drafts}</strong> unpublished news drafts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setWindowDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                windowDays === d ? 'bg-faz-orange text-white' : 'glass hover:bg-white/10'
              }`}>
              {d}d
            </button>
          ))}
          <button onClick={() => load(true)} disabled={refreshing}
            className="glass px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10 disabled:opacity-50">
            <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </GlassCard>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={FaNewspaper} label="Published News" value={stats.news.published}
          sub={`${stats.news.drafts} in draft`} color="from-faz-green" />
        <KpiCard icon={FaVideo} label="Videos" value={stats.videos} color="from-faz-orange" />
        <KpiCard icon={FaImages} label="Galleries" value={stats.galleries} color="from-faz-red" />
        <KpiCard icon={FaIdCard} label="Pending Accreditations" value={stats.accreditation.pending}
          sub={`${stats.accreditation.approved} approved`} color="from-yellow-500"
          urgent={stats.accreditation.pending > 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FaChartLine className="text-faz-green" /> Publishing Trend
            </h3>
            <span className="text-xs text-gray-400">Last {windowDays} days</span>
          </div>
          {trend.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No published news in this period.</p>
          ) : (
            <>
              <div className="flex items-end gap-[2px] h-40">
                {trend.map((t, i) => {
                  const pct = (t.count / maxTrend) * 100;
                  return (
                    <div key={t.date}
                      className="flex-1 bg-gradient-to-t from-faz-green to-faz-orange rounded-t-sm hover:from-faz-orange hover:to-faz-red transition-colors"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                      title={`${t.date}: ${t.count} article${t.count !== 1 ? 's' : ''}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{trend[0]?.date}</span>
                <span>{trend[trend.length - 1]?.date}</span>
              </div>
            </>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <FaBullhorn className="text-faz-orange" /> Latest Published
          </h3>
          {stats.recent_news.length === 0 ? (
            <p className="text-sm text-gray-400">No published news yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recent_news.map((n) => (
                <Link key={n.id} to={`/news/${n.id}`}
                  className="block border-b border-white/5 pb-2 hover:bg-white/5 -mx-2 px-2 rounded transition">
                  <p className="text-sm font-medium text-white line-clamp-2">{n.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {n.created_at && formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </Link>
              ))}
              <Link to="/news" className="block text-center text-sm text-faz-orange hover:underline mt-2">
                View all news →
              </Link>
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <FaClock className="text-faz-orange" /> Quick Actions
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction to="/admin/content" icon={FaPlus} label="Publish News"
            hint="Create or edit articles" />
          <QuickAction to="/admin/content" icon={FaUpload} label="Upload Media"
            hint="Videos & galleries" />
          <QuickAction to="/media/accreditation" icon={FaIdCard} label="Review Accreditation"
            hint={`${stats.accreditation.pending} pending`} highlight={stats.accreditation.pending > 0} />
          <QuickAction to="/matches" icon={FaCalendarAlt} label="Match Briefing"
            hint="Prepare fixtures context" />
        </div>
      </GlassCard>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, urgent }) {
  return (
    <GlassCard className="relative">
      {urgent && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
      <Icon className={`w-8 h-8 mb-2 bg-gradient-to-r ${color} to-transparent bg-clip-text text-transparent`} />
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-3xl font-bold gradient-text">{value ?? 0}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </GlassCard>
  );
}

function QuickAction({ to, icon: Icon, label, hint, highlight }) {
  return (
    <Link to={to}>
      <div className={`p-4 rounded-xl border transition hover:scale-[1.02] cursor-pointer h-full ${
        highlight
          ? 'bg-orange-500/10 border-faz-orange/50 hover:bg-orange-500/20'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}>
        <Icon className={`w-6 h-6 mb-2 ${highlight ? 'text-faz-orange' : 'text-gray-300'}`} />
        <p className="font-medium text-white text-sm">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
      </div>
    </Link>
  );
}

/* =====================================================================
 * PUBLISHING TAB
 * ===================================================================== */
function PublishingTab() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/news');
      setNews(res.data || []);
    } catch { toast.error('Failed to load news'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = news.filter((n) => {
    if (filter === 'published' && !n.is_published) return false;
    if (filter === 'draft' && n.is_published) return false;
    if (search) {
      const q = search.toLowerCase();
      return (n.title || '').toLowerCase().includes(q) ||
             (n.excerpt || '').toLowerCase().includes(q);
    }
    return true;
  });

  const togglePublish = async (n) => {
    try {
      await api.put(`/admin/news/${n.id}`, {
        ...n,
        is_published: !n.is_published,
      });
      toast.success(n.is_published ? 'Unpublished' : 'Published');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const remove = async (n) => {
    if (!window.confirm(`Delete "${n.title}"?`)) return;
    try {
      await api.delete(`/admin/news/${n.id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['all', 'published', 'draft'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                filter === f ? 'bg-faz-orange text-white' : 'glass hover:bg-white/10'
              }`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-1 max-w-md">
          <input type="text"
            placeholder="Search articles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-gray-500" />
          <Link to="/admin/content" className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <FaPlus /> New Article
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-12 text-gray-400">
          <FaNewspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No articles match your filters.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <GlassCard key={n.id} className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {n.featured_image ? (
                  <img src={n.featured_image} alt=""
                       className="w-14 h-14 rounded-lg object-cover border border-white/10 flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <FaNewspaper />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{n.title}</p>
                  <p className="text-xs text-gray-400 truncate">{n.excerpt || '—'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {n.created_at && new Date(n.created_at).toLocaleDateString()}
                    {' · '}
                    <span className={n.is_published ? 'text-green-400' : 'text-yellow-400'}>
                      {n.is_published ? 'Published' : 'Draft'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link to={`/news/${n.id}`} className="glass px-3 py-1.5 rounded text-sm hover:bg-white/10">
                  View
                </Link>
                <Link to="/admin/content" className="glass px-3 py-1.5 rounded text-sm hover:bg-white/10">
                  Edit
                </Link>
                <button onClick={() => togglePublish(n)}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    n.is_published
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}>
                  {n.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => remove(n)}
                  className="px-3 py-1.5 rounded text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30">
                  Delete
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
 * MEDIA ASSETS TAB
 * ===================================================================== */
function MediaAssetsTab() {
  const [tab, setTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [v, g] = await Promise.all([
        api.get('/media/videos').catch(() => ({ data: [] })),
        api.get('/media/galleries').catch(() => ({ data: [] })),
      ]);
      setVideos(v.data || []);
      setGalleries(g.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 'videos', label: `Videos (${videos.length})`, icon: FaVideo },
          { id: 'galleries', label: `Galleries (${galleries.length})`, icon: FaImages },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
              tab === t.id ? 'bg-faz-orange text-white' : 'glass hover:bg-white/10'
            }`}>
            <t.icon /> {t.label}
          </button>
        ))}
        <Link to="/admin/content" className="btn-primary ml-auto flex items-center gap-2">
          <FaUpload /> Upload
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" /></div>
      ) : tab === 'videos' ? (
        videos.length === 0 ? (
          <GlassCard className="text-center py-12 text-gray-400">
            <FaVideo className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No videos uploaded yet.</p>
          </GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <GlassCard key={v.id} className="overflow-hidden p-0">
                <div className="aspect-video bg-black">
                  <video src={v.video_url || v.url} controls className="w-full h-full" />
                </div>
                <div className="p-3">
                  <p className="font-medium text-white text-sm truncate">{v.title}</p>
                  <p className="text-xs text-gray-400">
                    {v.created_at && new Date(v.created_at).toLocaleDateString()}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        )
      ) : (
        galleries.length === 0 ? (
          <GlassCard className="text-center py-12 text-gray-400">
            <FaImages className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No galleries created yet.</p>
          </GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleries.map((g) => (
              <Link key={g.id} to={`/media/galleries/${g.id}`}>
                <GlassCard className="p-4 hover:scale-105 transition cursor-pointer h-full">
                  <FaImages className="w-8 h-8 mb-3 text-faz-orange" />
                  <p className="font-medium text-white">{g.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {g.images?.length || 0} images
                  </p>
                </GlassCard>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}

/* =====================================================================
 * ACCREDITATION TAB
 * ===================================================================== */
function AccreditationTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/accreditation/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" /></div>;

  const rows = [
    { key: 'pending',   label: 'Pending Review', color: 'text-yellow-400', icon: FaClock },
    { key: 'approved',  label: 'Approved',       color: 'text-green-400',  icon: FaCheckCircle },
    { key: 'rejected',  label: 'Rejected',       color: 'text-red-400',    icon: FaFileAlt },
    { key: 'cancelled', label: 'Cancelled',      color: 'text-gray-400',   icon: FaUsers },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rows.map((r) => (
          <GlassCard key={r.key}>
            <r.icon className={`w-8 h-8 mb-2 ${r.color}`} />
            <p className="text-xs text-gray-400">{r.label}</p>
            <p className="text-3xl font-bold text-white">{stats?.[r.key] ?? 0}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-white mb-1">Full Accreditation Dashboard</h3>
            <p className="text-sm text-gray-400">
              Review pending applications, approve/reject, cancel cards, and reverse cancellations.
            </p>
          </div>
          <Link to="/media/accreditation" className="btn-primary flex items-center gap-2">
            Open Accreditation <FaArrowRight />
          </Link>
        </div>
      </GlassCard>

      {stats?.pending > 0 && (
        <GlassCard className="border-l-4 border-faz-orange">
          <div className="flex items-start gap-3">
            <FaClock className="text-faz-orange text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-white">
                {stats.pending} application{stats.pending !== 1 ? 's' : ''} awaiting your review
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Applicants cannot access matches without your approval.
                <Link to="/media/accreditation" className="text-faz-orange ml-1 hover:underline">
                  Review now →
                </Link>
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}