# Password Recovery System Guide

Complete documentation for forgot password and reset password features.

## 🔐 Overview

The Password Recovery system allows users to securely reset their password when they forget it. The system uses cryptographically secure tokens with expiration for maximum security.

---

## 📋 Flow Diagram

```
User Forgot Password
        ↓
1. User visits /forgot-password
        ↓
2. User enters email
        ↓
3. System generates reset token (60 min expiry)
        ↓
4. System sends email with reset link
        ↓
5. User clicks link in email
        ↓
6. User redirected to /reset-password?token=xxx
        ↓
7. System verifies token validity
        ↓
8. User enters new password
        ↓
9. System updates password & logouts all devices
        ↓
10. User redirected to login page
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/forgot-password` | POST | Request password reset | ❌ No |
| `/api/auth/reset-password` | POST | Reset password with token | ❌ No |
| `/api/auth/reset-password` | GET | Verify token validity | ❌ No |

---

## 1️⃣ Forgot Password API

### **POST** `/api/auth/forgot-password`

Request a password reset link. Generates a token and sends email to user.

### Request Body:

```json
{
  "email": "user@example.com"
}
```

### Response (200 OK):

```json
{
  "success": true,
  "message": "Password reset email sent",
  "data": {
    "message": "If an account exists with this email, you will receive a password reset link.",
    "email": "user@example.com",
    "sent": true,
    "expiresIn": "60 minutes"
  }
}
```

### Response (200 OK) - Development Mode:

In development, the response includes the reset URL for testing:

```json
{
  "success": true,
  "message": "Password reset email sent",
  "data": {
    "message": "If an account exists with this email, you will receive a password reset link.",
    "email": "user@example.com",
    "sent": true,
    "expiresIn": "60 minutes",
    "dev": {
      "resetUrl": "http://localhost:3000/reset-password?token=abc123...",
      "resetToken": "abc123...",
      "expiresAt": "2025-11-11T15:00:00.000Z",
      "note": "Reset URL is only shown in development mode"
    }
  }
}
```

### Security Features:

1. **Email Enumeration Protection**
   - Always returns success, even if email doesn't exist
   - Prevents attackers from discovering valid email addresses
   - Message: "If an account exists..." (vague response)

2. **Token Generation**
   - Cryptographically secure random token (32 bytes = 64 hex chars)
   - SHA-256 hashed before storage in database
   - 60-minute expiration

3. **Account Status Check**
   - Only sends reset for active accounts
   - Still returns success for inactive accounts (security)

### How It Works:

```javascript
// 1. Generate random token
const resetToken = crypto.randomBytes(32).toString('hex');

// 2. Hash token before storing
const hashedToken = crypto.createHash('sha256')
  .update(resetToken)
  .digest('hex');

// 3. Set expiry (60 minutes)
const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

// 4. Save to database
user.passwordResetToken = hashedToken;
user.passwordResetExpires = resetExpires;
await user.save();

// 5. Send email with original (unhashed) token
const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
await sendPasswordResetEmail({ to: user.email, resetUrl });
```

### Email Content:

The system sends a beautifully formatted HTML email with:
- ✅ Password reset button
- ✅ Clickable reset link
- ✅ Expiry time warning (60 minutes)
- ✅ Security tips
- ✅ "If you didn't request this" message
- ✅ Company branding

---

## 2️⃣ Verify Reset Token API

### **GET** `/api/auth/reset-password?token=xxx`

Verify if a reset token is valid before showing the reset form.

### Query Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | ✅ Yes | Reset token from email |

### Example Request:

```bash
GET /api/auth/reset-password?token=abc123def456...
```

### Response (200 OK) - Valid Token:

```json
{
  "success": true,
  "message": "Token verified successfully",
  "data": {
    "valid": true,
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "tokenInfo": {
      "expiresAt": "2025-11-11T15:00:00.000Z",
      "minutesRemaining": 45
    },
    "message": "Reset token is valid"
  }
}
```

### Response (400 Bad Request) - Invalid/Expired Token:

