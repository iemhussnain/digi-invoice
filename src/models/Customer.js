/**
 * Customer Model
 * For managing customer/client information
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const customerSchema = new Schema(
  {
    // Organization reference
    organizationId: {
      type: ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Customer identification
    customerCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Basic Information
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    companyName: {
      type: String,
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters'],
    },

    // Contact Information
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    phone: {
      type: String,
      trim: true,
    },

    mobile: {
      type: String,
      trim: true,
    },

    fax: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Contact Person
    contactPerson: {
      name: {
        type: String,
        trim: true,
      },
      designation: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },

    // Address Information
    billingAddress: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: 'Pakistan',
      },
    },

    shippingAddress: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: 'Pakistan',
      },
      sameAsBilling: {
        type: Boolean,
        default: true,
      },
    },

    // Business/Tax Information (Pakistan Context)
    ntn: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{7}$/, 'Invalid NTN format (7 digits)'],
    },

    referenceNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{7}-[0-9]$/, 'Invalid reference number format (0000000-0)'],
    },

    strn: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{2}-[0-9]{2}-[0-9]{4}-[0-9]{3}-[0-9]{2}$/, 'Invalid STRN format (11-11-1111-111-11)'],
    },

    gstRegistered: {
      type: Boolean,
      default: false,
    },

    cnic: {
      type: String,
      trim: true,
      match: [/^[0-9]{5}-[0-9]{7}-[0-9]$/, 'Invalid CNIC format (xxxxx-xxxxxxx-x)'],
    },

    // Financial Information
    creditLimit: {
      type: Number,
      default: 0,
      min: [0, 'Credit limit cannot be negative'],
    },

    creditDays: {
      type: Number,
      default: 0,
      min: [0, 'Credit days cannot be negative'],
    },

    openingBalance: {
      type: Number,
      default: 0,
    },

    currentBalance: {
      type: Number,
      default: 0,
    },

    balanceType: {
      type: String,
      enum: ['debit', 'credit'],
      default: 'debit',
    },

    // Payment Terms
    paymentTerms: {
      type: String,
      enum: ['cash', 'credit', 'advance', 'cod', 'custom'],
      default: 'cash',
    },

    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'credit_card', 'online'],
      default: 'cash',
    },

    // Customer Category/Type
    customerType: {
      type: String,
      enum: ['individual', 'business', 'government', 'other'],
      default: 'individual',
    },

    category: {
      type: String,
      trim: true,
    },

    // Account Reference (if linked to chart of accounts)
    accountId: {
      type: ObjectId,
      ref: 'Account',
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: ObjectId,
      ref: 'User',
    },

    // Audit fields
    createdBy: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
customerSchema.index({ organizationId: 1, customerCode: 1 }, { unique: true });
customerSchema.index({ organizationId: 1, email: 1 });
customerSchema.index({ organizationId: 1, name: 1 });
customerSchema.index({ organizationId: 1, isDeleted: 1, isActive: 1 });

// Virtual for full address
customerSchema.virtual('billingFullAddress').get(function () {
  if (!this.billingAddress) return '';
  const addr = this.billingAddress;
  const parts = [addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(
    Boolean
  );
  return parts.join(', ');
});

customerSchema.virtual('shippingFullAddress').get(function () {
  if (!this.shippingAddress) return '';
  if (this.shippingAddress.sameAsBilling) return this.billingFullAddress;
  const addr = this.shippingAddress;
  const parts = [addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(
    Boolean
  );
  return parts.join(', ');
});

// Static method to generate customer code
customerSchema.statics.generateCustomerCode = async function (organizationId) {
  const lastCustomer = await this.findOne({ organizationId })
    .sort({ customerCode: -1 })
    .select('customerCode')
    .lean();

  if (!lastCustomer) {
    return 'CUST-0001';
  }

  const lastNumber = parseInt(lastCustomer.customerCode.split('-')[1]);
  const newNumber = lastNumber + 1;
  return `CUST-${newNumber.toString().padStart(4, '0')}`;
};

// Method to update balance
customerSchema.methods.updateBalance = async function (amount, type = 'debit') {
  if (type === 'debit') {
    this.currentBalance += amount;
  } else {
    this.currentBalance -= amount;
  }

  // Update balance type based on current balance
  if (this.currentBalance >= 0) {
    this.balanceType = 'debit';
  } else {
    this.balanceType = 'credit';
    this.currentBalance = Math.abs(this.currentBalance);
  }

  return await this.save();
};

// Method to check credit limit
customerSchema.methods.canExtendCredit = function (amount) {
  if (this.creditLimit === 0) return false;
  return this.currentBalance + amount <= this.creditLimit;
};

// Pre-save hook
customerSchema.pre('save', function (next) {
  // Copy billing address to shipping if same
  if (this.shippingAddress?.sameAsBilling) {
    this.shippingAddress = {
      ...this.billingAddress,
      sameAsBilling: true,
    };
  }

  next();
});

// Query middleware to exclude soft-deleted records
customerSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;
