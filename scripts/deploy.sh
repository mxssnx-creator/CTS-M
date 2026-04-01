#!/bin/bash

# CTS v3.1 Deployment Helper Script
# Prepares and validates the project for deployment

set -e

echo "🚀 CTS v3.1 Deployment Preparation"
echo "=================================="
echo ""

# Step 1: Verify deployment readiness
echo "📋 Step 1: Verifying deployment configuration..."
node scripts/verify-deployment.js
if [ $? -ne 0 ]; then
    echo "❌ Verification failed. Please fix errors before deploying."
    exit 1
fi

# Step 2: Clear all caches
echo ""
echo "🧹 Step 2: Clearing all caches..."
npm run clean

# Step 3: Run type check
echo ""
echo "🔍 Step 3: Running type check..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Type check failed. Please fix TypeScript errors."
    exit 1
fi

# Step 4: Test build locally
echo ""
echo "🏗️  Step 4: Testing production build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors."
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "Ready to deploy to Vercel. Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Ready for deployment'"
echo "2. Push to repository: git push"
echo "3. Vercel will automatically deploy"
echo ""
echo "Or deploy manually: vercel --prod"
