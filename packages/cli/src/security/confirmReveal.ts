/**
 * @module @localkeys/cli/security
 * @file confirmReveal.ts
 * @description Guards for the --reveal flag: interactive confirmation,
 * non-TTY safety, and stderr security warnings.
 *
 * Security model:
 *  • By default, `get` is masked. Revealing requires --reveal.
 *  • Interactive TTY → prompt user to confirm.
 *  • Non-TTY (CI, pipes) → require --force to prevent accidental log leakage.
 *  • --yes bypasses the interactive prompt (scripting convenience).
 *  • Any reveal always prints a stderr warning regardless of bypass flags.
 */

import inquirer from 'inquirer';

/** Text emitted to stderr whenever a full secret is printed to stdout. */
export const REVEAL_STDERR_WARNING =
  '[localkeys] Warning: printing secrets to stdout may expose them in logs/history.';

/**
 * Checks whether the current stdout is a real interactive terminal.
 */
export function isStdoutTty(): boolean {
  return process.stdout.isTTY === true;
}

/**
 * Emits the security warning to **stderr**.
 */
export function emitRevealWarning(): void {
  process.stderr.write(`${REVEAL_STDERR_WARNING}\n`);
}

/**
 * Prompts the user interactively using inquirer.
 */
export async function promptConfirm(message: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `${message}\nContinue?`,
      default: false,
    },
  ]);
  return confirmed;
}

/** Options passed to {@link guardReveal}. */
export interface RevealGuardOptions {
  /** User provided --yes to skip interactive confirmation. */
  yes: boolean;
  /** User provided --force to allow reveal in non-TTY environments. */
  force: boolean;
}

/**
 * Central gate that enforces all security checks before a secret is revealed.
 *
 * Call this **before** printing the full secret value.  It will:
 *  1. Reject non-TTY stdout without `--force`.
 *  2. Prompt for confirmation unless `--yes` is set.
 *  3. Emit a stderr warning on every approved reveal.
 *
 * @returns `true`  if the reveal is approved and the caller may proceed.
 * @returns `false` if the user rejected the confirmation prompt.
 *
 * @throws Never — callers handle `process.exit` themselves so the action
 * can be unit-tested cleanly.
 */
export async function guardReveal(
  key: string,
  opts: RevealGuardOptions,
  deps: {
    isStdoutTty: () => boolean;
    promptConfirm: (msg: string) => Promise<boolean>;
    emitRevealWarning: () => void;
  } = { isStdoutTty, promptConfirm, emitRevealWarning }
): Promise<boolean> {
  // --- Non-TTY safety check ---
  if (!deps.isStdoutTty() && !opts.force) {
    process.stderr.write(
      `[localkeys] Error: stdout is not a TTY. Use --force to reveal secrets in non-interactive environments.\n` +
        `  Example: lkeys get ${key} --reveal --force\n`
    );
    return false;
  }

  // --- Interactive confirmation (skippable with --yes) ---
  if (!opts.yes) {
    const confirmed = await deps.promptConfirm(
      'Warning: This will print the full secret to stdout.\nContinue?'
    );
    if (!confirmed) {
      return false;
    }
  }

  // --- Always warn on stderr after approval ---
  deps.emitRevealWarning();

  return true;
}
