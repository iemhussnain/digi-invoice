# Profile Management API Guide

Complete documentation for user profile management features.

## 🔐 Authorization

All profile management APIs require **authentication** (any logged-in user can manage their own profile).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Or use HTTP-only cookies** (automatically sent by browser)

---

## 📋 API Endpoints

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|---------------|
| `/api/profile` | GET | Get own profile | authenticated user |
| `/api/profile` | PUT | Update own profile | authenticated user |
| `/api/profile/password` | GET | Get password security info | authenticated user |
| `/api/profile/password` | PATCH | Change password | authenticated user |
| `/api/profile/avatar` | GET | Get avatar info | authenticated user |
| `/api/profile/avatar` | POST | Upload/update avatar | authenticated user |
| `/api/profile/avatar` | DELETE | Delete avatar | authenticated user |

---

## 1️⃣ Get Own Profile

### **GET** `/api/profile`

Get complete profile information of the logged-in user.

### Example Request:

```bash
GET /api/profile
Authorization: Bearer <token>
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": "6543210abc...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "0300-1234567",
      "role": "accountant",
      "department": "Finance",
      "status": "active",
      "avatar": "https://example.com/avatar.jpg",
      "emailVerified": true,
      "lastLogin": "2025-11-11T10:30:00.000Z",
      "lastLoginIP": "192.168.1.100",
      "preferences": {
        "language": "en",
        "theme": "dark",
        "timezone": "Asia/Karachi"
      },
      "createdAt": "2025-11-01T08:00:00.000Z",
      "updatedAt": "2025-11-10T15:20:00.000Z",
      "organization": {
        "id": "org123...",
        "name": "ABC Company",
        "slug": "abc-company",
        "subscription": {
          "plan": "standard",
          "status": "active",
          "endDate": "2026-01-01T00:00:00.000Z",
          "features": ["accounting", "sales", "purchase"]
        }
      }
    }
  }
}
```

---

## 2️⃣ Update Own Profile

### **PUT** `/api/profile`

User can update their own profile information.

### Request Body:

```json
{
  "name": "John Updated",
  "phone": "0300-9999999",
  "department": "Accounts Department",
  "preferences": {
    "language": "ur",
    "theme": "dark",
    "timezone": "Asia/Karachi"
  }
}
```

### Updatable Fields:

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | string | User's full name | 2-100 characters, letters only |
| `phone` | string | Phone number | Pakistan format: 03XX-XXXXXXX |
| `department` | string | Department name | Any string |
| `preferences.language` | string | UI language | 'en' or 'ur' |
| `preferences.theme` | string | UI theme | 'light', 'dark', or 'auto' |
| `preferences.timezone` | string | Timezone | Any valid timezone string |

**Fields that CANNOT be updated via this API:**
- ❌ Email (future: separate verification flow)
- ❌ Password (use password change API)
- ❌ Role (admin only)
- ❌ Status (admin only)

### Response (200 OK):

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "6543210abc...",
      "name": "John Updated",
      "email": "john@example.com",
      "phone": "0300-9999999",
      "role": "accountant",
      "department": "Accounts Department",
      "status": "active",
      "avatar": "https://example.com/avatar.jpg",
      "preferences": {
        "language": "ur",
        "theme": "dark",
        "timezone": "Asia/Karachi"
      },
      "updatedAt": "2025-11-11T14:00:00.000Z"
    }
  }
}
```

---

## 3️⃣ Get Password Security Info

### **GET** `/api/profile/password`

Get password policy and security information.

### Example Request:

```bash
GET /api/profile/password
Authorization: Bearer <token>
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "Password security information",
  "data": {
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumber": true,
      "requireSpecialChar": true,
      "criteria": "Must meet 3 out of 4 criteria"
    },
    "passwordInfo": {
      "lastChanged": "2025-11-01T08:00:00.000Z",
      "daysSinceChange": 10
    },
    "securityTips": [
      "Use a strong, unique password",
      "Change your password regularly",
      "Never share your password",
      "Enable two-factor authentication (coming soon)",
      "Review active sessions regularly"
    ]
  }
}
```

---

## 4️⃣ Change Password

### **PATCH** `/api/profile/password`

User changes their own password (requires current password verification).

### Request Body:

```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewSecure@456",
  "confirmPassword": "NewSecure@456",
  "logoutAllDevices": false
}
```

### Request Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentPassword` | string | ✅ Yes | Current password for verification |
| `newPassword` | string | ✅ Yes | New password (must meet policy) |
| `confirmPassword` | string | ✅ Yes | Confirm new password (must match) |
| `logoutAllDevices` | boolean | ❌ No | Logout from all devices? (default: false) |

