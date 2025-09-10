import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['docs/**', 'docs/.vitepress/**', 'docs/reference/**'],
  },
  {
    files: ['**/*.ts'],
    ignores: [
      'docs/**/*',
      'docs/.vitepress/cache/**',
      'docs/reference/**',
      '**/node_modules/**',
      '**/vite.config.ts',
      '**/*.d.ts',
    ],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.js'],
    ignores: ['docs/**/*', 'docs/.vitepress/cache/**', 'docs/reference/**', '**/node_modules/**'],
    rules: {
      'no-console': 'off',
    },
  },
];
