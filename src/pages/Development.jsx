import React from 'react';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Development = () => {
  const items = [
    { name: 'Grassroots', path: '/development/grassroots', icon: '🌱' },
    { name: 'Coach Education', path: '/development/coaches', icon: '📘' },
    { name: 'Referee Development', path: '/development/referees', icon: '🟨' },
    { name: 'Women in Football', path: '/development/women', icon: '👩‍⚽' },
  ];
  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <h1 className="text-4xl font-bold gradient-text mb-6">Football Development</h1>
        <div className="grid md:grid-cols-2 gap-6">
          {items.map(item => (
            <Link key={item.path} to={item.path}>
              <GlassCard className="text-center hover:bg-white/10">
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

export default Development;