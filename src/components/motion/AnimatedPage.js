'use client';

import { motion } from 'framer-motion';
import { pageTransition } from '@/utils/animations';

/**
 * Animated Page Wrapper
 * Wraps page content with smooth transitions
 *
 * Usage:
 * <AnimatedPage>
 *   <YourPageContent />
 * </AnimatedPage>
 */
export default function AnimatedPage({ children, className = '' }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
