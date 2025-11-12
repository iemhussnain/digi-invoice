/**
 * Permissions Management API
 * GET /api/rbac/permissions - Get all permissions (grouped by category)
 * POST /api/rbac/permissions/seed - Seed default permissions
 */

import connectDB from '@/lib/mongodb';
import Permission from '@/models/Permission';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { withAdmin } from '@/middleware/auth';

/**
 * GET /api/rbac/permissions
 * Get all permissions (grouped by category)
 */
export async function GET(request) {
  return withAdmin(request, async (request) => {
    try {
      await connectDB();

      const { searchParams } = new URL(request.url);
      const grouped = searchParams.get('grouped') === 'true';
      const category = searchParams.get('category');
      const resource = searchParams.get('resource');
      const action = searchParams.get('action');

      logger.info('Get permissions request', {
        userId: request.userId,
        grouped,
        category,
        resource,
        action,
      });

      // Build query
      const query = { isActive: true };

      if (category) {
        query.category = category;
      }

      if (resource) {
        query.resource = resource;
      }

      if (action) {
        query.action = action;
      }

      // Get permissions
      if (grouped) {
        // Get permissions grouped by category
        const groupedPermissions = await Permission.getAllGrouped();

        return successResponse(
          {
            permissions: groupedPermissions,
            totalCategories: Object.keys(groupedPermissions).length,
            totalPermissions: Object.values(groupedPermissions).reduce(
              (sum, perms) => sum + perms.length,
              0
            ),
          },
          'Permissions retrieved successfully (grouped by category)'
        );
      } else {
        // Get all permissions as flat list
        const permissions = await Permission.find(query).sort({
          category: 1,
          displayOrder: 1,
        });

        return successResponse(
          {
            permissions,
            total: permissions.length,
          },
          'Permissions retrieved successfully'
        );
      }
    } catch (error) {
      logger.error('Get permissions error', error);

      return errorResponse(
        'Failed to retrieve permissions',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
