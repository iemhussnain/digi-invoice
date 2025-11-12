# FBR Integration Guide - Part 2

## 6. Form Implementation (React Hook Form + Zod)

### 6.1 Zod Validation Schemas

**File:** `src/schemas/fbrSchemas.js`

```javascript
import { z } from 'zod';

/**
 * FBR Configuration Schema
 */
export const fbrConfigurationSchema = z.object({
  sellerNTNCNIC: z.string()
    .min(7, 'NTN/CNIC must be at least 7 digits')
    .max(13, 'NTN/CNIC must not exceed 13 digits')
    .regex(/^\d+$/, 'NTN/CNIC must contain only digits'),

  sellerBusinessName: z.string()
    .min(3, 'Business name must be at least 3 characters')
    .max(255, 'Business name is too long'),

  sellerProvinceCode: z.string()
    .min(1, 'Province is required'),

  sellerProvinceName: z.string()
    .min(1, 'Province name is required'),

  sellerAddress: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address is too long'),

  businessActivity: z.enum([
    'Manufacturer',
    'Importer',
    'Distributor',
    'Wholesaler',
    'Retailer',
    'Exporter',
    'Service Provider',
    'Other'
  ]),

  sector: z.enum([
    'Steel',
    'FMCG',
    'Textile',
    'Telecom',
    'Petroleum',
    'Electricity',
    'Gas',
    'Services',
    'Automobile',
    'CNG',
    'Pharmaceuticals',
    'Retail',
    'Other'
  ]),

  sandboxToken: z.string().optional(),
  productionToken: z.string().optional(),
  tokenExpiryDate: z.date().optional(),

  environmentMode: z.enum(['sandbox', 'production']).default('sandbox'),
  defaultTaxRate: z.number().min(0).max(100).default(18),
  autoValidate: z.boolean().default(true)
});

/**
 * Invoice Item Schema
 */
export const invoiceItemSchema = z.object({
  itemSerialNumber: z.number().int().positive(),

  hsCode: z.string()
    .min(1, 'HS Code is required')
    .regex(/^\d{4}\.\d{4}$/, 'HS Code format: ####.####'),

  productDescription: z.string()
    .min(3, 'Product description required')
    .max(500, 'Description too long'),

  quantity: z.number().min(0).optional(),

  uom: z.string()
    .min(1, 'Unit of Measurement is required'),

  valueSalesExcludingST: z.number().min(0).default(0),
  fixedNotifiedValueOrRetailPrice: z.number().min(0).default(0),
  totalValues: z.number().min(0).default(0),

  rate: z.string().min(1, 'Tax rate is required'),
  salesTaxApplicable: z.number().min(0),
  salesTaxWithheldAtSource: z.number().min(0).default(0),
  furtherTax: z.number().min(0).default(0),
  extraTax: z.number().min(0).default(0),
  fedPayable: z.number().min(0).default(0),

  discount: z.number().min(0).default(0),

  saleType: z.string().min(1, 'Sale type is required'),
  sroScheduleNo: z.string().optional(),
  sroItemSerialNo: z.string().optional()
});

/**
 * FBR Invoice Schema
 */
export const fbrInvoiceSchema = z.object({
  invoiceType: z.enum(['Sale Invoice', 'Debit Note']),

  invoiceDate: z.date({
    required_error: 'Invoice date is required'
  }),

  internalInvoiceNumber: z.string().optional(),

  // Buyer Information
  buyerNTNCNIC: z.string().optional(),

  buyerBusinessName: z.string()
    .min(3, 'Buyer business name required'),

  buyerProvince: z.string()
    .min(1, 'Buyer province required'),

  buyerAddress: z.string()
    .min(5, 'Buyer address required'),

  buyerRegistrationType: z.enum(['Registered', 'Unregistered']),

  // Debit Note Reference
  referenceInvoiceNumber: z.string().optional(),

  // Items
  items: z.array(invoiceItemSchema)
    .min(1, 'At least one item is required')

}).refine((data) => {
  // If buyer is registered, NTN is required
  if (data.buyerRegistrationType === 'Registered' && !data.buyerNTNCNIC) {
    return false;
  }
  return true;
}, {
  message: 'Buyer NTN/CNIC is required for registered buyers',
  path: ['buyerNTNCNIC']
}).refine((data) => {
  // If invoice type is Debit Note, reference is required
  if (data.invoiceType === 'Debit Note' && !data.referenceInvoiceNumber) {
    return false;
  }
  return true;
}, {
  message: 'Reference invoice number is required for debit notes',
  path: ['referenceInvoiceNumber']
});
```

