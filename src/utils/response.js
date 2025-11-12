/**
 * API Response Utilities
 * Standardized response formats for all API routes
 */

import { NextResponse } from 'next/server';

/**
 * Success Response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code (default: 200)
 */
export function successResponse(data = null, message = 'Success', status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Error Response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default: 400)
 * @param {object} errors - Detailed error object
 */
export function errorResponse(message = 'An error occurred', status = 400, errors = null) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Validation Error Response
 * @param {object} errors - Validation errors
 */
export function validationError(errors) {
  return errorResponse('Validation failed', 422, errors);
}

/**
 * Unauthorized Error Response
 */
export function unauthorizedError(message = 'Unauthorized access') {
  return errorResponse(message, 401);
}

/**
 * Forbidden Error Response
 */
export function forbiddenError(message = 'Access forbidden') {
  return errorResponse(message, 403);
}

/**
 * Not Found Error Response
 */
export function notFoundError(message = 'Resource not found') {
  return errorResponse(message, 404);
}

/**
 * Server Error Response
 */
export function serverError(message = 'Internal server error', error = null) {
  // Log error details for debugging
  if (error) {
    console.error('Server Error:', error);
  }

  return errorResponse(
    message,
    500,
    process.env.NODE_ENV === 'development' && error ? { error: error.message } : null
  );
}
