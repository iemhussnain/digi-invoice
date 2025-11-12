'use client';

import { motion } from 'framer-motion';
import { buttonHoverAnimation } from '@/utils/animations';

/**
 * Animated Button Component
 * Button with hover and tap animations
 *
 * Usage:
 * <AnimatedButton onClick={handleClick}>
 *   Click Me
 * </AnimatedButton>
 */
export default function AnimatedButton({
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      whileHover={!disabled ? buttonHoverAnimation.whileHover : {}}
      whileTap={!disabled ? buttonHoverAnimation.whileTap : {}}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}
