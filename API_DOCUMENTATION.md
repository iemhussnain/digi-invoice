# API Documentation

Complete API reference for DigiInvoice ERP system.

## Table of Contents

1. [Authentication](#authentication)
2. [RBAC (Roles & Permissions)](#rbac-roles--permissions)
3. [Users & Profile](#users--profile)
4. [Chart of Accounts](#chart-of-accounts)
5. [Journal Vouchers](#journal-vouchers)
6. [Financial Reports](#financial-reports)
7. [Customers](#customers)
8. [Sales Invoices](#sales-invoices)
9. [Quick Sales (POS)](#quick-sales-pos)
10. [Suppliers](#suppliers)
11. [Purchase Orders](#purchase-orders)
12. [Goods Receipt Notes (GRN)](#goods-receipt-notes-grn)
13. [Purchase Invoices](#purchase-invoices)
14. [Utility Endpoints](#utility-endpoints)

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API endpoints (except login, register, and health check) require JWT authentication.

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Authentication

### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login

**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": {
        "_id": "456",
        "name": "Admin",
        "level": 100
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User

**GET** `/auth/me`

Get authenticated user's profile with permissions.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": {
        "_id": "456",
        "name": "Admin",
        "level": 100,
        "permissions": ["accounts:create", "accounts:read", ...]
      }
    }
  }
}
```

---

### Refresh Token

**POST** `/auth/refresh`

Refresh JWT token before expiry.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here"
  }
}
```

---

### Logout

**POST** `/auth/logout`

Invalidate current session (client-side token removal).

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Forgot Password

**POST** `/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### Reset Password

**POST** `/auth/reset-password`

Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### Verify Email

**POST** `/auth/verify-email`

Verify email address using verification token.

**Request Body:**
```json
{
  "token": "email_verification_token"
}
```

---

### Resend Verification Email

**POST** `/auth/resend-verification`

Resend email verification link.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

---

## RBAC (Roles & Permissions)

### Get All Permissions

**GET** `/rbac/permissions`

Retrieve all permissions, optionally grouped by category.

**Query Parameters:**
- `grouped=true` - Group permissions by category
- `category=<string>` - Filter by category
- `resource=<string>` - Filter by resource
- `action=<string>` - Filter by action

**Response (200):**
```json
{
  "success": true,
  "data": {
    "permissions": {
      "accounts": [
        {
          "_id": "123",
          "key": "accounts:create",
          "name": "Create Account",
          "description": "Create new chart of accounts entry",
          "resource": "accounts",
          "action": "create",
          "category": "accounts"
        }
      ],
      "sales": [...]
    },
    "totalCategories": 5,
    "totalPermissions": 42
  }
}
```

---

### Seed Default Permissions

**POST** `/rbac/permissions/seed`

Seed the database with default permissions (one-time setup).

**Response (200):**
```json
{
  "success": true,
  "message": "Permissions seeded successfully",
  "data": {
    "count": 42
  }
}
```

---

### Get All Roles

**GET** `/rbac/roles`

Retrieve all roles.

**Query Parameters:**
- `includePermissions=true` - Include permission details

**Response (200):**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "_id": "123",
        "name": "Admin",
        "description": "System administrator",
        "level": 100,
        "color": "#3B82F6",
        "isSystem": true,
        "permissions": ["accounts:create", "accounts:read", ...]
      }
    ]
  }
}
```

---

### Create Role

**POST** `/rbac/roles`

Create a new role.

**Request Body:**
```json
{
  "name": "Accountant",
  "description": "Manages accounting operations",
  "level": 60,
  "color": "#10B981",
  "permissions": ["accounts:read", "vouchers:create"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "role": {
      "_id": "789",
      "name": "Accountant",
      "level": 60,
      "permissions": [...]
    }
  }
}
```

---

### Get Role by ID

**GET** `/rbac/roles/:id`

Retrieve a specific role.

**Query Parameters:**
- `includePermissions=true` - Include full permission objects

**Response (200):**
```json
{
  "success": true,
  "data": {
    "role": {
      "_id": "123",
      "name": "Admin",
      "level": 100,
      "permissions": [
        {
          "_id": "456",
          "key": "accounts:create",
          "name": "Create Account"
        }
      ],
      "userCount": 5
    }
  }
}
```

---

### Update Role

**PUT** `/rbac/roles/:id`

Update role details (name, description, level, color).

**Request Body:**
```json
{
  "name": "Senior Accountant",
  "description": "Senior accounting role",
  "level": 70,
  "color": "#EF4444"
}
```

---

### Update Role Permissions

**PUT** `/rbac/roles/:id/permissions`

Update role's assigned permissions.

**Request Body:**
```json
{
  "permissions": ["accounts:read", "accounts:create", "vouchers:create"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Role permissions updated successfully",
  "data": {
    "role": {
      "_id": "123",
      "name": "Accountant",
      "permissions": ["accounts:read", "accounts:create", "vouchers:create"]
    }
  }
}
```

---

### Delete Role

**DELETE** `/rbac/roles/:id`

Delete a role (soft delete, cannot delete system roles).

**Response (200):**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

---

## Users & Profile

### Get All Users

**GET** `/users`

Retrieve all users with their roles.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "123",
        "name": "John Doe",
        "email": "john@example.com",
        "role": {
          "_id": "456",
          "name": "Admin",
          "level": 100
        },
        "isActive": true
      }
    ]
  }
}
```

---

### Get User by ID

**GET** `/users/:id`

Retrieve specific user details.

---

### Update User

**PUT** `/users/:id`

Update user information.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

---

### Assign Role to User

**PUT** `/users/:id/role`

Assign or change user's role.

**Request Body:**
```json
{
  "roleId": "789"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user": {
      "_id": "123",
      "name": "John Doe",
      "role": {
        "_id": "789",
        "name": "Accountant"
      }
    }
  }
}
```

---

### Delete User

**DELETE** `/users/:id`

Soft delete a user.

---

### Get Profile

**GET** `/profile`

Get authenticated user's complete profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "/uploads/avatar.jpg",
      "role": {...}
    }
  }
}
```

---

### Update Profile

**PUT** `/profile`

Update own profile information.

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+92-300-1234567"
}
```

---

### Change Password

**PUT** `/profile/password`

Change user's own password.

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

---

### Upload Avatar

**POST** `/profile/avatar`

Upload profile picture.

**Request:** `multipart/form-data` with `avatar` field

---

## Chart of Accounts

### Get All Accounts

**GET** `/accounts`

Retrieve all accounts with hierarchy.

**Query Parameters:**
- `type=<string>` - Filter by account type (Asset, Liability, Equity, Revenue, Expense)
- `isActive=true` - Only active accounts

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "_id": "123",
        "code": "1000",
        "name": "Cash",
        "type": "Asset",
        "parentAccount": null,
        "level": 1,
        "balance": 150000,
        "isActive": true
      },
      {
        "_id": "124",
        "code": "1100",
        "name": "Bank Account",
        "type": "Asset",
        "parentAccount": "123",
        "level": 2,
        "balance": 250000
      }
    ]
  }
}
```

---

### Create Account

**POST** `/accounts`

Create new account in chart of accounts.

**Permission Required:** `accounts:create`

**Request Body:**
```json
{
  "code": "1200",
  "name": "Accounts Receivable",
  "type": "Asset",
  "parentAccount": "123",
  "description": "Money owed by customers",
  "currency": "PKR"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "account": {
      "_id": "125",
      "code": "1200",
      "name": "Accounts Receivable",
      "type": "Asset",
      "level": 2,
      "balance": 0
    }
  }
}
```

---

### Get Account by ID

**GET** `/accounts/:id`

Retrieve specific account with balance and transactions.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "account": {
      "_id": "123",
      "code": "1000",
      "name": "Cash",
      "type": "Asset",
      "balance": 150000,
      "recentTransactions": [...]
    }
  }
}
```

---

### Update Account

**PUT** `/accounts/:id`

Update account details.

**Permission Required:** `accounts:update`

**Request Body:**
```json
{
  "name": "Cash in Hand",
  "description": "Updated description"
}
```

---

### Delete Account

**DELETE** `/accounts/:id`

Soft delete an account (only if no transactions exist).

**Permission Required:** `accounts:delete`

---

### Seed Chart of Accounts

**POST** `/accounts/seed`

Seed default chart of accounts structure.

**Response (200):**
```json
{
  "success": true,
  "message": "Chart of accounts seeded successfully",
  "data": {
    "count": 15
  }
}
```

---

## Journal Vouchers

### Get All Vouchers

**GET** `/vouchers`

Retrieve all journal vouchers.

**Query Parameters:**
- `status=<string>` - Filter by status (draft, posted, void)
- `startDate=<date>` - From date
- `endDate=<date>` - To date
- `limit=<number>` - Results per page
- `page=<number>` - Page number

**Response (200):**
```json
{
  "success": true,
  "data": {
    "vouchers": [
      {
        "_id": "123",
        "voucherNumber": "JV-001",
        "date": "2025-11-11",
        "description": "Sales invoice SI-001",
        "totalDebit": 10000,
        "totalCredit": 10000,
        "status": "posted",
        "entries": [
          {
            "accountId": {
              "code": "1200",
              "name": "Accounts Receivable"
            },
            "debit": 10000,
            "credit": 0
          },
          {
            "accountId": {
              "code": "4000",
              "name": "Sales Revenue"
            },
            "debit": 0,
            "credit": 10000
          }
        ]
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "pages": 5
    }
  }
}
```

---

### Create Voucher

**POST** `/vouchers`

Create a new journal voucher.

**Permission Required:** `vouchers:create`

**Request Body:**
```json
{
  "date": "2025-11-11",
  "description": "Opening balance entry",
  "entries": [
    {
      "accountId": "123",
      "description": "Cash opening balance",
      "debit": 50000,
      "credit": 0
    },
    {
      "accountId": "456",
      "description": "Equity contribution",
      "debit": 0,
      "credit": 50000
    }
  ]
}
```

**Validation:**
- Total debit must equal total credit
- At least 2 entries required
- All account IDs must exist

**Response (201):**
```json
{
  "success": true,
  "message": "Voucher created successfully",
  "data": {
    "voucher": {
      "_id": "789",
      "voucherNumber": "JV-002",
      "status": "draft"
    }
  }
}
```

---

### Get Voucher by ID

**GET** `/vouchers/:id`

Retrieve specific voucher with all entries.

---

### Update Voucher

**PUT** `/vouchers/:id`

Update draft voucher (only drafts can be updated).

**Request Body:** Same as Create Voucher

---

### Post Voucher

**POST** `/vouchers/:id/post`

Post voucher to ledger (update account balances).

**Permission Required:** `vouchers:post`

**Response (200):**
```json
{
  "success": true,
  "message": "Voucher posted successfully",
  "data": {
    "voucher": {
      "_id": "789",
      "status": "posted",
      "postedDate": "2025-11-11T10:30:00Z",
      "postedBy": "123"
    }
  }
}
```

---

### Void Voucher

**POST** `/vouchers/:id/void`

Void a posted voucher (reversal).

**Permission Required:** `vouchers:void`

**Request Body:**
```json
{
  "reason": "Incorrect entry - needs correction"
}
```

---

### Delete Voucher

**DELETE** `/vouchers/:id`

Delete draft voucher (only drafts can be deleted).

---

## Financial Reports

### Account Ledger

**GET** `/reports/ledger`

Generate account ledger report.

**Query Parameters:**
- `accountId=<id>` - Required, account to view
- `startDate=<date>` - From date
- `endDate=<date>` - To date

**Response (200):**
```json
{
  "success": true,
  "data": {
    "account": {
      "_id": "123",
      "code": "1000",
      "name": "Cash"
    },
    "openingBalance": 100000,
    "transactions": [
      {
        "date": "2025-11-01",
        "voucherNumber": "JV-001",
        "description": "Sales receipt",
        "debit": 15000,
        "credit": 0,
        "balance": 115000
      },
      {
        "date": "2025-11-05",
        "voucherNumber": "JV-002",
        "description": "Payment to supplier",
        "debit": 0,
        "credit": 8000,
        "balance": 107000
      }
    ],
    "closingBalance": 107000,
    "totalDebit": 15000,
    "totalCredit": 8000
  }
}
```

---

### Trial Balance

**GET** `/reports/trial-balance`

Generate trial balance report.

**Query Parameters:**
- `asOfDate=<date>` - Report as of date (defaults to today)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "asOfDate": "2025-11-11",
    "accounts": [
      {
        "code": "1000",
        "name": "Cash",
        "type": "Asset",
        "debit": 150000,
        "credit": 0
      },
      {
        "code": "2000",
        "name": "Accounts Payable",
        "type": "Liability",
        "debit": 0,
        "credit": 50000
      }
    ],
    "totals": {
      "totalDebit": 500000,
      "totalCredit": 500000,
      "balanced": true
    }
  }
}
```

---

### Balance Sheet

**GET** `/reports/balance-sheet`

Generate balance sheet.

**Query Parameters:**
- `asOfDate=<date>` - Report as of date

**Response (200):**
```json
{
  "success": true,
  "data": {
    "asOfDate": "2025-11-11",
    "assets": {
      "current": [
        { "code": "1000", "name": "Cash", "amount": 150000 },
        { "code": "1200", "name": "Accounts Receivable", "amount": 75000 }
      ],
      "fixed": [...],
      "total": 500000
    },
    "liabilities": {
      "current": [...],
      "longTerm": [...],
      "total": 200000
    },
    "equity": {
      "capital": 250000,
      "retained": 50000,
      "total": 300000
    },
    "balanced": true
  }
}
```

---

## Customers

### Get All Customers

**GET** `/customers`

Retrieve all customers.

**Query Parameters:**
- `search=<string>` - Search by name, email, or phone
- `isActive=true` - Only active customers

**Response (200):**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "_id": "123",
        "name": "ABC Corporation",
        "email": "contact@abc.com",
        "phone": "+92-300-1234567",
        "ntn": "1234567-8",
        "strn": "12-34-5678-901-23",
        "gstRegistered": true,
        "balance": 25000,
        "creditLimit": 100000,
        "isActive": true
      }
    ]
  }
}
```

---

### Create Customer

**POST** `/customers`

Create new customer.

**Permission Required:** `customers:create`

**Request Body:**
```json
{
  "name": "XYZ Traders",
  "email": "info@xyz.com",
  "phone": "+92-321-9876543",
  "address": "123 Main St, Karachi",
  "ntn": "7654321-0",
  "strn": "98-76-5432-109-87",
  "gstRegistered": true,
  "creditLimit": 50000
}
```

---

### Get Customer by ID

**GET** `/customers/:id`

Retrieve customer with transaction history.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "customer": {
      "_id": "123",
      "name": "ABC Corporation",
      "balance": 25000,
      "recentInvoices": [...]
    }
  }
}
```

