// frontend/src/components/HeroCarousel.jsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { contentAPI } from '../api';
import { resolveAssetUrl } from '../utils/assets';

const HeroCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load hero slides from the backend
  useEffect(() => {
    let cancelled = false;

    contentAPI
      .getHeroSlides()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        const list = Array.isArray(data) ? data : [];
        // Backend already sorts by slide_order, but we normalize shape here
        setSlides(
          list.map((s) => ({
            id: s.id,
            image: s.image_url,
            title: s.title,
            subtitle: s.subtitle,
            cta: s.cta_text,
            link: s.cta_link || '#',
          }))
        );
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load hero slides:', err);
        setSlides([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Reset index if slides change
  useEffect(() => {
    setCurrentIndex(0);
  }, [slides.length]);

  // Autoplay
  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Loading state — keep the space reserved so layout doesn't jump
  if (loading) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
      </div>
    );
  }

  // No slides configured — render a neutral gradient rather than nothing
  if (!slides.length) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-faz-green via-black to-faz-orange/40" />
    );
  }

  const slide = slides[currentIndex];

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${resolveAssetUrl(slide.image)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg"
            >
              {slide.title}
            </motion.h1>
            {slide.subtitle && (
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-white/90 mt-4"
              >
                {slide.subtitle}
              </motion.p>
            )}
            {slide.cta && (
              <motion.a
                href={slide.link}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="btn-primary mt-8 inline-block"
              >
                {slide.cta}
              </motion.a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'bg-faz-orange w-6' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;