import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Fix Turbopack panic: create missing default-transpiled-packages.json
// in all next.js installations under node_modules

const content = JSON.stringify(["geist"]);

function findAndFix(baseDir) {
  try {
    if (!existsSync(baseDir)) {
      console.log(`Directory not found: ${baseDir}`);
      return;
    }

    // Direct node_modules/next
    const directPath = join(baseDir, 'node_modules', 'next', 'dist', 'lib');
    if (existsSync(join(baseDir, 'node_modules', 'next', 'dist'))) {
      const targetFile = join(directPath, 'default-transpiled-packages.json');
      if (!existsSync(targetFile)) {
        mkdirSync(directPath, { recursive: true });
        writeFileSync(targetFile, content);
        console.log(`Created: ${targetFile}`);
      } else {
        console.log(`Already exists: ${targetFile}`);
      }
    }

    // pnpm .pnpm directory
    const pnpmDir = join(baseDir, 'node_modules', '.pnpm');
    if (existsSync(pnpmDir)) {
      const entries = readdirSync(pnpmDir);
      for (const entry of entries) {
        if (entry.startsWith('next@')) {
          const nextDistLib = join(pnpmDir, entry, 'node_modules', 'next', 'dist', 'lib');
          const targetFile = join(nextDistLib, 'default-transpiled-packages.json');
          if (existsSync(join(pnpmDir, entry, 'node_modules', 'next', 'dist'))) {
            if (!existsSync(targetFile)) {
              mkdirSync(nextDistLib, { recursive: true });
              writeFileSync(targetFile, content);
              console.log(`Created: ${targetFile}`);
            } else {
              console.log(`Already exists: ${targetFile}`);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(`Error processing ${baseDir}:`, err.message);
  }
}

// Search from project root and common locations
findAndFix('/');
findAndFix(process.cwd());
findAndFix('/home');
findAndFix('/app');
findAndFix('/tmp');

console.log('Done fixing transpiled packages.');
