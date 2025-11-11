/**
 * Resend Email Verification API
 * Sends new verification email to user
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { validateEmail } from '@/utils/validators';
import { sendEmailVerificationEmail } from '@/utils/email';
import crypto from 'crypto';

/**
 * POST - Resend Verification Email
 * User requests a new verification email
 */
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    logger.info('Resend verification email request', { email });

    // ========================================
    // Step 1: Validate Email
    // ========================================

    const errors = {};

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }

    if (Object.keys(errors).length > 0) {
      logger.warning('Resend verification validation failed', { errors });
      return validationError(errors);
    }

    // ========================================
    // Step 2: Find User
    // ========================================

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isDeleted: false,
    });

    // Security: Always return success even if user not found
    // Prevents email enumeration attacks
    if (!user) {
      logger.info('Resend verification - user not found (returning success)', { email });

      return successResponse(
        {
          message: 'If an account exists with this email and is not verified, a verification email has been sent.',
          email,
          sent: false, // Internal flag
        },
        'Verification email sent (if account exists)',
        200
      );
    }

    // ========================================
    // Step 3: Check if Already Verified
    // ========================================

    if (user.emailVerified) {
      logger.info('Resend verification - email already verified', {
        userId: user._id,
        email: user.email,
      });

      return successResponse(
        {
          message: 'Your email is already verified. You can login to your account.',
          email,
          alreadyVerified: true,
        },
        'Email already verified',
        200
      );
    }

    // Check if user account is active
    if (user.status !== 'active') {
      logger.warning('Resend verification - user account not active', {
        userId: user._id,
        status: user.status,
      });

      // Still return success to prevent account status enumeration
      return successResponse(
        {
          message: 'If an account exists with this email and is not verified, a verification email has been sent.',
          email,
          sent: false,
        },
        'Verification email sent (if account exists)',
        200
      );
    }

    // ========================================
    // Step 4: Generate New Verification Token
    // ========================================

    // Generate random token (32 bytes = 64 hex characters)
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Hash token before storing in database
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Save to database
    user.emailVerificationToken = hashedToken;

    await user.save();

    logger.success('Email verification token generated', {
      userId: user._id,
      email: user.email,
    });

    // ========================================
    // Step 5: Send Verification Email
    // ========================================

    // Build verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    // Send email
    const emailResult = await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl,
      verifyToken: verificationToken,
    });

    if (emailResult.success) {
      logger.success('Verification email sent', {
        userId: user._id,
        email: user.email,
        messageId: emailResult.messageId,
      });
    } else {
      logger.error('Failed to send verification email', {
        userId: user._id,
        email: user.email,
        error: emailResult.error,
      });
    }

    // ========================================
    // Step 6: Return Response
    // ========================================

    return successResponse(
      {
        message: 'Verification email sent successfully. Please check your inbox.',
        email,
        sent: true,
        // Only include in development mode
        ...(process.env.NODE_ENV === 'development' && {
          dev: {
            verifyUrl,
            verificationToken,
            note: 'Verification URL is only shown in development mode',
          },
        }),
      },
      'Verification email sent',
      200
    );
  } catch (error) {
    logger.error('Resend verification email error', error);

    return errorResponse(
      'Failed to send verification email',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
