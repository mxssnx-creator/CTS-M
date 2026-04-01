#!/bin/bash

echo "🧹 Clearing all local build caches..."

# Remove Next.js cache
rm -rf .next
echo "✓ Removed .next"

# Remove Turbopack cache
rm -rf .turbo
echo "✓ Removed .turbo"

# Remove TypeScript build info
rm -f tsconfig.tsbuildinfo
echo "✓ Removed tsconfig.tsbuildinfo"

# Remove node_modules cache
rm -rf node_modules/.cache
echo "✓ Removed node_modules/.cache"

# Remove any turbo cache
rm -rf node_modules/.turbo
echo "✓ Removed node_modules/.turbo"

# Remove npm cache (local)
rm -rf .npm
echo "✓ Removed .npm"

echo ""
echo "✅ All local caches cleared successfully!"
echo "Now run: npm run dev"