### Password Policy:

- ✅ Minimum 8 characters
- ✅ Must meet 3 out of 4 criteria:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*)
- ✅ New password must be different from current password

### Response (200 OK) - Keep Current Session:

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "message": "Password changed successfully",
    "sessionInfo": {
      "loggedOut": false,
      "currentDevice": "Active",
      "otherDevicesLoggedOut": 2,
      "reason": "Other devices have been logged out for security."
    }
  }
}
```

### Response (200 OK) - Logout All Devices:

```json
{
  "success": true,
  "message": "Password changed successfully. Please login again.",
  "data": {
    "message": "Password changed successfully",
    "sessionInfo": {
      "loggedOut": true,
      "allDevices": true,
      "reason": "You have been logged out from all devices. Please login again with your new password."
    }
  }
}
```

### Session Management:

**Option 1: `logoutAllDevices: false` (Default)**
- ✅ Current device stays logged in
- ✅ All other devices are logged out
- ✅ User can continue working without interruption
- ✅ Recommended for convenience

**Option 2: `logoutAllDevices: true`**
- ✅ All devices logged out (including current)
- ✅ User must login again with new password
- ✅ Maximum security
- ✅ Recommended if account was compromised

### Possible Errors:

**401 - Incorrect Current Password:**
```json
{
  "success": false,
  "message": "Incorrect password",
  "error": {
    "currentPassword": "Current password is incorrect"
  }
}
```

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "newPassword": "Password must be at least 8 characters and meet 3 out of 4 criteria",
    "confirmPassword": "Passwords do not match"
  }
}
```

**400 - Same Password:**
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "newPassword": "New password must be different from current password"
  }
}
```

---

## 5️⃣ Get Avatar Info

### **GET** `/api/profile/avatar`

Get information about avatar storage, limits, and current avatar.

### Example Request:

```bash
GET /api/profile/avatar
Authorization: Bearer <token>
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "Avatar information retrieved",
  "data": {
    "currentAvatar": "https://example.com/avatar.jpg",
    "hasAvatar": true,
    "avatarStorage": {
      "type": "inline",
      "description": "Avatars stored as URLs or base64 in database",
      "supportedTypes": ["url", "base64"],
      "supportedFormats": ["JPEG", "PNG", "GIF", "WebP"],
      "maxSize": "5MB"
    },
    "uploadMethods": [
      {
        "method": "url",
        "description": "Provide a public image URL",
        "example": "https://example.com/avatar.jpg"
      },
      {
        "method": "base64",
        "description": "Upload image as base64 data URI",
        "example": "data:image/png;base64,iVBORw0KGgoAAAANS..."
      }
    ],
    "recommendation": {
      "production": "Use cloud storage (S3, Cloudinary, etc.) for better performance",
      "development": "URL or base64 is fine for testing"
    }
  }
}
```

---

## 6️⃣ Upload/Update Avatar

### **POST** `/api/profile/avatar`

User uploads or updates their profile picture.

Supports two methods:
1. **URL Method** - Provide a public image URL
2. **Base64 Method** - Upload image as base64 data URI

### Method 1: Upload via URL

**Request Body:**
```json
{
  "avatar": "https://example.com/my-avatar.jpg",
  "avatarType": "url"
}
```

### Method 2: Upload via Base64

**Request Body:**
```json
{
  "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
  "avatarType": "base64"
}
```

**Note:** `avatarType` is optional. System auto-detects based on format.

### Supported Formats:

- ✅ JPEG / JPG
- ✅ PNG
- ✅ GIF
- ✅ WebP

### Size Limits:

- **URL Method:** No size limit (depends on external server)
- **Base64 Method:** Maximum 5MB

### Response (200 OK):

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "user": {
      "id": "6543210abc...",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/my-avatar.jpg",
      "updatedAt": "2025-11-11T15:00:00.000Z"
    },
    "avatarInfo": {
      "type": "url",
      "uploaded": true,
      "previous": "replaced"
    }
  }
}
```

