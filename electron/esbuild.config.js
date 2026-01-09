// FILE: electron/esbuild.config.js
/// ANCHOR: EsbuildConfig
// This file is a reference for the esbuild command used in package.json
// The actual build is done via npm scripts using esbuild CLI

const esbuildConfig = {
  entryPoints: ['electron/main.ts', 'electron/preload.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outdir: 'dist_electron',
  external: ['electron', '@prisma/client'],
  sourcemap: true,
  minify: false
};

// This is just for reference - actual build uses CLI in package.json
module.exports = esbuildConfig;

