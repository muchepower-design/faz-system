import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBars, FaTimes, FaUserCircle,
  FaFacebookF, FaYoutube,
  FaPhone, FaEnvelope, FaChevronDown, FaChevronRight,
  FaShoppingCart
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { publicContentAPI } from '../api';
import logoImage from '../assets/logo/faz logo.jpg';

const Navbar = () => {
  const API_URL_TICKETS = import.meta.env.VITE_API_FRONTEND_TICKETS;
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isAnyDropdownOpen, setIsAnyDropdownOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [navLoaded, setNavLoaded] = useState(false);
  const dropdownTimeout = useRef(null);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load nav tree from API
  useEffect(() => {
    let cancelled = false;
    const mapItem = (item) => ({
      id: item.id,
      name: item.label,
      path: item.path,
      is_external: item.is_external,
      children: (item.children || []).map(mapItem),
    });
    (async () => {
      try {
        const res = await publicContentAPI.getNavTree();
        if (!cancelled) setMenuItems((res.data || []).map(mapItem));
      } catch (err) {
        console.error('Failed to load navigation', err);
      } finally {
        if (!cancelled) setNavLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const closeDropdowns = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(null);
    setIsAnyDropdownOpen(false);
  };

  const handleMouseEnter = (menu) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(menu);
    setIsAnyDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
      setIsAnyDropdownOpen(false);
    }, 200);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'match_commissioner': return '/commissioner/dashboard';
      case 'media_officer': return '/media/dashboard';
      case 'club_rep': return '/club/dashboard';
      case 'referee': return '/referee/dashboard';
      default: return '/dashboard';
    }
  };

  const socialLinks = [
    { icon: FaFacebookF, href: 'https://web.facebook.com/FootballAssociationZambia', label: 'Facebook' },
    { icon: FaXTwitter, href: 'https://x.com/FAZFootball', label: 'X' },
    { icon: FaYoutube, href: 'https://www.youtube.com/@FAZTVOfficial', label: 'YouTube' },
  ];

  // Renders either an <a> for external, <Link> for internal, or a plain span for headers
  const renderLink = (item, className, onClick) => {
    if (!item.path) {
      return (
        <span
          className={`${className} flex justify-between items-center cursor-default`}
        >
          <span>{item.name}</span>
        </span>
      );
    }
    if (item.is_external) {
      return (
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          onClick={onClick}
        >
          {item.name}
        </a>
      );
    }
    return (
      <Link to={item.path} className={className} onClick={onClick}>
        {item.name}
      </Link>
    );
  };

  const renderDropdownContent = (items, level = 1) => {
    return (
      <div className={`absolute ${level === 1 ? 'top-full left-0 mt-1 w-64' : 'left-full top-0 ml-1 w-64'} glass bg-black/60 backdrop-blur-md rounded-xl shadow-2xl py-2 z-50`}>
        {items.map((item, idx) => (
          <div key={item.id || idx} className="relative group/sub">
            {item.children && item.children.length > 0 ? (
              <>
                <div className="flex justify-between items-center px-4 py-2 hover:bg-white/10 transition-colors cursor-default">
                  {item.path ? (
                    item.is_external ? (
                      <a
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium flex-1"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link to={item.path} className="text-sm font-medium flex-1" onClick={closeDropdowns}>
                        {item.name}
                      </Link>
                    )
                  ) : (
                    <span className="text-sm font-medium flex-1">{item.name}</span>
                  )}
                  <FaChevronRight size={12} className="text-gray-400 ml-2" />
                </div>
                <div className="absolute left-full top-0 hidden group-hover/sub:block">
                  {renderDropdownContent(item.children, level + 1)}
                </div>
              </>
            ) : (
              renderLink(
                item,
                'block px-4 py-2 text-sm hover:bg-white/10 transition-colors',
                closeDropdowns
              )
            )}
          </div>
        ))}
      </div>
    );
  };

  const MobileMenuItem = ({ item, level = 0 }) => {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    return (
      <div className="border-b border-white/10 last:border-0">
        <div className="flex justify-between items-center py-2 px-2">
          {item.path && !hasChildren ? (
            item.is_external ? (
              <a
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-left py-1 text-white hover:text-faz-orange"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ) : (
              <Link
                to={item.path}
                className="flex-1 text-left py-1 text-white hover:text-faz-orange"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            )
          ) : (
            <span className="flex-1 text-left py-1 font-medium">{item.name}</span>
          )}
          {hasChildren && (
            <button onClick={() => setExpanded(!expanded)} className="p-2">
              {expanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
            </button>
          )}
        </div>
        {hasChildren && expanded && (
          <div className="ml-4 space-y-1">
            {item.children.map((child) => (
              <MobileMenuItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 w-full z-50 bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-2">
          <div className="flex justify-between items-center text-xs text-gray-300">
            <div className="flex items-center gap-4">
              {socialLinks.map((social, idx) => (
                <a key={idx} href={social.href} target="_blank" rel="noopener noreferrer"
                   className="hover:text-faz-orange transition-colors">
                  <social.icon size={14} />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <a href="tel:+260211123456" className="hover:text-faz-orange flex items-center gap-1">
                  <FaPhone size={12} /> +260 211 123456
                </a>
                <a href="mailto:info@faz.zm" className="hover:text-faz-orange flex items-center gap-1">
                  <FaEnvelope size={12} /> info@faz.zm
                </a>
              </div>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-white/80">Welcome, {user.full_name || user.username}</span>
                  <button onClick={logout} className="glass px-2 py-1 rounded-md text-xs hover:bg-faz-red/20">
                    Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" className="hover:text-faz-orange flex items-center gap-1">
                  <FaUserCircle size={12} /> Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav
        className={`fixed w-full z-40 transition-all duration-300 ${
          scrolled || isAnyDropdownOpen ? 'bg-transparent backdrop-blur-md' : 'bg-transparent'
        } py-2`}
        style={{ top: '36px' }}
      >
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-faz-green to-faz-orange rounded-full flex items-center justify-center">
                <img src={logoImage} alt="FAZ Logo" className="h-10 w-auto object-contain rounded-md" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">Football Association</h1>
                <p className="text-xs text-gray-300">of Zambia</p>
              </div>
            </Link>

            {/* Desktop */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLoaded && menuItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(idx)}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.path ? (
                    item.is_external ? (
                      <a
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg hover:bg-white/10 text-white inline-flex items-center gap-1"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        to={item.path}
                        className={`px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg hover:bg-white/10 ${
                          location.pathname === item.path ? 'text-faz-orange' : 'text-white'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )
                  ) : (
                    <button className="px-3 py-2 text-sm font-medium text-white hover:text-faz-orange transition-all duration-300 flex items-center gap-1">
                      {item.name} <FaChevronDown size={10} />
                    </button>
                  )}
                  {item.children && item.children.length > 0 && activeDropdown === idx && (
                    <div className="absolute top-full left-0 mt-1">
                      {renderDropdownContent(item.children)}
                    </div>
                  )}
                </div>
              ))}

              <Link to="/cart" className="relative ml-2">
                <div className="glass px-3 py-2 rounded-full hover:bg-white/20 transition flex items-center gap-2">
                  <FaShoppingCart />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-faz-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
              </Link>

              {user && (
                <Link to={getDashboardLink()} className="glass px-3 py-2 rounded-full text-sm font-semibold ml-2 hover:bg-white/20">
                  <FaUserCircle className="inline mr-1" /> Dashboard
                </Link>
              )}
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-3 lg:hidden">
              <Link to="/cart" className="relative">
                <div className="glass p-2 rounded-full">
                  <FaShoppingCart />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-faz-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
              </Link>
              <button onClick={() => setIsOpen(!isOpen)} className="text-2xl focus:outline-none">
                {isOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden mt-4 glass rounded-2xl p-4 max-h-[80vh] overflow-y-auto"
              >
                {menuItems.map((item) => (
                  <MobileMenuItem key={item.id} item={item} />
                ))}
                <div className="mt-4 pt-4 border-t border-white/10">
                  {user ? (
                    <>
                      <Link to={getDashboardLink()} className="block py-2 text-center glass rounded-lg mb-2" onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Link>
                      <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full py-2 text-center glass rounded-lg hover:bg-faz-red/20">
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="block py-2 text-center glass rounded-lg" onClick={() => setIsOpen(false)}>
                      Login
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );
};

export default Navbar;