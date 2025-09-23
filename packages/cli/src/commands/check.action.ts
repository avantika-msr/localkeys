/**
 * @module @localkeys/cli/commands
 * @file check.action.ts
 * @description Implementation of the check command
 */

import fs from 'fs/promises';
import path from 'path';
import { SystemKeychain } from '@localkeys/core';
import { ConfigManager } from '@localkeys/core';
import { ManifestManager } from '@localkeys/core';
import { error, success, verbose, warn, info, LogTag } from '../utils/logger';

interface SecurityIssue {
  type: 'error' | 'warning';
  message: string;
}

interface SecurityResults {
  errors: SecurityIssue[];
  warnings: SecurityIssue[];
}

async function performSecurityChecks(): Promise<SecurityResults> {
  const results: SecurityResults = { errors: [], warnings: [] };
  const cwd = process.cwd();

  // Check for .env files
  const envFiles = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    '.env.staging',
    '.env.test',
  ];

  for (const file of envFiles) {
    try {
      await fs.access(path.join(cwd, file));
      if (file === '.env') {
        results.errors.push({
          type: 'error',
          message: `.env file exists (insecure)`,
        });
      } else {
        results.warnings.push({
          type: 'warning',
          message: `${file} file exists`,
        });
      }
    } catch {
      // File doesn't exist, that's good
    }
  }

  // Check .gitignore
  try {
    const gitignore = await fs.readFile(path.join(cwd, '.gitignore'), 'utf-8');
    if (!gitignore.includes('.env')) {
      results.errors.push({ type: 'error', message: `.env not in .gitignore` });
    }
    if (!gitignore.includes('.localkeys/')) {
      results.warnings.push({
        type: 'warning',
        message: `.localkeys/ not in .gitignore`,
      });
    }
  } catch {
    results.warnings.push({ type: 'warning', message: `.gitignore not found` });
  }

  return results;
}

function displaySecurityResults(results: SecurityResults): void {
  if (results.errors.length === 0 && results.warnings.length === 0) {
    success('✓ No security issues found');
    return;
  }

  results.errors.forEach((issue) => {
    error(`✗ ${issue.message}`);
  });

  results.warnings.forEach((issue) => {
    warn(`! ${issue.message}`);
  });
}

/**
 * Options for check command
 */
export interface CheckOptions {
  verbose?: boolean;
  secrets?: boolean;
  security?: boolean;
}

/**
 * Check command action
 * Checks secrets and security issues
 *
 * @param options - Command options
 */
export async function checkAction(options: CheckOptions): Promise<void> {
  const configManager = new ConfigManager();
  const manifestManager = new ManifestManager();

  verbose(options.verbose === true, LogTag.LOG, 'options:', options);

  // 1. Check if LocalKeys is initialized
  const config = await configManager.load();
  if (!config) {
    error('LocalKeys not initialized. Run "lkeys init" first.');
    process.exit(1);
  }

  const packageName = config.getPackage();
  const checkSecrets = options.secrets || !options.security;
  const checkSecurity = options.security || !options.secrets;

  verbose(
    options.verbose === true,
    LogTag.LOG,
    `Checking package: ${packageName}`
  );

  info('\nLocalKeys Security Check\n');

  let hasErrors = false;

  // Security checks
  if (checkSecurity) {
    const securityIssues = await performSecurityChecks();
    if (securityIssues.errors.length > 0) hasErrors = true;
    displaySecurityResults(securityIssues);
  }

  // Secrets check
  if (!checkSecrets) {
    process.exit(hasErrors ? 1 : 0);
  }

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
    info('\nRun "lkeys set <KEY> <value>" to store missing secrets.');
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
