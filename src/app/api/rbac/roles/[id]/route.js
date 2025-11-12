/**
 * Individual Role Management API
 * GET /api/rbac/roles/[id] - Get role details
 * PUT /api/rbac/roles/[id] - Update role
 * DELETE /api/rbac/roles/[id] - Delete role
 */

import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import User from '@/models/User';
import Permission from '@/models/Permission';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAdmin } from '@/middleware/auth';

/**
 * GET /api/rbac/roles/[id]
 * Get role details with permissions
 */
export async function GET(request, { params }) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      logger.info('Get role details', {
        userId: request.userId,
        roleId: id,
      });

      // Get role with permissions
      const role = await Role.findOne({
        _id: id,
        isDeleted: false,
      }).populate('permissions');

      if (!role) {
        return errorResponse('Role not found', 404);
      }

      // Check if user has access to this role
      if (!role.isSystem && role.organizationId?.toString() !== request.organizationId.toString()) {
        return errorResponse('Access denied. You can only view roles in your organization.', 403);
      }

      // Get users with this role (for custom roles with roleId)
      let usersWithRole = [];
      if (role.organizationId) {
        usersWithRole = await User.find({
          roleId: role._id,
          organizationId: request.organizationId,
          isDeleted: false,
        }).select('_id name email avatar status');
      } else {
        // For system roles, count by legacy role field
        usersWithRole = await User.find({
          role: role.key,
          organizationId: request.organizationId,
          isDeleted: false,
        }).select('_id name email avatar status');
      }

      return successResponse({
        role: {
          id: role._id,
          name: role.name,
          key: role.key,
          description: role.description,
          isSystem: role.isSystem,
          isCustom: !role.isSystem && role.organizationId !== null,
          level: role.level,
          color: role.color,
          icon: role.icon,
          userCount: usersWithRole.length,
          permissions: role.permissions,
          users: usersWithRole,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        },
      }, 'Role retrieved successfully');
    } catch (error) {
      logger.error('Get role error', error);

      return errorResponse(
        'Failed to retrieve role',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/rbac/roles/[id]
 * Update role (custom roles only)
 */
export async function PUT(request, { params }) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();
      const { name, description, permissions, color, icon, level } = body;

      logger.info('Update role request', {
        userId: request.userId,
        roleId: id,
      });

      // ========================================
      // Step 1: Get Role
      // ========================================

      const role = await Role.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!role) {
        return errorResponse('Role not found', 404);
      }

      // ========================================
      // Step 2: Security Checks
      // ========================================

      // Cannot update system roles
      if (role.isSystem) {
        return errorResponse('System roles cannot be modified', 403);
      }

      // Can only update roles in own organization
      if (role.organizationId?.toString() !== request.organizationId.toString()) {
        return errorResponse('Access denied. You can only update roles in your organization.', 403);
      }

      // ========================================
      // Step 3: Validate Input
      // ========================================

      if (name) {
        if (name.length < 2 || name.length > 50) {
          return validationError({ name: 'Role name must be between 2 and 50 characters' });
        }

        // Check for duplicate name
        const duplicate = await Role.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          organizationId: request.organizationId,
          isDeleted: false,
        });

        if (duplicate) {
          return errorResponse('A role with this name already exists', 400);
        }
      }

      if (description && description.length > 500) {
        return validationError({ description: 'Description cannot exceed 500 characters' });
      }

      if (level && (level < 1 || level > 89)) {
        return validationError({ level: 'Level must be between 1 and 89' });
      }

      // ========================================
      // Step 4: Validate Permissions (if provided)
      // ========================================

      if (permissions && Array.isArray(permissions)) {
        const permissionDocs = await Permission.find({
          _id: { $in: permissions },
          isActive: true,
        });

        if (permissionDocs.length !== permissions.length) {
          return validationError({ permissions: 'One or more invalid permission IDs' });
        }
      }

      // ========================================
      // Step 5: Update Role
      // ========================================

      if (name) role.name = name;
      if (description !== undefined) role.description = description;
      if (permissions) role.permissions = permissions;
      if (color) role.color = color;
      if (icon) role.icon = icon;
      if (level) role.level = level;

      await role.save();

      // Populate permissions
      await role.populate('permissions');

      logger.success('Role updated', {
        roleId: role._id,
        roleName: role.name,
        organizationId: request.organizationId,
      });

      // ========================================
      // Step 6: Return Response
      // ========================================

      return successResponse({
        role: {
          id: role._id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          isCustom: true,
          level: role.level,
          color: role.color,
          icon: role.icon,
          userCount: role.userCount,
          permissionCount: role.permissions.length,
          permissions: role.permissions,
          updatedAt: role.updatedAt,
        },
      }, 'Role updated successfully');
    } catch (error) {
      logger.error('Update role error', error);

      return errorResponse(
        'Failed to update role',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE /api/rbac/roles/[id]
 * Delete role (custom roles only)
 */
export async function DELETE(request, { params }) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      logger.info('Delete role request', {
        userId: request.userId,
        roleId: id,
      });

      // ========================================
      // Step 1: Get Role
      // ========================================

      const role = await Role.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!role) {
        return errorResponse('Role not found', 404);
      }

      // ========================================
      // Step 2: Security Checks
      // ========================================

      // Cannot delete system roles
      if (role.isSystem) {
        return errorResponse('System roles cannot be deleted', 403);
      }

      // Can only delete roles in own organization
      if (role.organizationId?.toString() !== request.organizationId.toString()) {
        return errorResponse('Access denied. You can only delete roles in your organization.', 403);
      }

      // ========================================
      // Step 3: Check if Role is in Use
      // ========================================

      const usersWithRole = await User.countDocuments({
        roleId: role._id,
        organizationId: request.organizationId,
        isDeleted: false,
      });

      if (usersWithRole > 0) {
        return errorResponse(
          `Cannot delete role. ${usersWithRole} user(s) are assigned to this role. Please reassign them first.`,
          400,
          {
            usersCount: usersWithRole,
            message: 'Reassign users to another role before deleting.',
          }
        );
      }

      // ========================================
      // Step 4: Soft Delete Role
      // ========================================

      role.isDeleted = true;
      role.deletedAt = new Date();
      role.deletedBy = request.userId;
      role.isActive = false;

      await role.save();

      logger.success('Role deleted', {
        roleId: role._id,
        roleName: role.name,
        organizationId: request.organizationId,
      });

      return successResponse(
        {
          deletedRole: {
            id: role._id,
            name: role.name,
          },
        },
        'Role deleted successfully'
      );
    } catch (error) {
      logger.error('Delete role error', error);

      return errorResponse(
        'Failed to delete role',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
