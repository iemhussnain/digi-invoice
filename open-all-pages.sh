#!/bin/bash

# DigiInvoice ERP - Open All Pages in Chrome
# Usage: ./open-all-pages.sh

BASE_URL="http://localhost:3000"

echo "🚀 Opening DigiInvoice ERP Pages in Google Chrome..."
echo "=================================================="

# Array of all pages to open
PAGES=(
  # Auth & Dashboard
  "/"
  "/login"
  "/register"
  "/dashboard"

  # Sales Module
  "/admin/sales"
  "/admin/customers"
  "/admin/invoices"

  # Procurement Module
  "/admin/suppliers"
  "/admin/purchase-orders"
  "/admin/grn"
  "/admin/purchase-invoices"

  # Accounting Module
  "/admin/accounts"
  "/admin/vouchers"
  "/admin/reports"
  "/admin/reports/ledger"
  "/admin/reports/trial-balance"
  "/admin/reports/balance-sheet"

  # Admin Module
  "/admin/roles"
)

# Detect Chrome binary
if command -v google-chrome &> /dev/null; then
  CHROME="google-chrome"
elif command -v google-chrome-stable &> /dev/null; then
  CHROME="google-chrome-stable"
elif command -v chromium-browser &> /dev/null; then
  CHROME="chromium-browser"
elif command -v chromium &> /dev/null; then
  CHROME="chromium"
else
  echo "❌ Error: Chrome/Chromium not found!"
  echo "Please install Google Chrome or Chromium browser"
  exit 1
fi

echo "Using browser: $CHROME"
echo ""

# Build URLs and open in Chrome
URLS=""
for PAGE in "${PAGES[@]}"; do
  URL="${BASE_URL}${PAGE}"
  echo "📄 $URL"
  URLS="$URLS $URL"
done

echo ""
echo "Opening ${#PAGES[@]} pages in Chrome..."

# Open all URLs in new tabs
$CHROME $URLS &

echo "✅ Done! All pages opened in Chrome."
echo ""
echo "Note: Make sure your Next.js dev server is running:"
echo "  npm run dev"
