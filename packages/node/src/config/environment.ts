/**
 * @module @localkeys/node/config
 * @description Environment detection utilities
 */

import { DEFAULT_ENVIRONMENT, ENVIRONMENT_ENV_VAR } from './defaults';

/**
 * Detect the current environment
 *
 * Priority order:
 * 1. LOCALKEYS_ENV environment variable
 * 2. NODE_ENV environment variable
 * 3. Default to 'development'
 *
 * @returns Environment name (e.g., 'development', 'production', 'staging')
 *
 * @example
 * ```typescript
 * const env = detectEnvironment();
 * console.log(env); // 'development' or 'production'
 * ```
 */
export function detectEnvironment(): string {
  // 1. Check LOCALKEYS_ENV
  if (process.env[ENVIRONMENT_ENV_VAR]) {
    return process.env[ENVIRONMENT_ENV_VAR]!;
  }

  // 2. Check NODE_ENV
  if (process.env['NODE_ENV']) {
    return process.env['NODE_ENV'];
  }

  // 3. Default
  return DEFAULT_ENVIRONMENT;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return detectEnvironment() === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return detectEnvironment() === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return detectEnvironment() === 'test';
}