### 6.2 FBR Configuration Form Component

**File:** `src/components/fbr/FBRConfigurationForm.jsx`

```jsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbrConfigurationSchema } from '@/schemas/fbrSchemas';
import { useFBRConfiguration, useSaveFBRConfiguration } from '@/hooks/useFBRConfiguration';
import { useFBRProvinces } from '@/hooks/useFBRReferenceData';
import { Label, TextInput, Select, Textarea, Button, Checkbox } from 'flowbite-react';
import { useEffect } from 'react';

export default function FBRConfigurationForm() {
  const { data: config, isLoading } = useFBRConfiguration();
  const { data: provinces = [] } = useFBRProvinces();
  const saveMutation = useSaveFBRConfiguration();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(fbrConfigurationSchema),
    defaultValues: {
      environmentMode: 'sandbox',
      defaultTaxRate: 18,
      autoValidate: true
    }
  });

  // Populate form with existing data
  useEffect(() => {
    if (config) {
      reset(config);
    }
  }, [config, reset]);

  const onSubmit = (data) => {
    saveMutation.mutate(data);
  };

  const selectedProvince = watch('sellerProvinceCode');

  // Auto-populate province name when code changes
  useEffect(() => {
    if (selectedProvince) {
      const province = provinces.find(
        p => p.provinceCode.toString() === selectedProvince
      );
      if (province) {
        // You'd use setValue here in real implementation
      }
    }
  }, [selectedProvince, provinces]);

  if (isLoading) {
    return <div>Loading configuration...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seller NTN/CNIC */}
        <div>
          <Label htmlFor="sellerNTNCNIC">
            Seller NTN/CNIC <span className="text-red-500">*</span>
          </Label>
          <TextInput
            id="sellerNTNCNIC"
            type="text"
            placeholder="Enter 7 or 13 digit NTN/CNIC"
            {...register('sellerNTNCNIC')}
            color={errors.sellerNTNCNIC ? 'failure' : undefined}
            helperText={errors.sellerNTNCNIC?.message}
          />
        </div>

        {/* Business Name */}
        <div>
          <Label htmlFor="sellerBusinessName">
            Business Name <span className="text-red-500">*</span>
          </Label>
          <TextInput
            id="sellerBusinessName"
            type="text"
            placeholder="Your registered business name"
            {...register('sellerBusinessName')}
            color={errors.sellerBusinessName ? 'failure' : undefined}
            helperText={errors.sellerBusinessName?.message}
          />
        </div>

        {/* Province */}
        <div>
          <Label htmlFor="sellerProvinceCode">
            Province <span className="text-red-500">*</span>
          </Label>
          <Select
            id="sellerProvinceCode"
            {...register('sellerProvinceCode')}
            color={errors.sellerProvinceCode ? 'failure' : undefined}
          >
            <option value="">Select Province</option>
            {provinces.map((province) => (
              <option key={province.provinceCode} value={province.provinceCode}>
                {province.provinceName}
              </option>
            ))}
          </Select>
          {errors.sellerProvinceCode && (
            <p className="text-sm text-red-600 mt-1">
              {errors.sellerProvinceCode.message}
            </p>
          )}
        </div>

        {/* Business Activity */}
        <div>
          <Label htmlFor="businessActivity">
            Business Activity <span className="text-red-500">*</span>
          </Label>
          <Select
            id="businessActivity"
            {...register('businessActivity')}
            color={errors.businessActivity ? 'failure' : undefined}
          >
            <option value="">Select Business Activity</option>
            <option value="Manufacturer">Manufacturer</option>
            <option value="Importer">Importer</option>
            <option value="Distributor">Distributor</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Retailer">Retailer</option>
            <option value="Exporter">Exporter</option>
            <option value="Service Provider">Service Provider</option>
            <option value="Other">Other</option>
          </Select>
          {errors.businessActivity && (
            <p className="text-sm text-red-600 mt-1">
              {errors.businessActivity.message}
            </p>
          )}
        </div>

        {/* Sector */}
        <div>
          <Label htmlFor="sector">
            Sector <span className="text-red-500">*</span>
          </Label>
          <Select
            id="sector"
            {...register('sector')}
            color={errors.sector ? 'failure' : undefined}
          >
            <option value="">Select Sector</option>
            <option value="Steel">Steel</option>
            <option value="FMCG">FMCG</option>
            <option value="Textile">Textile</option>
            <option value="Telecom">Telecom</option>
            <option value="Petroleum">Petroleum</option>
            <option value="Electricity">Electricity</option>
            <option value="Gas">Gas</option>
            <option value="Services">Services</option>
            <option value="Automobile">Automobile</option>
            <option value="CNG">CNG</option>
            <option value="Pharmaceuticals">Pharmaceuticals</option>
            <option value="Retail">Retail</option>
            <option value="Other">Other</option>
          </Select>
          {errors.sector && (
            <p className="text-sm text-red-600 mt-1">
              {errors.sector.message}
            </p>
          )}
        </div>

        {/* Environment Mode */}
        <div>
          <Label htmlFor="environmentMode">Environment Mode</Label>
          <Select id="environmentMode" {...register('environmentMode')}>
            <option value="sandbox">Sandbox (Testing)</option>
            <option value="production">Production (Live)</option>
          </Select>
        </div>
      </div>

      {/* Address */}
      <div>
        <Label htmlFor="sellerAddress">
          Business Address <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="sellerAddress"
          rows={3}
          placeholder="Complete business address"
          {...register('sellerAddress')}
          color={errors.sellerAddress ? 'failure' : undefined}
          helperText={errors.sellerAddress?.message}
        />
      </div>

      {/* API Tokens */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">API Credentials</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sandbox Token */}
          <div>
            <Label htmlFor="sandboxToken">Sandbox Token</Label>
            <TextInput
              id="sandboxToken"
              type="password"
              placeholder="Enter sandbox token from FBR"
              {...register('sandboxToken')}
            />
            <p className="text-xs text-gray-500 mt-1">
              For testing purposes only
            </p>
          </div>

          {/* Production Token */}
          <div>
            <Label htmlFor="productionToken">Production Token</Label>
            <TextInput
              id="productionToken"
              type="password"
              placeholder="Enter production token from FBR"
              {...register('productionToken')}
            />
            <p className="text-xs text-gray-500 mt-1">
              For live invoice submissions
            </p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Preferences</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
            <TextInput
              id="defaultTaxRate"
              type="number"
              step="0.01"
              {...register('defaultTaxRate', { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center gap-2 pt-8">
            <Checkbox
              id="autoValidate"
              {...register('autoValidate')}
            />
            <Label htmlFor="autoValidate">
              Auto-validate invoices before submission
            </Label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          color="gray"
          onClick={() => reset()}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={saveMutation.isLoading}
        >
          {saveMutation.isLoading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </form>
  );
}
```

