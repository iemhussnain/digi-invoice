'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CreateGRNFromPOPage({ params }) {
  const router = useRouter();
  const { poId } = params;
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [po, setPo] = useState(null);
  const [grn, setGrn] = useState(null);

  const [formData, setFormData] = useState({
    grnDate: new Date().toISOString().split('T')[0],
    deliveryNote: '',
    vehicleNumber: '',
    driverName: '',
    deliveredBy: '',
    notes: '',
    internalNotes: '',
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchPOAndCreateGRN();
  }, [poId]);

  const fetchPOAndCreateGRN = async () => {
    try {
      setLoading(true);

      // Create GRN from PO
      const response = await fetch(`/api/grn/from-po/${poId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        const createdGRN = data.data.grn;
        setGrn(createdGRN);
        setPo(createdGRN.purchaseOrderId);

        // Initialize items with GRN items
        setItems(
          createdGRN.items.map((item) => ({
            ...item,
            acceptedQuantity: item.receivedQuantity, // Default to all accepted
            rejectedQuantity: 0,
            inspectionRemarks: '',
            rejectionReason: '',
            qualityGrade: 'A',
            storageLocation: '',
            batchNumber: '',
            expiryDate: '',
          }))
        );
      } else {
        setError(data.message || 'Failed to create GRN from PO');
      }
    } catch (err) {
      setError('Failed to create GRN from PO');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-adjust rejected quantity when accepted quantity changes
    if (field === 'acceptedQuantity') {
      const accepted = parseFloat(value) || 0;
      const received = newItems[index].receivedQuantity;
      newItems[index].rejectedQuantity = Math.max(0, received - accepted);
    }

    // Auto-adjust accepted quantity when rejected quantity changes
    if (field === 'rejectedQuantity') {
      const rejected = parseFloat(value) || 0;
      const received = newItems[index].receivedQuantity;
      newItems[index].acceptedQuantity = Math.max(0, received - rejected);
    }

    setItems(newItems);
  };

  const handleCompleteInspection = async () => {
    setCreating(true);
    setError('');

    try {
      // First update the GRN with inspection details
      const updateResponse = await fetch(`/api/grn/${grn._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => ({
            poItemId: item.poItemId,
            description: item.description,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: item.receivedQuantity,
            acceptedQuantity: parseFloat(item.acceptedQuantity) || 0,
            rejectedQuantity: parseFloat(item.rejectedQuantity) || 0,
            unit: item.unit,
            rate: item.rate,
            inspectionRemarks: item.inspectionRemarks,
            rejectionReason: item.rejectionReason,
            qualityGrade: item.qualityGrade,
            storageLocation: item.storageLocation,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate || undefined,
          })),
        }),
      });

      const updateData = await updateResponse.json();

      if (!updateData.success) {
        setError(updateData.message || 'Failed to update GRN');
        return;
      }

      // Then complete inspection
      const inspectResponse = await fetch(`/api/grn/${grn._id}/inspect`, {
        method: 'POST',
      });

      const inspectData = await inspectResponse.json();

      if (inspectData.success) {
        router.push('/admin/grn');
      } else {
        setError(inspectData.message || 'Failed to complete inspection');
      }
    } catch (err) {
      setError('Failed to complete inspection');
      console.error('Error:', err);
    } finally {
      setCreating(false);
    }
  };

  const calculateTotalAccepted = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.acceptedQuantity) || 0), 0);
  };

  const calculateTotalRejected = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.rejectedQuantity) || 0), 0);
  };

  const calculateAcceptanceRate = () => {
    const totalReceived = items.reduce((sum, item) => sum + item.receivedQuantity, 0);
    const totalAccepted = calculateTotalAccepted();
    if (totalReceived === 0) return 0;
    return Math.round((totalAccepted / totalReceived) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !grn) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link
          href="/admin/grn"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
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
          <span>Receive from PO</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Goods Receipt & Quality Inspection
        </h1>
        <p className="text-gray-600 mt-1">GRN: {grn?.grnNumber} | PO: {po?.poNumber}</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* PO Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Order Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">PO Number:</span>
                <span className="ml-2 font-medium">{po?.poNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">PO Date:</span>
                <span className="ml-2 font-medium">
                  {po?.poDate && format(new Date(po.poDate), 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Supplier:</span>
                <span className="ml-2 font-medium">{grn?.supplierId?.companyName}</span>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GRN Date
                </label>
                <input
                  type="date"
                  name="grnDate"
                  value={formData.grnDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Note
                </label>
                <input
                  type="text"
                  name="deliveryNote"
                  value={formData.deliveryNote}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Quality Inspection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quality Inspection
            </h2>
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900">{item.description}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      Ordered: {item.orderedQuantity} {item.unit} |
                      Received: {item.receivedQuantity} {item.unit}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Accepted Qty <span className="text-green-600">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.acceptedQuantity}
                        onChange={(e) =>
                          handleItemChange(index, 'acceptedQuantity', e.target.value)
                        }
                        min="0"
                        max={item.receivedQuantity}
                        step="0.01"
                        className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rejected Qty <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        value={item.rejectedQuantity}
                        onChange={(e) =>
                          handleItemChange(index, 'rejectedQuantity', e.target.value)
                        }
                        min="0"
                        max={item.receivedQuantity}
                        step="0.01"
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quality Grade
                      </label>
                      <select
                        value={item.qualityGrade}
                        onChange={(e) =>
                          handleItemChange(index, 'qualityGrade', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Not Graded</option>
                        <option value="A">A - Excellent</option>
                        <option value="B">B - Good</option>
                        <option value="C">C - Average</option>
                        <option value="D">D - Below Average</option>
                        <option value="F">F - Failed</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inspection Remarks
                      </label>
                      <input
                        type="text"
                        value={item.inspectionRemarks}
                        onChange={(e) =>
                          handleItemChange(index, 'inspectionRemarks', e.target.value)
                        }
                        placeholder="General remarks about the item quality..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {item.rejectedQuantity > 0 && (
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-red-700 mb-1">
                          Rejection Reason
                        </label>
                        <input
                          type="text"
                          value={item.rejectionReason}
                          onChange={(e) =>
                            handleItemChange(index, 'rejectionReason', e.target.value)
                          }
                          placeholder="Why were items rejected?"
                          className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Storage Location
                      </label>
                      <input
                        type="text"
                        value={item.storageLocation}
                        onChange={(e) =>
                          handleItemChange(index, 'storageLocation', e.target.value)
                        }
                        placeholder="Warehouse location..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) =>
                          handleItemChange(index, 'batchNumber', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) =>
                          handleItemChange(index, 'expiryDate', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  name="internalNotes"
                  value={formData.internalNotes}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleCompleteInspection}
              disabled={creating}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {creating ? 'Completing...' : 'Complete Inspection'}
            </button>
            <Link
              href="/admin/grn"
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Inspection Summary
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Accepted</div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {calculateTotalAccepted()}
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Rejected</div>
                <div className="text-2xl font-bold text-red-600 mt-1">
                  {calculateTotalRejected()}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Acceptance Rate</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {calculateAcceptanceRate()}%
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Completing inspection will update the purchase
                  order with received quantities and mark this GRN as inspected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
