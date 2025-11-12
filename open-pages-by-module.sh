#!/bin/bash

# DigiInvoice ERP - Open Pages by Module
# Usage: ./open-pages-by-module.sh [module]
# Modules: auth, sales, procurement, accounting, admin, all

BASE_URL="http://localhost:3000"

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
  exit 1
fi

# Function to open pages
open_pages() {
  local module=$1
  shift
  local pages=("$@")

  echo "🚀 Opening $module Module Pages..."
  echo "======================================"

  URLS=""
  for page in "${pages[@]}"; do
    URL="${BASE_URL}${page}"
    echo "📄 $URL"
    URLS="$URLS $URL"
  done

  echo ""
  $CHROME $URLS &
  echo "✅ Opened ${#pages[@]} pages in Chrome"
}

# Module definitions
AUTH_PAGES=(
  "/"
  "/login"
  "/register"
  "/forgot-password"
  "/dashboard"
)

SALES_PAGES=(
  "/admin/sales"
  "/admin/customers"
  "/admin/customers/new"
  "/admin/invoices"
  "/admin/invoices/new"
)

PROCUREMENT_PAGES=(
  "/admin/suppliers"
  "/admin/suppliers/new"
  "/admin/purchase-orders"
  "/admin/purchase-orders/new"
  "/admin/grn"
  "/admin/purchase-invoices"
  "/admin/purchase-invoices/new"
)

ACCOUNTING_PAGES=(
  "/admin/accounts"
  "/admin/accounts/new"
  "/admin/vouchers"
  "/admin/vouchers/new"
  "/admin/reports"
  "/admin/reports/ledger"
  "/admin/reports/trial-balance"
  "/admin/reports/balance-sheet"
)

ADMIN_PAGES=(
  "/admin/roles"
)

ALL_PAGES=(
  "${AUTH_PAGES[@]}"
  "${SALES_PAGES[@]}"
  "${PROCUREMENT_PAGES[@]}"
  "${ACCOUNTING_PAGES[@]}"
  "${ADMIN_PAGES[@]}"
)

# Show usage if no argument
if [ $# -eq 0 ]; then
  echo "DigiInvoice ERP - Open Pages by Module"
  echo ""
  echo "Usage: $0 [module]"
  echo ""
  echo "Available modules:"
  echo "  auth         - Authentication & Dashboard (${#AUTH_PAGES[@]} pages)"
  echo "  sales        - Sales Module (${#SALES_PAGES[@]} pages)"
  echo "  procurement  - Procurement Module (${#PROCUREMENT_PAGES[@]} pages)"
  echo "  accounting   - Accounting Module (${#ACCOUNTING_PAGES[@]} pages)"
  echo "  admin        - Administration (${#ADMIN_PAGES[@]} page)"
  echo "  all          - All pages (${#ALL_PAGES[@]} pages)"
  echo ""
  echo "Examples:"
  echo "  $0 sales"
  echo "  $0 procurement"
  echo "  $0 all"
  echo ""
  echo "Note: Make sure your Next.js dev server is running:"
  echo "  npm run dev"
  exit 0
fi

MODULE=$1

case $MODULE in
  auth)
    open_pages "Authentication" "${AUTH_PAGES[@]}"
    ;;
  sales)
    open_pages "Sales" "${SALES_PAGES[@]}"
    ;;
  procurement)
    open_pages "Procurement" "${PROCUREMENT_PAGES[@]}"
    ;;
  accounting)
    open_pages "Accounting" "${ACCOUNTING_PAGES[@]}"
    ;;
  admin)
    open_pages "Administration" "${ADMIN_PAGES[@]}"
    ;;
  all)
    open_pages "All" "${ALL_PAGES[@]}"
    ;;
  *)
    echo "❌ Unknown module: $MODULE"
    echo ""
    echo "Available modules: auth, sales, procurement, accounting, admin, all"
    echo "Run '$0' without arguments for help"
    exit 1
    ;;
esac