---

### Update Customer

**PUT** `/customers/:id`

Update customer details.

**Permission Required:** `customers:update`

---

### Delete Customer

**DELETE** `/customers/:id`

Soft delete customer (only if no outstanding balance).

**Permission Required:** `customers:delete`

---

## Sales Invoices

### Get All Invoices

**GET** `/invoices`

Retrieve all sales invoices.

**Query Parameters:**
- `status=<string>` - Filter by status (draft, posted)
- `customerId=<id>` - Filter by customer
- `startDate=<date>` - From date
- `endDate=<date>` - To date

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "_id": "123",
        "invoiceNumber": "SI-001",
        "date": "2025-11-11",
        "customer": {
          "_id": "456",
          "name": "ABC Corporation"
        },
        "items": [
          {
            "description": "Product A",
            "quantity": 10,
            "unitPrice": 500,
            "total": 5000
          }
        ],
        "subtotal": 5000,
        "taxAmount": 850,
        "totalAmount": 5850,
        "status": "posted"
      }
    ]
  }
}
```

---

### Create Invoice

**POST** `/invoices`

Create new sales invoice.

**Permission Required:** `invoices:create`

**Request Body:**
```json
{
  "customerId": "456",
  "date": "2025-11-11",
  "items": [
    {
      "description": "Product A",
      "quantity": 10,
      "unitPrice": 500,
      "taxRate": 17
    }
  ],
  "notes": "Thank you for your business"
}
```

**Calculations (Automatic):**
- Subtotal = Sum of (quantity × unitPrice)
- Tax = Subtotal × (taxRate / 100)
- Total = Subtotal + Tax

---

### Get Invoice by ID

**GET** `/invoices/:id`

Retrieve specific invoice.

---

### Update Invoice

**PUT** `/invoices/:id`

Update draft invoice.

---

### Post Invoice to Accounts

**POST** `/invoices/:id/post`

Post invoice to accounts (create journal voucher).

**Permission Required:** `invoices:post`

**Accounting Entries Created:**
- DR: Accounts Receivable (Customer) - Total Amount
- CR: Sales Revenue - Subtotal
- CR: Sales Tax Payable - Tax Amount

---

### Delete Invoice

**DELETE** `/invoices/:id`

Delete draft invoice.

---

## Quick Sales (POS)

### Create Quick Sale

**POST** `/sales`

Create walk-in cash sale (POS).

**Permission Required:** `sales:create`

**Request Body:**
```json
{
  "customerName": "Walk-in Customer",
  "date": "2025-11-11",
  "items": [
    {
      "description": "Item 1",
      "quantity": 2,
      "unitPrice": 1000,
      "taxRate": 17
    }
  ],
  "paymentMethod": "cash"
}
```

**Auto-posting:**
- DR: Cash - Total Amount
- CR: Sales Revenue - Subtotal
- CR: Sales Tax Payable - Tax Amount

---

### Post Quick Sale

**POST** `/sales/:id/post`

Post quick sale to accounts.

---

## Suppliers

### Get All Suppliers

**GET** `/suppliers`

Retrieve all suppliers.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suppliers": [
      {
        "_id": "123",
        "name": "Supply Co.",
        "email": "info@supply.com",
        "phone": "+92-300-1111111",
        "ntn": "9999999-9",
        "strn": "11-22-3344-556-67",
        "gstRegistered": true,
        "balance": -50000,
        "paymentTerms": "Net 30",
        "isActive": true
      }
    ]
  }
}
```

