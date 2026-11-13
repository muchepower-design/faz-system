// frontend/src/pages/vendor/VendorRedirect.jsx
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/GlassCard';
import { FaStore } from 'react-icons/fa';

const SHOP_URL = (import.meta.env.VITE_API_FRONTEND_SHOP || '').replace(/\/$/, '');

export default function VendorRedirect() {
  const { user } = useAuth();
  const target = `${SHOP_URL}/vendor/dashboard`;

  useEffect(() => {
    if (!SHOP_URL) return;
    const t = setTimeout(() => {
      window.location.href = target;
    }, 1200);
    return () => clearTimeout(t);
  }, [target]);

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 max-w-lg">
      <GlassCard className="text-center py-12">
        <FaStore className="text-5xl text-faz-orange mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Vendor Portal</h2>
        <p className="text-gray-400 mb-4">
          Opening the vendor dashboard on FAZ Shop…
        </p>
        {SHOP_URL ? (
          <a href={target} className="btn-primary inline-block">
            Open Now
          </a>
        ) : (
          <p className="text-sm text-red-400">
            Shop URL not configured (VITE_API_FRONTEND_SHOP)
          </p>
        )}
        {user && (
          <p className="text-xs text-gray-500 mt-4">
            Signed in as {user.email}
          </p>
        )}
      </GlassCard>
    </div>
  );
}