/**
 * FBR Invoice Validation Schema using Zod
 * Matches the structure of your existing invoiceSchema
 */

import { z } from 'zod';

export const fbrInvoiceSchema = z.object({
  // Invoice Details
  invoiceType: z.string().min(1, 'Invoice type is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  localInvoiceNumber: z.string().optional(),
  invoiceRefNo: z.string().optional(),

  // Seller Information (Read-only from userFBRInfo)
  sellerNTNCNIC: z.string().min(1, 'Seller NTN/CNIC is required'),
  sellerBusinessName: z.string().min(1, 'Seller business name is required'),
  sellerProvince: z.string().min(1, 'Seller province is required'),
  sellerAddress: z.string().min(1, 'Seller address is required'),
  sellerGST: z.string().optional(),

  // Buyer Information
  buyerNTNCNIC: z.string().min(1, 'Buyer NTN/CNIC is required'),
  buyerBusinessName: z.string().min(1, 'Buyer business name is required'),
  buyerProvince: z.string().min(1, 'Buyer province is required'),
  buyerAddress: z.string().min(1, 'Buyer address is required'),
  buyerRegistrationType: z.string().min(1, 'Buyer registration type is required'),

  // Product Details
  stockName: z.string().optional(),
  hsCode: z.string().min(1, 'HS code is required'),
  productDescription: z.string().optional(),
  saleType: z.string().min(1, 'Sale type is required'),
  rate: z.string().min(1, 'Rate is required'),
  uoM: z.string().min(1, 'Unit of measurement is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),

  // Financial Details
  totalValues: z.coerce.number().nonnegative('Total values must be non-negative'),
  valueSalesExcludingST: z.coerce.number().nonnegative('Value sales excluding ST must be non-negative'),
  fixedNotifiedValueOrRetailPrice: z.coerce.number().nonnegative('Fixed notified value must be non-negative').optional(),
  salesTaxApplicable: z.coerce.number().nonnegative('Sales tax applicable must be non-negative').optional(),
  salesTaxWithheldAtSource: z.coerce.number().nonnegative('Sales tax withheld must be non-negative').optional(),
  extraTax: z.coerce.number().nonnegative('Extra tax must be non-negative').optional(),
  furtherTax: z.coerce.number().nonnegative('Further tax must be non-negative').optional(),
  sroScheduleNo: z.string().optional(),
  fedPayable: z.coerce.number().nonnegative('FED payable must be non-negative').optional(),
  discount: z.coerce.number().nonnegative('Discount must be non-negative').optional(),
  sroItemSerialNo: z.string().optional(),
});

export default fbrInvoiceSchema;
