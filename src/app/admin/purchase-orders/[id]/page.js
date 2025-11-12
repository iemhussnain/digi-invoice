'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditPurchaseOrderPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [po, setPo] = useState(null);

  const [formData, setFormData] = useState({
    poNumber: '',
    poDate: '',
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
    status: 'draft',
    deliveryStreet: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryPostalCode: '',
    deliveryCountry: 'Pakistan',
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchSuppliers();
    fetchPurchaseOrder();
  }, [id]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers?limit=1000&isActive=true');
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data.suppliers);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase-orders/${id}`);
      const data = await response.json();

      if (data.success) {
        const purchaseOrder = data.data.purchaseOrder;
        setPo(purchaseOrder);

        setFormData({
          poNumber: purchaseOrder.poNumber || '',
          poDate: purchaseOrder.poDate?.split('T')[0] || '',
          supplierId: purchaseOrder.supplierId?._id || '',
          deliveryDate: purchaseOrder.deliveryDate?.split('T')[0] || '',
          paymentTerms: purchaseOrder.paymentTerms || 'credit',
          taxType: purchaseOrder.taxType || 'inclusive',
          taxRate: purchaseOrder.taxRate || 18,
          shippingCharges: purchaseOrder.shippingCharges || 0,
          otherCharges: purchaseOrder.otherCharges || 0,
          notes: purchaseOrder.notes || '',
          internalNotes: purchaseOrder.internalNotes || '',
          terms: purchaseOrder.terms || '',
          status: purchaseOrder.status || 'draft',
          deliveryStreet: purchaseOrder.deliveryAddress?.street || '',
          deliveryCity: purchaseOrder.deliveryAddress?.city || '',
          deliveryState: purchaseOrder.deliveryAddress?.state || '',
          deliveryPostalCode: purchaseOrder.deliveryAddress?.postalCode || '',
          deliveryCountry: purchaseOrder.deliveryAddress?.country || 'Pakistan',
        });

        setItems(
          purchaseOrder.items.map((item) => ({
            description: item.description || '',
            quantity: item.quantity || 1,
            unit: item.unit || 'pcs',
            rate: item.rate || 0,
            taxRate: item.taxRate || 0,
            discountRate: item.discountRate || 0,
          }))
        );
      } else {
        setError(data.message || 'Failed to fetch purchase order');
      }
    } catch (err) {
      setError('Failed to fetch purchase order');
      console.error('Error fetching purchase order:', err);
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);
    setError('');
    setErrors({});

    try {
      const deliveryAddress = {
        street: formData.deliveryStreet,
        city: formData.deliveryCity,
        state: formData.deliveryState,
        postalCode: formData.deliveryPostalCode,
        country: formData.deliveryCountry,
      };

      const poData = {
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

      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(poData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/purchase-orders');
      } else {
        if (data.data?.errors) {
          setErrors(data.data.errors);
        }
        setError(data.message || 'Failed to update purchase order');
      }
    } catch (err) {
      setError('Failed to update purchase order');
      console.error('Error updating purchase order:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isEditable = formData.status === 'draft' || formData.status === 'sent';
  const totals = calculateTotals();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/admin/purchase-orders" className="hover:text-blue-600">
            Purchase Orders
          </Link>
          <span>/</span>
          <span>{formData.poNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Purchase Order
          </h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              formData.status === 'draft'
                ? 'bg-gray-100 text-gray-800'
                : formData.status === 'sent'
                ? 'bg-blue-100 text-blue-800'
                : formData.status === 'confirmed'
                ? 'bg-purple-100 text-purple-800'
                : formData.status === 'received'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {formData.status}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {!isEditable && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
          This purchase order cannot be edited in its current status.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information - Similar structure to new page */}
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
                    value={formData.poNumber}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
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
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    required
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.companyName} ({supplier.supplierCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    disabled={!isEditable}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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

            {/* Items - Reuse same structure */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                {isEditable && (
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    + Add Item
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 relative"
                  >
                    {items.length > 1 && isEditable && (
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
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(index, 'description', e.target.value)
                          }
                          disabled={!isEditable}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', e.target.value)
                          }
                          disabled={!isEditable}
                          min="0.01"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                          disabled={!isEditable}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rate (PKR)
                        </label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(index, 'rate', e.target.value)
                          }
                          disabled={!isEditable}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                          disabled={!isEditable}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                          disabled={!isEditable}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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

            {/* Additional charges and notes sections similar to new page */}
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
                    disabled={!isEditable}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                    disabled={!isEditable}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

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
                    disabled={!isEditable}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                    disabled={!isEditable}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {isEditable && (
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <Link
                  href="/admin/purchase-orders"
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </Link>
              </div>
            )}
          </form>
        </div>

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
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">PKR {totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-lg text-blue-600">
                  PKR {totals.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
