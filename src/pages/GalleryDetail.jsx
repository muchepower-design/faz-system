import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Footer from '../components/Footer';
import { mediaAPI } from '../api';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCamera, FaCalendarAlt } from 'react-icons/fa';
import { format } from 'date-fns';

const GalleryDetail = () => {
  const { id } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, [id]);

  const fetchGallery = async () => {
    try {
      const res = await mediaAPI.getGallery(id);
      setGallery(res.data);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 text-center">
        <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="pt-24 text-center">
        <GlassCard className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-faz-red">Gallery Not Found</h2>
          <Link to="/media/galleries" className="btn-primary mt-4 inline-block">Back to Galleries</Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6">
        <Link to="/media/galleries" className="text-faz-orange hover:text-faz-green mb-4 inline-flex items-center gap-2">
          <FaArrowLeft /> Back to Galleries
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text">{gallery.title}</h1>
          <p className="text-gray-300 mt-2">{gallery.description}</p>
          {gallery.event_date && (
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
              <FaCalendarAlt /> {format(new Date(gallery.event_date), 'MMMM dd, yyyy')}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.images && gallery.images.map((image, idx) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <div className="aspect-square overflow-hidden rounded-xl glass">
                <img 
                  src={image.image_url} 
                  alt={image.caption || gallery.title} 
                  className="w-full h-full object-cover hover:scale-110 transition duration-300"
                />
              </div>
              {image.caption && (
                <p className="text-xs text-gray-400 mt-1 text-center line-clamp-2">{image.caption}</p>
              )}
            </motion.div>
          ))}
        </div>
        
        {(!gallery.images || gallery.images.length === 0) && (
          <GlassCard className="text-center py-8 text-gray-400">
            No images in this gallery yet.
          </GlassCard>
        )}
      </div>
      
      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage.image_url} 
              alt={selectedImage.caption} 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {selectedImage.caption && (
              <p className="text-center text-white mt-4">{selectedImage.caption}</p>
            )}
          </div>
        </div>
      )}
      
      <Footer />
    </>
  );
};

export default GalleryDetail;