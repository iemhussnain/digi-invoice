export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              DigInvoice ERP
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Complete Enterprise Resource Planning System
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-xl">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Accounting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Double-entry bookkeeping, vouchers, and financial reports
              </p>
            </div>

            <div className="bg-green-50 dark:bg-gray-700 p-6 rounded-xl">
              <div className="text-3xl mb-3">🛒</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Sales</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Customer management, invoicing, and walk-in sales
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-gray-700 p-6 rounded-xl">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Purchase</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Supplier management, PO, GRN, and procurement
              </p>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Database</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Authentication</span>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">Pending</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">API Routes</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/api/health"
              target="_blank"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
            >
              Test Health Check
            </a>
            <button
              disabled
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-semibold py-3 px-6 rounded-lg text-center cursor-not-allowed"
            >
              Login (Coming Soon)
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Built with Next.js 15, MongoDB, and Tailwind CSS
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