### 6.3 Invoice Creation Form

**File:** `src/components/fbr/InvoiceCreationForm.jsx`

```jsx
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbrInvoiceSchema } from '@/schemas/fbrSchemas';
import { useCreateFBRInvoice } from '@/hooks/useFBRInvoices';
import { useFBRProvinces, useFBRScenarios } from '@/hooks/useFBRReferenceData';
import { Label, TextInput, Select, Button } from 'flowbite-react';
import { useState } from 'react';
import InvoiceItemFields from './InvoiceItemFields';
import { HiPlus, HiTrash } from 'react-icons/hi';

export default function InvoiceCreationForm() {
  const createMutation = useCreateFBRInvoice();
  const { data: provinces = [] } = useFBRProvinces();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(fbrInvoiceSchema),
    defaultValues: {
      invoiceType: 'Sale Invoice',
      invoiceDate: new Date(),
      buyerRegistrationType: 'Registered',
      items: [{
        itemSerialNumber: 1,
        quantity: 1,
        valueSalesExcludingST: 0,
        salesTaxApplicable: 0
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const invoiceType = watch('invoiceType');
  const buyerRegistrationType = watch('buyerRegistrationType');

  const onSubmit = (data) => {
    console.log('Form data:', data);
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Invoice Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Invoice Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Invoice Type */}
          <div>
            <Label htmlFor="invoiceType">
              Invoice Type <span className="text-red-500">*</span>
            </Label>
            <Select
              id="invoiceType"
              {...register('invoiceType')}
            >
              <option value="Sale Invoice">Sale Invoice</option>
              <option value="Debit Note">Debit Note</option>
            </Select>
          </div>

          {/* Invoice Date */}
          <div>
            <Label htmlFor="invoiceDate">
              Invoice Date <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="invoiceDate"
              type="date"
              {...register('invoiceDate')}
              color={errors.invoiceDate ? 'failure' : undefined}
              helperText={errors.invoiceDate?.message}
            />
          </div>

          {/* Internal Invoice Number */}
          <div>
            <Label htmlFor="internalInvoiceNumber">
              Your Invoice # (Optional)
            </Label>
            <TextInput
              id="internalInvoiceNumber"
              type="text"
              placeholder="INV-2025-001"
              {...register('internalInvoiceNumber')}
            />
          </div>
        </div>

        {/* Reference Invoice (for Debit Notes) */}
        {invoiceType === 'Debit Note' && (
          <div className="mt-4">
            <Label htmlFor="referenceInvoiceNumber">
              Reference Invoice Number <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="referenceInvoiceNumber"
              type="text"
              placeholder="Enter FBR invoice number"
              {...register('referenceInvoiceNumber')}
              color={errors.referenceInvoiceNumber ? 'failure' : undefined}
              helperText={errors.referenceInvoiceNumber?.message}
            />
          </div>
        )}
      </div>

      {/* Buyer Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Buyer Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Registration Type */}
          <div className="md:col-span-2">
            <Label>Buyer Registration Type</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="Registered"
                  {...register('buyerRegistrationType')}
                />
                Registered
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="Unregistered"
                  {...register('buyerRegistrationType')}
                />
                Unregistered
              </label>
            </div>
          </div>

          {/* Buyer NTN/CNIC */}
          <div>
            <Label htmlFor="buyerNTNCNIC">
              Buyer NTN/CNIC
              {buyerRegistrationType === 'Registered' && (
                <span className="text-red-500">*</span>
              )}
            </Label>
            <TextInput
              id="buyerNTNCNIC"
              type="text"
              placeholder="7 or 13 digits"
              {...register('buyerNTNCNIC')}
              color={errors.buyerNTNCNIC ? 'failure' : undefined}
              helperText={errors.buyerNTNCNIC?.message}
            />
          </div>

          {/* Business Name */}
          <div>
            <Label htmlFor="buyerBusinessName">
              Business Name <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="buyerBusinessName"
              type="text"
              {...register('buyerBusinessName')}
              color={errors.buyerBusinessName ? 'failure' : undefined}
              helperText={errors.buyerBusinessName?.message}
            />
          </div>

          {/* Province */}
          <div>
            <Label htmlFor="buyerProvince">
              Province <span className="text-red-500">*</span>
            </Label>
            <Select
              id="buyerProvince"
              {...register('buyerProvince')}
              color={errors.buyerProvince ? 'failure' : undefined}
            >
              <option value="">Select Province</option>
              {provinces.map((province) => (
                <option key={province.provinceCode} value={province.provinceName}>
                  {province.provinceName}
                </option>
              ))}
            </Select>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="buyerAddress">
              Address <span className="text-red-500">*</span>
            </Label>
            <TextInput
              id="buyerAddress"
              type="text"
              {...register('buyerAddress')}
              color={errors.buyerAddress ? 'failure' : undefined}
              helperText={errors.buyerAddress?.message}
            />
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Invoice Items</h2>
          <Button
            type="button"
            size="sm"
            onClick={() => append({
              itemSerialNumber: fields.length + 1,
              quantity: 1,
              valueSalesExcludingST: 0,
              salesTaxApplicable: 0
            })}
          >
            <HiPlus className="mr-2 h-5 w-5" />
            Add Item
          </Button>
        </div>

        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Item #{index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    color="failure"
                    onClick={() => remove(index)}
                  >
                    <HiTrash className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <InvoiceItemFields
                control={control}
                register={register}
                index={index}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          color="gray"
        >
          Save as Draft
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isLoading}
        >
          {createMutation.isLoading ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
```

