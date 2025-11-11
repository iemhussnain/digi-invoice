'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AccountLedgerPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      const response = await fetch('/api/accounts?isActive=true&isGroup=false');
      const data = await response.json();

      if (data.success) {
        setAccounts(data.data.accounts);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchLedger = async () => {
    if (!selectedAccount) {
      setError('Please select an account');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        accountId: selectedAccount,
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/reports/ledger?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLedgerData(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load ledger');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Ledger</h1>
              <p className="text-gray-600 mt-2">
                View detailed transaction history for any account
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Reports
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Account *
              </label>
              {accountsLoading ? (
                <div className="text-gray-500">Loading accounts...</div>
              ) : (
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Account --</option>
                  {accounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchLedger}
              disabled={loading || !selectedAccount}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Ledger Report */}
        {ledgerData && (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {ledgerData.account.code} - {ledgerData.account.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {ledgerData.account.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Normal Balance</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {ledgerData.account.normalBalance}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Opening Balance</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(ledgerData.openingBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Closing Balance</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(ledgerData.closingBalance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Total Debits</p>
                  <p className="text-xl font-bold text-blue-900">
                    {formatCurrency(ledgerData.totalDebit)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Total Credits</p>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(ledgerData.totalCredit)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Net Change</p>
                  <p className="text-xl font-bold text-purple-900">
                    {formatCurrency(ledgerData.closingBalance - ledgerData.openingBalance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transactions ({ledgerData.entries.length})
                </h3>
              </div>
              {ledgerData.entries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No transactions found for the selected period
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Voucher
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Debit
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credit
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ledgerData.entries.map((entry, index) => (
                        <tr key={entry._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(entry.entryDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {entry.voucherId?.voucherNumber ? (
                              <Link
                                href={`/admin/vouchers/${entry.voucherId._id}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {entry.voucherId.voucherNumber}
                              </Link>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {entry.description || entry.voucherId?.narration || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {entry.type === 'debit' ? (
                              <span className="text-blue-600 font-medium">
                                {formatCurrency(entry.amount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {entry.type === 'credit' ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(entry.amount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(entry.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
