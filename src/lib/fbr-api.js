/**
 * FBR Digital Invoicing API Client
 * Base configuration and fetch utilities for FBR API integration
 */

// FBR API Base URL
const FBR_API_BASE_URL = process.env.NEXT_PUBLIC_FBR_API_BASE_URL || 'https://gw.fbr.gov.pk';

/**
 * Get FBR auth token from localStorage
 * This should be the token provided by FBR for API access
 */
export function getFBRAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('fbr_token');
  }
  return null;
}

/**
 * Generic FBR API fetch function with automatic token injection
 * @param {string} endpoint - API endpoint (e.g., '/pdi/v1/provinces')
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function fbrApiFetch(endpoint, options = {}) {
  const token = getFBRAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const url = `${FBR_API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Invalid response type: ${contentType}`);
    }

    const data = await response.json();

    // Handle HTTP errors
    if (!response.ok) {
      const errorMessage = data.message || data.error || response.statusText;

      // Handle specific status codes
      switch (response.status) {
        case 401:
          throw new Error('Unauthorized - Invalid FBR API credentials');
        case 500:
          throw new Error('FBR Server Error - Please contact administrator');
        default:
          throw new Error(errorMessage || 'FBR API request failed');
      }
    }

    return data;
  } catch (error) {
    // Network or parsing errors
    if (error instanceof TypeError) {
      throw new Error('Network error - Unable to connect to FBR API');
    }
    throw error;
  }
}

/**
 * Helper method for GET requests
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise<any>}
 */
export async function fbrApiGet(endpoint, params = {}) {
  // Build query string
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;

  return fbrApiFetch(url, {
    method: 'GET',
  });
}

/**
 * Helper method for POST requests
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @returns {Promise<any>}
 */
export async function fbrApiPost(endpoint, data) {
  return fbrApiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Set FBR auth token in localStorage
 * @param {string} token - FBR API token
 */
export function setFBRAuthToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fbr_token', token);
  }
}

/**
 * Remove FBR auth token from localStorage
 */
export function removeFBRAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fbr_token');
  }
}
