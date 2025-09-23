import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  splitting: false,
  bundle: true,
  platform: 'node',
  external: [
    // Don't bundle native dependencies
    '@napi-rs/keyring',
  ],
  noExternal: [
    // Bundle @localkeys/core into the runtime
    '@localkeys/core',
  ],
});
