import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      name: 'core',
      root: './packages/core',
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'cli',
      root: './packages/cli',
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'node',
      root: './packages/node',
    },
  },
]);
