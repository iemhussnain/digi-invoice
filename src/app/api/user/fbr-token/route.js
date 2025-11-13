/**
 * FBR Token API Route
 * Get user's FBR token for API authentication
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/user/fbr-token
 * Get current user's FBR token
 * This endpoint returns the sensitive token, use with caution
 */
export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user with FBR token (explicitly select it)
    const user = await User.findById(authResult.user.userId).select('+fbrCredentials.token fbrCredentials');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if token exists
    if (!user.fbrCredentials?.token) {
      return NextResponse.json(
        {
          success: false,
          error: 'FBR token not configured',
          message: 'Please configure your FBR token in settings',
        },
        { status: 404 }
      );
    }

    // Check if token is expired
    const now = new Date();
    if (user.fbrCredentials.tokenExpiry && user.fbrCredentials.tokenExpiry < now) {
      return NextResponse.json(
        {
          success: false,
          error: 'FBR token expired',
          message: 'Your FBR token has expired. Please update it in settings.',
          tokenExpiry: user.fbrCredentials.tokenExpiry,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        token: user.fbrCredentials.token,
        tokenExpiry: user.fbrCredentials.tokenExpiry,
        tokenUpdatedAt: user.fbrCredentials.tokenUpdatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching FBR token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FBR token' },
      { status: 500 }
    );
  }
}
