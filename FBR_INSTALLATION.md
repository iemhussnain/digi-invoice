# FBR Integration - Installation & Setup Guide

## 📦 Required Package Installation

To enable QR code generation for FBR invoices, you need to install the `qrcode` package:

```bash
npm install qrcode
```

## 🗂️ Files Created

### Core Integration Files

1. **`src/lib/fbr-api.js`** - FBR API client and fetch utilities
2. **`src/services/fbr-service.js`** - All FBR API endpoint functions
3. **`src/hooks/useFBR.js`** - React Query hooks for FBR data
4. **`src/types/fbr.js`** - JSDoc type definitions

### UI Components

5. **`src/components/fbr/FBRDropdowns.js`** - Province, Document Type, Transaction Type, UOM dropdowns
6. **`src/components/fbr/CustomerNTNValidator.js`** - NTN validation with real-time FBR check
7. **`src/components/fbr/TaxRateSelector.js`** - Dynamic tax rate selector
8. **`src/components/fbr/HSCodeSearch.js`** - HS Code search with autocomplete
9. **`src/components/fbr/FBRQRCode.js`** - QR Code and FBR logo components

### Pages

10. **`src/app/admin/settings/fbr/page.js`** - FBR Settings page for token management
11. **`src/app/admin/invoices/new-fbr/page.js`** - Enhanced invoice form with FBR integration

### Configuration

12. **`.env.example`** - Updated with FBR configuration

### Documentation

13. **`FBR_INTEGRATION_GUIDE.md`** - Complete usage guide with examples
14. **`FBR_INSTALLATION.md`** (this file) - Installation instructions

## 🚀 Setup Steps

### Step 1: Install Required Package

```bash
npm install qrcode
```

### Step 2: Environment Configuration

1. Copy `.env.example` to `.env.local` if you haven't already:

```bash
cp .env.example .env.local
```

2. Add the FBR API base URL in `.env.local`:

```env
NEXT_PUBLIC_FBR_API_BASE_URL=https://gw.fbr.gov.pk
```

### Step 3: Get FBR API Token

1. Visit FBR Digital Invoicing Portal: https://fbr.gov.pk
2. Login with your credentials
3. Navigate to API Settings
4. Generate or copy your API token

### Step 4: Configure FBR Token

1. Start your development server:

```bash
npm run dev
```

2. Navigate to FBR Settings page:

```
http://localhost:3000/admin/settings/fbr
```

3. Paste your FBR API token and save
4. Click "Test Connection" to verify it works

### Step 5: Create Your First FBR Invoice

1. Navigate to the FBR invoice creation page:

```
http://localhost:3000/admin/invoices/new-fbr
```

2. Fill in the required FBR fields:
   - Customer NTN
   - Province
   - Document Type
   - Transaction Type
   - Tax Rate (auto-populated based on selections)

3. Add line items with:
   - HS Codes (searchable)
   - UOMs from FBR
   - Quantities and rates

4. Submit to create FBR-compliant invoice

## 📋 Navigation Updates

Add FBR menu items to your navigation:

### In your main navigation component:

```javascript
// Add to sidebar/navigation menu
{
  name: 'FBR Settings',
  href: '/admin/settings/fbr',
  icon: '⚙️',
},
{
  name: 'FBR Invoice',
  href: '/admin/invoices/new-fbr',
  icon: '📋',
}
```

## 🔧 Troubleshooting

### QR Code not showing

**Problem:** QR code shows placeholder text "QR Code (Install qrcode)"

**Solution:** Install qrcode package:
```bash
npm install qrcode
```

### FBR API returning 401 Unauthorized

**Problem:** API calls failing with "Unauthorized"

**Solutions:**
1. Check if FBR token is set in Settings page
2. Verify token is valid (not expired)
3. Check localStorage: `localStorage.getItem('fbr_token')`
4. Contact FBR support to regenerate token

### Dropdowns not loading

**Problem:** Province/Document Type dropdowns showing "Failed to load"

**Solutions:**
1. Check FBR token is configured
2. Test connection in FBR Settings page
3. Check browser console for errors
4. Verify internet connectivity
5. Check if FBR servers are accessible

### Network Error

**Problem:** "Network error - Unable to connect to FBR API"

