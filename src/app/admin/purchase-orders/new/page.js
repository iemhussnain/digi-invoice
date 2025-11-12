'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SupplierSelect } from '@/components/ui/SearchableSelect';
import { useCreatePurchaseOrder } from '@/hooks/usePurchaseOrders';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [supplierOption, setSupplierOption] = useState(null);
  const createPurchaseOrder = useCreatePurchaseOrder();

  const [formData, setFormData] = useState({
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    deliveryDate: '',
    paymentTerms: 'credit',
    taxType: 'inclusive',
    taxRate: 18,
    shippingCharges: 0,
    otherCharges: 0,
    notes: '',
    internalNotes: '',
    terms: '',
    // Delivery address
    deliveryStreet: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryPostalCode: '',
    deliveryCountry: 'Pakistan',
  });

  const [items, setItems] = useState([
    {
      description: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      taxRate: 18,
      discountRate: 0,
    },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
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
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        taxRate: 18,
        discountRate: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const calculateItemTotal = (item) => {
    const amount = parseFloat(item.quantity || 0) * parseFloat(item.rate || 0);
    const discountAmount = (amount * parseFloat(item.discountRate || 0)) / 100;
    const amountAfterDiscount = amount - discountAmount;
    const taxAmount = (amountAfterDiscount * parseFloat(item.taxRate || 0)) / 100;
    return amountAfterDiscount + taxAmount;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach((item) => {
      const amount = parseFloat(item.quantity || 0) * parseFloat(item.rate || 0);
      const discountAmount = (amount * parseFloat(item.discountRate || 0)) / 100;
      const amountAfterDiscount = amount - discountAmount;
      const taxAmount = (amountAfterDiscount * parseFloat(item.taxRate || 0)) / 100;

      subtotal += amount;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    const taxableAmount = subtotal - totalDiscount;
    const shippingCharges = parseFloat(formData.shippingCharges || 0);
    const otherCharges = parseFloat(formData.otherCharges || 0);
    const totalAmount = taxableAmount + totalTax + shippingCharges + otherCharges;

    return {
      subtotal,
      totalDiscount,
      taxableAmount,
      totalTax,
      totalAmount,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Build delivery address
    const deliveryAddress = {
      street: formData.deliveryStreet,
      city: formData.deliveryCity,
      state: formData.deliveryState,
      postalCode: formData.deliveryPostalCode,
      country: formData.deliveryCountry,
    };

    // Build PO data
    const poData = {
      poNumber: formData.poNumber || undefined,
      poDate: formData.poDate,
      supplierId: formData.supplierId,
      deliveryDate: formData.deliveryDate || undefined,
      paymentTerms: formData.paymentTerms,
      taxType: formData.taxType,
      taxRate: parseFloat(formData.taxRate) || 0,
      shippingCharges: parseFloat(formData.shippingCharges) || 0,
      otherCharges: parseFloat(formData.otherCharges) || 0,
      notes: formData.notes,
      internalNotes: formData.internalNotes,
      terms: formData.terms,
      deliveryAddress,
      items: items.map((item) => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        rate: parseFloat(item.rate),
        taxRate: parseFloat(item.taxRate) || 0,
        discountRate: parseFloat(item.discountRate) || 0,
      })),
    };

    createPurchaseOrder.mutate(poData, {
      onSuccess: () => {
        router.push('/admin/purchase-orders');
      },
      onError: (error) => {
        // Handle validation errors from API
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        }
      },
    });
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/admin/purchase-orders" className="hover:text-blue-600">
            Purchase Orders
          </Link>
          <span>/</span>
          <span>New Purchase Order</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">New Purchase Order</h1>
      </div>

      {/* Error Message */}
      {createPurchaseOrder.isError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {createPurchaseOrder.error?.message || 'Failed to create purchase order'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Number
                  </label>
                  <input
                    type="text"
                    name="poNumber"
                    value={formData.poNumber}
                    onChange={handleChange}
                    placeholder="Auto-generated"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="poDate"
                    value={formData.poDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <SupplierSelect
                    value={supplierOption}
                    onChange={(selectedOption) => {
                      setSupplierOption(selectedOption);
                      setFormData({
                        ...formData,
                        supplierId: selectedOption?.value || '',
                      });
                      if (errors.supplierId) {
                        setErrors({ ...errors, supplierId: null });
                      }
                    }}
                    error={!!errors.supplierId}
                  />
                  {errors.supplierId && (
                    <p className="text-red-600 text-sm mt-1">{errors.supplierId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="advance">Advance</option>
                    <option value="cash_on_delivery">Cash on Delivery</option>
                    <option value="credit">Credit</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_60">Net 60</option>
                    <option value="net_90">Net 90</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 relative"
                  >
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(index, 'description', e.target.value)
                          }
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', e.target.value)
                          }
                          required
                          min="0.01"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) =>
                            handleItemChange(index, 'unit', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rate (PKR) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(index, 'rate', e.target.value)
                          }
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) =>
                            handleItemChange(index, 'taxRate', e.target.value)
                          }
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          value={item.discountRate}
                          onChange={(e) =>
                            handleItemChange(index, 'discountRate', e.target.value)
                          }
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Total
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 font-medium">
                          PKR {calculateItemTotal(item).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Charges */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Charges
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Charges (PKR)
                  </label>
                  <input
                    type="number"
                    name="shippingCharges"
                    value={formData.shippingCharges}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Charges (PKR)
                  </label>
                  <input
                    type="number"
                    name="otherCharges"
                    value={formData.otherCharges}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Delivery Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="deliveryStreet"
                    value={formData.deliveryStreet}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="deliveryCity"
                    value={formData.deliveryCity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="deliveryState"
                    value={formData.deliveryState}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="deliveryPostalCode"
                    value={formData.deliveryPostalCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="deliveryCountry"
                    value={formData.deliveryCountry}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Notes & Terms
              </h2>
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
                    maxLength="1000"
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
                    maxLength="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    name="terms"
                    value={formData.terms}
                    onChange={handleChange}
                    rows="4"
                    maxLength="2000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createPurchaseOrder.isPending}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPurchaseOrder.isPending ? 'Creating...' : 'Create Purchase Order'}
              </button>
              <Link
                href="/admin/purchase-orders"
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">PKR {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">
                  - PKR {totals.totalDiscount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxable Amount:</span>
                <span className="font-medium">
                  PKR {totals.taxableAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">PKR {totals.totalTax.toFixed(2)}</span>
              </div>
              {parseFloat(formData.shippingCharges) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">
                    PKR {parseFloat(formData.shippingCharges).toFixed(2)}
                  </span>
                </div>
              )}
              {parseFloat(formData.otherCharges) !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Other Charges:</span>
                  <span className="font-medium">
                    PKR {parseFloat(formData.otherCharges).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-lg text-blue-600">
                  PKR {totals.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Purchase order will be created in draft status.
                You can send it to the supplier after review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
