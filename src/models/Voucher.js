/**
 * Voucher Model
 * Handles different types of accounting vouchers (JV, PV, RV, CV)
 */

import mongoose from 'mongoose';

const voucherEntrySchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Account is required'],
  },

  // Debit or Credit
  type: {
    type: String,
    enum: ['debit', 'credit'],
    required: [true, 'Entry type is required'],
  },

  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    set: (val) => parseFloat(val.toFixed(2)),
  },

  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },

  // Reference to ledger entry (will be created after voucher is posted)
  ledgerEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LedgerEntry',
  },
}, { _id: true });

const voucherSchema = new mongoose.Schema(
  {
    // Voucher Identification
    voucherNumber: {
      type: String,
      required: [true, 'Voucher number is required'],
      trim: true,
      uppercase: true,
    },

    // Voucher Type
    voucherType: {
      type: String,
      required: [true, 'Voucher type is required'],
      enum: {
        values: ['JV', 'PV', 'RV', 'CV'],
        message: 'Invalid voucher type. Must be JV, PV, RV, or CV',
      },
    },

    // Organization
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
    },

    // Voucher Date
    voucherDate: {
      type: Date,
      required: [true, 'Voucher date is required'],
      default: Date.now,
    },

    // Fiscal Period
    fiscalYear: {
      type: String,
      required: true,
    },

    fiscalPeriod: {
      type: String, // e.g., "2024-01" for January 2024
      required: true,
    },

    // Description
    narration: {
      type: String,
      required: [true, 'Narration/description is required'],
      minlength: [5, 'Narration must be at least 5 characters'],
      maxlength: [1000, 'Narration cannot exceed 1000 characters'],
    },

    // Voucher Entries (Debit & Credit)
    entries: {
      type: [voucherEntrySchema],
      validate: {
        validator: function(entries) {
          return entries && entries.length >= 2;
        },
        message: 'Voucher must have at least 2 entries (1 debit and 1 credit)',
      },
    },

    // Totals
    totalDebit: {
      type: Number,
      default: 0,
      set: (val) => parseFloat(val.toFixed(2)),
    },

    totalCredit: {
      type: Number,
      default: 0,
      set: (val) => parseFloat(val.toFixed(2)),
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'posted', 'void'],
      default: 'draft',
    },

    // Posting Information
    postedAt: {
      type: Date,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Void Information
    voidedAt: {
      type: Date,
    },

    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    voidReason: {
      type: String,
      maxlength: [500, 'Void reason cannot exceed 500 characters'],
    },

    // Reference
    referenceNumber: {
      type: String,
      trim: true,
    },

    referenceType: {
      type: String,
      enum: ['invoice', 'payment', 'receipt', 'purchase', 'manual', 'other'],
      default: 'manual',
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    // Attachments
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileSize: Number,
      mimeType: String,
      uploadedAt: { type: Date, default: Date.now },
    }],

    // Tags
    tags: [String],

    // Additional Notes
    notes: {
      type: String,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes
voucherSchema.index({ organizationId: 1, voucherNumber: 1 }, { unique: true });
voucherSchema.index({ organizationId: 1, voucherType: 1 });
voucherSchema.index({ organizationId: 1, status: 1 });
voucherSchema.index({ organizationId: 1, voucherDate: 1 });
voucherSchema.index({ organizationId: 1, fiscalYear: 1, fiscalPeriod: 1 });
voucherSchema.index({ isDeleted: 1 });

// Pre-save middleware to calculate totals
voucherSchema.pre('save', function(next) {
  if (this.entries && this.entries.length > 0) {
    let debitTotal = 0;
    let creditTotal = 0;

    this.entries.forEach(entry => {
      if (entry.type === 'debit') {
        debitTotal += entry.amount;
      } else if (entry.type === 'credit') {
        creditTotal += entry.amount;
      }
    });

    this.totalDebit = parseFloat(debitTotal.toFixed(2));
    this.totalCredit = parseFloat(creditTotal.toFixed(2));
  }

  next();
});

// Virtual for checking if voucher is balanced
voucherSchema.virtual('isBalanced').get(function() {
  return Math.abs(this.totalDebit - this.totalCredit) < 0.01; // Allow 1 paisa tolerance
});

// Virtual for voucher type description
voucherSchema.virtual('voucherTypeDescription').get(function() {
  const types = {
    JV: 'Journal Voucher',
    PV: 'Payment Voucher',
    RV: 'Receipt Voucher',
    CV: 'Contra Voucher',
  };
  return types[this.voucherType] || this.voucherType;
});

// Method to validate double-entry
voucherSchema.methods.validateDoubleEntry = function() {
  const errors = [];

  // Check if voucher has entries
  if (!this.entries || this.entries.length < 2) {
    errors.push('Voucher must have at least 2 entries');
  }

  // Check if totals are balanced
  if (!this.isBalanced) {
    errors.push(`Voucher is not balanced. Debit: ${this.totalDebit}, Credit: ${this.totalCredit}`);
  }

  // Check if there's at least one debit entry
  const hasDebit = this.entries.some(e => e.type === 'debit');
  if (!hasDebit) {
    errors.push('Voucher must have at least one debit entry');
  }

  // Check if there's at least one credit entry
  const hasCredit = this.entries.some(e => e.type === 'credit');
  if (!hasCredit) {
    errors.push('Voucher must have at least one credit entry');
  }

  // Check for duplicate accounts in same entry type
  const accountTypeMap = new Map();
  this.entries.forEach(entry => {
    const key = `${entry.accountId}_${entry.type}`;
    if (accountTypeMap.has(key)) {
      errors.push(`Duplicate account ${entry.accountId} in ${entry.type} entries`);
    }
    accountTypeMap.set(key, true);
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Method to post voucher (create ledger entries)
voucherSchema.methods.post = async function(userId) {
  if (this.status === 'posted') {
    throw new Error('Voucher is already posted');
  }

  if (this.status === 'void') {
    throw new Error('Cannot post a void voucher');
  }

  // Validate double-entry
  const validation = this.validateDoubleEntry();
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  this.status = 'posted';
  this.postedAt = new Date();
  this.postedBy = userId;

  return await this.save();
};

// Method to void voucher
voucherSchema.methods.void = async function(userId, reason) {
  if (this.status === 'void') {
    throw new Error('Voucher is already void');
  }

  if (this.status === 'draft') {
    throw new Error('Cannot void a draft voucher. Delete it instead.');
  }

  this.status = 'void';
  this.voidedAt = new Date();
  this.voidedBy = userId;
  this.voidReason = reason;

  return await this.save();
};

// Static method to generate voucher number
voucherSchema.statics.generateVoucherNumber = async function(organizationId, voucherType, fiscalYear) {
  // Format: JV-2024-0001, PV-2024-0001, etc.
  const prefix = `${voucherType}-${fiscalYear}`;

  // Find the last voucher with this prefix
  const lastVoucher = await this.findOne({
    organizationId,
    voucherNumber: { $regex: `^${prefix}-` },
  })
    .sort({ voucherNumber: -1 })
    .select('voucherNumber')
    .lean();

  let nextNumber = 1;

  if (lastVoucher) {
    // Extract number from format: JV-2024-0001
    const parts = lastVoucher.voucherNumber.split('-');
    const lastNumber = parseInt(parts[parts.length - 1]);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros (4 digits)
  const paddedNumber = String(nextNumber).padStart(4, '0');

  return `${prefix}-${paddedNumber}`;
};

// Static method to get vouchers by period
voucherSchema.statics.getByPeriod = function(organizationId, fiscalYear, fiscalPeriod) {
  return this.find({
    organizationId,
    fiscalYear,
    fiscalPeriod,
    isDeleted: false,
  }).sort({ voucherDate: -1, voucherNumber: -1 });
};

// Static method to get voucher statistics
voucherSchema.statics.getStatistics = async function(organizationId, fiscalYear) {
  const stats = await this.aggregate([
    {
      $match: {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        fiscalYear,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$voucherType',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalDebit' },
        posted: {
          $sum: { $cond: [{ $eq: ['$status', 'posted'] }, 1, 0] },
        },
        draft: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
        },
        void: {
          $sum: { $cond: [{ $eq: ['$status', 'void'] }, 1, 0] },
        },
      },
    },
  ]);

  return stats;
};

// Remove sensitive data from JSON
voucherSchema.methods.toJSON = function() {
  const voucher = this.toObject();
  delete voucher.__v;
  return voucher;
};

// Create model
const Voucher = mongoose.models.Voucher || mongoose.model('Voucher', voucherSchema);

export default Voucher;