---

### Create Supplier

**POST** `/suppliers`

Create new supplier.

**Permission Required:** `suppliers:create`

**Request Body:**
```json
{
  "name": "New Supplier Ltd",
  "email": "sales@newsupplier.com",
  "phone": "+92-321-2222222",
  "address": "456 Industrial Area, Lahore",
  "ntn": "1111111-1",
  "strn": "22-33-4455-667-78",
  "gstRegistered": true,
  "paymentTerms": "Net 30",
  "bankDetails": {
    "accountTitle": "New Supplier Ltd",
    "accountNumber": "1234567890",
    "bankName": "HBL",
    "iban": "PK12HABB1234567890"
  }
}
```

---

### Get Supplier by ID

**GET** `/suppliers/:id`

Retrieve supplier with transaction history.

---

### Update Supplier

**PUT** `/suppliers/:id`

Update supplier details.

---

### Delete Supplier

**DELETE** `/suppliers/:id`

Soft delete supplier (only if no outstanding balance).

---

## Purchase Orders

### Get All Purchase Orders

**GET** `/purchase-orders`

Retrieve all purchase orders.

**Query Parameters:**
- `status=<string>` - Filter by status (draft, sent, confirmed, closed)
- `supplierId=<id>` - Filter by supplier

**Response (200):**
```json
{
  "success": true,
  "data": {
    "purchaseOrders": [
      {
        "_id": "123",
        "poNumber": "PO-001",
        "date": "2025-11-11",
        "supplier": {
          "_id": "456",
          "name": "Supply Co."
        },
        "items": [
          {
            "description": "Raw Material A",
            "quantity": 100,
            "unitPrice": 250,
            "total": 25000,
            "receivedQuantity": 80
          }
        ],
        "totalAmount": 25000,
        "status": "confirmed"
      }
    ]
  }
}
```

