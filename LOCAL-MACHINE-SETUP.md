# 📋 Local Machine Setup Guide

## ✅ Files to Copy to Your Local Machine

Follow this guide to copy all necessary files from this environment to your local machine.

---

## 1️⃣ MOST IMPORTANT: Environment File

**Create this file first!**

**File Location:** `.env.local` (in project root folder)

```env
# MongoDB Connection (MongoDB Atlas Cloud)
MONGODB_URI=mongodb+srv://iemhussnain_db_user:EXvAmwSr3qMlWg9Y@digiinvoice.3flm3pi.mongodb.net/diginvoice-erp?appName=DigiInvoice

# JWT Secret (Change this to a random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# JWT Expiry
JWT_EXPIRY=7d

# App Configuration
NEXT_PUBLIC_APP_NAME=DigInvoice ERP
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

**Important:**
- Is file ko project ke root folder mein save karein (jahan `package.json` hai)
- File name exactly `.env.local` hona chahiye (dot se start hota hai)

---

## 2️⃣ Updated package.json

**File Location:** `package.json` (project root)

```json
{
  "name": "digi-invoice-revise",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.19.3",
    "next": "16.0.1",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "16.0.1",
    "tailwindcss": "^4"
  }
}
```

**After copying:** Run `npm install` to install new packages (mongoose, bcryptjs, jsonwebtoken)

---

## 3️⃣ New Folders to Create

Ye folders apne project mein banayein (agar nahi hain to):

```
src/
├── lib/           👈 Create this folder
├── models/        👈 Create this folder
├── middleware/    👈 Create this folder
└── utils/         👈 Create this folder
```

---

## 4️⃣ MongoDB Connection Utility

**File Location:** `src/lib/mongodb.js`

```javascript
/**
 * MongoDB Connection Utility
 * Handles database connection with connection pooling and caching
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Return cached connection if exists
  if (cached.conn) {
    console.log('🟢 Using cached MongoDB connection');
    return cached.conn;
  }

  // Create new connection if no cached connection exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    console.log('🟡 Creating new MongoDB connection...');

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      cached.promise = null; // Reset promise on error
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
```

---

## 5️⃣ Response Utilities

**File Location:** `src/utils/response.js`

```javascript
/**
 * API Response Utilities
 * Standardized response formats for all API routes
 */

import { NextResponse } from 'next/server';

/**
 * Success Response
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code (default: 200)
 */
export function successResponse(data = null, message = 'Success', status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Error Response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default: 400)
 * @param {object} errors - Detailed error object
 */
export function errorResponse(message = 'An error occurred', status = 400, errors = null) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Validation Error Response
 * @param {object} errors - Validation errors
 */
export function validationError(errors) {
  return errorResponse('Validation failed', 422, errors);
}

/**
 * Unauthorized Error Response
 */
export function unauthorizedError(message = 'Unauthorized access') {
  return errorResponse(message, 401);
}

/**
 * Forbidden Error Response
 */
export function forbiddenError(message = 'Access forbidden') {
  return errorResponse(message, 403);
}

/**
 * Not Found Error Response
 */
export function notFoundError(message = 'Resource not found') {
  return errorResponse(message, 404);
}

/**
 * Server Error Response
 */
export function serverError(message = 'Internal server error', error = null) {
  // Log error details for debugging
  if (error) {
    console.error('Server Error:', error);
  }

  return errorResponse(
    message,
    500,
    process.env.NODE_ENV === 'development' && error ? { error: error.message } : null
  );
}
```

---

## 6️⃣ Logger Utility

**File Location:** `src/utils/logger.js`

```javascript
/**
 * Logger Utility
 * Simple logging utility for development and production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log levels with colors for terminal
 */
const colors = {
  info: '\x1b[36m',    // Cyan
  success: '\x1b[32m', // Green
  warning: '\x1b[33m', // Yellow
  error: '\x1b[31m',   // Red
  debug: '\x1b[35m',   // Magenta
  reset: '\x1b[0m',    // Reset
};

/**
 * Format log message with timestamp
 */
function formatMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase();

  let logMessage = `[${timestamp}] [${levelUpper}] ${message}`;

  if (data) {
    logMessage += `\n${JSON.stringify(data, null, 2)}`;
  }

  return logMessage;
}

/**
 * Logger object with different log levels
 */
