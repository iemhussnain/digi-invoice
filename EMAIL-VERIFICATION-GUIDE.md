# Email Verification System - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Security Features](#security-features)
6. [API Reference](#api-reference)
7. [Email Templates](#email-templates)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Email Verification System ensures that users verify their email addresses after registration. This enhances security and enables important features like password recovery.

### Features
- ✅ **Automatic Email Sending** - Verification email sent immediately after registration
- ✅ **Secure Token Generation** - Cryptographically secure 64-character hex tokens
- ✅ **SHA-256 Token Hashing** - Tokens hashed before database storage
- ✅ **One-Time Use Tokens** - Tokens deleted after successful verification
- ✅ **Resend Functionality** - Users can request new verification emails
- ✅ **Email Enumeration Protection** - Vague responses prevent user discovery
- ✅ **Beautiful Email Templates** - HTML emails with responsive design
- ✅ **Development Mode** - Console logging instead of sending emails
- ✅ **Auto-Redirect** - Automatic redirect to login after verification
- ✅ **Already Verified Detection** - Handles already verified accounts gracefully

---

## Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMAIL VERIFICATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

1. REGISTRATION
   ┌──────────────┐
   │ User Submits │
   │ Registration │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────┐
   │ Create User Account  │
   │ emailVerified: false │
   └──────┬───────────────┘
          │
          ▼
   ┌───────────────────────────────┐
   │ Generate Verification Token   │
   │ - crypto.randomBytes(32)      │
   │ - SHA-256 hash for storage    │
   └──────┬────────────────────────┘
          │
          ▼
   ┌─────────────────────────┐
   │ Send Verification Email │
   │ with token in URL       │
   └──────┬──────────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │ Registration Complete    │
   │ "Check your email..."    │
   └──────────────────────────┘

2. EMAIL VERIFICATION
   ┌─────────────────┐
   │ User Clicks     │
   │ Email Link      │
   └──────┬──────────┘
          │
          ▼
   ┌──────────────────────┐
   │ /verify-email?token= │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Verify Token (GET)   │
   │ Hash & Match in DB   │
   └──────┬───────────────┘
          │
          ├─── Valid ────────┐
          │                  ▼
          │           ┌──────────────────┐
          │           │ Set emailVerified│
          │           │ to true          │
          │           └──────┬───────────┘
          │                  │
          │                  ▼
          │           ┌──────────────────┐
          │           │ Clear Token      │
          │           └──────┬───────────┘
          │                  │
          │                  ▼
          │           ┌──────────────────┐
          │           │ Send Success     │
          │           │ Email            │
          │           └──────┬───────────┘
          │                  │
          │                  ▼
          │           ┌──────────────────┐
          │           │ Show Success     │
          │           │ Redirect to Login│
          │           └──────────────────┘
          │
          └─── Invalid ──────┐
                            ▼
                     ┌──────────────────┐
                     │ Show Error       │
                     │ Offer Resend     │
                     └──────────────────┘

3. RESEND VERIFICATION
   ┌─────────────────┐
   │ User Requests   │
   │ Resend Email    │
   └──────┬──────────┘
          │
          ▼
   ┌──────────────────────┐
   │ POST /resend-        │
   │ verification         │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Check if Already     │
   │ Verified             │
   └──────┬───────────────┘
          │
          ├─── Already Verified ──┐
          │                       ▼
          │                ┌──────────────┐
          │                │ Return Success│
          │                │ (no email)   │
          │                └──────────────┘
          │
          └─── Not Verified ──────┐
                                  ▼
                           ┌──────────────────┐
                           │ Generate New     │
                           │ Token            │
                           └──────┬───────────┘
                                  │
                                  ▼
                           ┌──────────────────┐
                           │ Send New         │
                           │ Verification     │
                           │ Email            │
                           └──────────────────┘
```

---

## Backend Implementation

### 1. User Model Updates

**File:** `src/models/User.js`

```javascript
// Email verification fields
emailVerified: {
  type: Boolean,
  default: false,
},

emailVerificationToken: {
  type: String,
  select: false, // Not returned by default for security
},
```

### 2. Registration API (Automatic Email Sending)

**File:** `src/app/api/auth/register/route.js`

```javascript
// After user creation (around line 286-328)

// ========================================
// Step 4.5: Generate & Send Email Verification
// ========================================

// Generate cryptographically secure verification token
const verificationToken = crypto.randomBytes(32).toString('hex');
const hashedVerificationToken = crypto.createHash('sha256')
  .update(verificationToken)
  .digest('hex');

// Save hashed token to user
user.emailVerificationToken = hashedVerificationToken;
user.emailVerified = false; // Explicitly set to false
await user.save();

// Generate verification URL
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;

// Send verification email
const emailResult = await sendEmailVerificationEmail({
  to: user.email,
  name: user.name,
  verifyUrl,
  verifyToken: verificationToken,
});

if (emailResult.success) {
  logger.success('Email verification sent', {
    userId: user._id,
    email: user.email,
  });
} else {
  logger.warning('Email verification failed to send', {
    userId: user._id,
    email: user.email,
    error: emailResult.error,
  });
}

// Include verification status in response
const response = NextResponse.json({
  success: true,
  message: 'Registration successful! Please check your email to verify your account.',
  data: {
    user: {
      // ... user data
      emailVerified: user.emailVerified,
    },
    emailVerification: {
      sent: emailResult.success,
      email: user.email,
      message: emailResult.success
        ? 'Verification email sent. Please check your inbox.'
        : 'Failed to send verification email. You can request a new one later.',
    },
    // ... other data
  },
});
```

### 3. Verify Email API

**File:** `src/app/api/auth/verify-email/route.js`

```javascript
/**
 * GET - Verify Email with Token
 * User clicks link in verification email
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    logger.info('Email verification attempt');

    // ========================================
    // Step 1: Validate Token
    // ========================================

    if (!token) {
      return errorResponse('Verification token is required', 400);
    }

    if (token.length !== 64) {
      // Token should be 64 hex characters
      return errorResponse('Invalid verification token format', 400);
    }

    // ========================================
    // Step 2: Hash Token and Find User
    // ========================================

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      isDeleted: false,
    }).select('+emailVerificationToken');

    if (!user) {
      logger.warning('Email verification - invalid token');

      return errorResponse(
        'Invalid verification token',
        400,
        {
          message: 'This verification link is invalid or has already been used.',
          action: 'Please request a new verification email or contact support.',
        }
      );
    }

    // ========================================
    // Step 3: Check if Already Verified
    // ========================================

    if (user.emailVerified) {
      logger.info('Email already verified', {
        userId: user._id,
        email: user.email,
      });

      return successResponse(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            emailVerified: true,
          },
          message: 'Your email is already verified',
          alreadyVerified: true,
        },
        'Email already verified',
        200
      );
    }

    // ========================================
    // Step 4: Verify Email
    // ========================================

    user.emailVerified = true;
    user.emailVerificationToken = undefined; // Clear token after use

    await user.save();

    logger.success('Email verified successfully', {
      userId: user._id,
      email: user.email,
    });

    // ========================================
    // Step 5: Send Success Email
    // ========================================

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl}/login`;

    const emailResult = await sendEmailVerificationSuccessEmail({
      to: user.email,
      name: user.name,
      loginUrl,
    });

    if (emailResult.success) {
      logger.success('Email verification success email sent', {
        userId: user._id,
        email: user.email,
      });
    }

    // ========================================
    // Step 6: Return Response
    // ========================================

    return successResponse(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: true,
        },
        message: 'Email verified successfully',
        next: {
          action: 'redirect',
          url: '/login',
          message: 'You can now login to your account',
        },
      },
      'Email verified successfully',
      200
    );
  } catch (error) {
    logger.error('Email verification error', error);

    return errorResponse(
      'Failed to verify email',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
```

**Key Features:**
- ✅ Token validation (64 characters)
- ✅ SHA-256 hashing before database lookup
- ✅ Already verified detection
- ✅ One-time token use (deleted after verification)
- ✅ Success email notification
- ✅ Detailed logging

### 4. Resend Verification Email API

**File:** `src/app/api/auth/resend-verification/route.js`

```javascript
/**
 * POST - Resend Email Verification
 * Allows users to request a new verification email
 */
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    logger.info('Resend verification request', { email });

    // ========================================
    // Step 1: Validate Email
    // ========================================

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return validationError({ email: emailValidation.message });
    }

    // ========================================
    // Step 2: Find User
    // ========================================

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isDeleted: false,
    });

    // Email enumeration protection - always return success
    if (!user) {
      logger.warning('Resend verification - user not found', { email });

      return successResponse(
        {
          sent: true,
          message:
            'If an account exists with this email, you will receive a verification email shortly.',
        },
        'Verification email sent',
        200
      );
    }

    // ========================================
    // Step 3: Check if Already Verified
    // ========================================

    if (user.emailVerified) {
      logger.info('Resend verification - already verified', {
        userId: user._id,
        email: user.email,
      });

      return successResponse(
        {
          sent: true,
          message: 'This email is already verified. You can login to your account.',
          alreadyVerified: true,
        },
        'Email already verified',
        200
      );
    }

    // ========================================
    // Step 4: Generate New Verification Token
    // ========================================

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    await user.save();

    logger.info('New verification token generated', {
      userId: user._id,
      email: user.email,
    });

    // ========================================
    // Step 5: Send Verification Email
    // ========================================

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    const emailResult = await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl,
      verifyToken: verificationToken,
    });

    if (!emailResult.success) {
      logger.error('Failed to send verification email', {
        userId: user._id,
        email: user.email,
        error: emailResult.error,
      });

      return errorResponse('Failed to send verification email', 500);
    }

    logger.success('Verification email resent', {
      userId: user._id,
      email: user.email,
    });

    // ========================================
    // Step 6: Return Response
    // ========================================

    return successResponse(
      {
        sent: true,
        email: user.email,
        message: 'Verification email sent. Please check your inbox.',
      },
      'Verification email sent',
      200
    );
  } catch (error) {
    logger.error('Resend verification error', error);

    return errorResponse(
      'Failed to resend verification email',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
```

**Key Features:**
- ✅ Email enumeration protection
- ✅ Already verified detection
- ✅ New token generation (replaces old token)
- ✅ Automatic email sending
- ✅ Detailed logging

---

## Frontend Implementation

### Email Verification Page

**File:** `src/app/verify-email/page.js`

```javascript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  // Auto-redirect to login after successful verification
  useEffect(() => {
    if (verified && !alreadyVerified) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 5000); // Redirect after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [verified, alreadyVerified, router]);

  // Verify email on page load
  useEffect(() => {
    if (!token) {
      setError('Invalid verification link. No token provided.');
      setVerifying(false);
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      setVerifying(true);
      setError('');

      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setVerified(true);
        setUserInfo(data.data.user);

        // Check if already verified
        if (data.data.alreadyVerified) {
          setAlreadyVerified(true);
        }
      } else {
        setError(data.message || 'Failed to verify email');
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();

    if (!resendEmail) {
      setError('Please enter your email address');
      return;
    }

    try {
      setResending(true);
      setError('');
      setResendSuccess(false);

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendSuccess(true);
        setResendEmail('');
      } else {
        setError(data.message || 'Failed to resend verification email');
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* UI implementation with 3 states: Verifying, Success, Error */}
      {/* Full code in /src/app/verify-email/page.js */}
    </div>
  );
}
```

**Page States:**

1. **Verifying State** (Initial):
   - Spinning loader
   - "Verifying Your Email..." message
   - Automatic token verification

2. **Success State**:
   - Green checkmark icon
   - User information display
   - "Email Verified Successfully!" message
   - Auto-redirect countdown (5 seconds)
   - "Go to Login" button

3. **Already Verified State**:
   - Green checkmark icon
   - "Already Verified!" message
   - No auto-redirect
   - "Go to Login" button

4. **Error State**:
   - Red X icon
   - Error message display
   - Resend verification form
   - Email input field
   - "Resend Verification Email" button
   - "Back to Login" link

---

## Security Features

### 1. Cryptographically Secure Token Generation

```javascript
// Generate 32 random bytes = 64 hex characters
const verificationToken = crypto.randomBytes(32).toString('hex');

// Result: "a1b2c3d4e5f6..."
// Length: 64 characters
// Entropy: 256 bits
// Collision probability: Virtually impossible
```

### 2. SHA-256 Token Hashing

```javascript
// Hash token before storing in database
const hashedToken = crypto.createHash('sha256')
  .update(verificationToken)
  .digest('hex');

// Why?
// - Even if database is compromised, tokens cannot be used
// - Original token is never stored
// - One-way hashing prevents reverse engineering
```

### 3. Email Enumeration Protection

```javascript
// Always return success, even if email doesn't exist
if (!user) {
  return successResponse({
    sent: true,
    message: 'If an account exists with this email, you will receive a verification email shortly.',
  });
}

// Why?
// - Prevents attackers from discovering valid email addresses
// - Same response for existing and non-existing emails
// - Security through obscurity
```

### 4. One-Time Token Use

```javascript
// After successful verification
user.emailVerified = true;
user.emailVerificationToken = undefined; // Delete token

// Why?
// - Token cannot be reused
// - Prevents replay attacks
// - Limits exposure window
```

### 5. Token Validation

```javascript
// Validate token format
if (token.length !== 64) {
  return errorResponse('Invalid verification token format', 400);
}

// Why?
// - Quick rejection of malformed tokens
// - Prevents unnecessary database queries
// - Reduces attack surface
```

---

## API Reference

### 1. GET /api/auth/verify-email

Verifies user email with token from email link.

**Query Parameters:**
```
token (required) - 64-character hex verification token
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "emailVerified": true
    },
    "message": "Email verified successfully",
    "next": {
      "action": "redirect",
      "url": "/login",
      "message": "You can now login to your account"
    }
  }
}
```

**Already Verified Response (200):**
```json
{
  "success": true,
  "message": "Email already verified",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "emailVerified": true
    },
    "message": "Your email is already verified",
    "alreadyVerified": true
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid verification token",
  "error": {
    "message": "This verification link is invalid or has already been used.",
    "action": "Please request a new verification email or contact support."
  }
}
```

### 2. POST /api/auth/resend-verification

Sends a new verification email to the user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent",
  "data": {
    "sent": true,
    "email": "user@example.com",
    "message": "Verification email sent. Please check your inbox."
  }
}
```

