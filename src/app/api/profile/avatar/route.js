/**
 * Avatar Management API
 * User can upload or delete their profile picture
 */

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { successResponse, errorResponse, validationError } from '@/utils/response';
import logger from '@/utils/logger';
import { withAuth } from '@/middleware/auth';

/**
 * POST - Upload/Update Avatar
 * User uploads their profile picture
 * Accepts: URL or base64 data URI
 */
export async function POST(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const body = await request.json();
      const { avatar, avatarType } = body;

      const userId = request.userId;

      logger.info('Upload avatar attempt', { userId, avatarType });

      // ========================================
      // Step 1: Validate Input
      // ========================================

      const errors = {};

      if (!avatar) {
        errors.avatar = 'Avatar is required';
      }

      // Validate avatar type
      const allowedTypes = ['url', 'base64'];
      if (avatarType && !allowedTypes.includes(avatarType)) {
        errors.avatarType = `Avatar type must be one of: ${allowedTypes.join(', ')}`;
      }

      // Auto-detect type if not provided
      let detectedType = avatarType;
      if (!detectedType && avatar) {
        if (avatar.startsWith('data:image/')) {
          detectedType = 'base64';
        } else if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
          detectedType = 'url';
        } else {
          errors.avatar = 'Invalid avatar format. Must be a URL or base64 data URI';
        }
      }

      // Validate URL format
      if (detectedType === 'url') {
        try {
          new URL(avatar);
        } catch (e) {
          errors.avatar = 'Invalid URL format';
        }
      }

      // Validate base64 format
      if (detectedType === 'base64') {
        if (!avatar.startsWith('data:image/')) {
          errors.avatar = 'Base64 must be a data URI starting with data:image/';
        }

        // Check supported image formats
        const supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
        const formatMatch = avatar.match(/data:image\/(\w+);base64/);

        if (!formatMatch || !supportedFormats.includes(formatMatch[1].toLowerCase())) {
          errors.avatar = `Unsupported image format. Supported: ${supportedFormats.join(', ')}`;
        }

        // Check size (limit to ~5MB base64 string)
        if (avatar.length > 7000000) {
          // ~5MB base64
          errors.avatar = 'Avatar size too large. Maximum 5MB';
        }
      }

      if (Object.keys(errors).length > 0) {
        logger.warning('Upload avatar validation failed', { errors });
        return validationError(errors);
      }

      // ========================================
      // Step 2: Update User Avatar
      // ========================================

      const user = await User.findById(userId);

      if (!user) {
        return errorResponse('User not found', 404);
      }

      const oldAvatar = user.avatar;
      user.avatar = avatar;
      user.updatedBy = userId;

      await user.save();

      logger.success('Avatar updated', {
        userId,
        avatarType: detectedType,
        hadPreviousAvatar: !!oldAvatar,
      });

      // ========================================
      // Step 3: Return Response
      // ========================================

      return successResponse(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            updatedAt: user.updatedAt,
          },
          avatarInfo: {
            type: detectedType,
            uploaded: true,
            previous: oldAvatar ? 'replaced' : 'none',
          },
        },
        'Avatar uploaded successfully',
        200
      );
    } catch (error) {
      logger.error('Upload avatar error', error);
      return errorResponse(
        'Failed to upload avatar',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * DELETE - Remove Avatar
 * User deletes their profile picture
 */
export async function DELETE(request) {
  return withAuth(request, async (request) => {
    try {
      await connectDB();

      const userId = request.userId;

      logger.info('Delete avatar attempt', { userId });

      // ========================================
      // Step 1: Find User
      // ========================================

      const user = await User.findById(userId);

      if (!user) {
        return errorResponse('User not found', 404);
      }

      if (!user.avatar) {
        return errorResponse(
          'No avatar to delete',
          400,
          { message: 'User does not have an avatar' }
        );
      }

      // ========================================
      // Step 2: Remove Avatar
      // ========================================

      const deletedAvatar = user.avatar;
      user.avatar = null;
      user.updatedBy = userId;

      await user.save();

      logger.success('Avatar deleted', { userId });

      // ========================================
      // Step 3: Return Response
      // ========================================

      return successResponse(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: null,
            updatedAt: user.updatedAt,
          },
          avatarInfo: {
            deleted: true,
            previous: deletedAvatar,
          },
        },
        'Avatar deleted successfully',
        200
      );
    } catch (error) {
      logger.error('Delete avatar error', error);
      return errorResponse(
        'Failed to delete avatar',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}

/**
 * GET - Get Avatar Info
 * Returns information about avatar storage and limits
 */
export async function GET(request) {
  return withAuth(request, async (request) => {
    try {
      const user = request.user;

      return successResponse(
        {
          currentAvatar: user.avatar || null,
          hasAvatar: !!user.avatar,
          avatarStorage: {
            type: 'inline',
            description: 'Avatars stored as URLs or base64 in database',
            supportedTypes: ['url', 'base64'],
            supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
            maxSize: '5MB',
          },
          uploadMethods: [
            {
              method: 'url',
              description: 'Provide a public image URL',
              example: 'https://example.com/avatar.jpg',
            },
            {
              method: 'base64',
              description: 'Upload image as base64 data URI',
              example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
            },
          ],
          recommendation: {
            production: 'Use cloud storage (S3, Cloudinary, etc.) for better performance',
            development: 'URL or base64 is fine for testing',
          },
        },
        'Avatar information retrieved',
        200
      );
    } catch (error) {
      logger.error('Get avatar info error', error);
      return errorResponse(
        'Failed to retrieve avatar info',
        500,
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      );
    }
  });
}
