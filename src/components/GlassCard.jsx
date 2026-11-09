import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass p-6 rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;