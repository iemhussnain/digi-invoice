'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch customers with pagination and filters
 */
export function useCustomers({ page = 1, search = '', filterActive = 'all', filterType = 'all' }) {
  return useQuery({
    queryKey: ['customers', page, search, filterActive, filterType],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (filterActive !== 'all') params.append('isActive', filterActive);
      if (filterType !== 'all') params.append('customerType', filterType);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load customers');
      }

      return data.data;
    },
  });
}

/**
 * Fetch single customer by ID
 */
export function useCustomer(customerId) {
  return useQuery({
    queryKey: ['customers', customerId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load customer');
      }

      return data.data;
    },
    enabled: !!customerId,
  });
}

/**
 * Create customer mutation
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create customer');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all customer queries to refetch
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

/**
 * Update customer mutation
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, customerData }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update customer');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all customer queries to refetch
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Invalidate the specific customer query
      queryClient.invalidateQueries({ queryKey: ['customers', variables.customerId] });
    },
  });
}

/**
 * Delete customer mutation
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete customer');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all customer queries to refetch
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
