# System Architecture

Technical architecture documentation for DigiInvoice ERP.

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Business Logic](#business-logic)
7. [API Design](#api-design)
8. [Frontend Architecture](#frontend-architecture)
9. [Security](#security)
10. [Performance Considerations](#performance-considerations)

---

## Overview

DigiInvoice ERP follows a **monolithic architecture** using Next.js 16's App Router with server-side rendering and API routes. The application is built as a full-stack system with:

- **Frontend**: React 18 with Server Components
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with role-based access control

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                         │
│                    (React Components)                        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Pages/Routes │  │   Middleware │  │  API Routes  │     │
│  │  (UI Layer)  │  │     (Auth)   │  │  (Business)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Database                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Users   │ │  Roles   │ │ Accounts │ │ Vouchers │      │
│  │Customers │ │Suppliers │ │Invoices  │ │  Orders  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| React | 18.x | UI library |
| TailwindCSS | 3.x | Utility-first CSS |
| Flowbite | Latest | UI component design |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 16.x | Serverless API endpoints |
| MongoDB | 6.0+ | NoSQL database |
| Mongoose | Latest | MongoDB ODM |

### Authentication & Security

| Technology | Purpose |
|------------|---------|
| JWT | Stateless authentication |
| bcrypt | Password hashing |
| Middleware | Route protection |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Git | Version control |
| npm/yarn/pnpm | Package management |

---

## Architecture Patterns

### 1. MVC Pattern (Modified)

```
┌─────────────┐
│    View     │  → React Components (Client & Server)
│  (UI Layer) │
└──────┬──────┘
       │
┌──────▼──────┐
│ Controller  │  → API Routes (/api/*)
│ (API Layer) │
└──────┬──────┘
       │
┌──────▼──────┐
│    Model    │  → Mongoose Models
│ (Data Layer)│
└─────────────┘
```

### 2. Repository Pattern

Each model includes static and instance methods acting as repositories:

**Example:**
```javascript
// Account Model - Repository Methods
class Account {
  // Static methods (query entire collection)
  static async getByType(type) { ... }
  static async getHierarchy() { ... }

  // Instance methods (operate on single document)
  async updateBalance(amount) { ... }
  async getChildren() { ... }
}
```

### 3. Service Layer Pattern

Complex business logic is separated from API routes:

```
API Route → Service Function → Model Methods → Database
```

**Example: Purchase Invoice Posting**
```javascript
// API Route (Thin controller)
POST /api/purchase-invoices/:id/post
  → postPurchaseInvoiceService(id)
    → PurchaseInvoice.findById(id)
    → createJournalVoucher()
    → updateSupplierBalance()
    → Transaction.commit()
```

### 4. Middleware Pattern

Request processing pipeline:

```
Request → Auth Middleware → Permission Middleware → API Handler → Response
```

### 5. Soft Delete Pattern

All deletions are logical, preserving data:

```javascript
// Instead of db.collection.deleteOne()
document.isDeleted = true;
document.deletedAt = new Date();
document.deletedBy = userId;
await document.save();
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────┐         ┌──────────┐
│  User   │────────▶│   Role   │
└─────────┘         └────┬─────┘
                         │
                         │ has many
                         ↓
                  ┌──────────────┐
                  │  Permission  │
                  └──────────────┘

┌──────────┐
│ Customer │───────┐
└──────────┘       │
                   │ has many
                   ↓
             ┌──────────────┐      ┌──────────────┐
             │Sales Invoice │─────▶│JournalVoucher│
             └──────────────┘      └──────┬───────┘
                                          │
┌──────────┐                              │ references
│ Supplier │───────┐                      ↓
└──────────┘       │               ┌─────────────┐
                   │ has many      │   Account   │
                   ↓               └─────────────┘
          ┌────────────────┐
          │ Purchase Order │
          └────────┬───────┘
                   │
                   ↓ creates
          ┌────────────────┐
          │      GRN       │
          └────────┬───────┘
                   │
                   ↓ creates
          ┌────────────────────┐
          │ Purchase Invoice   │
          └────────────────────┘
```

### Core Models

#### 1. User Model

**File:** `src/models/User.js`

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: ObjectId (ref: 'Role'),
  avatar: String,
  isActive: Boolean,
  isEmailVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean,
  deletedAt: Date
}
```

**Key Methods:**
- `comparePassword(password)` - Verify password
- `generateToken()` - Create JWT
- `hasPermission(permission)` - Check if user has specific permission

**Indexes:**
- `email: 1` (unique)
- `isDeleted: 1, isActive: 1`

---

#### 2. Role Model

**File:** `src/models/Role.js`

```javascript
{
  _id: ObjectId,
  name: String (unique),
  description: String,
  level: Number (0-100),
  color: String (hex code),
  permissions: [String], // Permission keys
  isSystem: Boolean, // Protected system roles
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

**Key Methods:**
- `hasPermission(permissionKey)` - Check permission
- `addPermissions(keys)` - Add multiple permissions
- `removePermissions(keys)` - Remove permissions

**Indexes:**
- `name: 1` (unique)
- `level: -1`

---

#### 3. Permission Model

**File:** `src/models/Permission.js`

```javascript
{
  _id: ObjectId,
  key: String (unique), // "accounts:create"
  name: String, // "Create Account"
  description: String,
  resource: String, // "accounts"
  action: String, // "create"
  category: String, // "accounts", "sales", etc.
  displayOrder: Number,
  isActive: Boolean
}
```

**Permission Naming Convention:**
```
{resource}:{action}

Examples:
- accounts:create
- accounts:read
- accounts:update
- accounts:delete
- invoices:post
- vouchers:void
```

**Indexes:**
- `key: 1` (unique)
- `category: 1, displayOrder: 1`

---

#### 4. Account Model (Chart of Accounts)

**File:** `src/models/Account.js`

```javascript
{
  _id: ObjectId,
  code: String (unique), // "1000", "1100"
  name: String,
  type: String, // Asset, Liability, Equity, Revenue, Expense
  parentAccount: ObjectId (ref: 'Account'),
  level: Number (1, 2, 3...), // Hierarchy depth
  description: String,
  currency: String (default: "PKR"),
  balance: Number (default: 0),
  isActive: Boolean,
  isSystem: Boolean,
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

**Key Methods:**
- `updateBalance(amount, isDebit)` - Update account balance
- `getChildren()` - Get child accounts
- `getHierarchy()` - Get full hierarchy path

**Virtual Fields:**
- `fullName` - Code + Name ("1000 - Cash")
- `children` - Child accounts

**Indexes:**
- `code: 1` (unique)
- `type: 1, level: 1`
- `parentAccount: 1`

**Balance Rules:**
- **Debit increases**: Asset, Expense accounts
- **Credit increases**: Liability, Equity, Revenue accounts

---

#### 5. Journal Voucher Model

**File:** `src/models/JournalVoucher.js`

```javascript
{
  _id: ObjectId,
  voucherNumber: String (unique, auto-generated),
  date: Date,
  description: String,

  entries: [{
    accountId: ObjectId (ref: 'Account'),
    description: String,
    debit: Number (default: 0),
    credit: Number (default: 0)
  }],

  totalDebit: Number (calculated),
  totalCredit: Number (calculated),

  status: String, // draft, posted, void

  postedDate: Date,
  postedBy: ObjectId (ref: 'User'),

  voidedDate: Date,
  voidedBy: ObjectId (ref: 'User'),
  voidReason: String,

  sourceDocument: String, // "invoice", "purchase", "manual"
  sourceId: ObjectId,

  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

**Key Methods:**
- `post()` - Post voucher and update account balances
- `void()` - Reverse voucher with mirror entries
- `validate()` - Ensure debits = credits

**Validation:**
- Total Debit must equal Total Credit
- Minimum 2 entries required
- All accounts must exist and be active

**Auto-numbering:**
```javascript
JV-001, JV-002, JV-003, ...
```

---

#### 6. Customer Model

**File:** `src/models/Customer.js`

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  address: String,

  // Pakistan Tax Fields
  ntn: String, // National Tax Number
  strn: String, // Sales Tax Registration Number
  gstRegistered: Boolean,

  balance: Number (default: 0), // Positive = Owe us
  creditLimit: Number,

  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

**Key Methods:**
- `updateBalance(amount)` - Add to customer balance
- `checkCreditLimit(amount)` - Verify within credit limit

---

#### 7. Sales Invoice Model

**File:** `src/models/Invoice.js`

```javascript
{
  _id: ObjectId,
  invoiceNumber: String (unique, auto-generated),
  customer: ObjectId (ref: 'Customer'),
  date: Date,
  dueDate: Date,

  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    taxRate: Number (percentage),
    taxAmount: Number,
    total: Number
  }],

  subtotal: Number,
  totalTax: Number,
  totalAmount: Number,

  status: String, // draft, posted

  postedDate: Date,
  postedBy: ObjectId (ref: 'User'),
  voucherId: ObjectId (ref: 'JournalVoucher'),

  notes: String,
  terms: String,

  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

**Auto-numbering:**
```javascript
SI-001, SI-002, SI-003, ...
```

**Posting Logic:**
```javascript
// Debit: Accounts Receivable (Customer) - Total Amount
// Credit: Sales Revenue - Subtotal
// Credit: Sales Tax Payable - Tax Amount
```

---

#### 8. Supplier Model

**File:** `src/models/Supplier.js`

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  address: String,

  // Pakistan Tax Fields
  ntn: String,
  strn: String,
  gstRegistered: Boolean,

  balance: Number (default: 0), // Negative = We owe them
  paymentTerms: String, // "Net 30", "COD"

  bankDetails: {
    accountTitle: String,
    accountNumber: String,
    bankName: String,
    iban: String
  },

  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

---

#### 9. Purchase Order Model

**File:** `src/models/PurchaseOrder.js`

```javascript
{
  _id: ObjectId,
  poNumber: String (unique, auto-generated),
  supplier: ObjectId (ref: 'Supplier'),
  date: Date,
  deliveryDate: Date,

  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number,
    receivedQuantity: Number (default: 0)
  }],

  totalAmount: Number,

  status: String, // draft, sent, confirmed, closed

  sentDate: Date,
  confirmedDate: Date,

  terms: String,
  notes: String,

  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

**Auto-numbering:**
```javascript
PO-001, PO-002, PO-003, ...
```

**Status Workflow:**
```
Draft → Sent → Confirmed → Closed
```

---

#### 10. GRN Model (Goods Receipt Note)

**File:** `src/models/GRN.js`

```javascript
{
  _id: ObjectId,
  grnNumber: String (unique, auto-generated),
  purchaseOrder: ObjectId (ref: 'PurchaseOrder'),
  supplier: ObjectId (ref: 'Supplier'),
  date: Date,

  items: [{
    poItemId: ObjectId,
    description: String,
    orderedQuantity: Number,
    receivedQuantity: Number,
    acceptedQuantity: Number,
    rejectedQuantity: Number,
    qualityGrade: String, // A, B, C
    inspectionNotes: String
  }],

  status: String, // draft, inspected, completed

  inspectorName: String,
  inspectionDate: Date,

  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

**Auto-numbering:**
```javascript
GRN-001, GRN-002, GRN-003, ...
```

**Quality Grades:**
- **A**: Excellent quality
- **B**: Good quality (minor defects)
- **C**: Acceptable quality (some defects)

---

#### 11. Purchase Invoice Model

**File:** `src/models/PurchaseInvoice.js`

```javascript
{
  _id: ObjectId,
  invoiceNumber: String (unique, auto-generated),
  supplierInvoiceNumber: String,

  supplier: ObjectId (ref: 'Supplier'),
  grn: ObjectId (ref: 'GRN'),
  purchaseOrder: ObjectId (ref: 'PurchaseOrder'),

  date: Date,
  dueDate: Date,

  items: [{
    grnItemId: ObjectId,
    poItemId: ObjectId,
    description: String,

    // 3-Way Matching Quantities
    poQuantity: Number,
    grnQuantity: Number,
    invoiceQuantity: Number,

    unitPrice: Number,
    taxRate: Number,
    taxAmount: Number,
    total: Number,

    // Matching Results
    quantityMatched: Boolean,
    priceMatched: Boolean,
    quantityVariance: Number,
    priceVariance: Number
  }],

  taxableAmount: Number,
  totalTax: Number,
  totalAmount: Number,

  // 3-Way Matching Status
  matchingStatus: String, // pending, matched, mismatched, approved
  matchingDate: Date,
  matchingReport: Object,

  // Approval
  status: String, // draft, pending, approved, posted
  approvedDate: Date,
  approvedBy: ObjectId (ref: 'User'),
  approvalNotes: String,

  // Posting
  postedDate: Date,
  postedBy: ObjectId (ref: 'User'),
  voucherId: ObjectId (ref: 'JournalVoucher'),

  notes: String,

  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date,
  isDeleted: Boolean
}
```

**Auto-numbering:**
```javascript
PI-001, PI-002, PI-003, ...
```

**Key Methods:**
- `verify3WayMatching()` - Compare PO, GRN, and Invoice quantities
- `approve()` - Mark as approved after verification
- `post()` - Create journal voucher and update supplier balance

**3-Way Matching Logic:**
```javascript
// For each item:
1. Compare Invoice Quantity with GRN Quantity
   - If match (within tolerance): quantityMatched = true
   - If mismatch: quantityMatched = false, record variance

2. Compare Invoice Unit Price with PO Unit Price
   - If match (within tolerance): priceMatched = true
   - If mismatch: priceMatched = false, record variance

3. Overall Status:
   - All items matched → matchingStatus = "matched"
   - Any item mismatched → matchingStatus = "mismatched"
```

**Posting Logic:**
```javascript
// Debit: Purchases/Expense Account - Taxable Amount
// Debit: Input Tax Account - Tax Amount
// Credit: Accounts Payable (Supplier) - Total Amount
```

---

## Authentication & Authorization

### JWT Authentication Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. POST /api/auth/login
     │    { email, password }
     ↓
┌─────────────┐
│  API Route  │
└────┬────────┘
     │ 2. Verify credentials
     │ 3. Generate JWT token
     ↓
┌─────────────┐
│  Database   │
└────┬────────┘
     │ 4. Return { user, token }
     ↓
┌──────────┐
│  Client  │  5. Store token in localStorage/cookie
└────┬─────┘
     │ 6. Subsequent requests
     │    Header: Authorization: Bearer <token>
     ↓
┌─────────────┐
│ Middleware  │  7. Verify token & decode userId
└────┬────────┘
     │ 8. Fetch user & permissions
     ↓
┌─────────────┐
│  API Route  │  9. Check permissions
└─────────────┘  10. Execute business logic
```

### JWT Payload

```javascript
{
  userId: "user_id",
  email: "user@example.com",
  roleId: "role_id",
  iat: 1234567890, // Issued at
  exp: 1234654290  // Expires (7 days)
}
```

### Middleware Implementation

**File:** `src/middleware/auth.js`

```javascript
// Authentication Middleware
export async function withAuth(request, handler) {
  // 1. Extract token from Authorization header
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  // 2. Verify JWT
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Fetch user with role and permissions
  const user = await User.findById(decoded.userId)
    .populate('role');

  // 4. Attach to request
  request.user = user;
  request.userId = user._id;

  // 5. Call handler
  return handler(request);
}

// Permission Middleware
export async function withPermission(request, handler, permission) {
  return withAuth(request, async (req) => {
    // Check if user has permission
    if (!req.user.hasPermission(permission)) {
      return errorResponse('Forbidden', 403);
    }
    return handler(req);
  });
}

// Admin-only Middleware
export async function withAdmin(request, handler) {
  return withAuth(request, async (req) => {
    if (req.user.role.level < 90) {
      return errorResponse('Admin access required', 403);
    }
    return handler(req);
  });
}
```

### Permission Checking

```javascript
// In API route
export async function POST(request) {
  return withPermission(request, async (req) => {
    // User has 'accounts:create' permission
    // Execute business logic
    const account = await Account.create({...});
    return successResponse({ account });
  }, 'accounts:create');
}
```

---

## Business Logic

### 3-Way Matching System

**Purpose:** Verify that Purchase Order, Goods Receipt, and Purchase Invoice align.

**Process:**

```
1. Create Purchase Order (PO)
   ├── Items with ordered quantities and prices
   └── Status: draft → sent → confirmed

2. Receive Goods (GRN)
   ├── Reference PO
   ├── Record received quantities
   ├── Inspect quality (accept/reject)
   └── Update PO received quantities

3. Process Purchase Invoice
   ├── Reference GRN
   ├── Auto-populate PO & GRN quantities
   ├── Enter invoice quantities from supplier
   └── Verify 3-way matching

4. Matching Logic
   ├── Compare: PO Qty vs GRN Qty vs Invoice Qty
   ├── Compare: PO Price vs Invoice Price
   ├── Tolerance: ±0.01 for rounding
   └── Generate matching report

5. Approval & Posting
   ├── If matched: Auto-approve or require manual approval
   ├── If mismatched: Flag variances for review
   └── Post to accounts after approval
```

**Matching Report Example:**

```javascript
{
  summary: {
    totalItems: 3,
    matchedItems: 2,
    mismatchedItems: 1,
    overallMatch: false
  },
  items: [
    {
      description: "Item A",
      poQuantity: 100,
      grnQuantity: 95,
      invoiceQuantity: 95,
      quantityVariance: 0,
      quantityMatched: true,
      priceMatched: true
    },
    {
      description: "Item B",
      poQuantity: 50,
      grnQuantity: 48,
      invoiceQuantity: 50, // ← Supplier invoiced more than received!
      quantityVariance: 2,
      quantityMatched: false,
      priceMatched: true
    }
  ],
  variances: [
    {
      item: "Item B",
      type: "quantity",
      expected: 48,
      actual: 50,
      variance: 2,
      message: "Invoice quantity exceeds received quantity"
    }
  ]
}
```

---

### Double-Entry Accounting

**Principle:** Every transaction affects at least two accounts; total debits must equal total credits.

**Implementation:**

```javascript
// Account Balance Updates
function updateAccountBalance(account, amount, isDebit) {
  if (account.type === 'Asset' || account.type === 'Expense') {
    // Debit increases, Credit decreases
    account.balance += isDebit ? amount : -amount;
  } else {
    // Liability, Equity, Revenue
    // Credit increases, Debit decreases
    account.balance += isDebit ? -amount : amount;
  }
}
```

**Example: Sales Invoice Posting**

```javascript
// Invoice Total: 11,700
// Subtotal: 10,000
// Tax: 1,700

Entries:
[
  {
    account: "1200 - Accounts Receivable",
    debit: 11700,
    credit: 0
  },
  {
    account: "4000 - Sales Revenue",
    debit: 0,
    credit: 10000
  },
  {
    account: "2200 - Sales Tax Payable",
    debit: 0,
    credit: 1700
  }
]

// Validation: Total Debit (11700) = Total Credit (10000 + 1700) ✓
```

**Account Type Rules:**

| Account Type | Debit Effect | Credit Effect | Normal Balance |
|--------------|--------------|---------------|----------------|
| Asset        | Increase (+) | Decrease (-)  | Debit          |
| Liability    | Decrease (-) | Increase (+)  | Credit         |
| Equity       | Decrease (-) | Increase (+)  | Credit         |
| Revenue      | Decrease (-) | Increase (+)  | Credit         |
| Expense      | Increase (+) | Decrease (-)  | Debit          |

---

### Voucher Posting & Voiding

**Posting:**

```javascript
async function postVoucher(voucherId) {
  const voucher = await JournalVoucher.findById(voucherId);

  // Validate
  if (voucher.totalDebit !== voucher.totalCredit) {
    throw new Error('Voucher not balanced');
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update all account balances
    for (const entry of voucher.entries) {
      const account = await Account.findById(entry.accountId);

      if (entry.debit > 0) {
        await account.updateBalance(entry.debit, true);
      }
      if (entry.credit > 0) {
        await account.updateBalance(entry.credit, false);
      }
    }

    // Mark voucher as posted
    voucher.status = 'posted';
    voucher.postedDate = new Date();
    await voucher.save();

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

**Voiding:**

```javascript
async function voidVoucher(voucherId, reason) {
  const voucher = await JournalVoucher.findById(voucherId);

  // Create reversal voucher with opposite entries
  const reversalEntries = voucher.entries.map(entry => ({
    accountId: entry.accountId,
    description: `Reversal: ${entry.description}`,
    debit: entry.credit,  // ← Swap debit and credit
    credit: entry.debit
  }));

  const reversalVoucher = await JournalVoucher.create({
    date: new Date(),
    description: `Reversal of ${voucher.voucherNumber} - ${reason}`,
    entries: reversalEntries,
    sourceDocument: 'reversal',
    sourceId: voucherId
  });

  // Auto-post reversal
  await reversalVoucher.post();

  // Mark original as void
  voucher.status = 'void';
  voucher.voidedDate = new Date();
  voucher.voidReason = reason;
  await voucher.save();
}
```

---

## API Design

### RESTful Conventions

```
GET    /api/resource       - List all
POST   /api/resource       - Create new
GET    /api/resource/:id   - Get single
PUT    /api/resource/:id   - Update
DELETE /api/resource/:id   - Delete

POST   /api/resource/:id/action  - Custom actions
```

### Response Format

**Success Response:**
```javascript
{
  success: true,
  message: "Operation successful",
  data: { ... }
}
```

**Error Response:**
```javascript
{
  success: false,
  message: "Error description",
  error: {
    code: "ERROR_CODE",
    details: { ... }
  }
}
```

### Status Codes

- **200** - OK (Success)
- **201** - Created
- **400** - Bad Request (Validation error)
- **401** - Unauthorized (Not authenticated)
- **403** - Forbidden (No permission)
- **404** - Not Found
- **409** - Conflict (Duplicate entry)
- **500** - Internal Server Error

---

## Frontend Architecture

### App Router Structure

```
app/
├── (auth)/
│   ├── login/page.js
│   └── register/page.js
├── dashboard/page.js
└── admin/
    ├── layout.js (Protected layout)
    ├── accounts/page.js
    ├── invoices/
    │   ├── page.js (List)
    │   ├── new/page.js (Create)
    │   └── [id]/page.js (Detail)
    └── ...
```

### Component Patterns

**Server Components (Default):**
```javascript
// Fetch data on server
export default async function AccountsPage() {
  const accounts = await fetch('/api/accounts').then(r => r.json());
  return <AccountsList accounts={accounts.data} />;
}
```

**Client Components:**
```javascript
'use client';

export default function InvoiceForm() {
  const [items, setItems] = useState([]);
  // Interactive form logic
}
```

### State Management

Currently using React built-in hooks:
- `useState` - Component state
- `useEffect` - Side effects
- `useContext` - Global state (if needed)

**Future Enhancement:** Zustand or React Query for advanced state management

---

## Security

### Password Security

```javascript
// Hashing (on registration/password change)
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Verification (on login)
const isMatch = await bcrypt.compare(password, user.password);
```

### JWT Security

- **Secret Key:** Strong random string (256-bit)
- **Expiration:** 7 days (configurable)
- **Algorithm:** HS256
- **Storage:** Client-side in localStorage or httpOnly cookie

### Input Validation

All user inputs are validated:
```javascript
// Example: Create Account validation
if (!code || !name || !type) {
  return errorResponse('Required fields missing', 400);
}

if (!['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].includes(type)) {
  return errorResponse('Invalid account type', 400);
}
```

### SQL Injection Prevention

Using Mongoose ORM prevents SQL injection. MongoDB uses BSON, not SQL.

### XSS Prevention

- React automatically escapes output
- User inputs sanitized before storage
- No `dangerouslySetInnerHTML` used

### CSRF Protection

- SameSite cookies
- Token-based authentication (JWT)

---

## Performance Considerations

### Database Indexing

```javascript
// User Model
userSchema.index({ email: 1 });
userSchema.index({ isDeleted: 1, isActive: 1 });

// Account Model
accountSchema.index({ code: 1 });
accountSchema.index({ type: 1, level: 1 });

// Invoice Model
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customer: 1, date: -1 });
```

### Pagination

```javascript
GET /api/invoices?page=2&limit=20

// Implementation
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const invoices = await Invoice.find()
  .skip(skip)
  .limit(limit)
  .sort({ date: -1 });
```

### Caching Strategy

- **Static Assets:** Next.js automatic caching
- **API Responses:** No caching for real-time financial data
- **Database Connection:** Connection pooling via Mongoose

### N+1 Query Prevention

Using Mongoose `populate()`:

```javascript
// Instead of:
const invoices = await Invoice.find();
for (let inv of invoices) {
  inv.customer = await Customer.findById(inv.customer);
}

// Use:
const invoices = await Invoice.find().populate('customer');
```

---

## Deployment Considerations

### Environment Variables

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Database Backups

```bash
# Scheduled daily backups
mongodump --uri="$MONGODB_URI" --out=/backups/$(date +%Y%m%d)

# Retention: 30 days
```

### Monitoring

- Application logs: Winston/Pino
- Database monitoring: MongoDB Atlas
- Error tracking: Sentry (optional)

### Scalability

- **Vertical:** Increase server resources
- **Horizontal:** Load balancing with PM2/cluster mode
- **Database:** MongoDB sharding for large datasets

---

## Future Enhancements

1. **Form Management:** React Hook Form + Zod validation
2. **State Management:** Zustand or React Query
3. **PDF Generation:** jsPDF or @react-pdf/renderer
4. **Email Service:** Nodemailer integration
5. **File Upload:** AWS S3 or Cloudinary
6. **Real-time Updates:** Socket.io
7. **Audit Trail:** Track all data changes
8. **Multi-currency:** Support multiple currencies
9. **Multi-company:** Support multiple companies/organizations
10. **Reporting:** Advanced analytics with charts

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-11
**Status:** Complete
