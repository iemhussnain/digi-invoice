/**
 * Get Current User API
 * Returns currently authenticated user information
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import Session from '@/models/Session';
import { successResponse, errorResponse, unauthorizedError } from '@/utils/response';
import logger from '@/utils/logger';
import { verifyToken, extractTokenFromHeader } from '@/utils/jwt';

export async function GET(request) {
  try {
    // Connect to database
    await connectDB();

    // ========================================
    // Step 1: Extract & Verify Token
    // ========================================

    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      logger.debug('Get current user - no token provided');
      return unauthorizedError('Authentication token is required');
    }

    const decoded = verifyToken(token);

    if (decoded.error) {
      logger.warning('Get current user - invalid token', { error: decoded.error });
      return unauthorizedError(decoded.error);
    }

    const { userId, sessionId } = decoded;

    // ========================================
    // Step 2: Verify Session is Active
    // ========================================

    const session = await Session.findOne({
      sessionId,
      userId,
      isActive: true,
    });

    if (!session) {
      logger.warning('Get current user - session not found or inactive', {
        userId,
        sessionId,
      });
      return unauthorizedError('Session expired or invalid');
    }

    // Check if session is expired
    if (session.isExpired) {
      logger.warning('Get current user - session expired', {
        userId,
        sessionId,
      });

      // Deactivate expired session
      await session.deactivate('token_expired');

      return unauthorizedError('Session expired. Please login again.');
    }

    // ========================================
    // Step 3: Get User Information
    // ========================================

    const user = await User.findById(userId).populate('organizationId');

    if (!user) {
      logger.error('Get current user - user not found', { userId });
      return errorResponse('User not found', 404);
    }

    // Check if user is still active
    if (user.status !== 'active' || user.isDeleted) {
      logger.warning('Get current user - user not active', {
        userId,
        status: user.status,
        isDeleted: user.isDeleted,
      });

      // Deactivate session
      await session.deactivate('user_inactive');

      return unauthorizedError('User account is not active');
    }

    // ========================================
    // Step 4: Update Session Activity
    // ========================================

    // Update last activity timestamp
    await session.updateActivity();

    // ========================================
    // Step 5: Return User Data
    // ========================================

    logger.debug('Get current user successful', {
      userId: user._id,
      email: user.email,
    });

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          department: user.department,
          status: user.status,
          twoFactorEnabled: user.twoFactorEnabled,
          preferences: user.preferences,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          lastLoginIP: user.lastLoginIP,
        },
        organization: {
          id: user.organizationId._id,
          name: user.organizationId.name,
          slug: user.organizationId.slug,
          email: user.organizationId.email,
          phone: user.organizationId.phone,
          logo: user.organizationId.logo,
          address: user.organizationId.address,
          subscription: {
            plan: user.organizationId.subscription.plan,
            status: user.organizationId.subscription.status,
            startDate: user.organizationId.subscription.startDate,
            endDate: user.organizationId.subscription.endDate,
            maxUsers: user.organizationId.subscription.maxUsers,
            features: user.organizationId.subscription.features,
          },
          settings: user.organizationId.settings,
        },
        session: {
          sessionId: session.sessionId,
          loginAt: session.loginAt,
          lastActivity: session.lastActivity,
          expiresAt: session.expiresAt,
          timeUntilExpiry: session.timeUntilExpiry, // seconds
          device: {
            type: session.device.type,
            browser: session.device.browser,
            os: session.device.os,
          },
          ipAddress: session.ipAddress,
          location: session.location,
        },
      },
      'User data retrieved successfully',
      200
    );
  } catch (error) {
    logger.error('Get current user error', error);

    return errorResponse(
      'Failed to get user data',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
