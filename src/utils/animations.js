/**
 * Framer Motion Animation Utilities
 * Reusable animation variants for consistent motion design across the app
 */

/**
 * Fade In Animation
 * Simple fade in from invisible to visible
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

/**
 * Fade In Up Animation
 * Fade in while moving up from below
 */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3 }
};

/**
 * Fade In Down Animation
 * Fade in while moving down from above
 */
export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

/**
 * Scale In Animation
 * Scale from small to normal size
 */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 }
};

/**
 * Slide In From Right
 * Slide in from the right side
 */
export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
  transition: { duration: 0.3 }
};

/**
 * Slide In From Left
 * Slide in from the left side
 */
export const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.3 }
};

/**
 * Modal Animation
 * Scale and fade in for modals/dialogs
 */
export const modalAnimation = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1] // Custom easing for smooth feel
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 }
  }
};

/**
 * Backdrop Animation
 * For modal backdrops
 */
export const backdropAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

/**
 * Dropdown Animation
 * For dropdown menus
 */
export const dropdownAnimation = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.1 }
  }
};

/**
 * List Item Animation
 * Stagger animation for list items
 */
export const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05 // Delay between each child
    }
  }
};

export const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Card Animation
 * For cards and panels
 */
export const cardAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: { opacity: 0, y: 20 },
  whileHover: {
    y: -4,
    transition: { duration: 0.2 }
  }
};

/**
 * Button Hover Animation
 * For interactive buttons
 */
export const buttonHoverAnimation = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 }
};

/**
 * Bounce Animation
 * Attention-grabbing bounce
 */
export const bounceAnimation = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.4,
      times: [0, 0.5, 1]
    }
  }
};

/**
 * Rotate Animation
 * For loading spinners
 */
export const rotateAnimation = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

/**
 * Pulse Animation
 * Subtle pulse effect
 */
export const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

/**
 * Page Transition Variants
 * For page-level transitions
 */
export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
};

/**
 * Toast Notification Animation
 * For toast messages
 */
export const toastAnimation = {
  initial: { opacity: 0, x: 100, scale: 0.9 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

/**
 * Collapse/Expand Animation
 * For accordion-like components
 */
export const collapseAnimation = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Badge Animation
 * For status badges
 */
export const badgeAnimation = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  }
};

/**
 * Shake Animation
 * For error states
 */
export const shakeAnimation = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  }
};

/**
 * Number Counter Animation
 * For animating number changes
 */
export const numberCounterConfig = {
  transition: { duration: 0.5, ease: "easeOut" }
};
