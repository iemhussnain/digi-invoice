/**
 * Walk-in Sale Model
 * For quick cash sales to unregistered/walk-in customers
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

// Sale Item Schema
const saleItemSchema = new Schema(
  {
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },

    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0'],
    },

    unit: {
      type: String,
      trim: true,
      default: 'pcs',
    },

    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative'],
    },

    amount: {
      type: Number,
      required: true,
    },

    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    discountRate: {
      type: Number,
      default: 0,
      min: [0, 'Discount rate cannot be negative'],
      max: [100, 'Discount rate cannot exceed 100%'],
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

// Main Walk-in Sale Schema
const walkInSaleSchema = new Schema(
  {
    // Organization reference
    organizationId: {
      type: ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Receipt identification
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    saleDate: {
      type: Date,
      required: [true, 'Sale date is required'],
      default: Date.now,
    },

    // Customer info (optional, for walk-in)
    customerName: {
      type: String,
      trim: true,
      default: 'Walk-in Customer',
    },

    customerPhone: {
      type: String,
      trim: true,
    },

    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Sale items
    items: {
      type: [saleItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'Sale must have at least one item',
      },
    },

    // Amounts
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
    },

    totalDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },

    taxableAmount: {
      type: Number,
      required: true,
      min: [0, 'Taxable amount cannot be negative'],
    },

    totalTax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },

    // Payment (walk-in sales are always paid immediately)
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'mobile_wallet', 'other'],
      default: 'cash',
    },

    paidAmount: {
      type: Number,
      required: true,
      min: [0, 'Paid amount cannot be negative'],
    },

    changeGiven: {
      type: Number,
      default: 0,
      min: [0, 'Change cannot be negative'],
    },

    // Tax details
    taxType: {
      type: String,
      enum: ['none', 'gst', 'sales_tax', 'inclusive', 'exclusive'],
      default: 'inclusive',
    },

    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },

    // Status (walk-in sales are immediately completed)
    status: {
      type: String,
      enum: ['completed', 'cancelled', 'refunded'],
      default: 'completed',
      index: true,
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // Accounting integration
    voucherId: {
      type: ObjectId,
      ref: 'Voucher',
    },

    cashAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    revenueAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    taxAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    // Posted status
    isPosted: {
      type: Boolean,
      default: false,
      index: true,
    },

    postedAt: {
      type: Date,
    },

    postedBy: {
      type: ObjectId,
      ref: 'User',
    },

    // Fiscal tracking
    fiscalYear: {
      type: String,
    },

    fiscalPeriod: {
      type: String,
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
walkInSaleSchema.index({ organizationId: 1, receiptNumber: 1 }, { unique: true });
walkInSaleSchema.index({ organizationId: 1, saleDate: 1 });
walkInSaleSchema.index({ organizationId: 1, status: 1 });
walkInSaleSchema.index({ organizationId: 1, isDeleted: 1 });

// Static method to generate receipt number
walkInSaleSchema.statics.generateReceiptNumber = async function (organizationId, fiscalYear) {
  const year = fiscalYear || new Date().getFullYear().toString();
  const prefix = `RCPT-${year}-`;

  const lastReceipt = await this.findOne({
    organizationId,
    receiptNumber: new RegExp(`^${prefix}`),
  })
    .sort({ receiptNumber: -1 })
    .select('receiptNumber')
    .lean();

  if (!lastReceipt) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(lastReceipt.receiptNumber.split('-')[2]);
  const newNumber = lastNumber + 1;
  return `${prefix}${newNumber.toString().padStart(4, '0')}`;
};

// Pre-save hook to calculate amounts
walkInSaleSchema.pre('save', function (next) {
  // Calculate item amounts
  this.items.forEach((item) => {
    // Calculate base amount
    item.amount = item.quantity * item.rate;

    // Calculate discount
    if (item.discountRate > 0) {
      item.discountAmount = (item.amount * item.discountRate) / 100;
    }

    // Amount after discount
    const amountAfterDiscount = item.amount - item.discountAmount;

    // Calculate tax
    if (item.taxRate > 0) {
      item.taxAmount = (amountAfterDiscount * item.taxRate) / 100;
    }

    // Net amount
    item.netAmount = amountAfterDiscount + item.taxAmount;
  });

  // Calculate totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.totalDiscount = this.items.reduce((sum, item) => sum + item.discountAmount, 0);
  this.taxableAmount = this.subtotal - this.totalDiscount;
  this.totalTax = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
  this.totalAmount = this.taxableAmount + this.totalTax;

  // Calculate change
  if (this.paidAmount > this.totalAmount) {
    this.changeGiven = this.paidAmount - this.totalAmount;
  }

  // Set fiscal period
  if (this.saleDate) {
    const date = new Date(this.saleDate);
    this.fiscalYear = date.getFullYear().toString();
    this.fiscalPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  next();
});

// Method to post sale and create voucher
walkInSaleSchema.methods.post = async function (userId) {
  if (this.isPosted) {
    throw new Error('Sale is already posted');
  }

  if (this.status === 'cancelled') {
    throw new Error('Cannot post cancelled sale');
  }

  this.isPosted = true;
  this.postedAt = new Date();
  this.postedBy = userId;
  this.status = 'completed';

  return await this.save();
};

// Method to cancel sale
walkInSaleSchema.methods.cancel = async function (userId) {
  if (this.isPosted) {
    throw new Error('Cannot cancel posted sale. Use refund instead.');
  }

  this.status = 'cancelled';
  this.updatedBy = userId;

  return await this.save();
};

// Query middleware to exclude soft-deleted records
walkInSaleSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const WalkInSale =
  mongoose.models.WalkInSale || mongoose.model('WalkInSale', walkInSaleSchema);

export default WalkInSale;
