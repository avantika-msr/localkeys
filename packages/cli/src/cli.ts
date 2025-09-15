#!/usr/bin/env node

import { program } from 'commander';
import { initAction } from './commands/init.action';
import { setAction } from './commands/set.action';
import { getAction } from './commands/get.action';
import { delAction } from './commands/del.action';
import { listAction } from './commands/list.action';
import { validateAction } from './commands/validate.action';
import { info, LogTag, verbose, warn } from './utils/logger';

const version = '0.1.0';

// Set up the main program
program
  .name('localkeys')
  .description('Local-first secret management for developers')
  .version(version)
  .option('-v, --verbose', 'Enable verbose logging')
  .hook('preAction', (thisCommand) => {
    const options: { verbose?: boolean } = thisCommand.opts();
    verbose(
      options.verbose === true,
      LogTag.LOG,
      `[LocalKeys v${version}] Running command: ${thisCommand.name()}`
    );
  });

// Init command
program
  .command('init')
  .description('Initialize LocalKeys in the current directory')
  .option(
    '-t, --template <path>',
    'Path to template file (relative or absolute)'
  )
  .option('-p, --package <name>', 'Package name (skips auto-detection)')
  .option('-f, --force', 'Reinitialize if already initialized')
  .action(async (options) => {
    await initAction(options);
  });

/**
 * Store a secret in the OS keychain
 * @command set <key> <value>
 * @param key - The key of the secret to store
 * @param value - The value of the secret to store
 * @option -v, --verbose - Enable verbose logging
 * @option -o, --optional - Mark this secret as optional (default: required)
 * @example
 * ```bash
 * localkeys set API_KEY abc123 --verbose
 * localkeys set OPTIONAL_KEY value --optional
 * ```
 * @remarks
 * This command stores a secret in the OS keychain using the package name from config.
 * By default, secrets are marked as required. Use --optional to mark them as optional.
 *
 * @see {@link SystemKeychain} for the underlying keychain implementation.
 */
program
  .command('set <key> <value>')
  .description('Store a secret in the OS keychain')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option(
    '-o, --optional',
    'Mark this secret as optional (default: required)',
    false
  )
  .action(
    async (
      key: string,
      value: string,
      options: { verbose?: boolean; optional?: boolean }
    ) => {
      await setAction(key, value, options);
    }
  );

/**
 * Retrieve a secret from the OS keychain
 * @command get <key>
 * @param key - The key of the secret to retrieve
 * @option -v, --verbose - Enable verbose logging
 * @option -df, --defaultFallback <value> - Default value if secret not found
 * @example
 * ```bash
 * localkeys get API_KEY --verbose --defaultFallback "default_value"
 * ```
 * @remarks
 * This command retrieves a secret stored in the OS keychain using the package name from config.
 * If the secret is not found, it can return a default fallback value if provided.
 *
 * @see {@link SystemKeychain} for the underlying keychain implementation.
 */
program
  .command('get <key>')
  .description('Retrieve a secret from the OS keychain')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('-df, --defaultFallback <value>', 'Default value if secret not found')
  .action(
    async (
      key: string,
      options: { verbose?: boolean; defaultFallback?: unknown }
    ) => {
      await getAction(key, options);
    }
  );

program
  .command('del <key>')
  .description('Delete a secret from the OS keychain')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (key: string, options: { verbose?: boolean }) => {
    await delAction(key, options);
  });

program
  .command('list')
  .description('List all stored secrets (keys only)')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options: { verbose: boolean }) => {
    await listAction(options);
  });

program
  .command('validate')
  .description('Validate that all required secrets are present')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options: { verbose?: boolean }) => {
    await validateAction(options);
  });

program
  .command('status')
  .description('Show current LocalKeys status and configuration')
  .action(() => {
    info('LocalKeys Status');
    info(`Version: ${version}`);
    info(`Node.js: ${process.version}`);
    info(`Platform: ${process.platform} ${process.arch}`);
    warn('Full functionality coming soon.');

    info('');
    info('Implementation Progress:');
    info('  • Keychain integration (in progress)');
    info('  • CLI commands');
    info('  • Config validation');
    info('  • Runtime runners');
  });

// Add help examples
program.addHelpText(
  'after',
  `
Examples:
  $ localkeys status              Show current status
  $ localkeys init                Initialize in current directory
  $ localkeys set API_KEY abc123  Store a secret (when implemented)
  $ localkeys get API_KEY         Retrieve a secret (when implemented)
  $ localkeys list                List all secrets (when implemented)

Development:
  This is a development build. See .plan/implementation-guidebook.md
  for the full implementation roadmap and current progress.
`
);

// Parse CLI arguments
program.parse(process.argv);

// Show help if no arguments provided
if (process.argv.slice(2).length === 0) {
  program.outputHelp();
}
