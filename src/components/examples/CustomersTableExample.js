'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { apiGet } from '@/lib/api';

/**
 * Example Customers Table using TanStack Table
 *
 * Benefits:
 * - Built-in sorting
 * - Built-in filtering
 * - Built-in pagination
 * - Headless (you control the UI)
 * - Performance optimized
 */
export default function CustomersTableExample() {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Fetch customers using TanStack Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiGet('/customers'),
    // Data will be cached and reused
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const customers = data?.data?.customers || [];

  // Define table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => (
          <a href={`mailto:${info.getValue()}`} className="text-blue-600 hover:text-blue-800">
            {info.getValue()}
          </a>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: (info) => info.getValue() || '-',
      },
      {
        accessorKey: 'ntn',
        header: 'NTN',
        cell: (info) => info.getValue() || '-',
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        cell: (info) => {
          const balance = info.getValue();
          return (
            <span className={balance > 0 ? 'text-green-600 font-semibold' : 'text-gray-900'}>
              Rs. {balance?.toLocaleString() || 0}
            </span>
          );
        },
      },
      {
        accessorKey: 'gstRegistered',
        header: 'GST',
        cell: (info) =>
          info.getValue() ? (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
              Registered
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
              Not Registered
            </span>
          ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex space-x-2">
            <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
            <button className="text-green-600 hover:text-green-800 text-sm">Edit</button>
            <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
          </div>
        ),
      },
    ],
    []
  );

  // Initialize table
  const table = useReactTable({
    data: customers,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Add Customer
        </button>
      </div>

      {/* Global Search */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search all columns..."
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
        />
        <span className="text-sm text-gray-600">
          Showing {table.getRowModel().rows.length} of {customers.length} customers
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      <span>
                        {header.column.getIsSorted() === 'asc' ? ' 🔼' :
                         header.column.getIsSorted() === 'desc' ? ' 🔽' : ''}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {'<<'}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {'<'}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {'>'}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {'>>'}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[10, 20, 30, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Benefits Callout */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
        <h3 className="text-sm font-semibold text-green-900 mb-2">
          Benefits of TanStack Table + TanStack Query:
        </h3>
        <ul className="text-xs text-green-800 space-y-1">
          <li>✓ Automatic data caching (no repeated API calls)</li>
          <li>✓ Built-in sorting (click column headers)</li>
          <li>✓ Global filtering (search all columns)</li>
          <li>✓ Pagination with page size selection</li>
          <li>✓ Headless UI (full control over styling)</li>
          <li>✓ Performance optimized for large datasets</li>
          <li>✓ Automatic refetching on window focus</li>
        </ul>
      </div>
    </div>
  );
}
