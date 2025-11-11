'use client';

import CustomerFormExample from '@/components/examples/CustomerFormExample';
import CustomersTableExample from '@/components/examples/CustomersTableExample';
import { useState } from 'react';

/**
 * Library Examples Page
 * Demonstrates the new libraries:
 * - React Hook Form + Zod for forms
 * - TanStack Query for API data management
 * - TanStack Table for data tables
 */
export default function LibraryExamplesPage() {
  const [activeTab, setActiveTab] = useState('table');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Library Examples</h1>
          <p className="mt-2 text-gray-600">
            Demonstration of React Hook Form, Zod, TanStack Query, and TanStack Table
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">React Hook Form + Zod</h3>
            <p className="text-sm text-gray-600">
              Form validation without manual useState for every field. Schema-based validation with Zod.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">TanStack Query</h3>
            <p className="text-sm text-gray-600">
              Automatic caching, background refetching, and optimistic updates for all API calls.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">TanStack Table</h3>
            <p className="text-sm text-gray-600">
              Sorting, filtering, and pagination built-in. Headless UI for complete control.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('table')}
                className={`${
                  activeTab === 'table'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Data Table Example
              </button>
              <button
                onClick={() => setActiveTab('form')}
                className={`${
                  activeTab === 'form'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Form Example
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'table' && <CustomersTableExample />}
            {activeTab === 'form' && <CustomerFormExample />}
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Implementation Guide</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Install Libraries</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                <code>npm install react-hook-form zod @hookform/resolvers @tanstack/react-query @tanstack/react-table</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Setup Query Provider</h3>
              <p className="text-sm text-gray-600 mb-2">
                Wrap your app with QueryProvider in <code className="bg-gray-100 px-1 rounded">src/app/layout.js</code>
              </p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                <code>{`import QueryProvider from "@/providers/QueryProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Create Form with Zod Schema</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                <code>{`import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Fetch Data with TanStack Query</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                <code>{`import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['customers'],
  queryFn: () => apiGet('/customers'),
  staleTime: 5 * 60 * 1000, // 5 minutes
});`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Create Table with TanStack Table</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                <code>{`import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data: customers,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Benefits Comparison */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Before vs After</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">❌ Before (Manual)</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• useState for every form field</li>
                <li>• Manual validation logic scattered everywhere</li>
                <li>• useEffect + fetch for every API call</li>
                <li>• Manual loading state management</li>
                <li>• No caching - repeated API calls</li>
                <li>• Stale data issues</li>
                <li>• Plain HTML tables with no features</li>
                <li>• Manual sorting/filtering implementation</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">✅ After (Libraries)</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Single useForm hook for all fields</li>
                <li>• Centralized Zod schemas for validation</li>
                <li>• useQuery for automatic caching</li>
                <li>• Built-in loading/error states</li>
                <li>• Automatic background refetching</li>
                <li>• Fresh data on window focus</li>
                <li>• Feature-rich tables out of the box</li>
                <li>• Built-in sorting, filtering, pagination</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Next Steps</h2>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
            <li>Review the example components in <code className="bg-blue-100 px-1 rounded">src/components/examples/</code></li>
            <li>Refactor existing forms to use React Hook Form + Zod</li>
            <li>Refactor existing tables to use TanStack Table</li>
            <li>Replace manual fetch calls with TanStack Query hooks</li>
            <li>Enjoy cleaner, more maintainable code!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
