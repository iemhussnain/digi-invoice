/**
 * Cookie Utilities
 * Helpers for setting secure HTTP-only cookies
 */

/**
 * Get cookie options for secure storage
 * @param {number} maxAge - Cookie max age in seconds
 * @returns {object} Cookie options
 */
export function getCookieOptions(maxAge = 7 * 24 * 60 * 60) {
  // 7 days default
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
    maxAge: maxAge, // Cookie expiry in seconds
    path: '/', // Available for all routes
  };
}

/**
 * Set authentication cookies in response
 * @param {Response} response - Next.js response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 * @returns {Response} Response with cookies set
 */
export function setAuthCookies(response, accessToken, refreshToken) {
  const accessTokenMaxAge = 7 * 24 * 60 * 60; // 7 days
  const refreshTokenMaxAge = 30 * 24 * 60 * 60; // 30 days

  // Set access token cookie
  response.cookies.set('accessToken', accessToken, getCookieOptions(accessTokenMaxAge));

  // Set refresh token cookie
  response.cookies.set('refreshToken', refreshToken, getCookieOptions(refreshTokenMaxAge));

  return response;
}

/**
 * Clear authentication cookies
 * @param {Response} response - Next.js response object
 * @returns {Response} Response with cookies cleared
 */
export function clearAuthCookies(response) {
  // Clear by setting empty value and past expiry
  response.cookies.set('accessToken', '', {
    ...getCookieOptions(),
    maxAge: 0,
  });

  response.cookies.set('refreshToken', '', {
    ...getCookieOptions(),
    maxAge: 0,
  });

  return response;
}

/**
 * Set custom cookie
 * @param {Response} response - Next.js response object
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {object} options - Additional options
 * @returns {Response} Response with cookie set
 */
export function setCookie(response, name, value, options = {}) {
  const cookieOptions = {
    ...getCookieOptions(),
    ...options,
  };

  response.cookies.set(name, value, cookieOptions);

  return response;
}

/**
 * Get cookie from request
 * @param {Request} request - Next.js request object
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null
 */
export function getCookie(request, name) {
  return request.cookies.get(name)?.value || null;
}

/**
 * Get all auth tokens from request (cookies or headers)
 * @param {Request} request - Next.js request object
 * @returns {object} { accessToken, refreshToken }
 */
export function getAuthTokens(request) {
  // Try cookies first
  let accessToken = getCookie(request, 'accessToken');
  let refreshToken = getCookie(request, 'refreshToken');

  // Fallback to Authorization header for accessToken
  if (!accessToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
  }

  // Fallback to request body for refreshToken (for refresh endpoint)
  // This will be handled in the API route itself

  return {
    accessToken,
    refreshToken,
  };
}
