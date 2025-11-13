'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { useFBRProvinces } from '@/hooks/useFBRProvinces';

export default function EditCustomerPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [errors, setErrors] = useState({});

  const { data: customerData, isLoading, isError, error } = useCustomer(id);
  const updateCustomer = useUpdateCustomer();
  const { data: provinces = [], isLoading: provincesLoading } = useFBRProvinces('production');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    customerType: 'individual',
    category: '',

    // Contact Person
    contactPersonName: '',
    contactPersonDesignation: '',
    contactPersonPhone: '',
    contactPersonEmail: '',

    // Billing Address
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: 'Pakistan',

    // Shipping Address
    shippingSameAsBilling: true,
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: 'Pakistan',

    // Tax Info
    ntn: '',
    strn: '',
    cnic: '',
    gstRegistered: false,

    // Financial
    creditLimit: 0,
    creditDays: 0,
    openingBalance: 0,
    paymentTerms: 'cash',
    paymentMethod: 'cash',

    // Other
    notes: '',
    isActive: true,
  });

  // Populate form when customer data loads
  useEffect(() => {
    if (customerData?.customer) {
      const customer = customerData.customer;
      setFormData({
        name: customer.name || '',
        companyName: customer.companyName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        mobile: customer.mobile || '',
        website: customer.website || '',
        customerType: customer.customerType || 'individual',
        category: customer.category || '',

        contactPersonName: customer.contactPerson?.name || '',
        contactPersonDesignation: customer.contactPerson?.designation || '',
        contactPersonPhone: customer.contactPerson?.phone || '',
        contactPersonEmail: customer.contactPerson?.email || '',

        billingStreet: customer.billingAddress?.street || '',
        billingCity: customer.billingAddress?.city || '',
        billingState: customer.billingAddress?.state || '',
        billingPostalCode: customer.billingAddress?.postalCode || '',
        billingCountry: customer.billingAddress?.country || 'Pakistan',

        shippingSameAsBilling: customer.shippingAddress?.sameAsBilling ?? true,
        shippingStreet: customer.shippingAddress?.street || '',
        shippingCity: customer.shippingAddress?.city || '',
        shippingState: customer.shippingAddress?.state || '',
        shippingPostalCode: customer.shippingAddress?.postalCode || '',
        shippingCountry: customer.shippingAddress?.country || 'Pakistan',

        ntn: customer.ntn || '',
        strn: customer.strn || '',
        cnic: customer.cnic || '',
        gstRegistered: customer.gstRegistered || false,

        creditLimit: customer.creditLimit || 0,
        creditDays: customer.creditDays || 0,
        openingBalance: customer.openingBalance || 0,
        paymentTerms: customer.paymentTerms || 'cash',
        paymentMethod: customer.paymentMethod || 'cash',

        notes: customer.notes || '',
        isActive: customer.isActive ?? true,
      });
    }
  }, [customerData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Prepare data
    const customerDataToUpdate = {
      name: formData.name,
      companyName: formData.companyName || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      mobile: formData.mobile || undefined,
      website: formData.website || undefined,
      customerType: formData.customerType,
      category: formData.category || undefined,

      contactPerson: {
        name: formData.contactPersonName || undefined,
        designation: formData.contactPersonDesignation || undefined,
        phone: formData.contactPersonPhone || undefined,
        email: formData.contactPersonEmail || undefined,
      },

      billingAddress: {
        street: formData.billingStreet || undefined,
        city: formData.billingCity || undefined,
        state: formData.billingState || undefined,
        postalCode: formData.billingPostalCode || undefined,
        country: formData.billingCountry,
      },

      shippingAddress: {
        sameAsBilling: formData.shippingSameAsBilling,
        street: formData.shippingSameAsBilling ? undefined : formData.shippingStreet,
        city: formData.shippingSameAsBilling ? undefined : formData.shippingCity,
        state: formData.shippingSameAsBilling ? undefined : formData.shippingState,
        postalCode: formData.shippingSameAsBilling ? undefined : formData.shippingPostalCode,
        country: formData.shippingSameAsBilling ? undefined : formData.shippingCountry,
      },

      ntn: formData.ntn || undefined,
      strn: formData.strn || undefined,
      cnic: formData.cnic || undefined,
      gstRegistered: formData.gstRegistered,

      creditLimit: parseFloat(formData.creditLimit) || 0,
      creditDays: parseInt(formData.creditDays) || 0,
      paymentTerms: formData.paymentTerms,
      paymentMethod: formData.paymentMethod,

      notes: formData.notes || undefined,
      isActive: formData.isActive,
    };

    updateCustomer.mutate(
      { customerId: id, customerData: customerDataToUpdate },
      {
        onSuccess: () => {
          router.push('/admin/customers');
        },
        onError: (error) => {
          // Handle validation errors from API
          if (error.response?.error?.errors) {
            setErrors(error.response.error.errors);
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading customer...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">
              {error?.message || 'Failed to load customer'}
            </p>
          </div>
          <Link
            href="/admin/customers"
            className="inline-block mt-4 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Customer</h1>
              <p className="text-gray-600 mt-2">Update customer information</p>
            </div>
            <Link
              href="/admin/customers"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Customers
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {updateCustomer.isError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">
              {updateCustomer.error?.message || 'Failed to update customer'}
            </p>
          </div>
        )}

        {/* Form (Same as New Customer) */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Type *
                </label>
                <select
                  name="customerType"
                  value={formData.customerType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="government">Government</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Wholesaler, Retailer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+92-XXX-XXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+92-3XX-XXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact Person - same fields as new customer */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Person</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  name="contactPersonDesignation"
                  value={formData.contactPersonDesignation}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  name="contactPersonPhone"
                  value={formData.contactPersonPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="contactPersonEmail"
                  value={formData.contactPersonEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Billing & Shipping Address - same as new customer but truncated for space */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                <input
                  type="text"
                  name="billingStreet"
                  value={formData.billingStreet}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="billingCity"
                  value={formData.billingCity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                <select
                  name="billingState"
                  value={formData.billingState}
                  onChange={handleChange}
                  disabled={provincesLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Select Province</option>
                  {provinces.map((province) => (
                    <option key={province.stateProvinceCode} value={province.stateProvinceName}>
                      {province.stateProvinceName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="billingPostalCode"
                  value={formData.billingPostalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  name="billingCountry"
                  value={formData.billingCountry}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tax & Financial Info (condensed) - same sections as new customer */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax & Financial</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">NTN</label>
                <input
                  type="text"
                  name="ntn"
                  value={formData.ntn}
                  onChange={handleChange}
                  placeholder="XXXXXXX-X"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">STRN</label>
                <input
                  type="text"
                  name="strn"
                  value={formData.strn}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Limit (PKR)
                </label>
                <input
                  type="number"
                  name="creditLimit"
                  value={formData.creditLimit}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Days
                </label>
                <input
                  type="number"
                  name="creditDays"
                  value={formData.creditDays}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                  <option value="advance">Advance</option>
                  <option value="cod">Cash on Delivery</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional information about the customer..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/admin/customers"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updateCustomer.isPending}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {updateCustomer.isPending ? 'Updating...' : 'Update Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
