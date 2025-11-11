'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default function GRNPage() {
  const router = useRouter();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [inspectionStatus, setInspectionStatus] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Create from PO modal
  const [poModal, setPoModal] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  useEffect(() => {
    fetchGRNs();
  }, [pagination.page, search, status, inspectionStatus]);

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(inspectionStatus && { inspectionStatus }),
      });

      const response = await fetch(`/api/grn?${params}`);
      const data = await response.json();

      if (data.success) {
        setGrns(data.data.grns);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch GRNs');
      }
    } catch (err) {
      setError('Failed to fetch GRNs');
      console.error('Error fetching GRNs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      // Fetch POs that can have GRNs created (sent/confirmed/partially_received)
      const response = await fetch('/api/purchase-orders?limit=1000');
      const data = await response.json();
      if (data.success) {
        // Filter POs that are not draft or cancelled and have pending items
        const validPOs = data.data.purchaseOrders.filter(
          (po) =>
            po.status !== 'draft' &&
            po.status !== 'cancelled' &&
            po.status !== 'received'
        );
        setPurchaseOrders(validPOs);
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
    }
  };

  const handleOpenPOModal = () => {
    fetchPurchaseOrders();
    setPoModal(true);
  };

  const handleCreateFromPO = (poId) => {
    router.push(`/admin/grn/from-po/${poId}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this GRN?')) {
      return;
    }

    try {
      const response = await fetch(`/api/grn/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchGRNs();
      } else {
        alert(data.message || 'Failed to delete GRN');
      }
    } catch (err) {
      alert('Failed to delete GRN');
      console.error('Error deleting GRN:', err);
    }
  };

  const getStatusBadge = (statusValue) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      inspected: 'bg-blue-100 text-blue-800',
      posted: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
      draft: 'Draft',
      inspected: 'Inspected',
      posted: 'Posted',
      cancelled: 'Cancelled',
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          statusColors[statusValue] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {statusLabels[statusValue] || statusValue}
      </span>
    );
  };

  const getInspectionBadge = (inspectionStatusValue) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };

    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          colors[inspectionStatusValue] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {labels[inspectionStatusValue] || inspectionStatusValue}
      </span>
    );
  };

  if (loading && grns.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Goods Receipt Notes</h1>
          <p className="text-gray-600 mt-1">Receive goods from purchase orders with quality inspection</p>
        </div>
        <button
          onClick={handleOpenPOModal}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Receive from PO
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); fetchGRNs(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="GRN number, delivery note..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="inspected">Inspected</option>
                <option value="posted">Posted</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inspection Status
              </label>
              <select
                value={inspectionStatus}
                onChange={(e) => {
                  setInspectionStatus(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatus('');
                setInspectionStatus('');
                setPagination({ ...pagination, page: 1 });
              }}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* GRN Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GRN Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acceptance Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No goods receipt notes found. Click &quot;Receive from PO&quot; to create one.
                  </td>
                </tr>
              ) : (
                grns.map((grn) => (
                  <tr key={grn._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/grn/${grn._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {grn.grnNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(grn.grnDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/purchase-orders/${grn.purchaseOrderId?._id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {grn.purchaseOrderId?.poNumber || 'N/A'}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {grn.supplierId?.companyName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {grn.supplierId?.supplierCode || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(grn.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getInspectionBadge(grn.inspectionStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {grn.acceptanceRate !== undefined ? `${grn.acceptanceRate}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/grn/${grn._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        {grn.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(grn._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} GRNs
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total GRNs</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {pagination.total}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Pending Inspection</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {grns.filter((g) => g.inspectionStatus === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Inspected</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {grns.filter((g) => g.status === 'inspected').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Posted</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {grns.filter((g) => g.status === 'posted').length}
          </div>
        </div>
      </div>

      {/* Select PO Modal */}
      {poModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Purchase Order
            </h3>
            {purchaseOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No purchase orders available for receiving goods.
              </p>
            ) : (
              <div className="space-y-2">
                {purchaseOrders.map((po) => (
                  <button
                    key={po._id}
                    onClick={() => handleCreateFromPO(po._id)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{po.poNumber}</div>
                        <div className="text-sm text-gray-600">
                          {po.supplierId?.companyName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Date: {format(new Date(po.poDate), 'dd/MM/yyyy')}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            po.status === 'sent'
                              ? 'bg-blue-100 text-blue-800'
                              : po.status === 'confirmed'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {po.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPoModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
