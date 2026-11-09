import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaCheckCircle } from 'react-icons/fa';

const MediaAccreditation = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <Link to="/media" className="text-faz-orange hover:text-faz-green mb-4 inline-flex items-center gap-2">
          ← Back to Media Centre
        </Link>
        <h1 className="text-4xl font-bold gradient-text mb-6">Media Accreditation</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Apply for Media Accreditation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Full Name" className="glass w-full p-3 rounded" required />
              <input type="email" placeholder="Email Address" className="glass w-full p-3 rounded" required />
              <input type="text" placeholder="Media Outlet / Organization" className="glass w-full p-3 rounded" required />
              <select className="glass w-full p-3 rounded" required>
                <option value="">Select Media Type</option>
                <option>Print</option>
                <option>Broadcast (TV/Radio)</option>
                <option>Digital / Online</option>
                <option>Photography</option>
              </select>
              <input type="file" accept=".pdf,.jpg,.png" className="glass w-full p-2 rounded" />
              <button type="submit" className="btn-primary w-full">Submit Application</button>
            </form>
            {submitted && (
              <div className="mt-4 p-3 bg-faz-green/20 text-faz-green rounded-lg flex items-center gap-2">
                <FaCheckCircle /> Application submitted! We'll contact you within 5 business days.
              </div>
            )}
          </GlassCard>
          
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4">Accreditation Guidelines</h2>
            <div className="space-y-3 text-gray-300">
              <p><strong>📅 Deadline:</strong> Applications must be submitted at least 14 days before the event.</p>
              <p><strong>📋 Requirements:</strong> Valid press card or letter of assignment from media house.</p>
              <p><strong>🎫 Accreditation includes:</strong> Press pass, media working area access, match program.</p>
              <p><strong>❌ Accreditation does NOT include:</strong> Field access, camera positions without prior approval.</p>
              <Link to="/documents/accreditation-policy" className="text-faz-orange mt-4 inline-flex items-center gap-2">
                <FaFileAlt /> Download Full Policy →
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MediaAccreditation;