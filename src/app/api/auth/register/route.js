/**
 * User Registration API
 * Handles new user registration with organization creation
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import Session from '@/models/Session';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import mongoose from 'mongoose';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateCompanyName,
  validateNTN,
  validateSTRN,
  sanitizeInput,
} from '@/utils/validators';
import { generateUserToken, generateRefreshToken } from '@/utils/jwt';
import { getDeviceInfo } from '@/utils/deviceFingerprint';
import { setAuthCookies } from '@/utils/cookies';
import { sendEmailVerificationEmail } from '@/utils/email';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    const body = await request.json();

    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      organizationType, // 'new' or 'existing'
      organizationId, // If joining existing org
      companyName, // If creating new org
      companyCity,
      companyProvince,
      companyEmail,
      companyPhone,
      ntn,
      strn,
      role, // Optional: for invited users
    } = body;

    logger.info('Registration attempt', { email });

    // ========================================
    // Step 1: Validate Required Fields
    // ========================================

    const errors = {};

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.message;
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Validate phone (optional)
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.message;
      }
    }

    // Organization validation
    if (organizationType === 'new') {
      // Creating new organization
      const companyValidation = validateCompanyName(companyName);
      if (!companyValidation.isValid) {
        errors.companyName = companyValidation.message;
      }

      if (!companyCity) {
        errors.companyCity = 'City is required';
      }

      if (!companyProvince) {
        errors.companyProvince = 'Province is required';
      }

      if (!companyEmail) {
        errors.companyEmail = 'Company email is required';
      } else {
        const companyEmailValidation = validateEmail(companyEmail);
        if (!companyEmailValidation.isValid) {
          errors.companyEmail = companyEmailValidation.message;
        }
      }

      if (!companyPhone) {
        errors.companyPhone = 'Company phone is required';
      }

      // Validate NTN (optional)
      if (ntn) {
        const ntnValidation = validateNTN(ntn);
        if (!ntnValidation.isValid) {
          errors.ntn = ntnValidation.message;
        }
      }

      // Validate STRN (optional)
      if (strn) {
        const strnValidation = validateSTRN(strn);
        if (!strnValidation.isValid) {
          errors.strn = strnValidation.message;
        }
      }
    } else if (organizationType === 'existing') {
      // Joining existing organization
      if (!organizationId) {
        errors.organizationId = 'Organization ID is required';
      }
    } else {
      errors.organizationType = 'Organization type must be "new" or "existing"';
    }

    // Return validation errors
    if (Object.keys(errors).length > 0) {
      logger.warning('Registration validation failed', { email, errors });
      return validationError(errors);
    }

    // ========================================
    // Step 2: Check if Email Already Exists
    // ========================================

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
      isDeleted: false,
    });

    if (existingUser) {
      logger.warning('Registration failed - email already exists', { email });
      return errorResponse('Email already registered', 409, {
        email: 'This email is already registered. Please login instead.',
      });
    }

    // ========================================
    // Step 3: Handle Organization
    // ========================================

    let organization;

    if (organizationType === 'new') {
      // Create new organization
      logger.info('Creating new organization', { companyName });

      // Check if organization name already exists
      const existingOrg = await Organization.findOne({
        name: companyName.trim(),
        isDeleted: false,
      });

      if (existingOrg) {
        return errorResponse('Company name already exists', 409, {
          companyName: 'This company name is already registered. Please use a different name.',
        });
      }

      // Create organization (owner will be set after user creation)
      organization = await Organization.create({
        name: sanitizeInput(companyName),
        email: companyEmail.toLowerCase().trim(),
        phone: companyPhone.trim(),
        address: {
          city: sanitizeInput(companyCity),
          province: companyProvince,
          country: 'Pakistan',
        },
        ntn: ntn ? ntn.trim() : undefined,
        strn: strn ? strn.trim() : undefined,
        ownerId: new mongoose.Types.ObjectId(), // Temporary - will update later
        subscription: {
          plan: 'free',
          status: 'trial',
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          maxUsers: 5,
          features: {
            accounting: true,
            sales: true,
            purchase: true,
            inventory: false,
            payroll: false,
            crm: false,
            reports: true,
          },
        },
      });

      logger.success('Organization created', {
        organizationId: organization._id,
        name: organization.name,
      });
    } else {
      // Join existing organization
      organization = await Organization.findById(organizationId);

      if (!organization) {
        return errorResponse('Organization not found', 404, {
          organizationId: 'The specified organization does not exist.',
        });
      }

      if (organization.status !== 'active') {
        return errorResponse('Organization is not active', 403, {
          organizationId: 'This organization is not accepting new members.',
        });
      }

      // Check user limit
      const currentUserCount = await User.countDocuments({
        organizationId: organization._id,
        isDeleted: false,
      });

      if (!organization.canAddUser(currentUserCount)) {
        return errorResponse('User limit reached', 403, {
          organizationId: `This organization has reached its user limit (${organization.subscription.maxUsers} users).`,
        });
      }

      logger.info('Joining existing organization', {
        organizationId: organization._id,
        name: organization.name,
      });
    }

    // ========================================
    // Step 4: Create User
    // ========================================

    logger.info('Creating user', { email, organizationId: organization._id });

    // Determine user role
    let userRole = role || 'user';

    // If creating new organization, user becomes admin
    if (organizationType === 'new') {
      userRole = 'admin';
    }

    // Create user (password will be hashed automatically by pre-save hook)
    const user = await User.create({
      name: sanitizeInput(name),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by User model pre-save hook
      phone: phone ? phone.trim() : undefined,
      role: userRole,
      organizationId: organization._id,
      status: 'active', // Auto-active (email verification can be added later)
    });

    logger.success('User created', {
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // ========================================
    // Step 4.5: Generate & Send Email Verification
    // ========================================

    // Generate cryptographically secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Save hashed token to user
    user.emailVerificationToken = hashedVerificationToken;
    user.emailVerified = false; // Explicitly set to false
    await user.save();

    // Generate verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    // Send verification email
    const emailResult = await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl,
      verifyToken: verificationToken,
    });

    if (emailResult.success) {
      logger.success('Email verification sent', {
        userId: user._id,
        email: user.email,
      });
    } else {
      logger.warning('Email verification failed to send', {
        userId: user._id,
        email: user.email,
        error: emailResult.error,
      });
    }

    // Update organization owner (if new organization)
    if (organizationType === 'new') {
      organization.ownerId = user._id;
      organization.stats.totalUsers = 1;
      await organization.save();

      logger.info('Organization owner updated', {
        organizationId: organization._id,
        ownerId: user._id,
      });
    } else {
      // Increment user count for existing organization
      organization.stats.totalUsers += 1;
      await organization.save();
    }

    // ========================================
    // Step 5: Create Session & Generate Token
    // ========================================

    // Get device information
    const deviceInfo = getDeviceInfo(request);

    // Generate unique session ID
    const sessionId = `sess_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;

    // Create session
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

    logger.success('Session created', {
      sessionId: session.sessionId,
      userId: user._id,
    });

    // Generate JWT tokens
    const token = generateUserToken(user, session.sessionId);
    const refreshToken = generateRefreshToken(user);

    // ========================================
    // Step 6: Return Response with Cookies
    // ========================================

    logger.success('Registration successful', {
      userId: user._id,
      email: user.email,
      organizationId: organization._id,
    });

    // Create response with cookies
    const response = NextResponse.json(
      {
        success: true,
        message:
          organizationType === 'new'
            ? 'Registration successful! Your organization has been created. Please check your email to verify your account.'
            : 'Registration successful! You have joined the organization. Please check your email to verify your account.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            status: user.status,
            emailVerified: user.emailVerified,
          },
          organization: {
            id: organization._id,
            name: organization.name,
            slug: organization.slug,
            subscription: {
              plan: organization.subscription.plan,
              status: organization.subscription.status,
              endDate: organization.subscription.endDate,
            },
          },
          session: {
            sessionId: session.sessionId,
            expiresAt: session.expiresAt,
            device: `${deviceInfo.browser} on ${deviceInfo.os}`,
          },
          emailVerification: {
            sent: emailResult.success,
            email: user.email,
            message: emailResult.success
              ? 'Verification email sent. Please check your inbox.'
              : 'Failed to send verification email. You can request a new one later.',
          },
          token,
          refreshToken,
        },
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookies
    setAuthCookies(response, token, refreshToken);

    return response;
  } catch (error) {
    logger.error('Registration error', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(
        'Duplicate entry',
        409,
        { [field]: `This ${field} is already registered.` }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach((key) => {
        validationErrors[key] = error.errors[key].message;
      });
      return validationError(validationErrors);
    }

    return errorResponse(
      'Registration failed',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
