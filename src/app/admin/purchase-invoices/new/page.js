'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { showSuccess, showError } from '@/utils/toast';

export default function NewPurchaseInvoicePage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Select GRN, 2: Create Invoice
  const [grns, setGrns] = useState([]);
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Invoice form data
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: '',
    items: [],
    shippingCharges: 0,
    otherCharges: 0,
    notes: '',
    internalNotes: '',
  });

  // Fetch inspected GRNs (ready for invoicing)
  useEffect(() => {
    fetchGRNs();
  }, []);

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/grn?status=inspected');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch GRNs');
      }

      setGrns(data.data.grns);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle GRN selection
  const handleGrnSelect = async (grn) => {
    try {
      setLoading(true);
      setError('');

      // Fetch full GRN details with populated references
      const response = await fetch(`/api/grn/${grn._id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch GRN details');
      }

      const grnDetails = data.data.grn;
      setSelectedGrn(grnDetails);

      // Prepare invoice items from GRN items (only accepted items)
      const invoiceItems = grnDetails.items
        .filter((item) => item.acceptedQuantity > 0)
        .map((item) => ({
          grnItemId: item._id,
          poItemId: item.poItemId,
          description: item.description,
          poQuantity: item.orderedQuantity || 0,
          grnQuantity: item.acceptedQuantity,
          invoiceQuantity: item.acceptedQuantity, // Default to accepted quantity
          unit: item.unit,
          rate: item.rate,
          amount: 0,
          taxRate: 0,
          taxAmount: 0,
          discountRate: 0,
          discountAmount: 0,
          netAmount: 0,
        }));

      setFormData((prev) => ({
        ...prev,
        items: invoiceItems,
      }));

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = parseFloat(value) || 0;

    // Recalculate amounts
    const item = updatedItems[index];
    item.amount = item.invoiceQuantity * item.rate;

    // Calculate discount
    if (item.discountRate > 0) {
      item.discountAmount = (item.amount * item.discountRate) / 100;
    }

    const amountAfterDiscount = item.amount - item.discountAmount;

    // Calculate tax
    if (item.taxRate > 0) {
      item.taxAmount = (amountAfterDiscount * item.taxRate) / 100;
    }

    item.netAmount = amountAfterDiscount + item.taxAmount;

    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const totalDiscount = formData.items.reduce((sum, item) => sum + item.discountAmount, 0);
    const taxableAmount = subtotal - totalDiscount;
    const totalTax = formData.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount =
      taxableAmount +
      totalTax +
      parseFloat(formData.shippingCharges || 0) +
      parseFloat(formData.otherCharges || 0);

    return {
      subtotal,
      totalDiscount,
      taxableAmount,
      totalTax,
      totalAmount,
    };
  };

  const totals = calculateTotals();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        ...formData,
        purchaseOrderId: selectedGrn.purchaseOrderId._id,
        grnId: selectedGrn._id,
        supplierId: selectedGrn.supplierId._id,
      };

      const response = await fetch('/api/purchase-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create purchase invoice');
      }

      showSuccess('Purchase invoice created successfully');
      router.push(`/admin/purchase-invoices/${data.data.purchaseInvoice._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Get matching status indicator
  const getMatchingIndicator = (item) => {
    const variance = Math.abs(item.invoiceQuantity - item.grnQuantity);
    if (variance <= 0.01) {
      return <span className="text-green-600 text-xs">✓ Matched</span>;
    } else {
      return (
        <span className="text-red-600 text-xs">
          ⚠ Variance: {variance.toFixed(2)} {item.unit}
        </span>
      );
    }
  };

  if (step === 1) {
    // Step 1: Select GRN
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create Purchase Invoice</h1>
            <p className="text-gray-600 mt-1">Step 1: Select a Goods Receipt Note</p>
          </div>

          <div className="mb-4">
            <Link
              href="/admin/purchase-invoices"
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Purchase Invoices
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading GRNs...</p>
            </div>
          ) : grns.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-500">No inspected GRNs available for invoicing</p>
              <Link
                href="/admin/grn"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to GRNs
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      GRN #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      PO #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Items
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grns.map((grn) => (
                    <tr key={grn._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                        {grn.grnNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {format(new Date(grn.grnDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {grn.purchaseOrderId?.poNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {grn.supplierId?.companyName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">
                        {grn.items?.length || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleGrnSelect(grn)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Create Invoice Form
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Purchase Invoice</h1>
          <p className="text-gray-600 mt-1">Step 2: Enter Invoice Details</p>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setStep(1)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Change GRN
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* GRN & Supplier Info */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reference Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GRN Number</label>
                <input
                  type="text"
                  value={selectedGrn?.grnNumber}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                <input
                  type="text"
                  value={selectedGrn?.purchaseOrderId?.poNumber}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={selectedGrn?.supplierId?.companyName}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Invoice Items with 3-Way Matching */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Invoice Items (3-Way Matching)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                      PO Qty
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                      GRN Qty
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                      Invoice Qty
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                      Rate
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                      Discount %
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                      Tax %
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                      Net Amount
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm">
                        <div className="font-medium text-gray-900">{item.description}</div>
                        <div className="text-gray-500 text-xs">{item.unit}</div>
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-gray-600">
                        {item.poQuantity}
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-green-600 font-medium">
                        {item.grnQuantity}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.invoiceQuantity}
                          onChange={(e) =>
                            handleItemChange(index, 'invoiceQuantity', e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.discountRate}
                          onChange={(e) =>
                            handleItemChange(index, 'discountRate', e.target.value)
                          }
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                        Rs. {item.netAmount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">{getMatchingIndicator(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Charges & Totals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Additional Charges */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Charges</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Charges
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="shippingCharges"
                    value={formData.shippingCharges}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Charges
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="otherCharges"
                    value={formData.otherCharges}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">Rs. {totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">
                    - Rs. {totals.totalDiscount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxable Amount:</span>
                  <span className="font-medium">Rs. {totals.taxableAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">Rs. {totals.totalTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">
                    Rs. {parseFloat(formData.shippingCharges || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Other Charges:</span>
                  <span className="font-medium">
                    Rs. {parseFloat(formData.otherCharges || 0).toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">Rs. {totals.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  name="internalNotes"
                  value={formData.internalNotes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Link
              href="/admin/purchase-invoices"
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
