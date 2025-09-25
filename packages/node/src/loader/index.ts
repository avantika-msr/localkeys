/**
 * @module @localkeys/node/loader
 * @description Main loader orchestration
 */

import { ConfigManager, ManifestManager } from '@localkeys/core';
import { LoadOptions, LoadResult } from '../types';
import { DEFAULT_LOAD_OPTIONS } from '../config/defaults';
import { detectEnvironment } from '../config/environment';
import { logger } from '../utils/logger';
import { NotInitializedError, ValidationError } from '../utils/errors';
import { parseTemplate } from '../utils/parser';
import { createKeychain, resolveSecrets } from './resolver';
import { validateSecrets, validateAgainstManifest } from './validator';
import { injectSecrets } from './injector';

// Track loaded secrets for reset functionality
const loadedKeys: string[] = [];

/**
 * Main loader function
 *
 * @param options - Load options
 * @returns Load result
 */
export async function load(options: LoadOptions = {}): Promise<LoadResult> {
  // Merge with defaults
  const opts = { ...DEFAULT_LOAD_OPTIONS, ...options };

  // Enable debug logging if requested
  if (opts.debug) {
    logger.enable();
  }

  logger.debug('Starting secret load process');
  logger.debug('Options:', opts);

  try {
    // 1. Detect environment
    const environment = opts.environment || detectEnvironment();
    logger.debug(`Environment: ${environment}`);

    // 2. Load project configuration
    const configManager = new ConfigManager(opts.projectRoot);
    const config = await configManager.load();

    if (!config) {
      throw new NotInitializedError();
    }

    const packageName = opts.packageName || config.getPackage();
    logger.debug(`Package: ${packageName}`);

    // 3. Get list of keys from manifest
    const manifestManager = new ManifestManager(opts.projectRoot);
    const allKeys = await manifestManager.listKeys(packageName);
    logger.debug(`Found ${allKeys.length} keys in manifest`);

    if (allKeys.length === 0) {
      logger.warn('No secrets found in manifest. Did you run "localkeys set"?');
      return {
        success: true,
        loaded: {},
        errors: [],
        count: 0,
      };
    }

    // 4. Create keychain and resolve secrets
    const keychain = createKeychain(
      packageName,
      opts.projectRoot!,
      environment,
      opts.keychain
    );
    const secrets = await resolveSecrets(keychain, allKeys, environment);

    // 5. Validate if requested
    let validationResult: {
      valid: boolean;
      errors: Array<{ key: string; message: string; required: boolean }>;
      missing: string[];
      present: string[];
    } = { valid: true, errors: [], missing: [], present: [] };

    if (opts.validate) {
      logger.debug('Validating secrets');

      // Try to load and validate against template
      const templatePath =
        opts.templatePath ||
        (await configManager.getTemplateFilePath().catch(() => null));

      if (templatePath) {
        const template = await parseTemplate(templatePath);
        validationResult = validateSecrets(secrets, template);
      } else {
        // Fallback to manifest validation
        const requiredKeys = await manifestManager.getRequiredKeys(packageName);
        validationResult = validateAgainstManifest(secrets, requiredKeys);
      }

      if (!validationResult.valid) {
        logger.error('Validation failed');
        logger.error(
          `Missing ${validationResult.missing.length} required secrets`
        );

        throw new ValidationError(
          `Missing ${validationResult.missing.length} required secret(s): ${validationResult.missing.join(', ')}`,
          validationResult.errors
        );
      }
    }

    // 6. Inject into process.env
    const injectionResult = injectSecrets(
      secrets,
      opts.processEnv,
      opts.override
    );

    // Track loaded keys for reset
    loadedKeys.push(...injectionResult.injected, ...injectionResult.overridden);

    logger.debug('Secret load complete');

    return {
      success: true,
      loaded: secrets,
      errors: [],
      count: Object.keys(secrets).length,
    };
  } catch (error) {
    logger.error('Failed to load secrets:', error);

    // Re-throw known errors
    if (
      error instanceof NotInitializedError ||
      error instanceof ValidationError
    ) {
      throw error;
    }

    // Wrap unknown errors
    throw new Error(`Failed to load secrets: ${(error as Error).message}`, {
      cause: error,
    });
  }
}

/**
 * Get secrets without injecting into process.env
 */
export async function populate(
  options: Omit<LoadOptions, 'processEnv'> = {}
): Promise<Record<string, string>> {
  const result = await load({
    ...options,
    processEnv: {}, // Use empty object instead of process.env
  });

  return result.loaded;
}

/**
 * Reset state and optionally clean process.env
 */
export function reset(options: { cleanEnv?: boolean } = {}): void {
  logger.debug('Resetting LocalKeys state');

  if (options.cleanEnv && loadedKeys.length > 0) {
    logger.debug(`Removing ${loadedKeys.length} secrets from process.env`);

    for (const key of loadedKeys) {
      delete process.env[key];
    }

    loadedKeys.length = 0; // Clear array
  }

  logger.debug('Reset complete');
}

/**
 * Get list of loaded keys
 */
export function getLoadedKeys(): readonly string[] {
  return [...loadedKeys];
}
