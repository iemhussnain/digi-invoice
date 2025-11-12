# Advanced RBAC System - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Models](#models)
4. [Permissions](#permissions)
5. [Roles](#roles)
6. [API Reference](#api-reference)
7. [Middleware Usage](#middleware-usage)
8. [Frontend Integration](#frontend-integration)
9. [Testing & Seeding](#testing--seeding)
10. [Best Practices](#best-practices)

---

## Overview

The Advanced RBAC (Role-Based Access Control) system provides fine-grained permission management for the DigInvoice ERP platform.

### Features
- ✅ **80+ Pre-defined Permissions** - Comprehensive permission set covering all ERP modules
- ✅ **System Roles** - 6 predefined roles with appropriate permissions
- ✅ **Custom Roles** - Organizations can create custom roles
- ✅ **Dynamic Permission Assignment** - Assign/revoke permissions from roles
- ✅ **Organization Isolation** - Custom roles are organization-specific
- ✅ **Permission Middleware** - Easy-to-use middleware for route protection
- ✅ **Backward Compatible** - Works alongside existing role-based system
- ✅ **Audit Trail** - Complete logging of permission changes
- ✅ **UI-Ready** - Permissions grouped by category for easy display

---

## Architecture

### Permission-Based Access Control Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    RBAC ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────┘

1. USER REQUEST
   ┌──────────────┐
   │ API Request  │
   │ with JWT     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────┐
   │ Auth Middleware      │
   │ - Verify JWT         │
   │ - Attach user        │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Permission Middleware│
   │ - Check required     │
   │   permission(s)      │
   └──────┬───────────────┘
          │
          ├─── Has Permission ────┐
          │                       ▼
          │                ┌──────────────────┐
          │                │ Execute Handler  │
          │                │ (API logic)      │
          │                └──────────────────┘
          │
          └─── No Permission ─────┐
                                  ▼
                           ┌──────────────────┐
                           │ 403 Forbidden    │
                           │ Access Denied    │
                           └──────────────────┘

2. PERMISSION CHECK PROCESS
   ┌──────────────────────────┐
   │ User Object              │
   │ - roleId (ObjectId)      │
   │ - role (string - legacy) │
   └──────┬───────────────────┘
          │
          ├─── Super Admin? ──────┐
          │                       ▼
          │                ┌──────────────────┐
          │                │ Allow All        │
          │                │ (bypass check)   │
          │                └──────────────────┘
          │
          └─── Regular User ──────┐
                                  ▼
                           ┌──────────────────┐
                           │ Get User Role    │
                           │ (populate roleId)│
                           └──────┬───────────┘
                                  │
                                  ▼
                           ┌──────────────────┐
                           │ Get Role         │
                           │ Permissions      │
                           └──────┬───────────┘
                                  │
                                  ▼
                           ┌──────────────────┐
                           │ Check Permission │
                           │ Key Match        │
                           └──────────────────┘

3. ROLE-PERMISSION RELATIONSHIP
   ┌─────────────┐       ┌──────────────┐       ┌─────────────┐
   │    User     │──────▶│     Role     │──────▶│ Permissions │
   │             │       │              │       │   (Array)   │
   │ - roleId    │       │ - permissions│       │             │
   │ - role      │       │   (array)    │       │ - key       │
   └─────────────┘       └──────────────┘       │ - name      │
                                                 │ - resource  │
                                                 │ - action    │
                                                 └─────────────┘
```

### Database Schema

```javascript
// Permission
{
  _id: ObjectId,
  key: 'invoices.create',           // Unique identifier
  name: 'Create Invoices',           // Display name
  description: 'Create new invoices',// Description
  resource: 'invoices',              // Resource type
  action: 'create',                  // Action type
  category: 'Sales & Invoicing',     // UI category
  isSystem: true,                    // System permission
  isActive: true                     // Active status
}

// Role
{
  _id: ObjectId,
  name: 'Sales Manager',             // Role name
  key: 'sales_manager',              // Unique key (system roles only)
  description: '...',                // Role description
  organizationId: ObjectId,          // null for system, org ID for custom
  permissions: [ObjectId],           // Array of permission IDs
  isSystem: false,                   // System or custom role
  level: 60,                         // Hierarchy level (1-100)
  color: '#2563EB',                  // UI color
  icon: 'BriefcaseIcon',            // UI icon
  userCount: 5                       // Number of users with role
}

// User
{
  _id: ObjectId,
  name: 'John Doe',
  email: 'john@example.com',
  roleId: ObjectId,                  // Reference to Role (new RBAC)
  role: 'admin',                     // Legacy role string
  organizationId: ObjectId,
  // ... other fields
}
```

---

## Models

### 1. Permission Model

**File:** `src/models/Permission.js`

```javascript
import Permission from '@/models/Permission';

// Get all permissions grouped by category
const grouped = await Permission.getAllGrouped();
/*
Result:
{
  'User Management': [
    { key: 'users.view', name: 'View Users', ... },
    { key: 'users.create', name: 'Create Users', ... }
  ],
  'Customer Management': [...],
  ...
}
*/

// Get permissions by resource
const invoicePermissions = await Permission.getByResource('invoices');

// Check if permission exists
const exists = await Permission.exists('invoices.create');

// Seed default permissions
await Permission.seedPermissions();
```

**Permission Schema Fields:**
- `key` - Unique identifier (format: resource.action)
- `name` - Human-readable name
- `description` - What the permission allows
- `resource` - Resource category (users, invoices, etc.)
- `action` - Action type (view, create, edit, delete, manage, etc.)
- `category` - UI grouping category
- `isSystem` - System permission (cannot be deleted)
- `isActive` - Active status
- `displayOrder` - Sort order in UI

### 2. Role Model

**File:** `src/models/Role.js`

```javascript
import Role from '@/models/Role';

// Get all system roles
const systemRoles = await Role.getSystemRoles();

// Get organization custom roles
const customRoles = await Role.getOrganizationRoles(organizationId);

// Get all roles for organization (system + custom)
const allRoles = await Role.getAllForOrganization(organizationId);

// Create custom role
const role = new Role({
  name: 'Warehouse Manager',
  description: 'Manages inventory and stock',
  organizationId: orgId,
  permissions: [permId1, permId2],
  level: 55,
  color: '#059669',
  icon: 'TruckIcon'
});
await role.save();

// Add permission to role
await role.addPermission(permissionId);

// Remove permission from role
await role.removePermission(permissionId);

// Set permissions (replace all)
await role.setPermissions([permId1, permId2, permId3]);

// Check if role has permission
const hasPermission = role.hasPermission('invoices.create');

// Seed default system roles
await Role.seedSystemRoles();
```

**Role Schema Fields:**
- `name` - Role name
- `key` - Unique key (system roles only)
- `description` - Role description
- `organizationId` - null for system, org ID for custom
- `permissions` - Array of Permission ObjectIds
- `isSystem` - System role (cannot be modified/deleted)
- `isActive` - Active status
- `level` - Hierarchy level (1-100, 90+ reserved for system roles)
- `color` - Hex color for UI
- `icon` - Icon name for UI
- `userCount` - Number of users with this role

### 3. User Model Updates

**File:** `src/models/User.js`

```javascript
import User from '@/models/User';

// Check if user has specific permission
const canCreate = await user.hasPermission('invoices.create');

// Check if user has any of the permissions
const hasAny = await user.hasAnyPermission(['invoices.view', 'invoices.edit']);

// Check if user has all permissions
const hasAll = await user.hasAllPermissions(['invoices.create', 'invoices.edit']);

// Get all user permissions
const permissions = await user.getPermissions();

// Get user role information
const roleInfo = await user.getRoleInfo();
```

**New User Fields:**
- `roleId` - Reference to Role model (ObjectId)
- `role` - Legacy role string (for backward compatibility)

**New User Methods:**
- `hasPermission(key)` - Check single permission
- `hasAnyPermission(keys[])` - Check if user has ANY permission
- `hasAllPermissions(keys[])` - Check if user has ALL permissions
- `getPermissions()` - Get all user permissions
- `getRoleInfo()` - Get user's role object

---

## Permissions

### Default Permissions (80+)

#### User Management (7 permissions)
```javascript
'users.view'         - View user list and details
'users.create'       - Add new users
'users.edit'         - Update user information
'users.delete'       - Remove users
'users.manage'       - Full user management access

'roles.view'         - View roles and permissions
'roles.create'       - Create custom roles
'roles.edit'         - Update roles and assign permissions
'roles.delete'       - Remove custom roles
'roles.assign'       - Assign roles to users

'permissions.view'   - View all system permissions
'permissions.manage' - Manage permission system
```

#### Customer Management (5 permissions)
```javascript
'customers.view'     - View customer list and details
'customers.create'   - Add new customers
'customers.edit'     - Update customer information
'customers.delete'   - Remove customers
'customers.export'   - Export customer data
```

#### Supplier Management (4 permissions)
```javascript
'suppliers.view'
'suppliers.create'
'suppliers.edit'
'suppliers.delete'
```

#### Products & Services (8 permissions)
```javascript
'products.view'
'products.create'
'products.edit'
'products.delete'

'services.view'
'services.create'
'services.edit'
'services.delete'
```

#### Sales & Invoicing (6 permissions)
```javascript
'invoices.view'      - View all invoices
'invoices.create'    - Create new invoices
'invoices.edit'      - Update invoice details
'invoices.delete'    - Delete invoices
'invoices.approve'   - Approve/reject invoices
'invoices.export'    - Export invoice data
```

#### Purchase Orders (5 permissions)
```javascript
'purchase_orders.view'
'purchase_orders.create'
'purchase_orders.edit'
'purchase_orders.delete'
'purchase_orders.approve'
```

#### Payments & Banking (9 permissions)
```javascript
'payments.view'
'payments.create'
'payments.edit'
'payments.delete'
'payments.approve'

'expenses.view'
'expenses.create'
'expenses.edit'
'expenses.delete'
```

#### Accounting & Finance (9 permissions)
```javascript
'accounts.view'      - View chart of accounts
'accounts.create'    - Create new accounts
'accounts.edit'      - Update account details
'accounts.delete'    - Delete accounts

'journal_entries.view'
'journal_entries.create'
'journal_entries.edit'
'journal_entries.delete'

'ledger.view'        - View general ledger
```

#### Reports & Analytics (3 permissions)
```javascript
'reports.view'       - Access all reports
'reports.export'     - Export reports to PDF/Excel
'dashboard.view'     - Access dashboard and analytics
```

#### System Settings (4 permissions)
```javascript
'settings.view'      - View system settings
'settings.edit'      - Update system settings
'organizations.manage' - Full access to organization settings
'audit_logs.view'    - View system audit logs
```

### Permission Format

All permissions follow the format: `resource.action`

**Resources:**
users, roles, permissions, customers, suppliers, products, services, invoices, purchase_orders, payments, expenses, accounts, journal_entries, ledger, reports, dashboard, settings, organizations, audit_logs

**Actions:**
- `view` - Read/view resource
- `create` - Create new resource
- `edit` - Update existing resource
- `delete` - Delete resource
- `manage` - Full access (all actions)
- `export` - Export data
- `import` - Import data
- `approve` - Approve/reject actions
- `assign` - Assign to others

---

## Roles

### Default System Roles

#### 1. Super Admin (Level 100)
**Key:** `super_admin`
**Permissions:** ALL (80+)
**Description:** Full system access with all permissions

```javascript
{
  name: 'Super Admin',
  key: 'super_admin',
  level: 100,
  color: '#DC2626',
  icon: 'ShieldCheckIcon',
  permissions: [...all permissions...]
}
```

#### 2. Admin (Level 90)
**Key:** `admin`
**Permissions:** 75+ permissions
**Description:** Organization administrator

**Can:**
- Manage users, roles, and permissions
- Full access to customers, suppliers, products
- Create and approve invoices, purchase orders
- Manage payments and expenses
- View accounting and reports
- Edit organization settings

**Cannot:**
- Modify system roles
- Access other organizations

#### 3. Manager (Level 70)
**Key:** `manager`
**Permissions:** 60+ permissions
**Description:** Department manager

**Can:**
- View and create users (limited)
- Manage customers and suppliers
- Create and approve invoices
- Manage payments and expenses
- View accounting reports

**Cannot:**
- Delete users
- Modify roles
- Edit critical settings

#### 4. Accountant (Level 60)
**Key:** `accountant`
**Permissions:** 40+ permissions
**Description:** Finance and accounting specialist

**Can:**
- Full access to accounting module
- Manage payments and expenses
- Create invoices and purchase orders
- View and export reports

**Cannot:**
- Manage users or customers
- Edit products
- Modify system settings

#### 5. Sales (Level 50)
**Key:** `sales`
**Permissions:** 20+ permissions
**Description:** Sales representative

**Can:**
- Manage customers
- Create and edit invoices
- Record payments
- View products and services
- View sales reports

**Cannot:**
- Access accounting module
- Manage suppliers
- Approve transactions
- Access system settings

#### 6. User (Level 10)
**Key:** `user`
**Permissions:** 5+ permissions
**Description:** Basic user

**Can:**
- View customers
- View products and services
- View invoices
- View dashboard

**Cannot:**
- Create or edit anything
- Access settings
- Export data

### Custom Roles

Organizations can create custom roles with any combination of permissions:

```javascript
// Example: Warehouse Manager
{
  name: 'Warehouse Manager',
  description: 'Manages inventory and stock',
  organizationId: orgId,
  permissions: [
    'products.view',
    'products.create',
    'products.edit',
    'suppliers.view',
    'purchase_orders.view',
    'purchase_orders.create'
  ],
  level: 55,
  color: '#059669',
  icon: 'TruckIcon'
}
```

---

## API Reference

### Base URL
```
/api/rbac
```

### Authentication
All RBAC endpoints require authentication. Most require admin privileges.

---

### Permissions

#### 1. GET /api/rbac/permissions
Get all permissions

**Query Parameters:**
- `grouped` (boolean) - Group by category (default: false)
- `category` (string) - Filter by category
- `resource` (string) - Filter by resource
- `action` (string) - Filter by action

**Example Request:**
```bash
# Get all permissions as flat list
GET /api/rbac/permissions

# Get permissions grouped by category
GET /api/rbac/permissions?grouped=true

# Get permissions for specific resource
GET /api/rbac/permissions?resource=invoices
```

**Response (Flat):**
```json
{
  "success": true,
  "message": "Permissions retrieved successfully",
  "data": {
    "permissions": [
      {
        "_id": "perm_id",
        "key": "invoices.create",
        "name": "Create Invoices",
        "description": "Create new invoices",
        "resource": "invoices",
        "action": "create",
        "category": "Sales & Invoicing",
        "isSystem": true,
        "isActive": true,
        "displayOrder": 51
      }
    ],
    "total": 80
  }
}
```

**Response (Grouped):**
```json
{
  "success": true,
  "data": {
    "permissions": {
      "User Management": [
        { "key": "users.view", "name": "View Users", ... },
        { "key": "users.create", "name": "Create Users", ... }
      ],
      "Sales & Invoicing": [
        { "key": "invoices.view", "name": "View Invoices", ... },
        { "key": "invoices.create", "name": "Create Invoices", ... }
      ]
    },
    "totalCategories": 10,
    "totalPermissions": 80
  }
}
```

---

#### 2. POST /api/rbac/permissions/seed
Seed default permissions and roles (Super Admin only)

**Example Request:**
```bash
POST /api/rbac/permissions/seed
```

**Response:**
```json
{
  "success": true,
  "message": "RBAC system initialized successfully",
  "data": {
    "permissions": {
      "total": 80,
      "created": 80,
      "updated": 0
    },
    "roles": {
      "total": 6,
      "created": 6,
      "updated": 0
    }
  }
}
```

---

### Roles

#### 3. GET /api/rbac/roles
List all roles (system + organization custom roles)

**Query Parameters:**
- `includePermissions` (boolean) - Include permission details (default: false)
- `type` (string) - Filter by type: 'system' or 'custom'

**Example Request:**
```bash
# Get all roles (system + custom)
GET /api/rbac/roles

# Get roles with permissions
GET /api/rbac/roles?includePermissions=true

# Get only system roles
GET /api/rbac/roles?type=system
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "role_id",
        "name": "Admin",
        "key": "admin",
        "description": "Organization administrator...",
        "isSystem": true,
        "isCustom": false,
        "level": 90,
        "color": "#EA580C",
        "icon": "UserShieldIcon",
        "userCount": 3,
        "permissionCount": 75,
        "permissions": [...] // if includePermissions=true
      }
    ],
    "total": 8,
    "system": 6,
    "custom": 2
  }
}
```

---

#### 4. POST /api/rbac/roles
Create custom role

**Request Body:**
```json
{
  "name": "Warehouse Manager",
  "description": "Manages inventory and stock",
  "permissions": ["perm_id1", "perm_id2", "perm_id3"],
  "level": 55,
  "color": "#059669",
  "icon": "TruckIcon"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "role": {
      "id": "role_id",
      "name": "Warehouse Manager",
      "description": "Manages inventory and stock",
      "isSystem": false,
      "isCustom": true,
      "level": 55,
      "color": "#059669",
      "icon": "TruckIcon",
      "userCount": 0,
      "permissionCount": 3,
      "permissions": [...]
    }
  }
}
```

---

#### 5. GET /api/rbac/roles/[id]
Get role details with permissions and assigned users

**Example Request:**
```bash
GET /api/rbac/roles/role_id_123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "role": {
      "id": "role_id",
      "name": "Warehouse Manager",
      "permissions": [...],
      "users": [
        {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com",
          "avatar": "...",
          "status": "active"
        }
      ]
    }
  }
}
```

---

#### 6. PUT /api/rbac/roles/[id]
Update custom role

**Request Body:**
```json
{
  "name": "Senior Warehouse Manager",
  "description": "Updated description",
  "permissions": ["perm_id1", "perm_id2"],
  "level": 60,
  "color": "#059669"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "role": {
      "id": "role_id",
      "name": "Senior Warehouse Manager",
      ...
    }
  }
}
```

**Notes:**
- Can only update custom roles (not system roles)
- Can only update roles in your organization
- All fields are optional

---

#### 7. DELETE /api/rbac/roles/[id]
Delete custom role

**Example Request:**
```bash
DELETE /api/rbac/roles/role_id_123
```

**Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully",
  "data": {
    "deletedRole": {
      "id": "role_id",
      "name": "Warehouse Manager"
    }
  }
}
```

