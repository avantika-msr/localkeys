/**
 * @module @localkeys/node/loader
 * @description Secret resolution from keychain
 */

import { SystemKeychain, IKeychainProvider } from '@localkeys/core';
import { logger } from '../utils/logger';
import { KeychainError } from '../utils/errors';

/**
 * Resolve secrets from keychain
 *
 * @param keychain - Keychain instance
 * @param keys - Keys to resolve
 * @param environment - Environment name
 * @returns Resolved secrets
 */
export async function resolveSecrets(
  keychain: IKeychainProvider,
  keys: string[],
  environment: string
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};
  const errors: Array<{ key: string; error: Error }> = [];

  logger.debug(
    `Resolving ${keys.length} secrets for environment: ${environment}`
  );

  // Resolve each secret
  for (const key of keys) {
    try {
      // Try to get from keychain with environment namespace
      const value = await keychain.get(key);

      if (value !== null) {
        resolved[key] = value;
        logger.debug(`Resolved secret: ${key}`);
      } else {
        logger.debug(`Secret not found: ${key}`);
      }
    } catch (error) {
      logger.error(`Failed to resolve secret "${key}":`, error);
      errors.push({
        key,
        error: error as Error,
      });
    }
  }

  // If any errors occurred, throw
  if (errors.length > 0) {
    const errorMessage = errors
      .map((e) => `${e.key}: ${e.error.message}`)
      .join(', ');
    throw new KeychainError(
      `Failed to resolve ${errors.length} secret(s): ${errorMessage}`
    );
  }

  logger.debug(`Successfully resolved ${Object.keys(resolved).length} secrets`);

  return resolved;
}

/**
 * Create keychain instance from options
 */
export function createKeychain(
  packageName: string,
  projectRoot: string,
  environment: string,
  customKeychain?: IKeychainProvider
): IKeychainProvider {
  if (customKeychain) {
    logger.debug('Using custom keychain instance');
    return customKeychain;
  }

  logger.debug(`Creating SystemKeychain for package: ${packageName}`);
  return new SystemKeychain(packageName, projectRoot, environment);
}
