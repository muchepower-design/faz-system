// frontend/src/pages/PageDetail.jsx
import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import RichText from '../components/RichText';
import { contentAPI } from '../api';
import { resolveAssetUrl } from '../utils/assets';

export default function PageDetail() {
  const location = useLocation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const path = location.pathname.replace(/^\//, '').split('?')[0];

  // Derive a readable title from the URL for the "not found" state
  const fallbackTitle = (path.split('/').pop() || 'Page')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    contentAPI
      .getPageByPath(path)
      .then((res) => {
        if (cancelled) return;
        setPage(res?.data || null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setPage(null);
        } else {
          setError('Failed to load page.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [path]);

  if (loading) {
    return (
      <div className="pt-24 min-h-screen container mx-auto px-6 flex justify-center">
        <div className="w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="pt-24 min-h-screen container mx-auto px-6">
          <h1 className="text-4xl font-bold gradient-text mb-6">{fallbackTitle}</h1>
          <GlassCard>
            <p className="text-red-400">{error}</p>
          </GlassCard>
        </div>
        <Footer />
      </>
    );
  }

  if (!page) {
    return (
      <>
        <div className="pt-24 min-h-screen container mx-auto px-6">
          <h1 className="text-4xl font-bold gradient-text mb-6">{fallbackTitle}</h1>
          <GlassCard className="text-center py-12">
            <div className="text-5xl mb-4">📄</div>
            <p className="text-gray-300 mb-2">
              Content for <strong>{fallbackTitle}</strong> hasn't been published yet.
            </p>
            <p className="text-gray-500 text-sm">
              An administrator can add this page from the Content Manager.
            </p>
            <Link
              to="/admin/content"
              className="inline-block mt-6 text-faz-orange hover:underline text-sm"
            >
              Go to Content Manager →
            </Link>
          </GlassCard>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        {/* Hero image */}
        {page.hero_image_url && (
          <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 bg-faz-green/10">
            <img
              src={resolveAssetUrl(page.hero_image_url)}
              alt={page.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}

        <h1 className="text-4xl font-bold gradient-text mb-3">{page.title}</h1>
        {page.subtitle && (
          <p className="text-gray-400 text-lg mb-6">{page.subtitle}</p>
        )}

        <GlassCard>
          <RichText content={page.content} />
        </GlassCard>
      </div>
      <Footer />
    </>
  );
}