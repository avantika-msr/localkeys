/**
 * @module @localkeys/cli/commands
 * @file get.action.ts
 * @description Implementation of the `lkeys get` command.
 *
 * Security model
 * --------------
 * Secrets are MASKED by default.  A full reveal requires:
 *   --reveal          flag to opt in
 *   --yes             OR interactive confirmation in a TTY
 *   --force           required when stdout is NOT a TTY (CI-safety)
 *
 * See {@link guardReveal} for the gate logic and {@link formatMasked} for the
 * masking strategy.
 */

import { SystemKeychain, ConfigManager } from '@localkeys/core';
import { error, log, verbose, warn, LogTag } from '../utils/logger';
import {
  formatMasked,
  formatRevealed,
  guardReveal,
  RevealGuardOptions,
} from '../security';

/** Options for the `get` command. */
export interface GetOptions {
  verbose?: boolean;
  defaultFallback?: string;
  env?: string;
  /** Print the full secret value instead of a masked representation. */
  reveal?: boolean;
  /** Skip the interactive confirmation prompt (for scripting). */
  yes?: boolean;
  /**
   * Allow reveal when stdout is not a TTY (e.g. piped in CI).
   * Requires --reveal to also be set.
   */
  force?: boolean;
}

/**
 * Get command action — retrieves a secret and prints it to stdout.
 *
 * @param key     - The manifest key of the secret to retrieve.
 * @param options - Parsed command-line options.
 * @param deps    - Injectable dependencies (for unit testing).
 */
export async function getAction(
  key: string,
  options: GetOptions,
  deps: {
    guardReveal: typeof guardReveal;
  } = { guardReveal }
): Promise<void> {
  const configManager = new ConfigManager();

  verbose(options.verbose === true, LogTag.LOG, 'options:', options);

  // 1. Verify initialisation
  const config = await configManager.load();
  if (!config) {
    error('LocalKeys not initialized. Run "lkeys init" first.');
    process.exit(1);
  }

  const packageName = config.getPackage();
  const defaultEnvironment = config.getDefaultEnvironment();
  const environment = options.env ?? defaultEnvironment;

  verbose(
    options.verbose === true,
    LogTag.LOG,
    `Getting secret for key: ${key} from package: ${packageName}`
  );
  verbose(
    options.verbose === true,
    LogTag.LOG,
    `Using environment: ${environment}`
  );

  // 2. Retrieve the raw value from the OS keychain
  const keychain = new SystemKeychain(
    packageName,
    process.cwd(),
    defaultEnvironment
  );

  let value: string | null;
  try {
    value = await keychain.get(key, options.env);
  } catch (err) {
    error('Failed to retrieve secret:', err);
    process.exit(1);
  }

  // 3. Resolve value (or fallback)
  const resolved = resolveValue(key, value, options);
  if (resolved === null) {
    // resolveValue already logged an appropriate warning
    process.exit(1);
  }

  // 4. Display — masked by default, revealed only after security gates pass
  if (options.reveal === true) {
    const guardOpts: RevealGuardOptions = {
      yes: options.yes === true,
      force: options.force === true,
    };

    const approved = await deps.guardReveal(key, guardOpts);
    if (!approved) {
      warn('Secret reveal cancelled.');
      process.exit(1);
    }

    log(formatRevealed(key, resolved));
  } else {
    log(formatMasked(key, resolved));
  }
}

/**
 * Resolves the final secret value, applying the default fallback when needed.
 *
 * @returns The resolved value string, or `null` when neither the secret nor a
 *          fallback is available (caller should exit).
 */
function resolveValue(
  key: string,
  value: string | null,
  options: Pick<GetOptions, 'verbose' | 'defaultFallback'>
): string | null {
  if (value !== null) {
    verbose(
      options.verbose === true,
      LogTag.SUCCESS,
      `Retrieved secret for key: ${key}`
    );
    return value;
  }

  if (options.defaultFallback !== undefined) {
    verbose(
      options.verbose === true,
      LogTag.WARN,
      `Secret for key "${key}" not found. Using default fallback value.`
    );
    return options.defaultFallback;
  }

  warn(`Secret for key "${key}" not found.`);
  verbose(
    options.verbose === true,
    LogTag.WARN,
    'No default fallback provided.'
  );
  return null;
}
