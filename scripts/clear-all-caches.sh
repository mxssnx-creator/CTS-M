#!/bin/bash

# Comprehensive cache clearing script for CTS v3.1
# Clears all TypeScript, Next.js, and build caches

echo "Clearing all build caches..."

# Remove TypeScript build info
rm -rf tsconfig.tsbuildinfo
rm -rf .tsbuildinfo
rm -rf **/*.tsbuildinfo

# Remove Next.js caches
rm -rf .next
rm -rf .turbo
rm -rf .vercel

# Remove node modules cache (optional, uncomment if needed)
# rm -rf node_modules/.cache

# Remove TypeScript cache
rm -rf node_modules/.cache/typescript

echo "All caches cleared successfully!"
