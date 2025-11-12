# FBR Digital Invoicing Integration Guide

This guide explains how to use the FBR Digital Invoicing API integration in your application, particularly for sales invoices.

## 📁 File Structure

```
src/
├── lib/
│   └── fbr-api.js           # Base FBR API client with fetch utilities
├── services/
│   └── fbr-service.js       # All FBR API endpoint functions
├── hooks/
│   └── useFBR.js            # React Query hooks for FBR data
└── types/
    └── fbr.js               # JSDoc type definitions
```

## 🔑 Setup & Configuration

### 1. Environment Variables

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_FBR_API_BASE_URL=https://gw.fbr.gov.pk
```

### 2. FBR Token Setup

The FBR API token should be stored in localStorage. You can set it using:

```javascript
import { setFBRAuthToken } from '@/lib/fbr-api';

// Store FBR token (get this from FBR portal)
setFBRAuthToken('your-fbr-api-token-here');
```

## 📊 Available APIs

### Reference Data APIs (Static - Cached for 24 hours)

| API | Hook | Description |
|-----|------|-------------|
| Province Codes | `useFBRProvinceCodes()` | Get all province codes |
| Document Types | `useFBRDocumentTypes()` | Get document types (Sale Invoice, Debit Note, etc.) |
| Item Codes | `useFBRItemCodes()` | Get HS codes with descriptions |
| SRO Item Codes | `useFBRSROItemCodes()` | Get SRO item IDs |
| Transaction Types | `useFBRTransactionTypes()` | Get transaction types |
| UOMs | `useFBRUOMs()` | Get Unit of Measure codes |

### Dynamic Lookup APIs (Parameter-based)

| API | Hook | Parameters |
|-----|------|-----------|
| SRO Schedule | `useFBRSROSchedule(rateId, date, provinceId)` | Rate ID, Date, Province ID |
| Sale Type to Rate | `useFBRSaleTypeToRate(date, transTypeId, provinceId)` | Date, Transaction Type ID, Province ID |
| HS Code UOM | `useFBRHSCodeUOM(hsCode, annexureId)` | HS Code, Annexure ID |
| SRO Item | `useFBRSROItem(date, sroId)` | Date, SRO ID |
| STATL Check | `useFBRSTATL(regno, date)` | Registration Number, Date |
| Registration Type | `useFBRRegistrationType(regno)` | Registration Number |
| Validate Registration | `useFBRValidateRegistration(regno, date)` | Registration Number, Date |

## 💡 Usage Examples

### Example 1: Creating a Sale Invoice Form

```javascript
'use client';

import { useFBRProvinceCodes, useFBRDocumentTypes, useFBRUOMs } from '@/hooks/useFBR';

export default function InvoiceForm() {
  // Fetch reference data
  const { data: provinces, isLoading: loadingProvinces } = useFBRProvinceCodes();
  const { data: docTypes, isLoading: loadingDocTypes } = useFBRDocumentTypes();
  const { data: uoms, isLoading: loadingUOMs } = useFBRUOMs();

  if (loadingProvinces || loadingDocTypes || loadingUOMs) {
    return <div>Loading FBR data...</div>;
  }

  return (
    <form>
      {/* Province Selection */}
      <select name="province">
        <option value="">Select Province</option>
        {provinces?.map((province) => (
          <option key={province.stateProvinceCode} value={province.stateProvinceCode}>
            {province.stateProvinceDesc}
          </option>
        ))}
      </select>

      {/* Document Type */}
      <select name="documentType">
        <option value="">Select Document Type</option>
        {docTypes?.map((docType) => (
          <option key={docType.docTypeId} value={docType.docTypeId}>
            {docType.docDescription}
          </option>
        ))}
      </select>

      {/* UOM for Items */}
      <select name="uom">
        <option value="">Select UOM</option>
        {uoms?.map((uom) => (
          <option key={uom.uoM_ID} value={uom.uoM_ID}>
            {uom.description}
          </option>
        ))}
      </select>
    </form>
  );
}
```

### Example 2: Dynamic Rate Calculation

```javascript
'use client';

import { useState } from 'react';
import { useFBRSaleTypeToRate } from '@/hooks/useFBR';

