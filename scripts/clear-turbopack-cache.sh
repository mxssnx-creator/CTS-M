#!/bin/bash


echo "========================================="
echo "CTS v3.1 - Complete Cache Clear"
echo "========================================="
echo ""

# Remove Next.js cache directories
echo "Clearing Next.js caches..."
rm -rf .next
rm -rf .turbopack
rm -rf node_modules/.cache
rm -rf .turbo
echo "✓ Next.js caches cleared"
echo ""

# Remove TypeScript build info
echo "Clearing TypeScript build info..."
find . -name "tsconfig.tsbuildinfo" -type f -delete
find . -name "*.tsbuildinfo" -type f -delete
echo "✓ TypeScript build info cleared"
echo ""

# Remove Vercel build cache
echo "Clearing Vercel caches..."
rm -rf .vercel
echo "✓ Vercel caches cleared"
echo ""

echo "========================================="
echo "Cache cleared successfully!"
echo "Run 'npm run build' to rebuild"
echo "========================================="
