'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

/**
 * Login mutation
 */
export function useLogin() {
  return useMutation({
    mutationFn: async (loginData) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      // Handle 409 status (active session on another device) specially
      if (response.status === 409) {
        const error = new Error(data.errors?.message || 'Active session on another device');
        error.status = 409;
        error.deviceInfo = data.errors;
        throw error;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data in localStorage
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('organization', JSON.stringify(data.data.organization));
      }

      return data;
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (registerData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Registration failed');
        error.errors = data.errors;
        throw error;
      }

      // Store token and user data in localStorage
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      return data;
    },
  });
}

/**
 * Forgot password mutation
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email) => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.error && typeof data.error === 'object') {
          throw new Error(data.error.email || 'Failed to send reset email');
        }
        throw new Error(data.message || 'Failed to send reset email');
      }

      return data;
    },
  });
}

/**
 * Verify reset token query
 */
export function useVerifyResetToken(token) {
  return useQuery({
    queryKey: ['verifyResetToken', token],
    queryFn: async () => {
      const response = await fetch(`/api/auth/reset-password?token=${token}`);
      const data = await response.json();

      if (!response.ok || !data.data?.valid) {
        throw new Error(data.error?.message || 'This password reset link is invalid or has expired.');
      }

      return data.data;
    },
    enabled: !!token,
    retry: false,
  });
}

/**
 * Reset password mutation
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password, confirmPassword }) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Failed to reset password');
        error.errors = data.error;
        throw error;
      }

      return data;
    },
  });
}

/**
 * Verify email query
 */
export function useVerifyEmail(token) {
  return useQuery({
    queryKey: ['verifyEmail', token],
    queryFn: async () => {
      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify email');
      }

      return data.data;
    },
    enabled: !!token,
    retry: false,
  });
}

/**
 * Resend verification email mutation
 */
export function useResendVerification() {
  return useMutation({
    mutationFn: async (email) => {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      return data;
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');

      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }

      // Clear local storage regardless of API call success
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('organization');

      return { success: true };
    },
  });
}