export default function TaxRateCalculator() {
  const [date, setDate] = useState(new Date());
  const [transTypeId, setTransTypeId] = useState(null);
  const [provinceId, setProvinceId] = useState(null);

  // Fetch rates based on selection
  const { data: rates, isLoading, error } = useFBRSaleTypeToRate(
    date,
    transTypeId,
    provinceId,
    !!(date && transTypeId && provinceId) // Only fetch when all params are set
  );

  return (
    <div>
      {/* Date, Transaction Type, Province selectors */}

      {isLoading && <p>Loading rates...</p>}

      {error && <p className="text-red-500">Error: {error.message}</p>}

      {rates && (
        <div>
          <h3>Available Tax Rates:</h3>
          {rates.map((rate) => (
            <div key={rate.ratE_ID}>
              <strong>{rate.ratE_VALUE}%</strong> - {rate.ratE_DESC}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 3: Validate Customer Registration

```javascript
'use client';

import { useFBRValidateRegistration } from '@/hooks/useFBR';
import { showSuccess, showError } from '@/utils/toast';

export default function CustomerValidation({ customerNTN }) {
  const { data, isLoading, error } = useFBRValidateRegistration(
    customerNTN,
    new Date(),
    !!customerNTN // Only fetch if NTN provided
  );

  if (!customerNTN) return null;

  if (isLoading) return <span>Validating...</span>;

  if (error) return <span className="text-red-500">Validation failed</span>;

  return (
    <div>
      {data?.isRegistered ? (
        <span className="text-green-500">✓ Registered</span>
      ) : (
        <span className="text-red-500">✗ Not Registered</span>
      )}

      {data?.isActive ? (
        <span className="text-green-500">✓ Active</span>
      ) : (
        <span className="text-orange-500">⚠ Inactive</span>
      )}
    </div>
  );
}
```

### Example 4: HS Code Search with Autocomplete

```javascript
'use client';

import { useState, useEffect } from 'react';
import { useFBRSearchHSCode } from '@/hooks/useFBR';

export default function HSCodeSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search HS codes
  const { data: results, isLoading } = useFBRSearchHSCode(
    debouncedTerm,
    debouncedTerm.length >= 2
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search HS Code..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {isLoading && <div>Searching...</div>}

      {results && results.length > 0 && (
        <ul>
          {results.map((item) => (
            <li key={item.hS_CODE}>
              <strong>{item.hS_CODE}</strong> - {item.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Example 5: Complete Invoice Creation Flow

```javascript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useFBRProvinceCodes,
  useFBRDocumentTypes,
  useFBRTransactionTypes,
  useFBRUOMs,
  useFBRSaleTypeToRate,
  useFBRValidateRegistration,
} from '@/hooks/useFBR';
import { showSuccess, showError } from '@/utils/toast';

export default function CreateInvoicePage() {
  const { register, handleSubmit, watch } = useForm();
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedTransType, setSelectedTransType] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [customerNTN, setCustomerNTN] = useState('');

  // Load reference data
  const { data: provinces } = useFBRProvinceCodes();
  const { data: docTypes } = useFBRDocumentTypes();
  const { data: transTypes } = useFBRTransactionTypes();
  const { data: uoms } = useFBRUOMs();

  // Get applicable tax rates
  const { data: taxRates } = useFBRSaleTypeToRate(
    invoiceDate,
    selectedTransType,
    selectedProvince,
    !!(invoiceDate && selectedTransType && selectedProvince)
  );

  // Validate customer
  const { data: customerValidation } = useFBRValidateRegistration(
    customerNTN,
    invoiceDate,
    !!customerNTN
  );

  const onSubmit = async (data) => {
    try {
      // Validate customer is registered and active
      if (!customerValidation?.isRegistered) {
        showError('Customer is not registered with FBR');
        return;
      }

      if (!customerValidation?.isActive) {
        showError('Customer registration is not active');
        return;
      }

      // Create invoice with FBR data
      const invoiceData = {
        ...data,
        fbrData: {
          provinceCode: selectedProvince,
          documentTypeId: data.documentType,
          transactionTypeId: selectedTransType,
          taxRateId: data.selectedTaxRate,
          customerNTN: customerNTN,
          customerRegistrationStatus: customerValidation,
        },
      };

      // Call your invoice creation API
      // await createInvoice(invoiceData);

      showSuccess('Invoice created successfully!');
    } catch (error) {
      showError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h1>Create Invoice with FBR Integration</h1>

      {/* Customer NTN */}
      <div>
        <label>Customer NTN</label>
        <input
          type="text"
          {...register('customerNTN')}
          onChange={(e) => setCustomerNTN(e.target.value)}
        />
        {customerValidation && (
          <div className="text-sm mt-1">
            {customerValidation.isRegistered ? '✓ Registered' : '✗ Not Registered'} |{' '}
            {customerValidation.isActive ? '✓ Active' : '⚠ Inactive'}
          </div>
        )}
      </div>

      {/* Province */}
      <div>
        <label>Province</label>
        <select
          {...register('province')}
          onChange={(e) => setSelectedProvince(Number(e.target.value))}
        >
          <option value="">Select Province</option>
          {provinces?.map((p) => (
            <option key={p.stateProvinceCode} value={p.stateProvinceCode}>
              {p.stateProvinceDesc}
            </option>
          ))}
        </select>
      </div>

      {/* Document Type */}
      <div>
        <label>Document Type</label>
        <select {...register('documentType')}>
          <option value="">Select Document Type</option>
          {docTypes?.map((dt) => (
            <option key={dt.docTypeId} value={dt.docTypeId}>
              {dt.docDescription}
            </option>
          ))}
        </select>
      </div>

      {/* Transaction Type */}
      <div>
        <label>Transaction Type</label>
        <select
          {...register('transactionType')}
          onChange={(e) => setSelectedTransType(Number(e.target.value))}
        >
          <option value="">Select Transaction Type</option>
          {transTypes?.map((tt) => (
            <option key={tt.transactioN_TYPE_ID} value={tt.transactioN_TYPE_ID}>
              {tt.transactioN_DESC}
            </option>
          ))}
        </select>
      </div>

      {/* Tax Rate */}
      {taxRates && taxRates.length > 0 && (
        <div>
          <label>Tax Rate</label>
          <select {...register('selectedTaxRate')}>
            <option value="">Select Tax Rate</option>
            {taxRates.map((rate) => (
              <option key={rate.ratE_ID} value={rate.ratE_ID}>
                {rate.ratE_VALUE}% - {rate.ratE_DESC}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Invoice Items with UOM */}
      <div>
        <h3>Invoice Items</h3>
        <div>
          <input type="text" placeholder="Item Description" {...register('itemDesc')} />
          <select {...register('itemUOM')}>
            <option value="">Select UOM</option>
            {uoms?.map((uom) => (
              <option key={uom.uoM_ID} value={uom.uoM_ID}>
                {uom.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" className="btn-primary">
        Create Invoice
      </button>
    </form>
  );
}
```

## 🚀 Prefetching Reference Data

To improve performance, prefetch FBR reference data on app load:

```javascript
// In your app layout or dashboard page
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchFBRReferenceData } from '@/hooks/useFBR';

export default function Dashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch FBR data on mount
    prefetchFBRReferenceData(queryClient);
  }, [queryClient]);

  return <div>Dashboard content...</div>;
}
```

## 🎯 Direct Service Usage (Without Hooks)

If you need to use the FBR APIs outside React components:

```javascript
import {
  getProvinceCodes,
  getDocumentTypes,
  validateRegistration,
} from '@/services/fbr-service';

// In API routes or server-side code
export async function GET(request) {
  try {
    const provinces = await getProvinceCodes();
    const docTypes = await getDocumentTypes();

    const validation = await validateRegistration('0788762', new Date());

    return Response.json({ provinces, docTypes, validation });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## ⚙️ Configuration Options

### Custom Cache Times

You can override cache times in hooks:

```javascript
const { data } = useFBRProvinceCodes({
  staleTime: 60 * 60 * 1000, // 1 hour
  gcTime: 2 * 60 * 60 * 1000, // 2 hours
});
```

### Error Handling

All hooks return standard React Query error states:

```javascript
const { data, isLoading, error, isError } = useFBRProvinceCodes();

if (isError) {
  console.error('FBR API Error:', error.message);
}
```

## 📝 API Response Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 401 | Unauthorized - Invalid FBR API credentials |
| 500 | Internal Server Error - Contact FBR Administrator |

## 🔒 Security Best Practices

1. **Never commit FBR token** to version control
2. **Store token securely** in localStorage (handled by the library)
3. **Validate all user inputs** before sending to FBR APIs
4. **Handle errors gracefully** - FBR APIs may be unavailable
5. **Cache reference data** to minimize API calls

## 🐛 Troubleshooting

### "Unauthorized - Invalid FBR API credentials"

- Check if FBR token is set: `localStorage.getItem('fbr_token')`
- Verify token is valid and not expired
- Contact FBR to regenerate token

### "Network error - Unable to connect to FBR API"

- Check internet connectivity
- Verify FBR API base URL in `.env.local`
- FBR servers might be down - try again later

### Data not loading

- Check browser console for errors
- Verify React Query DevTools for query status
- Check if conditional queries have required parameters

## 📚 Additional Resources

- [FBR Digital Invoicing Official Documentation](https://fbr.gov.pk)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## 🆘 Support

For issues related to:
- **FBR API integration code**: Contact development team
- **FBR API access/tokens**: Contact FBR support
- **FBR API endpoints**: Refer to FBR official documentation
