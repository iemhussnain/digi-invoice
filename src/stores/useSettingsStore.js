import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiGet, apiPut } from '@/lib/api';

/**
 * Settings Store
 *
 * Benefits:
 * - Organization settings available globally
 * - No repeated API calls
 * - Centralized configuration
 * - Easy to access from any component
 */
export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // State
      organization: {
        name: 'DigiInvoice ERP',
        email: '',
        phone: '',
        address: '',
        logo: '',
        ntn: '',
        strn: '',
        currency: 'PKR',
        fiscalYearStart: '01-01', // MM-DD
        taxRate: 17, // GST %
      },
      selectedFiscalYear: null,
      isLoading: false,
      error: null,

      // Actions
      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiGet('/settings');
          const { organization, fiscalYear } = response.data;

          set({
            organization,
            selectedFiscalYear: fiscalYear,
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

      updateOrganization: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiPut('/settings/organization', data);
          const { organization } = response.data;

          set({
            organization,
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

      setFiscalYear: (year) => {
        set({ selectedFiscalYear: year });
      },

      // Getters
      getCurrency: () => {
        const { organization } = get();
        return organization.currency || 'PKR';
      },

      getTaxRate: () => {
        const { organization } = get();
        return organization.taxRate || 17;
      },

      formatCurrency: (amount) => {
        const { organization } = get();
        const currency = organization.currency || 'PKR';
        return `${currency} ${amount.toLocaleString()}`;
      },
    }),
    {
      name: 'settings-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        organization: state.organization,
        selectedFiscalYear: state.selectedFiscalYear,
      }),
    }
  )
);
