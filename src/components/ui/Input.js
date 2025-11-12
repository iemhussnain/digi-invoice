'use client';

import { cn } from '@/lib/utils';

/**
 * Reusable Input Component with error handling
 */
export function Input({ error, className, ...props }) {
  return (
    <input
      className={cn(
        'mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        'dark:bg-gray-700 dark:text-white',
        error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
        className
      )}
      {...props}
    />
  );
}

/**
 * Reusable Button Component with loading state
 */
export function Button({ loading, disabled, variant = 'primary', className, children, ...props }) {
  const variants = {
    primary: loading || disabled
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
    secondary: loading || disabled
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
    danger: loading || disabled
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
    success: loading || disabled
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500',
  };

  return (
    <button
      disabled={loading || disabled}
      className={cn(
        'flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white',
        variants[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Form Field Wrapper with Label and Error
 */
export function FormField({ label, error, children, htmlFor, required }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Select Component
 */
export function Select({ error, className, children, ...props }) {
  return (
    <select
      className={cn(
        'mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        'dark:bg-gray-700 dark:text-white',
        error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

/**
 * Textarea Component
 */
export function Textarea({ error, className, ...props }) {
  return (
    <textarea
      className={cn(
        'mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        'dark:bg-gray-700 dark:text-white',
        error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
        className
      )}
      {...props}
    />
  );
}
