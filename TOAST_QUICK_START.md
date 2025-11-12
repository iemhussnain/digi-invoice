# 🚀 Toast Notifications - Quick Start

## ✅ Installation Complete

```bash
✓ react-hot-toast@2.6.0 installed
✓ ToastProvider created
✓ Toast utilities created
✓ Example component created
```

---

## 📝 3-Step Setup

### Step 1: Add Provider to Layout (5 minutes)

**Edit:** `src/app/layout.js`

```javascript
import ToastProvider from '@/providers/ToastProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider />  {/* ← Add this line */}
        {children}
      </body>
    </html>
  );
}
```

### Step 2: Import Toast Utility

**In any component:**

```javascript
'use client';

import { showSuccess, showError } from '@/utils/toast';
```

### Step 3: Replace alert() with toast

**Before:**
```javascript
alert('Invoice created successfully!');
```

**After:**
```javascript
showSuccess('Invoice created successfully!');
```

---

## 🎯 Common Usage Patterns

### Success
```javascript
showSuccess('Invoice created successfully!');
```

### Error
```javascript
showError('Failed to save changes');
```

### Loading → Success/Error (Automatic)
```javascript
import { showPromise } from '@/utils/toast';

await showPromise(
  fetch('/api/invoices', { method: 'POST' }),
  {
    loading: 'Creating invoice...',
    success: 'Invoice created!',
    error: 'Failed to create invoice'
  }
);
```

### Manual Loading
```javascript
import { showLoading, dismissToast, showSuccess } from '@/utils/toast';

const toastId = showLoading('Processing...');

// Do work...
await saveData();

dismissToast(toastId);
showSuccess('Done!');
```

---

## 📋 Migration Checklist

### Files with alert() to Replace (42 total)

- [ ] `src/app/admin/invoices/page.js` (5 alerts)
- [ ] `src/app/admin/purchase-orders/page.js` (6 alerts)
- [ ] `src/app/admin/purchase-invoices/[id]/page.js` (7 alerts)
- [ ] `src/app/admin/accounts/page.js` (3 alerts)
- [ ] `src/app/admin/roles/page.js` (2 alerts)
- [ ] `src/app/admin/customers/page.js` (2 alerts)
- [ ] `src/app/admin/suppliers/page.js` (2 alerts)
- [ ] `src/app/admin/grn/page.js` (2 alerts)
- [ ] `src/app/admin/purchase-invoices/page.js` (2 alerts)
- [ ] `src/app/admin/roles/[id]/page.js` (1 alert)
- [ ] `src/app/admin/vouchers/new/page.js` (1 alert)
- [ ] `src/app/admin/purchase-invoices/new/page.js` (1 alert)
- [ ] `src/app/forgot-password/page.js` (1 alert)
- [ ] `src/components/examples/CustomerFormExample.js` (2 alerts)
- [ ] `src/components/examples/FlowbiteExample.js` (1 alert)
- [ ] `src/components/examples/ZustandExample.js` (1 alert)
- [ ] `PROFILE-MANAGEMENT-API-GUIDE.md` (3 alerts - documentation)

---

## 🎨 Available Functions

| Function | Use Case | Example |
|----------|----------|---------|
| `showSuccess(msg)` | Success messages | `showSuccess('Saved!')` |
| `showError(msg)` | Error messages | `showError('Failed to save')` |
| `showInfo(msg)` | Info messages | `showInfo('Fiscal year ends soon')` |
| `showWarning(msg)` | Warning messages | `showWarning('Payment overdue')` |
| `showLoading(msg)` | Loading indicator | `showLoading('Processing...')` |
| `showPromise(promise, msgs)` | Auto loading→success/error | See example above |
| `dismissToast(id)` | Close specific toast | `dismissToast(toastId)` |
| `dismissAllToasts()` | Close all toasts | `dismissAllToasts()` |

---

## 📖 Full Documentation

- **Setup Guide:** `TOAST_SETUP_GUIDE.md`
- **Examples:** `src/components/examples/ToastExample.js`
- **Utilities:** `src/utils/toast.js`
- **Provider:** `src/providers/ToastProvider.js`

---

## 🧪 Test It

**Create test page:** `src/app/test-toast/page.js`

```javascript
import ToastExample from '@/components/examples/ToastExample';

export default function TestToastPage() {
  return <ToastExample />;
}
```

**Visit:** http://localhost:3000/test-toast

---

## ✨ Benefits

✅ Non-blocking notifications
✅ Auto-dismiss (4s default)
✅ Queue multiple toasts
✅ Beautiful design
✅ Promise support
✅ Loading states
✅ Customizable
✅ Only 3.5 KB

**Replace 42 alert() calls and improve UX instantly!** 🎉
