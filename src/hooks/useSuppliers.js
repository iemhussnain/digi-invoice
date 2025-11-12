'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch suppliers with pagination and filters
 */
export function useSuppliers({ page = 1, search = '', filterActive = 'all', filterType = 'all' }) {
  return useQuery({
    queryKey: ['suppliers', page, search, filterActive, filterType],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (filterActive !== 'all') params.append('isActive', filterActive);
      if (filterType !== 'all') params.append('supplierType', filterType);

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
