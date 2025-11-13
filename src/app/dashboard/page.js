'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import RevenueExpenseChart from '@/components/charts/RevenueExpenseChart';
import SalesAnalyticsChart from '@/components/charts/SalesAnalyticsChart';
import MonthlyComparisonChart from '@/components/charts/MonthlyComparisonChart';
import TopCustomersChart from '@/components/charts/TopCustomersChart';
import TopSuppliersChart from '@/components/charts/TopSuppliersChart';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';
import AnimatedCard from '@/components/motion/AnimatedCard';
import AnimatedButton from '@/components/motion/AnimatedButton';
import { fadeInUp, listContainerVariants, listItemVariants } from '@/utils/animations';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden mr-3 p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
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
          </div>
          <AnimatedButton
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Logout
          </AnimatedButton>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-[73px] left-0 h-[calc(100vh-73px)] bg-white shadow-lg z-40
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            w-64 overflow-y-auto
          `}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">⚡ Quick Actions</h3>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded hover:bg-gray-100"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2">
              <Link
                href="/admin/sales"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-2 border-emerald-300 text-emerald-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">💵</span>
                <span className="text-sm">Quick Sale</span>
              </Link>
              <Link
                href="/admin/customers"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">👥</span>
                <span className="text-sm">Customers</span>
              </Link>
              <Link
                href="/admin/suppliers"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 text-amber-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">🏭</span>
                <span className="text-sm">Suppliers</span>
              </Link>
              <Link
                href="/admin/purchase-orders"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 text-cyan-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">📦</span>
                <span className="text-sm">Purchase Orders</span>
              </Link>
              <Link
                href="/admin/grn"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-lime-50 to-lime-100 hover:from-lime-100 hover:to-lime-200 text-lime-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">✅</span>
                <span className="text-sm">Goods Receipt</span>
              </Link>
              <Link
                href="/admin/purchase-invoices"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-rose-50 to-rose-100 hover:from-rose-100 hover:to-rose-200 text-rose-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">📄</span>
                <span className="text-sm">Purchase Invoices</span>
              </Link>
              <Link
                href="/admin/invoices"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 text-teal-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">🧾</span>
                <span className="text-sm">Sales Invoices</span>
              </Link>
              <Link
                href="/admin/invoices/fbr-new"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-100 hover:from-blue-100 hover:via-blue-200 hover:to-indigo-200 border-2 border-blue-300 text-blue-700 font-semibold transition-all duration-200 hover:scale-105 shadow-md"
              >
                <span className="text-2xl mr-3">📋</span>
                <div className="flex flex-col">
                  <span className="text-sm">FBR Digital Invoice</span>
                  <span className="text-xs text-blue-600 font-normal">Federal Board of Revenue</span>
                </div>
              </Link>
              <Link
                href="/admin/stock-management"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">📦</span>
                <span className="text-sm">Stock Management</span>
              </Link>
              <Link
                href="/admin/vouchers"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">📝</span>
                <span className="text-sm">Vouchers</span>
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">📈</span>
                <span className="text-sm">Reports</span>
              </Link>
              <Link
                href="/admin/accounts"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">📊</span>
                <span className="text-sm">Accounts</span>
              </Link>
              <Link
                href="/admin/roles"
                className="flex items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl mr-3">🔐</span>
                <span className="text-sm">Roles</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 lg:ml-0">
        {/* Welcome Card - Compact */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeInUp}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-4 mb-6 text-white"
        >
          <h2 className="text-xl font-bold mb-1">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-blue-100 text-sm">
            {organization?.name} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={listContainerVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          <motion.div variants={listItemVariants} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">12</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div variants={listItemVariants} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Invoices</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">245</p>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div variants={listItemVariants} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">89</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div variants={listItemVariants} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
              </div>
              <div className="rounded-lg bg-orange-100 p-3">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Analytics Charts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">📊 Analytics Overview</h2>
            <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
              Real-time data
            </span>
          </div>

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

        {/* User Info - Compact Cards at Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex items-center mb-3">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Your Profile</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="text-gray-900 font-medium">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-900 font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Role:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user?.role}
                </span>
              </div>
              {user?.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="text-gray-900 font-medium">{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {organization && (
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-3">
                <div className="bg-green-100 rounded-full p-2 mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">Organization</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Company:</span>
                  <span className="text-gray-900 font-medium">{organization.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {organization.subscription?.plan}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {organization.subscription?.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
