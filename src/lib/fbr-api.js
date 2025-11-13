/**
 * FBR Digital Invoicing API Client
 * Base configuration and fetch utilities for FBR API integration
 */

// FBR API Base URL
const FBR_API_BASE_URL = process.env.NEXT_PUBLIC_FBR_API_BASE_URL || 'https://gw.fbr.gov.pk';

/**
 * Migrate old token format to new format (one-time migration)
 * Moves fbr_token to fbr_production_token if exists
 */
function migrateOldToken() {
  if (typeof window !== 'undefined') {
    const oldToken = localStorage.getItem('fbr_token');
    const newProductionToken = localStorage.getItem('fbr_production_token');

    // If old token exists but new production token doesn't, migrate it
    if (oldToken && !newProductionToken) {
      localStorage.setItem('fbr_production_token', oldToken);
      // Keep old token for backward compatibility (will remove in future)
      // localStorage.removeItem('fbr_token');
    }
  }
}

/**
 * Get FBR auth token from localStorage or environment variable
 * Priority: localStorage > environment variable
 * This should be the token provided by FBR for API access
 * @param {string} environment - 'sandbox' or 'production' (defaults to production)
 */
export function getFBRAuthToken(environment = 'production') {
  // Run migration on first call
  migrateOldToken();

  // Try localStorage first (for runtime token updates)
  if (typeof window !== 'undefined') {
    const tokenKey = environment === 'sandbox' ? 'fbr_sandbox_token' : 'fbr_production_token';
    const localToken = localStorage.getItem(tokenKey);
    if (localToken) {
      return localToken;
    }

    // Fallback to old token key for backward compatibility
    if (environment === 'production') {
      const oldToken = localStorage.getItem('fbr_token');
      if (oldToken) {
        return oldToken;
      }
    }
  }

  // Fallback to environment variable
  if (environment === 'sandbox') {
    return process.env.NEXT_PUBLIC_FBR_SANDBOX_TOKEN || null;
  }
  return process.env.NEXT_PUBLIC_FBR_PRODUCTION_TOKEN || process.env.NEXT_PUBLIC_FBR_TOKEN || null;
}

/**
 * Generic FBR API fetch function with automatic token injection
 * Uses proxy when running on client-side to avoid CORS issues
 * @param {string} endpoint - API endpoint (e.g., '/pdi/v1/provinces')
 * @param {object} options - Fetch options
 * @param {string} environment - 'sandbox' or 'production' (defaults to production)
 * @returns {Promise<any>} - Parsed JSON response
 */
export async function fbrApiFetch(endpoint, options = {}, environment = 'production') {
  const token = getFBRAuthToken(environment);
  const isClient = typeof window !== 'undefined';

  // Use proxy for client-side requests to avoid CORS issues
  if (isClient) {
    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (options.method === 'POST') {
        // For POST requests, send data in body
        const response = await fetch('/api/fbr-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            endpoint,
            token,
            ...options.body ? JSON.parse(options.body) : {},
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'FBR API request failed');
        }

        return data;
      } else {
        // For GET requests, use query params
        const url = new URL('/api/fbr-proxy', window.location.origin);

        // Parse endpoint for query params
        const [path, queryString] = endpoint.split('?');
        url.searchParams.set('endpoint', path);
        url.searchParams.set('token', token);

        // Add existing query params
        if (queryString) {
          const params = new URLSearchParams(queryString);
          params.forEach((value, key) => {
            url.searchParams.set(key, value);
          });
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'FBR API request failed');
        }

        return data;
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Network error - Unable to connect to FBR API');
      }
      throw error;
    }
  }

  // Server-side: Direct FBR API call (no CORS issues)
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
 * @param {string} environment - 'sandbox' or 'production' (defaults to production)
 * @returns {Promise<any>}
 */
export async function fbrApiGet(endpoint, params = {}, environment = 'production') {
  // Build query string
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;

  return fbrApiFetch(url, {
    method: 'GET',
  }, environment);
}

/**
 * Helper method for POST requests
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @param {string} environment - 'sandbox' or 'production' (defaults to production)
 * @returns {Promise<any>}
 */
export async function fbrApiPost(endpoint, data, environment = 'production') {
  return fbrApiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }, environment);
}

/**
 * Set FBR auth token in localStorage
 * @param {string} token - FBR API token
 * @param {string} environment - 'sandbox' or 'production' (defaults to production)
 */
export function setFBRAuthToken(token, environment = 'production') {
  if (typeof window !== 'undefined') {
    const tokenKey = environment === 'sandbox' ? 'fbr_sandbox_token' : 'fbr_production_token';
    localStorage.setItem(tokenKey, token);
  }
}

/**
 * Remove FBR auth token from localStorage
 * @param {string} environment - 'sandbox' or 'production' (defaults to production)
 */
export function removeFBRAuthToken(environment = 'production') {
  if (typeof window !== 'undefined') {
    const tokenKey = environment === 'sandbox' ? 'fbr_sandbox_token' : 'fbr_production_token';
    localStorage.removeItem(tokenKey);
  }
}
