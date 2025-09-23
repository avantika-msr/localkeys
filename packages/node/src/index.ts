/**
 * @module @localkeys/node
 * @description Node.js runtime integration for LocalKeys
 */

// Re-export core functionality for convenience
export { SystemKeychain } from '@localkeys/core';
export type { IKeychainProvider } from '@localkeys/core';

// TODO: Implement LocalKeysRuntime class
// TODO: Implement preload hook for --require flag
// TODO: Implement environment variable resolution

/**
 * Placeholder for Node.js runtime integration
 *
 * @example
 * ```typescript
 * import { LocalKeysRuntime } from '@localkeys/node';
 *
 * const runtime = new LocalKeysRuntime();
 * await runtime.resolveAll();
 * ```
 */
export class LocalKeysRuntime {
  constructor() {
    // TODO: Implement constructor
    throw new Error(
      'LocalKeysRuntime not yet implemented. Please implement this class.'
    );
  }
}

export const version = '0.1.0';
