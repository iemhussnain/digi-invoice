'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const [formData, setFormData] = useState({
    voucherType: 'JV',
    voucherDate: new Date().toISOString().split('T')[0],
    narration: '',
    referenceNumber: '',
    autoPost: false,
  });

  const [entries, setEntries] = useState([
    { accountId: '', type: 'debit', amount: '', description: '' },
    { accountId: '', type: 'credit', amount: '', description: '' },
  ]);

  const [errors, setErrors] = useState({});
  const [totals, setTotals] = useState({ debit: 0, credit: 0, difference: 0 });

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [entries]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/accounts', {
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
        // Filter out group accounts (only show leaf accounts)
        const leafAccounts = data.data.accounts.filter(acc => !acc.isGroup && acc.isActive);
        setAccounts(leafAccounts);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const calculateTotals = () => {
    let debitTotal = 0;
    let creditTotal = 0;

    entries.forEach(entry => {
      const amount = parseFloat(entry.amount) || 0;
      if (entry.type === 'debit') {
        debitTotal += amount;
      } else if (entry.type === 'credit') {
        creditTotal += amount;
      }
    });

    const difference = debitTotal - creditTotal;

    setTotals({
      debit: debitTotal,
      credit: creditTotal,
      difference,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const addEntry = (type) => {
    setEntries([...entries, { accountId: '', type, amount: '', description: '' }]);
  };

  const removeEntry = (index) => {
    if (entries.length <= 2) {
      alert('Voucher must have at least 2 entries');
      return;
    }
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.voucherType) {
      newErrors.voucherType = 'Voucher type is required';
    }

    if (!formData.voucherDate) {
      newErrors.voucherDate = 'Voucher date is required';
    }

    if (!formData.narration || formData.narration.trim().length < 5) {
      newErrors.narration = 'Narration must be at least 5 characters';
    }

    // Validate entries
    let hasDebit = false;
    let hasCredit = false;

    entries.forEach((entry, index) => {
      if (!entry.accountId) {
        newErrors[`entry_${index}_account`] = 'Account is required';
      }
      if (!entry.amount || parseFloat(entry.amount) <= 0) {
        newErrors[`entry_${index}_amount`] = 'Amount must be greater than 0';
      }

      if (entry.type === 'debit') hasDebit = true;
      if (entry.type === 'credit') hasCredit = true;
    });

    if (!hasDebit) {
      newErrors.entries = 'At least one debit entry is required';
    }

    if (!hasCredit) {
      newErrors.entries = 'At least one credit entry is required';
    }

    // Check if balanced
    if (Math.abs(totals.difference) > 0.01) {
      newErrors.balance = 'Debit and Credit must be equal';
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

      // Prepare entries with proper data types
      const formattedEntries = entries.map(entry => ({
        accountId: entry.accountId,
        type: entry.type,
        amount: parseFloat(entry.amount),
        description: entry.description || '',
      }));

      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          entries: formattedEntries,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/vouchers');
        }, 1500);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        }
        setError(data.message || 'Failed to create voucher');
      }
    } catch (err) {
      console.error('Error creating voucher:', err);
      setError('Failed to create voucher. Please try again.');
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
            Voucher Created!
          </h2>
          <p className="text-gray-600">
            {formData.autoPost ? 'Voucher posted and ledger entries created' : 'Saved as draft'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Voucher</h1>
              <p className="mt-1 text-sm text-gray-600">
                Journal Entry with Double-Entry Accounting
              </p>
            </div>
            <Link
              href="/admin/vouchers"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {errors.balance && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            ⚠️ {errors.balance}
          </div>
        )}

        {errors.entries && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            ⚠️ {errors.entries}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Voucher Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Voucher Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Voucher Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voucher Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="voucherType"
                  value={formData.voucherType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="JV">JV - Journal Voucher</option>
                  <option value="PV">PV - Payment Voucher</option>
                  <option value="RV">RV - Receipt Voucher</option>
                  <option value="CV">CV - Contra Voucher</option>
                </select>
              </div>

              {/* Voucher Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voucher Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="voucherDate"
                  value={formData.voucherDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.voucherDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Narration */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Narration / Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="narration"
                value={formData.narration}
                onChange={handleChange}
                rows="3"
                placeholder="Describe the transaction..."
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.narration ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.narration && (
                <p className="mt-1 text-sm text-red-600">{errors.narration}</p>
              )}
            </div>
          </div>

          {/* Entries */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Journal Entries</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addEntry('debit')}
                  className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-3 rounded-lg transition"
                >
                  + Add Debit
                </button>
                <button
                  type="button"
                  onClick={() => addEntry('credit')}
                  className="text-sm bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-3 rounded-lg transition"
                >
                  + Add Credit
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 ${
                    entry.type === 'debit'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Account */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={entry.accountId}
                          onChange={(e) => handleEntryChange(index, 'accountId', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`entry_${index}_account`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Account</option>
                          {accounts.map((account) => (
                            <option key={account._id} value={account._id}>
                              {account.code} - {account.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={entry.type}
                          onChange={(e) => handleEntryChange(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="debit">Debit (Dr)</option>
                          <option value="credit">Credit (Cr)</option>
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount (PKR) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={entry.amount}
                          onChange={(e) => handleEntryChange(index, 'amount', e.target.value)}
                          placeholder="0.00"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`entry_${index}_amount`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>

                      {/* Description */}
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={entry.description}
                          onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                          placeholder="Additional details..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Remove Button */}
                    {entries.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(index)}
                        className="mt-6 text-red-600 hover:text-red-800 font-medium"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Total Debit</div>
                  <div className="text-xl font-bold text-blue-600">
                    ₨ {totals.debit.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Credit</div>
                  <div className="text-xl font-bold text-green-600">
                    ₨ {totals.credit.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Difference</div>
                  <div
                    className={`text-xl font-bold ${
                      Math.abs(totals.difference) < 0.01
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {Math.abs(totals.difference) < 0.01 ? (
                      <span>✓ Balanced</span>
                    ) : (
                      <span>₨ {Math.abs(totals.difference).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="autoPost"
                  checked={formData.autoPost}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Post immediately (create ledger entries)
                </span>
              </label>

              <div className="flex gap-4">
                <Link
                  href="/admin/vouchers"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || Math.abs(totals.difference) >= 0.01}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : formData.autoPost ? 'Create & Post' : 'Save as Draft'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
