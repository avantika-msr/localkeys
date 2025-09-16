/**
 * @module @localkeys/cli/commands
 * @file migrate.action.ts
 * @description Migrate from .env files to LocalKeys
 */

import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { SystemKeychain } from '../core';
import { ConfigManager } from '../core/config/config.manager';
import { error, success, verbose, warn, info, LogTag } from '../utils/logger';

export interface MigrateOptions {
  verbose?: boolean;
  auto?: boolean;
  keepFiles?: boolean;
  from?: string;
}

interface EnvFile {
  path: string;
  environment: string;
  secrets: Map<string, string>;
}

async function parseEnvFile(filePath: string): Promise<Map<string, string>> {
  const content = await fs.readFile(filePath, 'utf-8');
  const secrets = new Map<string, string>();

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match && match[1] && match[2] !== undefined) {
      secrets.set(match[1].trim(), match[2].trim());
    }
  });

  return secrets;
}

function inferEnvironment(fileName: string): string {
  if (fileName === '.env') return 'development';
  if (fileName.includes('.production')) return 'production';
  if (fileName.includes('.staging')) return 'staging';
  if (fileName.includes('.test')) return 'test';
  if (fileName.includes('.development')) return 'development';
  if (fileName.includes('.local')) return 'development';
  return 'development';
}

export async function migrateAction(options: MigrateOptions): Promise<void> {
  const configManager = new ConfigManager();

  verbose(options.verbose === true, LogTag.LOG, 'options:', options);

  info('\nLocalKeys Migration Tool\n');

  // Check if already initialized
  const config = await configManager.load();
  if (!config) {
    error('LocalKeys not initialized. Run "lkeys init" first.');
    process.exit(1);
  }

  const packageName = config.getPackage();
  const defaultEnvironment = config.getDefaultEnvironment();

  // Find .env files
  const envFiles: EnvFile[] = [];
  const filesToCheck = options.from
    ? [options.from]
    : [
        '.env',
        '.env.local',
        '.env.development',
        '.env.production',
        '.env.staging',
        '.env.test',
      ];

  for (const fileName of filesToCheck) {
    const filePath = path.join(process.cwd(), fileName);
    try {
      await fs.access(filePath);
      const secrets = await parseEnvFile(filePath);
      if (secrets.size > 0) {
        envFiles.push({
          path: fileName,
          environment: inferEnvironment(fileName),
          secrets,
        });
      }
    } catch {
      // File doesn't exist
    }
  }

  if (envFiles.length === 0) {
    warn('No .env files found to migrate');
    info('Looking for: ' + filesToCheck.join(', '));
    process.exit(0);
  }

  // Show migration plan
  info('Found .env files:\n');
  let totalSecrets = 0;
  envFiles.forEach((file) => {
    info(
      `  ${file.path} → ${file.environment} environment (${file.secrets.size} secrets)`
    );
    totalSecrets += file.secrets.size;
  });

  info(
    `\nTotal: ${totalSecrets} secret(s) across ${envFiles.length} file(s)\n`
  );

  info('Migration plan:');
  info('  1. Read secrets from .env files');
  info('  2. Store in OS keychain');
  info('  3. Update .gitignore');
  info('  4. Create .env.template');
  if (!options.keepFiles) {
    info('  5. Delete .env files');
  }

  // Confirm
  if (!options.auto) {
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Proceed with migration?',
        default: false,
      },
    ]);

    if (!proceed) {
      info('Migration cancelled');
      process.exit(0);
    }
  }

  // Migrate
  const keychain = new SystemKeychain(
    packageName,
    process.cwd(),
    defaultEnvironment
  );

  for (const file of envFiles) {
    for (const [key, value] of file.secrets.entries()) {
      await keychain.set(key, value, true, file.environment);
      verbose(
        options.verbose === true,
        LogTag.SUCCESS,
        `Migrated ${key} → ${file.environment}`
      );
    }
    success(
      `✓ Migrated ${file.secrets.size} secrets from ${file.path} → ${file.environment}`
    );
  }

  // Update .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  try {
    let gitignore = await fs.readFile(gitignorePath, 'utf-8');
    let updated = false;

    if (!gitignore.includes('.env')) {
      gitignore += '\n.env\n.env.local\n.env.*.local\n';
      updated = true;
    }

    if (updated) {
      await fs.writeFile(gitignorePath, gitignore);
      success('✓ Updated .gitignore');
    }
  } catch {
    warn('! .gitignore not found');
  }

  // Create .env.template
  try {
    const templatePath = path.join(process.cwd(), '.env.template');
    const templateLines: string[] = ['# LocalKeys Environment Template', ''];

    const allKeys = new Set<string>();
    envFiles.forEach((file) => {
      file.secrets.forEach((_, key) => allKeys.add(key));
    });

    allKeys.forEach((key) => {
      templateLines.push(`${key}=`);
    });

    await fs.writeFile(templatePath, templateLines.join('\n'));
    success('✓ Created .env.template');
  } catch (err) {
    warn('! Failed to create .env.template');
  }

  // Delete files
  if (!options.keepFiles) {
    if (!options.auto) {
      const { deleteFiles } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'deleteFiles',
          message: '.env files still exist. Delete them?',
          default: true,
        },
      ]);

      if (!deleteFiles) {
        warn('\n⚠️  .env files NOT deleted - remember to delete manually!');
        return;
      }
    }

    for (const file of envFiles) {
      await fs.unlink(path.join(process.cwd(), file.path));
      success(`✓ Deleted ${file.path}`);
    }
  }

  success('\n✅ Migration complete! Your project is now secure.');
  info('\nNext steps:');
  info('  • Commit .env.template to git');
  info('  • Run "lkeys check" to verify setup');
  info('  • Share setup instructions with your team');
}
