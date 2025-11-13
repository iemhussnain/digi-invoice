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
      hasSandboxToken: !!user.fbrCredentials?.sandboxToken,
      sandboxTokenExpiry: user.fbrCredentials?.sandboxTokenExpiry || null,
      sandboxTokenUpdatedAt: user.fbrCredentials?.sandboxTokenUpdatedAt || null,
      hasProductionToken: !!user.fbrCredentials?.productionToken,
      productionTokenExpiry: user.fbrCredentials?.productionTokenExpiry || null,
      productionTokenUpdatedAt: user.fbrCredentials?.productionTokenUpdatedAt || null,
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
      sandboxToken,
      productionToken,
      ntn,
      businessName,
      province,
      provinceNumber,
      businessAddress,
      gst,
      sandboxTokenExpiry,
      productionTokenExpiry,
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

    // Only update sandbox token if provided
    if (sandboxToken) {
      updateData['fbrCredentials.sandboxToken'] = sandboxToken;
      updateData['fbrCredentials.sandboxTokenUpdatedAt'] = new Date();

      // Set expiry if provided, otherwise default to 1 year
      if (sandboxTokenExpiry) {
        updateData['fbrCredentials.sandboxTokenExpiry'] = new Date(sandboxTokenExpiry);
      } else {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        updateData['fbrCredentials.sandboxTokenExpiry'] = oneYearFromNow;
      }
    }

    // Only update production token if provided
    if (productionToken) {
      updateData['fbrCredentials.productionToken'] = productionToken;
      updateData['fbrCredentials.productionTokenUpdatedAt'] = new Date();

      // Set expiry if provided, otherwise default to 1 year
      if (productionTokenExpiry) {
        updateData['fbrCredentials.productionTokenExpiry'] = new Date(productionTokenExpiry);
      } else {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        updateData['fbrCredentials.productionTokenExpiry'] = oneYearFromNow;
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
        hasSandboxToken: !!user.fbrCredentials?.sandboxToken,
        sandboxTokenExpiry: user.fbrCredentials?.sandboxTokenExpiry,
        sandboxTokenUpdatedAt: user.fbrCredentials?.sandboxTokenUpdatedAt,
        hasProductionToken: !!user.fbrCredentials?.productionToken,
        productionTokenExpiry: user.fbrCredentials?.productionTokenExpiry,
        productionTokenUpdatedAt: user.fbrCredentials?.productionTokenUpdatedAt,
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

    // Remove both tokens, keep business info
    const user = await User.findByIdAndUpdate(
      authResult.user.userId,
      {
        $unset: {
          'fbrCredentials.sandboxToken': '',
          'fbrCredentials.sandboxTokenExpiry': '',
          'fbrCredentials.sandboxTokenUpdatedAt': '',
          'fbrCredentials.productionToken': '',
          'fbrCredentials.productionTokenExpiry': '',
          'fbrCredentials.productionTokenUpdatedAt': '',
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
      message: 'FBR tokens removed successfully',
    });
  } catch (error) {
    console.error('Error removing FBR token:', error);
    return NextResponse.json(
      { error: 'Failed to remove FBR token' },
      { status: 500 }
    );
  }
}
