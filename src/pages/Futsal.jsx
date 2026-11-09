import React from 'react';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Futsal = () => {
  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <h1 className="text-4xl font-bold gradient-text mb-6">Futsal in Zambia</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <GlassCard><h2 className="text-2xl font-bold mb-2">Futsal Super League</h2><p className="text-gray-300">National futsal league structure.</p><Link to="/competitions/futsal-league" className="text-faz-orange mt-2 inline-block">Details →</Link></GlassCard>
          <GlassCard><h2 className="text-2xl font-bold mb-2">Men’s National Futsal Team</h2><p className="text-gray-300">Representing Zambia in CAF / FIFA futsal.</p><Link to="/national-teams/men/futsal" className="text-faz-orange mt-2 inline-block">More →</Link></GlassCard>
          <GlassCard><h2 className="text-2xl font-bold mb-2">Women’s National Futsal Team</h2><p className="text-gray-300">Growing the women’s game.</p><Link to="/national-teams/women/futsal" className="text-faz-orange mt-2 inline-block">More →</Link></GlassCard>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Futsal;