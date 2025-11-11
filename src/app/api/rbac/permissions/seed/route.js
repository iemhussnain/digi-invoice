/**
 * Seed Permissions API
 * POST /api/rbac/permissions/seed - Seed default permissions and roles
 */

import connectDB from '@/lib/mongodb';
import Permission from '@/models/Permission';
import Role from '@/models/Role';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withSuperAdmin } from '@/middleware/auth';

/**
 * POST /api/rbac/permissions/seed
 * Seed default permissions and roles (Super Admin only)
 */
export async function POST(request) {
  return withSuperAdmin(request, async (request) => {
    try {
      await connectDB();

      logger.info('Seed permissions and roles request', {
        userId: request.userId,
      });

      // ========================================
      // Step 1: Seed Permissions
      // ========================================

      logger.info('Seeding permissions...');
      const permissionsResult = await Permission.seedPermissions();

      const permissionsCreated = permissionsResult.upsertedCount || 0;
      const permissionsUpdated = permissionsResult.modifiedCount || 0;

      logger.success('Permissions seeded', {
        created: permissionsCreated,
        updated: permissionsUpdated,
      });

      // ========================================
      // Step 2: Seed System Roles
      // ========================================

      logger.info('Seeding system roles...');
      const rolesResult = await Role.seedSystemRoles();

      const rolesCreated = rolesResult.upsertedCount || 0;
      const rolesUpdated = rolesResult.modifiedCount || 0;

      logger.success('Roles seeded', {
        created: rolesCreated,
        updated: rolesUpdated,
      });

      // ========================================
      // Step 3: Get Summary
      // ========================================

      const totalPermissions = await Permission.countDocuments({ isActive: true });
      const totalRoles = await Role.countDocuments({ isSystem: true, isActive: true });

      return successResponse(
        {
          permissions: {
            total: totalPermissions,
            created: permissionsCreated,
            updated: permissionsUpdated,
          },
          roles: {
            total: totalRoles,
            created: rolesCreated,
            updated: rolesUpdated,
          },
          message: 'Default permissions and roles seeded successfully',
        },
        'RBAC system initialized successfully',
        201
      );
    } catch (error) {
      logger.error('Seed permissions and roles error', error);

      return errorResponse(
        'Failed to seed permissions and roles',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
