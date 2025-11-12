/**
 * Reset Password API
 * Verifies reset token and updates user password
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { validatePassword } from '@/utils/validators';
import { sendPasswordResetSuccessEmail } from '@/utils/email';
import crypto from 'crypto';

/**
 * POST - Reset Password with Token
 * Verifies token and updates password
 */
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { token, password, confirmPassword } = body;

    logger.info('Reset password attempt');

    // ========================================
    // Step 1: Validate Input
    // ========================================

    const errors = {};

    // Validate token
    if (!token) {
      errors.token = 'Reset token is required';
    } else if (token.length !== 64) {
      // Token should be 64 hex characters
      errors.token = 'Invalid reset token format';
    }

    // Validate password
    if (!password) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message;
      }
    }

    // Validate confirm password
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      logger.warning('Reset password validation failed', { errors });
      return validationError(errors);
    }

    // ========================================
    // Step 2: Hash Token and Find User
    // ========================================

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // Token not expired
      isDeleted: false,
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      logger.warning('Reset password - invalid or expired token');

      return errorResponse(
        'Invalid or expired reset token',
        400,
        {
          token: 'This password reset link is invalid or has expired. Please request a new one.',
        }
      );
    }

    // Check if user account is active
    if (user.status !== 'active') {
      logger.warning('Reset password - user account not active', {
        userId: user._id,
        status: user.status,
      });

      return errorResponse(
        'Account not active',
        403,
        {
          message: 'Your account is not active. Please contact support.',
        }
      );
    }

    // ========================================
    // Step 3: Update Password
    // ========================================

    // Set new password (will be hashed by pre-save hook)
    user.password = password;
    user.passwordChangedAt = new Date();

    // Clear reset token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Reset login attempts (in case account was locked)
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    logger.success('Password reset successful', {
      userId: user._id,
      email: user.email,
    });

    // ========================================
    // Step 4: Logout from All Devices
    // ========================================

    // Terminate all active sessions for security
    const result = await Session.deactivateAllForUser(
      user._id,
      'password_reset',
      '0.0.0.0'
    );

    logger.info('All sessions deactivated after password reset', {
      userId: user._id,
      sessionsDeactivated: result.modifiedCount,
    });

    // ========================================
    // Step 5: Send Success Email
    // ========================================

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl}/login`;

    const emailResult = await sendPasswordResetSuccessEmail({
      to: user.email,
      name: user.name,
      loginUrl,
    });

    if (emailResult.success) {
      logger.success('Password reset success email sent', {
        userId: user._id,
        email: user.email,
      });
    }

    // ========================================
    // Step 6: Return Response
    // ========================================

    return successResponse(
      {
        message: 'Password reset successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        security: {
          sessionsDeactivated: result.modifiedCount,
          requireLogin: true,
          message: 'All devices have been logged out. Please login with your new password.',
        },
        next: {
          action: 'redirect',
          url: '/login',
          message: 'Please login with your new password',
        },
      },
      'Password reset successful',
      200
    );
  } catch (error) {
    logger.error('Reset password error', error);

    return errorResponse(
      'Failed to reset password',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}

/**
 * GET - Verify Reset Token (Optional)
 * Check if reset token is valid without resetting password
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return errorResponse('Reset token is required', 400);
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      isDeleted: false,
    }).select('name email passwordResetExpires');

    if (!user) {
      return errorResponse(
        'Invalid or expired token',
        400,
        {
          valid: false,
          message: 'This password reset link is invalid or has expired.',
        }
      );
    }

    // Calculate time remaining
    const timeRemaining = Math.floor((user.passwordResetExpires - Date.now()) / 60000); // minutes

    return successResponse(
      {
        valid: true,
        user: {
          name: user.name,
          email: user.email,
        },
        tokenInfo: {
          expiresAt: user.passwordResetExpires,
          minutesRemaining: timeRemaining,
        },
        message: 'Reset token is valid',
      },
      'Token verified successfully',
      200
    );
  } catch (error) {
    logger.error('Verify reset token error', error);

    return errorResponse(
      'Failed to verify token',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
