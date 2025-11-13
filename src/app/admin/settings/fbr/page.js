'use client';

import { useState, useEffect } from 'react';
import { getFBRAuthToken, setFBRAuthToken, removeFBRAuthToken } from '@/lib/fbr-api';
import { useFBRProvinceCodes } from '@/hooks/useFBR';
import { showSuccess, showError } from '@/utils/toast';

export default function FBRSettingsPage() {
  // Sandbox Token State
  const [sandboxToken, setSandboxToken] = useState('');
  const [isSandboxTokenSet, setIsSandboxTokenSet] = useState(false);
  const [showSandboxToken, setShowSandboxToken] = useState(false);

  // Production Token State
  const [productionToken, setProductionToken] = useState('');
  const [isProductionTokenSet, setIsProductionTokenSet] = useState(false);
  const [showProductionToken, setShowProductionToken] = useState(false);

  const [testingConnection, setTestingConnection] = useState(false);
  const [fbrInfo, setFbrInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Test connection by fetching provinces
  const { refetch: testConnection, isLoading: isTestLoading } = useFBRProvinceCodes();

  useEffect(() => {
    // Load tokens from database
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/fbr-credentials', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;

        setFbrInfo(data);
        setIsSandboxTokenSet(data.hasSandboxToken);
        setIsProductionTokenSet(data.hasProductionToken);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSandboxToken = async () => {
    if (!sandboxToken.trim()) {
      showError('Please enter a valid Sandbox token');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/fbr-credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sandboxToken: sandboxToken,
          ...fbrInfo,
        }),
      });

      if (response.ok) {
        // Also store in localStorage for immediate use
        setFBRAuthToken(sandboxToken, 'sandbox');
        setIsSandboxTokenSet(true);
        setSandboxToken('');
        showSuccess('Sandbox token saved successfully');
        await loadTokens();
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to save sandbox token');
      }
    } catch (error) {
      showError('Failed to save sandbox token');
      console.error(error);
    }
  };

  const handleSaveProductionToken = async () => {
    if (!productionToken.trim()) {
      showError('Please enter a valid Production token');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/fbr-credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productionToken: productionToken,
          ...fbrInfo,
        }),
      });

      if (response.ok) {
        // Also store in localStorage for immediate use
        setFBRAuthToken(productionToken, 'production');
        setIsProductionTokenSet(true);
        setProductionToken('');
        showSuccess('Production token saved successfully');
        await loadTokens();
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to save production token');
      }
    } catch (error) {
      showError('Failed to save production token');
      console.error(error);
    }
  };

  const handleRemoveSandboxToken = async () => {
    if (!confirm('Are you sure you want to remove the Sandbox token?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/fbr-credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sandboxToken: '',
          ...fbrInfo,
        }),
      });

      if (response.ok) {
        removeFBRAuthToken('sandbox');
        setSandboxToken('');
        setIsSandboxTokenSet(false);
        showSuccess('Sandbox token removed');
        await loadTokens();
      }
    } catch (error) {
      showError('Failed to remove sandbox token');
      console.error(error);
    }
  };

  const handleRemoveProductionToken = async () => {
    if (!confirm('Are you sure you want to remove the Production token?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/fbr-credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productionToken: '',
          ...fbrInfo,
        }),
      });

      if (response.ok) {
        removeFBRAuthToken('production');
        setProductionToken('');
        setIsProductionTokenSet(false);
        showSuccess('Production token removed');
        await loadTokens();
      }
    } catch (error) {
      showError('Failed to remove production token');
      console.error(error);
    }
  };

  const handleTestConnection = async (environment) => {
    const isTokenSet = environment === 'sandbox' ? isSandboxTokenSet : isProductionTokenSet;

    if (!isTokenSet) {
      showError(`Please save the ${environment} token first`);
      return;
    }

    setTestingConnection(true);
    try {
      // Temporarily set the environment token for testing
      const token = environment === 'sandbox' ? sandboxToken : productionToken;
      if (token) {
        setFBRAuthToken(token, environment);
      }

      const result = await testConnection();
      if (result.data && result.data.length > 0) {
        showSuccess(`✅ ${environment.toUpperCase()} API connection successful! Found ${result.data.length} provinces`);
      } else {
        showError('Connection successful but no data received');
      }
    } catch (error) {
      showError(`❌ ${environment.toUpperCase()} API connection failed: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading FBR settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FBR Digital Invoicing Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure your FBR API credentials for both Sandbox and Production environments
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 How to Get FBR API Tokens</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Visit the FBR Digital Invoicing Portal: <a href="https://fbr.gov.pk" target="_blank" className="underline">https://fbr.gov.pk</a></li>
            <li>Login with your registered credentials</li>
            <li>Navigate to API Settings or Developer Section</li>
            <li>Generate separate tokens for Sandbox (testing) and Production (live) environments</li>
            <li>Paste the tokens below and save</li>
          </ol>
        </div>

        {/* Sandbox Token Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              🧪 Sandbox Token (Testing)
            </h2>
            {isSandboxTokenSet && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                ✓ Active
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sandbox API Token
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showSandboxToken ? 'text' : 'password'}
                    value={sandboxToken}
                    onChange={(e) => setSandboxToken(e.target.value)}
                    placeholder="Enter your Sandbox API token"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSandboxToken(!showSandboxToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSandboxToken ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <button
                  onClick={handleSaveSandboxToken}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                >
                  Save
                </button>
              </div>
              {fbrInfo?.sandboxTokenUpdatedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date(fbrInfo.sandboxTokenUpdatedAt).toLocaleString()}
                </p>
              )}
            </div>

            {isSandboxTokenSet && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleTestConnection('sandbox')}
                  disabled={testingConnection || isTestLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
                >
                  {testingConnection || isTestLoading ? 'Testing...' : '🔌 Test Connection'}
                </button>
                <button
                  onClick={handleRemoveSandboxToken}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Remove Token
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Production Token Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              🚀 Production Token (Live)
            </h2>
            {isProductionTokenSet && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                ✓ Active
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production API Token
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showProductionToken ? 'text' : 'password'}
                    value={productionToken}
                    onChange={(e) => setProductionToken(e.target.value)}
                    placeholder="Enter your Production API token"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProductionToken(!showProductionToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showProductionToken ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <button
                  onClick={handleSaveProductionToken}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Save
                </button>
              </div>
              {fbrInfo?.productionTokenUpdatedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date(fbrInfo.productionTokenUpdatedAt).toLocaleString()}
                </p>
              )}
            </div>

            {isProductionTokenSet && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleTestConnection('production')}
                  disabled={testingConnection || isTestLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
                >
                  {testingConnection || isTestLoading ? 'Testing...' : '🔌 Test Connection'}
                </button>
                <button
                  onClick={handleRemoveProductionToken}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Remove Token
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-amber-900 mb-1">⚠️ Important</h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
            <li>Use <strong>Sandbox</strong> tokens for testing and development</li>
            <li>Use <strong>Production</strong> tokens only for live transactions</li>
            <li>Both tokens are stored securely in MongoDB and browser localStorage</li>
            <li>Never share your Production token with unauthorized users</li>
          </ul>
        </div>

        {/* API Endpoints Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available FBR APIs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Province Codes', desc: 'Get all provinces' },
              { name: 'Document Types', desc: 'Invoice, Debit Note, etc.' },
              { name: 'Item Codes (HS)', desc: 'Harmonized system codes' },
              { name: 'SRO Items', desc: 'SRO item codes' },
              { name: 'Transaction Types', desc: 'Transaction categories' },
              { name: 'UOMs', desc: 'Units of measurement' },
              { name: 'SRO Schedule', desc: 'Tax schedules' },
              { name: 'Sale Type Rates', desc: 'Applicable tax rates' },
              { name: 'HS Code UOM', desc: 'HS code units' },
              { name: 'STATL Check', desc: 'Registration status' },
              { name: 'Registration Type', desc: 'Verify registration' },
            ].map((api, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-gray-900 text-sm">{api.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{api.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Check the{' '}
            <a href="/FBR_INTEGRATION_GUIDE.md" className="text-blue-600 hover:underline font-medium">
              FBR Integration Guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
