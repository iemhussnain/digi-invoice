import toast from 'react-hot-toast';

/**
 * Toast Notification Utilities
 * Wrapper functions for consistent toast usage across the app
 */

/**
 * Show success toast
 * @param {string} message - Success message to display
 */
export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
  });
};

/**
 * Show error toast
 * @param {string} message - Error message to display
 */
export const showError = (message) => {
  toast.error(message, {
    duration: 5000,
  });
};

/**
 * Show info toast
 * @param {string} message - Info message to display
 */
export const showInfo = (message) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 4000,
  });
};

/**
 * Show warning toast
 * @param {string} message - Warning message to display
 */
export const showWarning = (message) => {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    style: {
      background: '#f59e0b', // amber-500
      color: '#fff',
    },
  });
};

/**
 * Show loading toast
 * @param {string} message - Loading message to display
 * @returns {string} Toast ID for dismissal
 */
export const showLoading = (message) => {
  return toast.loading(message);
};

/**
 * Dismiss a specific toast
 * @param {string} toastId - Toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Promise-based toast
 * Shows loading → success/error automatically
 *
 * @param {Promise} promise - Promise to track
 * @param {Object} messages - Messages for different states
 * @param {string} messages.loading - Loading message
 * @param {string} messages.success - Success message
 * @param {string} messages.error - Error message
 *
 * @example
 * await showPromise(
 *   fetch('/api/invoices', { method: 'POST' }),
 *   {
 *     loading: 'Creating invoice...',
 *     success: 'Invoice created successfully!',
 *     error: 'Failed to create invoice'
 *   }
 * );
 */
export const showPromise = (promise, messages) => {
  return toast.promise(promise, messages);
};

/**
 * Custom toast with full control
 * @param {string} message - Message to display
 * @param {Object} options - Toast options
 */
export const showCustom = (message, options = {}) => {
  return toast(message, options);
};

// Export default toast for advanced usage
export { toast };