**Error (Role in use):**
```json
{
  "success": false,
  "message": "Cannot delete role. 5 user(s) are assigned to this role. Please reassign them first.",
  "error": {
    "usersCount": 5,
    "message": "Reassign users to another role before deleting."
  }
}
```

**Notes:**
- Can only delete custom roles (not system roles)
- Cannot delete if users are assigned to the role
- Soft delete (sets isDeleted flag)

---

#### 8. GET /api/rbac/roles/[id]/permissions
Get role permissions

**Example Request:**
```bash
GET /api/rbac/roles/role_id_123/permissions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roleId": "role_id",
    "roleName": "Warehouse Manager",
    "permissions": [
      {
        "_id": "perm_id",
        "key": "products.view",
        "name": "View Products",
        ...
      }
    ],
    "total": 5
  }
}
```

---

#### 9. PUT /api/rbac/roles/[id]/permissions
Replace all role permissions

**Request Body:**
```json
{
  "permissions": [
    "perm_id1",
    "perm_id2",
    "perm_id3"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role permissions updated successfully",
  "data": {
    "roleId": "role_id",
    "roleName": "Warehouse Manager",
    "permissions": [...],
    "total": 3,
    "message": "Permissions replaced successfully"
  }
}
```

**Notes:**
- Can only update custom roles
- Replaces ALL existing permissions
- Pass empty array to remove all permissions

