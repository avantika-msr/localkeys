/**
 * @module @localkeys/node/loader
 * @description Secret injection into process.env
 */

import { logger } from '../utils/logger';

/**
 * Injection result
 */
export interface InjectionResult {
  injected: string[];
  skipped: string[];
  overridden: string[];
}

/**
 * Inject secrets into target object (typically process.env)
 *
 * @param secrets - Secrets to inject
 * @param target - Target object (default: process.env)
 * @param override - Whether to override existing values
 * @returns Injection result
 */
export function injectSecrets(
  secrets: Record<string, string>,
  target: Record<string, string | undefined> = process.env,
  override: boolean = false
): InjectionResult {
  const result: InjectionResult = {
    injected: [],
    skipped: [],
    overridden: [],
  };

  for (const [key, value] of Object.entries(secrets)) {
    const exists = key in target && target[key] !== undefined;

    if (exists && !override) {
      // Skip existing values
      logger.debug(`Skipping existing env var: ${key}`);
      result.skipped.push(key);
    } else {
      if (exists) {
        logger.debug(`Overriding env var: ${key}`);
        result.overridden.push(key);
      } else {
        logger.debug(`Injecting env var: ${key}`);
        result.injected.push(key);
      }

      target[key] = value;
    }
  }

  logger.debug(
    `Injection complete: ${result.injected.length} injected, ` +
      `${result.skipped.length} skipped, ${result.overridden.length} overridden`
  );

  return result;
}

/**
 * Remove injected secrets from target
 *
 * @param keys - Keys to remove
 * @param target - Target object
 */
export function removeInjectedSecrets(
  keys: string[],
  target: Record<string, string | undefined> = process.env
): void {
  for (const key of keys) {
    delete target[key];
  }

  logger.debug(`Removed ${keys.length} secrets from environment`);
}
