/**
 * User Logout API
 * Handles user logout and session deactivation
 */

import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import { successResponse, errorResponse, unauthorizedError } from '@/utils/response';
import logger from '@/utils/logger';
import { verifyToken, extractTokenFromHeader } from '@/utils/jwt';
import { getIPAddress } from '@/utils/deviceFingerprint';

export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // ========================================
    // Step 1: Extract & Verify Token
    // ========================================

    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      logger.warning('Logout failed - no token provided');
      return unauthorizedError('Authentication token is required');
    }

    const decoded = verifyToken(token);

    if (decoded.error) {
      logger.warning('Logout failed - invalid token', { error: decoded.error });
      return unauthorizedError(decoded.error);
    }

    const { userId, sessionId } = decoded;

    logger.info('Logout attempt', { userId, sessionId });

    // ========================================
    // Step 2: Find Session
    // ========================================

    const session = await Session.findOne({
      sessionId,
      userId,
      isActive: true,
    });

    if (!session) {
      logger.warning('Logout - session not found or already inactive', {
        userId,
        sessionId,
      });

      // Session doesn't exist or already logged out
      // Return success anyway (idempotent operation)
      return successResponse(
        {
          message: 'Already logged out',
        },
        'Logout successful',
        200
      );
    }

    // ========================================
    // Step 3: Deactivate Session
    // ========================================

    const ipAddress = getIPAddress(request);

    await session.deactivate('user_logout', ipAddress);

    logger.success('User logged out', {
      userId,
      sessionId,
      duration: session.duration,
    });

    // ========================================
    // Step 4: Return Success Response
    // ========================================

    return successResponse(
      {
        sessionId: session.sessionId,
        logoutAt: session.logoutAt,
        sessionDuration: session.duration, // in seconds
        device: `${session.device.browser} on ${session.device.os}`,
      },
      'Logout successful',
      200
    );
  } catch (error) {
    logger.error('Logout error', error);

    return errorResponse(
      'Logout failed',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}

/**
 * Logout from all devices
 */
export async function DELETE(request) {
  try {
    // Connect to database
    await connectDB();

    // ========================================
    // Step 1: Extract & Verify Token
    // ========================================

    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return unauthorizedError('Authentication token is required');
    }

    const decoded = verifyToken(token);

    if (decoded.error) {
      return unauthorizedError(decoded.error);
    }

    const { userId } = decoded;

    logger.info('Logout from all devices attempt', { userId });

    // ========================================
    // Step 2: Deactivate All Sessions
    // ========================================

    const ipAddress = getIPAddress(request);

    const result = await Session.deactivateAllForUser(userId, 'user_logout_all', ipAddress);

    logger.success('Logged out from all devices', {
      userId,
      sessionsDeactivated: result.modifiedCount,
    });

    // ========================================
    // Step 3: Return Success Response
    // ========================================

    return successResponse(
      {
        userId,
        sessionsDeactivated: result.modifiedCount,
        logoutAt: new Date(),
      },
      `Logged out from ${result.modifiedCount} device(s)`,
      200
    );
  } catch (error) {
    logger.error('Logout all devices error', error);

    return errorResponse(
      'Logout failed',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
