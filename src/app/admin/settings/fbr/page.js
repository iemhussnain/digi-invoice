'use client';

import { useState, useEffect } from 'react';
import { getFBRAuthToken, setFBRAuthToken, removeFBRAuthToken } from '@/lib/fbr-api';
import { useFBRProvinceCodes } from '@/hooks/useFBR';
import { showSuccess, showError } from '@/utils/toast';

export default function FBRSettingsPage() {
  const [token, setToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Test connection by fetching provinces
  const { refetch: testConnection, isLoading: isTestLoading } = useFBRProvinceCodes();

  useEffect(() => {
    // Check if token exists
    const existingToken = getFBRAuthToken();
    if (existingToken) {
      setToken(existingToken);
      setIsTokenSet(true);
    }
  }, []);

  const handleSaveToken = () => {
    if (!token.trim()) {
      showError('Please enter a valid FBR API token');
      return;
    }

    setFBRAuthToken(token);
    setIsTokenSet(true);
    showSuccess('FBR API token saved successfully');
  };

  const handleRemoveToken = () => {
    if (confirm('Are you sure you want to remove the FBR API token?')) {
      removeFBRAuthToken();
      setToken('');
      setIsTokenSet(false);
      showSuccess('FBR API token removed');
    }
  };

  const handleTestConnection = async () => {
    if (!isTokenSet) {
      showError('Please save the FBR API token first');
      return;
    }

    setTestingConnection(true);
    try {
      const result = await testConnection();
      if (result.data && result.data.length > 0) {
        showSuccess('✅ FBR API connection successful! Found ' + result.data.length + ' provinces');
      } else {
        showError('Connection successful but no data received');
      }
    } catch (error) {
      showError('❌ FBR API connection failed: ' + error.message);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FBR Digital Invoicing Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure your FBR API credentials for digital invoicing integration
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 How to Get FBR API Token</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Visit the FBR Digital Invoicing Portal: <a href="https://fbr.gov.pk" target="_blank" className="underline">https://fbr.gov.pk</a></li>
            <li>Login with your registered credentials</li>
            <li>Navigate to API Settings or Developer Section</li>
            <li>Generate or copy your API token</li>
            <li>Paste the token below and save</li>
          </ol>
        </div>

        {/* Token Configuration */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Token Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                FBR API Token {isTokenSet && <span className="text-green-600">✓ Active</span>}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your FBR API token"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showToken ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <button
                  onClick={handleSaveToken}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Save Token
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your token is stored securely in browser localStorage
              </p>
            </div>

            {isTokenSet && (
              <div className="flex gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection || isTestLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
                >
                  {testingConnection || isTestLoading ? 'Testing...' : '🔌 Test Connection'}
                </button>
                <button
                  onClick={handleRemoveToken}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Remove Token
                </button>
              </div>
            )}
          </div>
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
