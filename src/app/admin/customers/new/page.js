'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/schemas/business';
import { useCreateCustomer } from '@/hooks/useCustomers';

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      customerType: 'individual',
      category: '',
      contactPersonName: '',
      contactPersonDesignation: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
      billingStreet: '',
      billingCity: '',
      billingState: '',
      billingPostalCode: '',
      billingCountry: 'Pakistan',
      shippingSameAsBilling: true,
      shippingStreet: '',
      shippingCity: '',
      shippingState: '',
      shippingPostalCode: '',
      shippingCountry: 'Pakistan',
      ntn: '',
      strn: '',
      cnic: '',
      gstRegistered: false,
      creditLimit: 0,
      creditDays: 0,
      openingBalance: 0,
      paymentTerms: 'cash',
      paymentMethod: 'cash',
      notes: '',
      isActive: true,
    },
  });

  const shippingSameAsBilling = watch('shippingSameAsBilling');

  const onSubmit = (formData) => {
    // Prepare data
    const customerData = {
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
      openingBalance: parseFloat(formData.openingBalance) || 0,
      paymentTerms: formData.paymentTerms,
      paymentMethod: formData.paymentMethod,

      notes: formData.notes || undefined,
      isActive: formData.isActive,
    };

    createCustomer.mutate(customerData, {
      onSuccess: () => {
        router.push('/admin/customers');
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
              <p className="text-gray-600 mt-2">Create a new customer record</p>
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
        {createCustomer.isError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">
              {createCustomer.error?.message || 'Failed to create customer'}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  {...register('name')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  {...register('companyName')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Type *
                </label>
                <select
                  {...register('customerType')}
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
                  {...register('category')}
                  placeholder="e.g., Wholesaler, Retailer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="+92-XXX-XXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                <input
                  type="text"
                  {...register('mobile')}
                  placeholder="+92-3XX-XXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  {...register('website')}
                  placeholder="https://example.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.website ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>}
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Person</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  {...register('contactPersonName')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  {...register('contactPersonDesignation')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  {...register('contactPersonPhone')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  {...register('contactPersonEmail')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.contactPersonEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.contactPersonEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPersonEmail.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                <input
                  type="text"
                  {...register('billingStreet')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  {...register('billingCity')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  {...register('billingState')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  {...register('billingPostalCode')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                <input
                  type="text"
                  {...register('billingCountry')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.billingCountry ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.billingCountry && (
                  <p className="mt-1 text-sm text-red-600">{errors.billingCountry.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('shippingSameAsBilling')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Same as billing</span>
              </label>
            </div>

            {!shippingSameAsBilling && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                  <input
                    type="text"
                    {...register('shippingStreet')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    {...register('shippingCity')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    {...register('shippingState')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    {...register('shippingPostalCode')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    {...register('shippingCountry')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tax Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NTN (National Tax Number)
                </label>
                <input
                  type="text"
                  {...register('ntn')}
                  placeholder="XXXXXXX-X"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  STRN (Sales Tax Registration Number)
                </label>
                <input
                  type="text"
                  {...register('strn')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNIC (For Individuals)
                </label>
                <input
                  type="text"
                  {...register('cnic')}
                  placeholder="XXXXX-XXXXXXX-X"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  {...register('gstRegistered')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">GST Registered</label>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Limit (PKR)
                </label>
                <input
                  type="number"
                  {...register('creditLimit')}
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.creditLimit ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.creditLimit && (
                  <p className="mt-1 text-sm text-red-600">{errors.creditLimit.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Days
                </label>
                <input
                  type="number"
                  {...register('creditDays')}
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.creditDays ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.creditDays && (
                  <p className="mt-1 text-sm text-red-600">{errors.creditDays.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Balance (PKR)
                </label>
                <input
                  type="number"
                  {...register('openingBalance')}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <select
                  {...register('paymentTerms')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                  <option value="advance">Advance</option>
                  <option value="cod">Cash on Delivery</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  {...register('paymentMethod')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional information about the customer..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
            </div>
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
              disabled={createCustomer.isPending}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {createCustomer.isPending ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
