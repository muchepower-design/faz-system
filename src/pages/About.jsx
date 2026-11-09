import React from 'react';
import GlassCard from '../components/GlassCard';
import { FaHistory, FaTrophy, FaUsers, FaHandshake } from 'react-icons/fa';
import Footer from '../components/Footer';

const About = () => {
  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <h1 className="text-4xl font-bold gradient-text mb-6">About FAZ</h1>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <GlassCard>
            <FaHistory className="text-4xl text-faz-green mb-3" />
            <h2 className="text-2xl font-semibold mb-2">Our History</h2>
            <p className="text-gray-300">Founded in 1929, the Football Association of Zambia has been the heartbeat of Zambian football for over 90 years, nurturing talent and hosting international competitions.</p>
          </GlassCard>
          <GlassCard>
            <FaTrophy className="text-4xl text-faz-orange mb-3" />
            <h2 className="text-2xl font-semibold mb-2">Achievements</h2>
            <p className="text-gray-300">Zambia won the Africa Cup of Nations in 2012. Our clubs have won multiple CAF inter‑club titles, and we continue to develop world‑class referees and coaches.</p>
          </GlassCard>
          <GlassCard>
            <FaUsers className="text-4xl text-faz-red mb-3" />
            <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
            <p className="text-gray-300">To develop, promote and manage football in Zambia with integrity, transparency and excellence, making football accessible to all.</p>
          </GlassCard>
          <GlassCard>
            <FaHandshake className="text-4xl text-faz-green mb-3" />
            <h2 className="text-2xl font-semibold mb-2">Our Values</h2>
            <p className="text-gray-300">Integrity, fairness, transparency, teamwork, and passion for the beautiful game.</p>
          </GlassCard>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default About;