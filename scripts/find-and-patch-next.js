import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

// Find all next package.json files on the entire filesystem
console.log("=== Searching entire filesystem for next/package.json ===");

try {
  // Use `find` to locate all next package dirs
  const result = execSync(
    'find / -path "*/next/package.json" -not -path "*/scripts/*" 2>/dev/null || true',
    { encoding: 'utf8', timeout: 30000 }
  );
  
  const paths = result.trim().split('\n').filter(Boolean);
  console.log(`Found ${paths.length} next package.json files:`);
  
  for (const pkgPath of paths) {
    console.log(`  ${pkgPath}`);
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      console.log(`    version: ${pkg.version}, name: ${pkg.name}`);
    } catch(e) {
      console.log(`    (could not read)`);
    }
    
    const nextDir = dirname(pkgPath);
    const targetDir = join(nextDir, 'dist', 'lib');
    const targetFile = join(targetDir, 'default-transpiled-packages.json');
    
    if (existsSync(targetFile)) {
      console.log(`    ✓ default-transpiled-packages.json already exists`);
    } else {
      console.log(`    ✗ MISSING default-transpiled-packages.json - creating...`);
      try {
        mkdirSync(targetDir, { recursive: true });
        writeFileSync(targetFile, JSON.stringify(["geist"]));
        console.log(`    ✓ CREATED at ${targetFile}`);
      } catch(e) {
        console.log(`    ✗ FAILED to create: ${e.message}`);
      }
    }
  }
} catch(e) {
  console.log(`Search failed: ${e.message}`);
}

// Also check common v0 runtime paths
const commonPaths = [
  '/tmp/node_modules/next',
  '/home/user/node_modules/next',
  '/app/node_modules/next',
  '/workspace/node_modules/next',
  '/vercel/node_modules/next',
  '/opt/node_modules/next',
];

console.log("\n=== Checking common paths ===");
for (const p of commonPaths) {
  if (existsSync(p)) {
    console.log(`  EXISTS: ${p}`);
  }
}

// Check where require resolves 'next'
console.log("\n=== Require resolve ===");
try {
  const resolved = import.meta.resolve('next');
  console.log(`import.meta.resolve('next') = ${resolved}`);
} catch(e) {
  console.log(`import.meta.resolve failed: ${e.message}`);
}

// Check env vars for paths
console.log("\n=== Relevant env vars ===");
for (const key of Object.keys(process.env).sort()) {
  if (key.includes('NODE') || key.includes('PATH') || key.includes('NPM') || key.includes('PNPM') || key.includes('HOME') || key.includes('PWD')) {
    console.log(`  ${key}=${process.env[key]}`);
  }
}
