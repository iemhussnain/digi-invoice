/**
 * Individual User Management APIs
 * Admin can view, update, and delete specific users
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAdmin } from '@/middleware/auth';
import { validateName, validatePhone } from '@/utils/validators';
import mongoose from 'mongoose';

/**
 * GET - Get Single User Details
 * Admin can view any user in their organization
 */
export async function GET(request, { params }) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid user ID', 400);
      }

      // Find user (must be in same organization)
      const user = await User.findOne({
        _id: id,
        organizationId: request.organizationId,
        isDeleted: false,
      })
        .select('-password -__v')
        .populate('organizationId', 'name slug');

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Get active sessions for this user
      const activeSessions = await Session.find({
        userId: user._id,
        isActive: true,
      }).select('device ipAddress loginAt lastActivity');

      logger.info('Get user details', {
        adminId: request.userId,
        userId: user._id,
      });

      return successResponse(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            department: user.department,
            status: user.status,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
            lastLogin: user.lastLogin,
            lastLoginIP: user.lastLoginIP,
            loginAttempts: user.loginAttempts,
            lockUntil: user.lockUntil,
            preferences: user.preferences,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            organization: {
              id: user.organizationId._id,
              name: user.organizationId.name,
              slug: user.organizationId.slug,
            },
          },
          activeSessions: activeSessions.map((session) => ({
            device: `${session.device.browser} on ${session.device.os}`,
            ipAddress: session.ipAddress,
            loginAt: session.loginAt,
            lastActivity: session.lastActivity,
          })),
        },
        'User details retrieved successfully',
        200
      );
    } catch (error) {
      logger.error('Get user details error', error);
      return errorResponse(
        'Failed to retrieve user details',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT - Update User
 * Admin can update user details
 */
export async function PUT(request, { params }) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();
      const { name, phone, department, status } = body;

      logger.info('Update user attempt', {
        adminId: request.userId,
        userId: id,
      });

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid user ID', 400);
      }

      // ========================================
      // Step 1: Find User
      // ========================================

      const user = await User.findOne({
        _id: id,
        organizationId: request.organizationId,
        isDeleted: false,
      });

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Prevent editing super_admin (unless you are super_admin)
      if (user.role === 'super_admin' && request.user.role !== 'super_admin') {
        return errorResponse(
          'Cannot edit super admin',
          403,
          { message: 'Only super admin can edit super admin users' }
        );
      }

      // ========================================
      // Step 2: Validate Input
      // ========================================

      const errors = {};

      // Validate name
      if (name !== undefined) {
        const nameValidation = validateName(name);
        if (!nameValidation.isValid) {
          errors.name = nameValidation.message;
        }
      }

      // Validate phone
      if (phone !== undefined && phone !== '') {
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.isValid) {
          errors.phone = phoneValidation.message;
        }
      }

      // Validate status
      if (status !== undefined) {
        const allowedStatuses = ['active', 'inactive', 'suspended'];
        if (!allowedStatuses.includes(status)) {
          errors.status = `Status must be one of: ${allowedStatuses.join(', ')}`;
        }
      }

      if (Object.keys(errors).length > 0) {
        logger.warning('Update user validation failed', { errors });
        return validationError(errors);
      }

      // ========================================
      // Step 3: Update User
      // ========================================

      // Update fields if provided
      if (name !== undefined) user.name = name.trim();
      if (phone !== undefined) user.phone = phone ? phone.trim() : null;
      if (department !== undefined) user.department = department ? department.trim() : null;
      if (status !== undefined) user.status = status;

      user.updatedBy = request.userId;

      await user.save();

      logger.success('User updated by admin', {
        adminId: request.userId,
        userId: user._id,
        updates: { name, phone, department, status },
      });

      // If user is suspended/inactive, deactivate all sessions
      if (status === 'suspended' || status === 'inactive') {
        await Session.deactivateAllForUser(user._id, `user_${status}_by_admin`);
        logger.info('User sessions deactivated', {
          userId: user._id,
          reason: `user_${status}_by_admin`,
        });
      }

      // ========================================
      // Step 4: Return Response
      // ========================================

      return successResponse(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            department: user.department,
            status: user.status,
            avatar: user.avatar,
            updatedAt: user.updatedAt,
          },
        },
        'User updated successfully',
        200
      );
    } catch (error) {
      logger.error('Update user error', error);
      return errorResponse(
        'Failed to update user',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE - Delete User (Soft Delete)
 * Admin can remove users from organization
 */
export async function DELETE(request, { params }) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      logger.info('Delete user attempt', {
        adminId: request.userId,
        userId: id,
      });

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid user ID', 400);
      }

      // ========================================
      // Step 1: Find User
      // ========================================

      const user = await User.findOne({
        _id: id,
        organizationId: request.organizationId,
        isDeleted: false,
      });

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // ========================================
      // Step 2: Prevent Self-Deletion
      // ========================================

      if (user._id.toString() === request.userId.toString()) {
        return errorResponse(
          'Cannot delete yourself',
          403,
          { message: 'You cannot delete your own account' }
        );
      }

      // ========================================
      // Step 3: Prevent Deleting Super Admin
      // ========================================

      if (user.role === 'super_admin') {
        return errorResponse(
          'Cannot delete super admin',
          403,
          { message: 'Super admin users cannot be deleted' }
        );
      }

      // Only super_admin can delete admin users
      if (user.role === 'admin' && request.user.role !== 'super_admin') {
        return errorResponse(
          'Cannot delete admin',
          403,
          { message: 'Only super admin can delete admin users' }
        );
      }

      // ========================================
      // Step 4: Soft Delete User
      // ========================================

      user.isDeleted = true;
      user.deletedAt = new Date();
      user.deletedBy = request.userId;
      user.status = 'inactive';

      await user.save();

      // ========================================
      // Step 5: Deactivate All Sessions
      // ========================================

      await Session.deactivateAllForUser(user._id, 'user_deleted_by_admin');

      logger.success('User deleted by admin', {
        adminId: request.userId,
        userId: user._id,
        userEmail: user.email,
      });

      // ========================================
      // Step 6: Return Response
      // ========================================

      return successResponse(
        {
          userId: user._id,
          email: user.email,
          deletedAt: user.deletedAt,
        },
        'User deleted successfully',
        200
      );
    } catch (error) {
      logger.error('Delete user error', error);
      return errorResponse(
        'Failed to delete user',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
