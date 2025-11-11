/**
 * Change User Role API
 * Admin can promote/demote users within organization
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAdmin } from '@/middleware/auth';
import mongoose from 'mongoose';

/**
 * PATCH - Change User Role
 * Admin can change role of users in their organization
 */
export async function PATCH(request, { params }) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();
      const { role, reason } = body;

      logger.info('Change user role attempt', {
        adminId: request.userId,
        userId: id,
        newRole: role,
      });

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid user ID', 400);
      }

      // ========================================
      // Step 1: Validate Role
      // ========================================

      const errors = {};

      const allowedRoles = ['user', 'accountant', 'sales', 'manager', 'admin'];

      if (!role) {
        errors.role = 'Role is required';
      } else if (!allowedRoles.includes(role)) {
        errors.role = `Role must be one of: ${allowedRoles.join(', ')}`;
      }

      // Super admin role cannot be assigned
      if (role === 'super_admin') {
        errors.role = 'Cannot assign super_admin role';
      }

      // Only super_admin can assign admin role
      if (role === 'admin' && request.user.role !== 'super_admin') {
        errors.role = 'Only super admin can assign admin role';
      }

      if (Object.keys(errors).length > 0) {
        logger.warning('Change role validation failed', { errors });
        return validationError(errors);
      }

      // ========================================
      // Step 2: Find User
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
      // Step 3: Validate Role Change
      // ========================================

      // Cannot change own role
      if (user._id.toString() === request.userId.toString()) {
        return errorResponse(
          'Cannot change own role',
          403,
          { message: 'You cannot change your own role' }
        );
      }

      // Cannot change super_admin role
      if (user.role === 'super_admin') {
        return errorResponse(
          'Cannot change super admin role',
          403,
          { message: 'Super admin role cannot be changed' }
        );
      }

      // Regular admin cannot change admin roles
      if (
        user.role === 'admin' &&
        role !== 'admin' &&
        request.user.role !== 'super_admin'
      ) {
        return errorResponse(
          'Cannot demote admin',
          403,
          { message: 'Only super admin can change admin roles' }
        );
      }

      // Check if role is already the same
      if (user.role === role) {
        return errorResponse(
          'Role unchanged',
          400,
          { message: `User already has role: ${role}` }
        );
      }

      // ========================================
      // Step 4: Update Role
      // ========================================

      const oldRole = user.role;
      user.role = role;
      user.updatedBy = request.userId;

      await user.save();

      logger.success('User role changed by admin', {
        adminId: request.userId,
        userId: user._id,
        oldRole,
        newRole: role,
        reason: reason || 'No reason provided',
      });

      // ========================================
      // Step 5: Force Re-login for Security
      // ========================================

      // Deactivate all sessions to force user to re-login with new permissions
      await Session.deactivateAllForUser(
        user._id,
        'role_changed_by_admin',
        request.ipAddress || '0.0.0.0'
      );

      logger.info('User sessions deactivated after role change', {
        userId: user._id,
        reason: 'role_changed',
      });

      // ========================================
      // Step 6: Return Response
      // ========================================

      return successResponse(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            oldRole,
            newRole: role,
            updatedAt: user.updatedAt,
          },
          message: 'Role changed successfully. User must re-login to access new permissions.',
          sessionsDeactivated: true,
        },
        'User role changed successfully',
        200
      );
    } catch (error) {
      logger.error('Change role error', error);
      return errorResponse(
        'Failed to change user role',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * GET - Get Role Change History (Future Enhancement)
 * Returns history of role changes for a user
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

      // Find user
      const user = await User.findOne({
        _id: id,
        organizationId: request.organizationId,
        isDeleted: false,
      }).select('name email role createdAt updatedAt');

      if (!user) {
        return errorResponse('User not found', 404);
      }

      // Return current role info
      // Note: Role change history would require an audit log table (future enhancement)
      return successResponse(
        {
          userId: user._id,
          name: user.name,
          email: user.email,
          currentRole: user.role,
          lastUpdated: user.updatedAt,
          message: 'Role history tracking coming soon',
        },
        'User role information retrieved',
        200
      );
    } catch (error) {
      logger.error('Get role history error', error);
      return errorResponse(
        'Failed to retrieve role history',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
