'use client';

import { motion } from 'framer-motion';
import { listContainerVariants, listItemVariants } from '@/utils/animations';

/**
 * Animated List Container
 * Wraps list with stagger animation
 *
 * Usage:
 * <AnimatedList>
 *   <AnimatedListItem>Item 1</AnimatedListItem>
 *   <AnimatedListItem>Item 2</AnimatedListItem>
 * </AnimatedList>
 */
export function AnimatedList({ children, className = '' }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={listContainerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated List Item
 * Individual list item with animation
 */
export function AnimatedListItem({ children, className = '' }) {
  return (
    <motion.div variants={listItemVariants} className={className}>
      {children}
    </motion.div>
  );
}
