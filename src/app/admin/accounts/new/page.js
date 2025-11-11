'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [parentAccounts, setParentAccounts] = useState([]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'asset',
    category: 'current_asset',
    parentAccountId: '',
    description: '',
    openingBalance: '0',
    isBankAccount: false,
    isTaxAccount: false,
    taxRate: '0',
  });

  const [errors, setErrors] = useState({});

  const accountTypes = {
    asset: {
      label: 'Asset',
      categories: [
        { value: 'current_asset', label: 'Current Asset' },
        { value: 'fixed_asset', label: 'Fixed Asset' },
        { value: 'other_asset', label: 'Other Asset' },
      ],
    },
    liability: {
      label: 'Liability',
      categories: [
        { value: 'current_liability', label: 'Current Liability' },
        { value: 'long_term_liability', label: 'Long-term Liability' },
        { value: 'other_liability', label: 'Other Liability' },
      ],
    },
    equity: {
      label: 'Equity',
      categories: [
        { value: 'owner_equity', label: 'Owner Equity' },
        { value: 'retained_earnings', label: 'Retained Earnings' },
      ],
    },
    revenue: {
      label: 'Revenue',
      categories: [
        { value: 'sales_revenue', label: 'Sales Revenue' },
        { value: 'other_revenue', label: 'Other Revenue' },
      ],
    },
    expense: {
      label: 'Expense',
      categories: [
        { value: 'cost_of_goods_sold', label: 'Cost of Goods Sold' },
        { value: 'operating_expense', label: 'Operating Expense' },
        { value: 'financial_expense', label: 'Financial Expense' },
        { value: 'other_expense', label: 'Other Expense' },
      ],
    },
  };

  useEffect(() => {
    fetchParentAccounts();
  }, [formData.type]);

  const fetchParentAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/accounts?type=${formData.type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Filter only group accounts for parent selection
        const groupAccounts = data.data.accounts.filter((a) => a.isGroup);
        setParentAccounts(groupAccounts);
      }
    } catch (err) {
      console.error('Error fetching parent accounts:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Update category when type changes
    if (name === 'type') {
      const firstCategory = accountTypes[value].categories[0].value;
      setFormData((prev) => ({
        ...prev,
        category: firstCategory,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Account code is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Account name must be at least 2 characters';
    }

    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }

    if (!formData.category) {
      newErrors.category = 'Account category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          parentAccountId: formData.parentAccountId || null,
          openingBalance: parseFloat(formData.openingBalance) || 0,
          taxRate: parseFloat(formData.taxRate) || 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/accounts');
        }, 1500);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        }
        setError(data.message || 'Failed to create account');
      }
    } catch (err) {
      console.error('Error creating account:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Created!
          </h2>
          <p className="text-gray-600">Redirecting to accounts list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Account</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create a new account in your Chart of Accounts
              </p>
            </div>
            <Link
              href="/admin/accounts"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., 1101"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Cash in Hand"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(accountTypes).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {accountTypes[formData.type].categories.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Parent Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Account
              </label>
              <select
                name="parentAccountId"
                value={formData.parentAccountId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None (Root Level)</option>
                {parentAccounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select a parent group account (optional)
              </p>
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Balance (PKR)
              </label>
              <input
                type="number"
                name="openingBalance"
                value={formData.openingBalance}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Optional description for this account"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Bank Account Checkbox */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isBankAccount"
                  checked={formData.isBankAccount}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  This is a bank account
                </span>
              </label>
            </div>

            {/* Tax Account Section */}
            <div className="md:col-span-2 border-t pt-6">
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  name="isTaxAccount"
                  checked={formData.isTaxAccount}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  This is a tax account
                </span>
              </label>

              {formData.isTaxAccount && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
            <Link
              href="/admin/accounts"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