---

## 7. UI Components (Flowbite)

### 7.1 Invoice List Component

**File:** `src/components/fbr/InvoiceList.jsx`

```jsx
'use client';

import { useState } from 'react';
import { useFBRInvoices } from '@/hooks/useFBRInvoices';
import { Table, Badge, TextInput, Select, Pagination } from 'flowbite-react';
import { HiSearch, HiEye, HiDownload } from 'react-icons/hi';
import Link from 'next/link';
import { format } from 'date-fns';

export default function InvoiceList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useFBRInvoices({
    page,
    limit: 10,
    status,
    search
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'gray', label: 'Draft' },
      validated: { color: 'info', label: 'Validated' },
      registered: { color: 'success', label: 'Registered' },
      failed: { color: 'failure', label: 'Failed' }
    };

    const config = statusConfig[status] || statusConfig.draft;

    return <Badge color={config.color}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div>Loading invoices...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <TextInput
            icon={HiSearch}
            placeholder="Search by invoice number, buyer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="validated">Validated</option>
            <option value="registered">Registered</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <Table.Head>
            <Table.HeadCell>Invoice Date</Table.HeadCell>
            <Table.HeadCell>FBR Invoice #</Table.HeadCell>
            <Table.HeadCell>Buyer</Table.HeadCell>
            <Table.HeadCell>Amount</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
            <Table.HeadCell>Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {data?.data?.map((invoice) => (
              <Table.Row key={invoice._id}>
                <Table.Cell>
                  {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
                </Table.Cell>
                <Table.Cell className="font-medium">
                  {invoice.fbrInvoiceNumber || 'Not submitted'}
                </Table.Cell>
                <Table.Cell>{invoice.buyerBusinessName}</Table.Cell>
                <Table.Cell>
                  Rs. {invoice.totalAmount?.toLocaleString() || 0}
                </Table.Cell>
                <Table.Cell>
                  {getStatusBadge(invoice.submissionStatus)}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/fbr/invoices/${invoice._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      <HiEye className="h-5 w-5" />
                    </Link>
                    {invoice.fbrInvoiceNumber && (
                      <button className="text-green-600 hover:underline">
                        <HiDownload className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={data.pagination.pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 8. State Management (Zustand)

**File:** `src/stores/fbrStore.js`

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * FBR Store for client-side state
 */
export const useFBRStore = create(
  persist(
    (set, get) => ({
      // Current invoice draft
      currentInvoice: null,

      // Recently used buyers (for autocomplete)
      recentBuyers: [],

      // Invoice creation step
      currentStep: 1,

      // Actions
      setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),

      addRecentBuyer: (buyer) => set((state) => {
        const exists = state.recentBuyers.find(b => b.ntn === buyer.ntn);
        if (exists) return state;

        return {
          recentBuyers: [
            buyer,
            ...state.recentBuyers.slice(0, 9) // Keep last 10
          ]
        };
      }),

      setCurrentStep: (step) => set({ currentStep: step }),

      clearCurrentInvoice: () => set({ currentInvoice: null, currentStep: 1 }),

      // Get buyer by NTN from recent list
      getBuyerByNTN: (ntn) => {
        const state = get();
        return state.recentBuyers.find(b => b.ntn === ntn);
      }
    }),
    {
      name: 'fbr-storage',
      partialize: (state) => ({
        recentBuyers: state.recentBuyers
      })
    }
  )
);
```