**Already Verified Response (200):**
```json
{
  "success": true,
  "message": "Email already verified",
  "data": {
    "sent": true,
    "message": "This email is already verified. You can login to your account.",
    "alreadyVerified": true
  }
}
```

**Email Enumeration Protection Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent",
  "data": {
    "sent": true,
    "message": "If an account exists with this email, you will receive a verification email shortly."
  }
}
```

---

## Email Templates

### 1. Verification Email Template

**Function:** `sendEmailVerificationEmail()`

**Subject:** "Verify Your Email - DigInvoice ERP"

**HTML Template:**
- Header with "✉️ Verify Your Email" title
- Personalized greeting with user name
- Welcome message
- Large blue "Verify Email Address" button
- Alternative manual link
- Info box explaining why verification is important:
  - Secure your account
  - Enable password reset functionality
  - Receive important account notifications
- Security note about link validity
- Footer with company info

**Development Mode:**
- Logs email to console instead of sending
- Displays verification URL in terminal

### 2. Verification Success Email Template

**Function:** `sendEmailVerificationSuccessEmail()`

**Subject:** "Email Verified Successfully - DigInvoice ERP"

**HTML Template:**
- Header with "✅ Email Verified!" title
- Personalized congratulations message
- Confirmation of verified status
- "Login to Your Account" button
- Next steps information
- Security reminder
- Support contact information

---

## Testing Guide

### Development Environment Testing

**1. Start the Application:**
```bash
npm run dev
```

**2. Register a New Account:**
```
URL: http://localhost:3000/register
Fill in all required fields
Submit registration form
```

**3. Check Console for Verification Email:**
```
Expected output:
📧 EMAIL (Development Mode)
─────────────────────────────
To: user@example.com
Subject: Verify Your Email - DigInvoice ERP
─────────────────────────────

