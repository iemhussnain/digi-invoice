'use client';

import AsyncSelect from 'react-select/async';
import { Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';

/**
 * Searchable Select Component with react-select
 * Supports both React Hook Form (via Controller) and plain controlled usage
 */

// Custom styles for react-select to match Tailwind design
const customStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderColor: state.isFocused ? '#3b82f6' : state.selectProps.error ? '#ef4444' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : '#9ca3af',
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
  }),
};

/**
 * Generic Async Searchable Select
 * Use this for plain controlled components (non-React Hook Form)
 */
export function SearchableSelect({
  value,
  onChange,
  loadOptions,
  placeholder = 'Search...',
  className,
  error,
  isDisabled = false,
  isClearable = true,
  defaultOptions = true,
  ...props
}) {
  return (
    <AsyncSelect
      value={value}
      onChange={onChange}
      loadOptions={loadOptions}
      defaultOptions={defaultOptions}
      cacheOptions
      placeholder={placeholder}
      className={cn('react-select-container', className)}
      classNamePrefix="react-select"
      styles={customStyles}
      isDisabled={isDisabled}
      isClearable={isClearable}
      error={error}
      {...props}
    />
  );
}

/**
 * Searchable Select for React Hook Form
 * Use this with Controller component
 */
export function SearchableSelectField({
  name,
  control,
  loadOptions,
  placeholder = 'Search...',
  label,
  required = false,
  error,
  className,
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <AsyncSelect
            {...field}
            loadOptions={loadOptions}
            defaultOptions
            cacheOptions
            placeholder={placeholder}
            classNamePrefix="react-select"
            styles={customStyles}
            error={error}
            {...props}
          />
        )}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Account Select Component
 * For selecting chart of accounts in vouchers/journal entries
 */
export function AccountSelect({ value, onChange, error, className, filterActive = true }) {
  const loadAccounts = async (inputValue) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        limit: '50',
        search: inputValue || '',
      });

      if (filterActive) {
        params.append('isActive', 'true');
      }

      const response = await fetch(`/api/accounts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        // Filter out group accounts, only show leaf accounts
        const leafAccounts = data.data.accounts.filter(acc => !acc.isGroup);

        return leafAccounts.map((account) => ({
          value: account._id,
          label: `${account.code} - ${account.name}`,
          account: account, // Store full account object for reference
        }));
      }

      return [];
    } catch (err) {
      console.error('Error loading accounts:', err);
      return [];
    }
  };

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      loadOptions={loadAccounts}
      placeholder="Search accounts by code or name..."
      error={error}
      className={className}
      isClearable={false}
    />
  );
}

/**
 * Customer Select Component
 * For selecting customers in invoices/sales
 */
export function CustomerSelect({ value, onChange, error, className }) {
  const loadCustomers = async (inputValue) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        limit: '50',
        search: inputValue || '',
        isActive: 'true',
      });

      const response = await fetch(`/api/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        return data.data.customers.map((customer) => ({
          value: customer._id,
          label: `${customer.customerCode} - ${customer.name}${
            customer.companyName ? ` (${customer.companyName})` : ''
          }`,
          customer: customer, // Store full customer object
        }));
      }

      return [];
    } catch (err) {
      console.error('Error loading customers:', err);
      return [];
    }
  };

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      loadOptions={loadCustomers}
      placeholder="Search customers by name or code..."
      error={error}
      className={className}
    />
  );
}

/**
 * Supplier Select Component
 * For selecting suppliers in purchase orders/purchases
 */
export function SupplierSelect({ value, onChange, error, className }) {
  const loadSuppliers = async (inputValue) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        limit: '50',
        search: inputValue || '',
        isActive: 'true',
      });

      const response = await fetch(`/api/suppliers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        return data.data.suppliers.map((supplier) => ({
          value: supplier._id,
          label: `${supplier.companyName || supplier.name} (${supplier.supplierCode})`,
          supplier: supplier, // Store full supplier object
        }));
      }

      return [];
    } catch (err) {
      console.error('Error loading suppliers:', err);
      return [];
    }
  };

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      loadOptions={loadSuppliers}
      placeholder="Search suppliers by name or code..."
      error={error}
      className={className}
    />
  );
}
