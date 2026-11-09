import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import Footer from '../components/Footer';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, send to backend contact endpoint
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <h1 className="text-4xl font-bold gradient-text mb-6">Contact Us</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <GlassCard>
            <h2 className="text-2xl font-semibold mb-4">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Your Name" className="glass w-full p-3 rounded" onChange={e => setForm({...form, name: e.target.value})} required />
              <input type="email" placeholder="Your Email" className="glass w-full p-3 rounded" onChange={e => setForm({...form, email: e.target.value})} required />
              <textarea placeholder="Message" rows="5" className="glass w-full p-3 rounded" onChange={e => setForm({...form, message: e.target.value})} required />
              <button type="submit" className="btn-primary w-full">Send Message</button>
              {submitted && <p className="text-faz-green text-center">Thank you! We'll reply soon.</p>}
            </form>
          </GlassCard>
          <GlassCard>
            <h2 className="text-2xl font-semibold mb-4">Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3"><FaMapMarkerAlt className="text-faz-orange" /> <span>Football House, Lusaka, Zambia</span></div>
              <div className="flex items-center gap-3"><FaPhone className="text-faz-orange" /> <span>+260 211 123456</span></div>
              <div className="flex items-center gap-3"><FaEnvelope className="text-faz-orange" /> <span>info@faz.zm</span></div>
              <div className="flex items-center gap-3"><FaClock className="text-faz-orange" /> <span>Mon-Fri: 08:00 – 17:00</span></div>
            </div>
          </GlassCard>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Contact;