# DigInvoice ERP - Setup Guide

## ✅ Chunk 1.1 Completed (Foundation Setup)

### What's Been Done:

1. ✅ **Next.js 15 & Tailwind CSS 4** - Already configured
2. ✅ **MongoDB Connection Utility** - Created `/src/lib/mongodb.js`
3. ✅ **Environment Variables** - Created `.env.local` and `.env.example`
4. ✅ **Base Folder Structure** - Created all required folders
5. ✅ **Utility Functions** - Response helpers and Logger
6. ✅ **Health Check API** - `/api/health` endpoint
7. ✅ **Homepage** - Updated with DigInvoice branding

---

## 📁 Project Structure Created

```
src/
├── app/
│   ├── api/
│   │   └── health/          # Health check endpoint
│   ├── globals.css
│   ├── layout.js
│   └── page.js              # Updated homepage
├── lib/
│   └── mongodb.js           # MongoDB connection utility
├── models/                  # Database models (empty for now)
├── middleware/              # Middleware functions (empty for now)
└── utils/
    ├── response.js          # API response helpers
    └── logger.js            # Logging utility
```

---

## 🚀 Next Steps: MongoDB Setup

### Option 1: MongoDB Atlas (Cloud - Recommended for Development)

1. **Create Free Account:**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Sign up for free (No credit card required)
   - Create a new cluster (Free M0 tier)

2. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster.mongodb.net/`

3. **Update `.env.local`:**
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/diginvoice-erp?retryWrites=true&w=majority
   ```

4. **Whitelist Your IP:**
   - In Atlas, go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (for development)

### Option 2: Local MongoDB (Better for Production Development)

**For Windows:**
```bash
# Download MongoDB Community Server from:
https://www.mongodb.com/try/download/community

# Install and start MongoDB service
# Connection string will be:
mongodb://localhost:27017/diginvoice-erp
```

**For macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Connection string:
mongodb://localhost:27017/diginvoice-erp
```

**For Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb-org
sudo systemctl start mongod

# Connection string:
mongodb://localhost:27017/diginvoice-erp
```

---

## 🧪 Testing Your Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   - Homepage: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

3. **Expected Results:**

   **If MongoDB is connected:**
   ```json
   {
     "success": true,
     "message": "System is healthy",
     "data": {
       "status": "healthy",
       "database": "connected",
       "timestamp": "2025-11-11T06:30:00.000Z",
       "version": "1.0.0"
     }
   }
   ```

   **If MongoDB is not running:**
   ```json
   {
     "success": false,
     "message": "System health check failed",
     "errors": {
       "error": "connect ECONNREFUSED 127.0.0.1:27017"
     }
   }
   ```

---

## 📦 Installed Packages

- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication

---

## 🎯 What's Next?

### Chunk 1.2: Database Connection & Utils (Remaining)
No additional work needed - already completed!

### Chunk 1.3: Base Models
Once MongoDB is running, we'll create:
- User model (basic authentication)
- Organization model (multi-tenancy)
- Session model (single device login)

---

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and update:

```env
# Required
MONGODB_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=change-this-to-random-32-char-string
JWT_EXPIRY=7d

# App Info
NEXT_PUBLIC_APP_NAME=DigInvoice ERP
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

---

## 📝 Key Files Created

1. **`/src/lib/mongodb.js`** - MongoDB connection with caching
2. **`/src/utils/response.js`** - API response helpers (success, error, validation, etc.)
3. **`/src/utils/logger.js`** - Colored console logging
4. **`/src/app/api/health/route.js`** - Health check endpoint
5. **`.env.local`** - Environment variables (not committed to git)
6. **`.env.example`** - Template for environment variables

---

## 🐛 Troubleshooting

### Issue: "Module not found: Can't resolve '@/lib/mongodb'"
**Solution:** The `@` alias is configured in `jsconfig.json`. Restart your dev server.

### Issue: "ECONNREFUSED 127.0.0.1:27017"
**Solution:** MongoDB is not running. Follow MongoDB setup steps above.

### Issue: "Please define the MONGODB_URI environment variable"
**Solution:** Create `.env.local` file with `MONGODB_URI` variable.

### Issue: "MongoServerError: bad auth"
**Solution:** Check your username/password in MongoDB connection string.

---

## ✅ Chunk 1.1 Verification Checklist

- [x] Next.js 15 running
- [x] Tailwind CSS 4 configured
- [x] MongoDB connection utility created
- [x] Environment variables setup
- [x] Base folder structure created
- [x] Utility functions created
- [x] Health check API working
- [x] Homepage loads successfully

**Status:** ✅ **COMPLETED - Ready for Chunk 1.3**

---

## 🎉 Success!

Your DigInvoice ERP foundation is ready! Once you setup MongoDB and see "database: connected" in the health check, we can proceed to create the base models (User, Organization, Session).

**Next Command:** Tell me "Start Chunk 1.3" when ready!
