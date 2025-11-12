'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showPromise } from '@/utils/toast';

/**
 * Fetch invoices with pagination and filters
 */
export function useInvoices({ page = 1, search = '', filterStatus = 'all', filterPayment = 'all' }) {
  return useQuery({
    queryKey: ['invoices', page, search, filterStatus, filterPayment],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPayment !== 'all') params.append('paymentStatus', filterPayment);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load invoices');
      }

      return data.data;
    },
  });
}

/**
 * Post invoice mutation
 */
export function usePostInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoiceId}/post`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to post invoice');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all invoice queries to refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

/**
 * Delete invoice mutation
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete invoice');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all invoice queries to refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
