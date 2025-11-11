/**
 * Protected Route Example
 * Demonstrates how to use authentication middleware
 */

import { withAuth, withAuthRole, withAuthFeature } from '@/middleware/auth';
import { successResponse } from '@/utils/response';

/**
 * GET - Example protected route (any authenticated user)
 * Requires: Valid access token
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    // User is authenticated, request.user and request.session are available

    return successResponse(
      {
        message: 'You have accessed a protected route!',
        user: {
          id: request.user._id,
          name: request.user.name,
          email: request.user.email,
          role: request.user.role,
        },
        organization: {
          id: request.organizationId,
          name: request.user.organizationId.name,
        },
        session: {
          sessionId: request.sessionId,
          device: `${request.session.device.browser} on ${request.session.device.os}`,
          lastActivity: request.session.lastActivity,
        },
      },
      'Protected data retrieved successfully',
      200
    );
  });
}

/**
 * POST - Example admin-only route
 * Requires: Admin or Super Admin role
 */
export async function POST(request) {
  return withAuthRole(request, ['admin', 'super_admin'], async (request) => {
    // Only admins can access this

    const body = await request.json();

    return successResponse(
      {
        message: 'Admin action completed!',
        actionBy: {
          id: request.user._id,
          name: request.user.name,
          role: request.user.role,
        },
        data: body,
      },
      'Admin operation successful',
      200
    );
  });
}

/**
 * PUT - Example feature-protected route
 * Requires: Organization has 'accounting' feature
 */
export async function PUT(request) {
  return withAuthFeature(request, 'accounting', async (request) => {
    // Only organizations with accounting feature can access

    const body = await request.json();

    return successResponse(
      {
        message: 'Accounting feature accessed!',
        organization: {
          id: request.organizationId,
          name: request.user.organizationId.name,
          plan: request.user.organizationId.subscription.plan,
        },
        data: body,
      },
      'Accounting operation successful',
      200
    );
  });
}