**Solutions:**
1. Check internet connection
2. Verify FBR API base URL in `.env.local`
3. Check if FBR servers are running (try accessing https://gw.fbr.gov.pk manually)
4. Check firewall/proxy settings

## 🧪 Testing

### Test FBR Connection

```javascript
// In browser console
const token = localStorage.getItem('fbr_token');
console.log('FBR Token:', token ? 'Set' : 'Not set');

// Manual API test
fetch('https://gw.fbr.gov.pk/pdi/v1/provinces', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log('Provinces:', data))
  .catch(err => console.error('Error:', err));
```

### Test QR Code Generation

```javascript
// In React component
import { FBRQRCode } from '@/components/fbr/FBRQRCode';

const testInvoiceData = {
  invoiceNumber: 'INV-001',
  invoiceDate: '2025-01-15',
  totalAmount: 10000,
  taxAmount: 1800,
  customerNTN: '0788762',
  sellerNTN: '1234567',
};

<FBRQRCode invoiceData={testInvoiceData} size={150} />
```

## 📊 Features Implemented

✅ **Reference Data APIs:**
- Province Codes
- Document Types
- Item Codes (HS Codes)
- SRO Item Codes
- Transaction Types
- Unit of Measures (UOMs)

✅ **Dynamic Lookup APIs:**
- SRO Schedule
- Sale Type to Rate (Tax Rates)
- HS Code with UOM
- SRO Item Details
- STATL Check
- Registration Type Validation

✅ **UI Components:**
- FBR Settings Page with token management
- Province/Document/Transaction/UOM dropdowns
- Customer NTN validator with real-time FBR check
- Tax rate selector (auto-populated based on date, transaction, province)
- HS Code search with autocomplete
- QR Code generator
- FBR logo display

✅ **Invoice Features:**
- Complete FBR-compliant invoice form
- Automatic tax rate calculation
- Customer registration validation
- Line items with HS codes and UOMs
- Print-ready invoice footer with QR code and FBR logo

## 🔄 Migration from Existing Invoice Form

To migrate your existing invoice form to FBR-compliant:

### Option 1: Use New FBR Form

Simply use the new form at `/admin/invoices/new-fbr`

### Option 2: Enhance Existing Form

1. Import FBR components:

```javascript
import {
  ProvinceSelect,
  DocumentTypeSelect,
  TransactionTypeSelect,
  UOMSelect,
} from '@/components/fbr/FBRDropdowns';
import { NTNInput } from '@/components/fbr/CustomerNTNValidator';
import { TaxRateSelector } from '@/components/fbr/TaxRateSelector';
import { HSCodeSearch } from '@/components/fbr/HSCodeSearch';
```

2. Add FBR fields to your form state:

```javascript
const [formData, setFormData] = useState({
  // ... existing fields
  fbrProvinceCode: null,
  fbrDocumentTypeId: null,
  fbrTransactionTypeId: null,
  fbrTaxRateId: null,
  customerNTN: '',
});
```

3. Add FBR fields to your form UI
4. Submit FBR data along with invoice

## 📱 Mobile Responsive

All FBR components are mobile-responsive and work on:
- Desktop (1920px+)
- Laptop (1024px - 1920px)
- Tablet (768px - 1024px)
- Mobile (< 768px)

## 🎨 Customization

### Styling

All components use Tailwind CSS. Customize by:

1. **Colors:** Modify Tailwind classes in components
2. **Sizes:** Adjust size props (e.g., `<FBRQRCode size={200} />`)
3. **Layout:** Wrap components in custom containers

### FBR Logo

Replace the default FBR logo:

1. Add FBR official logo to `/public/images/fbr-logo.png`
2. Update `FBRLogo` component in `FBRQRCode.js`

## 🆘 Support

For issues:

1. **FBR API Issues:** Contact FBR support
2. **Integration Issues:** Check `FBR_INTEGRATION_GUIDE.md`
3. **Component Issues:** Check component source code
4. **General Help:** Open an issue in project repository

## 📚 Additional Resources

- **FBR Official Site:** https://fbr.gov.pk
- **Integration Guide:** See `FBR_INTEGRATION_GUIDE.md`
- **React Query Docs:** https://tanstack.com/query/latest
- **QRCode Docs:** https://www.npmjs.com/package/qrcode

## ✅ Checklist

Before going to production:

- [ ] Install qrcode package
- [ ] Set FBR API token
- [ ] Test all FBR APIs
- [ ] Test QR code generation
- [ ] Test invoice creation
- [ ] Test NTN validation
- [ ] Test tax rate calculation
- [ ] Test print functionality
- [ ] Add FBR logo image
- [ ] Update navigation menus
- [ ] Test on mobile devices
- [ ] Verify with FBR compliance requirements

## 🔐 Security Notes

- FBR token is stored in localStorage (client-side)
- Token should be kept confidential
- Never commit tokens to version control
- Rotate tokens periodically as per FBR policy
- Use HTTPS in production
- Implement rate limiting for FBR API calls

## 🚀 Ready to Go!

Your FBR Digital Invoicing integration is now complete and ready to use! 🎉

Create your first FBR-compliant invoice at:
**`http://localhost:3000/admin/invoices/new-fbr`**