---

### Create Purchase Order

**POST** `/purchase-orders`

Create new purchase order.

**Permission Required:** `purchase-orders:create`

**Request Body:**
```json
{
  "supplierId": "456",
  "date": "2025-11-11",
  "deliveryDate": "2025-11-20",
  "items": [
    {
      "description": "Raw Material A",
      "quantity": 100,
      "unitPrice": 250
    }
  ],
  "terms": "Net 30 days",
  "notes": "Urgent delivery required"
}
```

---

### Get Purchase Order by ID

**GET** `/purchase-orders/:id`

Retrieve specific purchase order.

---

### Update Purchase Order

**PUT** `/purchase-orders/:id`

Update purchase order (draft or sent status only).

---

### Send Purchase Order to Supplier

**POST** `/purchase-orders/:id/send`

Send PO to supplier via email and mark as "sent".

**Permission Required:** `purchase-orders:send`

**Response (200):**
```json
{
  "success": true,
  "message": "Purchase order sent to supplier",
  "data": {
    "purchaseOrder": {
      "_id": "123",
      "status": "sent",
      "sentDate": "2025-11-11T10:30:00Z"
    }
  }
}
```

---

### Delete Purchase Order

**DELETE** `/purchase-orders/:id`

Delete purchase order (draft status only).

