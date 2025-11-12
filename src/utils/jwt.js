/**
 * JWT Utility
 * Generate and verify JWT tokens for authentication
 */

import jwt from 'jsonwebtoken';
import logger from './logger';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

/**
 * Generate JWT Token
 * @param {object} payload - Data to include in token
 * @param {string} expiresIn - Token expiry (default: 7d)
 * @returns {string} - JWT token
 */
export function generateToken(payload, expiresIn = JWT_EXPIRY) {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn,
      issuer: 'diginvoice-erp',
      audience: 'diginvoice-users',
    });

    logger.debug('JWT token generated', {
      userId: payload.userId,
      expiresIn,
    });

    return token;
  } catch (error) {
    logger.error('JWT generation failed', error);
    throw new Error('Token generation failed');
  }
}

/**
 * Verify JWT Token
 * @param {string} token - JWT token to verify
 * @returns {object} - Decoded payload or null
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'diginvoice-erp',
      audience: 'diginvoice-users',
    });

    logger.debug('JWT token verified', {
      userId: decoded.userId,
    });

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warning('JWT token expired', {
        expiredAt: error.expiredAt,
      });
      return { error: 'Token expired', code: 'TOKEN_EXPIRED' };
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warning('JWT token invalid', {
        message: error.message,
      });
      return { error: 'Invalid token', code: 'TOKEN_INVALID' };
    }

    logger.error('JWT verification failed', error);
    return { error: 'Token verification failed', code: 'TOKEN_ERROR' };
  }
}

/**
 * Decode JWT Token Without Verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload (unverified)
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('JWT decode failed', error);
    return null;
  }
}

/**
 * Generate User Token
 * Creates a token with user-specific information
 * @param {object} user - User object
 * @param {string} sessionId - Session ID
 * @returns {string} - JWT token
 */
export function generateUserToken(user, sessionId) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    organizationId: user.organizationId.toString(),
    sessionId,
    type: 'access',
  };

  return generateToken(payload);
}

/**
 * Generate Refresh Token
 * Creates a longer-lived token for refreshing access tokens
 * @param {object} user - User object
 * @returns {string} - Refresh token
 */
export function generateRefreshToken(user) {
  const payload = {
    userId: user._id.toString(),
    type: 'refresh',
  };

  return generateToken(payload, '30d'); // 30 days for refresh token
}

/**
 * Extract Token from Authorization Header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Token or null
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  // Format: "Bearer <token>"
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warning('Invalid authorization header format');
    return null;
  }

  return parts[1];
}

/**
 * Check if Token is Expired
 * @param {object} decoded - Decoded JWT payload
 * @returns {boolean} - True if expired
 */
export function isTokenExpired(decoded) {
  if (!decoded || !decoded.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Get Token Expiry Time
 * @param {object} decoded - Decoded JWT payload
 * @returns {Date|null} - Expiry date or null
 */
export function getTokenExpiry(decoded) {
  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
}

/**
 * Get Time Until Token Expires (in seconds)
 * @param {object} decoded - Decoded JWT payload
 * @returns {number} - Seconds until expiry (0 if expired)
 */
export function getTimeUntilExpiry(decoded) {
  if (!decoded || !decoded.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeLeft = decoded.exp - currentTime;

  return timeLeft > 0 ? timeLeft : 0;
}

/**
 * Example usage:
 *
 * // Generate token
 * const token = generateUserToken(user, sessionId);
 *
 * // Verify token
 * const decoded = verifyToken(token);
 * if (decoded.error) {
 *   console.error(decoded.error);
 * } else {
 *   console.log('User ID:', decoded.userId);
 * }
 *
 * // Extract from header
 * const token = extractTokenFromHeader(req.headers.authorization);
 *
 * // Check expiry
 * const isExpired = isTokenExpired(decoded);
 */
