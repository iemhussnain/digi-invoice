'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CustomerSelect } from '@/components/ui/SearchableSelect';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { ProvinceSelect, DocumentTypeSelect, TransactionTypeSelect, UOMSelect } from '@/components/fbr/FBRDropdowns';
import { NTNInput } from '@/components/fbr/CustomerNTNValidator';
import { TaxRateSelector } from '@/components/fbr/TaxRateSelector';
import { HSCodeSearch } from '@/components/fbr/HSCodeSearch';
import { showSuccess, showError } from '@/utils/toast';

export default function NewFBRInvoicePage() {
  const router = useRouter();
  const [customerOption, setCustomerOption] = useState(null);
  const createInvoice = useCreateInvoice();

  const [formData, setFormData] = useState({
    customerId: '',
    customerNTN: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    terms: '',
    referenceNumber: '',
    shippingCharges: 0,
    otherCharges: 0,
    // FBR Fields
    fbrProvinceCode: null,
    fbrDocumentTypeId: null,
    fbrTransactionTypeId: null,
    fbrTaxRateId: null,
  });

  const [items, setItems] = useState([
    {
      description: '',
      hsCode: '',
      quantity: 1,
      uomId: null,
      rate: 0,
      taxRate: 18,
      discountRate: 0,
    },
  ]);

  const [customerValidation, setCustomerValidation] = useState(null);
  const [selectedTaxRate, setSelectedTaxRate] = useState(null);

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
    setItems([
      ...items,
      {
        description: '',
        hsCode: '',
        quantity: 1,
        uomId: null,
        rate: 0,
        taxRate: selectedTaxRate?.ratE_VALUE || 18,
        discountRate: 0,
      },
    ]);
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
    const totalAmount =
      taxableAmount + totalTax + parseFloat(formData.shippingCharges || 0) + parseFloat(formData.otherCharges || 0);

    return { subtotal, totalDiscount, taxableAmount, totalTax, totalAmount };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate customer NTN
    if (!customerValidation?.isRegistered) {
      showError('Customer must be registered with FBR');
      return;
    }

    if (!customerValidation?.isActive) {
      const proceed = confirm(
        'Customer registration is inactive with FBR. Do you want to proceed anyway?'
      );
      if (!proceed) return;
    }

    const invoiceData = {
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
      shippingCharges: parseFloat(formData.shippingCharges || 0),
      otherCharges: parseFloat(formData.otherCharges || 0),
      // FBR Validation Data
      fbrValidation: customerValidation,
    };

    createInvoice.mutate(invoiceData, {
      onSuccess: () => {
        showSuccess('Invoice created successfully with FBR compliance');
        router.push('/admin/invoices');
      },
      onError: (error) => {
        showError(error.message || 'Failed to create invoice');
      },
    });
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                New FBR Compliant Invoice
              </h1>
              <p className="text-gray-600 mt-2">
                Create a new sales invoice with FBR Digital Invoicing integration
              </p>
            </div>
            <Link
              href="/admin/invoices"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Invoices
            </Link>
          </div>
        </div>

        {createInvoice.isError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">
              {createInvoice.error?.message || 'Failed to create invoice'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer *
                </label>
                <CustomerSelect
                  value={customerOption}
                  onChange={(selectedOption) => {
                    setCustomerOption(selectedOption);
                    setFormData((prev) => ({
                      ...prev,
                      customerId: selectedOption?.value || '',
                    }));
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference #
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* FBR Information */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📋 FBR Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer NTN *
                </label>
                <NTNInput
                  value={formData.customerNTN}
                  onChange={(value) => setFormData((prev) => ({ ...prev, customerNTN: value }))}
                  onValidation={setCustomerValidation}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province *
                </label>
                <ProvinceSelect
                  value={formData.fbrProvinceCode}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, fbrProvinceCode: value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <DocumentTypeSelect
                  value={formData.fbrDocumentTypeId}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, fbrDocumentTypeId: value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type *
                </label>
                <TransactionTypeSelect
                  value={formData.fbrTransactionTypeId}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, fbrTransactionTypeId: value }))
                  }
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Tax Rate *
                </label>
                <TaxRateSelector
                  date={formData.invoiceDate}
                  transactionTypeId={formData.fbrTransactionTypeId}
                  provinceId={formData.fbrProvinceCode}
                  value={formData.fbrTaxRateId}
                  onChange={(rateId, rateData) => {
                    setFormData((prev) => ({ ...prev, fbrTaxRateId: rateId }));
                    setSelectedTaxRate(rateData);
                    // Update all item tax rates
                    if (rateData) {
                      setItems((prevItems) =>
                        prevItems.map((item) => ({
                          ...item,
                          taxRate: rateData.ratE_VALUE,
                        }))
                      );
                    }
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Line Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Description *
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      HS Code
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Qty *
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      UOM
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Rate *
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Disc %
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                      Tax %
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                      Amount
                    </th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const amount = item.quantity * item.rate;
                    const discount = (amount * (item.discountRate || 0)) / 100;
                    const taxable = amount - discount;
                    const tax = (taxable * (item.taxRate || 0)) / 100;
                    const netAmount = taxable + tax;

                    return (
                      <tr key={index}>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(index, 'description', e.target.value)
                            }
                            required
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <HSCodeSearch
                            value={item.hsCode}
                            onChange={(code) => handleItemChange(index, 'hsCode', code)}
                            onSelect={(hsItem) => {
                              handleItemChange(index, 'hsCode', hsItem.hS_CODE);
                              if (!item.description) {
                                handleItemChange(index, 'description', hsItem.description);
                              }
                            }}
                            placeholder="Search..."
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            required
                            min="0.01"
                            step="0.01"
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <UOMSelect
                            value={item.uomId}
                            onChange={(value) => handleItemChange(index, 'uomId', value)}
                            className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            className="w-24 px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.discountRate}
                            onChange={(e) =>
                              handleItemChange(index, 'discountRate', e.target.value)
                            }
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-16 px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-16 px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(netAmount)}
                        </td>
                        <td className="px-4 py-2">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Additional Charges</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Charges
                    </label>
                    <input
                      type="number"
                      name="shippingCharges"
                      value={formData.shippingCharges}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Charges
                    </label>
                    <input
                      type="number"
                      name="otherCharges"
                      value={formData.otherCharges}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Invoice Summary</h3>
                <div className="space-y-2">
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxable Amount:</span>
                    <span className="font-medium">{formatCurrency(totals.taxableAmount)}</span>
                  </div>
                  {totals.totalTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">{formatCurrency(totals.totalTax)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">{formatCurrency(totals.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  name="terms"
                  value={formData.terms}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/admin/invoices"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createInvoice.isPending}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {createInvoice.isPending ? 'Creating...' : 'Create FBR Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
