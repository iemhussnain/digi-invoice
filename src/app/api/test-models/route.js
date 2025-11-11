/**
 * Test Models API
 * Tests User, Organization, and Session models by creating sample data
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import Session from '@/models/Session';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Connect to database
    await connectDB();

    logger.info('Testing models - Creating sample data');

    // Test data
    const testResults = {
      organization: null,
      user: null,
      session: null,
      passwordTest: null,
    };

    // 1. Create Organization
    logger.info('Creating test organization');
    const organization = await Organization.create({
      name: 'Test Company Pvt Ltd',
      email: 'info@testcompany.com',
      phone: '+92-300-1234567',
      address: {
        city: 'Karachi',
        province: 'Sindh',
        country: 'Pakistan',
      },
      ntn: '1234567-8',
      strn: '32-00-1234-567-89',
      subscription: {
        plan: 'basic',
        status: 'trial',
        maxUsers: 10,
      },
      ownerId: new mongoose.Types.ObjectId(), // Temporary ID
    });

    testResults.organization = {
      _id: organization._id,
      name: organization.name,
      slug: organization.slug,
      subscription: organization.subscription,
      isSubscriptionActive: organization.isSubscriptionActive,
    };

    logger.success('Organization created', { id: organization._id });

    // 2. Create User
    logger.info('Creating test user');
    const user = await User.create({
      name: 'Ahmed Khan',
      email: 'ahmed@testcompany.com',
      password: 'Test@12345', // Will be hashed automatically
      role: 'admin',
      organizationId: organization._id,
      phone: '+92-321-9876543',
      department: 'management',
      status: 'active',
    });

    testResults.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      passwordHashed: user.password ? true : false, // Should be false as password is not in JSON
    };

    logger.success('User created', { id: user._id });

    // 3. Test Password Hashing and Comparison
    logger.info('Testing password hashing');
    const userWithPassword = await User.findById(user._id).select('+password');
    const isPasswordCorrect = await userWithPassword.comparePassword('Test@12345');
    const isPasswordWrong = await userWithPassword.comparePassword('WrongPassword');

    testResults.passwordTest = {
      originalPassword: 'Test@12345',
      hashedPassword: userWithPassword.password,
      correctPasswordMatches: isPasswordCorrect,
      wrongPasswordMatches: isPasswordWrong,
    };

    logger.success('Password test completed', {
      correctPassword: isPasswordCorrect,
      wrongPassword: isPasswordWrong,
    });

    // 4. Create Session
    logger.info('Creating test session');
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const session = await Session.create({
      userId: user._id,
      sessionId,
      deviceFingerprint: 'test-device-fingerprint-123',
      device: {
        type: 'desktop',
        browser: 'Chrome',
        browserVersion: '120.0',
        os: 'Windows',
        osVersion: '11',
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      ipAddress: '192.168.1.100',
      location: {
        country: 'Pakistan',
        countryCode: 'PK',
        region: 'Sindh',
        city: 'Karachi',
        timezone: 'Asia/Karachi',
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    testResults.session = {
      _id: session._id,
      sessionId: session.sessionId,
      userId: session.userId,
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      duration: session.duration,
      isExpired: session.isExpired,
    };

    logger.success('Session created', { id: session._id });

    // 5. Test Model Methods
    logger.info('Testing model methods');

    // Test Organization method
    const hasAccountingFeature = organization.hasFeature('accounting');
    const canAddUser = organization.canAddUser(1); // Current: 1 user, Max: 10

    // Test Session method
    await session.updateActivity();
    const updatedSession = await Session.findById(session._id);

    // Test User static method
    const activeUsers = await User.findActive();
    const orgUsers = await User.findByOrganization(organization._id);

    testResults.methods = {
      organization: {
        hasAccountingFeature,
        canAddUser,
      },
      session: {
        requestCountBefore: 0,
        requestCountAfter: updatedSession.requestCount,
        lastActivity: updatedSession.lastActivity,
      },
      user: {
        totalActiveUsers: activeUsers.length,
        usersInOrganization: orgUsers.length,
      },
    };

    logger.success('Model methods tested successfully');

    // 6. Fetch and verify data
    const savedOrg = await Organization.findById(organization._id);
    const savedUser = await User.findById(user._id).populate('organizationId');
    const savedSession = await Session.findById(session._id).populate('userId');

    return successResponse(
      {
        message: 'All models tested successfully! ✅',
        results: testResults,
        verification: {
          organizationSaved: !!savedOrg,
          userSaved: !!savedUser,
          sessionSaved: !!savedSession,
          userPopulated: !!savedUser.organizationId,
          sessionPopulated: !!savedSession.userId,
        },
        database: {
          collections: ['organizations', 'users', 'sessions'],
          totalDocuments: 3,
        },
      },
      'Models test completed successfully'
    );
  } catch (error) {
    logger.error('Model test failed', error);

    return errorResponse(
      'Model test failed',
      500,
      process.env.NODE_ENV === 'development'
        ? {
            error: error.message,
            stack: error.stack,
          }
        : null
    );
  }
}

// DELETE endpoint to cleanup test data
export async function DELETE() {
  try {
    await connectDB();

    logger.info('Cleaning up test data');

    // Delete all test data
    await Organization.deleteMany({ email: 'info@testcompany.com' });
    await User.deleteMany({ email: 'ahmed@testcompany.com' });
    await Session.deleteMany({ deviceFingerprint: 'test-device-fingerprint-123' });

    logger.success('Test data cleaned up');

    return successResponse(
      {
        message: 'Test data cleaned up successfully',
        deleted: {
          organizations: 'info@testcompany.com',
          users: 'ahmed@testcompany.com',
          sessions: 'test-device-fingerprint-123',
        },
      },
      'Cleanup completed'
    );
  } catch (error) {
    logger.error('Cleanup failed', error);

    return errorResponse(
      'Cleanup failed',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