### Validation Errors:

**Invalid URL:**
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "avatar": "Invalid URL format"
  }
}
```

**Unsupported Format:**
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "avatar": "Unsupported image format. Supported: jpeg, jpg, png, gif, webp"
  }
}
```

**File Too Large:**
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "avatar": "Avatar size too large. Maximum 5MB"
  }
}
```

---

## 7️⃣ Delete Avatar

### **DELETE** `/api/profile/avatar`

User deletes their profile picture (reverts to default).

### Example Request:

```bash
DELETE /api/profile/avatar
Authorization: Bearer <token>
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "Avatar deleted successfully",
  "data": {
    "user": {
      "id": "6543210abc...",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "updatedAt": "2025-11-11T15:30:00.000Z"
    },
    "avatarInfo": {
      "deleted": true,
      "previous": "https://example.com/old-avatar.jpg"
    }
  }
}
```

### Error - No Avatar:

```json
{
  "success": false,
  "message": "No avatar to delete",
  "error": {
    "message": "User does not have an avatar"
  }
}
```

---

## 📊 Use Cases

### 1. Profile Settings Page

```javascript
// Get user profile
async function loadProfile() {
  const response = await fetch('/api/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const { data } = await response.json();
  console.log(data.user); // Display in UI
}

// Update profile
async function updateProfile(updates) {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const { data } = await response.json();
  console.log('Profile updated:', data.user);
}
```

### 2. Change Password Form

```javascript
async function changePassword(currentPassword, newPassword) {
  const response = await fetch('/api/profile/password', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword: newPassword,
      logoutAllDevices: false // Keep current session
    })
  });

  if (response.ok) {
    const { data } = await response.json();
    alert(data.message);

    if (data.sessionInfo.otherDevicesLoggedOut > 0) {
      console.log(`Logged out from ${data.sessionInfo.otherDevicesLoggedOut} other devices`);
    }
  }
}
```

### 3. Avatar Upload (URL Method)

```javascript
async function uploadAvatarFromURL(imageUrl) {
  const response = await fetch('/api/profile/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      avatar: imageUrl,
      avatarType: 'url'
    })
  });

  const { data } = await response.json();
  console.log('Avatar uploaded:', data.user.avatar);
}
```

### 4. Avatar Upload (File Upload with Base64)

```javascript
async function uploadAvatarFromFile(fileInput) {
  const file = fileInput.files[0];

  // Validate file type
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    alert('Unsupported file type');
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large. Maximum 5MB');
    return;
  }

  // Convert to base64
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result; // data:image/png;base64,...

    const response = await fetch('/api/profile/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        avatar: base64,
        avatarType: 'base64'
      })
    });

    const { data } = await response.json();
    console.log('Avatar uploaded:', data.user.avatar);
  };

  reader.readAsDataURL(file);
}
```

### 5. Delete Avatar

```javascript
async function deleteAvatar() {
  const response = await fetch('/api/profile/avatar', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const { data } = await response.json();
  console.log('Avatar deleted');
}
```

### 6. Update Preferences (Language/Theme)

```javascript
async function updatePreferences(language, theme) {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      preferences: {
        language,  // 'en' or 'ur'
        theme      // 'light', 'dark', or 'auto'
      }
    })
  });

  const { data } = await response.json();
  console.log('Preferences updated:', data.user.preferences);

  // Apply theme
  document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';

  // Reload UI with new language if needed
  if (language === 'ur') {
    // Load Urdu translations
  }
}
```

---

## 🔒 Security Features

### Password Change Security:

1. **Current Password Verification**
   - Must provide correct current password
   - Prevents unauthorized password changes

2. **Session Management Options**
   - Option to keep current session active
   - Option to logout all devices for maximum security

3. **Password Policy Enforcement**
   - Strong password requirements
   - Cannot reuse current password

4. **Automatic Logout**
   - Other devices automatically logged out
   - Forces re-authentication with new credentials

### Avatar Security:

1. **Size Limits**
   - Base64: Maximum 5MB
   - Prevents database bloat

2. **Format Validation**
   - Only image formats accepted
   - Prevents malicious file uploads

3. **URL Validation**
   - Valid URL format required
   - Auto-detection of URL vs base64

---

## 💡 Production Recommendations

### Avatar Storage:

**Current Implementation (Development):**
- ✅ Stores avatars as URL or base64 in database
- ✅ Simple and works for testing
- ❌ Not recommended for production (large database size)

**Recommended for Production:**

1. **Cloud Storage (S3, Cloudinary, etc.)**
   ```javascript
   // Upload to Cloudinary
   const cloudinaryUrl = await uploadToCloudinary(file);

   // Save URL to database
   await fetch('/api/profile/avatar', {
     body: JSON.stringify({ avatar: cloudinaryUrl })
   });
   ```

2. **CDN Integration**
   - Serve images from CDN for better performance
   - Automatic image optimization and resizing

3. **File Upload Flow**
   ```
   User uploads file
   → Upload to S3/Cloudinary
   → Get public URL
   → Save URL to database
   → Display from CDN
   ```

### Password Security:

1. **Two-Factor Authentication (Future)**
   - Add 2FA for enhanced security
   - Already prepared in User model (`twoFactorSecret`)

2. **Password History**
   - Prevent reusing last N passwords
   - Requires password history table

3. **Password Expiry**
   - Force password change after X days
   - Display warning when password is old

---

## ⚠️ Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Validation error or invalid input |
| 401 | Unauthorized | Missing/invalid token or incorrect password |
| 404 | Not Found | User not found |
| 500 | Server Error | Internal server error |

---

## ✅ Complete Feature List

### Profile Management:
- ✅ Get own profile with full details
- ✅ Update profile (name, phone, department)
- ✅ Update preferences (language, theme, timezone)
- ✅ View organization information
- ✅ Audit trail (updatedBy)

### Password Management:
- ✅ Change password with current password verification
- ✅ Password policy enforcement (8+ chars, 3/4 criteria)
- ✅ Option to logout all devices
- ✅ Option to keep current session
- ✅ Password strength validation
- ✅ Cannot reuse current password
- ✅ Password last changed tracking

### Avatar Management:
- ✅ Upload avatar via URL
- ✅ Upload avatar via base64
- ✅ Auto-detect upload method
- ✅ Format validation (JPEG, PNG, GIF, WebP)
- ✅ Size limit enforcement (5MB for base64)
- ✅ Delete avatar
- ✅ View avatar info and limits

### Security:
- ✅ Authentication required for all endpoints
- ✅ Users can only manage their own profile
- ✅ Password verification for password change
- ✅ Session management options
- ✅ Audit trail for all changes

---

## 🚀 Next Steps

Future enhancements:
- Email change (with verification)
- Password recovery (forgot password)
- Two-factor authentication (2FA)
- Account activity log
- Profile picture crop/resize
- Cloud storage integration (S3, Cloudinary)
- Multiple avatar sizes (thumbnail, medium, large)
- Social media profile links

**All Profile Management APIs are production-ready!** ✨