---

## Middleware Usage

### Permission-Based Middleware

**File:** `src/middleware/auth.js`

#### 1. Single Permission Check

```javascript
import { withPermission } from '@/middleware/auth';

export async function GET(request) {
  return withPermission(request, 'invoices.view', async (request) => {
    // User has 'invoices.view' permission
    // Your route logic here
  });
}
```

#### 2. Multiple Permissions (ANY)

```javascript
export async function PUT(request) {
  return withPermission(
    request,
    ['invoices.edit', 'invoices.manage'],
    async (request) => {
      // User has EITHER 'invoices.edit' OR 'invoices.manage'
      // Your route logic here
    }
  );
}
```

#### 3. Multiple Permissions (ALL)

```javascript
import { withAllPermissions } from '@/middleware/auth';

export async function DELETE(request) {
  return withAllPermissions(
    request,
    ['invoices.delete', 'invoices.approve'],
    async (request) => {
      // User has BOTH permissions
      // Your route logic here
    }
  );
}
```

#### 4. Resource-Based Permission

```javascript
import { withResourcePermission } from '@/middleware/auth';

export async function POST(request) {
  return withResourcePermission(request, 'invoices', 'create', async (request) => {
    // Checks for 'invoices.create' permission
    // Your route logic here
  });
}
```

