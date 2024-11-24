'use client';

import { WineAnalyzer } from '@/components/wine-analyzer';
import { motion } from 'framer-motion';

export function PageMain() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="container mx-auto"
    >
      <h1 className="text-5xl font-serif italic mb-8 text-center text-amber-100 drop-shadow-lg">
        wAIne
      </h1>
      <WineAnalyzer />
    </motion.div>
  );
}
