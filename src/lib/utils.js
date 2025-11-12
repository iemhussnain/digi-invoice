import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for proper Tailwind deduplication
 *
 * @example
 * cn('px-4 py-2', { 'bg-blue-600': isActive, 'bg-gray-200': !isActive })
 * cn('text-sm', condition && 'font-bold', 'text-gray-900')
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
