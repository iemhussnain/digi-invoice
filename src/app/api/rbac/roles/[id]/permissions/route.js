/**
 * Role-Permission Assignment API
 * GET /api/rbac/roles/[id]/permissions - Get role permissions
 * PUT /api/rbac/roles/[id]/permissions - Update role permissions
 * POST /api/rbac/roles/[id]/permissions/add - Add permission(s) to role
 * DELETE /api/rbac/roles/[id]/permissions/remove - Remove permission(s) from role
 */

import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAdmin } from '@/middleware/auth';

/**
 * GET /api/rbac/roles/[id]/permissions
 * Get all permissions assigned to role
 */
export async function GET(request, { params }) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;

      logger.info('Get role permissions', {
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

      // Check access
      if (!role.isSystem && role.organizationId?.toString() !== request.organizationId.toString()) {
        return errorResponse('Access denied', 403);
      }

      return successResponse({
        roleId: role._id,
        roleName: role.name,
        permissions: role.permissions,
        total: role.permissions.length,
      }, 'Role permissions retrieved successfully');
    } catch (error) {
      logger.error('Get role permissions error', error);

      return errorResponse(
        'Failed to retrieve role permissions',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT /api/rbac/roles/[id]/permissions
 * Replace all role permissions (custom roles only)
 */
export async function PUT(request, { params }) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { id } = params;
      const body = await request.json();
      const { permissions } = body;

      logger.info('Update role permissions', {
        userId: request.userId,
        roleId: id,
        permissionCount: permissions?.length,
      });

      // ========================================
      // Step 1: Validate Input
      // ========================================

      if (!Array.isArray(permissions)) {
        return validationError({ permissions: 'Permissions must be an array' });
      }

      // ========================================
      // Step 2: Get Role
      // ========================================

      const role = await Role.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!role) {
        return errorResponse('Role not found', 404);
      }

      // ========================================
      // Step 3: Security Checks
      // ========================================

      // Cannot update system roles
      if (role.isSystem) {
        return errorResponse('System role permissions cannot be modified', 403);
      }

      // Can only update roles in own organization
      if (role.organizationId?.toString() !== request.organizationId.toString()) {
        return errorResponse('Access denied', 403);
      }

      // ========================================
      // Step 4: Validate Permissions
      // ========================================

      if (permissions.length > 0) {
        const permissionDocs = await Permission.find({
          _id: { $in: permissions },
          isActive: true,
        });

        if (permissionDocs.length !== permissions.length) {
          return errorResponse('One or more invalid permission IDs', 400);
        }
      }

      // ========================================
      // Step 5: Update Permissions
      // ========================================

      await role.setPermissions(permissions);
      await role.populate('permissions');

      logger.success('Role permissions updated', {
        roleId: role._id,
        roleName: role.name,
        permissionCount: role.permissions.length,
      });

      return successResponse({
        roleId: role._id,
        roleName: role.name,
        permissions: role.permissions,
        total: role.permissions.length,
        message: 'Permissions replaced successfully',
      }, 'Role permissions updated successfully');
    } catch (error) {
      logger.error('Update role permissions error', error);

      return errorResponse(
        'Failed to update role permissions',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
