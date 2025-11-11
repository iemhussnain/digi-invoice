'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ViewGRNPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grn, setGrn] = useState(null);

  useEffect(() => {
    fetchGRN();
  }, [id]);

  const fetchGRN = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/grn/${id}`);
      const data = await response.json();

      if (data.success) {
        setGrn(data.data.grn);
      } else {
        setError(data.message || 'Failed to fetch GRN');
      }
    } catch (err) {
      setError('Failed to fetch GRN');
      console.error('Error fetching GRN:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      inspected: 'bg-blue-100 text-blue-800',
      posted: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getInspectionBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      passed: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800',
    };

    const labels = {
      pending: 'Pending',
      passed: 'Passed',
      partial: 'Partial',
      failed: 'Failed',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error || 'GRN not found'}
        </div>
        <Link href="/admin/grn" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          ← Back to GRN List
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/admin/grn" className="hover:text-blue-600">
            Goods Receipt Notes
          </Link>
          <span>/</span>
          <span>{grn.grnNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{grn.grnNumber}</h1>
            <p className="text-gray-600 mt-1">
              Created on {format(new Date(grn.grnDate), 'dd/MM/yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(grn.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* PO & Supplier Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Purchase Order:</span>
                <div className="font-medium mt-1">
                  <Link
                    href={`/admin/purchase-orders/${grn.purchaseOrderId?._id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {grn.purchaseOrderId?.poNumber}
                  </Link>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Supplier:</span>
                <div className="font-medium mt-1">{grn.supplierId?.companyName}</div>
                <div className="text-gray-500">{grn.supplierId?.supplierCode}</div>
              </div>
              <div>
                <span className="text-gray-600">Delivery Note:</span>
                <div className="font-medium mt-1">{grn.deliveryNote || '-'}</div>
              </div>
              <div>
                <span className="text-gray-600">Vehicle:</span>
                <div className="font-medium mt-1">{grn.vehicleNumber || '-'}</div>
              </div>
              {grn.inspectedBy && (
                <>
                  <div>
                    <span className="text-gray-600">Inspected By:</span>
                    <div className="font-medium mt-1">{grn.inspectedBy?.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Inspection Date:</span>
                    <div className="font-medium mt-1">
                      {grn.inspectionDate && format(new Date(grn.inspectionDate), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Items & Inspection Results */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Items & Inspection Results
            </h2>
            <div className="space-y-4">
              {grn.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.description}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        Unit: {item.unit} | Rate: PKR {item.rate}
                      </div>
                    </div>
                    {getInspectionBadge(item.inspectionStatus)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-600">Ordered</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {item.orderedQuantity}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-xs text-gray-600">Received</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {item.receivedQuantity}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-xs text-gray-600">Accepted</div>
                      <div className="text-lg font-semibold text-green-600">
                        {item.acceptedQuantity}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-xs text-gray-600">Rejected</div>
                      <div className="text-lg font-semibold text-red-600">
                        {item.rejectedQuantity}
                      </div>
                    </div>
                  </div>

                  {item.qualityGrade && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Quality Grade: </span>
                      <span className="text-sm font-medium">{item.qualityGrade}</span>
                    </div>
                  )}

                  {item.inspectionRemarks && (
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Inspection Remarks: </span>
                      <span className="text-sm text-gray-900">{item.inspectionRemarks}</span>
                    </div>
                  )}

                  {item.rejectedQuantity > 0 && item.rejectionReason && (
                    <div className="mb-2 p-2 bg-red-50 rounded">
                      <span className="text-sm text-red-700 font-medium">Rejection Reason: </span>
                      <span className="text-sm text-red-900">{item.rejectionReason}</span>
                    </div>
                  )}

                  {(item.storageLocation || item.batchNumber) && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {item.storageLocation && (
                        <div>
                          <span className="text-gray-600">Storage: </span>
                          <span className="text-gray-900">{item.storageLocation}</span>
                        </div>
                      )}
                      {item.batchNumber && (
                        <div>
                          <span className="text-gray-600">Batch: </span>
                          <span className="text-gray-900">{item.batchNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {(grn.notes || grn.internalNotes || grn.inspectionRemarks) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <div className="space-y-3">
                {grn.notes && (
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Notes:</div>
                    <div className="text-sm text-gray-900 mt-1">{grn.notes}</div>
                  </div>
                )}
                {grn.inspectionRemarks && (
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Inspection Remarks:</div>
                    <div className="text-sm text-gray-900 mt-1">{grn.inspectionRemarks}</div>
                  </div>
                )}
                {grn.internalNotes && (
                  <div>
                    <div className="text-sm text-gray-600 font-medium">Internal Notes:</div>
                    <div className="text-sm text-gray-900 mt-1">{grn.internalNotes}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Inspection Status</div>
                  <div className="text-lg font-semibold text-blue-600 mt-1 capitalize">
                    {grn.inspectionStatus?.replace('_', ' ')}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Accepted</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    {grn.totalAcceptedQuantity || 0}
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Rejected</div>
                  <div className="text-2xl font-bold text-red-600 mt-1">
                    {grn.totalRejectedQuantity || 0}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600">Acceptance Rate</div>
                  <div className="text-2xl font-bold text-purple-600 mt-1">
                    {grn.acceptanceRate || 0}%
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 space-y-2">
                <div>
                  <span className="font-medium">Created By:</span>
                  <div>{grn.createdBy?.name}</div>
                </div>
                <div>
                  <span className="font-medium">Created At:</span>
                  <div>{format(new Date(grn.createdAt), 'dd/MM/yyyy HH:mm')}</div>
                </div>
              </div>
            </div>

            <Link
              href="/admin/grn"
              className="block w-full text-center bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Back to List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
