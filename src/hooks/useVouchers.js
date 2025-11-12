'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch vouchers with optional filters
 */
export function useVouchers({ voucherType = 'all', status = 'all' } = {}) {
  return useQuery({
    queryKey: ['vouchers', voucherType, status],
    queryFn: async () => {
      const token = localStorage.getItem('token');

      const params = new URLSearchParams();
      if (voucherType !== 'all') {
        params.append('voucherType', voucherType);
      }
      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await fetch(`/api/vouchers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load vouchers');
      }

      return data.data;
    },
  });
}

/**
 * Fetch single voucher by ID
 */
export function useVoucher(voucherId) {
  return useQuery({
    queryKey: ['vouchers', voucherId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vouchers/${voucherId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load voucher');
      }

      return data.data;
    },
    enabled: !!voucherId,
  });
}

/**
 * Create voucher mutation
 */
export function useCreateVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voucherData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(voucherData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create voucher');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });
}

/**
 * Update voucher mutation
 */
export function useUpdateVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ voucherId, voucherData }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vouchers/${voucherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(voucherData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update voucher');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers', variables.voucherId] });
    },
  });
}

/**
 * Delete voucher mutation
 */
export function useDeleteVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voucherId) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vouchers/${voucherId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete voucher');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });
}

/**
 * Post voucher mutation
 */
export function usePostVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voucherId) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/vouchers/${voucherId}/post`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to post voucher');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });
}
