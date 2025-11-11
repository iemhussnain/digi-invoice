# User Management API Guide

Complete documentation for admin user management features.

## 🔐 Authorization

All user management APIs require **admin** or **super_admin** role.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Or use HTTP-only cookies** (automatically sent by browser)

---

## 📋 API Endpoints

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|---------------|
| `/api/users` | GET | Get all users (paginated) | admin, super_admin |
| `/api/users` | POST | Create new user | admin, super_admin |
| `/api/users/[id]` | GET | Get single user details | admin, super_admin |
| `/api/users/[id]` | PUT | Update user details | admin, super_admin |
| `/api/users/[id]` | DELETE | Delete user (soft delete) | admin, super_admin |
| `/api/users/[id]/role` | PATCH | Change user role | admin, super_admin |
| `/api/users/[id]/role` | GET | Get role history | admin, super_admin |

---

## 1️⃣ Get All Users (Paginated)

### **GET** `/api/users`

Get list of all users in your organization with pagination, search, and filters.

### Query Parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Users per page |
| `search` | string | "" | Search by name or email |
| `role` | string | "" | Filter by role |
| `status` | string | "" | Filter by status |

### Example Request:

```bash
GET /api/users?page=1&limit=10&search=john&role=accountant&status=active
Authorization: Bearer <token>
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "6543210abc...",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "0300-1234567",
        "role": "accountant",
        "department": "Finance",
        "status": "active",
        "avatar": null,
        "lastLogin": "2025-11-11T10:30:00.000Z",
        "lastLoginIP": "192.168.1.100",
        "emailVerified": true,
        "createdAt": "2025-11-01T08:00:00.000Z",
        "updatedAt": "2025-11-10T15:20:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasMore": true
    },
    "filters": {
      "search": "john",
      "role": "accountant",
      "status": "active"
    }
  }
}
```

---

## 2️⃣ Create New User

### **POST** `/api/users`

Admin can add new team members to the organization.

### Request Body:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass@123",
  "phone": "0300-9876543",
  "role": "sales",
  "department": "Sales Department"
}
```

### Field Validations:

| Field | Required | Validation |
|-------|----------|------------|
| `name` | ✅ Yes | 2-100 characters, letters only |
| `email` | ✅ Yes | Valid email format, unique |
| `password` | ✅ Yes | Min 8 chars, 3/4 criteria (upper, lower, number, special) |
| `phone` | ❌ No | Pakistan format: 03XX-XXXXXXX |
| `role` | ✅ Yes | user, accountant, sales, manager, admin* |
| `department` | ❌ No | Any string |

**Notes:**
- `admin` role can only be assigned by `super_admin`
- `super_admin` role cannot be assigned
- User limit depends on organization subscription plan

### Response (201 Created):

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "6543210abc...",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "0300-9876543",
      "role": "sales",
      "department": "Sales Department",
      "status": "active",
      "createdAt": "2025-11-11T12:00:00.000Z"
    }
  }
}
```

### Possible Errors:

**403 - User Limit Reached:**
```json
{
  "success": false,
  "message": "User limit reached",
  "error": {
    "message": "Your basic plan allows maximum 10 users",
    "currentUsers": 10,
    "maxUsers": 10,
    "plan": "basic"
  }
}
```

**409 - Email Already Exists:**
```json
{
  "success": false,
  "message": "Email already exists",
  "error": {
    "email": "This email is already registered"
  }
}
```

---

## 3️⃣ Get Single User Details

### **GET** `/api/users/[id]`

Get detailed information about a specific user, including active sessions.

### Example Request:

```bash
GET /api/users/6543210abc...
Authorization: Bearer <token>
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "user": {
      "id": "6543210abc...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "0300-1234567",
      "role": "accountant",
      "department": "Finance",
      "status": "active",
      "avatar": null,
      "emailVerified": true,
      "lastLogin": "2025-11-11T10:30:00.000Z",
      "lastLoginIP": "192.168.1.100",
      "loginAttempts": 0,
      "lockUntil": null,
      "preferences": {
        "language": "en",
        "theme": "light",
        "timezone": "Asia/Karachi"
      },
      "createdAt": "2025-11-01T08:00:00.000Z",
      "updatedAt": "2025-11-10T15:20:00.000Z",
      "organization": {
        "id": "org123...",
        "name": "ABC Company",
        "slug": "abc-company"
      }
    },
    "activeSessions": [
      {
        "device": "Chrome on Windows",
        "ipAddress": "192.168.1.100",
        "loginAt": "2025-11-11T10:00:00.000Z",
        "lastActivity": "2025-11-11T10:45:00.000Z"
      }
    ]
  }
}
```

