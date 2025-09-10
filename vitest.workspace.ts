import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
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
      name: 'runner-node',
      root: './packages/runner-node',
    },
  },
]);
