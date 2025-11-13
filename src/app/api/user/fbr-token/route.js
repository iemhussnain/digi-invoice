/**
 * FBR Token API Route
 * Get user's FBR token for API authentication
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/user/fbr-token?environment=sandbox|production
 * Get current user's FBR token for specified environment
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

    // Get environment from query params (default to production)
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment') || 'production';

    if (!['sandbox', 'production'].includes(environment)) {
      return NextResponse.json(
        { error: 'Invalid environment. Must be either "sandbox" or "production"' },
        { status: 400 }
      );
    }

    // Get user with FBR tokens (explicitly select them)
    const user = await User.findById(authResult.user.userId).select(
      '+fbrCredentials.sandboxToken +fbrCredentials.productionToken fbrCredentials'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine which token to use based on environment
    const token = environment === 'sandbox'
      ? user.fbrCredentials?.sandboxToken
      : user.fbrCredentials?.productionToken;

    const tokenExpiry = environment === 'sandbox'
      ? user.fbrCredentials?.sandboxTokenExpiry
      : user.fbrCredentials?.productionTokenExpiry;

    const tokenUpdatedAt = environment === 'sandbox'
      ? user.fbrCredentials?.sandboxTokenUpdatedAt
      : user.fbrCredentials?.productionTokenUpdatedAt;

    // Check if token exists
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: `FBR ${environment} token not configured`,
          message: `Please configure your FBR ${environment} token in settings`,
        },
        { status: 404 }
      );
    }

    // Check if token is expired
    const now = new Date();
    if (tokenExpiry && tokenExpiry < now) {
      return NextResponse.json(
        {
          success: false,
          error: `FBR ${environment} token expired`,
          message: `Your FBR ${environment} token has expired. Please update it in settings.`,
          tokenExpiry,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        token,
        environment,
        tokenExpiry,
        tokenUpdatedAt,
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
