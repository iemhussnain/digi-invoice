'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [fiscalYear, setFiscalYear] = useState('');
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load balance sheet on mount
  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (asOfDate) params.append('asOfDate', asOfDate);
      if (fiscalYear) params.append('fiscalYear', fiscalYear);

      const response = await fetch(`/api/reports/balance-sheet?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBalanceSheetData(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load balance sheet');
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

  const renderAccountGroup = (title, accounts, total, colorClass = 'bg-gray-50') => (
    <div className="mb-4">
      <div className={`${colorClass} px-4 py-2 font-semibold text-gray-900 border-l-4 border-gray-600`}>
        {title}
      </div>
      <div className="pl-6">
        {accounts && accounts.length > 0 ? (
          accounts.map((account) => (
            <div
              key={account._id}
              className="flex justify-between py-2 border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="text-sm">
                <span className="text-gray-600 font-mono">{account.code}</span>
                <span className="ml-2 text-gray-900">{account.name}</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(account.balance)}
              </div>
            </div>
          ))
        ) : (
          <div className="py-2 text-sm text-gray-500 italic">No accounts</div>
        )}
      </div>
      <div className="flex justify-between py-2 px-4 bg-gray-100 font-semibold text-gray-900 mt-2">
        <div>Total {title}</div>
        <div>{formatCurrency(total)}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
              <p className="text-gray-600 mt-2">
                Financial position: Assets = Liabilities + Equity
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                As of Date *
              </label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fiscal Year (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., 2024"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchBalanceSheet}
                disabled={loading}
                className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Balance Sheet Report */}
        {balanceSheetData && (
          <div className="space-y-6">
            {/* Balance Status */}
            <div className={`${balanceSheetData.isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-2 rounded-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xl font-bold ${balanceSheetData.isBalanced ? 'text-green-900' : 'text-red-900'}`}>
                    {balanceSheetData.isBalanced ? '✓ Balance Sheet is Balanced' : '⚠️ Balance Sheet is NOT Balanced'}
                  </h3>
                  <p className={`mt-1 ${balanceSheetData.isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                    {balanceSheetData.isBalanced
                      ? 'Assets = Liabilities + Equity'
                      : `Difference: ${formatCurrency(Math.abs(balanceSheetData.totals.difference))}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">As of</p>
                  <p className="text-xl font-bold text-gray-900">
                    {format(new Date(balanceSheetData.asOfDate), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue & Expense Summary (for Retained Earnings calculation) */}
            {balanceSheetData.revenueExpenseSummary && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-3">
                  Income Statement Summary (for Retained Earnings)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Total Revenue</p>
                    <p className="text-lg font-bold text-blue-900">
                      {formatCurrency(balanceSheetData.revenueExpenseSummary.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Total Expense</p>
                    <p className="text-lg font-bold text-blue-900">
                      {formatCurrency(balanceSheetData.revenueExpenseSummary.totalExpense)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Net Income</p>
                    <p className="text-lg font-bold text-blue-900">
                      {formatCurrency(balanceSheetData.revenueExpenseSummary.netIncome)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets Column */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-blue-600 text-white">
                  <h3 className="text-xl font-bold">ASSETS</h3>
                </div>
                <div className="p-6">
                  {/* Current Assets */}
                  {renderAccountGroup(
                    'Current Assets',
                    balanceSheetData.balanceSheet.assets.current.accounts,
                    balanceSheetData.balanceSheet.assets.current.total,
                    'bg-blue-50'
                  )}

                  {/* Fixed Assets */}
                  {renderAccountGroup(
                    'Fixed Assets',
                    balanceSheetData.balanceSheet.assets.fixed.accounts,
                    balanceSheetData.balanceSheet.assets.fixed.total,
                    'bg-blue-50'
                  )}

                  {/* Total Assets */}
                  <div className="flex justify-between py-4 px-4 bg-blue-100 font-bold text-blue-900 text-lg mt-4 rounded">
                    <div>TOTAL ASSETS</div>
                    <div>{formatCurrency(balanceSheetData.balanceSheet.assets.total)}</div>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-green-600 text-white">
                  <h3 className="text-xl font-bold">LIABILITIES & EQUITY</h3>
                </div>
                <div className="p-6">
                  {/* Current Liabilities */}
                  {renderAccountGroup(
                    'Current Liabilities',
                    balanceSheetData.balanceSheet.liabilities.current.accounts,
                    balanceSheetData.balanceSheet.liabilities.current.total,
                    'bg-red-50'
                  )}

                  {/* Long-term Liabilities */}
                  {renderAccountGroup(
                    'Long-term Liabilities',
                    balanceSheetData.balanceSheet.liabilities.longTerm.accounts,
                    balanceSheetData.balanceSheet.liabilities.longTerm.total,
                    'bg-red-50'
                  )}

                  {/* Total Liabilities */}
                  <div className="flex justify-between py-2 px-4 bg-red-100 font-semibold text-red-900 mb-4 rounded">
                    <div>Total Liabilities</div>
                    <div>{formatCurrency(balanceSheetData.balanceSheet.liabilities.total)}</div>
                  </div>

                  {/* Equity */}
                  <div className="mb-4">
                    <div className="bg-purple-50 px-4 py-2 font-semibold text-gray-900 border-l-4 border-gray-600">
                      Equity
                    </div>
                    <div className="pl-6">
                      {balanceSheetData.balanceSheet.equity.accounts.map((account) => (
                        <div
                          key={account._id}
                          className="flex justify-between py-2 border-b border-gray-100 hover:bg-gray-50"
                        >
                          <div className="text-sm">
                            <span className="text-gray-600 font-mono">{account.code}</span>
                            <span className="ml-2 text-gray-900">{account.name}</span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(account.balance)}
                          </div>
                        </div>
                      ))}
                      {/* Retained Earnings */}
                      <div className="flex justify-between py-2 border-b border-gray-100 hover:bg-gray-50">
                        <div className="text-sm">
                          <span className="text-gray-600 font-mono">9999</span>
                          <span className="ml-2 text-gray-900">Retained Earnings (Net Income)</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(balanceSheetData.balanceSheet.equity.retainedEarnings)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between py-2 px-4 bg-purple-100 font-semibold text-purple-900 mt-2 rounded">
                      <div>Total Equity</div>
                      <div>{formatCurrency(balanceSheetData.balanceSheet.equity.total)}</div>
                    </div>
                  </div>

                  {/* Total Liabilities & Equity */}
                  <div className="flex justify-between py-4 px-4 bg-green-100 font-bold text-green-900 text-lg mt-4 rounded">
                    <div>TOTAL LIABILITIES & EQUITY</div>
                    <div>{formatCurrency(balanceSheetData.totals.liabilitiesAndEquity)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accounting Equation Verification */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Accounting Equation Verification
              </h3>
              <div className="text-center">
                <div className="inline-flex items-center gap-4 text-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Assets</p>
                    <p className="font-bold text-blue-900">
                      {formatCurrency(balanceSheetData.totals.assets)}
                    </p>
                  </div>
                  <span className="text-3xl font-bold text-gray-400">=</span>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Liabilities</p>
                    <p className="font-bold text-red-900">
                      {formatCurrency(balanceSheetData.balanceSheet.liabilities.total)}
                    </p>
                  </div>
                  <span className="text-3xl font-bold text-gray-400">+</span>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Equity</p>
                    <p className="font-bold text-purple-900">
                      {formatCurrency(balanceSheetData.balanceSheet.equity.total)}
                    </p>
                  </div>
                </div>
                {!balanceSheetData.isBalanced && (
                  <p className="text-red-600 font-medium mt-4">
                    ⚠️ Difference: {formatCurrency(Math.abs(balanceSheetData.totals.difference))}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
