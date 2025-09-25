/**
 * @module @localkeys/node/testing
 * @description Test helper functions
 */

import { reset } from '../loader';

/**
 * Run callback with temporary environment variables
 *
 * @param vars - Environment variables to set
 * @param callback - Function to run
 */
export async function withEnvVars(
  vars: Record<string, string>,
  callback: () => void | Promise<void>
): Promise<void> {
  const originalVars: Record<string, string | undefined> = {};

  try {
    // Set temporary vars
    for (const [key, value] of Object.entries(vars)) {
      originalVars[key] = process.env[key];
      process.env[key] = value;
    }

    // Run callback
    await callback();
  } finally {
    // Restore original vars
    for (const [key, originalValue] of Object.entries(originalVars)) {
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
  }
}

/**
 * Run callback with clean environment
 */
export async function withCleanEnv(
  callback: () => void | Promise<void>
): Promise<void> {
  const originalEnv = { ...process.env };

  try {
    // Clear process.env
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }

    await callback();
  } finally {
    // Restore
    process.env = originalEnv;
  }
}

/**
 * Run callback with LocalKeys reset before and after
 */
export async function withReset(
  callback: () => void | Promise<void>
): Promise<void> {
  reset({ cleanEnv: true });

  try {
    await callback();
  } finally {
    reset({ cleanEnv: true });
  }
}
