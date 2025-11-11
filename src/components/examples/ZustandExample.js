'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useEffect } from 'react';

/**
 * Example component demonstrating Zustand stores
 *
 * Benefits:
 * - No props drilling (access state directly)
 * - No repeated API calls (state shared globally)
 * - Persistent state across page refreshes
 * - Clean, minimal code
 */
export default function ZustandExample() {
  // Auth Store
  const { user, isAuthenticated, login, logout, hasPermission, isAdmin } =
    useAuthStore();

  // Settings Store
  const { organization, selectedFiscalYear, setFiscalYear, formatCurrency } =
    useSettingsStore();

  // Theme Store
  const { theme, setTheme, toggleTheme, isDark } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount
    if (theme) {
      useThemeStore.getState().setTheme(theme);
    }
  }, [theme]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Zustand State Management</h2>
      <p className="text-sm text-gray-600">
        Global state accessible from any component without props drilling
      </p>

      {/* Auth Store Example */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Auth Store (useAuthStore)
        </h3>

        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
                <p className="text-sm text-gray-600">{user?.email || 'email@example.com'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-600">Role</p>
                <p className="font-semibold text-gray-900">
                  {user?.role?.name || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-600">Level</p>
                <p className="font-semibold text-gray-900">
                  {user?.role?.level || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-600">Is Admin?</p>
                <p className="font-semibold text-gray-900">
                  {isAdmin() ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-600">Can Create Accounts?</p>
                <p className="font-semibold text-gray-900">
                  {hasPermission('accounts:create') ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">Not logged in</p>
            <button
              onClick={() => alert('Use login form to authenticate')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        )}

        <div className="mt-4 bg-blue-50 p-3 rounded text-xs text-blue-800">
          <p className="font-semibold mb-1">Benefits:</p>
          <ul className="space-y-1">
            <li>✓ User info available globally</li>
            <li>✓ No need to pass user as props</li>
            <li>✓ Permission checking in one line</li>
            <li>✓ Persisted in localStorage</li>
          </ul>
        </div>
      </div>

      {/* Settings Store Example */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Settings Store (useSettingsStore)
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600">Organization</p>
              <p className="font-semibold text-gray-900">{organization.name}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600">Currency</p>
              <p className="font-semibold text-gray-900">{organization.currency}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600">Tax Rate</p>
              <p className="font-semibold text-gray-900">{organization.taxRate}%</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600">Fiscal Year</p>
              <p className="font-semibold text-gray-900">
                {selectedFiscalYear || 'Not set'}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-600 text-sm mb-2">Currency Formatter Example:</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(123456.78)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Fiscal Year
            </label>
            <select
              value={selectedFiscalYear || ''}
              onChange={(e) => setFiscalYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select year...</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>

        <div className="mt-4 bg-green-50 p-3 rounded text-xs text-green-800">
          <p className="font-semibold mb-1">Benefits:</p>
          <ul className="space-y-1">
            <li>✓ Organization settings globally accessible</li>
            <li>✓ No repeated API calls</li>
            <li>✓ Centralized configuration</li>
            <li>✓ Easy formatting utilities</li>
          </ul>
        </div>
      </div>

      {/* Theme Store Example */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Theme Store (useThemeStore)
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Current Theme</p>
              <p className="text-sm text-gray-600 capitalize">{theme}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Dark Mode</p>
              <p className="text-sm text-gray-600">{isDark() ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 px-4 py-2 rounded-md border ${
                theme === 'light'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 px-4 py-2 rounded-md border ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 px-4 py-2 rounded-md border ${
                theme === 'system'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              💻 System
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            Toggle Theme
          </button>
        </div>

        <div className="mt-4 bg-purple-50 p-3 rounded text-xs text-purple-800">
          <p className="font-semibold mb-1">Benefits:</p>
          <ul className="space-y-1">
            <li>✓ Global theme state</li>
            <li>✓ Persisted user preference</li>
            <li>✓ System preference detection</li>
            <li>✓ Easy toggle from anywhere</li>
          </ul>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-gray-900 text-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Usage Example</h3>
        <pre className="text-sm overflow-x-auto">
          <code>{`// Access state from ANY component - no props drilling!

import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useThemeStore } from '@/stores/useThemeStore';

function MyComponent() {
  // Get user info
  const user = useAuthStore(state => state.user);
  const isAdmin = useAuthStore(state => state.isAdmin());

  // Get settings
  const currency = useSettingsStore(state => state.organization.currency);
  const formatCurrency = useSettingsStore(state => state.formatCurrency);

  // Get theme
  const theme = useThemeStore(state => state.theme);
  const toggleTheme = useThemeStore(state => state.toggleTheme);

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <p>Price: {formatCurrency(1000)}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}`}</code>
        </pre>
      </div>

      {/* Benefits Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Why Zustand is Better than Props Drilling
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-red-900 mb-2">❌ Before (Props Drilling)</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Pass user prop through 5 components</li>
              <li>• useEffect + fetch in every component</li>
              <li>• Repeated API calls for same data</li>
              <li>• Complex prop management</li>
              <li>• Hard to maintain</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-green-900 mb-2">✅ After (Zustand)</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Access state directly anywhere</li>
              <li>• Fetch once, use everywhere</li>
              <li>• Automatic localStorage persistence</li>
              <li>• Clean, minimal code</li>
              <li>• Easy to maintain</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
