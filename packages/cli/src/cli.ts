#!/usr/bin/env node

import chalk from 'chalk';
import { program } from 'commander';

import { version } from './index.js';

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
  .command('set <key> <value>')
  .description('Store a secret in the OS keychain')
  .action((key: string, _value: string) => {
    console.info(chalk.blue(`🔐 Setting secret: ${key}`));
    console.warn(chalk.yellow('⚠️  This command is not yet implemented'));
    console.info(
      chalk.dim('Secret storage will use OS keychain when implemented')
    );
  });

program
  .command('get <key>')
  .description('Retrieve a secret from the OS keychain')
  .option('-j, --json', 'Output as JSON')
  .action((key: string, options: { json?: boolean }) => {
    console.info(chalk.blue(`🔍 Getting secret: ${key}`));
    if (options.json) {
      console.info(chalk.dim('Will output as JSON when implemented'));
    }
    console.warn(chalk.yellow('⚠️  This command is not yet implemented'));
  });

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
