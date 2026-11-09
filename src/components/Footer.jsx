import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { publicContentAPI } from '../api';

const Footer = () => {
  const [sections, setSections] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await publicContentAPI.getFooter();
        if (!cancelled) setSections(res.data || []);
      } catch (err) {
        console.error('Failed to load footer', err);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const renderLink = (link) => {
    const cls = 'text-gray-400 hover:text-faz-green transition';
    if (link.is_external) {
      return (
        <a href={link.path} className={cls} target="_blank" rel="noopener noreferrer">
          {link.label}
        </a>
      );
    }
    return (
      <Link to={link.path || '#'} className={cls}>
        {link.label}
      </Link>
    );
  };

  return (
    <footer className="bg-black/50 backdrop-blur-md border-t border-white/10 mt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About FAZ — static */}
          <div>
            <h3 className="text-xl font-bold gradient-text mb-4">Football Association of Zambia</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Governing body of football in Zambia. Committed to developing the beautiful game at all levels – from grassroots to professional.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="https://facebook.com/FAZ" target="_blank" rel="noopener noreferrer"
                 className="glass p-2 rounded-full hover:bg-faz-green/20 transition"><FaFacebookF /></a>
              <a href="https://twitter.com/FAZ" target="_blank" rel="noopener noreferrer"
                 className="glass p-2 rounded-full hover:bg-faz-green/20 transition"><FaTwitter /></a>
              <a href="https://instagram.com/FAZ" target="_blank" rel="noopener noreferrer"
                 className="glass p-2 rounded-full hover:bg-faz-green/20 transition"><FaInstagram /></a>
              <a href="https://youtube.com/FAZ" target="_blank" rel="noopener noreferrer"
                 className="glass p-2 rounded-full hover:bg-faz-green/20 transition"><FaYoutube /></a>
            </div>
          </div>

          {/* Dynamic link sections */}
          {loaded && sections.map((section) => (
            <div key={section.id}>
              <h4 className="font-semibold mb-4 text-white">{section.title}</h4>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.id}>{renderLink(link)}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Us — static */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-faz-orange mt-1" />
                <span className="text-gray-400">Football House, Lusaka, Zambia</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone className="text-faz-orange" />
                <span className="text-gray-400">+260 211 123456</span>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="text-faz-orange" />
                <span className="text-gray-400">info@faz.zm</span>
              </li>
            </ul>
          </div>

          {/* Newsletter — static */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Stay Updated</h4>
            <p className="text-gray-400 text-sm mb-3">Subscribe to our newsletter</p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Your email"
                className="glass px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-faz-orange" />
              <button type="submit" className="btn-primary text-sm py-2">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-gray-500 text-xs">
          <p>&copy; {new Date().getFullYear()} Football Association of Zambia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;