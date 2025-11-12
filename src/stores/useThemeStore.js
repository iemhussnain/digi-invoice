import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Theme Store
 *
 * Benefits:
 * - Global theme state (dark/light mode)
 * - Persisted user preference
 * - System preference detection
 * - Easy toggle from any component
 */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      // State
      theme: 'light', // 'light' | 'dark' | 'system'
      systemPreference: 'light',

      // Actions
      setTheme: (theme) => {
        set({ theme });

        // Apply theme to document
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          const effectiveTheme =
            theme === 'system' ? get().systemPreference : theme;

          if (effectiveTheme === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      detectSystemPreference: () => {
        if (typeof window !== 'undefined') {
          const isDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches;
          set({ systemPreference: isDark ? 'dark' : 'light' });
        }
      },

      // Getters
      getEffectiveTheme: () => {
        const { theme, systemPreference } = get();
        return theme === 'system' ? systemPreference : theme;
      },

      isDark: () => {
        return get().getEffectiveTheme() === 'dark';
      },
    }),
    {
      name: 'theme-storage', // localStorage key
    }
  )
);

// Initialize system preference detection
if (typeof window !== 'undefined') {
  useThemeStore.getState().detectSystemPreference();

  // Listen for system theme changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      useThemeStore.getState().detectSystemPreference();
    });
}
