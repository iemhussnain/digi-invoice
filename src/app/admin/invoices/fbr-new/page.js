'use client';

import { useState, useEffect } from 'react';
import FBRInvoiceForm from '@/components/fbr/FBRInvoiceForm';
import Link from 'next/link';

export default function FBRInvoiceNewPage() {
  const [userFBRInfo, setUserFBRInfo] = useState(null);
  const [clientsList, setClientsList] = useState([]);
  const [environment, setEnvironment] = useState('production'); // Default to production

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
          console.log('Customers API Response:', data);

          // Map customers to the format expected by the form
          // API returns paginated response: {success: true, data: {customers: [...], pagination: {...}}}
          const formattedClients = (data.data.customers || [])
            .map((customer) => ({
              buyerNTNCNIC: customer.ntn || customer.cnic || '',
              buyerBusinessName: customer.name || customer.companyName || '',
              buyerProvince: customer.billingAddress?.state || 'Sindh',
              buyerAddress: customer.billingAddress?.street || '',
              buyerRegistrationType: customer.gstRegistered ? 'Registered' : 'Unregistered',
            }))
            .filter(client => client.buyerBusinessName); // Only include customers with names

          console.log('Formatted Clients:', formattedClients);
          console.log('Total clients after filtering:', formattedClients.length);
          setClientsList(formattedClients);
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch customers:', response.status, errorData);
          setClientsList([]);
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
            <Link
              href="/admin/invoices"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Invoices
            </Link>
          </div>

          {/* Environment Selector */}
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FBR Environment
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="environment"
                  value="sandbox"
                  checked={environment === 'sandbox'}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="form-radio h-5 w-5 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="ml-2 text-gray-700">
                  🧪 <strong>Sandbox</strong> (Testing)
                </span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="environment"
                  value="production"
                  checked={environment === 'production'}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="form-radio h-5 w-5 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-gray-700">
                  🚀 <strong>Production</strong> (Live)
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {environment === 'sandbox'
                ? 'Using Sandbox environment for testing. Invoices will not be sent to FBR.'
                : 'Using Production environment. Invoices will be officially submitted to FBR.'}
            </p>
          </div>
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
