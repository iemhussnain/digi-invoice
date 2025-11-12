import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiGet, apiPost } from '@/lib/api';

/**
 * Authentication Store
 *
 * Benefits:
 * - User info available globally (no props drilling)
 * - Persisted in localStorage (survives page refresh)
 * - Single source of truth for auth state
 * - No repeated API calls for user info
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiPost('/auth/login', { email, password });
          const { user, token } = response.data;

          // Store token in localStorage for API calls
          localStorage.setItem('token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          throw error;
        }
      },

      logout: () => {
        // Clear localStorage
        localStorage.removeItem('token');

        // Reset state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiGet('/auth/me');
          const { user } = response.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      // Getters (computed values)
      hasPermission: (permission) => {
        const { user } = get();
        if (!user?.role?.permissions) return false;
        return user.role.permissions.includes(permission);
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role?.level >= 90;
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
