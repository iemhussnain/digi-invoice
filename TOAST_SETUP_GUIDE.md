# 🔔 Toast Notifications Setup Guide

## ✅ Installation Complete

```bash
npm install react-hot-toast
```

**Package Version:** Latest
**Bundle Size:** ~3.5 KB (gzipped)
**Stars:** 9,000+

---

## 📁 Files Created

### 1. Toast Provider
**Path:** `src/providers/ToastProvider.js`
- Toaster component with default configuration
- Position: top-right
- Auto-dismiss: 4 seconds
- Custom styling for success/error/loading states

### 2. Toast Utilities
**Path:** `src/utils/toast.js`
- Helper functions for consistent toast usage
- `showSuccess()`, `showError()`, `showInfo()`, `showWarning()`
- `showLoading()`, `dismissToast()`, `dismissAllToasts()`
- `showPromise()` for automatic loading → success/error

### 3. Toast Examples
**Path:** `src/components/examples/ToastExample.js`
- Complete showcase of all toast patterns
- DigiInvoice-specific use cases
- Migration guide from alert()

---

## 🚀 Setup Instructions

### Step 1: Add ToastProvider to Layout

**File:** `src/app/layout.js`

```javascript
import ToastProvider from '@/providers/ToastProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
```

### Step 2: Use Toast in Your Components

```javascript
'use client';

import { showSuccess, showError, showPromise } from '@/utils/toast';

export default function InvoicePage() {
  const handleCreateInvoice = async () => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        showSuccess('Invoice created successfully!');
      } else {
        showError('Failed to create invoice');
      }
    } catch (error) {
      showError('Network error. Please try again.');
    }
  };

  return (
    <button onClick={handleCreateInvoice}>
      Create Invoice
    </button>
  );
}
```

### Step 3: Promise-Based Pattern (Recommended)

```javascript
import { showPromise } from '@/utils/toast';

const handleSaveVoucher = async () => {
  await showPromise(
    fetch('/api/vouchers', { method: 'POST', body }),
    {
      loading: 'Saving voucher...',
      success: 'Voucher saved successfully!',
      error: 'Failed to save voucher'
    }
  );
};
```

---

## 🔄 Migration from alert()

### Current State
**42 alert() calls** found in 17 files:
- `src/app/admin/invoices/page.js` (5 alerts)
- `src/app/admin/purchase-orders/page.js` (6 alerts)
- `src/app/admin/purchase-invoices/[id]/page.js` (7 alerts)
- `src/app/admin/accounts/page.js` (3 alerts)
- `src/app/admin/roles/page.js` (2 alerts)
- `src/app/admin/customers/page.js` (2 alerts)
- `src/app/admin/suppliers/page.js` (2 alerts)
- `src/app/admin/grn/page.js` (2 alerts)
- `src/app/admin/vouchers/new/page.js` (1 alert)
- `src/app/forgot-password/page.js` (1 alert)
- And 7 more files...

### Find & Replace Pattern

**Before:**
```javascript
alert('Invoice created successfully!');
```

**After:**
```javascript
import { showSuccess } from '@/utils/toast';

showSuccess('Invoice created successfully!');
```

### Common Patterns

| Old (alert) | New (toast) |
|-------------|-------------|
| `alert('Success message')` | `showSuccess('Success message')` |
| `alert('Error: ' + error.message)` | `showError('Error: ' + error.message)` |
| `alert('Are you sure?')` | Use modal confirmation instead |
| `console.log('Debug')` | Keep as is (not user-facing) |

---

## 📋 Toast Patterns for DigiInvoice

### 1. Success Messages

```javascript
// Invoice operations
showSuccess('Invoice #INV-2024-001 created successfully!');
showSuccess('Invoice updated');
showSuccess('Invoice deleted');

// Payment operations
showSuccess('Payment of Rs 50,000 received');
showSuccess('Payment recorded successfully');

// Voucher operations
showSuccess('Voucher posted to ledger');
showSuccess('Voucher saved as draft');

// Customer/Supplier
showSuccess('Customer added successfully');
showSuccess('Supplier updated');
```

### 2. Error Messages

```javascript
// Validation errors
showError('Debit and Credit amounts must be equal');
showError('Invoice amount cannot be negative');
showError('Customer name is required');

// API errors
showError('Failed to save changes. Please try again.');
showError('Network error. Please check your connection.');

// Permission errors
showError('You do not have permission to perform this action');
```

### 3. Warning Messages

```javascript
import { showWarning } from '@/utils/toast';

showWarning('Payment is overdue by 15 days');
showWarning('Low credit limit for this customer');
showWarning('Fiscal year will end in 30 days');
```

