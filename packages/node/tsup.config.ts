import { defineConfig } from 'tsup';

export default defineConfig([
  // Main bundle
  {
    entry: {
      index: 'src/index.ts',
      config: 'src/config.ts',
      register: 'src/register.ts',
    },
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
  },

  // Testing utilities (separate bundle)
  {
    entry: {
      testing: 'src/testing/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    minify: false,
    target: 'node18',
    outDir: 'dist',
    bundle: true,
    platform: 'node',
    external: ['@napi-rs/keyring'],
    noExternal: ['@localkeys/core'],
  },
]);
