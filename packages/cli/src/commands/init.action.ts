/**
 * @module @localkeys/cli/commands
 * @file init.action.ts
 * @description Implementation of the init command
 */

import fs from 'fs/promises';
import { ConfigManager } from '../core/config/config.manager';
import { TemplateFileFinder } from '../utils/template-finder';
import { error, info, success, warn } from '../utils/logger';

/**
 * Options for init command
 */
export interface InitOptions {
  template?: string; // Path to template file
  package?: string; // Package name
  force?: boolean; // Reinitialize
}

/**
 * Default template content
 */
const DEFAULT_TEMPLATE_CONTENT = `# Environment Variables Template
# Define your secrets here (do not commit actual values)
#
# Format: KEY=value
# Lines starting with # are comments

# Database connection string
DATABASE_URL=postgresql://localhost/mydb

# API keys
API_KEY=

# Optional configuration
PORT=3000
NODE_ENV=development
`;

/**
 * Create a default template file
 */
async function createDefaultTemplateFile(filename: string): Promise<void> {
  await fs.writeFile(filename, DEFAULT_TEMPLATE_CONTENT);
}

/**
 * Detect package name from package.json
 */
async function detectPackageName(): Promise<string> {
  try {
    const pkgJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    return pkgJson.name || 'my-app';
  } catch {
    return 'my-app';
  }
}

/**
 * Init command action
 *
 * @param options - Command options
 */
export async function initAction(options: InitOptions): Promise<void> {
  const configManager = new ConfigManager();
  const templateFinder = new TemplateFileFinder();

  // 1. Check if already initialized
  const existing = await configManager.load();
  if (existing && !options.force) {
    warn('LocalKeys already initialized in this project.');
    info(`  Package: ${existing.getPackage()}`);
    info(`  Template: ${existing.getTemplateFile()}`);
    info('\nUse --force to reinitialize.');
    return;
  }

  if (existing && options.force) {
    warn('Reinitializing LocalKeys configuration...\n');
  }

  // 2. Determine package name
  let packageName: string;

  if (options.package) {
    packageName = options.package;
    info(`Using package name: ${packageName}`);
  } else {
    packageName = await detectPackageName();
    info(`Auto-detected package name: ${packageName}`);
  }

  // 3. Determine template file
  let templateFile: string;

  if (options.template) {
    // Template path provided via flag - validate it
    info(`Validating template path: ${options.template}`);

    const validation = await templateFinder.validatePath(options.template);

    if (!validation.valid) {
      error(validation.error || 'Invalid template path');
      process.exit(1);
    }

    // Check if file is readable
    const isReadable = await templateFinder.isReadable(validation.resolved);
    if (!isReadable) {
      error(`Template file is not readable: ${options.template}`);
      process.exit(1);
    }

    templateFile = validation.relative;
    success(`Using template file: ${templateFile}`);
  } else {
    // Auto-detect template file
    const detected = await templateFinder.autoDetect();

    if (detected) {
      templateFile = detected;
      info(`Found existing template: ${templateFile}`);
    } else {
      // No template found, create default
      templateFile = '.env.template';
      info(`No template file found. Creating: ${templateFile}`);
      await createDefaultTemplateFile(templateFile);
      success(`Created ${templateFile}`);
    }
  }

  // 4. Create config
  await configManager.create(packageName, templateFile);

  // 5. Show success message
  success('\n✓ LocalKeys initialized successfully!');
  info(`  Config: .localkeys/config.json`);
  info(`  Package: ${packageName}`);
  info(`  Template: ${templateFile}`);

  // 6. Show next steps
  info('\nNext steps:');
  info(`  1. Edit ${templateFile} to define your secrets`);
  info('  2. Run: localkeys set <KEY> <value>');
  info('  3. Run: localkeys list');
  info(`  4. Commit .localkeys/ and ${templateFile} to git`);
}
