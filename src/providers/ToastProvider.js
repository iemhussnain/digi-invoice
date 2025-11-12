'use client';

import { Toaster } from 'react-hot-toast';

/**
 * React Hot Toast Provider
 * Provides toast notification functionality to the entire application
 *
 * Usage in layout.js:
 * import ToastProvider from '@/providers/ToastProvider';
 *
 * <body>
 *   <ToastProvider />
 *   {children}
 * </body>
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        duration: 4000, // 4 seconds
        style: {
          background: '#fff',
          color: '#363636',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        // Success toast style
        success: {
          duration: 3000,
          style: {
            background: '#10b981', // green-500
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        },
        // Error toast style
        error: {
          duration: 5000,
          style: {
            background: '#ef4444', // red-500
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        },
        // Loading toast style
        loading: {
          style: {
            background: '#3b82f6', // blue-500
            color: '#fff',
          },
        },
      }}
    />
  );
}
