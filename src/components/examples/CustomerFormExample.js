'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';

/**
 * Zod Schema for Customer Form Validation
 */
const customerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  address: z.string().optional(),
  ntn: z.string().optional(),
  strn: z.string().optional(),
  gstRegistered: z.boolean().default(false),
  creditLimit: z.number().min(0, 'Credit limit must be positive').optional(),
});

/**
 * Example Customer Form using React Hook Form + Zod
 *
 * Benefits:
 * - No manual useState for each field
 * - Automatic validation with Zod schema
 * - Type-safe form data
 * - Built-in error handling
 * - Clean, maintainable code
 */
export default function CustomerFormExample({ onSuccess }) {
  const queryClient = useQueryClient();

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      ntn: '',
      strn: '',
      gstRegistered: false,
      creditLimit: 0,
    },
  });

  // TanStack Query mutation for API call
  const createCustomerMutation = useMutation({
    mutationFn: (data) => apiPost('/customers', data),
    onSuccess: (data) => {
      // Invalidate and refetch customers list
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      // Reset form
      reset();

      // Call parent success callback
      if (onSuccess) onSuccess(data);

      alert('Customer created successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Form submit handler
  const onSubmit = (data) => {
    createCustomerMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Create Customer</h2>
      <p className="text-sm text-gray-600">
        Example form using React Hook Form + Zod validation
      </p>

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          className={`mt-1 block w-full px-3 py-2 border ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          {...register('email')}
          className={`mt-1 block w-full px-3 py-2 border ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Phone Field */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone *
        </label>
        <input
          type="tel"
          id="phone"
          {...register('phone')}
          className={`mt-1 block w-full px-3 py-2 border ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Address Field */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <textarea
          id="address"
          rows={3}
          {...register('address')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Tax Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ntn" className="block text-sm font-medium text-gray-700">
            NTN (National Tax Number)
          </label>
          <input
            type="text"
            id="ntn"
            {...register('ntn')}
            placeholder="1234567-8"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="strn" className="block text-sm font-medium text-gray-700">
            STRN (Sales Tax Registration)
          </label>
          <input
            type="text"
            id="strn"
            {...register('strn')}
            placeholder="12-34-5678-901-23"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* GST Registered Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="gstRegistered"
          {...register('gstRegistered')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="gstRegistered" className="ml-2 block text-sm text-gray-700">
          GST Registered
        </label>
      </div>

      {/* Credit Limit */}
      <div>
        <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">
          Credit Limit (Rs.)
        </label>
        <input
          type="number"
          id="creditLimit"
          {...register('creditLimit', { valueAsNumber: true })}
          className={`mt-1 block w-full px-3 py-2 border ${
            errors.creditLimit ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        />
        {errors.creditLimit && (
          <p className="mt-1 text-sm text-red-600">{errors.creditLimit.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={isSubmitting || createCustomerMutation.isPending}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
        </button>
      </div>

      {/* Benefits Callout */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Benefits of React Hook Form + Zod:
        </h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>✓ No manual useState for each field</li>
          <li>✓ Automatic validation with schema</li>
          <li>✓ Type-safe form data</li>
          <li>✓ Built-in error handling</li>
          <li>✓ Performance optimized (uncontrolled components)</li>
          <li>✓ Easy integration with TanStack Query mutations</li>
        </ul>
      </div>
    </form>
  );
}
