'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TrialBalancePage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');
  const [fiscalPeriod, setFiscalPeriod] = useState('');
  const [trialBalanceData, setTrialBalanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupByType, setGroupByType] = useState(true);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (fiscalYear) params.append('fiscalYear', fiscalYear);
      if (fiscalPeriod) params.append('fiscalPeriod', fiscalPeriod);

      const response = await fetch(`/api/reports/trial-balance?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTrialBalanceData(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load trial balance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load trial balance on mount with default filters
  useEffect(() => {
    fetchTrialBalance();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const renderAccountRow = (item, index) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
        {item.account.code}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {item.account.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
        {item.netDebit > 0 ? (
          <span className="text-blue-600 font-medium">
            {formatCurrency(item.netDebit)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
        {item.netCredit > 0 ? (
          <span className="text-green-600 font-medium">
            {formatCurrency(item.netCredit)}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );

  const renderGroupedView = () => {
    if (!trialBalanceData?.groupedByType) return null;

    const groups = [
      { key: 'asset', title: 'Assets', color: 'bg-blue-50' },
      { key: 'liability', title: 'Liabilities', color: 'bg-red-50' },
      { key: 'equity', title: 'Equity', color: 'bg-purple-50' },
      { key: 'revenue', title: 'Revenue', color: 'bg-green-50' },
      { key: 'expense', title: 'Expense', color: 'bg-orange-50' },
    ];

    return groups.map((group) => {
      const items = trialBalanceData.groupedByType[group.key];
      if (!items || items.length === 0) return null;

      const groupDebitTotal = items.reduce((sum, item) => sum + item.netDebit, 0);
      const groupCreditTotal = items.reduce((sum, item) => sum + item.netCredit, 0);

      return (
        <div key={group.key} className="mb-6">
          <div className={`${group.color} px-4 py-2 font-semibold text-gray-900 border-l-4 border-gray-400`}>
            {group.title}
          </div>
          <table className="w-full">
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => renderAccountRow(item, `${group.key}-${index}`))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-3 text-sm text-gray-900" colSpan="2">
                  Total {group.title}
                </td>
                <td className="px-6 py-3 text-sm text-right text-blue-900">
                  {groupDebitTotal > 0 ? formatCurrency(groupDebitTotal) : '-'}
                </td>
                <td className="px-6 py-3 text-sm text-right text-green-900">
                  {groupCreditTotal > 0 ? formatCurrency(groupCreditTotal) : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trial Balance</h1>
              <p className="text-gray-600 mt-2">
                Verify that total debits equal total credits
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiscal Year
              </label>
              <input
                type="text"
                placeholder="e.g., 2024"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiscal Period
              </label>
              <input
                type="text"
                placeholder="e.g., 2024-01"
                value={fiscalPeriod}
                onChange={(e) => setFiscalPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={fetchTrialBalance}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={groupByType}
                onChange={(e) => setGroupByType(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Group by Account Type
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Trial Balance Report */}
        {trialBalanceData && (
          <div className="space-y-6">
            {/* Balance Status */}
            <div className={`${trialBalanceData.isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-2 rounded-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-bold ${trialBalanceData.isBalanced ? 'text-green-900' : 'text-red-900'}`}>
                    {trialBalanceData.isBalanced ? '✓ Books are Balanced' : '⚠️ Books are NOT Balanced'}
                  </h3>
                  <p className={`mt-1 ${trialBalanceData.isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                    {trialBalanceData.isBalanced
                      ? 'Total debits equal total credits'
                      : `Difference: ${formatCurrency(Math.abs(trialBalanceData.totals.difference))}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {trialBalanceData.trialBalance.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-sm text-blue-600 font-medium">Total Debits</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {formatCurrency(trialBalanceData.totals.debit)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <p className="text-sm text-green-600 font-medium">Total Credits</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {formatCurrency(trialBalanceData.totals.credit)}
                </p>
              </div>
            </div>

            {/* Accounts Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Balances
                </h3>
              </div>

              {trialBalanceData.trialBalance.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No accounts with activity found
                </div>
              ) : groupByType ? (
                <div className="p-4">
                  {renderGroupedView()}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account Name
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Debit
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trialBalanceData.trialBalance.map((item, index) =>
                        renderAccountRow(item, index)
                      )}
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                        <td className="px-6 py-4" colSpan="2">
                          GRAND TOTAL
                        </td>
                        <td className="px-6 py-4 text-right text-blue-900">
                          {formatCurrency(trialBalanceData.totals.debit)}
                        </td>
                        <td className="px-6 py-4 text-right text-green-900">
                          {formatCurrency(trialBalanceData.totals.credit)}
                        </td>
                      </tr>
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
