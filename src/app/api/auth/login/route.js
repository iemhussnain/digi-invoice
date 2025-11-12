/**
 * User Login API
 * Handles user authentication with device tracking and single device enforcement
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import Session from '@/models/Session';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { validateEmail } from '@/utils/validators';
import { generateUserToken, generateRefreshToken } from '@/utils/jwt';
import { getDeviceInfo } from '@/utils/deviceFingerprint';
import { setAuthCookies } from '@/utils/cookies';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { email, password, forceLogin } = body;

    logger.info('Login attempt', { email });

    // ========================================
    // Step 1: Validate Input
    // ========================================

    const errors = {};

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }

    // Validate password
    if (!password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      logger.warning('Login validation failed', { email, errors });
      return validationError(errors);
    }

    // ========================================
    // Step 2: Find User
    // ========================================

    // Find user by email (include password field)
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isDeleted: false,
    })
      .select('+password +lockUntil +loginAttempts')
      .populate('organizationId');

    if (!user) {
      logger.warning('Login failed - user not found', { email });
      return errorResponse(
        'Invalid credentials',
        401,
        { email: 'Invalid email or password' }
      );
    }

    // ========================================
    // Step 3: Check Account Status
    // ========================================

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000); // minutes
      logger.warning('Login failed - account locked', {
        email,
        lockUntil: user.lockUntil,
      });

      return errorResponse(
        'Account temporarily locked',
        403,
        {
          message: `Too many failed login attempts. Account is locked for ${lockTimeRemaining} more minutes.`,
          lockUntil: user.lockUntil,
          remainingMinutes: lockTimeRemaining,
        }
      );
    }

    // Check account status
    if (user.status !== 'active') {
      logger.warning('Login failed - account not active', {
        email,
        status: user.status,
      });

      const statusMessages = {
        inactive: 'Your account is inactive. Please contact administrator.',
        suspended: 'Your account has been suspended. Please contact support.',
        pending: 'Your account is pending approval.',
      };

      return errorResponse(
        'Account not active',
        403,
        { message: statusMessages[user.status] || 'Account is not active' }
      );
    }

    // Check organization status
    if (!user.organizationId || user.organizationId.status !== 'active') {
      logger.warning('Login failed - organization not active', {
        email,
        organizationStatus: user.organizationId?.status,
      });

      return errorResponse(
        'Organization not active',
        403,
        { message: 'Your organization is not active. Please contact administrator.' }
      );
    }

    // Check subscription status
    if (!user.organizationId.isSubscriptionActive) {
      logger.warning('Login failed - subscription inactive', {
        email,
        subscriptionStatus: user.organizationId.subscription.status,
      });

      return errorResponse(
        'Subscription inactive',
        403,
        {
          message: 'Your organization subscription has expired. Please renew to continue.',
          subscription: {
            plan: user.organizationId.subscription.plan,
            status: user.organizationId.subscription.status,
            endDate: user.organizationId.subscription.endDate,
          },
        }
      );
    }

    // ========================================
    // Step 4: Verify Password
    // ========================================

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();

      logger.warning('Login failed - invalid password', {
        email,
        attempts: user.loginAttempts + 1,
      });

      return errorResponse(
        'Invalid credentials',
        401,
        {
          email: 'Invalid email or password',
          attemptsRemaining: Math.max(0, 5 - (user.loginAttempts + 1)),
        }
      );
    }

    // ========================================
    // Step 5: Get Device Information
    // ========================================

    const deviceInfo = getDeviceInfo(request);

    logger.debug('Device info detected', {
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      type: deviceInfo.type,
      ip: deviceInfo.ipAddress,
    });

    // ========================================
    // Step 6: Check Existing Sessions (Single Device Login)
    // ========================================

    // Find active session for this user
    const existingSession = await Session.findActiveByUser(user._id);

    if (existingSession) {
      // Check if it's the same device
      const isSameDevice = existingSession.deviceFingerprint === deviceInfo.fingerprint;

      if (!isSameDevice) {
        // Different device detected
        logger.info('Different device detected', {
          email,
          oldDevice: `${existingSession.device.browser} on ${existingSession.device.os}`,
          newDevice: `${deviceInfo.browser} on ${deviceInfo.os}`,
        });

        if (!forceLogin) {
          // Ask user if they want to force login
          return errorResponse(
            'Active session exists',
            409,
            {
              message: 'You are already logged in on another device.',
              currentDevice: {
                browser: existingSession.device.browser,
                os: existingSession.device.os,
                type: existingSession.device.type,
                loginAt: existingSession.loginAt,
                ipAddress: existingSession.ipAddress,
              },
              newDevice: {
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                type: deviceInfo.type,
              },
              action: 'Set forceLogin: true in request body to logout from previous device',
            }
          );
        } else {
          // Force logout from old device
          await existingSession.deactivate('new_device', deviceInfo.ipAddress);

          logger.info('Forced logout from old device', {
            email,
            oldSessionId: existingSession.sessionId,
          });
        }
      } else {
        // Same device - extend existing session
        await existingSession.extend(60 * 24 * 7); // 7 days

        logger.info('Extended existing session', {
          email,
          sessionId: existingSession.sessionId,
        });

        // Reset login attempts on successful login
        await user.resetLoginAttempts();

        // Update last login info
        user.lastLogin = new Date();
        user.lastLoginIP = deviceInfo.ipAddress;
        await user.save();

        // Generate new tokens with existing session
        const token = generateUserToken(user, existingSession.sessionId);
        const refreshToken = generateRefreshToken(user);

        logger.success('Login successful - session extended', {
          userId: user._id,
          email: user.email,
          sessionId: existingSession.sessionId,
        });

        // Create response with cookies
        const response = NextResponse.json(
          {
            success: true,
            message: 'Login successful - session extended',
            data: {
              user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar,
                status: user.status,
                preferences: user.preferences,
              },
              organization: {
                id: user.organizationId._id,
                name: user.organizationId.name,
                slug: user.organizationId.slug,
                subscription: {
                  plan: user.organizationId.subscription.plan,
                  status: user.organizationId.subscription.status,
                  endDate: user.organizationId.subscription.endDate,
                  features: user.organizationId.subscription.features,
                },
              },
              session: {
                sessionId: existingSession.sessionId,
                expiresAt: existingSession.expiresAt,
                device: `${deviceInfo.browser} on ${deviceInfo.os}`,
                loginAt: existingSession.loginAt,
              },
              token,
              refreshToken,
            },
          },
          { status: 200 }
        );

        // Set secure HTTP-only cookies
        setAuthCookies(response, token, refreshToken);

        return response;
      }
    }

    // ========================================
    // Step 7: Create New Session
    // ========================================

    // Generate unique session ID
    const sessionId = `sess_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;

    // Create new session
    const session = await Session.create({
      userId: user._id,
      sessionId,
      deviceFingerprint: deviceInfo.fingerprint,
      device: {
        type: deviceInfo.type,
        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,
        os: deviceInfo.os,
        osVersion: deviceInfo.osVersion,
        platform: deviceInfo.platform,
        userAgent: deviceInfo.userAgent,
      },
      ipAddress: deviceInfo.ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    logger.success('New session created', {
      sessionId: session.sessionId,
      userId: user._id,
      device: `${deviceInfo.browser} on ${deviceInfo.os}`,
    });

    // ========================================
    // Step 8: Reset Login Attempts & Update User
    // ========================================

    await user.resetLoginAttempts();

    user.lastLogin = new Date();
    user.lastLoginIP = deviceInfo.ipAddress;
    await user.save();

    // ========================================
    // Step 9: Generate JWT Tokens
    // ========================================

    const token = generateUserToken(user, session.sessionId);
    const refreshToken = generateRefreshToken(user);

    // ========================================
    // Step 10: Return Success Response with Cookies
    // ========================================

    logger.success('Login successful', {
      userId: user._id,
      email: user.email,
      role: user.role,
      sessionId: session.sessionId,
    });

    // Create response with cookies
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            avatar: user.avatar,
            department: user.department,
            status: user.status,
            preferences: user.preferences,
          },
          organization: {
            id: user.organizationId._id,
            name: user.organizationId.name,
            slug: user.organizationId.slug,
            logo: user.organizationId.logo,
            subscription: {
              plan: user.organizationId.subscription.plan,
              status: user.organizationId.subscription.status,
              endDate: user.organizationId.subscription.endDate,
              features: user.organizationId.subscription.features,
            },
            settings: user.organizationId.settings,
          },
          session: {
            sessionId: session.sessionId,
            expiresAt: session.expiresAt,
            device: `${deviceInfo.browser} on ${deviceInfo.os}`,
            ipAddress: deviceInfo.ipAddress,
            loginAt: session.loginAt,
          },
          token,
          refreshToken,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookies
    setAuthCookies(response, token, refreshToken);

    return response;
  } catch (error) {
    logger.error('Login error', error);

    return errorResponse(
      'Login failed',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
