/**
 * User Profile APIs
 * Users can view and update their own profile
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';
import { validateName, validatePhone } from '@/utils/validators';

/**
 * GET - Get Own Profile
 * User can view their complete profile
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      // User is already attached by middleware
      const user = request.user;

      logger.info('Get profile', { userId: user._id });

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
            preferences: user.preferences,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            organization: {
              id: user.organizationId._id,
              name: user.organizationId.name,
              slug: user.organizationId.slug,
              subscription: {
                plan: user.organizationId.subscription.plan,
                status: user.organizationId.subscription.status,
                endDate: user.organizationId.subscription.endDate,
                features: user.organizationId.subscription.features,
              },
            },
          },
        },
        'Profile retrieved successfully',
        200
      );
    } catch (error) {
      logger.error('Get profile error', error);
      return errorResponse(
        'Failed to retrieve profile',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * PUT - Update Own Profile
 * User can update their own profile information
 */
export async function PUT(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();
      const { name, phone, department, preferences } = body;

      const userId = request.userId;

      logger.info('Update profile attempt', { userId });

      // ========================================
      // Step 1: Find User
      // ========================================

      const user = await User.findById(userId);

      if (!user) {
        return errorResponse('User not found', 404);
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

      // Validate preferences
      if (preferences !== undefined) {
        if (preferences.language && !['en', 'ur'].includes(preferences.language)) {
          errors.language = 'Language must be en or ur';
        }
        if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
          errors.theme = 'Theme must be light, dark, or auto';
        }
        if (preferences.timezone && typeof preferences.timezone !== 'string') {
          errors.timezone = 'Timezone must be a string';
        }
      }

      if (Object.keys(errors).length > 0) {
        logger.warning('Update profile validation failed', { errors });
        return validationError(errors);
      }

      // ========================================
      // Step 3: Update Profile
      // ========================================

      // Update basic fields
      if (name !== undefined) {
        user.name = name.trim();
      }

      if (phone !== undefined) {
        user.phone = phone ? phone.trim() : null;
      }

      if (department !== undefined) {
        user.department = department ? department.trim() : null;
      }

      // Update preferences
      if (preferences !== undefined) {
        if (preferences.language !== undefined) {
          user.preferences.language = preferences.language;
        }
        if (preferences.theme !== undefined) {
          user.preferences.theme = preferences.theme;
        }
        if (preferences.timezone !== undefined) {
          user.preferences.timezone = preferences.timezone;
        }
      }

      user.updatedBy = userId; // Self-update

      await user.save();

      logger.success('Profile updated', {
        userId,
        updates: { name, phone, department, preferences },
      });

      // ========================================
      // Step 4: Return Updated Profile
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
            preferences: user.preferences,
            updatedAt: user.updatedAt,
          },
        },
        'Profile updated successfully',
        200
      );
    } catch (error) {
      logger.error('Update profile error', error);
      return errorResponse(
        'Failed to update profile',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
