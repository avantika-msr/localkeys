import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    index: 'src/index.ts',
  },
  format: ['esm'], // ES modules for modern Node.js
  outExtension: () => ({ js: '.js' }),
  dts: true,
  clean: true,
  sourcemap: false,
  minify: false,
  target: 'node18',
  outDir: 'dist',
  splitting: false,
  shims: false,
  bundle: false,
  platform: 'node',
});