---

## 9. PDF Generation

### 9.1 FBR Invoice PDF Component

**File:** `src/components/fbr/InvoicePDF.jsx`

```jsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '2 solid #000',
    paddingBottom: 10
  },
  logo: {
    width: 100,
    height: 100
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 5
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3
  },
  label: {
    width: '40%',
    fontWeight: 'bold'
  },
  value: {
    width: '60%'
  },
  table: {
    display: 'table',
    width: '100%',
    marginTop: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd'
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    padding: 5
  },
  tableCell: {
    padding: 5,
    flex: 1
  },
  qrSection: {
    marginTop: 20,
    alignItems: 'center'
  },
  qrCode: {
    width: 150,
    height: 150
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666'
  }
});

export default function InvoicePDF({ invoice }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>TAX INVOICE</Text>
            <Text>FBR Digital Invoicing System</Text>
          </View>
          <View>
            {invoice.qrCodeData && (
              <Image
                src={invoice.qrCodeData}
                style={styles.logo}
              />
            )}
          </View>
        </View>

        {/* FBR Invoice Number */}
        {invoice.fbrInvoiceNumber && (
          <View style={styles.section}>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
              FBR Invoice #: {invoice.fbrInvoiceNumber}
            </Text>
            <Text>
              Date: {format(new Date(invoice.fbrSubmissionDate), 'dd MMM yyyy, HH:mm')}
            </Text>
          </View>
        )}

        {/* Seller Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Business Name:</Text>
            <Text style={styles.value}>{invoice.sellerBusinessName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>NTN/CNIC:</Text>
            <Text style={styles.value}>{invoice.sellerNTNCNIC}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{invoice.sellerAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Province:</Text>
            <Text style={styles.value}>{invoice.sellerProvince}</Text>
          </View>
        </View>

        {/* Buyer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buyer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Business Name:</Text>
            <Text style={styles.value}>{invoice.buyerBusinessName}</Text>
          </View>
          {invoice.buyerNTNCNIC && (
            <View style={styles.row}>
              <Text style={styles.label}>NTN/CNIC:</Text>
              <Text style={styles.value}>{invoice.buyerNTNCNIC}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{invoice.buyerAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Province:</Text>
            <Text style={styles.value}>{invoice.buyerProvince}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{invoice.buyerRegistrationType}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Items</Text>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>#</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>Description</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>Qty</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>Rate</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Value</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Tax</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Total</Text>
            </View>

            {/* Table Rows */}
            {invoice.items?.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>
                  {item.itemSerialNumber}
                </Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {item.productDescription}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {item.rate}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {item.valueSalesExcludingST.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {item.salesTaxApplicable.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {(item.totalValues || 0).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This is a computer-generated invoice from FBR Digital Invoicing System
          {'\n'}
          Verify at: https://e.fbr.gov.pk/verify
        </Text>
      </Page>
    </Document>
  );
}
```

