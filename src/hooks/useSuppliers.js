'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch suppliers with pagination and filters
 */
export function useSuppliers({ page = 1, search = '', isActive = '', category = '', paymentTerms = '' }) {
  return useQuery({
    queryKey: ['suppliers', page, search, isActive, category, paymentTerms],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (search) params.append('search', search);
      if (isActive) params.append('isActive', isActive);
      if (category) params.append('category', category);
      if (paymentTerms) params.append('paymentTerms', paymentTerms);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/suppliers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load suppliers');
      }

      return data.data;
    },
  });
}

/**
 * Fetch single supplier by ID
 */
export function useSupplier(supplierId) {
  return useQuery({
    queryKey: ['suppliers', supplierId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load supplier');
      }

      return data.data;
    },
    enabled: !!supplierId,
  });
}

/**
 * Create supplier mutation
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(supplierData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create supplier');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all supplier queries to refetch
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

/**
 * Update supplier mutation
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ supplierId, supplierData }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(supplierData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update supplier');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all supplier queries to refetch
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      // Invalidate the specific supplier query
      queryClient.invalidateQueries({ queryKey: ['suppliers', variables.supplierId] });
    },
  });
}

/**
 * Delete supplier mutation
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierId) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete supplier');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all supplier queries to refetch
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
