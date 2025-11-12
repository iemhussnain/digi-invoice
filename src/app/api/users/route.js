/**
 * User Management APIs
 * Admin can manage users in their organization
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAdmin } from '@/middleware/auth';
import {
  validateEmail,
  validateName,
  validatePhone,
  validatePassword,
} from '@/utils/validators';
import { NextResponse } from 'next/server';

/**
 * GET - Get All Users in Organization
 * Only admin and super_admin can access
 */
export async function GET(request) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const role = searchParams.get('role') || '';
      const status = searchParams.get('status') || '';

      // Build query
      const query = {
        organizationId: request.organizationId,
        isDeleted: false,
      };

      // Add search filter (name or email)
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      // Add role filter
      if (role) {
        query.role = role;
      }

      // Add status filter
      if (status) {
        query.status = status;
      }

      // Get total count
      const total = await User.countDocuments(query);

      // Get paginated users
      const users = await User.find(query)
        .select('-password -__v')
        .populate('organizationId', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      logger.info('Get all users', {
        adminId: request.userId,
        organizationId: request.organizationId,
        total,
        page,
        limit,
      });

      return successResponse(
        {
          users: users.map((user) => ({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            department: user.department,
            status: user.status,
            avatar: user.avatar,
            lastLogin: user.lastLogin,
            lastLoginIP: user.lastLoginIP,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
          filters: {
            search,
            role,
            status,
          },
        },
        'Users retrieved successfully',
        200
      );
    } catch (error) {
      logger.error('Get users error', error);
      return errorResponse(
        'Failed to retrieve users',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST - Create New User (Admin adds team member)
 * Only admin and super_admin can create users
 */
export async function POST(request) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();
      const { name, email, password, phone, role, department } = body;

      logger.info('Create user attempt', {
        adminId: request.userId,
        newUserEmail: email,
        role,
      });

      // ========================================
      // Step 1: Validate Input
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

      // Validate phone (optional)
      if (phone) {
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.isValid) {
          errors.phone = phoneValidation.message;
        }
      }

      // Validate role
      const allowedRoles = ['user', 'accountant', 'sales', 'manager'];
      if (!role) {
        errors.role = 'Role is required';
      } else if (!allowedRoles.includes(role)) {
        errors.role = `Role must be one of: ${allowedRoles.join(', ')}`;
      }

      // Super admin cannot be created by regular admin
      if (role === 'super_admin') {
        errors.role = 'Cannot create super admin user';
      }

      // Only super_admin can create admin
      if (role === 'admin' && request.user.role !== 'super_admin') {
        errors.role = 'Only super admin can create admin users';
      }

      if (Object.keys(errors).length > 0) {
        logger.warning('Create user validation failed', { errors });
        return validationError(errors);
      }

      // ========================================
      // Step 2: Check Organization Limits
      // ========================================

      const organization = await Organization.findById(request.organizationId);

      if (!organization) {
        return errorResponse('Organization not found', 404);
      }

      // Check user limit based on subscription
      const currentUserCount = await User.countDocuments({
        organizationId: request.organizationId,
        isDeleted: false,
      });

      if (!organization.canAddUser(currentUserCount)) {
        return errorResponse(
          'User limit reached',
          403,
          {
            message: `Your ${organization.subscription.plan} plan allows maximum ${organization.subscription.maxUsers} users`,
            currentUsers: currentUserCount,
            maxUsers: organization.subscription.maxUsers,
            plan: organization.subscription.plan,
          }
        );
      }

      // ========================================
      // Step 3: Check Email Uniqueness
      // ========================================

      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
        isDeleted: false,
      });

      if (existingUser) {
        return errorResponse(
          'Email already exists',
          409,
          { email: 'This email is already registered' }
        );
      }

      // ========================================
      // Step 4: Create User
      // ========================================

      const newUser = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password, // Will be hashed automatically by pre-save hook
        phone: phone ? phone.trim() : undefined,
        role,
        department: department ? department.trim() : undefined,
        organizationId: request.organizationId,
        status: 'active',
        emailVerified: false, // Admin-created users should verify email
        createdBy: request.userId,
      });

      logger.success('User created by admin', {
        adminId: request.userId,
        newUserId: newUser._id,
        email: newUser.email,
        role: newUser.role,
      });

      // ========================================
      // Step 5: Return Response
      // ========================================

      return successResponse(
        {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            department: newUser.department,
            status: newUser.status,
            createdAt: newUser.createdAt,
          },
        },
        'User created successfully',
        201
      );
    } catch (error) {
      logger.error('Create user error', error);

      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return errorResponse(
          'Duplicate entry',
          409,
          { [field]: `This ${field} is already registered.` }
        );
      }

      return errorResponse(
        'Failed to create user',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
