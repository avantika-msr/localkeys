import { defineConfig } from 'vitest/config';
import { baseConfig } from '../../vitest.config.base';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['**/__tests__/**/*.test.ts', 'src/**/*.{test,spec}.ts'],
    passWithNoTests: true,
    coverage: {
      ...baseConfig.test?.coverage,
      exclude: [
        ...(baseConfig.test?.coverage?.exclude || []),
        'src/cli.ts', // CLI entry point - tested via E2E
        'src/commands/**', // CLI commands - tested via E2E
        'src/examples/**', // Example files
      ],
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 50,
        statements: 30,
      },
    },
  } as typeof baseConfig.test,
});