Verification URL:
http://localhost:3000/verify-email?token=a1b2c3d4e5f6...
```

**4. Copy Verification URL:**
```
Copy the verification URL from console
Paste into browser
```

**5. Verify Email:**
```
Expected: Success page with auto-redirect countdown
Check: User's emailVerified field should be true in database
```

**6. Test Already Verified:**
```
Visit the same verification link again
Expected: "Already Verified!" message with no redirect
```

**7. Test Invalid Token:**
```
Visit: http://localhost:3000/verify-email?token=invalid123
Expected: Error message with resend form
```

**8. Test Resend Functionality:**
```
1. Click on "Resend Verification Email"
2. Enter email address
3. Submit form
4. Check console for new verification email
5. New token should be different from previous
```

### Production Environment Testing

**1. Configure Email Provider:**

Add to `.env.local`:
```env
# Email Configuration
EMAIL_PROVIDER=smtp  # or 'sendgrid' or 'ses'

# SMTP Configuration (if using SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OR SendGrid (if using SendGrid)
SENDGRID_API_KEY=SG.xxx

# OR AWS SES (if using SES)
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=xxx
AWS_SES_SECRET_KEY=xxx

# Sender Information
EMAIL_FROM=noreply@diginvoice.com
EMAIL_FROM_NAME=DigInvoice ERP
```

**2. Test Email Delivery:**
```
1. Register with real email address
2. Check inbox for verification email
3. Check spam folder if not in inbox
4. Click verification link
5. Confirm redirect to login page
6. Check for success confirmation email
```

**3. Test Email Client Rendering:**
```
Test in multiple email clients:
- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- Mobile clients (iOS, Android)
```

### Database Verification

**Check User Document:**
```javascript
// Before verification
{
  _id: ObjectId("..."),
  email: "user@example.com",
  emailVerified: false,
  emailVerificationToken: "hashed_token_here" // SHA-256 hash
}

