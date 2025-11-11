'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import CustomerFormExample from '@/components/examples/CustomerFormExample';
import CustomersTableExample from '@/components/examples/CustomersTableExample';
import ZustandExample from '@/components/examples/ZustandExample';
import FlowbiteExample from '@/components/examples/FlowbiteExample';
import { useState } from 'react';

/**
 * Library Examples Page
 * Demonstrates the new libraries with improved UI/UX
 */
export default function LibraryExamplesPage() {
  const [activeTab, setActiveTab] = useState('table');

  const breadcrumbs = [
    { label: 'Administration', href: '/dashboard' },
    { label: 'Library Examples' },
  ];

  const tabs = [
    { id: 'table', label: 'Data Table', icon: '📊', color: 'blue' },
    { id: 'form', label: 'Form Validation', icon: '📝', color: 'green' },
    { id: 'zustand', label: 'State Management', icon: '🔄', color: 'purple' },
    { id: 'flowbite', label: 'UI Components', icon: '🎨', color: 'pink' },
  ];

  const libraries = [
    {
      name: 'React Hook Form + Zod',
      icon: '📝',
      description: 'Form validation without manual useState for every field',
      color: 'from-green-500 to-emerald-600',
      features: ['Schema validation', 'Type-safe', 'Minimal re-renders'],
    },
    {
      name: 'TanStack Query',
      icon: '🔄',
      description: 'Automatic caching and background refetching for APIs',
      color: 'from-blue-500 to-cyan-600',
      features: ['Auto caching', 'Refetching', 'Optimistic updates'],
    },
    {
      name: 'TanStack Table',
      icon: '📊',
      description: 'Sorting, filtering, and pagination built-in',
      color: 'from-purple-500 to-pink-600',
      features: ['Headless UI', 'Sorting', 'Pagination'],
    },
    {
      name: 'Zustand',
      icon: '💾',
      description: 'Global state management without props drilling',
      color: 'from-orange-500 to-red-600',
      features: ['Minimal API', 'localStorage', 'No boilerplate'],
    },
    {
      name: 'Flowbite React',
      icon: '🎨',
      description: 'Pre-built Tailwind components with accessibility',
      color: 'from-pink-500 to-rose-600',
      features: ['Ready-to-use', 'Accessible', 'Tailwind-based'],
    },
  ];

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      {/* Hero Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-3">🎨 Library Examples</h1>
          <p className="text-blue-100 text-lg max-w-3xl">
            Explore modern React libraries that make development faster, cleaner, and more maintainable.
            Interactive examples with live code demonstrations.
          </p>
        </div>
      </div>

      {/* Library Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {libraries.map((lib, index) => (
          <div
            key={lib.name}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`h-2 bg-gradient-to-r ${lib.color}`} />
            <div className="p-6">
              <div className={`w-12 h-12 bg-gradient-to-br ${lib.color} rounded-lg flex items-center justify-center text-2xl mb-4 shadow-md`}>
                {lib.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{lib.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{lib.description}</p>
              <div className="space-y-1">
                {lib.features.map((feature) => (
                  <div key={feature} className="flex items-center text-xs text-gray-500">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Examples Section */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Modern Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-1 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content with Smooth Transitions */}
        <div className="p-6 lg:p-8 min-h-[600px]">
          <div className="animate-fadeIn">
            {activeTab === 'table' && <CustomersTableExample />}
            {activeTab === 'form' && <CustomerFormExample />}
            {activeTab === 'zustand' && <ZustandExample />}
            {activeTab === 'flowbite' && <FlowbiteExample />}
          </div>
        </div>
      </div>

      {/* Quick Reference Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Installation */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">📦</span>
            Quick Installation
          </h3>
          <pre className="bg-black bg-opacity-50 rounded-lg p-4 overflow-x-auto text-sm">
            <code className="text-green-400">npm install react-hook-form zod @hookform/resolvers @tanstack/react-query @tanstack/react-table zustand flowbite flowbite-react react-icons</code>
          </pre>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border border-blue-100">
          <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
            <span className="mr-2">✨</span>
            Key Benefits
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-0.5">✓</span>
              <span><strong>90% less code</strong> for forms and tables</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-0.5">✓</span>
              <span><strong>Automatic caching</strong> reduces API calls by 80%</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-0.5">✓</span>
              <span><strong>Type-safe validation</strong> catches bugs early</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 mt-0.5">✓</span>
              <span><strong>Better performance</strong> with minimal re-renders</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-3">Ready to Refactor?</h3>
        <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
          Start migrating your existing components to use these libraries. Begin with forms, then move to tables, and finally implement global state management.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://react-hook-form.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md"
          >
            📖 View Documentation
          </a>
          <a
            href="https://github.com/iemhussnain/digi-invoice"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors shadow-md"
          >
            💻 See Full Code
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </AdminLayout>
  );
}
