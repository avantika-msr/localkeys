/**
 * @module @localkeys/node
 * @description LocalKeys Node.js runtime - Secure secret management
 *
 * Drop-in replacement for dotenv that loads secrets from OS keychain.
 */

import { load as asyncLoad, populate as asyncPopulate, reset } from './loader';
import { detectEnvironment as _detectEnvironment } from './config/environment';
import type { LoadOptions, LoadResult, PopulateOptions } from './types';

// Export types
export type {
  LoadOptions,
  LoadResult,
  PopulateOptions,
  ValidationError,
} from './types';
export type { ResetOptions } from './types';

// Export async functions
export { reset };

/**
 * Load secrets asynchronously
 *
 * @param options - Load options
 * @returns Promise of load result
 */
export async function load(options?: LoadOptions): Promise<LoadResult> {
  return asyncLoad(options);
}

/**
 * Get secrets without injecting (async)
 *
 * @param options - Populate options
 * @returns Promise of secrets
 */
export async function populate(
  options?: PopulateOptions
): Promise<Record<string, string>> {
  return asyncPopulate(options);
}

// Export utilities (for testing)
export { detectEnvironment } from './config/environment';

/**
 * Main config function (async version)
 * Loads secrets from keychain and injects into process.env
 *
 * @param options - Load options
 * @returns Promise of load result
 *
 * @example
 * ```typescript
 * import localkeys from '@localkeys/node';
 *
 * // Top-level await (ES modules)
 * const result = await localkeys.config();
 *
 * // Or with IIFE
 * (async () => {
 *   const result = await localkeys.config({
 *     environment: 'production',
 *     debug: true,
 *   });
 *   console.log(result);
 * })();
 * ```
 */
export async function config(options?: LoadOptions): Promise<LoadResult> {
  return await asyncLoad(options);
}

/**
 * Parse function (for dotenv compatibility)
 * Note: LocalKeys doesn't parse .env files, but we provide this for compatibility
 */
export function parse(_src: string | Buffer): Record<string, string> {
  // For compatibility with dotenv, return empty object
  // Real parsing is done from keychain, not files
  console.warn(
    '@localkeys/node: parse() is not supported. Use config() to load from keychain.'
  );
  return {};
}

// Default export for CommonJS compatibility
export default {
  config,
  parse,
  load,
  populate,
  reset,
  detectEnvironment: _detectEnvironment,
};