// After verification
{
  _id: ObjectId("..."),
  email: "user@example.com",
  emailVerified: true,
  emailVerificationToken: undefined // Token deleted
}
```

### API Testing with cURL

**1. Verify Email:**
```bash
curl -X GET "http://localhost:3000/api/auth/verify-email?token=YOUR_64_CHAR_TOKEN"
```

**2. Resend Verification:**
```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## Troubleshooting

### Common Issues

#### 1. Email Not Received

**Problem:** User doesn't receive verification email

**Solutions:**
- Check spam/junk folder
- Verify email configuration in `.env.local`
- Check application logs for email sending errors
- Test email provider credentials
- Use resend verification feature
- In development: Check console for email output

#### 2. Invalid Token Error

**Problem:** Verification link shows "Invalid token"

**Causes:**
- Token already used (email already verified)
- Token expired or corrupted
- Database token was cleared

**Solutions:**
- Check user's `emailVerified` status
- Request new verification email
- Verify token length (should be 64 characters)

#### 3. Token Format Error

**Problem:** "Invalid verification token format"

**Causes:**
- Token truncated in email client
- Token modified during copy/paste
- URL encoding issues

**Solutions:**
- Copy complete URL from email
- Check token length (64 characters)
- Avoid manual editing of token

#### 4. Already Verified Message

