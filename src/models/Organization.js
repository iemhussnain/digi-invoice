/**
 * Organization Model
 * Handles multi-tenancy and company information
 */

import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Business Information
    businessType: {
      type: String,
      enum: ['manufacturing', 'trading', 'services', 'retail', 'wholesale', 'other'],
      default: 'trading',
    },

    industry: {
      type: String,
      enum: ['electronics', 'textiles', 'food', 'healthcare', 'education', 'technology', 'other'],
    },

    // Contact Information
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },

    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    // Address
    address: {
      street: {
        type: String,
        trim: true,
      },
      area: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      province: {
        type: String,
        enum: ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK', 'Islamabad'],
        required: [true, 'Province is required'],
      },
      country: {
        type: String,
        default: 'Pakistan',
      },
      postalCode: {
        type: String,
        trim: true,
      },
    },

    // Tax & Legal Information
    ntn: {
      type: String, // National Tax Number
      trim: true,
      unique: true,
      sparse: true, // Allows multiple null values
    },

    strn: {
      type: String, // Sales Tax Registration Number
      trim: true,
      unique: true,
      sparse: true,
    },

    registrationNumber: {
      type: String, // Company Registration Number
      trim: true,
    },

    // Branding
    logo: {
      type: String, // URL to logo
    },

    tagline: {
      type: String,
      maxlength: [200, 'Tagline cannot exceed 200 characters'],
    },

    // Subscription & Plan
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'basic', 'standard', 'premium', 'enterprise'],
        default: 'free',
      },

      status: {
        type: String,
        enum: ['trial', 'active', 'expired', 'suspended', 'cancelled'],
        default: 'trial',
      },

      startDate: {
        type: Date,
        default: Date.now,
      },

      endDate: {
        type: Date,
      },

      maxUsers: {
        type: Number,
        default: 5, // Free plan: 5 users
      },

      maxStorage: {
        type: Number,
        default: 1024, // 1GB in MB
      },

      features: {
        accounting: { type: Boolean, default: true },
        sales: { type: Boolean, default: true },
        purchase: { type: Boolean, default: true },
        inventory: { type: Boolean, default: false },
        payroll: { type: Boolean, default: false },
        manufacturing: { type: Boolean, default: false },
        crm: { type: Boolean, default: false },
        reports: { type: Boolean, default: true },
        multiCurrency: { type: Boolean, default: false },
        api: { type: Boolean, default: false },
      },
    },

    // Settings
    settings: {
      // Financial Year
      fiscalYearStart: {
        type: String,
        default: '01-07', // July 1st (Pakistan standard)
        match: [/^\d{2}-\d{2}$/, 'Format should be MM-DD'],
      },

      // Currency
      currency: {
        code: {
          type: String,
          default: 'PKR',
        },
        symbol: {
          type: String,
          default: '₨',
        },
      },

      // Timezone
      timezone: {
        type: String,
        default: 'Asia/Karachi',
      },

      // Date Format
      dateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        default: 'DD/MM/YYYY',
      },

      // Number Format
      numberFormat: {
        decimalPlaces: {
          type: Number,
          default: 2,
        },
        thousandsSeparator: {
          type: String,
          enum: [',', '.', ' '],
          default: ',',
        },
        decimalSeparator: {
          type: String,
          enum: ['.', ','],
          default: '.',
        },
      },

      // Tax Configuration
      defaultTaxRate: {
        type: Number,
        default: 18, // GST in Pakistan
        min: 0,
        max: 100,
      },

      // Accounting
      enableAutoPosting: {
        type: Boolean,
        default: true,
      },

      requireApproval: {
        type: Boolean,
        default: true,
      },
    },

    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },

    // Owner
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Statistics (for quick reference)
    stats: {
      totalUsers: {
        type: Number,
        default: 0,
      },
      totalCustomers: {
        type: Number,
        default: 0,
      },
      totalSuppliers: {
        type: Number,
        default: 0,
      },
      totalProducts: {
        type: Number,
        default: 0,
      },
    },

    // Audit Fields
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },

    deletedAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
organizationSchema.index({ slug: 1 });
organizationSchema.index({ ntn: 1 });
organizationSchema.index({ strn: 1 });
organizationSchema.index({ status: 1 });
organizationSchema.index({ 'subscription.status': 1 });
organizationSchema.index({ ownerId: 1 });

// Pre-save middleware to generate slug
organizationSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Virtual for checking if subscription is active
organizationSchema.virtual('isSubscriptionActive').get(function () {
  return this.subscription.status === 'active' || this.subscription.status === 'trial';
});

// Virtual for checking if trial is expired
organizationSchema.virtual('isTrialExpired').get(function () {
  if (this.subscription.status === 'trial' && this.subscription.endDate) {
    return this.subscription.endDate < new Date();
  }
  return false;
});

// Method to check if feature is enabled
organizationSchema.methods.hasFeature = function (featureName) {
  return this.subscription.features[featureName] === true;
};

// Method to check user limit
organizationSchema.methods.canAddUser = function (currentUserCount) {
  return currentUserCount < this.subscription.maxUsers;
};

// Static method to find active organizations
organizationSchema.statics.findActive = function () {
  return this.find({ status: 'active', isDeleted: false });
};

// Static method to find by subscription plan
organizationSchema.statics.findByPlan = function (plan) {
  return this.find({ 'subscription.plan': plan, isDeleted: false });
};

// Remove sensitive data from JSON
organizationSchema.methods.toJSON = function () {
  const org = this.toObject();
  delete org.__v;
  return org;
};

// Create model
const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);

export default Organization;