#### 5. Convenience Middleware

```javascript
import {
  withUserView,
  withCustomerCreate,
  withInvoiceEdit,
  withReportsExport,
} from '@/middleware/auth';

// View users
export async function GET(request) {
  return withUserView(request, async (request) => {
    // Has 'users.view' permission
  });
}

// Create customers
export async function POST(request) {
  return withCustomerCreate(request, async (request) => {
    // Has 'customers.create' permission
  });
}
```

### Available Convenience Middleware

```javascript
// User Management
withUserView()
withUserManage()

// Customer Management
withCustomerView()
withCustomerCreate()
withCustomerEdit()

// Invoice Management
withInvoiceView()
withInvoiceCreate()
withInvoiceEdit()
withInvoiceApprove()

// Reports
withReportsView()
withReportsExport()

// Settings
withSettingsView()
withSettingsEdit()
```

### Permission Check in Code

```javascript
// Inside route handler
export async function GET(request) {
  return withAuth(request, async (request) => {
    const user = request.user;

    // Check single permission
    if (await user.hasPermission('invoices.create')) {
      // User can create invoices
    }

    // Check multiple permissions (ANY)
    if (await user.hasAnyPermission(['invoices.view', 'invoices.edit'])) {
      // User has at least one permission
    }

    // Check multiple permissions (ALL)
    if (await user.hasAllPermissions(['invoices.delete', 'invoices.approve'])) {
      // User has both permissions
    }

    // Get all user permissions
    const permissions = await user.getPermissions();

    // Get user role info
    const roleInfo = await user.getRoleInfo();
  });
}
```

