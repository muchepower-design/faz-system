// frontend/src/components/PartnerSlider.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { contentAPI } from '../api';
import { resolveAssetUrl } from '../utils/assets';

const PartnerSlider = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    contentAPI
      .getPartners()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        setPartners(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load partners:', err);
        setPartners([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) return null;
  if (!partners.length) return null;

  return (
    <div className="py-12 bg-gradient-to-r from-black/30 via-faz-green/10 to-black/30">
      <div className="container mx-auto px-6">
        <h3 className="text-2xl font-bold text-center gradient-text mb-8">Our Partners</h3>
        <div className="overflow-hidden">
          <div className="flex animate-scroll gap-12 whitespace-nowrap">
            {[...partners, ...partners].map((partner, idx) => (
              <motion.div
                key={`${partner.id}-${idx}`}
                className="inline-flex flex-shrink-0 items-center justify-center w-40 h-24 glass rounded-xl p-2 bg-white/5"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <img
                  src={resolveAssetUrl(partner.logo_url)}
                  alt={partner.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => { e.currentTarget.style.opacity = 0.3; }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerSlider;