'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch GRNs with pagination and filters
 */
export function useGRNs({ page = 1, search = '', status = '', inspectionStatus = '' } = {}) {
  return useQuery({
    queryKey: ['grns', page, search, status, inspectionStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (inspectionStatus) params.append('inspectionStatus', inspectionStatus);

      const response = await fetch(`/api/grn?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load GRNs');
      }

      return data.data;
    },
  });
}

/**
 * Fetch single GRN by ID
 */
export function useGRN(grnId) {
  return useQuery({
    queryKey: ['grns', grnId],
    queryFn: async () => {
      const response = await fetch(`/api/grn/${grnId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load GRN');
      }

      return data.data;
    },
    enabled: !!grnId,
  });
}

/**
 * Create GRN mutation
 */
export function useCreateGRN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grnData) => {
      const response = await fetch('/api/grn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grnData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create GRN');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grns'] });
    },
  });
}

/**
 * Update GRN mutation
 */
export function useUpdateGRN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ grnId, grnData }) => {
      const response = await fetch(`/api/grn/${grnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grnData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update GRN');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['grns'] });
      queryClient.invalidateQueries({ queryKey: ['grns', variables.grnId] });
    },
  });
}

/**
 * Delete GRN mutation
 */
export function useDeleteGRN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grnId) => {
      const response = await fetch(`/api/grn/${grnId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete GRN');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grns'] });
    },
  });
}
