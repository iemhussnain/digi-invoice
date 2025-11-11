/**
 * Refresh Token API
 * Generates new access token using refresh token
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import { successResponse, errorResponse, unauthorizedError } from '@/utils/response';
import logger from '@/utils/logger';
import { verifyToken, generateUserToken, generateRefreshToken } from '@/utils/jwt';
import { setAuthCookies, getCookie } from '@/utils/cookies';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // ========================================
    // Step 1: Get Refresh Token from Body or Cookie
    // ========================================

    let refreshToken;

    // Try to get refresh token from cookie first
    refreshToken = getCookie(request, 'refreshToken');

    // If not in cookie, try request body
    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refreshToken;
      } catch (e) {
        // Body parsing failed, no refresh token available
      }
    }

    if (!refreshToken) {
      logger.warning('Refresh token missing');
      return unauthorizedError('Refresh token is required');
    }

    // ========================================
    // Step 2: Verify Refresh Token
    // ========================================

    const decoded = verifyToken(refreshToken);

    if (decoded.error) {
      logger.warning('Refresh token invalid or expired', { error: decoded.error });
      return unauthorizedError('Invalid or expired refresh token. Please login again.');
    }

    // Check if it's a refresh token (not access token)
    if (decoded.type !== 'refresh') {
      logger.warning('Invalid token type', { type: decoded.type });
      return unauthorizedError('Invalid token type. Please provide a refresh token.');
    }

    const { userId } = decoded;

    logger.info('Refresh token request', { userId });

    // ========================================
    // Step 3: Get User & Validate
    // ========================================

    const user = await User.findById(userId).populate('organizationId');

    if (!user) {
      logger.warning('User not found for refresh token', { userId });
      return unauthorizedError('User not found. Please login again.');
    }

    // Check if user is active
    if (user.status !== 'active' || user.isDeleted) {
      logger.warning('User not active for refresh', {
        userId,
        status: user.status,
        isDeleted: user.isDeleted,
      });
      return unauthorizedError('User account is not active. Please contact administrator.');
    }

    // Check organization status
    if (!user.organizationId || user.organizationId.status !== 'active') {
      logger.warning('Organization not active for refresh', {
        userId,
        organizationStatus: user.organizationId?.status,
      });
      return unauthorizedError('Organization is not active.');
    }

    // Check subscription
    if (!user.organizationId.isSubscriptionActive) {
      logger.warning('Subscription inactive for refresh', {
        userId,
        subscriptionStatus: user.organizationId.subscription.status,
      });
      return unauthorizedError('Subscription expired. Please renew to continue.');
    }

    // ========================================
    // Step 4: Check Active Session
    // ========================================

    const activeSession = await Session.findActiveByUser(userId);

    if (!activeSession) {
      logger.warning('No active session found for refresh', { userId });
      return unauthorizedError('No active session found. Please login again.');
    }

    // Check if session is expired
    if (activeSession.isExpired) {
      logger.warning('Session expired for refresh', {
        userId,
        sessionId: activeSession.sessionId,
      });

      // Deactivate expired session
      await activeSession.deactivate('token_expired');

      return unauthorizedError('Session expired. Please login again.');
    }

    // ========================================
    // Step 5: Generate New Tokens
    // ========================================

    // Generate new access token
    const newAccessToken = generateUserToken(user, activeSession.sessionId);

    // Generate new refresh token (optional - can reuse old one)
    const newRefreshToken = generateRefreshToken(user);

    // Update session activity
    await activeSession.updateActivity();

    logger.success('Tokens refreshed successfully', {
      userId,
      sessionId: activeSession.sessionId,
    });

    // ========================================
    // Step 6: Return New Tokens with Cookies
    // ========================================

    // Create response with cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: '7d', // Access token expiry
          tokenType: 'Bearer',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookies
    setAuthCookies(response, newAccessToken, newRefreshToken);

    return response;
  } catch (error) {
    logger.error('Refresh token error', error);

    return errorResponse(
      'Token refresh failed',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
