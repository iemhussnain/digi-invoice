'use client';

import { useState, useEffect } from 'react';
import FBRInvoiceForm from '@/components/fbr/FBRInvoiceForm';
import Link from 'next/link';

export default function FBRInvoiceNewPage() {
  const [userFBRInfo, setUserFBRInfo] = useState(null);
  const [clientsList, setClientsList] = useState([]);
  const [environment, setEnvironment] = useState('production'); // Production by default

  useEffect(() => {
    // Fetch user's FBR information from API or localStorage
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');

        // Try to get from localStorage first
        const storedFBRInfo = localStorage.getItem('fbrInfo');
        if (storedFBRInfo) {
          setUserFBRInfo(JSON.parse(storedFBRInfo));
        } else {
          // Fallback: Fetch from API
          const response = await fetch('/api/user/fbr-info', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUserFBRInfo(data.fbrInfo);
            // Cache it for next time
            localStorage.setItem('fbrInfo', JSON.stringify(data.fbrInfo));
          } else {
            // If API fails, use default/demo values
            setUserFBRInfo({
              ntn2: '8885801',
              businessName: 'My Business',
              province: 'Sindh',
              provinceNumber: 8,
              businessAddress: 'Karachi, Pakistan',
              gst: 'GST-123456',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user FBR info:', error);
        // Use default values on error
        setUserFBRInfo({
          ntn2: '8885801',
          businessName: 'My Business',
          province: 'Sindh',
          provinceNumber: 8,
          businessAddress: 'Karachi, Pakistan',
          gst: 'GST-123456',
        });
      }
    };

    // Fetch clients/buyers list
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/customers', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Map customers to the format expected by the form
          const formattedClients = data.data?.map((customer) => ({
            buyerNTNCNIC: customer.ntn || customer.cnic || '',
            buyerBusinessName: customer.name || customer.businessName || '',
            buyerProvince: customer.province || 'Sindh',
            buyerAddress: customer.address || '',
            buyerRegistrationType: customer.registrationType || 'Registered',
          })) || [];

          setClientsList(formattedClients);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setClientsList([]);
      }
    };

    fetchUserInfo();
    fetchClients();
  }, []);

  if (!userFBRInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FBR information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create FBR Digital Invoice
              </h1>
              <p className="text-gray-600 mt-2">
                Federal Board of Revenue compliant digital invoicing system
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Environment Selector */}
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm border-2 border-green-300">
                <span className="text-sm font-semibold text-gray-700">Environment:</span>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="text-sm font-medium px-2 py-1 rounded border-2 border-green-400 text-green-700 bg-green-50 focus:outline-none focus:border-green-500"
                >
                  <option value="production">Production (Live)</option>
                  <option value="sandbox">Sandbox (Testing)</option>
                </select>
              </div>

              <Link
                href="/admin/invoices"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back to Invoices
              </Link>
            </div>
          </div>
        </div>

        {/* Environment Badge */}
        <div className="mb-6">
          {environment === 'sandbox' ? (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex items-center gap-3">
              <svg
                className="h-5 w-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-semibold text-yellow-800">Testing Mode (Sandbox)</p>
                <p className="text-sm text-yellow-700">
                  This invoice will be sent to FBR Sandbox environment for testing purposes only
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 flex items-center gap-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-bold text-green-800">✓ Production Mode (Live)</p>
                <p className="text-sm text-green-700 font-medium">
                  This invoice will be sent to FBR Live Production environment and will be officially recorded with Federal Board of Revenue
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FBR Invoice Form */}
        <FBRInvoiceForm
          userFBRInfo={userFBRInfo}
          clientsList={clientsList}
          environment={environment}
        />
      </div>
    </div>
  );
}
