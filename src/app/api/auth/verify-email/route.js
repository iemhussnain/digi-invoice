/**
 * Email Verification API
 * Verifies user email with verification token
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { sendEmailVerificationSuccessEmail } from '@/utils/email';
import crypto from 'crypto';

/**
 * GET - Verify Email with Token
 * User clicks link in verification email
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    logger.info('Email verification attempt');

    // ========================================
    // Step 1: Validate Token
    // ========================================

    if (!token) {
      return errorResponse('Verification token is required', 400);
    }

    if (token.length !== 64) {
      // Token should be 64 hex characters
      return errorResponse('Invalid verification token format', 400);
    }

    // ========================================
    // Step 2: Hash Token and Find User
    // ========================================

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      isDeleted: false,
    }).select('+emailVerificationToken');

    if (!user) {
      logger.warning('Email verification - invalid token');

      return errorResponse(
        'Invalid verification token',
        400,
        {
          message: 'This verification link is invalid or has already been used.',
          action: 'Please request a new verification email or contact support.',
        }
      );
    }

    // ========================================
    // Step 3: Check if Already Verified
    // ========================================

    if (user.emailVerified) {
      logger.info('Email already verified', {
        userId: user._id,
        email: user.email,
      });

      return successResponse(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            emailVerified: true,
          },
          message: 'Your email is already verified',
          alreadyVerified: true,
        },
        'Email already verified',
        200
      );
    }

    // ========================================
    // Step 4: Verify Email
    // ========================================

    user.emailVerified = true;
    user.emailVerificationToken = undefined; // Clear token after use

    await user.save();

    logger.success('Email verified successfully', {
      userId: user._id,
      email: user.email,
    });

    // ========================================
    // Step 5: Send Success Email
    // ========================================

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl}/login`;

    const emailResult = await sendEmailVerificationSuccessEmail({
      to: user.email,
      name: user.name,
      loginUrl,
    });

    if (emailResult.success) {
      logger.success('Email verification success email sent', {
        userId: user._id,
        email: user.email,
      });
    }

    // ========================================
    // Step 6: Return Response
    // ========================================

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: true,
        },
        message: 'Email verified successfully',
        next: {
          action: 'redirect',
          url: '/login',
          message: 'You can now login to your account',
        },
      },
      'Email verified successfully',
      200
    );
  } catch (error) {
    logger.error('Email verification error', error);

    return errorResponse(
      'Failed to verify email',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
