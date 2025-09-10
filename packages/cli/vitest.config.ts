import { defineConfig } from 'vitest/config';
import { baseConfig } from '../../vitest.config.base';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['**/__tests__/**/*.test.ts', 'src/**/*.{test,spec}.ts'],
    passWithNoTests: true,
  } as typeof baseConfig.test,
});
