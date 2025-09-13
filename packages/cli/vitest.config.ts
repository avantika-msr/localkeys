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
        'src/examples/**', // Example files
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  } as typeof baseConfig.test,
});
