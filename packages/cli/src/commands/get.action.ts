/**
 * @module @localkeys/cli/commands
 * @file get.action.ts
 * @description Implementation of the get command
 */

import { SystemKeychain } from '../core';
import { ConfigManager } from '../core/config/config.manager';
import { error, log, verbose, warn, LogTag } from '../utils/logger';

/**
 * Options for get command
 */
export interface GetOptions {
  verbose?: boolean;
  defaultFallback?: unknown;
}

/**
 * Get command action
 *
 * @param key - The key of the secret to retrieve
 * @param options - Command options
 */
export async function getAction(
  key: string,
  options: GetOptions
): Promise<void> {
  const configManager = new ConfigManager();

  verbose(options.verbose === true, LogTag.LOG, 'options:', options);

  // 1. Check if LocalKeys is initialized
  const config = await configManager.load();
  if (!config) {
    error('LocalKeys not initialized. Run "localkeys init" first.');
    process.exit(1);
  }

  const packageName = config.getPackage();
  verbose(
    options.verbose === true,
    LogTag.LOG,
    `Getting secret for key: ${key} from package: ${packageName}`
  );

  // 2. Retrieve secret from keychain
  const keychain = new SystemKeychain(packageName);
  try {
    const value = await keychain.get(key);

    // Log the retrieved secret or fallback
    if (value !== null) {
      verbose(
        options.verbose === true,
        LogTag.SUCCESS,
        `Retrieved secret for key: ${key}`
      );
      log(`${value}`);
    }
    // Handle missing secret with default fallback
    else if (options.defaultFallback !== undefined) {
      verbose(
        options.verbose === true,
        LogTag.WARN,
        `Secret for key "${key}" not found. Using default fallback value.`
      );
      log(`${options.defaultFallback}`);
    }
    // No secret and no fallback
    else {
      warn(`Secret for key "${key}" not found.`);
      verbose(
        options.verbose === true,
        LogTag.WARN,
        'No default fallback provided.'
      );
      process.exit(1);
    }
  } catch (err) {
    error('Failed to retrieve secret:', err);
    process.exit(1);
  }
}
