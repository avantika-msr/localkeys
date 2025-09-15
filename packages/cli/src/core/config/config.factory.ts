/**
 * @module @localkeys/cli/core/config
 * @file config.factory.ts
 * @description Factory pattern for creating LocalKeysConfig instances
 */

import { LocalKeysConfig, ILocalKeysConfig } from './config';

/**
 * Factory for creating LocalKeysConfig instances
 *
 * @remarks
 * Provides various ways to create configuration instances with sensible defaults.
 *
 * @example
 * ```ts
 * // Create with defaults
 * const config = ConfigFactory.createDefault('my-app');
 *
 * // Create from data
 * const config = ConfigFactory.createFromData({
 *   package: 'my-app',
 *   templateFile: '.env.example',
 *   manifestVersion: '1.0'
 * });
 * ```
 */
export class ConfigFactory {
  /**
   * Create a config with default settings
   *
   * @param packageName - Package name
   * @param templateFile - Optional template file (defaults to .env.template)
   * @returns LocalKeysConfig instance
   */
  static createDefault(
    packageName: string,
    templateFile: string = '.env.template'
  ): LocalKeysConfig {
    return new LocalKeysConfig({
      package: packageName,
      templateFile,
      manifestVersion: '1.0',
    });
  }

  /**
   * Create config from raw data
   *
   * @param data - Config data
   * @returns LocalKeysConfig instance
   */
  static createFromData(data: ILocalKeysConfig): LocalKeysConfig {
    return new LocalKeysConfig(data);
  }

  /**
   * Create config with custom template file
   *
   * @param packageName - Package name
   * @param templateFile - Template file path
   * @returns LocalKeysConfig instance
   */
  static createWithTemplate(
    packageName: string,
    templateFile: string
  ): LocalKeysConfig {
    return new LocalKeysConfig({
      package: packageName,
      templateFile,
      manifestVersion: '1.0',
    });
  }

  /**
   * Clone a config instance
   *
   * @param config - Config to clone
   * @returns Cloned config
   */
  static clone(config: LocalKeysConfig): LocalKeysConfig {
    return new LocalKeysConfig(config.toObject());
  }
}
