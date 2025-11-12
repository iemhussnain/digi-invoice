'use client';

import { motion } from 'framer-motion';
import { cardAnimation } from '@/utils/animations';

/**
 * Animated Card Component
 * Card with hover and entrance animations
 *
 * Usage:
 * <AnimatedCard>
 *   <YourCardContent />
 * </AnimatedCard>
 */
export default function AnimatedCard({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="whileHover"
      variants={cardAnimation}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
