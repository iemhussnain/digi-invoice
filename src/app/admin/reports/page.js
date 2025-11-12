'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const router = useRouter();

  const reports = [
    {
      id: 'ledger',
      title: 'Account Ledger',
      description: 'View detailed transaction history for any account with running balances',
      icon: '📒',
      href: '/admin/reports/ledger',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      id: 'trial-balance',
      title: 'Trial Balance',
      description: 'Verify that total debits equal total credits across all accounts',
      icon: '⚖️',
      href: '/admin/reports/trial-balance',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      iconColor: 'text-green-600',
    },
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      description: 'View financial position: Assets = Liabilities + Equity',
      icon: '📊',
      href: '/admin/reports/balance-sheet',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Accounting Reports</h1>
              <p className="text-gray-600 mt-2">
                Generate and view financial reports for your organization
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={report.href}
              className={`${report.color} border-2 rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              <div className="flex flex-col h-full">
                <div className={`text-5xl mb-4 ${report.iconColor}`}>
                  {report.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {report.title}
                </h3>
                <p className="text-gray-600 text-sm flex-grow">
                  {report.description}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-gray-900">
                  View Report
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Account Ledger</h3>
              <p className="text-sm text-gray-600">
                Shows all transactions for a specific account with opening balance,
                running balance after each entry, and closing balance.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Trial Balance</h3>
              <p className="text-sm text-gray-600">
                Lists all accounts with their debit and credit balances.
                Total debits must equal total credits for books to be balanced.
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Balance Sheet</h3>
              <p className="text-sm text-gray-600">
                Shows financial position at a point in time.
                Assets must equal Liabilities plus Equity (A = L + E).
              </p>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            Tips for Using Reports
          </h3>
          <ul className="text-sm text-gray-700 space-y-2 ml-8">
            <li>• Use date filters to view reports for specific periods</li>
            <li>• Trial Balance should always be balanced (debits = credits)</li>
            <li>• Balance Sheet should always balance (assets = liabilities + equity)</li>
            <li>• Account Ledger shows detailed history for reconciliation</li>
            <li>• Export reports to PDF or Excel for record keeping (coming soon)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
