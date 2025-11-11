/**
 * Purchase Invoice Model
 * For managing supplier invoices with 3-way matching
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

// Purchase Invoice Item Schema
const purchaseInvoiceItemSchema = new Schema(
  {
    // Reference to PO and GRN items
    poItemId: {
      type: ObjectId,
    },

    grnItemId: {
      type: ObjectId,
    },

    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },

    // Quantities for 3-way matching
    poQuantity: {
      type: Number,
      default: 0,
      min: [0, 'PO quantity cannot be negative'],
    },

    grnQuantity: {
      type: Number,
      default: 0,
      min: [0, 'GRN quantity cannot be negative'],
    },

    invoiceQuantity: {
      type: Number,
      required: [true, 'Invoice quantity is required'],
      min: [0.01, 'Invoice quantity must be greater than 0'],
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

    // Matching status
    quantityMatched: {
      type: Boolean,
      default: false,
    },

    priceMatched: {
      type: Boolean,
      default: false,
    },

    matchingRemarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Matching remarks cannot exceed 500 characters'],
    },
  },
  { _id: true }
);

// Main Purchase Invoice Schema
const purchaseInvoiceSchema = new Schema(
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
      uppercase: true,
      trim: true,
      index: true,
    },

    invoiceDate: {
      type: Date,
      required: [true, 'Invoice date is required'],
      default: Date.now,
    },

    dueDate: {
      type: Date,
    },

    // References
    purchaseOrderId: {
      type: ObjectId,
      ref: 'PurchaseOrder',
      required: [true, 'Purchase order is required'],
      index: true,
    },

    grnId: {
      type: ObjectId,
      ref: 'GoodsReceiptNote',
      required: [true, 'Goods receipt note is required'],
      index: true,
    },

    supplierId: {
      type: ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
      index: true,
    },

    // Items
    items: {
      type: [purchaseInvoiceItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'Purchase invoice must have at least one item',
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

    shippingCharges: {
      type: Number,
      default: 0,
      min: [0, 'Shipping charges cannot be negative'],
    },

    otherCharges: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },

    // Payment tracking
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },

    balanceAmount: {
      type: Number,
      default: 0,
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

    // 3-way matching
    matchingStatus: {
      type: String,
      enum: ['pending', 'matched', 'mismatched', 'approved'],
      default: 'pending',
      index: true,
    },

    quantityVariance: {
      type: Number,
      default: 0,
    },

    amountVariance: {
      type: Number,
      default: 0,
    },

    matchingRemarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Matching remarks cannot exceed 1000 characters'],
    },

    matchedBy: {
      type: ObjectId,
      ref: 'User',
    },

    matchedAt: {
      type: Date,
    },

    // Approval
    approvedBy: {
      type: ObjectId,
      ref: 'User',
    },

    approvedAt: {
      type: Date,
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'verified', 'approved', 'posted', 'paid', 'cancelled'],
      default: 'draft',
      index: true,
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    internalNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Internal notes cannot exceed 1000 characters'],
    },

    // Accounting integration
    voucherId: {
      type: ObjectId,
      ref: 'Voucher',
    },

    expenseAccountId: {
      type: ObjectId,
      ref: 'Account',
    },

    payableAccountId: {
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
purchaseInvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 });
purchaseInvoiceSchema.index({ organizationId: 1, invoiceDate: 1 });
purchaseInvoiceSchema.index({ organizationId: 1, supplierId: 1 });
purchaseInvoiceSchema.index({ organizationId: 1, purchaseOrderId: 1 });
purchaseInvoiceSchema.index({ organizationId: 1, grnId: 1 });
purchaseInvoiceSchema.index({ organizationId: 1, status: 1 });
purchaseInvoiceSchema.index({ organizationId: 1, matchingStatus: 1 });
purchaseInvoiceSchema.index({ organizationId: 1, isDeleted: 1 });

// Pre-save hook to calculate amounts
purchaseInvoiceSchema.pre('save', function (next) {
  // Calculate item amounts
  this.items.forEach((item) => {
    // Calculate base amount
    item.amount = item.invoiceQuantity * item.rate;

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
  this.totalAmount = this.taxableAmount + this.totalTax + this.shippingCharges + this.otherCharges;

  // Calculate balance amount
  this.balanceAmount = this.totalAmount - this.paidAmount;

  // Set fiscal period
  if (this.invoiceDate) {
    const date = new Date(this.invoiceDate);
    this.fiscalYear = date.getFullYear().toString();
    this.fiscalPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  next();
});

// Method to verify 3-way matching
purchaseInvoiceSchema.methods.verify3WayMatching = async function () {
  let allMatched = true;
  let totalQuantityVariance = 0;
  let totalAmountVariance = 0;

  this.items.forEach((item) => {
    // Check quantity matching (Invoice vs GRN)
    const qtyVariance = item.invoiceQuantity - item.grnQuantity;
    totalQuantityVariance += Math.abs(qtyVariance);

    if (Math.abs(qtyVariance) <= 0.01) {
      // Allow small tolerance
      item.quantityMatched = true;
    } else {
      item.quantityMatched = false;
      allMatched = false;
    }

    // Check price matching would happen at item level
    // For now, we'll mark as matched if quantity is matched
    item.priceMatched = item.quantityMatched;
  });

  // Calculate amount variance (if PO total is available)
  // This would compare invoice total vs PO expected amount
  this.quantityVariance = totalQuantityVariance;

  if (allMatched) {
    this.matchingStatus = 'matched';
  } else {
    this.matchingStatus = 'mismatched';
  }

  return allMatched;
};

// Method to approve invoice
purchaseInvoiceSchema.methods.approve = async function (userId) {
  if (this.status !== 'verified') {
    throw new Error('Only verified invoices can be approved');
  }

  this.status = 'approved';
  this.matchingStatus = 'approved';
  this.approvedBy = userId;
  this.approvedAt = new Date();
  this.updatedBy = userId;

  return await this.save();
};

// Method to post invoice
purchaseInvoiceSchema.methods.post = async function (userId) {
  if (this.status !== 'approved') {
    throw new Error('Only approved invoices can be posted');
  }

  if (this.isPosted) {
    throw new Error('Invoice is already posted');
  }

  this.isPosted = true;
  this.postedAt = new Date();
  this.postedBy = userId;
  this.status = 'posted';
  this.updatedBy = userId;

  return await this.save();
};

// Method to cancel invoice
purchaseInvoiceSchema.methods.cancel = async function (userId) {
  if (this.isPosted) {
    throw new Error('Cannot cancel posted invoice');
  }

  if (this.paidAmount > 0) {
    throw new Error('Cannot cancel invoice with payments');
  }

  this.status = 'cancelled';
  this.updatedBy = userId;

  return await this.save();
};

// Query middleware to exclude soft-deleted records
purchaseInvoiceSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const PurchaseInvoice =
  mongoose.models.PurchaseInvoice || mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);

export default PurchaseInvoice;