---

## Goods Receipt Notes (GRN)

### Get All GRNs

**GET** `/grn`

Retrieve all goods receipt notes.

**Query Parameters:**
- `status=<string>` - Filter by status (draft, inspected, completed)
- `supplierId=<id>` - Filter by supplier
- `purchaseOrderId=<id>` - Filter by PO

**Response (200):**
```json
{
  "success": true,
  "data": {
    "grns": [
      {
        "_id": "123",
        "grnNumber": "GRN-001",
        "date": "2025-11-12",
        "purchaseOrder": {
          "_id": "456",
          "poNumber": "PO-001"
        },
        "supplier": {
          "_id": "789",
          "name": "Supply Co."
        },
        "items": [
          {
            "description": "Raw Material A",
            "orderedQuantity": 100,
            "receivedQuantity": 95,
            "acceptedQuantity": 90,
            "rejectedQuantity": 5,
            "qualityGrade": "A"
          }
        ],
        "status": "inspected"
      }
    ]
  }
}
```

---

### Create GRN

**POST** `/grn`

Create new goods receipt note (manually).

**Permission Required:** `grn:create`

---

### Create GRN from Purchase Order

**POST** `/grn/from-po/:poId`

Create GRN directly from a purchase order.

**Permission Required:** `grn:create`

