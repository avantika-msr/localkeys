#!/usr/bin/env node

import chalk from 'chalk';
import { program } from 'commander';
import { SystemKeychain } from './core';
import { error, info, LogTag, verbose, warn } from './utils';

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

// Placeholder commands that will be implemented
program
  .command('init')
  .description('Initialize LocalKeys in the current directory')
  .action(() => {
    info(chalk.blue('Initializing LocalKeys...'));
    warn(chalk.yellow('This command is not yet implemented'));
    info(chalk.dim('See the implementation guide for development progress'));
  });

/**
 * Store a secret in the OS keychain
 * @command set <pkg> <key> <value>
 * @param pkg - The package name associated with the secret
 * @param key - The key of the secret to store
 * @param value - The value of the secret to store
 * @option -v, --verbose - Enable verbose logging
 * @example
 * ```bash
 * localkeys set my-package API_KEY abc123 --verbose
 * ```
 * @remarks
 * This command stores a secret in the OS keychain for the specified package and key.
 *
 * @see {@link SystemKeychain} for the underlying keychain implementation.
 */
program
  .command('set <pkg> <key> <value>')
  .description('Store a secret in the OS keychain')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(
    (
      pkg: string,
      key: string,
      value: string,
      options: { verbose: boolean }
    ) => {
      verbose(options.verbose, LogTag.LOG, chalk.dim('Options: '), options);

      if (pkg == undefined) {
        error('Package name is required to set a secret.');
        process.exit(1);
      }

      const keyChain = new SystemKeychain(pkg);
      keyChain
        .set(key, value)
        .then(() => {
          verbose(
            options.verbose,
            LogTag.SUCCESS,
            `Stored secret for key: ${key}`
          );
        })
        .catch((err) => {
          error('Failed to store secret:', err);
        });
    }
  );

/**
 * Retrieve a secret from the OS keychain
 * @command get <pkg> <key>
 * @param pkg - The package name associated with the secret
 * @param key - The key of the secret to retrieve
 * @option -v, --verbose - Enable verbose logging
 * @option -df, --defaultFallback <value> - Default value if secret not found
 * @example
 * ```bash
 * localkeys get my-package API_KEY --verbose --defaultFallback "default_value"
 * ```
 * @remarks
 * This command retrieves a secret stored in the OS keychain for the specified package and key.
 * If the secret is not found, it can return a default fallback value if provided.
 *
 * @see {@link SystemKeychain} for the underlying keychain implementation.
 */
program
  .command('get <pkg> <key>')
  .description('Retrieve a secret from the OS keychain')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('-df, --defaultFallback <value>', 'Default value if secret not found')
  .action(
    (
      pkg: string,
      key: string,
      options: { verbose: boolean; defaultFallback?: unknown }
    ) => {
      // Verbose logging
      verbose(options.verbose, LogTag.LOG, 'options:', options);
      // Validate package name
      if (pkg == undefined) {
        // package name is required
        error('Package name is required to get a secret.');
        process.exit(1);
      }
      verbose(options.verbose, LogTag.LOG, `Getting secret for key: ${key}`);
      // Initialize SystemKeychain
      const keyChain = new SystemKeychain(pkg);
      // Retrieve the secret
      keyChain
        .get(key)
        .then((key) => {
          // Log the retrieved secret or fallback
          if (key !== null) {
            verbose(
              options.verbose,
              LogTag.SUCCESS,
              `Retrieved secret for key: ${key}`
            );
            info(chalk.dim(`${key}`));
          }
          // Handle missing secret with default fallback
          else if (options.defaultFallback !== undefined) {
            verbose(
              options.verbose,
              LogTag.WARN,
              `Secret for key "${key}" not found. Using default fallback value.`
            );
            info(chalk.dim(`${options.defaultFallback}`));
          }
          // No secret and no fallback
          else {
            verbose(
              options.verbose,
              LogTag.WARN,
              `Secret for key "${key}" not found and no default fallback provided.`
            );
          }
        })
        .catch((err) => {
          error('Failed to retrieve secret:', err);
        });
    }
  );

program
  .command('list')
  .description('List all stored secrets (keys only)')
  .action(() => {
    info(chalk.blue('📋 Listing stored secrets...'));
    warn(chalk.yellow('⚠️  This command is not yet implemented'));
  });

program
  .command('status')
  .description('Show current LocalKeys status and configuration')
  .action(() => {
    info(chalk.blue('📊 LocalKeys Status'));
    info(chalk.green(`✅ Version: ${version}`));
    info(chalk.green(`✅ Node.js: ${process.version}`));
    info(chalk.green(`✅ Platform: ${process.platform} ${process.arch}`));
    warn(chalk.yellow('⚠️  Full functionality coming soon'));

    // Show development status
    info(chalk.dim('\n📋 Implementation Progress:'));
    info(chalk.dim('  🚧 Keychain integration (in progress)'));
    info(chalk.dim('  ⏳ CLI commands'));
    info(chalk.dim('  ⏳ Config validation'));
    info(chalk.dim('  ⏳ Runtime runners'));
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
