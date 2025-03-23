#!/usr/bin/env node

/**
 * Takes a list of scripts that PNPM
 * says it did not run so that we can peek at their
 * "install", "postinstall", and other scripts
 * to determine if they are safe to run
 */

import fs from 'fs';
import path from 'path';
const packages = process.argv.slice(2);
if (!packages.length) {
  console.error('Usage: get-script.js <package-name> [<package-name> ...]');
  process.exit(1);
}

packages.forEach(pkg => {
  let pkgPath;
  if (pkg.startsWith('@')) {
    const [scope, name] = pkg.split('/');
    pkgPath = path.join(
      'node_modules', scope, name, 'package.json',
    );
  } else {
    pkgPath = path.join(
      'node_modules', pkg, 'package.json',
    );
  }

  if (!fs.existsSync(pkgPath)) {
    console.log(`Package "${pkg}" not found at ${pkgPath}`);
    return;
  }

  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkgJson.scripts && Object.keys(pkgJson.scripts).length > 0) {
      Object.entries(pkgJson.scripts).forEach(([key, value]) => {
        if (
          key !== 'clean' &&
          key !== 'format' &&
          !key.startsWith('test-') &&
          !key.startsWith('docs-') &&
          key !== 'release' &&
          key !== 'test'
        ) {
          console.log(
            `${pkg} ${key}: ${value}`,
          );
        }
      });
    } else {
      console.log(
        'No scripts defined.',
      );
    }
  } catch (err) {
    console.error(
      `Error reading ${pkgPath}: ${err}`,
    );
  }
});