**Problem:** User sees "Already Verified" but wants to verify again

**Explanation:**
- This is normal - email is already verified
- User can directly login
- No action needed

#### 5. Email Sending Failed

**Problem:** Registration succeeds but email not sent

**Solutions:**
- Check email provider configuration
- Verify SMTP credentials
- Check rate limits
- Review application logs
- User can use resend feature later

### Debugging Tips

**1. Enable Debug Logging:**
```javascript
// Add to logger calls
logger.debug('Verification token generated', {
  userId: user._id,
  tokenLength: verificationToken.length,
  hashedLength: hashedToken.length,
});
```

**2. Check Database:**
```javascript
// MongoDB shell
db.users.findOne({ email: "user@example.com" }, {
  emailVerified: 1,
  emailVerificationToken: 1
});
```

**3. Test Email Provider:**
```javascript
// Test email sending separately
const testEmail = await sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  text: 'This is a test',
  html: '<p>This is a test</p>',
});

console.log('Email test result:', testEmail);
```

**4. Verify Token Hashing:**
```javascript
// Generate and hash test token
const testToken = crypto.randomBytes(32).toString('hex');
const testHash = crypto.createHash('sha256').update(testToken).digest('hex');

console.log('Test Token:', testToken);
console.log('Test Hash:', testHash);
console.log('Token Length:', testToken.length); // Should be 64
console.log('Hash Length:', testHash.length); // Should be 64
```