---

## 10. Implementation Phases

### Phase 1: Database & Models (Week 1)
- [ ] Create MongoDB models (FBRConfiguration, FBRInvoice, Reference Data)
- [ ] Set up database indexes
- [ ] Create encryption utilities
- [ ] Test model CRUD operations

### Phase 2: API Routes (Week 2)
- [ ] Implement configuration API routes
- [ ] Implement invoice API routes
- [ ] Implement reference data API routes
- [ ] Test all endpoints with Postman

### Phase 3: FBR Integration (Week 3)
- [ ] Build FBR API client
- [ ] Implement invoice validation service
- [ ] Implement invoice submission service
- [ ] Implement QR code generation
- [ ] Test with FBR sandbox

### Phase 4: React Query Hooks (Week 4)
- [ ] Create configuration hooks
- [ ] Create invoice hooks
- [ ] Create reference data hooks
- [ ] Test data fetching and caching

### Phase 5: Forms with React Hook Form (Week 5)
- [ ] Create Zod schemas
- [ ] Build FBR configuration form
- [ ] Build invoice creation form
- [ ] Build invoice item form
- [ ] Implement form validation

### Phase 6: UI Components (Week 6)
- [ ] Build invoice list component
- [ ] Build invoice detail view
- [ ] Build validation results component
- [ ] Build QR code display
- [ ] Style with Flowbite

### Phase 7: PDF Generation (Week 7)
- [ ] Create invoice PDF template
- [ ] Integrate QR code in PDF
- [ ] Add download functionality
- [ ] Test PDF generation

### Phase 8: Testing & Deployment (Week 8)
- [ ] Write unit tests
- [ ] Test all 28 scenarios in sandbox
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor first submissions

---

## Environment Variables

Add to `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/digi-invoice

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# JWT
JWT_SECRET=your-jwt-secret

# FBR API (for server-side operations)
NEXT_PUBLIC_FBR_SANDBOX_URL=https://gw.fbr.gov.pk
NEXT_PUBLIC_FBR_PRODUCTION_URL=https://gw.fbr.gov.pk
```

---

## Next Steps

1. Install additional dependencies:
   ```bash
   npm install axios qrcode
   npm install -D @types/qrcode
   ```

2. Create the folder structure
3. Start with Phase 1 (Database & Models)
4. Progress through phases sequentially
5. Test each phase before moving to next

---

**Documentation Version:** 1.0
**Last Updated:** 2025-11-12
**Tech Stack:** Next.js 16 + MongoDB + React Query + React Hook Form + Flowbite
