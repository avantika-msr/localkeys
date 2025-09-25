import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts', 'src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'build'],
    passWithNoTests: true,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/testing/**',
      ],
    },
  },
});
