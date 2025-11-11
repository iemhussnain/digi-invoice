/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user/session info to requests
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import { unauthorizedError, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';
import { verifyToken, extractTokenFromHeader } from '@/utils/jwt';

/**
 * Extract token from request (Authorization header or cookies)
 */
function extractToken(request) {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  let token = extractTokenFromHeader(authHeader);

  // If no token in header, try cookies
  if (!token) {
    const cookies = request.cookies;
    token = cookies.get('accessToken')?.value;
  }

  return token;
}

/**
 * Main authentication middleware
 * Verifies token and attaches user/session to request
 *
 * Usage:
 * import { withAuth } from '@/middleware/auth';
 *
 * export async function GET(request) {
 *   return withAuth(request, async (request) => {
 *     const user = request.user;
 *     const session = request.session;
 *     // Your protected route logic here
 *   });
 * }
 */
export async function withAuth(request, handler) {
  try {
    // Connect to database
    await connectDB();

    // ========================================
    // Step 1: Extract Token
    // ========================================

    const token = extractToken(request);

    if (!token) {
      logger.debug('Auth middleware - no token provided');
      return unauthorizedError('Authentication required. Please login.');
    }

    // ========================================
    // Step 2: Verify Token
    // ========================================

    const decoded = verifyToken(token);

    if (decoded.error) {
      logger.warning('Auth middleware - invalid token', { error: decoded.error });
      return unauthorizedError(decoded.error);
    }

    // Check if it's an access token (not refresh token)
    if (decoded.type && decoded.type !== 'access') {
      logger.warning('Auth middleware - invalid token type', { type: decoded.type });
      return unauthorizedError('Invalid token type. Please use an access token.');
    }

    const { userId, sessionId } = decoded;

    // ========================================
    // Step 3: Verify Session
    // ========================================

    const session = await Session.findOne({
      sessionId,
      userId,
      isActive: true,
    });

    if (!session) {
      logger.warning('Auth middleware - session not found or inactive', {
        userId,
        sessionId,
      });
      return unauthorizedError('Session expired or invalid. Please login again.');
    }

    // Check if session is expired
    if (session.isExpired) {
      logger.warning('Auth middleware - session expired', {
        userId,
        sessionId,
      });

      // Deactivate expired session
      await session.deactivate('token_expired');

      return unauthorizedError('Session expired. Please login again.');
    }

    // ========================================
    // Step 4: Get User
    // ========================================

    const user = await User.findById(userId).populate('organizationId');

    if (!user) {
      logger.error('Auth middleware - user not found', { userId });
      return unauthorizedError('User not found. Please login again.');
    }

    // Check if user is still active
    if (user.status !== 'active' || user.isDeleted) {
      logger.warning('Auth middleware - user not active', {
        userId,
        status: user.status,
        isDeleted: user.isDeleted,
      });

      // Deactivate session
      await session.deactivate('user_inactive');

      return unauthorizedError('User account is not active.');
    }

    // Check organization status
    if (!user.organizationId || user.organizationId.status !== 'active') {
      logger.warning('Auth middleware - organization not active', {
        userId,
        organizationStatus: user.organizationId?.status,
      });
      return unauthorizedError('Organization is not active.');
    }

    // Check subscription
    if (!user.organizationId.isSubscriptionActive) {
      logger.warning('Auth middleware - subscription inactive', {
        userId,
        subscriptionStatus: user.organizationId.subscription.status,
      });
      return unauthorizedError('Subscription expired. Please renew to continue.');
    }

    // ========================================
    // Step 5: Update Session Activity
    // ========================================

    // Update last activity timestamp
    await session.updateActivity();

    // ========================================
    // Step 6: Attach to Request & Continue
    // ========================================

    // Attach user and session to request object
    request.user = user;
    request.session = session;
    request.userId = user._id;
    request.organizationId = user.organizationId._id;
    request.sessionId = session.sessionId;

    logger.debug('Auth middleware - authenticated', {
      userId: user._id,
      role: user.role,
      sessionId: session.sessionId,
    });

    // Call the handler with the authenticated request
    return await handler(request);
  } catch (error) {
    logger.error('Auth middleware error', error);

    return errorResponse(
      'Authentication failed',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}

/**
 * Role-based authentication middleware
 * Requires user to have one of the specified roles
 *
 * Usage:
 * import { withAuthRole } from '@/middleware/auth';
 *
 * export async function GET(request) {
 *   return withAuthRole(request, ['admin', 'manager'], async (request) => {
 *     // Only admins and managers can access this
 *   });
 * }
 */
export async function withAuthRole(request, allowedRoles, handler) {
  return withAuth(request, async (request) => {
    const userRole = request.user.role;

    // Check if user has required role
    if (!allowedRoles.includes(userRole)) {
      logger.warning('Auth middleware - insufficient permissions', {
        userId: request.userId,
        userRole,
        requiredRoles: allowedRoles,
      });

      return errorResponse(
        'Access denied. Insufficient permissions.',
        403,
        process.env.NODE_ENV === 'development'
          ? {
              userRole,
              requiredRoles: allowedRoles,
            }
          : null
      );
    }

    // User has required role, proceed
    return await handler(request);
  });
}

/**
 * Organization-scoped authentication
 * Ensures user can only access data from their organization
 *
 * Usage:
 * export async function GET(request) {
 *   return withAuthOrg(request, async (request) => {
 *     const orgId = request.organizationId;
 *     // Query data filtered by orgId
 *   });
 * }
 */
export async function withAuthOrg(request, handler) {
  return withAuth(request, async (request) => {
    // organizationId is already attached by withAuth
    // This wrapper is for semantic clarity
    return await handler(request);
  });
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 *
 * Usage:
 * import { withOptionalAuth } from '@/middleware/auth';
 *
 * export async function GET(request) {
 *   return withOptionalAuth(request, async (request) => {
 *     if (request.user) {
 *       // User is logged in
 *     } else {
 *       // User is not logged in (public access)
 *     }
 *   });
 * }
 */
export async function withOptionalAuth(request, handler) {
  try {
    // Try to authenticate
    return await withAuth(request, handler);
  } catch (error) {
    // If authentication fails, proceed anyway without user
    request.user = null;
    request.session = null;
    request.userId = null;
    request.organizationId = null;

    return await handler(request);
  }
}

/**
 * Feature-based authentication
 * Checks if organization has access to specific feature
 *
 * Usage:
 * import { withAuthFeature } from '@/middleware/auth';
 *
 * export async function GET(request) {
 *   return withAuthFeature(request, 'accounting', async (request) => {
 *     // Only if organization has accounting feature
 *   });
 * }
 */
export async function withAuthFeature(request, featureName, handler) {
  return withAuth(request, async (request) => {
    const organization = request.user.organizationId;

    // Check if organization has the feature
    if (!organization.hasFeature(featureName)) {
      logger.warning('Auth middleware - feature not available', {
        userId: request.userId,
        organizationId: organization._id,
        feature: featureName,
        plan: organization.subscription.plan,
      });

      return errorResponse(
        `Feature '${featureName}' is not available in your subscription plan.`,
        403,
        process.env.NODE_ENV === 'development'
          ? {
              feature: featureName,
              currentPlan: organization.subscription.plan,
              availableFeatures: organization.subscription.features,
            }
          : null
      );
    }

    // Organization has the feature, proceed
    return await handler(request);
  });
}

/**
 * Super admin only middleware
 */
export async function withSuperAdmin(request, handler) {
  return withAuthRole(request, ['super_admin'], handler);
}

/**
 * Admin or above middleware
 */
export async function withAdmin(request, handler) {
  return withAuthRole(request, ['super_admin', 'admin'], handler);
}

/**
 * Manager or above middleware
 */
export async function withManager(request, handler) {
  return withAuthRole(request, ['super_admin', 'admin', 'manager'], handler);
}

// ========================================
// Permission-Based Middleware (Fine-grained RBAC)
// ========================================

/**
 * Permission-based authentication middleware
 * Checks if user has specific permission(s)
 *
 * Usage:
 * export async function POST(request) {
 *   return withPermission(request, 'invoices.create', async (request) => {
 *     // Your protected route logic here
 *   });
 * }
 *
 * // Multiple permissions (user needs ANY of them)
 * export async function GET(request) {
 *   return withPermission(request, ['invoices.view', 'invoices.edit'], async (request) => {
 *     // Your protected route logic here
 *   });
 * }
 */
export async function withPermission(request, requiredPermissions, handler) {
  return withAuth(request, async (request) => {
    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    logger.debug('Permission check', {
      userId: request.userId,
      requiredPermissions: permissions,
    });

    // Check if user has any of the required permissions
    const hasPermission = await request.user.hasAnyPermission(permissions);

    if (!hasPermission) {
      logger.warning('Permission denied', {
        userId: request.userId,
        email: request.user.email,
        role: request.user.role,
        requiredPermissions: permissions,
      });

      return errorResponse(
        'Access denied. You do not have the required permissions for this action.',
        403,
        process.env.NODE_ENV === 'development'
          ? {
              requiredPermissions: permissions,
              userRole: request.user.role,
              message: 'Please contact your administrator to request access.',
            }
          : null
      );
    }

    // User has permission, proceed
    return await handler(request);
  });
}

/**
 * Permission-based authentication middleware (requires ALL permissions)
 * Checks if user has all specified permissions
 *
 * Usage:
 * export async function DELETE(request) {
 *   return withAllPermissions(request, ['invoices.delete', 'invoices.approve'], async (request) => {
 *     // User must have BOTH permissions
 *   });
 * }
 */
export async function withAllPermissions(request, requiredPermissions, handler) {
  return withAuth(request, async (request) => {
    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    logger.debug('All permissions check', {
      userId: request.userId,
      requiredPermissions: permissions,
    });

    // Check if user has all required permissions
    const hasAllPermissions = await request.user.hasAllPermissions(permissions);

    if (!hasAllPermissions) {
      logger.warning('Insufficient permissions', {
        userId: request.userId,
        email: request.user.email,
        role: request.user.role,
        requiredPermissions: permissions,
      });

      return errorResponse(
        'Access denied. You do not have all the required permissions for this action.',
        403,
        process.env.NODE_ENV === 'development'
          ? {
              requiredPermissions: permissions,
              userRole: request.user.role,
              message: 'All specified permissions are required.',
            }
          : null
      );
    }

    // User has all permissions, proceed
    return await handler(request);
  });
}

/**
 * Resource-based permission middleware
 * Shorthand for checking view/create/edit/delete permissions on a resource
 *
 * Usage:
 * export async function GET(request) {
 *   return withResourcePermission(request, 'invoices', 'view', async (request) => {
 *     // Checks for 'invoices.view' permission
 *   });
 * }
 */
export async function withResourcePermission(request, resource, action, handler) {
  const permissionKey = `${resource}.${action}`;
  return withPermission(request, permissionKey, handler);
}

// ========================================
// Convenience Middleware for Common Permissions
// ========================================

// User Management
export async function withUserView(request, handler) {
  return withPermission(request, 'users.view', handler);
}

export async function withUserManage(request, handler) {
  return withPermission(request, 'users.manage', handler);
}

// Customer Management
export async function withCustomerView(request, handler) {
  return withPermission(request, 'customers.view', handler);
}

export async function withCustomerCreate(request, handler) {
  return withPermission(request, 'customers.create', handler);
}

export async function withCustomerEdit(request, handler) {
  return withPermission(request, 'customers.edit', handler);
}

// Invoice Management
export async function withInvoiceView(request, handler) {
  return withPermission(request, 'invoices.view', handler);
}

export async function withInvoiceCreate(request, handler) {
  return withPermission(request, 'invoices.create', handler);
}

export async function withInvoiceEdit(request, handler) {
  return withPermission(request, 'invoices.edit', handler);
}

export async function withInvoiceApprove(request, handler) {
  return withPermission(request, 'invoices.approve', handler);
}

// Reports
export async function withReportsView(request, handler) {
  return withPermission(request, 'reports.view', handler);
}

export async function withReportsExport(request, handler) {
  return withPermission(request, 'reports.export', handler);
}

// Settings
export async function withSettingsView(request, handler) {
  return withPermission(request, 'settings.view', handler);
}

export async function withSettingsEdit(request, handler) {
  return withPermission(request, 'settings.edit', handler);
}
