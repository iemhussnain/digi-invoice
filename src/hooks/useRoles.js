'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch roles with optional filters
 */
export function useRoles({ type = 'all', includePermissions = true } = {}) {
  return useQuery({
    queryKey: ['roles', type, includePermissions],
    queryFn: async () => {
      let url = '/api/rbac/roles?includePermissions=' + includePermissions;
      if (type !== 'all') {
        url += `&type=${type}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load roles');
      }

      return data.data;
    },
  });
}

/**
 * Fetch single role by ID
 */
export function useRole(roleId) {
  return useQuery({
    queryKey: ['roles', roleId],
    queryFn: async () => {
      const response = await fetch(`/api/rbac/roles/${roleId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load role');
      }

      return data.data;
    },
    enabled: !!roleId,
  });
}

/**
 * Create role mutation
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleData) => {
      const response = await fetch('/api/rbac/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create role');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

/**
 * Update role mutation
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, roleData }) => {
      const response = await fetch(`/api/rbac/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update role');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId] });
    },
  });
}

/**
 * Delete role mutation
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId) => {
      const response = await fetch(`/api/rbac/roles/${roleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete role');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}
