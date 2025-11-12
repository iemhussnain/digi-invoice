'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RevenueExpenseChart from '@/components/charts/RevenueExpenseChart';
import SalesAnalyticsChart from '@/components/charts/SalesAnalyticsChart';
import MonthlyComparisonChart from '@/components/charts/MonthlyComparisonChart';
import TopCustomersChart from '@/components/charts/TopCustomersChart';
import TopSuppliersChart from '@/components/charts/TopSuppliersChart';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in the browser (client-side only)
    if (typeof window === 'undefined') return;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const orgData = localStorage.getItem('organization');

    if (!token || !userData) {
      // Not logged in, redirect to login
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      if (orgData) {
        setOrganization(JSON.parse(orgData));
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
      return;
    }

    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');

    // Redirect to login
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">DigInvoice ERP</h1>
          </div>
        </header>
        <main>
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              DigInvoice ERP
            </h1>
            {organization && (
              <p className="text-sm text-gray-600">
                {organization.name}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name}! 🎉
          </h2>
          <p className="text-gray-600">
            You have successfully logged in to your dashboard.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-blue-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-semibold text-gray-900">12</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Invoices</dt>
                  <dd className="text-lg font-semibold text-gray-900">245</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-purple-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Customers</dt>
                  <dd className="text-lg font-semibold text-gray-900">89</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-orange-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Products</dt>
                  <dd className="text-lg font-semibold text-gray-900">156</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analytics Dashboard</h2>

          {/* Revenue & Expense + Sales Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RevenueExpenseChart />
            <SalesAnalyticsChart />
          </div>

          {/* Monthly Comparison */}
          <div className="mb-6">
            <MonthlyComparisonChart height={350} />
          </div>

          {/* Top Customers & Suppliers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopCustomersChart height={350} />
            <TopSuppliersChart height={350} />
          </div>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Information
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-sm text-gray-900">{user?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user?.role}
                  </span>
                </dd>
              </div>
              {user?.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{user.phone}</dd>
                </div>
              )}
            </dl>
          </div>

          {organization && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Organization
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Company</dt>
                  <dd className="text-sm text-gray-900">{organization.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Plan</dt>
                  <dd className="text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {organization.subscription?.plan}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {organization.subscription?.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-4">
            <Link
              href="/admin/sales"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-4 px-4 rounded-lg text-center transition border-2 border-emerald-300"
            >
              💵 Quick Sale
            </Link>
            <Link
              href="/admin/customers"
              className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold py-4 px-4 rounded-lg text-center transition"
            >
              👥 Customers
            </Link>
            <Link
              href="/admin/suppliers"
              className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold py-4 px-4 rounded-lg text-center transition"
            >
              🏭 Suppliers
            </Link>
            <Link
              href="/admin/purchase-orders"
              className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-semibold py-4 px-4 rounded-lg text-center transition"
            >
              📦 Purchase Orders
            </Link>
            <Link
              href="/admin/grn"
              className="bg-lime-50 hover:bg-lime-100 text-lime-700 font-semibold py-4 px-4 rounded-lg text-center transition"
            >
              ✅ Goods Receipt
            </Link>
            <Link
              href="/admin/purchase-invoices"
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-4 px-4 rounded-lg text-center transition"
            >
              📄 Purchase Invoices
            </Link>
            <Link
              href="/admin/invoices"
              className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold py-4 px-4 rounded-lg text-center transition"
            >
              🧾 Sales Invoices
            </Link>
            <Link
              href="/admin/vouchers"
              className="bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-4 px-4 rounded-lg text-center transition"
            >
              📝 Vouchers
            </Link>
            <Link
              href="/admin/reports"
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold py-4 px-4 rounded-lg text-center transition"
            >
              📈 Reports
            </Link>
            <Link
              href="/admin/accounts"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-4 px-4 rounded-lg text-center transition"
            >
              📊 Chart of Accounts
            </Link>
            <Link
              href="/admin/roles"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-4 px-4 rounded-lg text-center transition"
            >
              🔐 Roles & Permissions
            </Link>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p className="font-medium">📊 Analytics Dashboard Active!</p>
          <p className="text-sm mt-1">
            View real-time charts and analytics for revenue, expenses, sales, and top customers/suppliers.
          </p>
        </div>
      </main>
    </div>
  );
}
