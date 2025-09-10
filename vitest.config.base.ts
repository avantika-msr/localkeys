import { defineConfig } from 'vitest/config';

export const baseConfig = {
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.config.ts',
        '**/*.config.js',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/test-utils/**',
      ],
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'build'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    watch: false,
    reporters: ['verbose'],
  },
};
