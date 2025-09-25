/**
 * @module @localkeys/node/types
 * @description Type definitions for LocalKeys Node.js runtime
 */

import type { IKeychainProvider } from '@localkeys/core';

/**
 * Options for loading secrets
 */
export interface LoadOptions {
  /**
   * Environment to load secrets for
   * @default Detected from NODE_ENV or 'development'
   */
  environment?: string;

  /**
   * Project root directory
   * @default process.cwd()
   */
  projectRoot?: string;

  /**
   * Package name override
   * @default Auto-detected from .localkeys/config.json
   */
  packageName?: string;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Override existing process.env values
   * @default false
   */
  override?: boolean;

  /**
   * Validate required secrets
   * @default true
   */
  validate?: boolean;

  /**
   * Path to template file
   * @default Auto-detected from config
   */
  templatePath?: string;

  /**
   * Target object to populate (instead of process.env)
   * @default process.env
   */
  processEnv?: Record<string, string | undefined>;

  /**
   * Custom keychain instance (for testing)
   */
  keychain?: IKeychainProvider;
}

/**
 * Result of loading secrets
 */
export interface LoadResult {
  /**
   * Whether loading succeeded
   */
  success: boolean;

  /**
   * Secrets that were loaded
   */
  loaded: Record<string, string>;

  /**
   * Validation errors (if any)
   */
  errors: ValidationError[];

  /**
   * Number of secrets loaded
   */
  count: number;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /**
   * Key that failed validation
   */
  key: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Whether the key is required
   */
  required: boolean;
}

/**
 * Options for populate() function
 */
export interface PopulateOptions extends Omit<LoadOptions, 'processEnv'> {}

/**
 * Options for reset() function
 */
export interface ResetOptions {
  /**
   * Clear injected values from process.env
   * @default false
   */
  cleanEnv?: boolean;
}
