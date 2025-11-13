/**
 * FBR API Proxy
 * Proxies requests to FBR API to avoid CORS issues
 * Client-side requests go through this proxy instead of directly to FBR
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';

const FBR_API_BASE_URL = process.env.NEXT_PUBLIC_FBR_API_BASE_URL || 'https://gw.fbr.gov.pk';

/**
 * GET /api/fbr-proxy
 * Proxy GET requests to FBR API
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const endpoint = searchParams.get('endpoint');
      const token = searchParams.get('token');

      if (!endpoint) {
        return NextResponse.json(
          { error: 'Endpoint parameter is required' },
          { status: 400 }
        );
      }

      // Remove proxy-specific params before forwarding
      searchParams.delete('endpoint');
      searchParams.delete('token');

      // Build FBR API URL with remaining query params
      const fbrUrl = `${FBR_API_BASE_URL}${endpoint}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

      // Forward request to FBR API
      const response = await fetch(fbrUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      // Get response data
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        return NextResponse.json(
          { error: 'Invalid response from FBR API', details: text },
          { status: 502 }
        );
      }

      // Return FBR API response
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error('FBR Proxy Error:', error);
      return NextResponse.json(
        { error: 'Failed to proxy request to FBR API', details: error.message },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/fbr-proxy
 * Proxy POST requests to FBR API
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      const body = await request.json();
      const { endpoint, token, ...payload } = body;

      if (!endpoint) {
        return NextResponse.json(
          { error: 'Endpoint parameter is required' },
          { status: 400 }
        );
      }

      // Build FBR API URL
      const fbrUrl = `${FBR_API_BASE_URL}${endpoint}`;

      // Forward request to FBR API
      const response = await fetch(fbrUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      // Get response data
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        return NextResponse.json(
          { error: 'Invalid response from FBR API', details: text },
          { status: 502 }
        );
      }

      // Return FBR API response
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error('FBR Proxy Error:', error);
      return NextResponse.json(
        { error: 'Failed to proxy request to FBR API', details: error.message },
        { status: 500 }
      );
    }
  });
}