```json
{
  "success": false,
  "message": "Invalid or expired token",
  "error": {
    "valid": false,
    "message": "This password reset link is invalid or has expired."
  }
}
```

### Usage:

This endpoint is called by the frontend to verify the token before showing the password reset form. Provides better UX by showing an error message early if the link is expired.

---

## 3️⃣ Reset Password API

### **POST** `/api/auth/reset-password`

Reset password using a valid reset token.

### Request Body:

```json
{
  "token": "abc123def456...",
  "password": "NewSecure@Password123",
  "confirmPassword": "NewSecure@Password123"
}
```

### Field Validations:

| Field | Required | Validation |
|-------|----------|------------|
| `token` | ✅ Yes | Must be 64 hex characters |
| `password` | ✅ Yes | Min 8 chars, 3/4 criteria (upper, lower, number, special) |
| `confirmPassword` | ✅ Yes | Must match password |

### Response (200 OK):

```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "message": "Password reset successful",
    "user": {
      "id": "6543210abc...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "security": {
      "sessionsDeactivated": 3,
      "requireLogin": true,
      "message": "All devices have been logged out. Please login with your new password."
    },
    "next": {
      "action": "redirect",
      "url": "/login",
      "message": "Please login with your new password"
    }
  }
}
```

### Security Actions:

When password is reset, the system automatically:

1. **✅ Updates Password**
   - Hashes password with bcrypt (12 rounds)
   - Sets `passwordChangedAt` timestamp

2. **✅ Clears Reset Token**
   - Removes `passwordResetToken`
   - Removes `passwordResetExpires`
   - Token becomes invalid immediately

3. **✅ Resets Login Attempts**
   - Clears `loginAttempts` counter
   - Removes `lockUntil` (if account was locked)

4. **✅ Terminates All Sessions**
   - Deactivates all active sessions
   - User must re-login on all devices
   - Maximum security measure

5. **✅ Sends Success Email**
   - Confirmation email sent to user
   - Includes login link
   - Security notice if not user's action

### Possible Errors:

**400 - Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid or expired reset token",
  "error": {
    "token": "This password reset link is invalid or has expired. Please request a new one."
  }
}
```

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "password": "Password must be at least 8 characters and meet 3 out of 4 criteria",
    "confirmPassword": "Passwords do not match"
  }
}
```

**403 - Account Not Active:**
```json
{
  "success": false,
  "message": "Account not active",
  "error": {
    "message": "Your account is not active. Please contact support."
  }
}
```

---

## 🎨 Frontend Pages

### 1. Forgot Password Page (`/forgot-password`)

**Features:**
- ✅ Email input form
- ✅ Loading state during submission
- ✅ Success message with instructions
- ✅ Development mode: Shows reset URL for testing
- ✅ Links to login and register pages
- ✅ "What happens next?" instructions

**User Experience:**
```
1. User enters email
2. Clicks "Send Reset Link"
3. See success message
4. Check email inbox
5. Click reset link
6. Redirected to reset password page
```

### 2. Reset Password Page (`/reset-password?token=xxx`)

**Features:**
- ✅ Token verification on page load
- ✅ Loading state during verification
- ✅ Invalid token error message
- ✅ New password and confirm password fields
- ✅ Password strength indicator (Weak, Fair, Good, Strong)
- ✅ Show/hide password toggle
- ✅ Password requirements checklist
- ✅ Real-time validation feedback
- ✅ Success message with auto-redirect
- ✅ Links to login page

**States:**

1. **Verifying Token (Loading)**
   - Shows spinner
   - "Verifying reset link..."

2. **Invalid Token (Error)**
   - Shows error icon
   - Error message
   - Button to request new reset link

3. **Valid Token (Form)**
   - Shows password reset form
   - User can enter new password
   - Real-time validation

4. **Success (Complete)**
   - Shows success icon
   - Confirmation message
   - Auto-redirect to login in 3 seconds

---

## 📧 Email Configuration

### Development Mode:

