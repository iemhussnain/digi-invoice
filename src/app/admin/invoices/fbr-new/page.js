'use client';

import { useState, useEffect } from 'react';
import FBRInvoiceForm from '@/components/fbr/FBRInvoiceForm';
import Link from 'next/link';

export default function FBRInvoiceNewPage() {
  const [userFBRInfo, setUserFBRInfo] = useState(null);
  const [clientsList, setClientsList] = useState([]);
  const environment = 'production'; // Always use production

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
            <Link
              href="/admin/invoices"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Invoices
            </Link>
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
