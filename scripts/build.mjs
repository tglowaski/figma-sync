/**
 * Build script using esbuild's JS API.
 * Copies the esbuild binary to /tmp to work around filesystems (like /mnt/data)
 * that don't support execute permissions.
 *
 * Usage:
 *   node scripts/build.mjs              # production (minified)
 *   node scripts/build.mjs --dev        # development (sourcemap)
 *   node scripts/build.mjs --watch      # watch mode
 */

import { cpSync, chmodSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Work around EACCES on noexec filesystems: copy esbuild binary to /tmp
const __dirname = dirname(fileURLToPath(import.meta.url));
const nativeBin = join(__dirname, '..', 'node_modules', '@esbuild', 'linux-x64', 'bin', 'esbuild');
const tmpBin = '/tmp/esbuild-bin';

if (existsSync(nativeBin)) {
  cpSync(nativeBin, tmpBin);
  chmodSync(tmpBin, 0o755);
  process.env.ESBUILD_BINARY_PATH = tmpBin;
}

const { build, context } = await import('esbuild/lib/main.js');

const isDev = process.argv.includes('--dev');
const isWatch = process.argv.includes('--watch');

const options = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  target: 'es2017',
  format: 'iife',
  minify: !isDev && !isWatch,
  sourcemap: isDev || isWatch,
};

if (isWatch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await build(options);
  console.log(`Built dist/code.js (${isDev ? 'dev' : 'production'})`);
}
