/**
 * Change Password API
 * User can change their own password
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';
import { validatePassword } from '@/utils/validators';

/**
 * PATCH - Change Password
 * User changes their own password (requires current password)
 */
export async function PATCH(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();
      const { currentPassword, newPassword, confirmPassword, logoutAllDevices } = body;

      const userId = request.userId;

      logger.info('Change password attempt', { userId });

      // ========================================
      // Step 1: Validate Input
      // ========================================

      const errors = {};

      // Check current password
      if (!currentPassword) {
        errors.currentPassword = 'Current password is required';
      }

      // Check new password
      if (!newPassword) {
        errors.newPassword = 'New password is required';
      } else {
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
          errors.newPassword = passwordValidation.message;
        }
      }

      // Check confirm password
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your new password';
      } else if (newPassword && newPassword !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      // Check if new password is same as current
      if (currentPassword && newPassword && currentPassword === newPassword) {
        errors.newPassword = 'New password must be different from current password';
      }

      if (Object.keys(errors).length > 0) {
        logger.warning('Change password validation failed', { errors });
        return validationError(errors);
      }

      // ========================================
      // Step 2: Find User and Verify Current Password
      // ========================================

      // Need to select password field explicitly
      const user = await User.findById(userId).select('+password');

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        logger.warning('Change password - incorrect current password', { userId });
        return errorResponse(
          'Incorrect password',
          401,
          { currentPassword: 'Current password is incorrect' }
        );
      }

      // ========================================
      // Step 3: Update Password
      // ========================================

      // Set new password (will be hashed by pre-save hook)
      user.password = newPassword;
      user.passwordChangedAt = new Date();
      user.updatedBy = userId;

      await user.save();

      logger.success('Password changed successfully', { userId });

      // ========================================
      // Step 4: Handle Session Management
      // ========================================

      if (logoutAllDevices === true) {
        // Logout from all devices (including current)
        await Session.deactivateAllForUser(
          userId,
          'password_changed',
          request.session?.ipAddress || '0.0.0.0'
        );

        logger.info('All sessions deactivated after password change', { userId });

        return successResponse(
          {
            message: 'Password changed successfully',
            sessionInfo: {
              loggedOut: true,
              allDevices: true,
              reason: 'You have been logged out from all devices. Please login again with your new password.',
            },
          },
          'Password changed successfully. Please login again.',
          200
        );
      } else {
        // Logout from other devices only (keep current session active)
        const currentSessionId = request.sessionId;

        // Find and deactivate all sessions except current
        const result = await Session.updateMany(
          {
            userId: userId,
            sessionId: { $ne: currentSessionId },
            isActive: true,
          },
          {
            $set: {
              isActive: false,
              logoutAt: new Date(),
              logoutReason: 'password_changed_other_devices',
            },
          }
        );

        logger.info('Other sessions deactivated after password change', {
          userId,
          deactivatedCount: result.modifiedCount,
        });

        return successResponse(
          {
            message: 'Password changed successfully',
            sessionInfo: {
              loggedOut: false,
              currentDevice: 'Active',
              otherDevicesLoggedOut: result.modifiedCount,
              reason: 'Other devices have been logged out for security.',
            },
          },
          'Password changed successfully',
          200
        );
      }
    } catch (error) {
      logger.error('Change password error', error);
      return errorResponse(
        'Failed to change password',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * GET - Password Security Info
 * Returns password policy and last changed info
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const userId = request.userId;

      const user = await User.findById(userId).select('passwordChangedAt createdAt');

      if (!user) {
        return errorResponse('User not found', 404);
      }

      return successResponse(
        {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            requireSpecialChar: true,
            criteria: 'Must meet 3 out of 4 criteria',
          },
          passwordInfo: {
            lastChanged: user.passwordChangedAt || user.createdAt,
            daysSinceChange: user.passwordChangedAt
              ? Math.floor((Date.now() - user.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24))
              : Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
          },
          securityTips: [
            'Use a strong, unique password',
            'Change your password regularly',
            'Never share your password',
            'Enable two-factor authentication (coming soon)',
            'Review active sessions regularly',
          ],
        },
        'Password security information',
        200
      );
    } catch (error) {
      logger.error('Get password info error', error);
      return errorResponse(
        'Failed to retrieve password info',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
