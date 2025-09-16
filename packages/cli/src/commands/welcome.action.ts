import { program } from 'commander';

/**
 * Welcome Action
 * @command
 * @description Display a welcome message for LocalKeys CLI
 * @example
 * ```bash
 * localkeys
 * ```
 * @remarks
 * This command displays a welcome message and brief information about the LocalKeys CLI.
 *
 */
export function welcomeAction() {
  return program
    .command('')
    .description('Display a welcome message for LocalKeys CLI')
    .action(() => {
      console.log('Welcome to LocalKeys CLI!');
      console.log('Your secure environment variable manager.');
      console.log('Use --help to see available commands.');
    });
}
