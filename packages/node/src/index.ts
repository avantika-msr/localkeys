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
 * Main config function (dotenv compatibility)
 * This is a synchronous wrapper that blocks until loading completes
 *
 * @param options - Load options
 * @returns Load result
 *
 * @example
 * ```typescript
 * import localkeys from '@localkeys/node';
 *
 * // Basic usage
 * const result = localkeys.config();
 *
 * // With options
 * const result = localkeys.config({
 *   environment: 'production',
 *   debug: true,
 * });
 * ```
 */
export function config(options?: LoadOptions): LoadResult {
  // Use top-level await in a synchronous context
  // This works because we're in an async module context
  let result: LoadResult | undefined;
  let error: Error | undefined;

  // Execute the async load and block until complete
  (async () => {
    try {
      result = await asyncLoad(options);
    } catch (e) {
      error = e as Error;
    }
  })();

  // Busy-wait for the result (not ideal but necessary for sync API)
  const start = Date.now();
  while (result === undefined && error === undefined) {
    // Wait for async operation to complete
    // Timeout after 5 seconds to prevent infinite loop
    if (Date.now() - start > 5000) {
      throw new Error('Timeout waiting for secrets to load');
    }
  }

  if (error) {
    // Return error result instead of throwing for dotenv compatibility
    return {
      success: false,
      loaded: {},
      errors: [
        {
          key: '',
          message: error.message,
          required: false,
        },
      ],
      count: 0,
    };
  }

  return result!;
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
