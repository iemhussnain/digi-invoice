/**
 * Stock Model
 * For managing inventory/stock items
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const stockSchema = new Schema(
  {
    // Organization reference
    organizationId: {
      type: ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Stock Name
    stockName: {
      type: String,
      required: [true, 'Stock name is required'],
      trim: true,
      minlength: [2, 'Stock name must be at least 2 characters'],
      maxlength: [200, 'Stock name cannot exceed 200 characters'],
    },

    // HS Code (Harmonized System Code)
    hsCode: {
      type: String,
      required: [true, 'HS Code is required'],
      trim: true,
      index: true,
    },

    // Description (auto-filled from HS Code)
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    // Sale Type
    saleType: {
      type: String,
      required: [true, 'Sale type is required'],
      trim: true,
    },

    // Unit of Measurement
    uoM: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      trim: true,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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
stockSchema.index({ organizationId: 1, stockName: 1 });
stockSchema.index({ organizationId: 1, hsCode: 1 });
stockSchema.index({ organizationId: 1, isDeleted: 1, isActive: 1 });

// Query middleware to exclude soft-deleted records
stockSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);

export default Stock;
