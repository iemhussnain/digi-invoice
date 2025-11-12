# FBR Digital Invoicing Integration - Implementation Guide

## Project Overview

**Application:** digi-invoice
**Version:** 0.1.0
**Framework:** Next.js 16.0.1 (App Router)
**Database:** MongoDB (Mongoose 8.19.3)
**Date:** 2025-11-12

---

## Table of Contents

1. [Tech Stack Analysis](#1-tech-stack-analysis)
2. [Database Schema (MongoDB)](#2-database-schema-mongodb)
3. [API Routes (Next.js App Router)](#3-api-routes-nextjs-app-router)
4. [FBR Service Layer](#4-fbr-service-layer)
5. [React Query Integration](#5-react-query-integration)
6. [Form Implementation (React Hook Form + Zod)](#6-form-implementation-react-hook-form--zod)
7. [UI Components (Flowbite)](#7-ui-components-flowbite)
8. [State Management (Zustand)](#8-state-management-zustand)
9. [PDF Generation](#9-pdf-generation)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Tech Stack Analysis

### Current Stack
```json
{
  "frontend": {
    "framework": "Next.js 16.0.1",
    "react": "19.2.0",
    "ui": "Flowbite React 0.12.10",
    "styling": "TailwindCSS 4",
    "animations": "Framer Motion 12.23.24"
  },
  "state": {
    "server": "TanStack React Query 5.90.7",
    "client": "Zustand 5.0.8"
  },
  "forms": {
    "library": "React Hook Form 7.66.0",
    "validation": "Zod 4.1.12",
    "resolver": "@hookform/resolvers 5.2.2"
  },
  "database": {
    "orm": "Mongoose 8.19.3",
    "type": "MongoDB"
  },
  "utilities": {
    "dates": "date-fns 4.1.0",
    "numbers": "numeral 2.0.6",
    "pdf": "@react-pdf/renderer 4.3.1",
    "excel": "xlsx 0.18.5",
    "toast": "react-hot-toast 2.6.0"
  },
  "auth": {
    "jwt": "jsonwebtoken 9.0.2",
    "password": "bcryptjs 3.0.3"
  }
}
```

### Additional Dependencies for FBR Integration

```json
{
  "dependencies": {
    "axios": "^1.6.7",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5"
  }
}
```

---

## 2. Database Schema (MongoDB)

### 2.1 Mongoose Models

#### **FBRConfiguration Model**

**File:** `src/models/FBRConfiguration.js`

```javascript
import mongoose from 'mongoose';

const fbrConfigurationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Seller Information
  sellerNTNCNIC: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 13
  },
  sellerBusinessName: {
    type: String,
    required: true,
    trim: true
  },
  sellerProvinceCode: {
    type: String,
    required: true
  },
  sellerProvinceName: {
    type: String,
    required: true
  },
  sellerAddress: {
    type: String,
    required: true
  },

  // Business Classification
  businessActivity: {
    type: String,
    required: true,
    enum: ['Manufacturer', 'Importer', 'Distributor', 'Wholesaler',
           'Retailer', 'Exporter', 'Service Provider', 'Other']
  },
  sector: {
    type: String,
    required: true,
    enum: ['Steel', 'FMCG', 'Textile', 'Telecom', 'Petroleum',
           'Electricity', 'Gas', 'Services', 'Automobile', 'CNG',
           'Pharmaceuticals', 'Retail', 'Other']
  },

  // API Credentials (encrypted)
  sandboxToken: {
    type: String,
    select: false // Don't return in queries by default
  },
  productionToken: {
    type: String,
    select: false // Don't return in queries by default
  },
  tokenExpiryDate: {
    type: Date
  },

  // Preferences
  environmentMode: {
    type: String,
    enum: ['sandbox', 'production'],
    default: 'sandbox'
  },
  defaultTaxRate: {
    type: Number,
    default: 18.00
  },
  autoValidate: {
    type: Boolean,
    default: true
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
fbrConfigurationSchema.index({ userId: 1 });
fbrConfigurationSchema.index({ sellerNTNCNIC: 1 });

// Don't expose tokens
fbrConfigurationSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.sandboxToken;
  delete obj.productionToken;
  return obj;
};

export default mongoose.models.FBRConfiguration ||
  mongoose.model('FBRConfiguration', fbrConfigurationSchema);
```

#### **FBRInvoice Model**

**File:** `src/models/FBRInvoice.js`

```javascript
import mongoose from 'mongoose';

const fbrInvoiceItemSchema = new mongoose.Schema({
  itemSerialNumber: {
    type: Number,
    required: true
  },
  fbrItemInvoiceNumber: String,

  // Product Details
  hsCode: {
    type: String,
    required: true
  },
  productDescription: {
    type: String,
    required: true
  },

  // Quantity & UOM
  quantity: {
    type: Number
  },
  uom: {
    type: String,
    required: true
  },

  // Pricing
  valueSalesExcludingST: {
    type: Number,
    default: 0
  },
  fixedNotifiedValueOrRetailPrice: {
    type: Number,
    default: 0
  },
  totalValues: {
    type: Number,
    default: 0
  },

  // Tax Details
  rate: {
    type: String,
    required: true
  },
  salesTaxApplicable: {
    type: Number,
    required: true
  },
  salesTaxWithheldAtSource: {
    type: Number,
    default: 0
  },
  furtherTax: {
    type: Number,
    default: 0
  },
  extraTax: {
    type: Number,
    default: 0
  },
  fedPayable: {
    type: Number,
    default: 0
  },

  // Discount
  discount: {
    type: Number,
    default: 0
  },

  // Sale Type & SRO
  saleType: {
    type: String,
    required: true
  },
  sroScheduleNo: String,
  sroItemSerialNo: String,

  // Item Validation Status
  itemStatus: {
    type: String,
    enum: ['pending', 'valid', 'invalid'],
    default: 'pending'
  },
  itemErrorCode: String,
  itemErrorMessage: String
});

const fbrInvoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Local Reference
  internalInvoiceNumber: String,
  localInvoiceId: mongoose.Schema.Types.ObjectId,

  // FBR Reference
  fbrInvoiceNumber: {
    type: String,
    unique: true,
    sparse: true // Allow null for drafts
  },
  fbrSubmissionDate: Date,

  // Invoice Header
  invoiceType: {
    type: String,
    required: true,
    enum: ['Sale Invoice', 'Debit Note']
  },
  invoiceDate: {
    type: Date,
    required: true
  },

  // Seller Info (denormalized for history)
  sellerNTNCNIC: {
    type: String,
    required: true
  },
  sellerBusinessName: {
    type: String,
    required: true
  },
  sellerProvince: {
    type: String,
    required: true
  },
  sellerAddress: {
    type: String,
    required: true
  },

  // Buyer Info
  buyerNTNCNIC: String,
  buyerBusinessName: {
    type: String,
    required: true
  },
  buyerProvince: {
    type: String,
    required: true
  },
  buyerAddress: {
    type: String,
    required: true
  },
  buyerRegistrationType: {
    type: String,
    required: true,
    enum: ['Registered', 'Unregistered']
  },

  // Debit Note Reference
  referenceInvoiceNumber: String,

  // Scenario (sandbox only)
  scenarioId: String,

  // Status Tracking
  submissionStatus: {
    type: String,
    enum: ['draft', 'validated', 'submitted', 'registered', 'failed'],
    default: 'draft'
  },

  // API Responses (stored as objects)
  validationResponse: mongoose.Schema.Types.Mixed,
  submissionResponse: mongoose.Schema.Types.Mixed,

  // Error Tracking
  errorCode: String,
  errorMessage: String,
  retryCount: {
    type: Number,
    default: 0
  },

  // QR Code
  qrCodeData: String, // Base64 encoded

  // Items
  items: [fbrInvoiceItemSchema],

  // Metadata
  environment: {
    type: String,
    enum: ['sandbox', 'production']
  }
}, {
  timestamps: true
});

// Indexes
fbrInvoiceSchema.index({ userId: 1 });
fbrInvoiceSchema.index({ fbrInvoiceNumber: 1 });
fbrInvoiceSchema.index({ submissionStatus: 1 });
fbrInvoiceSchema.index({ invoiceDate: 1 });
fbrInvoiceSchema.index({ buyerNTNCNIC: 1 });
fbrInvoiceSchema.index({ createdAt: -1 });

// Virtual for total amount
fbrInvoiceSchema.virtual('totalAmount').get(function() {
  return this.items.reduce((sum, item) => {
    return sum + (item.totalValues || 0);
  }, 0);
});

// Ensure virtuals are included
fbrInvoiceSchema.set('toJSON', { virtuals: true });
fbrInvoiceSchema.set('toObject', { virtuals: true });

export default mongoose.models.FBRInvoice ||
  mongoose.model('FBRInvoice', fbrInvoiceSchema);
```

#### **FBRReferenceData Models**

**File:** `src/models/FBRReferenceData.js`

```javascript
import mongoose from 'mongoose';

// Provinces
const provinceSchema = new mongoose.Schema({
  provinceCode: {
    type: Number,
    required: true,
    unique: true
  },
  provinceName: {
    type: String,
    required: true
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
});

// HS Codes
const hsCodeSchema = new mongoose.Schema({
  hsCode: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
});

// UOMs
const uomSchema = new mongoose.Schema({
  uomId: {
    type: Number,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
});

// Scenario Mappings
const scenarioMappingSchema = new mongoose.Schema({
  businessActivity: {
    type: String,
    required: true
  },
  sector: {
    type: String,
    required: true
  },
  scenarioId: {
    type: String,
    required: true
  },
  scenarioDescription: String,
  saleType: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

scenarioMappingSchema.index({ businessActivity: 1, sector: 1 });

export const FBRProvince = mongoose.models.FBRProvince ||
  mongoose.model('FBRProvince', provinceSchema);

export const FBRHSCode = mongoose.models.FBRHSCode ||
  mongoose.model('FBRHSCode', hsCodeSchema);

export const FBRUOM = mongoose.models.FBRUOM ||
  mongoose.model('FBRUOM', uomSchema);

export const FBRScenarioMapping = mongoose.models.FBRScenarioMapping ||
  mongoose.model('FBRScenarioMapping', scenarioMappingSchema);
```

---

## 3. API Routes (Next.js App Router)

### 3.1 Directory Structure

```
src/app/api/fbr/
├── configuration/
│   ├── route.js          # GET, POST /api/fbr/configuration
│   └── [id]/
│       └── route.js      # GET, PUT, DELETE /api/fbr/configuration/:id
├── invoices/
│   ├── route.js          # GET, POST /api/fbr/invoices
│   ├── [id]/
│   │   └── route.js      # GET, PUT, DELETE /api/fbr/invoices/:id
│   ├── validate/
│   │   └── route.js      # POST /api/fbr/invoices/validate
│   └── submit/
│       └── route.js      # POST /api/fbr/invoices/submit
├── reference/
│   ├── provinces/
│   │   └── route.js      # GET /api/fbr/reference/provinces
│   ├── hs-codes/
│   │   └── route.js      # GET /api/fbr/reference/hs-codes
│   ├── uoms/
│   │   └── route.js      # GET /api/fbr/reference/uoms
│   ├── tax-rates/
│   │   └── route.js      # GET /api/fbr/reference/tax-rates
│   ├── scenarios/
│   │   └── route.js      # GET /api/fbr/reference/scenarios
│   └── sync/
│       └── route.js      # POST /api/fbr/reference/sync
└── verify/
    └── buyer/
        └── route.js      # POST /api/fbr/verify/buyer
```

### 3.2 Configuration API Routes

**File:** `src/app/api/fbr/configuration/route.js`

```javascript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FBRConfiguration from '@/models/FBRConfiguration';
import { verifyToken } from '@/lib/auth';
import { encryptToken, decryptToken } from '@/lib/encryption';

// GET /api/fbr/configuration - Get user's FBR configuration
export async function GET(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const config = await FBRConfiguration.findOne({ userId: user.id });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching FBR configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/fbr/configuration - Create/Update FBR configuration
export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'sellerNTNCNIC',
      'sellerBusinessName',
      'sellerProvinceCode',
      'sellerProvinceName',
      'sellerAddress',
      'businessActivity',
      'sector'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    await dbConnect();

    // Encrypt tokens if provided
    const updateData = {
      userId: user.id,
      ...body
    };

    if (body.sandboxToken) {
      updateData.sandboxToken = encryptToken(body.sandboxToken);
    }
    if (body.productionToken) {
      updateData.productionToken = encryptToken(body.productionToken);
    }

    // Upsert configuration
    const config = await FBRConfiguration.findOneAndUpdate(
      { userId: user.id },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving FBR configuration:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3.3 Invoice API Routes

**File:** `src/app/api/fbr/invoices/route.js`

```javascript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FBRInvoice from '@/models/FBRInvoice';
import { verifyToken } from '@/lib/auth';

// GET /api/fbr/invoices - List user's invoices
export async function GET(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    await dbConnect();

    // Build query
    const query = { userId: user.id };

    if (status) {
      query.submissionStatus = status;
    }

    if (search) {
      query.$or = [
        { fbrInvoiceNumber: { $regex: search, $options: 'i' } },
        { buyerBusinessName: { $regex: search, $options: 'i' } },
        { internalInvoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      FBRInvoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FBRInvoice.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/fbr/invoices - Create new invoice (draft)
export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    await dbConnect();

    // Create invoice
    const invoice = await FBRInvoice.create({
      userId: user.id,
      ...body,
      submissionStatus: 'draft'
    });

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File:** `src/app/api/fbr/invoices/validate/route.js`

```javascript
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { validateInvoiceWithFBR } from '@/lib/fbr/invoice-service';

// POST /api/fbr/invoices/validate - Validate invoice with FBR
export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, payload } = body;

    if (!payload) {
      return NextResponse.json(
        { error: 'Invoice payload is required' },
        { status: 400 }
      );
    }

    // Validate with FBR
    const result = await validateInvoiceWithFBR(user.id, invoiceId, payload);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error validating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}
```

**File:** `src/app/api/fbr/invoices/submit/route.js`

```javascript
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { submitInvoiceToFBR } from '@/lib/fbr/invoice-service';

// POST /api/fbr/invoices/submit - Submit invoice to FBR
export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, payload } = body;

    if (!payload) {
      return NextResponse.json(
        { error: 'Invoice payload is required' },
        { status: 400 }
      );
    }

    // Submit to FBR
    const result = await submitInvoiceToFBR(user.id, invoiceId, payload);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Invoice submitted successfully to FBR'
    });
  } catch (error) {
    console.error('Error submitting invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Submission failed' },
      { status: 500 }
    );
  }
}
```

### 3.4 Reference Data API Routes

**File:** `src/app/api/fbr/reference/provinces/route.js`

```javascript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { FBRProvince } from '@/models/FBRReferenceData';

// GET /api/fbr/reference/provinces
export async function GET(request) {
  try {
    await dbConnect();

    const provinces = await FBRProvince.find({})
      .sort({ provinceName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File:** `src/app/api/fbr/reference/hs-codes/route.js`

```javascript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { FBRHSCode } from '@/models/FBRReferenceData';

// GET /api/fbr/reference/hs-codes?search=<query>
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    await dbConnect();

    const query = search
      ? {
          $or: [
            { hsCode: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const hsCodes = await FBRHSCode.find(query)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: hsCodes
    });
  } catch (error) {
    console.error('Error fetching HS codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File:** `src/app/api/fbr/reference/scenarios/route.js`

```javascript
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { FBRScenarioMapping } from '@/models/FBRReferenceData';

// GET /api/fbr/reference/scenarios?businessActivity=<>&sector=<>
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessActivity = searchParams.get('businessActivity');
    const sector = searchParams.get('sector');

    if (!businessActivity || !sector) {
      return NextResponse.json(
        { error: 'businessActivity and sector are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const scenarios = await FBRScenarioMapping.find({
      businessActivity,
      sector,
      isActive: true
    }).lean();

    return NextResponse.json({
      success: true,
      data: scenarios
    });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 4. FBR Service Layer

### 4.1 FBR API Client

**File:** `src/lib/fbr/api-client.js`

```javascript
import axios from 'axios';

const FBR_BASE_URLS = {
  sandbox: {
    dataAcquisition: 'https://gw.fbr.gov.pk/di_data/v1/di',
    reference: 'https://gw.fbr.gov.pk/pdi/v1',
    referenceV2: 'https://gw.fbr.gov.pk/pdi/v2',
    distribution: 'https://gw.fbr.gov.pk/dist/v1'
  },
  production: {
    dataAcquisition: 'https://gw.fbr.gov.pk/di_data/v1/di',
    reference: 'https://gw.fbr.gov.pk/pdi/v1',
    referenceV2: 'https://gw.fbr.gov.pk/pdi/v2',
    distribution: 'https://gw.fbr.gov.pk/dist/v1'
  }
};

class FBRApiClient {
  constructor(environment, token) {
    this.environment = environment;
    this.token = token;

    this.client = axios.create({
      baseURL: FBR_BASE_URLS[environment].dataAcquisition,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[FBR API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[FBR API] Response: ${response.status}`);
        return response;
      },
      (error) => {
        console.error(`[FBR API] Error:`, error.response?.data || error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  handleError(error) {
    if (error.response) {
      return {
        type: 'API_ERROR',
        statusCode: error.response.status,
        message: error.response.data?.error || 'FBR API Error',
        details: error.response.data
      };
    } else if (error.request) {
      return {
        type: 'NETWORK_ERROR',
        message: 'No response from FBR server',
        details: error.message
      };
    } else {
      return {
        type: 'CLIENT_ERROR',
        message: error.message,
        details: error
      };
    }
  }

  async requestWithRetry(config, maxRetries = 4) {
    const delays = [2000, 4000, 8000, 16000];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.request(config);
        return response.data;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isRetryable = this.isRetryableError(error);

        if (isLastAttempt || !isRetryable) {
          throw error;
        }

        await this.delay(delays[attempt]);
        console.log(`[FBR API] Retry attempt ${attempt + 1}/${maxRetries}`);
      }
    }

    throw new Error('Max retries exceeded');
  }

  isRetryableError(error) {
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validateInvoice(payload) {
    const endpoint = this.environment === 'sandbox'
      ? '/validateinvoicedata_sb'
      : '/validateinvoicedata';

    return await this.requestWithRetry({
      method: 'POST',
      url: endpoint,
      data: payload
    });
  }

  async submitInvoice(payload) {
    const endpoint = this.environment === 'sandbox'
      ? '/postinvoicedata_sb'
      : '/postinvoicedata';

    return await this.requestWithRetry({
      method: 'POST',
      url: endpoint,
      data: payload
    });
  }
}

export default FBRApiClient;
```

### 4.2 Invoice Service

**File:** `src/lib/fbr/invoice-service.js`

```javascript
import dbConnect from '@/lib/dbConnect';
import FBRConfiguration from '@/models/FBRConfiguration';
import FBRInvoice from '@/models/FBRInvoice';
import FBRApiClient from './api-client';
import { decryptToken } from '@/lib/encryption';
import QRCode from 'qrcode';

/**
 * Validate invoice with FBR
 */
export async function validateInvoiceWithFBR(userId, invoiceId, payload) {
  await dbConnect();

  // Get user's FBR configuration
  const config = await FBRConfiguration.findOne({ userId })
    .select('+sandboxToken +productionToken');

  if (!config) {
    throw new Error('FBR configuration not found. Please set up FBR configuration first.');
  }

  // Get the appropriate token
  const token = config.environmentMode === 'sandbox'
    ? decryptToken(config.sandboxToken)
    : decryptToken(config.productionToken);

  if (!token) {
    throw new Error(`${config.environmentMode} token not configured`);
  }

  // Create API client
  const apiClient = new FBRApiClient(config.environmentMode, token);

  // Add scenario ID if sandbox
  if (config.environmentMode === 'sandbox' && !payload.scenarioId) {
    // You might want to determine scenario based on sale type
    payload.scenarioId = 'SN001'; // Default
  }

  // Validate with FBR
  const response = await apiClient.validateInvoice(payload);

  // Update invoice if invoiceId provided
  if (invoiceId) {
    await FBRInvoice.findByIdAndUpdate(invoiceId, {
      validationResponse: response,
      submissionStatus: response.validationResponse?.statusCode === '00'
        ? 'validated'
        : 'draft',
      errorCode: response.validationResponse?.errorCode,
      errorMessage: response.validationResponse?.error
    });
  }

  return response;
}

/**
 * Submit invoice to FBR
 */
export async function submitInvoiceToFBR(userId, invoiceId, payload) {
  await dbConnect();

  // Get user's FBR configuration
  const config = await FBRConfiguration.findOne({ userId })
    .select('+sandboxToken +productionToken');

  if (!config) {
    throw new Error('FBR configuration not found');
  }

  // Get the appropriate token
  const token = config.environmentMode === 'sandbox'
    ? decryptToken(config.sandboxToken)
    : decryptToken(config.productionToken);

  if (!token) {
    throw new Error(`${config.environmentMode} token not configured`);
  }

  // Create API client
  const apiClient = new FBRApiClient(config.environmentMode, token);

  // Add scenario ID if sandbox
  if (config.environmentMode === 'sandbox' && !payload.scenarioId) {
    payload.scenarioId = 'SN001';
  }

  // Submit to FBR
  const response = await apiClient.submitInvoice(payload);

  // Generate QR code if successful
  let qrCodeData = null;
  if (response.invoiceNumber) {
    qrCodeData = await generateQRCode(response.invoiceNumber);
  }

  // Update invoice
  const updatedInvoice = await FBRInvoice.findByIdAndUpdate(
    invoiceId,
    {
      fbrInvoiceNumber: response.invoiceNumber,
      fbrSubmissionDate: new Date(),
      submissionResponse: response,
      submissionStatus: response.invoiceNumber ? 'registered' : 'failed',
      qrCodeData,
      environment: config.environmentMode,
      errorCode: response.validationResponse?.errorCode,
      errorMessage: response.validationResponse?.error
    },
    { new: true }
  );

  return {
    invoice: updatedInvoice,
    fbrResponse: response
  };
}

/**
 * Generate QR code for FBR invoice
 */
async function generateQRCode(invoiceNumber) {
  try {
    // QR code should contain invoice number
    const qrData = await QRCode.toDataURL(invoiceNumber, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 200,
      margin: 1
    });

    return qrData; // Returns base64 data URL
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
}

/**
 * Verify buyer registration with FBR
 */
export async function verifyBuyerRegistration(userId, registrationNo) {
  await dbConnect();

  const config = await FBRConfiguration.findOne({ userId })
    .select('+sandboxToken +productionToken');

  if (!config) {
    throw new Error('FBR configuration not found');
  }

  const token = config.environmentMode === 'sandbox'
    ? decryptToken(config.sandboxToken)
    : decryptToken(config.productionToken);

  // Call FBR Get_Reg_Type API
  const apiClient = new FBRApiClient(config.environmentMode, token);

  const response = await apiClient.client.post(
    '/Get_Reg_Type',
    { Registration_No: registrationNo }
  );

  return response.data;
}
```

### 4.3 Encryption Utility

**File:** `src/lib/encryption.js`

```javascript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-me-in-production';
const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);

/**
 * Encrypt a token
 */
export function encryptToken(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a token
 */
export function decryptToken(encryptedText) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

---

## 5. React Query Integration

### 5.1 Query Client Setup

**File:** `src/providers/QueryProvider.jsx`

```jsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false
      },
      mutations: {
        retry: 0
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 5.2 FBR Configuration Hooks

**File:** `src/hooks/useFBRConfiguration.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Fetch FBR configuration
 */
export function useFBRConfiguration() {
  return useQuery({
    queryKey: ['fbr-configuration'],
    queryFn: async () => {
      const { data } = await axios.get('/api/fbr/configuration');
      return data.data;
    },
    retry: 1
  });
}

/**
 * Save FBR configuration
 */
export function useSaveFBRConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configData) => {
      const { data } = await axios.post('/api/fbr/configuration', configData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fbr-configuration'] });
      toast.success('FBR configuration saved successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save configuration');
    }
  });
}
```

### 5.3 Invoice Hooks

**File:** `src/hooks/useFBRInvoices.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Fetch invoices list
 */
export function useFBRInvoices(params = {}) {
  const { page = 1, limit = 10, status, search } = params;

  return useQuery({
    queryKey: ['fbr-invoices', { page, limit, status, search }],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(search && { search })
      });

      const { data } = await axios.get(`/api/fbr/invoices?${queryParams}`);
      return data;
    },
    keepPreviousData: true
  });
}

/**
 * Fetch single invoice
 */
export function useFBRInvoice(invoiceId) {
  return useQuery({
    queryKey: ['fbr-invoice', invoiceId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/fbr/invoices/${invoiceId}`);
      return data.data;
    },
    enabled: !!invoiceId
  });
}

/**
 * Create invoice
 */
export function useCreateFBRInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData) => {
      const { data } = await axios.post('/api/fbr/invoices', invoiceData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fbr-invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    }
  });
}

/**
 * Validate invoice
 */
export function useValidateFBRInvoice() {
  return useMutation({
    mutationFn: async ({ invoiceId, payload }) => {
      const { data } = await axios.post('/api/fbr/invoices/validate', {
        invoiceId,
        payload
      });
      return data.data;
    },
    onSuccess: (data) => {
      if (data.validationResponse?.statusCode === '00') {
        toast.success('Invoice validation successful');
      } else {
        toast.error('Invoice validation failed');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Validation failed');
    }
  });
}

/**
 * Submit invoice
 */
export function useSubmitFBRInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, payload }) => {
      const { data } = await axios.post('/api/fbr/invoices/submit', {
        invoiceId,
        payload
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fbr-invoices'] });
      toast.success('Invoice submitted to FBR successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Submission failed');
    }
  });
}
```

### 5.4 Reference Data Hooks

**File:** `src/hooks/useFBRReferenceData.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

/**
 * Fetch provinces
 */
export function useFBRProvinces() {
  return useQuery({
    queryKey: ['fbr-provinces'],
    queryFn: async () => {
      const { data } = await axios.get('/api/fbr/reference/provinces');
      return data.data;
    },
    staleTime: 24 * 60 * 60 * 1000 // 24 hours
  });
}

/**
 * Fetch HS codes
 */
export function useFBRHSCodes(search = '') {
  return useQuery({
    queryKey: ['fbr-hs-codes', search],
    queryFn: async () => {
      const params = new URLSearchParams({ search, limit: '50' });
      const { data } = await axios.get(`/api/fbr/reference/hs-codes?${params}`);
      return data.data;
    },
    enabled: search.length >= 2,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Fetch UOMs
 */
export function useFBRUOMs() {
  return useQuery({
    queryKey: ['fbr-uoms'],
    queryFn: async () => {
      const { data } = await axios.get('/api/fbr/reference/uoms');
      return data.data;
    },
    staleTime: 24 * 60 * 60 * 1000 // 24 hours
  });
}

/**
 * Fetch scenarios for business activity and sector
 */
export function useFBRScenarios(businessActivity, sector) {
  return useQuery({
    queryKey: ['fbr-scenarios', businessActivity, sector],
    queryFn: async () => {
      const params = new URLSearchParams({ businessActivity, sector });
      const { data } = await axios.get(`/api/fbr/reference/scenarios?${params}`);
      return data.data;
    },
    enabled: !!(businessActivity && sector),
    staleTime: 24 * 60 * 60 * 1000 // 24 hours
  });
}
```

---

**(Continuing in next part...)**