---

## 4️⃣ Update User Details

### **PUT** `/api/users/[id]`

Admin can update user profile information.

### Request Body:

```json
{
  "name": "John Updated",
  "phone": "0300-9999999",
  "department": "Finance Department",
  "status": "inactive"
}
```

### Updatable Fields:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | User's full name |
| `phone` | string | Phone number (Pakistan format) |
| `department` | string | Department name |
| `status` | string | active, inactive, suspended |

**Notes:**
- Cannot update email or password (separate APIs for those)
- Cannot update role (use role change API)
- Setting status to `suspended` or `inactive` will logout user from all devices

### Response (200 OK):

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "6543210abc...",
      "name": "John Updated",
      "email": "john@example.com",
      "phone": "0300-9999999",
      "role": "accountant",
      "department": "Finance Department",
      "status": "inactive",
      "avatar": null,
      "updatedAt": "2025-11-11T13:00:00.000Z"
    }
  }
}
```

### Restrictions:

**Cannot edit super_admin:**
```json
{
  "success": false,
  "message": "Cannot edit super admin",
  "error": {
    "message": "Only super admin can edit super admin users"
  }
}
```

---

## 5️⃣ Delete User (Soft Delete)

### **DELETE** `/api/users/[id]`

Admin can remove users from the organization. This is a **soft delete** - user data is preserved but marked as deleted.

### Example Request:

```bash
DELETE /api/users/6543210abc...
Authorization: Bearer <token>
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "userId": "6543210abc...",
    "email": "john@example.com",
    "deletedAt": "2025-11-11T14:00:00.000Z"
  }
}
```

### What Happens:

1. ✅ User is soft-deleted (`isDeleted: true`)
2. ✅ Status changed to `inactive`
3. ✅ All active sessions terminated
4. ✅ User can no longer login
5. ✅ User data preserved for audit purposes

### Restrictions:

**Cannot delete yourself:**
```json
{
  "success": false,
  "message": "Cannot delete yourself",
  "error": {
    "message": "You cannot delete your own account"
  }
}
```

**Cannot delete super_admin:**
```json
{
  "success": false,
  "message": "Cannot delete super admin",
  "error": {
    "message": "Super admin users cannot be deleted"
  }
}
```

**Only super_admin can delete admin:**
```json
{
  "success": false,
  "message": "Cannot delete admin",
  "error": {
    "message": "Only super admin can delete admin users"
  }
}
```

---

## 6️⃣ Change User Role

### **PATCH** `/api/users/[id]/role`

Admin can promote or demote users within the organization.

### Request Body:

```json
{
  "role": "manager",
  "reason": "Promoted due to excellent performance"
}
```

### Available Roles:

| Role | Description | Can Be Assigned By |
|------|-------------|---------------------|
| `user` | Basic user | admin, super_admin |
| `accountant` | Accounting access | admin, super_admin |
| `sales` | Sales module access | admin, super_admin |
| `manager` | Team management | admin, super_admin |
| `admin` | Organization admin | super_admin only |
| `super_admin` | Platform admin | Cannot be assigned |

### Response (200 OK):

```json
{
  "success": true,
  "message": "User role changed successfully",
  "data": {
    "user": {
      "id": "6543210abc...",
      "name": "John Doe",
      "email": "john@example.com",
      "oldRole": "accountant",
      "newRole": "manager",
      "updatedAt": "2025-11-11T15:00:00.000Z"
    },
    "message": "Role changed successfully. User must re-login to access new permissions.",
    "sessionsDeactivated": true
  }
}
```

### Important Notes:

1. **Force Re-login:** All user sessions are deactivated after role change for security
2. **User must login again** to get new permissions in JWT token
3. **Cannot change own role:** Admin cannot change their own role
4. **Cannot change super_admin:** Super admin role cannot be changed
5. **Admin role restriction:** Only super_admin can assign/change admin roles

### Restrictions:

**Cannot change own role:**
```json
{
  "success": false,
  "message": "Cannot change own role",
  "error": {
    "message": "You cannot change your own role"
  }
}
```

**Cannot assign admin role (if not super_admin):**
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "role": "Only super admin can assign admin role"
  }
}
```

