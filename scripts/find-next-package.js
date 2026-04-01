import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Find where next package is installed
const searchPaths = [
  '/app',
  '/home',
  '/usr/local',
  '/opt',
  '/vercel',
  '/tmp',
  process.cwd(),
  path.resolve('.'),
  path.resolve('..'),
  path.resolve('../..'),
];

console.log("CWD:", process.cwd());
console.log("__dirname:", import.meta.url);
console.log("PATH entries:", process.env.PATH?.split(':').slice(0, 10));

// Try to find next via require.resolve
try {
  const nextPkg = import.meta.resolve('next/package.json');
  console.log("next/package.json resolved to:", nextPkg);
} catch (e) {
  console.log("Could not resolve next/package.json:", e.message);
}

// Try to find via shell
try {
  const result = execSync('find / -name "default-transpiled-packages.json" -maxdepth 10 2>/dev/null || true', { 
    encoding: 'utf8', 
    timeout: 10000 
  });
  console.log("Found default-transpiled-packages.json at:", result || "(not found anywhere)");
} catch (e) {
  console.log("Find command failed:", e.message);
}

// Try to find node_modules with next
try {
  const result = execSync('find / -path "*/next/dist/lib" -maxdepth 10 -type d 2>/dev/null | head -5 || true', { 
    encoding: 'utf8', 
    timeout: 10000 
  });
  console.log("next/dist/lib directories:", result || "(none found)");
} catch (e) {
  console.log("Find next/dist/lib failed:", e.message);
}

// Check if node_modules exists in any common location
for (const p of searchPaths) {
  const nmPath = path.join(p, 'node_modules');
  if (fs.existsSync(nmPath)) {
    console.log(`node_modules found at: ${nmPath}`);
    const nextPath = path.join(nmPath, 'next');
    if (fs.existsSync(nextPath)) {
      console.log(`  -> next package found at: ${nextPath}`);
      const distLib = path.join(nextPath, 'dist', 'lib');
      if (fs.existsSync(distLib)) {
        console.log(`  -> dist/lib exists at: ${distLib}`);
        const files = fs.readdirSync(distLib);
        console.log(`  -> files in dist/lib: ${files.join(', ')}`);
      } else {
        console.log(`  -> dist/lib NOT found`);
      }
    }
  }
}

// List root dirs
try {
  const rootDirs = fs.readdirSync('/');
  console.log("Root dirs:", rootDirs.join(', '));
} catch(e) {
  console.log("Cannot read /:", e.message);
}

console.log("Done searching.");