---

## Frontend Integration

### Example: Roles Management Page

```jsx
'use client';

import { useState, useEffect } from 'react';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    const res = await fetch('/api/rbac/roles?includePermissions=true');
    const data = await res.json();
    if (data.success) {
      setRoles(data.data.roles);
    }
  };

  const fetchPermissions = async () => {
    const res = await fetch('/api/rbac/permissions?grouped=true');
    const data = await res.json();
    if (data.success) {
      setPermissions(data.data.permissions);
    }
  };

  const createRole = async (roleData) => {
    const res = await fetch('/api/rbac/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData),
    });
    const data = await res.json();
    if (data.success) {
      await fetchRoles(); // Refresh list
    }
  };

  const updateRolePermissions = async (roleId, permissionIds) => {
    const res = await fetch(`/api/rbac/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: permissionIds }),
    });
    return res.json();
  };

  return (
    <div>
      {/* Roles list */}
      {roles.map((role) => (
        <div key={role.id}>
          <h3>{role.name}</h3>
          <p>{role.description}</p>
          <span>{role.permissionCount} permissions</span>
        </div>
      ))}
    </div>
  );
}
```

### Example: Permission Assignment UI

```jsx
'use client';

import { useState } from 'react';

export default function PermissionAssignment({ role, permissions, onUpdate }) {
  const [selectedPermissions, setSelectedPermissions] = useState(
    role.permissions.map((p) => p._id)
  );

  const togglePermission = (permId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  };

  const handleSave = async () => {
    await onUpdate(role.id, selectedPermissions);
  };

  return (
    <div>
      {Object.entries(permissions).map(([category, perms]) => (
        <div key={category}>
          <h3>{category}</h3>
          {perms.map((perm) => (
            <label key={perm._id}>
              <input
                type="checkbox"
                checked={selectedPermissions.includes(perm._id)}
                onChange={() => togglePermission(perm._id)}
              />
              {perm.name}
              <span className="text-sm text-gray-500">{perm.description}</span>
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleSave}>Save Permissions</button>
    </div>
  );
}
```

---

## Testing & Seeding

### Seeding Default Data

**Step 1: Seed Permissions and Roles**

```bash
# Using API endpoint (requires super admin authentication)
POST /api/rbac/permissions/seed
```

**Using Script:**
```javascript
// scripts/seed-rbac.js
import connectDB from '@/lib/mongodb';
import Permission from '@/models/Permission';
import Role from '@/models/Role';

async function seedRBAC() {
  await connectDB();

  console.log('Seeding permissions...');
  await Permission.seedPermissions();

  console.log('Seeding roles...');
  await Role.seedSystemRoles();

  console.log('✅ RBAC seeded successfully!');
}

seedRBAC();
```

### Testing Permission Checks

**Test 1: Check User Permission**
```javascript
const user = await User.findById(userId).populate({
  path: 'roleId',
  populate: { path: 'permissions' },
});

console.log('Has invoices.create?', await user.hasPermission('invoices.create'));
console.log('All permissions:', await user.getPermissions());
```

**Test 2: Test Middleware**
```bash
# Try accessing protected endpoint
curl -X GET http://localhost:3000/api/invoices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return 200 if user has 'invoices.view' permission
# Should return 403 if user doesn't have permission
```

**Test 3: Create Custom Role**
```bash
curl -X POST http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Role",
    "description": "Test description",
    "permissions": ["perm_id1", "perm_id2"]
  }'
```

---

## Best Practices

### 1. Permission Naming

✅ **Good:**
```javascript
'invoices.view'
'invoices.create'
'customers.edit'
'reports.export'
```

❌ **Bad:**
```javascript
'invoice_view'
'createCustomer'
'edit-product'
```

### 2. Permission Granularity

**Too Coarse:**
```javascript
'invoices.all'  // Too broad
```

**Too Fine:**
```javascript
'invoices.edit.customer'
'invoices.edit.items'
'invoices.edit.totals'
```

**Just Right:**
```javascript
'invoices.view'
'invoices.create'
'invoices.edit'
'invoices.delete'
'invoices.approve'
```

### 3. Role Design

**Good Role Structure:**
- Clear, descriptive name
- Well-defined purpose
- Appropriate permission set
- Correct hierarchy level

**Example:**
```javascript
{
  name: 'Sales Manager',
  description: 'Manages sales team and customer relationships',
  level: 65,
  permissions: [
    'customers.view',
    'customers.create',
    'customers.edit',
    'invoices.view',
    'invoices.create',
    'invoices.edit',
    'invoices.approve',
    'users.view'  // Can view team members
  ]
}
```

### 4. Security

✅ **Always:**
- Use permission middleware on all protected routes
- Check permissions on both frontend AND backend
- Log permission denials for auditing
- Validate permission IDs before assignment
- Use HTTPS in production

❌ **Never:**
- Rely solely on frontend permission checks
- Hard-code permission checks without middleware
- Allow users to modify system roles
- Skip organization isolation checks
- Expose sensitive permission details in errors

### 5. Performance

**Optimize Permission Checks:**
```javascript
// ✅ Good: Populate once
const user = await User.findById(userId).populate({
  path: 'roleId',
  populate: { path: 'permissions' }
});

// Check multiple permissions
await user.hasPermission('perm1');
await user.hasPermission('perm2');

// ❌ Bad: Re-populate for each check
await user.hasPermission('perm1'); // Populates
await user.hasPermission('perm2'); // Populates again
```

**Cache Permissions:**
```javascript
// Get permissions once
const permissions = await user.getPermissions();
const permissionKeys = permissions.map(p => p.key);

// Check against cached list
const canCreate = permissionKeys.includes('invoices.create');
const canEdit = permissionKeys.includes('invoices.edit');
```

### 6. Migration Strategy

**Gradual Migration from Legacy Roles:**

1. Keep both `role` and `roleId` fields
2. Use `roleId` for new permission checks
3. Fall back to `role` for backward compatibility
4. Migrate users gradually:

```javascript
// Migration script
const users = await User.find({ roleId: null });

for (const user of users) {
  // Find matching system role
  const role = await Role.findOne({ key: user.role });

  if (role) {
    user.roleId = role._id;
    await user.save();
  }
}
```

---

## Summary

The Advanced RBAC system provides:

✅ **80+ Permissions** covering all ERP modules
✅ **6 System Roles** with appropriate permissions
✅ **Custom Roles** for organization-specific needs
✅ **Fine-grained Control** at the permission level
✅ **Easy-to-use Middleware** for route protection
✅ **Organization Isolation** for multi-tenancy
✅ **Backward Compatible** with existing role system
✅ **Production-Ready** with security best practices

---

**Last Updated:** $(date)
**Version:** 1.0.0
**Author:** DigInvoice ERP Team
