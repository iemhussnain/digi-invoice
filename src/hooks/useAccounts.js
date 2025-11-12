'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch accounts with optional filters
 */
export function useAccounts({ type = 'all', includeInactive = false } = {}) {
  return useQuery({
    queryKey: ['accounts', type, includeInactive],
    queryFn: async () => {
      const token = localStorage.getItem('token');

      const params = new URLSearchParams();
      if (type !== 'all') {
        params.append('type', type);
      }
      if (includeInactive) {
        params.append('includeInactive', 'true');
      }

      const response = await fetch(`/api/accounts?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load accounts');
      }

      return data.data;
    },
  });
}

/**
 * Fetch single account by ID
 */
export function useAccount(accountId) {
  return useQuery({
    queryKey: ['accounts', accountId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/accounts/${accountId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load account');
      }

      return data.data;
    },
    enabled: !!accountId,
  });
}

/**
 * Create account mutation
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(accountData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create account');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

/**
 * Update account mutation
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, accountData }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(accountData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update account');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.accountId] });
    },
  });
}

/**
 * Delete account mutation
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete account');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

/**
 * Seed chart of accounts mutation
 */
export function useSeedAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/accounts/seed', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to seed accounts');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
