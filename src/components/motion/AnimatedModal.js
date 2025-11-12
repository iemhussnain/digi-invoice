'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { modalAnimation, backdropAnimation } from '@/utils/animations';

/**
 * Animated Modal Component
 * Modal with backdrop and content animations
 *
 * Usage:
 * <AnimatedModal isOpen={isOpen} onClose={handleClose}>
 *   <YourModalContent />
 * </AnimatedModal>
 */
export default function AnimatedModal({ isOpen, onClose, children, className = '' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={backdropAnimation}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={modalAnimation}
              className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto ${className}`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
