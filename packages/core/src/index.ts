/**
 * @module @localkeys/core
 * @description Core business logic for LocalKeys
 * @internal This package is not published to npm - it's bundled into CLI and runtime packages
 */

// Export all modules
export * from './keychain';
export * from './manifest';
export * from './config';
export * from './types';

// Version
export const version = '0.1.0';
