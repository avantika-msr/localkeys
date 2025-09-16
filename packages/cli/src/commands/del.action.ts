/**
 * @module @localkeys/cli/commands
 * @file del.action.ts
 * @description Implementation of the del command
 */

import { SystemKeychain } from '../core';
import { ConfigManager } from '../core/config/config.manager';
import { error, success, verbose, LogTag } from '../utils/logger';

/**
 * Options for del command
 */
export interface DelOptions {
  verbose?: boolean;
  env?: string;
}

/**
 * Delete command action
 *
 * @param key - The key of the secret to delete
 * @param options - Command options
 */
export async function delAction(
  key: string,
  options: DelOptions
): Promise<void> {
  const configManager = new ConfigManager();

  verbose(options.verbose === true, LogTag.LOG, 'options:', options);
  verbose(options.verbose === true, LogTag.LOG, 'key:', key);

  // 1. Check if LocalKeys is initialized
  const config = await configManager.load();
  if (!config) {
    error('LocalKeys not initialized. Run "lkeys init" first.');
    process.exit(1);
  }

  const packageName = config.getPackage();
  const defaultEnvironment = config.getDefaultEnvironment();
  const environment = options.env || defaultEnvironment;

  verbose(
    options.verbose === true,
    LogTag.LOG,
    `Deleting secret for key: ${key} from package: ${packageName}`
  );
  verbose(
    options.verbose === true,
    LogTag.LOG,
    `Using environment: ${environment}`
  );

  // 2. Delete secret from keychain (also updates manifest)
  const keychain = new SystemKeychain(
    packageName,
    process.cwd(),
    defaultEnvironment
  );
  try {
    await keychain.delete(key, options.env);
    verbose(
      options.verbose === true,
      LogTag.SUCCESS,
      `Deleted secret from keychain: ${key} in ${environment}`
    );
  } catch (err) {
    error('Failed to delete secret:', err);
    process.exit(1);
  }

  // 3. Show success message
  success(
    `Secret "${key}" deleted successfully from ${environment} environment`
  );
}