**Response (201):**
```json
{
  "success": true,
  "message": "GRN created from purchase order",
  "data": {
    "grn": {
      "_id": "123",
      "grnNumber": "GRN-001",
      "purchaseOrder": "456",
      "items": [
        {
          "description": "Raw Material A",
          "orderedQuantity": 100,
          "receivedQuantity": 100,
          "acceptedQuantity": 0,
          "rejectedQuantity": 0
        }
      ],
      "status": "draft"
    }
  }
}
```

---

### Get GRN by ID

**GET** `/grn/:id`

Retrieve specific GRN.

---

### Update GRN

**PUT** `/grn/:id`

Update GRN details.

---

### Inspect GRN

**POST** `/grn/:id/inspect`

Complete quality inspection and update quantities.

**Permission Required:** `grn:inspect`

**Request Body:**
```json
{
  "items": [
    {
      "itemId": "item1",
      "acceptedQuantity": 90,
      "rejectedQuantity": 5,
      "qualityGrade": "A",
      "inspectionNotes": "5 units damaged in transit"
    }
  ],
  "inspectorName": "John Doe",
  "inspectionDate": "2025-11-12"
}
```

**Actions:**
- Updates PO received quantities
- Marks GRN as inspected
- Ready for purchase invoice creation

---

### Delete GRN

**DELETE** `/grn/:id`

Delete GRN (draft status only).

---

## Purchase Invoices

### Get All Purchase Invoices

**GET** `/purchase-invoices`

Retrieve all purchase invoices.

**Query Parameters:**
- `status=<string>` - Filter by status (draft, pending, approved, posted)
- `matchingStatus=<string>` - Filter by 3-way matching status (pending, matched, mismatched, approved)
- `supplierId=<id>` - Filter by supplier

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "_id": "123",
        "invoiceNumber": "PI-001",
        "supplierInvoiceNumber": "SUP-INV-789",
        "date": "2025-11-13",
        "supplier": {
          "_id": "456",
          "name": "Supply Co."
        },
        "grn": {
          "_id": "789",
          "grnNumber": "GRN-001"
        },
        "items": [
          {
            "description": "Raw Material A",
            "poQuantity": 100,
            "grnQuantity": 90,
            "invoiceQuantity": 90,
            "quantityMatched": true,
            "unitPrice": 250,
            "total": 22500
          }
        ],
        "taxableAmount": 22500,
        "totalTax": 3825,
        "totalAmount": 26325,
        "matchingStatus": "matched",
        "status": "approved"
      }
    ]
  }
}
```

---

### Create Purchase Invoice

**POST** `/purchase-invoices`

Create new purchase invoice from GRN.

**Permission Required:** `purchase-invoices:create`

**Request Body:**
```json
{
  "grnId": "789",
  "supplierId": "456",
  "supplierInvoiceNumber": "SUP-INV-789",
  "date": "2025-11-13",
  "dueDate": "2025-12-13",
  "items": [
    {
      "grnItemId": "item1",
      "description": "Raw Material A",
      "invoiceQuantity": 90,
      "unitPrice": 250,
      "taxRate": 17
    }
  ]
}
```

**Auto-populated from GRN:**
- PO quantities
- GRN quantities
- Supplier info
- Item descriptions

---

### Get Purchase Invoice by ID

**GET** `/purchase-invoices/:id`

Retrieve specific purchase invoice with 3-way matching details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invoice": {
      "_id": "123",
      "invoiceNumber": "PI-001",
      "matchingReport": {
        "summary": {
          "totalItems": 1,
          "matchedItems": 1,
          "mismatchedItems": 0,
          "overallMatch": true
        },
        "items": [
          {
            "description": "Raw Material A",
            "poQuantity": 100,
            "grnQuantity": 90,
            "invoiceQuantity": 90,
            "quantityVariance": 0,
            "quantityMatched": true,
            "priceMatched": true
          }
        ]
      }
    }
  }
}
```

