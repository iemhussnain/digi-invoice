/**
 * Supplier Model
 * For managing suppliers/vendors
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

// Address Schema
const addressSchema = new Schema(
  {
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
  { _id: false }
);

// Main Supplier Schema
const supplierSchema = new Schema(
  {
    // Organization reference
    organizationId: {
      type: ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Supplier identification
    supplierCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Company info
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },

    // Contact person
    contactPerson: {
      type: String,
      trim: true,
    },

    // Contact details
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    phone: {
      type: String,
      trim: true,
    },

    mobile: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    // Tax information (Pakistan-specific)
    ntn: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{7}(-[0-9])?$/, 'Please provide a valid NTN (e.g., 1234567 or 1234567-8)'],
    },

    strn: {
      type: String,
      trim: true,
      uppercase: true,
    },

    gstRegistered: {
      type: Boolean,
      default: false,
    },

    // Payment terms
    paymentTerms: {
      type: String,
      enum: ['cash', 'credit', 'advance'],
      default: 'credit',
    },

    creditDays: {
      type: Number,
      default: 30,
      min: [0, 'Credit days cannot be negative'],
    },

    creditLimit: {
      type: Number,
      default: 0,
      min: [0, 'Credit limit cannot be negative'],
    },

    // Financial tracking
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
      default: 'credit', // Suppliers typically have credit balance (we owe them)
    },

    // Address
    address: {
      type: addressSchema,
      default: () => ({}),
    },

    // Bank details
    bankName: {
      type: String,
      trim: true,
    },

    accountTitle: {
      type: String,
      trim: true,
    },

    accountNumber: {
      type: String,
      trim: true,
    },

    iban: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Category
    category: {
      type: String,
      enum: ['raw_material', 'finished_goods', 'services', 'utilities', 'other'],
      default: 'other',
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
supplierSchema.index({ organizationId: 1, supplierCode: 1 }, { unique: true });
supplierSchema.index({ organizationId: 1, companyName: 1 });
supplierSchema.index({ organizationId: 1, email: 1 });
supplierSchema.index({ organizationId: 1, isActive: 1 });
supplierSchema.index({ organizationId: 1, isDeleted: 1 });

// Static method to generate supplier code
supplierSchema.statics.generateSupplierCode = async function (organizationId) {
  const lastSupplier = await this.findOne({
    organizationId,
  })
    .sort({ supplierCode: -1 })
    .select('supplierCode')
    .lean();

  if (!lastSupplier) {
    return 'SUPP-0001';
  }

  const lastNumber = parseInt(lastSupplier.supplierCode.split('-')[1]);
  const newNumber = lastNumber + 1;

  return `SUPP-${newNumber.toString().padStart(4, '0')}`;
};

// Method to update supplier balance
supplierSchema.methods.updateBalance = async function (amount, type = 'credit') {
  // For suppliers: credit increases balance (we owe more), debit decreases balance (we pay)
  if (type === 'credit') {
    // We received goods/services (we owe more)
    this.currentBalance += amount;
  } else {
    // We paid supplier (we owe less)
    this.currentBalance -= amount;
  }

  // Normalize balance type
  if (this.currentBalance >= 0) {
    this.balanceType = 'credit'; // We owe supplier
  } else {
    this.balanceType = 'debit'; // Supplier owes us (advance payment)
    this.currentBalance = Math.abs(this.currentBalance);
  }

  return await this.save();
};

// Virtual for display name
supplierSchema.virtual('displayName').get(function () {
  return this.companyName;
});

// Virtual for balance display
supplierSchema.virtual('balanceDisplay').get(function () {
  const balanceStr = this.currentBalance.toFixed(2);
  return this.balanceType === 'credit'
    ? `PKR ${balanceStr} (Payable)`
    : `PKR ${balanceStr} (Advance)`;
});

// Query middleware to exclude soft-deleted records
supplierSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// Pre-save hook to normalize data
supplierSchema.pre('save', function (next) {
  // Ensure current balance is set from opening balance on creation
  if (this.isNew && this.openingBalance) {
    this.currentBalance = this.openingBalance;
  }

  // Normalize email to lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  // Normalize NTN and STRN to uppercase
  if (this.ntn) {
    this.ntn = this.ntn.toUpperCase();
  }
  if (this.strn) {
    this.strn = this.strn.toUpperCase();
  }

  next();
});

const Supplier =
  mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);

export default Supplier;
