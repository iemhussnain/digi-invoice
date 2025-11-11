/**
 * Roles Management API
 * GET /api/rbac/roles - List all roles (system + custom for organization)
 * POST /api/rbac/roles - Create custom role
 */

import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import Permission from '@/models/Permission';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAdmin } from '@/middleware/auth';

/**
 * GET /api/rbac/roles
 * Get all roles (system + organization-specific custom roles)
 */
export async function GET(request) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const includePermissions = searchParams.get('includePermissions') === 'true';
      const type = searchParams.get('type'); // 'system' or 'custom'

      logger.info('Get roles request', {
        userId: request.userId,
        organizationId: request.organizationId,
        includePermissions,
        type,
      });

      // Build query
      let query = {
        isDeleted: false,
        isActive: true,
      };

      if (type === 'system') {
        query.isSystem = true;
      } else if (type === 'custom') {
        query.isSystem = false;
        query.organizationId = request.organizationId;
      } else {
        // Get both system and organization custom roles
        query = {
          $or: [{ isSystem: true }, { organizationId: request.organizationId }],
          isDeleted: false,
          isActive: true,
        };
      }

      // Get roles
      let rolesQuery = Role.find(query).sort({ level: -1, name: 1 });

      if (includePermissions) {
        rolesQuery = rolesQuery.populate('permissions');
      }

      const roles = await rolesQuery;

      // Transform roles for response
      const rolesData = roles.map((role) => ({
        id: role._id,
        name: role.name,
        key: role.key,
        description: role.description,
        isSystem: role.isSystem,
        isCustom: !role.isSystem && role.organizationId !== null,
        level: role.level,
        color: role.color,
        icon: role.icon,
        userCount: role.userCount,
        permissionCount: role.permissions.length,
        permissions: includePermissions ? role.permissions : undefined,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));

      return successResponse(
        {
          roles: rolesData,
          total: rolesData.length,
          system: rolesData.filter((r) => r.isSystem).length,
          custom: rolesData.filter((r) => r.isCustom).length,
        },
        'Roles retrieved successfully'
      );
    } catch (error) {
      logger.error('Get roles error', error);

      return errorResponse(
        'Failed to retrieve roles',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * POST /api/rbac/roles
 * Create custom role for organization
 */
export async function POST(request) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();
      const { name, description, permissions, color, icon, level } = body;

      logger.info('Create role request', {
        userId: request.userId,
        organizationId: request.organizationId,
        roleName: name,
      });

      // ========================================
      // Step 1: Validate Input
      // ========================================

      if (!name) {
        return validationError({ name: 'Role name is required' });
      }

      if (name.length < 2 || name.length > 50) {
        return validationError({ name: 'Role name must be between 2 and 50 characters' });
      }

      if (description && description.length > 500) {
        return validationError({ description: 'Description cannot exceed 500 characters' });
      }

      if (level && (level < 1 || level > 89)) {
        return validationError({ level: 'Level must be between 1 and 89 (90+ reserved for system roles)' });
      }

      // ========================================
      // Step 2: Check for Duplicate Role Name
      // ========================================

      const existingRole = await Role.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        organizationId: request.organizationId,
        isDeleted: false,
      });

      if (existingRole) {
        return errorResponse('A role with this name already exists in your organization', 400);
      }

      // ========================================
      // Step 3: Validate Permissions
      // ========================================

      let validatedPermissions = [];

      if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        // Verify all permission IDs exist
        const permissionDocs = await Permission.find({
          _id: { $in: permissions },
          isActive: true,
        });

        if (permissionDocs.length !== permissions.length) {
          return validationError({ permissions: 'One or more invalid permission IDs' });
        }

        validatedPermissions = permissions;
      }

      // ========================================
      // Step 4: Create Role
      // ========================================

      const role = new Role({
        name,
        description: description || '',
        organizationId: request.organizationId,
        permissions: validatedPermissions,
        isSystem: false,
        level: level || 50,
        color: color || '#6B7280',
        icon: icon || 'UserGroupIcon',
        userCount: 0,
      });

      await role.save();

      // Populate permissions for response
      await role.populate('permissions');

      logger.success('Role created', {
        roleId: role._id,
        roleName: role.name,
        organizationId: request.organizationId,
        permissionCount: role.permissions.length,
      });

      // ========================================
      // Step 5: Return Response
      // ========================================

      return successResponse(
        {
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
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
          },
        },
        'Role created successfully',
        201
      );
    } catch (error) {
      logger.error('Create role error', error);

      return errorResponse(
        'Failed to create role',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