---

### Verify 3-Way Matching

**POST** `/purchase-invoices/:id/verify`

Verify PO vs GRN vs Invoice matching.

**Permission Required:** `purchase-invoices:verify`

**Response (200):**
```json
{
  "success": true,
  "message": "3-way matching verified successfully",
  "data": {
    "matched": true,
    "matchingStatus": "matched",
    "report": {
      "summary": {
        "totalItems": 1,
        "matchedItems": 1,
        "mismatchedItems": 0
      },
      "variances": []
    }
  }
}
```

**If Mismatched (200):**
```json
{
  "success": true,
  "message": "3-way matching completed with variances",
  "data": {
    "matched": false,
    "matchingStatus": "mismatched",
    "report": {
      "summary": {
        "totalItems": 2,
        "matchedItems": 1,
        "mismatchedItems": 1
      },
      "variances": [
        {
          "item": "Raw Material B",
          "type": "quantity",
          "expected": 50,
          "actual": 45,
          "variance": -5
        }
      ]
    }
  }
}
```

---

### Approve Purchase Invoice

**POST** `/purchase-invoices/:id/approve`

Approve purchase invoice after matching verification.

**Permission Required:** `purchase-invoices:approve`

**Request Body:**
```json
{
  "approvalNotes": "Verified and approved for payment"
}
```

---

### Post Purchase Invoice to Accounts

**POST** `/purchase-invoices/:id/post`

Post approved invoice to accounts (create journal voucher).

**Permission Required:** `purchase-invoices:post`

**Accounting Entries Created:**
- DR: Purchases/Expense Account - Taxable Amount
- DR: Input Tax Account - Tax Amount
- CR: Accounts Payable (Supplier) - Total Amount

**Response (200):**
```json
{
  "success": true,
  "message": "Purchase invoice posted to accounts successfully",
  "data": {
    "invoice": {
      "_id": "123",
      "status": "posted",
      "postedDate": "2025-11-13T10:30:00Z"
    },
    "voucher": {
      "_id": "999",
      "voucherNumber": "JV-050",
      "totalDebit": 26325,
      "totalCredit": 26325
    }
  }
}
```

---

### Update Purchase Invoice

**PUT** `/purchase-invoices/:id`

Update purchase invoice (draft status only).

---

### Delete Purchase Invoice

**DELETE** `/purchase-invoices/:id`

Delete purchase invoice (draft status only).

---

## Utility Endpoints

### Health Check

**GET** `/health`

Check API health status.

**No Authentication Required**

**Response (200):**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2025-11-11T10:30:00Z",
  "uptime": 123456
}
```

---

### Test Models

**GET** `/test-models`

Test database models and connections (development only).

**Response (200):**
```json
{
  "success": true,
  "message": "All models loaded successfully",
  "models": ["User", "Role", "Permission", "Account", ...]
}
```

---

## Error Responses

All errors follow this format:

**Response (4xx/5xx):**
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error information"
  }
}
```

### Common Error Codes

- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (duplicate entry)
- **500** - Internal Server Error

### Example Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fields": {
        "email": "Email is required",
        "password": "Password must be at least 8 characters"
      }
    }
  }
}
```

---

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP

---

## Changelog

### Version 1.0.0 (2025-11-11)

- Initial API release
- Complete CRUD operations for all modules
- 3-way matching for purchase invoices
- Double-entry accounting
- RBAC implementation
- Financial reporting

---

**Last Updated**: 2025-11-11
**API Version**: 1.0.0
**Total Endpoints**: 54
