'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default function QuickSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdSale, setCreatedSale] = useState(null);
  const printRef = useRef(null);

  const [formData, setFormData] = useState({
    customerName: 'Walk-in Customer',
    customerPhone: '',
    customerEmail: '',
    paymentMethod: 'cash',
    paidAmount: 0,
    taxType: 'inclusive',
    taxRate: 18,
    notes: '',
  });

  const [items, setItems] = useState([
    { description: '', quantity: 1, unit: 'pcs', rate: 0, taxRate: 18, discountRate: 0 },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit: 'pcs', rate: 0, taxRate: 18, discountRate: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach((item) => {
      const amount = item.quantity * item.rate;
      const discount = (amount * (item.discountRate || 0)) / 100;
      const taxableAmount = amount - discount;
      const tax = (taxableAmount * (item.taxRate || 0)) / 100;

      subtotal += amount;
      totalDiscount += discount;
      totalTax += tax;
    });

    const taxableAmount = subtotal - totalDiscount;
    const totalAmount = taxableAmount + totalTax;

    return { subtotal, totalDiscount, taxableAmount, totalTax, totalAmount };
  };

  const totals = calculateTotals();
  const changeGiven = parseFloat(formData.paidAmount || 0) - totals.totalAmount;

  const handleSubmit = async (e, autoPost = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');

      const saleData = {
        ...formData,
        items: items.map((item) => ({
          ...item,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          taxRate: parseFloat(item.taxRate || 0),
          discountRate: parseFloat(item.discountRate || 0),
        })),
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        taxableAmount: totals.taxableAmount,
        totalTax: totals.totalTax,
        totalAmount: totals.totalAmount,
        paidAmount: parseFloat(formData.paidAmount || totals.totalAmount),
        taxRate: parseFloat(formData.taxRate || 0),
        saleDate: new Date().toISOString(),
      };

      // Create sale
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(saleData),
      });

      const data = await response.json();

      if (data.success) {
        const sale = data.data.sale;
        setCreatedSale(sale);
        setSuccess(true);

        // Auto-post if requested
        if (autoPost) {
          const postResponse = await fetch(`/api/sales/${sale._id}/post`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const postData = await postResponse.json();

          if (postData.success) {
            setCreatedSale(postData.data.sale);
          } else {
            setError('Sale created but posting failed: ' + postData.message);
          }
        }

        // Reset form
        setTimeout(() => {
          setSuccess(false);
          setCreatedSale(null);
          setFormData({
            customerName: 'Walk-in Customer',
            customerPhone: '',
            customerEmail: '',
            paymentMethod: 'cash',
            paidAmount: 0,
            taxType: 'inclusive',
            taxRate: 18,
            notes: '',
          });
          setItems([{ description: '', quantity: 1, unit: 'pcs', rate: 0, taxRate: 18, discountRate: 0 }]);
        }, 5000);
      } else {
        setError(data.message || 'Failed to create sale');
      }
    } catch (err) {
      setError('Failed to create sale. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quick Sale (Walk-in)</h1>
              <p className="text-gray-600 mt-2">Fast cash sales for walk-in customers</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {success && createdSale && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-green-900 font-bold text-lg">Sale Completed!</h3>
                <p className="text-green-700 mt-1">
                  Receipt #{createdSale.receiptNumber} - {formatCurrency(createdSale.totalAmount)}
                </p>
                {changeGiven > 0 && (
                  <p className="text-green-700 font-medium mt-2">
                    Change: {formatCurrency(changeGiven)}
                  </p>
                )}
              </div>
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
              >
                Print Receipt
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer (Optional)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          required
                          placeholder="Item description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                          min="0.01"
                          step="0.01"
                          placeholder="Qty"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          required
                          min="0"
                          step="0.01"
                          placeholder="Rate"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="Tax%"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="col-span-2 flex gap-2">
                        <span className="font-medium text-sm">
                          {formatCurrency(
                            item.quantity * item.rate * (1 + (item.taxRate || 0) / 100)
                          )}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-900 text-xl"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="mobile_wallet">Mobile Wallet</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Received
                    </label>
                    <input
                      type="number"
                      name="paidAmount"
                      value={formData.paidAmount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder={totals.totalAmount.toFixed(2)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 text-lg"
                >
                  {loading ? 'Processing...' : 'Complete Sale & Post'}
                </button>
              </div>
            </form>
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(totals.totalDiscount)}
                    </span>
                  </div>
                )}
                {totals.totalTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatCurrency(totals.totalTax)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(totals.totalAmount)}</span>
                </div>
                {parseFloat(formData.paidAmount || 0) > totals.totalAmount && (
                  <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                    <span className="text-green-600">Change:</span>
                    <span className="text-green-600">{formatCurrency(changeGiven)}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="text-sm text-gray-600 space-y-2">
                  <p>Items: {items.length}</p>
                  <p>Payment: {formData.paymentMethod}</p>
                  <p className="text-xs text-gray-500 mt-4">
                    This sale will be automatically posted to accounting upon completion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Receipt */}
      <div className="hidden">
        <div ref={printRef} className="p-8 max-w-sm mx-auto">
          {createdSale && (
            <div className="font-mono text-sm">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold">RECEIPT</h1>
                <p className="text-xs">Walk-in Sale</p>
              </div>
              <div className="border-t border-b border-black py-2 mb-4">
                <p>
                  <strong>Receipt #:</strong> {createdSale.receiptNumber}
                </p>
                <p>
                  <strong>Date:</strong> {format(new Date(createdSale.saleDate), 'dd/MM/yyyy HH:mm')}
                </p>
                <p>
                  <strong>Customer:</strong> {createdSale.customerName}
                </p>
              </div>
              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left">Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {createdSale.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">{item.rate.toFixed(2)}</td>
                      <td className="text-right">{item.netAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-black pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{createdSale.subtotal.toFixed(2)}</span>
                </div>
                {createdSale.totalTax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{createdSale.totalTax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-black pt-2">
                  <span>TOTAL:</span>
                  <span>PKR {createdSale.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid:</span>
                  <span>{createdSale.paidAmount.toFixed(2)}</span>
                </div>
                {createdSale.changeGiven > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>Change:</span>
                    <span>{createdSale.changeGiven.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="text-center mt-6 text-xs">
                <p>Thank you for your business!</p>
                <p>Payment Method: {createdSale.paymentMethod}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
