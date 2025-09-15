/**
 * @module @localkeys/cli/commands
 * @file validate.action.ts
 * @description Implementation of the validate command
 */

import { SystemKeychain } from '../core';
import { ConfigManager } from '../core/config/config.manager';
import { ManifestManager } from '../core/manifest/manifest.manager';
import { error, success, verbose, warn, info, LogTag } from '../utils/logger';

/**
 * Options for validate command
 */
export interface ValidateOptions {
  verbose?: boolean;
}

/**
 * Validate command action
 * Checks that all required keys exist in the keychain
 * Warns about missing optional keys
 *
 * @param options - Command options
 */
export async function validateAction(options: ValidateOptions): Promise<void> {
  const configManager = new ConfigManager();
  const manifestManager = new ManifestManager();

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
    `Validating secrets for package: ${packageName}`
  );

  // 2. Get required and optional keys from manifest
  const keychain = new SystemKeychain(packageName);
  const requiredKeys = await manifestManager.getRequiredKeys(packageName);
  const optionalKeys = await manifestManager.getOptionalKeys(packageName);

  verbose(
    options.verbose === true,
    LogTag.LOG,
    `Required keys: ${requiredKeys.join(', ')}`
  );
  verbose(
    options.verbose === true,
    LogTag.LOG,
    `Optional keys: ${optionalKeys.join(', ')}`
  );

  // 3. Check required keys
  const missingRequired: string[] = [];
  const presentRequired: string[] = [];

  for (const key of requiredKeys) {
    const value = await keychain.get(key);
    if (value === null) {
      missingRequired.push(key);
    } else {
      presentRequired.push(key);
    }
  }

  // 4. Check optional keys
  const missingOptional: string[] = [];
  const presentOptional: string[] = [];

  for (const key of optionalKeys) {
    const value = await keychain.get(key);
    if (value === null) {
      missingOptional.push(key);
    } else {
      presentOptional.push(key);
    }
  }

  // 5. Display results
  info(`\nValidation results for "${packageName}":\n`);

  // Show required keys status
  if (requiredKeys.length > 0) {
    info('Required keys:');
    presentRequired.forEach((key) => {
      success(`  ✓ ${key}`);
    });
    missingRequired.forEach((key) => {
      error(`  ✗ ${key} (MISSING)`);
    });
  }

  // Show optional keys status
  if (optionalKeys.length > 0) {
    info('\nOptional keys:');
    presentOptional.forEach((key) => {
      success(`  ✓ ${key}`);
    });
    missingOptional.forEach((key) => {
      warn(`  ! ${key} (missing)`);
    });
  }

  // 6. Summary and exit code
  info('');
  if (missingRequired.length > 0) {
    error(
      `Validation failed: ${missingRequired.length} required secret(s) missing`
    );
    info('\nRun "localkeys set <KEY> <value>" to store missing secrets.');
    process.exit(1);
  } else if (missingOptional.length > 0) {
    warn(
      `Validation passed with warnings: ${missingOptional.length} optional secret(s) missing`
    );
    success(`All ${requiredKeys.length} required secret(s) present`);
  } else {
    success(
      `Validation passed: All ${requiredKeys.length + optionalKeys.length} secret(s) present`
    );
  }
}
