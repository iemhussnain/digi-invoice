/**
 * Forgot Password API
 * Generates password reset token and sends email
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { validateEmail } from '@/utils/validators';
import { sendPasswordResetEmail } from '@/utils/email';
import crypto from 'crypto';

/**
 * POST - Request Password Reset
 * Generates reset token and sends email to user
 */
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    logger.info('Forgot password request', { email });

    // ========================================
    // Step 1: Validate Email
    // ========================================

    const errors = {};

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }

    if (Object.keys(errors).length > 0) {
      logger.warning('Forgot password validation failed', { errors });
      return validationError(errors);
    }

    // ========================================
    // Step 2: Find User
    // ========================================

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isDeleted: false,
    });

    // SECURITY: Always return success even if user not found
    // This prevents email enumeration attacks
    if (!user) {
      logger.info('Forgot password - user not found (returning success)', { email });

      // Return success to prevent email enumeration
      return successResponse(
        {
          message: 'If an account exists with this email, you will receive a password reset link.',
          email,
          sent: false, // Internal flag (don't expose to client)
        },
        'Password reset email sent (if account exists)',
        200
      );
    }

    // Check if user account is active
    if (user.status !== 'active') {
      logger.warning('Forgot password - user account not active', {
        email,
        status: user.status,
      });

      // Still return success to prevent account status enumeration
      return successResponse(
        {
          message: 'If an account exists with this email, you will receive a password reset link.',
          email,
          sent: false,
        },
        'Password reset email sent (if account exists)',
        200
      );
    }

    // ========================================
    // Step 3: Generate Reset Token
    // ========================================

    // Generate random token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before storing in database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token expiry (1 hour from now)
    const expiryMinutes = 60;
    const resetExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save to database
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = resetExpires;

    await user.save();

    logger.success('Password reset token generated', {
      userId: user._id,
      email: user.email,
      expiresAt: resetExpires,
    });

    // ========================================
    // Step 4: Send Reset Email
    // ========================================

    // Build reset URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    // Send email
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      resetToken,
      expiryMinutes,
    });

    if (emailResult.success) {
      logger.success('Password reset email sent', {
        userId: user._id,
        email: user.email,
        messageId: emailResult.messageId,
      });
    } else {
      logger.error('Failed to send password reset email', {
        userId: user._id,
        email: user.email,
        error: emailResult.error,
      });
    }

    // ========================================
    // Step 5: Return Response
    // ========================================

    return successResponse(
      {
        message: 'If an account exists with this email, you will receive a password reset link.',
        email,
        sent: true,
        expiresIn: `${expiryMinutes} minutes`,
        // Only include in development mode
        ...(process.env.NODE_ENV === 'development' && {
          dev: {
            resetUrl,
            resetToken,
            expiresAt: resetExpires,
            note: 'Reset URL is only shown in development mode',
          },
        }),
      },
      'Password reset email sent',
      200
    );
  } catch (error) {
    logger.error('Forgot password error', error);

    return errorResponse(
      'Failed to process password reset request',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
