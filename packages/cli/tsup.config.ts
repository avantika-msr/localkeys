import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
  },
  format: ['esm'], // ES modules for modern Node.js
  outExtension: () => ({ js: '.js' }),
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  splitting: false,
  shims: false,
  bundle: true, // Bundle all dependencies for CLI
  platform: 'node',
  external: [
    // Don't bundle native dependencies - they must be resolved at runtime
    '@napi-rs/keyring',
  ],
  noExternal: [
    // Bundle @localkeys/core into the CLI
    '@localkeys/core',
  ],
});