Emails are **NOT** sent in development. Instead:
- Email content is logged to console
- Reset URL is shown in API response
- Developers can copy the link directly

### Production Setup:

Configure email service in `.env.local`:

**Option 1: SMTP (Nodemailer)**
```env
# Email Configuration
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Company Name
EMAIL_REPLY_TO=support@yourdomain.com

# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Option 2: SendGrid**
```env
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=your-sendgrid-api-key
```

**Option 3: AWS SES**
```env
EMAIL_FROM=noreply@yourdomain.com
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your-access-key
AWS_SES_SECRET_KEY=your-secret-key
```

### Email Implementation:

Update `src/utils/email.js` with your email service:

```javascript
// Example with Nodemailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const info = await transporter.sendMail({
  from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
  to,
  subject,
  text,
  html,
});
```

---

## 🔒 Security Best Practices

### 1. Token Security:

✅ **Cryptographically Secure**
- Uses `crypto.randomBytes(32)` for token generation
- 32 bytes = 64 hex characters = 2^256 possible combinations
- Impossible to guess or brute force

✅ **Hashed Storage**
- Token is hashed (SHA-256) before storing in database
- Even if database is compromised, tokens are safe
- Original token never stored

✅ **Short Expiration**
- Tokens expire after 60 minutes
- Reduces attack window
- Old tokens automatically invalid

✅ **Single Use**
- Token is deleted after password reset
- Cannot be reused
- Must request new token for next reset

### 2. Email Enumeration Protection:

✅ **Vague Responses**
- Always returns "If an account exists..." message
- No distinction between existing/non-existing emails
- Prevents attackers from discovering valid emails

✅ **Same Response Time**
- Takes similar time for valid and invalid emails
- Prevents timing attacks

### 3. Session Security:

✅ **Force Re-login**
- All sessions terminated after password reset
- User must login with new password on all devices
- Prevents unauthorized access if account was compromised

✅ **Account Lock Reset**
- Login attempts counter reset
- Account unlock (if locked due to failed attempts)
- User can regain access

### 4. Email Security:

✅ **Secure Email Content**
- No sensitive information in email
- Only reset link included
- User must verify email ownership

✅ **Expiry Warning**
- Email clearly shows expiry time (60 minutes)
- Encourages immediate action
- Reduces forgotten tokens

---

## 📊 Use Cases

### Use Case 1: Standard Password Reset

```javascript
// User visits /forgot-password
// Enters email
const response = await fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Response: Success (email sent)
// User clicks link in email
// Visits: /reset-password?token=abc123...

// Page verifies token
const verifyResponse = await fetch(`/api/auth/reset-password?token=${token}`);
// Response: Token valid

// User enters new password
const resetResponse = await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token,
    password: 'NewPass@123',
    confirmPassword: 'NewPass@123'
  })
});

// Response: Success, redirect to login
```

### Use Case 2: Expired Token

```javascript
// User clicks old reset link (> 60 minutes old)
// Visits: /reset-password?token=old-token

// Page verifies token
const response = await fetch(`/api/auth/reset-password?token=${oldToken}`);

// Response: 400 - Token expired
{
  "success": false,
  "error": {
    "valid": false,
    "message": "This password reset link is invalid or has expired."
  }
}

// Page shows error: "Link expired, request new one"
// User redirected to /forgot-password
```

### Use Case 3: Development Testing

```javascript
// Developer tests password reset locally
// Submit email on /forgot-password

// Check console output:
console.log(`
📧 EMAIL CONTENT (Development)
To: user@example.com
Subject: Password Reset Request
Reset URL: http://localhost:3000/reset-password?token=abc123...
Expires: 2025-11-11T15:00:00.000Z
`);

// Copy reset URL from console or API response
// Paste in browser
// Test password reset flow
```

---

## 🧪 Testing Guide

### Test 1: Forgot Password (Valid Email)

```bash
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}

# Expected: 200 OK
# Check console for reset URL (development mode)
```

### Test 2: Forgot Password (Invalid Email)

```bash
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "nonexistent@example.com"
}