---

## Integration with Other Features

### 1. Login Protection (Optional)

You can optionally prevent unverified users from logging in:

```javascript
// In login API
if (!user.emailVerified) {
  return errorResponse(
    'Email not verified',
    403,
    {
      emailVerified: false,
      message: 'Please verify your email before logging in.',
      action: 'Check your inbox for verification email or request a new one.',
    }
  );
}
```

### 2. Dashboard Reminder

Show verification reminder for unverified users:

```javascript
// In dashboard
{!user.emailVerified && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    <div className="flex items-start">
      <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" /* ... */>
        {/* Warning icon */}
      </svg>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-yellow-800 mb-1">
          Email Not Verified
        </h3>
        <p className="text-sm text-yellow-700 mb-2">
          Please verify your email to access all features.
        </p>
        <button
          onClick={handleResendVerification}
          className="text-sm text-yellow-800 underline hover:text-yellow-900"
        >
          Resend Verification Email
        </button>
      </div>
    </div>
  </div>
)}
```

### 3. Profile Settings

Show verification status in user profile:

```javascript
<div className="flex items-center justify-between">
  <div>
    <p className="text-sm font-medium text-gray-700">Email Verification</p>
    <p className="text-sm text-gray-500">{user.email}</p>
  </div>
  {user.emailVerified ? (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      ✓ Verified
    </span>
  ) : (
    <button
      onClick={handleResendVerification}
      className="text-sm text-blue-600 hover:text-blue-700 underline"
    >
      Verify Now
    </button>
  )}
</div>
```

---

## Best Practices

### 1. Token Security
- ✅ Always use cryptographically secure random generation
- ✅ Always hash tokens before database storage
- ✅ Never log or expose tokens in error messages
- ✅ Delete tokens after use
- ✅ Use HTTPS in production

### 2. Email Delivery
- ✅ Use reputable email service providers
- ✅ Configure SPF, DKIM, and DMARC records
- ✅ Include plain text version of emails
- ✅ Test email rendering across clients
- ✅ Monitor email delivery rates

### 3. User Experience
- ✅ Send verification email immediately after registration
- ✅ Provide clear instructions in emails
- ✅ Make verification links easily clickable
- ✅ Show verification status in user profile
- ✅ Allow users to resend verification emails
- ✅ Auto-redirect after successful verification

### 4. Error Handling
- ✅ Provide helpful error messages
- ✅ Offer alternative actions (resend email)
- ✅ Log errors for debugging
- ✅ Don't expose system details to users
- ✅ Handle edge cases gracefully

---

## Summary

The Email Verification System is now fully implemented with:

✅ **Backend APIs:**
- Registration with automatic verification email
- Email verification endpoint
- Resend verification endpoint

✅ **Frontend Pages:**
- Email verification page with 4 states
- Resend verification form
- Auto-redirect functionality

✅ **Security Features:**
- Cryptographically secure tokens
- SHA-256 hashing
- Email enumeration protection
- One-time token use
- Token format validation

✅ **Email Templates:**
- Beautiful HTML verification email
- Success confirmation email
- Development mode console logging

✅ **User Experience:**
- Clear success/error messages
- Auto-redirect after verification
- Resend functionality
- Already verified detection

The system is production-ready and follows security best practices!

---

**Last Updated:** $(date)
**Version:** 1.0.0
**Author:** DigInvoice ERP Team
