'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ViewPurchaseInvoicePage({ params }) {
  const router = useRouter();
  const { id } = params;

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase-invoices/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invoice');
      }

      setInvoice(data.data.purchaseInvoice);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle verify (3-way matching)
  const handleVerify = async () => {
    if (!confirm('Perform 3-way matching verification for this invoice?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const response = await fetch(`/api/purchase-invoices/${id}/verify`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify invoice');
      }

      const result = data.data.matchingResult;
      if (result.isMatched) {
        alert('✓ Invoice verified successfully - all items matched!');
      } else {
        alert(
          `⚠ Invoice verified with mismatches:\n` +
            `- Matching Status: ${result.matchingStatus}\n` +
            `- Quantity Variance: ${result.quantityVariance}\n` +
            `Please review before approval.`
        );
      }

      fetchInvoice();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle approve
  const handleApprove = async () => {
    if (!confirm('Approve this purchase invoice?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const response = await fetch(`/api/purchase-invoices/${id}/approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve invoice');
      }

      alert('Purchase invoice approved successfully');
      fetchInvoice();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle post to accounts
  const handlePost = async () => {
    if (
      !confirm(
        'Post this invoice to accounts?\n\nThis will:\n- Create a Journal Voucher\n- Update supplier balance\n- Cannot be undone'
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const response = await fetch(`/api/purchase-invoices/${id}/post`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post invoice');
      }

      alert(
        `Invoice posted successfully!\n\nVoucher: ${data.data.voucher.voucherNumber}\nAmount: Rs. ${data.data.voucher.totalDebit.toLocaleString()}`
      );
      fetchInvoice();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge
  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      verified: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      posted: 'bg-purple-100 text-purple-800',
      paid: 'bg-teal-100 text-teal-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded ${badges[status] || badges.draft}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  // Matching status badge
  const getMatchingBadge = (matchingStatus) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      matched: 'bg-green-100 text-green-800',
      mismatched: 'bg-red-100 text-red-800',
      approved: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded ${badges[matchingStatus] || badges.pending}`}
      >
        {matchingStatus?.toUpperCase()}
      </span>
    );
  };

  // Get matching indicator for item
  const getItemMatchingIndicator = (item) => {
    const qtyVariance = Math.abs(item.invoiceQuantity - item.grnQuantity);

    if (qtyVariance <= 0.01) {
      return (
        <div className="text-green-600 text-xs font-medium">
          ✓ Matched
        </div>
      );
    } else {
      return (
        <div className="text-red-600 text-xs font-medium">
          ⚠ Variance: {qtyVariance.toFixed(2)} {item.unit}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Invoice not found'}
          </div>
          <Link
            href="/admin/purchase-invoices"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            ← Back to Purchase Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Invoice</h1>
            <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
          </div>
          <div className="flex gap-2">
            {invoice.status === 'draft' && (
              <button
                onClick={handleVerify}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Verify (3-Way Matching)
              </button>
            )}
            {invoice.status === 'verified' && (
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
            )}
            {invoice.status === 'approved' && !invoice.isPosted && (
              <button
                onClick={handlePost}
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Post to Accounts
              </button>
            )}
            <Link
              href="/admin/purchase-invoices"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div>{getStatusBadge(invoice.status)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Matching Status</div>
            <div>{getMatchingBadge(invoice.matchingStatus)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Total Amount</div>
            <div className="text-xl font-bold text-gray-900">
              Rs. {invoice.totalAmount?.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Balance Due</div>
            <div className="text-xl font-bold text-red-600">
              Rs. {invoice.balanceAmount?.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Invoice Date</div>
              <div className="font-medium">
                {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
              </div>
            </div>
            {invoice.dueDate && (
              <div>
                <div className="text-sm text-gray-600">Due Date</div>
                <div className="font-medium">
                  {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Supplier</div>
              <div className="font-medium">{invoice.supplierId?.companyName}</div>
              <div className="text-xs text-gray-500">{invoice.supplierId?.supplierCode}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Purchase Order</div>
              <div className="font-medium">{invoice.purchaseOrderId?.poNumber}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Goods Receipt Note</div>
              <div className="font-medium">{invoice.grnId?.grnNumber}</div>
            </div>
            {invoice.voucherId && (
              <div>
                <div className="text-sm text-gray-600">Voucher</div>
                <Link
                  href={`/admin/vouchers/${invoice.voucherId._id}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  {invoice.voucherId.voucherNumber}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 3-Way Matching Summary */}
        {invoice.status !== 'draft' && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">3-Way Matching Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-600 mb-1">Quantity Variance</div>
                <div className="text-2xl font-bold text-gray-900">
                  {invoice.quantityVariance?.toFixed(2) || 0}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-600 mb-1">Amount Variance</div>
                <div className="text-2xl font-bold text-gray-900">
                  Rs. {invoice.amountVariance?.toLocaleString() || 0}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-600 mb-1">Verified By</div>
                <div className="font-medium">
                  {invoice.matchedBy?.name || 'N/A'}
                </div>
                {invoice.matchedAt && (
                  <div className="text-xs text-gray-500">
                    {format(new Date(invoice.matchedAt), 'dd MMM yyyy HH:mm')}
                  </div>
                )}
              </div>
            </div>
            {invoice.matchingRemarks && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-1">Matching Remarks</div>
                <div className="bg-yellow-50 p-3 rounded text-sm">{invoice.matchingRemarks}</div>
              </div>
            )}
          </div>
        )}

        {/* Invoice Items */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    PO Qty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    GRN Qty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Invoice Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Tax
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Net Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Match
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{item.description}</div>
                      <div className="text-gray-500 text-xs">{item.unit}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {item.poQuantity}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">
                      {item.grnQuantity}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">
                      {item.invoiceQuantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      Rs. {item.rate?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      Rs. {item.amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600">
                      {item.discountAmount > 0 && `- Rs. ${item.discountAmount.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {item.taxAmount > 0 && `Rs. ${item.taxAmount.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      Rs. {item.netAmount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">{getItemMatchingIndicator(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Invoice Summary</h2>
          <div className="max-w-md ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">Rs. {invoice.subtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-red-600">
                - Rs. {invoice.totalDiscount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxable Amount:</span>
              <span className="font-medium">Rs. {invoice.taxableAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">Rs. {invoice.totalTax?.toLocaleString()}</span>
            </div>
            {invoice.shippingCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">Rs. {invoice.shippingCharges?.toLocaleString()}</span>
              </div>
            )}
            {invoice.otherCharges !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Other Charges:</span>
                <span className="font-medium">Rs. {invoice.otherCharges?.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-blue-600">
                  Rs. {invoice.totalAmount?.toLocaleString()}
                </span>
              </div>
            </div>
            {invoice.paidAmount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-medium text-green-600">
                    Rs. {invoice.paidAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Balance Due:</span>
                  <span className="text-red-600">
                    Rs. {invoice.balanceAmount?.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {(invoice.notes || invoice.internalNotes) && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoice.notes && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Notes</div>
                  <div className="bg-gray-50 p-3 rounded text-sm">{invoice.notes}</div>
                </div>
              )}
              {invoice.internalNotes && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Internal Notes</div>
                  <div className="bg-yellow-50 p-3 rounded text-sm">{invoice.internalNotes}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit Trail */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Audit Trail</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Created By:</span>
              <span className="font-medium">{invoice.createdBy?.name}</span>
            </div>
            {invoice.approvedBy && (
              <div className="flex justify-between">
                <span className="text-gray-600">Approved By:</span>
                <span className="font-medium">
                  {invoice.approvedBy.name} on{' '}
                  {format(new Date(invoice.approvedAt), 'dd MMM yyyy HH:mm')}
                </span>
              </div>
            )}
            {invoice.postedBy && (
              <div className="flex justify-between">
                <span className="text-gray-600">Posted By:</span>
                <span className="font-medium">
                  {invoice.postedBy.name} on{' '}
                  {format(new Date(invoice.postedAt), 'dd MMM yyyy HH:mm')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
