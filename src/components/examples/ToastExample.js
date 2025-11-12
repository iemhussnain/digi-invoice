'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showLoading,
  dismissToast,
  dismissAllToasts,
  showPromise,
  showCustom,
} from '@/utils/toast';
import { Button, Card } from 'flowbite-react';
import {
  HiCheck,
  HiX,
  HiExclamation,
  HiInformationCircle,
  HiRefresh,
} from 'react-icons/hi';

/**
 * React Hot Toast Examples
 * Demonstrates all toast notification patterns for DigiInvoice ERP
 */
export default function ToastExample() {
  const [loadingToastId, setLoadingToastId] = useState(null);

  // Basic Toasts
  const handleBasicSuccess = () => {
    showSuccess('Invoice created successfully!');
  };

  const handleBasicError = () => {
    showError('Failed to save changes. Please try again.');
  };

  const handleBasicInfo = () => {
    showInfo('Fiscal year ends on June 30th, 2025');
  };

  const handleBasicWarning = () => {
    showWarning('Payment is overdue by 15 days');
  };

  // Loading Toast
  const handleLoadingToast = () => {
    const id = showLoading('Processing payment...');
    setLoadingToastId(id);

    // Simulate API call
    setTimeout(() => {
      dismissToast(id);
      showSuccess('Payment processed successfully!');
    }, 3000);
  };

  // Promise-based Toast
  const handlePromiseToast = async () => {
    // Simulate API call
    const fakeApiCall = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve() : reject();
      }, 2000);
    });

    await showPromise(fakeApiCall, {
      loading: 'Creating invoice...',
      success: 'Invoice created successfully!',
      error: 'Failed to create invoice',
    });
  };

  // Custom Styled Toast
  const handleCustomToast = () => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <HiCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Voucher Posted Successfully
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Voucher #JV-2024-001 has been posted to the ledger.
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    ));
  };

  // Position Examples
  const handleTopLeft = () => {
    toast.success('Top Left Toast', { position: 'top-left' });
  };

  const handleTopCenter = () => {
    toast.success('Top Center Toast', { position: 'top-center' });
  };

  const handleTopRight = () => {
    toast.success('Top Right Toast', { position: 'top-right' });
  };

  const handleBottomLeft = () => {
    toast.success('Bottom Left Toast', { position: 'bottom-left' });
  };

  const handleBottomCenter = () => {
    toast.success('Bottom Center Toast', { position: 'bottom-center' });
  };

  const handleBottomRight = () => {
    toast.success('Bottom Right Toast', { position: 'bottom-right' });
  };

  // Duration Examples
  const handleShortDuration = () => {
    toast.success('Short (1s)', { duration: 1000 });
  };

  const handleMediumDuration = () => {
    toast.success('Medium (4s)', { duration: 4000 });
  };

  const handleLongDuration = () => {
    toast.success('Long (10s)', { duration: 10000 });
  };

  const handleInfiniteDuration = () => {
    toast.success('Infinite (click to dismiss)', { duration: Infinity });
  };

  // DigiInvoice-specific Examples
  const handleInvoiceCreated = () => {
    toast.success('Invoice #INV-2024-001 created successfully!', {
      duration: 3000,
      icon: '📄',
    });
  };

  const handlePaymentReceived = () => {
    toast.success('Payment of Rs 50,000 received from ABC Corp', {
      duration: 4000,
      icon: '💰',
    });
  };

  const handleVoucherPosted = () => {
    toast.success('Voucher posted to ledger', {
      duration: 3000,
      icon: '✓',
    });
  };

  const handleValidationError = () => {
    toast.error('Debit and Credit amounts must be equal', {
      duration: 5000,
      icon: '⚠️',
    });
  };

  const handleNetworkError = () => {
    toast.error('Network error. Please check your connection.', {
      duration: 5000,
      icon: '🌐',
    });
  };

  const handleAutosave = () => {
    toast('Draft saved automatically', {
      icon: '💾',
      duration: 2000,
      style: {
        background: '#f3f4f6',
        color: '#374151',
      },
    });
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Toast Notifications - React Hot Toast
        </h2>
        <p className="text-gray-600 mb-6">
          Complete examples for DigiInvoice ERP toast notifications
        </p>
      </div>

      {/* Basic Toasts */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Toast Types
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button color="success" onClick={handleBasicSuccess}>
            <HiCheck className="mr-2 h-5 w-5" />
            Success Toast
          </Button>
          <Button color="failure" onClick={handleBasicError}>
            <HiX className="mr-2 h-5 w-5" />
            Error Toast
          </Button>
          <Button color="blue" onClick={handleBasicInfo}>
            <HiInformationCircle className="mr-2 h-5 w-5" />
            Info Toast
          </Button>
          <Button color="warning" onClick={handleBasicWarning}>
            <HiExclamation className="mr-2 h-5 w-5" />
            Warning Toast
          </Button>
        </div>
      </Card>

      {/* Loading & Promise Toasts */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Loading & Promise Toasts
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button color="blue" onClick={handleLoadingToast}>
            <HiRefresh className="mr-2 h-5 w-5" />
            Loading Toast (3s)
          </Button>
          <Button color="purple" onClick={handlePromiseToast}>
            Promise Toast (Random Result)
          </Button>
          <Button color="gray" onClick={() => dismissAllToasts()}>
            Dismiss All
          </Button>
        </div>
        <div className="mt-4 bg-blue-50 p-3 rounded text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 Promise Toast Pattern:</p>
          <code className="text-xs bg-white px-2 py-1 rounded block">
            {`toast.promise(apiCall(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed'
})`}
          </code>
        </div>
      </Card>

      {/* Custom Toast */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Custom Styled Toast
        </h3>
        <Button color="indigo" onClick={handleCustomToast}>
          Show Custom Toast
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          Full control over design and content
        </p>
      </Card>

      {/* Position Examples */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Toast Positions
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Button size="sm" onClick={handleTopLeft}>
            Top Left
          </Button>
          <Button size="sm" onClick={handleTopCenter}>
            Top Center
          </Button>
          <Button size="sm" onClick={handleTopRight}>
            Top Right
          </Button>
          <Button size="sm" onClick={handleBottomLeft}>
            Bottom Left
          </Button>
          <Button size="sm" onClick={handleBottomCenter}>
            Bottom Center
          </Button>
          <Button size="sm" onClick={handleBottomRight}>
            Bottom Right
          </Button>
        </div>
      </Card>

      {/* Duration Examples */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Toast Durations
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" onClick={handleShortDuration}>
            Short (1s)
          </Button>
          <Button size="sm" onClick={handleMediumDuration}>
            Medium (4s)
          </Button>
          <Button size="sm" onClick={handleLongDuration}>
            Long (10s)
          </Button>
          <Button size="sm" onClick={handleInfiniteDuration}>
            Infinite
          </Button>
        </div>
      </Card>

      {/* DigiInvoice-specific Examples */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          DigiInvoice ERP Use Cases
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Success Messages:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" color="success" onClick={handleInvoiceCreated}>
                Invoice Created
              </Button>
              <Button size="sm" color="success" onClick={handlePaymentReceived}>
                Payment Received
              </Button>
              <Button size="sm" color="success" onClick={handleVoucherPosted}>
                Voucher Posted
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Error Messages:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" color="failure" onClick={handleValidationError}>
                Validation Error
              </Button>
              <Button size="sm" color="failure" onClick={handleNetworkError}>
                Network Error
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Auto-save:
            </p>
            <Button size="sm" color="gray" onClick={handleAutosave}>
              Auto-save Notification
            </Button>
          </div>
        </div>
      </Card>

      {/* Usage Guide */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Usage in Your Code
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              1. Import toast utilities:
            </p>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto">
              <code>{`import { showSuccess, showError, showPromise } from '@/utils/toast';`}</code>
            </pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              2. Replace alert() with toast:
            </p>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto">
              <code>{`// Before ❌
alert('Invoice created successfully!');

// After ✅
showSuccess('Invoice created successfully!');`}</code>
            </pre>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              3. Promise-based API calls:
            </p>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto">
              <code>{`const handleCreateInvoice = async () => {
  await showPromise(
    fetch('/api/invoices', { method: 'POST', body }),
    {
      loading: 'Creating invoice...',
      success: 'Invoice created!',
      error: 'Failed to create invoice'
    }
  );
};`}</code>
            </pre>
          </div>
        </div>
      </Card>

      {/* Comparison: Before vs After */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Before vs After Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">
              ❌ Before (alert)
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Blocks UI interaction</li>
              <li>• No styling control</li>
              <li>• Single message at a time</li>
              <li>• No auto-dismiss</li>
              <li>• Looks unprofessional</li>
              <li>• No loading states</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              ✅ After (react-hot-toast)
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Non-blocking notifications</li>
              <li>• Beautiful, customizable design</li>
              <li>• Queue multiple toasts</li>
              <li>• Auto-dismiss (configurable)</li>
              <li>• Professional appearance</li>
              <li>• Promise-based loading states</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Migration Guide */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Migration Guide (42 alert() calls to replace)
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-gray-900">Files to update:</p>
            <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1">
              <li>src/app/admin/invoices/page.js (5 alerts)</li>
              <li>src/app/admin/purchase-orders/page.js (6 alerts)</li>
              <li>src/app/admin/purchase-invoices/[id]/page.js (7 alerts)</li>
              <li>src/app/admin/accounts/page.js (3 alerts)</li>
              <li>...and 13 more files</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="font-semibold text-blue-900 mb-1">
              📝 Quick Find & Replace:
            </p>
            <code className="text-xs bg-white px-2 py-1 rounded block mb-1">
              Find: alert('Success message')
            </code>
            <code className="text-xs bg-white px-2 py-1 rounded block">
              Replace: showSuccess('Success message')
            </code>
          </div>
        </div>
      </Card>
    </div>
  );
}
