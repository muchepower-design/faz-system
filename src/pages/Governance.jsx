// frontend/src/pages/Governance.jsx
import { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import RichText from '../components/RichText';
import { contentAPI } from '../api';
import { resolveAssetUrl } from '../utils/assets';

const Governance = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    contentAPI
      .getGovernanceMembers()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        setMembers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load governance members:', err);
        setError('Could not load governance data.');
        setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const national = members.filter((m) => m.category === 'national');
  const provincial = members.filter((m) => m.category === 'provincial');

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <h1 className="text-4xl font-bold gradient-text mb-6">Governance</h1>
        <p className="text-gray-300 mb-8 text-center max-w-3xl mx-auto">
          The Football Association of Zambia is governed by an Executive Committee elected for the
          current term. Below are the national officers and provincial representatives.
        </p>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
          </div>
        ) : error ? (
          <GlassCard className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </GlassCard>
        ) : (
          <>
            {national.length > 0 && (
              <GlassCard className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 text-center gradient-text">
                  National Executive Committee
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {national.map((officer) => (
                    <div
                      key={officer.id}
                      className="glass p-4 rounded-xl text-center hover:scale-105 transition-transform duration-300"
                    >
                      <div className="w-28 h-28 mx-auto rounded-full overflow-hidden mb-3 border-2 border-faz-orange shadow-lg bg-faz-green/20 flex items-center justify-center">
                        {officer.image_url ? (
                          <img
                            src={resolveAssetUrl(officer.image_url)}
                            alt={officer.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-3xl font-bold text-faz-orange">
                            {officer.name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-white">{officer.name}</p>
                      <p className="text-sm text-faz-orange">{officer.position}</p>
                      {officer.bio && (
                        <div className="mt-2 text-xs text-left">
                          <RichText content={officer.bio} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {provincial.length > 0 && (
              <GlassCard>
                <h2 className="text-2xl font-semibold mb-6 text-center gradient-text">
                  Provincial Representatives
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {provincial.map((rep) => (
                    <div
                      key={rep.id}
                      className="glass p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-faz-green bg-faz-green/20 flex items-center justify-center">
                        {rep.image_url ? (
                          <img
                            src={resolveAssetUrl(rep.image_url)}
                            alt={rep.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-xl font-bold text-faz-green">
                            {rep.name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{rep.name}</p>
                        <p className="text-sm text-gray-300">
                          {rep.province ? `${rep.province} Province` : rep.position}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {national.length === 0 && provincial.length === 0 && (
              <GlassCard className="text-center py-12">
                <p className="text-gray-400">Governance information will appear here soon.</p>
              </GlassCard>
            )}
          </>
        )}

        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Football Association of Zambia – One Nation, One Passion</p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Governance;