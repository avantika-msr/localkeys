/**
 * @module @localkeys/cli/commands
 * @file list.action.ts
 * @description Implementation of the list command
 */

import { ConfigManager } from '@localkeys/core';
import { ManifestManager } from '@localkeys/core';
import { error, info, log, verbose, warn, LogTag } from '../utils/logger';

/**
 * Options for list command
 */
export interface ListOptions {
  verbose?: boolean;
}

/**
 * List command action
 *
 * @param options - Command options
 */
export async function listAction(options: ListOptions): Promise<void> {
  const configManager = new ConfigManager();
  const manifestManager = new ManifestManager();

  // 1. Check if LocalKeys is initialized
  const config = await configManager.load();
  if (!config) {
    error('LocalKeys not initialized. Run "lkeys init" first.');
    process.exit(1);
  }

  const packageName = config.getPackage();
  verbose(
    options.verbose === true,
    LogTag.LOG,
    `Listing secrets for package: ${packageName}`
  );

  // 2. Get keys from manifest
  try {
    const keys = await manifestManager.listKeys(packageName);
    const requiredKeys = await manifestManager.getRequiredKeys(packageName);
    const optionalKeys = await manifestManager.getOptionalKeys(packageName);

    if (keys.length === 0) {
      warn(`No secrets found for package "${packageName}"`);
      info('\nRun "lkeys set <KEY> <value>" to store a secret.');
    } else {
      info(`\nSecrets for "${packageName}":`);

      // Show required keys
      if (requiredKeys.length > 0) {
        info('\n  Required:');
        requiredKeys.forEach((key) => {
          log(`    • ${key}`);
        });
      }

      // Show optional keys
      if (optionalKeys.length > 0) {
        info('\n  Optional:');
        optionalKeys.forEach((key) => {
          log(`    • ${key}`);
        });
      }

      info(
        `\nTotal: ${keys.length} secret(s) (${requiredKeys.length} required, ${optionalKeys.length} optional)`
      );
    }
  } catch (err) {
    error('Failed to list secrets:', err);
    process.exit(1);
  }
}
