'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch purchase orders with pagination and filters
 */
export function usePurchaseOrders({ page = 1, search = '', status = '', supplierId = '' }) {
  return useQuery({
    queryKey: ['purchaseOrders', page, search, status, supplierId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (supplierId) params.append('supplierId', supplierId);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load purchase orders');
      }

      return data.data;
    },
  });
}

/**
 * Fetch single purchase order by ID
 */
export function usePurchaseOrder(poId) {
  return useQuery({
    queryKey: ['purchaseOrders', poId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load purchase order');
      }

      return data.data;
    },
    enabled: !!poId,
  });
}

/**
 * Create purchase order mutation
 */
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(poData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create purchase order');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all purchase order queries to refetch
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

/**
 * Update purchase order mutation
 */
export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, poData }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(poData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update purchase order');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all purchase order queries to refetch
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      // Invalidate the specific purchase order query
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders', variables.poId] });
    },
  });
}

/**
 * Delete purchase order mutation
 */
export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poId) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete purchase order');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all purchase order queries to refetch
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });
}

/**
 * Send purchase order via email mutation
 */
export function useSendPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, email }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/purchase-orders/${poId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to send purchase order');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all purchase order queries to refetch
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      // Invalidate the specific purchase order query
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders', variables.poId] });
    },
  });
}
