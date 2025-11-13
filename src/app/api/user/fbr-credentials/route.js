/**
 * FBR Credentials API Routes
 * Endpoints to manage user's FBR Digital Invoicing credentials
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/user/fbr-credentials
 * Get current user's FBR credentials (without token)
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

    // Get user with FBR credentials (excluding sensitive token)
    const user = await User.findById(authResult.user.userId).select('fbrCredentials');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return FBR info without token
    const fbrInfo = {
      ntn: user.fbrCredentials?.ntn || '',
      businessName: user.fbrCredentials?.businessName || '',
      province: user.fbrCredentials?.province || '',
      provinceNumber: user.fbrCredentials?.provinceNumber || null,
      businessAddress: user.fbrCredentials?.businessAddress || '',
      gst: user.fbrCredentials?.gst || '',
      hasToken: !!user.fbrCredentials?.token,
      tokenExpiry: user.fbrCredentials?.tokenExpiry || null,
      tokenUpdatedAt: user.fbrCredentials?.tokenUpdatedAt || null,
    };

    return NextResponse.json({
      success: true,
      data: fbrInfo,
    });
  } catch (error) {
    console.error('Error fetching FBR credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FBR credentials' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/fbr-credentials
 * Update user's FBR credentials
 */
export async function PUT(request) {
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

    const body = await request.json();
    const {
      token,
      ntn,
      businessName,
      province,
      provinceNumber,
      businessAddress,
      gst,
      tokenExpiry,
    } = body;

    // Build update object
    const updateData = {
      'fbrCredentials.ntn': ntn,
      'fbrCredentials.businessName': businessName,
      'fbrCredentials.province': province,
      'fbrCredentials.provinceNumber': provinceNumber,
      'fbrCredentials.businessAddress': businessAddress,
      'fbrCredentials.gst': gst,
    };

    // Only update token if provided
    if (token) {
      updateData['fbrCredentials.token'] = token;
      updateData['fbrCredentials.tokenUpdatedAt'] = new Date();

      // Set expiry if provided, otherwise default to 1 year
      if (tokenExpiry) {
        updateData['fbrCredentials.tokenExpiry'] = new Date(tokenExpiry);
      } else {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        updateData['fbrCredentials.tokenExpiry'] = oneYearFromNow;
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      authResult.user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('fbrCredentials');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'FBR credentials updated successfully',
      data: {
        ntn: user.fbrCredentials?.ntn,
        businessName: user.fbrCredentials?.businessName,
        province: user.fbrCredentials?.province,
        provinceNumber: user.fbrCredentials?.provinceNumber,
        businessAddress: user.fbrCredentials?.businessAddress,
        gst: user.fbrCredentials?.gst,
        hasToken: !!user.fbrCredentials?.token,
        tokenExpiry: user.fbrCredentials?.tokenExpiry,
        tokenUpdatedAt: user.fbrCredentials?.tokenUpdatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating FBR credentials:', error);
    return NextResponse.json(
      { error: 'Failed to update FBR credentials' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/fbr-credentials
 * Remove user's FBR token (keep business info)
 */
export async function DELETE(request) {
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

    // Remove only the token, keep business info
    const user = await User.findByIdAndUpdate(
      authResult.user.userId,
      {
        $unset: {
          'fbrCredentials.token': '',
          'fbrCredentials.tokenExpiry': '',
          'fbrCredentials.tokenUpdatedAt': '',
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'FBR token removed successfully',
    });
  } catch (error) {
    console.error('Error removing FBR token:', error);
    return NextResponse.json(
      { error: 'Failed to remove FBR token' },
      { status: 500 }
    );
  }
}
