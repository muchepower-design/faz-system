import React from 'react';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const AboutFAZ = () => {
  const items = [
    { name: 'History', path: '/about/history', icon: '📜' },
    { name: 'Mission & Vision', path: '/about/mission', icon: '🎯' },
    { name: 'FAZ Staff', path: '/staff', icon: '👥' },
    { name: 'Committees', path: '/committees', icon: '⚖️' },
    { name: 'Partners', path: '/partners', icon: '🤝' },
  ];
  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <h1 className="text-4xl font-bold gradient-text mb-6 text-center">About FAZ</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <Link key={item.path} to={item.path}>
              <GlassCard className="text-center hover:bg-white/10 transition">
                <div className="text-5xl mb-2">{item.icon}</div>
                <h2 className="text-xl font-semibold">{item.name}</h2>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutFAZ;