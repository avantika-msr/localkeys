#!/usr/bin/env node

import chalk from 'chalk';
import { program } from 'commander';

import { SystemKeychain } from './core/index.js';

const version = '0.1.0';

// Set up the main program
program
  .name('localkeys')
  .description('Local-first secret management for developers')
  .version(version)
  .option('-v, --verbose', 'Enable verbose logging')
  .hook('preAction', (thisCommand) => {
    const options: { verbose?: boolean } = thisCommand.opts();
    if (options.verbose) {
      console.info(
        chalk.dim(
          `[LocalKeys v${version}] Running command: ${thisCommand.name()}`
        )
      );
    }
  });

// Placeholder commands that will be implemented
program
  .command('init')
  .description('Initialize LocalKeys in the current directory')
  .action(() => {
    console.info(chalk.blue('🔒 Initializing LocalKeys...'));
    console.warn(chalk.yellow('⚠️  This command is not yet implemented'));
    console.info(
      chalk.dim('See the implementation guide for development progress')
    );
  });

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
      if (options.verbose) {
        console.info(chalk.dim('[Verbose] options:'), options);
      }

      if (pkg == undefined) {
        console.error(
          chalk.red('[Error] Package name is required to set a secret.')
        );
        process.exit(1);
      }

      const keyChain = new SystemKeychain(pkg);
      keyChain
        .set(key, value)
        .then(() => {
          if (options.verbose) {
            console.info(
              chalk.green(
                `[Verbose] Successfully stored secret for key: ${key}`
              )
            );
          }
        })
        .catch((err) => {
          console.error(chalk.red('[Error] Failed to store secret:'), err);
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
      if (options.verbose) {
        console.info(chalk.dim('[Verbose] options:'), options);
      }
      // Validate package name
      if (pkg == undefined) {
        // package name is required
        console.error(
          chalk.red('[Error] Package name is required to get a secret.')
        );
        process.exit(1);
      }
      if (options.verbose) {
        console.info(chalk.blue(`[Verbose] Getting secret for key: ${key}`));
      }
      // Initialize SystemKeychain
      const keyChain = new SystemKeychain(pkg);
      // Retrieve the secret
      keyChain
        .get(key)
        .then((key) => {
          // Log the retrieved secret or fallback
          if (key !== null) {
            if (options.verbose) {
              console.info(
                chalk.green(`[Verbose] Retrieved secret for key: ${key}`)
              );
            }
            console.info(chalk.dim(`${key}`));
          }
          // Handle missing secret with default fallback
          else if (options.defaultFallback !== undefined) {
            if (options.verbose) {
              console.info(
                chalk.yellow(
                  `[Verbose] Secret for key "${key}" not found. Using default fallback value.`
                )
              );
            }
            console.info(chalk.dim(`${options.defaultFallback}`));
          }
          // No secret and no fallback
          else {
            if (options.verbose) {
              console.warn(
                chalk.yellow(
                  `[Verbose] Secret for key "${key}" not found and no default fallback provided.`
                )
              );
            }
          }
        })
        .catch((err) => {
          console.error(chalk.red('[Error] Failed to retrieve secret:'), err);
        });
    }
  );

program
  .command('list')
  .description('List all stored secrets (keys only)')
  .action(() => {
    console.info(chalk.blue('📋 Listing stored secrets...'));
    console.warn(chalk.yellow('⚠️  This command is not yet implemented'));
  });

program
  .command('status')
  .description('Show current LocalKeys status and configuration')
  .action(() => {
    console.info(chalk.blue('📊 LocalKeys Status'));
    console.info(chalk.green(`✅ Version: ${version}`));
    console.info(chalk.green(`✅ Node.js: ${process.version}`));
    console.info(
      chalk.green(`✅ Platform: ${process.platform} ${process.arch}`)
    );
    console.warn(chalk.yellow('⚠️  Full functionality coming soon'));

    // Show development status
    console.info(chalk.dim('\n📋 Implementation Progress:'));
    console.info(chalk.dim('  🚧 Keychain integration (in progress)'));
    console.info(chalk.dim('  ⏳ CLI commands'));
    console.info(chalk.dim('  ⏳ Config validation'));
    console.info(chalk.dim('  ⏳ Runtime runners'));
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
