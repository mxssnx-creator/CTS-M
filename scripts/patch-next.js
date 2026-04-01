import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

// The file Turbopack expects
const CONTENT = JSON.stringify(["geist"]);

function findAllNextDirs(rootDir, depth = 0) {
  if (depth > 8) return [];
  const results = [];
  try {
    const entries = readdirSync(rootDir);
    for (const entry of entries) {
      const fullPath = join(rootDir, entry);
      try {
        const stat = statSync(fullPath);
        if (!stat.isDirectory()) continue;
        
        // Check if this is a next package directory
        if (entry === 'next' && existsSync(join(fullPath, 'package.json'))) {
          results.push(fullPath);
        }
        
        // Recurse into node_modules and .pnpm
        if (entry === 'node_modules' || entry === '.pnpm' || entry.startsWith('next@')) {
          results.push(...findAllNextDirs(fullPath, depth + 1));
        }
      } catch {}
    }
  } catch {}
  return results;
}

// Try resolving from require
let nextDir = null;
try {
  const nextPkgPath = resolve(process.cwd(), 'node_modules/next/package.json');
  if (existsSync(nextPkgPath)) {
    nextDir = resolve(process.cwd(), 'node_modules/next');
  }
} catch {}

// Also search pnpm paths
const searchRoots = [
  join(process.cwd(), 'node_modules'),
  '/tmp',
  '/home',
  '/vercel',
];

const nextDirs = [];
if (nextDir) nextDirs.push(nextDir);

for (const root of searchRoots) {
  if (existsSync(root)) {
    nextDirs.push(...findAllNextDirs(root));
  }
}

console.log(`Found ${nextDirs.length} next package directories`);

let patched = 0;
for (const dir of nextDirs) {
  const targetPath = join(dir, 'dist', 'lib', 'default-transpiled-packages.json');
  if (!existsSync(targetPath)) {
    try {
      mkdirSync(join(dir, 'dist', 'lib'), { recursive: true });
      writeFileSync(targetPath, CONTENT);
      console.log(`PATCHED: ${targetPath}`);
      patched++;
    } catch (e) {
      console.log(`FAILED: ${targetPath} - ${e.message}`);
    }
  } else {
    console.log(`EXISTS: ${targetPath}`);
  }
}

console.log(`\nPatched ${patched} directories, ${nextDirs.length - patched} already had the file`);
