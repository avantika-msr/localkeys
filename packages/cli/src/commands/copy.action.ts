/**
 * @module @localkeys/cli/commands
 * @file copy.action.ts
 * @description Copy secrets between environments
 */

import inquirer from 'inquirer';
import { SystemKeychain } from '@localkeys/core';
import { ConfigManager } from '@localkeys/core';
import { ManifestManager } from '@localkeys/core';
import { error, success, verbose, info, LogTag, warn } from '../utils/logger';

export interface CopyOptions {
  verbose?: boolean;
  from: string;
  to: string;
  force?: boolean;
}

export async function copyAction(
  key: string | undefined,
  options: CopyOptions
): Promise<void> {
  const configManager = new ConfigManager();
  const manifestManager = new ManifestManager();

  verbose(options.verbose === true, LogTag.LOG, 'options:', options);

  const config = await configManager.load();
  if (!config) {
    error('LocalKeys not initialized. Run "lkeys init" first.');
    process.exit(1);
  }

  const packageName = config.getPackage();
  const defaultEnvironment = config.getDefaultEnvironment();
  const keychain = new SystemKeychain(
    packageName,
    process.cwd(),
    defaultEnvironment
  );

  if (key) {
    // Copy single key
    const value = await keychain.get(key, options.from);

    if (!value) {
      error(`Secret "${key}" not found in ${options.from} environment.`);
      process.exit(1);
    }

    // Check if exists in destination
    const existingValue = await keychain.get(key, options.to);
    if (existingValue && !options.force) {
      warn(`Secret "${key}" already exists in ${options.to}.`);
      const { shouldOverwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldOverwrite',
          message: 'Overwrite?',
          default: false,
        },
      ]);

      if (!shouldOverwrite) {
        info('Cancelled.');
        return;
      }
    }

    await keychain.set(key, value, true, options.to);
    success(`✓ Copied ${key}: ${options.from} → ${options.to}`);
    return;
  }

  // Copy all keys
  const allKeys = await manifestManager.listKeys(packageName);

  if (allKeys.length === 0) {
    error('No secrets found.');
    process.exit(1);
  }

  info(`\nCopying secrets: ${options.from} → ${options.to}\n`);

  let copied = 0;
  let skipped = 0;

  for (const key of allKeys) {
    const value = await keychain.get(key, options.from);

    if (!value) {
      verbose(
        options.verbose === true,
        LogTag.LOG,
        `Skipped ${key} (not set in ${options.from})`
      );
      skipped++;
      continue;
    }

    const existingValue = await keychain.get(key, options.to);
    if (existingValue && !options.force) {
      verbose(
        options.verbose === true,
        LogTag.LOG,
        `Skipped ${key} (already exists in ${options.to})`
      );
      skipped++;
      continue;
    }

    await keychain.set(key, value, true, options.to);
    verbose(
      options.verbose === true,
      LogTag.SUCCESS,
      `Copied ${key}: ${options.from} → ${options.to}`
    );
    copied++;
  }

  if (copied > 0) {
    success(`✓ Copied ${copied} secret(s): ${options.from} → ${options.to}`);
  }

  if (skipped > 0) {
    info(`  Skipped ${skipped} secret(s)`);
    info('  Tip: Use --force to overwrite existing secrets');
  }

  if (copied === 0 && skipped === 0) {
    warn('No secrets found to copy.');
  }
}
