/**
 * Session Model
 * Handles user sessions and device tracking for single device login
 */

import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    // Session Identifier
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
    },

    // Device Information
    deviceFingerprint: {
      type: String,
      required: [true, 'Device fingerprint is required'],
      index: true,
    },

    device: {
      type: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
        default: 'unknown',
      },

      browser: {
        type: String,
        trim: true,
      },

      browserVersion: {
        type: String,
        trim: true,
      },

      os: {
        type: String,
        trim: true,
      },

      osVersion: {
        type: String,
        trim: true,
      },

      platform: {
        type: String,
        trim: true,
      },

      userAgent: {
        type: String,
        trim: true,
      },
    },

    // Network Information
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },

    location: {
      country: {
        type: String,
        trim: true,
      },

      countryCode: {
        type: String,
        trim: true,
      },

      region: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        trim: true,
      },

      timezone: {
        type: String,
        trim: true,
      },

      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Session Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Session Timestamps
    loginAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    lastActivity: {
      type: Date,
      default: Date.now,
      required: true,
    },

    logoutAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    // Logout Information
    logoutReason: {
      type: String,
      enum: ['user_logout', 'force_logout', 'new_device', 'token_expired', 'inactivity', 'security'],
    },

    logoutIP: {
      type: String,
    },

    // Security Flags
    isSuspicious: {
      type: Boolean,
      default: false,
    },

    suspiciousReasons: [{
      type: String,
    }],

    // Activity Tracking
    requestCount: {
      type: Number,
      default: 0,
    },

    lastRequestAt: {
      type: Date,
    },

    // Additional Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, deviceFingerprint: 1 });
sessionSchema.index({ sessionId: 1, isActive: 1 });

// Index for automatic deletion of expired sessions (TTL index)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for session duration
sessionSchema.virtual('duration').get(function () {
  const endTime = this.logoutAt || new Date();
  return Math.floor((endTime - this.loginAt) / 1000); // Duration in seconds
});

// Virtual for checking if session is expired
sessionSchema.virtual('isExpired').get(function () {
  return this.expiresAt < new Date();
});

// Virtual for time until expiry
sessionSchema.virtual('timeUntilExpiry').get(function () {
  const now = new Date();
  if (this.expiresAt > now) {
    return Math.floor((this.expiresAt - now) / 1000); // Seconds until expiry
  }
  return 0;
});

// Pre-save middleware to update lastActivity
sessionSchema.pre('save', function (next) {
  if (this.isActive) {
    this.lastActivity = new Date();
  }
  next();
});

// Method to deactivate session
sessionSchema.methods.deactivate = function (reason = 'user_logout', ipAddress = null) {
  this.isActive = false;
  this.logoutAt = new Date();
  this.logoutReason = reason;
  if (ipAddress) {
    this.logoutIP = ipAddress;
  }
  return this.save();
};

// Method to extend session
sessionSchema.methods.extend = function (additionalMinutes = 60) {
  const now = new Date();
  this.expiresAt = new Date(now.getTime() + additionalMinutes * 60 * 1000);
  this.lastActivity = now;
  return this.save();
};

// Method to update activity
sessionSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  this.requestCount += 1;
  this.lastRequestAt = new Date();
  return this.save();
};

// Method to mark as suspicious
sessionSchema.methods.markSuspicious = function (reason) {
  this.isSuspicious = true;
  if (!this.suspiciousReasons) {
    this.suspiciousReasons = [];
  }
  this.suspiciousReasons.push(reason);
  return this.save();
};

// Static method to find active session for user
sessionSchema.statics.findActiveByUser = function (userId) {
  return this.findOne({ userId, isActive: true });
};

// Static method to find active session by device
sessionSchema.statics.findActiveByDevice = function (userId, deviceFingerprint) {
  return this.findOne({ userId, deviceFingerprint, isActive: true });
};

// Static method to deactivate all sessions for a user
sessionSchema.statics.deactivateAllForUser = async function (userId, reason = 'security', ipAddress = null) {
  return this.updateMany(
    { userId, isActive: true },
    {
      $set: {
        isActive: false,
        logoutAt: new Date(),
        logoutReason: reason,
        logoutIP: ipAddress,
      },
    }
  );
};

// Static method to deactivate all sessions except current
sessionSchema.statics.deactivateOtherSessions = async function (userId, currentSessionId, reason = 'new_device') {
  return this.updateMany(
    { userId, isActive: true, sessionId: { $ne: currentSessionId } },
    {
      $set: {
        isActive: false,
        logoutAt: new Date(),
        logoutReason: reason,
      },
    }
  );
};

// Static method to cleanup expired sessions (manual cleanup)
sessionSchema.statics.cleanupExpired = async function () {
  const now = new Date();
  return this.updateMany(
    { expiresAt: { $lt: now }, isActive: true },
    {
      $set: {
        isActive: false,
        logoutAt: now,
        logoutReason: 'token_expired',
      },
    }
  );
};

// Static method to cleanup inactive sessions (no activity for 30 days)
sessionSchema.statics.cleanupInactive = async function (daysInactive = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  return this.deleteMany({
    lastActivity: { $lt: cutoffDate },
    isActive: false,
  });
};

// Static method to get user session stats
sessionSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        activeSessions: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
        totalRequests: { $sum: '$requestCount' },
        averageDuration: { $avg: '$duration' },
        devices: { $addToSet: '$device.type' },
      },
    },
  ]);

  return stats[0] || {
    totalSessions: 0,
    activeSessions: 0,
    totalRequests: 0,
    averageDuration: 0,
    devices: [],
  };
};

// Remove sensitive data from JSON
sessionSchema.methods.toJSON = function () {
  const session = this.toObject();
  delete session.__v;
  return session;
};

// Create model
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

export default Session;
