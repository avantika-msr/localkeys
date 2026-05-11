/**
 * @module @localkeys/cli/security
 * @file maskSecret.ts
 * @description Pure utilities for masking secret values before display.
 *
 * Design principle: secrets are NEVER printed in full unless the caller
 * explicitly opts in.  All functions here are side-effect-free.
 */

/** Number of characters shown at the start/end in a partial-reveal mask. */
const REVEAL_CHARS = 4;

/** Minimum secret length that qualifies for partial-reveal. */
const PARTIAL_REVEAL_MIN_LENGTH = 12;

/**
 * Fully masks a secret value — shows nothing of the original.
 */
export function fullMask(value: string): string {
  return '*'.repeat(Math.min(value.length, 8));
}

/**
 * Partially reveals the start and end of the secret.
 *
 * For short values (< 12 chars), falls back to full mask.
 * For longer values, reveals the first 4 and last 4 characters.
 */
export function partialMask(value: string): string {
  if (value.length < PARTIAL_REVEAL_MIN_LENGTH) {
    return fullMask(value);
  }

  const head = value.slice(0, REVEAL_CHARS);
  const tail = value.slice(-REVEAL_CHARS);
  const stars = '*'.repeat(Math.max(4, value.length - REVEAL_CHARS * 2));

  return `${head}${stars}${tail}`;
}

/**
 * Returns the masked representation of a secret for CLI display.
 *
 * Formats as `KEY=<masked>` which mirrors shell variable syntax and makes
 * the output obviously non-evaluatable.
 *
 * @param key   - The variable name (e.g. `API_KEY`)
 * @param value - The raw secret value
 */
export function formatMasked(key: string, value: string): string {
  return `${key}=${partialMask(value)}`;
}

/**
 * Returns the full (unmasked) representation of a secret for CLI display.
 * This should only be called after explicit user confirmation.
 *
 * @param key   - The variable name
 * @param value - The raw secret value
 */
export function formatRevealed(key: string, value: string): string {
  return `${key}=${value}`;
}