**Role unchanged:**
```json
{
  "success": false,
  "message": "Role unchanged",
  "error": {
    "message": "User already has role: manager"
  }
}
```

---

## 7️⃣ Get Role History

### **GET** `/api/users/[id]/role`

Get current role information for a user.

### Example Request:

```bash
GET /api/users/6543210abc.../role
Authorization: Bearer <token>
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "User role information retrieved",
  "data": {
    "userId": "6543210abc...",
    "name": "John Doe",
    "email": "john@example.com",
    "currentRole": "manager",
    "lastUpdated": "2025-11-11T15:00:00.000Z",
    "message": "Role history tracking coming soon"
  }
}
```

**Note:** Full role change history tracking is a future enhancement. Currently returns current role only.

---

## 🔒 Security Features

### Role Hierarchy

```
super_admin (highest)
    ↓
  admin
    ↓
 manager
    ↓
accountant / sales
    ↓
  user (lowest)
```

### Permission Rules:

1. **super_admin:**
   - Can do everything
   - Can manage all roles including admin
   - Cannot be deleted or demoted

2. **admin:**
   - Can manage users except super_admin
   - Can assign roles except admin
   - Cannot edit/delete other admins (unless super_admin)

3. **manager, accountant, sales, user:**
   - Cannot access user management APIs
   - Require admin or super_admin role

### Organization Isolation:

✅ Admins can only manage users in their **own organization**
✅ Users from different organizations are completely isolated
✅ All queries filtered by `organizationId`

### Session Management:

✅ User sessions terminated when:
- Status changed to `inactive` or `suspended`
- User deleted
- Role changed (security measure)

---

## 📊 Use Cases

### 1. Admin Dashboard - User List

```javascript
// Get first page of users
const response = await fetch('/api/users?page=1&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data } = await response.json();
console.log(data.users); // Array of users
console.log(data.pagination); // Pagination info
```

### 2. Search Users

```javascript
// Search by name or email
const response = await fetch('/api/users?search=john&status=active', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. Add Team Member

```javascript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'SecurePass@123',
    role: 'sales'
  })
});
```

### 4. Promote User to Manager

```javascript
const userId = '6543210abc...';

const response = await fetch(`/api/users/${userId}/role`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    role: 'manager',
    reason: 'Promoted due to excellent performance'
  })
});
```

### 5. Suspend User Account

```javascript
const userId = '6543210abc...';

const response = await fetch(`/api/users/${userId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'suspended'
  })
});

// User will be logged out from all devices
```

### 6. Delete User

```javascript
const userId = '6543210abc...';

const response = await fetch(`/api/users/${userId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});

// Soft delete - data preserved
```

---

## ⚠️ Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid user ID or validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | User not found |
| 409 | Conflict | Email already exists |
| 500 | Server Error | Internal server error |

---

## ✅ Complete Feature List

- ✅ Get all users with pagination
- ✅ Search users by name/email
- ✅ Filter users by role and status
- ✅ Create new user (admin adds team member)
- ✅ View user details with active sessions
- ✅ Update user profile (name, phone, department, status)
- ✅ Delete user (soft delete)
- ✅ Change user role (promote/demote)
- ✅ Force user re-login after role change
- ✅ Organization isolation (multi-tenancy)
- ✅ Role-based access control
- ✅ User limit enforcement (subscription-based)
- ✅ Audit trail (createdBy, updatedBy, deletedBy)
- ✅ Super admin protection

---

## 🚀 Next Steps

Future enhancements:
- Role change history tracking (audit log table)
- Bulk user import (CSV upload)
- User export (Excel/CSV)
- Email invitation system
- User permissions (fine-grained access control)
- Activity logs per user
- User statistics and analytics

**All User Management APIs are production-ready!** ✨