### 4. Info Messages

```javascript
import { showInfo } from '@/utils/toast';

showInfo('Fiscal year: July 1, 2024 - June 30, 2025');
showInfo('GST rate is 18% for all items');
showInfo('Auto-save enabled');
```

### 5. Loading States

```javascript
import { showLoading, dismissToast, showSuccess } from '@/utils/toast';

const handleExport = async () => {
  const toastId = showLoading('Generating PDF...');

  try {
    await generatePDF();
    dismissToast(toastId);
    showSuccess('PDF downloaded successfully');
  } catch (error) {
    dismissToast(toastId);
    showError('Failed to generate PDF');
  }
};
```

### 6. Promise-Based (Automatic Loading)

```javascript
import { showPromise } from '@/utils/toast';

// Single API call
await showPromise(
  fetch('/api/invoices', { method: 'POST' }),
  {
    loading: 'Creating invoice...',
    success: 'Invoice created!',
    error: 'Failed to create invoice'
  }
);

// With error handling
await showPromise(
  saveToDatabase(),
  {
    loading: 'Saving...',
    success: (data) => `Saved! ID: ${data.id}`,
    error: (err) => `Error: ${err.message}`
  }
);
```

---

## 🎨 Customization

### Change Default Position

**File:** `src/providers/ToastProvider.js`

```javascript
<Toaster
  position="bottom-center"  // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
  reverseOrder={false}
/>
```

### Change Default Duration

```javascript
toastOptions={{
  duration: 5000,  // 5 seconds instead of 4
}}
```

### Custom Toast Style

```javascript
import toast from 'react-hot-toast';

toast.success('Custom styled!', {
  style: {
    background: '#10b981',
    color: '#fff',
    padding: '20px',
    fontSize: '16px',
  },
  iconTheme: {
    primary: '#fff',
    secondary: '#10b981',
  },
});
```

---

## 📊 Migration Priority

### High Priority (Replace Immediately)
1. ✅ Invoice creation/update/delete toasts
2. ✅ Payment recording toasts
3. ✅ Voucher posting toasts
4. ✅ Form validation error toasts

### Medium Priority (Replace Soon)
5. Customer/Supplier CRUD toasts
6. Account management toasts
7. User management toasts

### Low Priority (Optional)
8. Debug messages (keep as console.log)
9. Confirmation dialogs (use modals instead)

---

## 🧪 Testing Toast

### View Examples Page

1. Start development server:
```bash
npm run dev
```

2. Create a test page to view examples:

**File:** `src/app/test-toast/page.js`
```javascript
import ToastExample from '@/components/examples/ToastExample';

export default function TestToastPage() {
  return <ToastExample />;
}
```

3. Visit: `http://localhost:3000/test-toast`

---

## 📝 Next Steps

### Immediate (Today)
1. ✅ Add `<ToastProvider />` to `layout.js`
2. ✅ Replace 5-10 alert() calls in main pages
3. ✅ Test toast notifications

### This Week
4. Replace all 42 alert() calls with toast
5. Update API error handling to use toast
6. Add promise-based toasts for API calls

### Future Enhancements
7. Add toast notification queue limit
8. Add sound notifications (optional)
9. Add toast history/log (optional)

---

## 🎯 Benefits

### Before (alert)
- ❌ Blocks UI
- ❌ No styling
- ❌ Single message only
- ❌ No auto-dismiss
- ❌ Looks unprofessional

### After (react-hot-toast)
- ✅ Non-blocking
- ✅ Beautiful, branded design
- ✅ Queue multiple toasts
- ✅ Auto-dismiss (4s default)
- ✅ Professional appearance
- ✅ Loading states
- ✅ Promise support
- ✅ Customizable
- ✅ Accessible

---

## 🐛 Troubleshooting

### Toast not showing?
- Ensure `<ToastProvider />` is added to layout.js
- Check that component is 'use client'
- Verify import path is correct

### Toast showing but no styling?
- ToastProvider should be inside `<body>` tag
- Check browser console for errors

### Multiple toasts overlapping?
- Adjust `gutter` prop in ToastProvider
- Consider dismissing previous toast: `toast.dismiss()`

---

## 📚 Resources

- **Documentation:** https://react-hot-toast.com/
- **GitHub:** https://github.com/timolins/react-hot-toast
- **Examples:** `src/components/examples/ToastExample.js`

---

**Installation Complete! 🎉**

Next: Add `<ToastProvider />` to your layout.js and start replacing alert() calls!
