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
        'src/cli.ts', // CLI entry point — tested via E2E
        'src/examples/**', // Example files
        // NOTE: src/commands and src/security are now covered by unit tests
      ],
      thresholds: {
        lines: 60,
        functions: 50,
        branches: 50,
        statements: 60,
      },
    },
  } as typeof baseConfig.test,
});
