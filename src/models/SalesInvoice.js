/**
 * Sales Invoice Model
 * For managing sales invoices with accounting integration
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

// Invoice Item Schema
const invoiceItemSchema = new Schema(
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
      min: [0, 'Amount cannot be negative'],
    },

    // Optional product reference for future
    productId: {
      type: ObjectId,
      ref: 'Product',
    },

    // Tax on this item
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

    // Discount on this item
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

// Main Sales Invoice Schema
const salesInvoiceSchema = new Schema(
  {
    // Organization reference
    organizationId: {
      type: ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Invoice identification
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    invoiceDate: {
      type: Date,
      required: [true, 'Invoice date is required'],
      default: Date.now,
    },

    dueDate: {
      type: Date,
    },

    // Customer reference
    customerId: {
      type: ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },

    // Invoice items
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'Invoice must have at least one item',
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

    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },

    balanceAmount: {
      type: Number,
      default: 0,
    },

    // Additional charges
    shippingCharges: {
      type: Number,
      default: 0,
      min: [0, 'Shipping charges cannot be negative'],
    },

    otherCharges: {
      type: Number,
      default: 0,
    },

    // Tax details
    taxType: {
      type: String,
      enum: ['none', 'gst', 'sales_tax', 'inclusive', 'exclusive'],
      default: 'none',
    },

    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'posted', 'partially_paid', 'paid', 'cancelled', 'overdue'],
      default: 'draft',
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid'],
      default: 'unpaid',
      index: true,
    },

    // Notes and references
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    terms: {
      type: String,
      trim: true,
      maxlength: [1000, 'Terms cannot exceed 1000 characters'],
    },

    referenceNumber: {
      type: String,
      trim: true,
    },

    // Accounting integration
    voucherId: {
      type: ObjectId,
      ref: 'Voucher',
    },

    revenueAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    receivableAccountId: {
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
salesInvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
salesInvoiceSchema.index({ organizationId: 1, customerId: 1 });
salesInvoiceSchema.index({ organizationId: 1, invoiceDate: 1 });
salesInvoiceSchema.index({ organizationId: 1, status: 1 });
salesInvoiceSchema.index({ organizationId: 1, isDeleted: 1 });

// Virtual for overdue status
salesInvoiceSchema.virtual('isOverdue').get(function () {
  if (this.status === 'paid' || this.status === 'cancelled') return false;
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

// Virtual for days overdue
salesInvoiceSchema.virtual('daysOverdue').get(function () {
  if (!this.isOverdue) return 0;
  const diff = new Date() - this.dueDate;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Static method to generate invoice number
salesInvoiceSchema.statics.generateInvoiceNumber = async function (organizationId, fiscalYear) {
  const year = fiscalYear || new Date().getFullYear().toString();
  const prefix = `INV-${year}-`;

  const lastInvoice = await this.findOne({
    organizationId,
    invoiceNumber: new RegExp(`^${prefix}`),
  })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean();

  if (!lastInvoice) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
  const newNumber = lastNumber + 1;
  return `${prefix}${newNumber.toString().padStart(4, '0')}`;
};

// Pre-save hook to calculate amounts
salesInvoiceSchema.pre('save', function (next) {
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

  // Add shipping and other charges
  this.totalAmount =
    this.taxableAmount + this.totalTax + this.shippingCharges + this.otherCharges;

  // Calculate balance
  this.balanceAmount = this.totalAmount - this.paidAmount;

  // Update payment status
  if (this.paidAmount === 0) {
    this.paymentStatus = 'unpaid';
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = 'paid';
    if (this.status === 'posted' || this.status === 'partially_paid') {
      this.status = 'paid';
    }
  } else {
    this.paymentStatus = 'partially_paid';
    if (this.status === 'posted') {
      this.status = 'partially_paid';
    }
  }

  // Set fiscal period
  if (this.invoiceDate) {
    const date = new Date(this.invoiceDate);
    this.fiscalYear = date.getFullYear().toString();
    this.fiscalPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  next();
});

// Method to post invoice and create voucher
salesInvoiceSchema.methods.post = async function (userId) {
  if (this.isPosted) {
    throw new Error('Invoice is already posted');
  }

  if (this.status === 'cancelled') {
    throw new Error('Cannot post cancelled invoice');
  }

  this.isPosted = true;
  this.postedAt = new Date();
  this.postedBy = userId;
  this.status = 'posted';

  return await this.save();
};

// Method to cancel invoice
salesInvoiceSchema.methods.cancel = async function (userId) {
  if (this.isPosted && this.paidAmount > 0) {
    throw new Error('Cannot cancel invoice with payments');
  }

  this.status = 'cancelled';
  this.updatedBy = userId;

  return await this.save();
};

// Method to record payment
salesInvoiceSchema.methods.recordPayment = async function (amount, userId) {
  if (this.status === 'cancelled') {
    throw new Error('Cannot record payment for cancelled invoice');
  }

  if (!this.isPosted) {
    throw new Error('Invoice must be posted before recording payment');
  }

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }

  if (this.paidAmount + amount > this.totalAmount) {
    throw new Error('Payment exceeds invoice balance');
  }

  this.paidAmount += amount;
  this.updatedBy = userId;

  return await this.save();
};

// Query middleware to exclude soft-deleted records
salesInvoiceSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const SalesInvoice =
  mongoose.models.SalesInvoice || mongoose.model('SalesInvoice', salesInvoiceSchema);

export default SalesInvoice;
