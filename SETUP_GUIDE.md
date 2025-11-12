# DigiInvoice ERP - Complete Setup Guide

Step-by-step guide to set up DigiInvoice ERP from scratch.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [First Run](#first-run)
6. [Initial Data Setup](#initial-data-setup)
7. [Testing the Application](#testing-the-application)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements

- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 10 GB free space
- **OS:** Windows 10+, macOS 10.15+, Ubuntu 20.04+

### Recommended Requirements

- **CPU:** 4 cores
- **RAM:** 8 GB
- **Storage:** 20 GB SSD
- **OS:** Ubuntu 22.04 LTS or macOS 13+

### Software Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or 20.x | Runtime environment |
| npm | 9.x+ | Package manager |
| MongoDB | 6.0+ | Database |
| Git | 2.x+ | Version control |
| Google Chrome | Latest | Testing (optional) |

---

## Installation

### Step 1: Install Node.js

#### On Ubuntu/Debian

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 9.x.x or higher
```

#### On macOS

```bash
# Using Homebrew
brew install node@20

# Verify installation
node --version
npm --version
```

#### On Windows

1. Download Node.js installer from [nodejs.org](https://nodejs.org/)
2. Run installer (choose LTS version 20.x)
3. Verify in Command Prompt:
   ```cmd
   node --version
   npm --version
   ```

---

### Step 2: Install MongoDB

#### On Ubuntu/Debian

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

#### On macOS

```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community@6.0

# Start MongoDB service
brew services start mongodb-community@6.0

# Verify MongoDB is running
brew services list
```

#### On Windows

1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run installer
3. Choose "Complete" installation
4. Install as a Windows Service
5. Verify installation:
   ```cmd
   mongosh --version
   ```

#### Using MongoDB Atlas (Cloud)

**Alternative to local installation:**

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 Sandbox)
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/digiinvoice`

---

### Step 3: Install Git

#### On Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install git

# Verify
git --version
```

#### On macOS

```bash
# Using Homebrew
brew install git

# Or use Xcode Command Line Tools
xcode-select --install
```

#### On Windows

1. Download Git from [git-scm.com](https://git-scm.com/)
2. Run installer with default options
3. Verify in Command Prompt:
   ```cmd
   git --version
   ```

---

### Step 4: Clone the Repository

```bash
# Navigate to your projects directory
cd ~/projects  # or C:\Users\YourName\projects on Windows

# Clone the repository
git clone <repository-url> digi-invoice

# Navigate into the project
cd digi-invoice
```

---

### Step 5: Install Dependencies

```bash
# Install all npm packages
npm install

# This will install:
# - Next.js 16
# - React 18
# - Mongoose
# - bcrypt
# - jsonwebtoken
# - TailwindCSS
# - And all other dependencies
```

**Expected time:** 2-5 minutes depending on internet speed

---

## Database Setup

### Option 1: Local MongoDB

#### Create Database

```bash
# Connect to MongoDB shell
mongosh

# Create database
use digiinvoice

# Create a test collection (optional)
db.createCollection("test")

# Verify
show dbs

# Exit
exit
```

### Option 2: MongoDB Atlas (Cloud)

1. Database is created automatically on first connection
2. Use the connection string from Atlas dashboard

### Database Security (Recommended for Production)

```bash
# Create admin user in MongoDB
mongosh

use admin

db.createUser({
  user: "digiinvoice_admin",
  pwd: "strong_password_here",
  roles: [
    { role: "readWrite", db: "digiinvoice" },
    { role: "dbAdmin", db: "digiinvoice" }
  ]
})

exit
```

---

## Environment Configuration

### Step 1: Create Environment File

```bash
# Copy example env file
cp .env.example .env.local

# Or create manually
touch .env.local
```

### Step 2: Edit .env.local

```bash
# Open in your preferred editor
nano .env.local
# or
code .env.local
# or
vim .env.local
```

### Step 3: Configure Environment Variables

```env
# ======================
# Database Configuration
# ======================

# For Local MongoDB (no authentication)
MONGODB_URI=mongodb://localhost:27017/digiinvoice

# For Local MongoDB (with authentication)
# MONGODB_URI=mongodb://digiinvoice_admin:password@localhost:27017/digiinvoice

# For MongoDB Atlas (cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digiinvoice?retryWrites=true&w=majority

# ======================
# JWT Configuration
# ======================

# IMPORTANT: Generate a strong random secret key
# You can use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this

# JWT Expiration (optional, defaults to 7d)
JWT_EXPIRES_IN=7d

# ======================
# Application Settings
# ======================

# Environment
NODE_ENV=development

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ======================
# Email Configuration (Optional)
# ======================

# For Gmail (requires app password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# For other providers
# SMTP_HOST=smtp.mailtrap.io
# SMTP_PORT=2525
# SMTP_USER=your-username
# SMTP_PASS=your-password

# ======================
# File Upload (Optional)
# ======================

# Local storage
UPLOAD_DIR=./public/uploads

# ======================
# Logging
# ======================

# Log level: error, warn, info, debug
LOG_LEVEL=info
```

### Step 4: Generate JWT Secret

```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and paste it as JWT_SECRET in .env.local
```

**Example output:**
```
a3d8f7e2b9c4d1e6f8a0b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7
```

### Step 5: Verify Configuration

```bash
# Print environment variables (without sensitive data)
node -e "console.log(process.env.MONGODB_URI?.replace(/\/\/.*@/, '//<credentials>@'))"
```

---

## First Run

### Step 1: Start Development Server

```bash
# Start Next.js development server
npm run dev
```

**Expected output:**
```
▲ Next.js 16.0.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
```

### Step 2: Verify Server is Running

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the DigiInvoice login/home page.

### Step 3: Check MongoDB Connection

The application will automatically connect to MongoDB on first request. Check terminal for:

```
✓ MongoDB connected successfully
```

If you see connection errors, verify:
1. MongoDB is running: `sudo systemctl status mongod` (Linux) or `brew services list` (macOS)
2. Connection string in `.env.local` is correct
3. Database credentials are correct (if using authentication)

---

## Initial Data Setup

### Step 1: Create Admin Account

1. Navigate to **Register** page: `http://localhost:3000/register`

2. Fill in registration form:
   - **Name:** Admin User
   - **Email:** admin@example.com
   - **Password:** Admin123! (change this!)

3. Click **Register**

4. You'll be redirected to the dashboard

### Step 2: Seed Default Permissions

Permissions are automatically seeded on first API call to `/api/rbac/permissions`.

**Manual seeding (optional):**

```bash
# Using curl
curl -X POST http://localhost:3000/api/rbac/permissions/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Or use Postman/Insomnia
```

**Verify:**
Navigate to: `http://localhost:3000/admin/roles`
You should see roles with permissions.

### Step 3: Seed Chart of Accounts

Navigate to: `http://localhost:3000/admin/accounts`

Click **Seed Default Accounts** button (if available)

**Or manually seed via API:**

```bash
curl -X POST http://localhost:3000/api/accounts/seed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Default accounts created:**
- 1000 - Assets
- 2000 - Liabilities
- 3000 - Equity
- 4000 - Revenue
- 5000 - Expenses
- (+ child accounts)

### Step 4: Create Roles

Navigate to: `http://localhost:3000/admin/roles`

Create the following roles:

1. **Admin**
   - Level: 100
   - Permissions: All
   - Color: #3B82F6

2. **Accountant**
   - Level: 70
   - Permissions: accounts:*, vouchers:*, reports:*
   - Color: #10B981

3. **Sales Manager**
   - Level: 60
   - Permissions: customers:*, invoices:*, sales:*
   - Color: #F59E0B

4. **Purchase Manager**
   - Level: 60
   - Permissions: suppliers:*, purchase-orders:*, grn:*, purchase-invoices:*
   - Color: #EF4444

5. **Viewer**
   - Level: 30
   - Permissions: *:read
   - Color: #6B7280

### Step 5: Assign Role to Admin User

Navigate to: `http://localhost:3000/admin/users` (if user management page exists)

Or use API:

```bash
curl -X PUT http://localhost:3000/api/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleId": "ADMIN_ROLE_ID"}'
```

---

## Testing the Application

### Automated Testing with Scripts

We provide bash scripts to quickly open all pages for testing.

#### Make Scripts Executable

```bash
chmod +x open-all-pages.sh
chmod +x open-pages-by-module.sh
```

#### Test All Pages

```bash
./open-all-pages.sh
```

This opens all 27 pages in Google Chrome.

#### Test by Module

```bash
# Test sales module only
./open-pages-by-module.sh sales

# Test procurement module
./open-pages-by-module.sh procurement

# Test accounting module
./open-pages-by-module.sh accounting

# Test admin pages
./open-pages-by-module.sh admin
```

### Manual Testing Checklist

#### Sales Module

- [ ] Create customer
- [ ] Create sales invoice
- [ ] Post invoice to accounts
- [ ] Verify customer balance updated
- [ ] Verify journal voucher created
- [ ] Check account ledger

#### Procurement Module

- [ ] Create supplier
- [ ] Create purchase order
- [ ] Send PO to supplier (email)
- [ ] Create GRN from PO
- [ ] Inspect goods (accept/reject)
- [ ] Create purchase invoice from GRN
- [ ] Verify 3-way matching
- [ ] Approve invoice
- [ ] Post to accounts
- [ ] Verify supplier balance updated

#### Accounting Module

- [ ] View chart of accounts
- [ ] Create manual journal voucher
- [ ] Post voucher
- [ ] View account ledger
- [ ] Generate trial balance
- [ ] Generate balance sheet
- [ ] Verify trial balance is balanced

#### RBAC

- [ ] Create role
- [ ] Assign permissions to role
- [ ] Create user
- [ ] Assign role to user
- [ ] Test permissions enforcement

---

## Production Deployment

### Step 1: Build Application

```bash
# Create production build
npm run build
```

**Expected output:**
```
Route (app)                                Size     First Load JS
┌ ○ /                                     1.2 kB         90 kB
├ ○ /admin/accounts                       850 B          88 kB
├ ○ /admin/customers                      920 B          89 kB
...
○  (Static)  prerendered as static HTML
```

### Step 2: Test Production Build Locally

```bash
# Start production server
npm start
```

Navigate to `http://localhost:3000` and verify all pages work.

### Step 3: Production Environment Variables

Create `.env.production`:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/digiinvoice
JWT_SECRET=<different-from-dev-super-strong-secret>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Security Checklist:**
- [ ] Use different JWT_SECRET than development
- [ ] Use MongoDB with authentication
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Disable debug logs

### Step 4: Deploy to Hosting Provider

#### Option 1: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard.

#### Option 2: VPS (Ubuntu Server)

```bash
# On your VPS
git clone <repository-url>
cd digi-invoice
npm install
npm run build

# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start npm --name "digiinvoice" -- start

# Make PM2 start on boot
pm2 startup
pm2 save
```

#### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t digiinvoice .
docker run -d -p 3000:3000 --env-file .env.production digiinvoice
```

### Step 5: Setup Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 6: Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Step 7: Database Backups

```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/digiinvoice_$DATE"

# Schedule with cron
crontab -e

# Add line (daily backup at 2 AM)
0 2 * * * /path/to/backup-script.sh
```

---

## Troubleshooting

### MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED 127.0.0.1:27017`

**Solutions:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check MongoDB logs
sudo journalctl -u mongod -n 50

# Verify port 27017 is listening
sudo netstat -tuln | grep 27017
```

---

### Port 3000 Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**
```bash
# Find process using port 3000
lsof -i :3000
# or on Windows:
netstat -ano | findstr :3000

# Kill the process
kill -9 <PID>
# or on Windows:
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

---

### Build Errors

**Error:** Various build errors

**Solutions:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

---

### Permission Denied Errors (Linux/macOS)

**Error:** `EACCES: permission denied`

**Solutions:**
```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix file permissions
chmod -R 755 .
```

---

### JWT Token Invalid

**Error:** `JsonWebTokenError: invalid token`

**Solutions:**
1. Clear browser localStorage
2. Re-login
3. Verify JWT_SECRET is same as when token was generated
4. Check token hasn't expired

---

### Database Seeding Issues

**Error:** Permissions or accounts not created

**Solutions:**
```bash
# Manually trigger seed endpoints
curl -X POST http://localhost:3000/api/rbac/permissions/seed
curl -X POST http://localhost:3000/api/accounts/seed

# Check database directly
mongosh
use digiinvoice
db.permissions.find().count()
db.accounts.find().count()
```

---

## Getting Help

### Documentation

- **README.md** - Project overview
- **API_DOCUMENTATION.md** - API reference
- **ARCHITECTURE.md** - System architecture
- **FEATURES.md** - Feature descriptions

### Logs

Check application logs for errors:

```bash
# Development
Check terminal where npm run dev is running

# Production (PM2)
pm2 logs digiinvoice

# MongoDB logs
sudo journalctl -u mongod
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Can't login | Check MongoDB connection, verify user exists |
| Pages not loading | Check console for errors, verify API routes |
| Permissions not working | Re-seed permissions, check role assignment |
| Invoices not posting | Check account IDs exist, verify voucher balance |

---

## Next Steps

After successful setup:

1. ✅ Read **FEATURES.md** for detailed feature documentation
2. ✅ Review **API_DOCUMENTATION.md** for API integration
3. ✅ Study **ARCHITECTURE.md** to understand system design
4. ✅ Create test data for all modules
5. ✅ Configure email settings for notifications
6. ✅ Set up automated backups
7. ✅ Plan production deployment

---

**Setup Version:** 1.0.0
**Last Updated:** 2025-11-11
**Difficulty:** Intermediate
**Estimated Time:** 1-2 hours
