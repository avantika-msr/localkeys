import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  bundle: true,
  skipNodeModulesBundle: true,
});
