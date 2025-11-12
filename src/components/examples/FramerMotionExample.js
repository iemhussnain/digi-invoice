'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from '@/components/motion/AnimatedCard';
import AnimatedButton from '@/components/motion/AnimatedButton';
import AnimatedModal from '@/components/motion/AnimatedModal';
import { AnimatedList, AnimatedListItem } from '@/components/motion/AnimatedList';
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInRight,
  slideInLeft,
  bounceAnimation,
  pulseAnimation,
  shakeAnimation,
} from '@/utils/animations';

/**
 * Framer Motion Examples
 * Demonstrates all animation patterns implemented in DigInvoice ERP
 */
export default function FramerMotionExample() {
  const [showModal, setShowModal] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const items = [
    { id: 1, name: 'Invoice #INV-001', amount: 'Rs 50,000' },
    { id: 2, name: 'Invoice #INV-002', amount: 'Rs 75,000' },
    { id: 3, name: 'Invoice #INV-003', amount: 'Rs 125,000' },
    { id: 4, name: 'Invoice #INV-004', amount: 'Rs 90,000' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Framer Motion Animations
          </h1>
          <p className="text-gray-600">
            Complete showcase of animations implemented in DigInvoice ERP
          </p>
        </motion.div>

        {/* Basic Animations */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Animations</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeIn}
              className="bg-blue-100 p-4 rounded text-center"
            >
              Fade In
            </motion.div>
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              className="bg-green-100 p-4 rounded text-center"
            >
              Fade In Up
            </motion.div>
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInDown}
              className="bg-purple-100 p-4 rounded text-center"
            >
              Fade In Down
            </motion.div>
            <motion.div
              initial="initial"
              animate="animate"
              variants={scaleIn}
              className="bg-yellow-100 p-4 rounded text-center"
            >
              Scale In
            </motion.div>
            <motion.div
              initial="initial"
              animate="animate"
              variants={slideInRight}
              className="bg-pink-100 p-4 rounded text-center"
            >
              Slide Right
            </motion.div>
            <motion.div
              initial="initial"
              animate="animate"
              variants={slideInLeft}
              className="bg-indigo-100 p-4 rounded text-center"
            >
              Slide Left
            </motion.div>
          </div>
        </div>

        {/* Animated Cards */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Animated Cards (Hover Me!)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnimatedCard className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white" delay={0}>
              <h3 className="text-lg font-semibold mb-2">Card 1</h3>
              <p className="text-sm">Hover to see lift effect</p>
            </AnimatedCard>
            <AnimatedCard className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white" delay={0.1}>
              <h3 className="text-lg font-semibold mb-2">Card 2</h3>
              <p className="text-sm">Hover to see lift effect</p>
            </AnimatedCard>
            <AnimatedCard className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white" delay={0.2}>
              <h3 className="text-lg font-semibold mb-2">Card 3</h3>
              <p className="text-sm">Hover to see lift effect</p>
            </AnimatedCard>
          </div>
        </div>

        {/* Animated Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Animated Buttons (Click & Hover!)</h2>
          <div className="flex flex-wrap gap-3">
            <AnimatedButton className="px-6 py-2 bg-blue-600 text-white rounded-lg">
              Primary Button
            </AnimatedButton>
            <AnimatedButton className="px-6 py-2 bg-green-600 text-white rounded-lg">
              Success Button
            </AnimatedButton>
            <AnimatedButton className="px-6 py-2 bg-red-600 text-white rounded-lg">
              Danger Button
            </AnimatedButton>
            <AnimatedButton className="px-6 py-2 bg-purple-600 text-white rounded-lg">
              Purple Button
            </AnimatedButton>
          </div>
        </div>

        {/* Animated List (Stagger) */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Animated List (Stagger Effect)</h2>
          <AnimatedList className="space-y-2">
            {items.map((item) => (
              <AnimatedListItem key={item.id}>
                <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                  <span className="font-medium text-gray-900">{item.name}</span>
                  <span className="text-green-600 font-semibold">{item.amount}</span>
                </div>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        </div>

        {/* Animated Modal */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Animated Modal</h2>
          <AnimatedButton
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Open Modal
          </AnimatedButton>

          <AnimatedModal isOpen={showModal} onClose={() => setShowModal(false)}>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Beautiful Animated Modal
              </h3>
              <p className="text-gray-600 mb-4">
                This modal has smooth scale and fade animations with a backdrop blur effect.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <AnimatedButton
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Confirm
                </AnimatedButton>
              </div>
            </div>
          </AnimatedModal>
        </div>

        {/* Special Animations */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Special Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bounce */}
            <motion.div
              key={`bounce-${trigger}`}
              initial="initial"
              animate="animate"
              variants={bounceAnimation}
              className="bg-orange-100 p-6 rounded text-center cursor-pointer"
              onClick={() => setTrigger(t => t + 1)}
            >
              <p className="font-semibold">Bounce</p>
              <p className="text-sm text-gray-600">Click to replay</p>
            </motion.div>

            {/* Pulse */}
            <motion.div
              variants={pulseAnimation}
              animate="animate"
              className="bg-red-100 p-6 rounded text-center"
            >
              <p className="font-semibold">Pulse</p>
              <p className="text-sm text-gray-600">Continuous</p>
            </motion.div>

            {/* Shake */}
            <motion.div
              key={`shake-${trigger}`}
              variants={shakeAnimation}
              animate="animate"
              className="bg-yellow-100 p-6 rounded text-center cursor-pointer"
              onClick={() => setTrigger(t => t + 1)}
            >
              <p className="font-semibold">Shake</p>
              <p className="text-sm text-gray-600">Click to shake</p>
            </motion.div>
          </div>
        </div>

        {/* Usage in DigiInvoice */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Implementation in DigInvoice ERP
          </h2>
          <div className="space-y-3 text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">✅ Dashboard</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• Welcome card with fadeInUp animation</li>
                <li>• Stats cards with stagger effect</li>
                <li>• Animated logout button</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✅ Invoices Page</h4>
              <ul className="text-green-800 space-y-1">
                <li>• Table rows with stagger animation</li>
                <li>• Action buttons with hover effects</li>
                <li>• Smooth transitions</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">✅ Modals & Dialogs</h4>
              <ul className="text-purple-800 space-y-1">
                <li>• Modal scale and fade animation</li>
                <li>• Backdrop fade animation</li>
                <li>• Smooth open/close transitions</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">✅ Components</h4>
              <ul className="text-orange-800 space-y-1">
                <li>• All buttons have micro-interactions</li>
                <li>• Cards lift on hover</li>
                <li>• Lists animate on entry</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Performance Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">⚡ Performance Notes</h3>
          <ul className="text-yellow-800 text-sm space-y-1">
            <li>• Framer Motion uses hardware acceleration (GPU)</li>
            <li>• Animations are optimized for 60fps</li>
            <li>• Bundle size: Only ~30 KB (gzipped)</li>
            <li>• All animations respect user's reduced-motion preference</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