const logger = {
  /**
   * Info log
   */
  info: (message, data = null) => {
    if (isDevelopment) {
      console.log(
        `${colors.info}${formatMessage('info', message, data)}${colors.reset}`
      );
    } else {
      console.log(formatMessage('info', message, data));
    }
  },

  /**
   * Success log
   */
  success: (message, data = null) => {
    if (isDevelopment) {
      console.log(
        `${colors.success}${formatMessage('success', message, data)}${colors.reset}`
      );
    } else {
      console.log(formatMessage('success', message, data));
    }
  },

  /**
   * Warning log
   */
  warning: (message, data = null) => {
    if (isDevelopment) {
      console.warn(
        `${colors.warning}${formatMessage('warning', message, data)}${colors.reset}`
      );
    } else {
      console.warn(formatMessage('warning', message, data));
    }
  },

  /**
   * Error log
   */
  error: (message, error = null) => {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      ...error,
    } : null;

    if (isDevelopment) {
      console.error(
        `${colors.error}${formatMessage('error', message, errorData)}${colors.reset}`
      );
    } else {
      console.error(formatMessage('error', message, errorData));
    }
  },

  /**
   * Debug log (only in development)
   */
  debug: (message, data = null) => {
    if (isDevelopment) {
      console.log(
        `${colors.debug}${formatMessage('debug', message, data)}${colors.reset}`
      );
    }
  },
};

export default logger;
```

---

## 7️⃣ Health Check API

**File Location:** `src/app/api/health/route.js`

```javascript
/**
 * Health Check API
 * Tests database connection and system health
 */

import connectDB from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';

export async function GET() {
  try {
    // Test MongoDB connection
    const conn = await connectDB();

    const dbStatus = conn.connection.readyState === 1 ? 'connected' : 'disconnected';

    logger.success('Health check successful', { dbStatus });

    return successResponse({
      status: 'healthy',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }, 'System is healthy');

  } catch (error) {
    logger.error('Health check failed', error);

    return errorResponse(
      'System health check failed',
      500,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    );
  }
}
```

---

## 8️⃣ Updated Homepage (Optional - Already Updated)

**File Location:** `src/app/page.js`

This file should already be updated on your local machine. If not, here's the updated version:

[See the current page.js content from the system reminder above]

---

## 🚀 SETUP STEPS (Order Important!)

### Step 1: Create Folders
```
src/lib/
src/utils/
src/models/
src/middleware/
src/app/api/health/
```

### Step 2: Copy Files in This Order

1. ✅ `.env.local` (root folder)
2. ✅ `package.json` (root folder)
3. ✅ `src/lib/mongodb.js`
4. ✅ `src/utils/response.js`
5. ✅ `src/utils/logger.js`
6. ✅ `src/app/api/health/route.js`

### Step 3: Install Dependencies

Open terminal in project folder:
```bash
npm install
```

This will install:
- mongoose (MongoDB ODM)
- bcryptjs (Password hashing)
- jsonwebtoken (JWT authentication)

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Test Connection

Open browser:
- Homepage: http://localhost:3000
- Health Check: http://localhost:3000/api/health

**Expected Result:**
```json
{
  "success": true,
  "message": "System is healthy",
  "data": {
    "status": "healthy",
    "database": "connected",  👈 This should show "connected"
    "timestamp": "2025-11-11T08:30:00.000Z",
    "version": "1.0.0"
  }
}
```

---

## ✅ Verification Checklist

- [ ] `.env.local` file created with MongoDB connection string
- [ ] All folders created (lib, utils, models, middleware, api/health)
- [ ] All 6 files copied
- [ ] `npm install` completed successfully
- [ ] No errors in terminal
- [ ] `npm run dev` running
- [ ] http://localhost:3000 shows DigInvoice homepage
- [ ] http://localhost:3000/api/health shows `"database": "connected"`

---

## 🆘 If Health Check Shows "disconnected"

1. Check `.env.local` exists in root folder
2. Verify connection string is correct
3. Restart dev server: `Ctrl+C` then `npm run dev`
4. Check MongoDB Atlas cluster is "Active"
5. Verify Network Access allows `0.0.0.0/0`

---

## 🎉 Success!

Agar health check mein `"database": "connected"` dikhe, to **setup complete hai!**

Ab hum aage barh sakte hain aur models create kar sakte hain! 🚀

---

**Questions?** Let me know!
