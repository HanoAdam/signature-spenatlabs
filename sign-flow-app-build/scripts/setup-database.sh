#!/bin/bash

# SignFlow Database Setup Script
# This script helps you set up the database by providing instructions

echo "=========================================="
echo "SignFlow Database Setup"
echo "=========================================="
echo ""
echo "This script will guide you through setting up your Supabase database."
echo ""
echo "You have two options:"
echo ""
echo "Option 1: Manual Setup (Recommended)"
echo "  1. Go to https://app.supabase.com"
echo "  2. Select your project"
echo "  3. Navigate to SQL Editor"
echo "  4. Run each SQL file in this order:"
echo "     - 001_create_schema.sql"
echo "     - 002_enable_rls.sql"
echo "     - 003_public_signing_policies.sql"
echo "     - 005_fix_org_insert_policy.sql"
echo "     - 004_seed_data.sql (optional)"
echo ""
echo "Option 2: Using Supabase CLI"
echo "  If you have Supabase CLI installed, you can run:"
echo "  supabase db reset"
echo "  Then run each SQL file in order"
echo ""
echo "=========================================="
echo ""
read -p "Press Enter to open Supabase Dashboard in your browser..."

# Try to open browser (works on macOS and Linux)
if command -v open &> /dev/null; then
    open "https://app.supabase.com"
elif command -v xdg-open &> /dev/null; then
    xdg-open "https://app.supabase.com"
else
    echo "Please manually open: https://app.supabase.com"
fi

echo ""
echo "After running the SQL scripts, your database will be ready!"
echo "You can then start the development server with: pnpm dev"