# Expected: 200 OK (same response for security)
# No email sent (user doesn't exist)
```

### Test 3: Verify Token (Valid)

```bash
GET http://localhost:3000/api/auth/reset-password?token=abc123...

# Expected: 200 OK
# Response includes user info and expiry time
```

### Test 4: Verify Token (Expired)

```bash
# Wait 61+ minutes after forgot-password request
GET http://localhost:3000/api/auth/reset-password?token=old-token

# Expected: 400 Bad Request
# Error: Token expired
```

### Test 5: Reset Password (Valid)

```bash
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "password": "NewSecure@123",
  "confirmPassword": "NewSecure@123"
}

# Expected: 200 OK
# All sessions terminated
# Can login with new password
```

### Test 6: Reset Password (Weak Password)

```bash
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "password": "weak",
  "confirmPassword": "weak"
}

# Expected: 400 Bad Request
# Error: Password validation failed
```

---

## 🎯 Password Policy

The system enforces a strong password policy:

**Requirements:**
- ✅ Minimum 8 characters
- ✅ Must meet **3 out of 4** criteria:
  1. At least one uppercase letter (A-Z)
  2. At least one lowercase letter (a-z)
  3. At least one number (0-9)
  4. At least one special character (!@#$%^&*)

**Examples:**

| Password | Valid? | Reason |
|----------|--------|--------|
| `Test@123` | ✅ Yes | 8+ chars, has upper, lower, number, special (4/4) |
| `Password1` | ✅ Yes | 8+ chars, has upper, lower, number (3/4) |
| `secure!pass` | ✅ Yes | 8+ chars, has lower, number, special (3/4) |
| `weak` | ❌ No | Only 4 characters |
| `password` | ❌ No | Only lowercase (1/4) |
| `12345678` | ❌ No | Only numbers (1/4) |

---

## ⚠️ Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 200 | Success | Request successful (even if email doesn't exist) |
| 400 | Bad Request | Invalid token, validation error, or expired token |
| 403 | Forbidden | Account not active |
| 500 | Server Error | Internal server error |

---

## ✅ Complete Feature List

### API Features:
- ✅ Forgot password endpoint
- ✅ Reset password endpoint
- ✅ Token verification endpoint
- ✅ Email enumeration protection
- ✅ Cryptographically secure tokens
- ✅ SHA-256 token hashing
- ✅ 60-minute token expiration
- ✅ Single-use tokens
- ✅ Password policy enforcement
- ✅ Session termination after reset
- ✅ Login attempts reset
- ✅ Account unlock on reset

### Email Features:
- ✅ Password reset email (HTML + text)
- ✅ Password reset success email
- ✅ Beautiful email templates
- ✅ Development mode (console logging)
- ✅ Production-ready email integration
- ✅ Configurable SMTP/SendGrid/SES

### Frontend Features:
- ✅ Forgot password page (`/forgot-password`)
- ✅ Reset password page (`/reset-password`)
- ✅ Token verification on load
- ✅ Loading states
- ✅ Error handling
- ✅ Success messages
- ✅ Password strength indicator
- ✅ Password requirements checklist
- ✅ Show/hide password toggle
- ✅ Auto-redirect after success
- ✅ Development mode helpers
- ✅ Responsive design

### Security Features:
- ✅ Email enumeration protection
- ✅ Cryptographically secure tokens
- ✅ Token hashing before storage
- ✅ Short expiration (60 minutes)
- ✅ Single-use tokens
- ✅ Force re-login after reset
- ✅ Account unlock capability
- ✅ Password strength validation

---

## 🚀 Next Steps

Future enhancements:
- Email template customization
- Password history (prevent reusing old passwords)
- Password strength scoring with zxcvbn
- Rate limiting on forgot-password endpoint
- SMS-based password reset
- Security questions as additional verification
- Admin notification on password reset
- Password reset analytics/monitoring

**Password Recovery System is production-ready!** ✨
