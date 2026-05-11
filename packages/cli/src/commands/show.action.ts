/**
 * @module @localkeys/cli/commands
 * @file show.action.ts
 * @description Show secrets (with masking by default)
 */

import {
  SystemKeychain,
  ConfigManager,
  ManifestManager,
} from '@localkeys/core';
import { error, success, verbose, info, LogTag, warn } from '../utils/logger';
import { partialMask, guardReveal, RevealGuardOptions } from '../security';

export interface ShowOptions {
  verbose?: boolean;
  env?: string;
  reveal?: boolean;
  yes?: boolean;
  force?: boolean;
}

export async function showAction(
  key: string,
  options: ShowOptions = {}
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
  const environment = options.env || defaultEnvironment;
  const keychain = new SystemKeychain(
    packageName,
    process.cwd(),
    defaultEnvironment
  );

  // Security Gate for reveal
  if (options.reveal === true) {
    const guardOpts: RevealGuardOptions = {
      yes: options.yes === true,
      force: options.force === true,
    };

    const approved = await guardReveal(key, guardOpts);
    if (!approved) {
      warn('Secret reveal cancelled.');
      process.exit(1);
    }
  }

  // Show all secrets
  if (key === 'all' || key === '*') {
    const allKeys = await manifestManager.listKeys(packageName);
    const requiredKeys = await manifestManager.getRequiredKeys(packageName);

    if (allKeys.length === 0) {
      error('No secrets found.');
      info('Add secrets with: lkeys set KEY value');
      process.exit(1);
    }

    info(`\nSecrets in ${environment} environment:\n`);

    for (const k of allKeys) {
      const value = await keychain.get(k, options.env);
      const isRequired = requiredKeys.includes(k);
      const typeLabel = isRequired ? 'required' : 'optional';

      if (value) {
        const display = options.reveal ? value : partialMask(value);
        success(`  ${k} (${typeLabel}): ${display}`);
      } else {
        error(`  ${k} (${typeLabel}): <not set>`);
      }
    }

    if (!options.reveal) {
      info('\nTip: Use --reveal to see actual values');
    }
    return;
  }

  // Show specific secret
  const value = await keychain.get(key, options.env);

  if (!value) {
    error(`Secret "${key}" not found in ${environment} environment.`);
    info(`\nAdd it with: lkeys set ${key} <value>`);
    process.exit(1);
  }

  const display = options.reveal ? value : partialMask(value);
  info(`${key} (${environment}): ${display}`);

  if (!options.reveal) {
    info('\nTip: Use --reveal to see actual value');
  }
}
