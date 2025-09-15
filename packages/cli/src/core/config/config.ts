/**
 * @module @localkeys/cli/core/config
 * @file config.ts
 * @description Pure data model for LocalKeys configuration
 */

/**
 * Interface for LocalKeys configuration
 */
export interface ILocalKeysConfig {
  package: string;
  templateFile: string;
  manifestVersion: string;
}

/**
 * LocalKeys configuration class - pure data model
 *
 * @remarks
 * This class represents the project-level configuration stored in .localkeys/config.json
 * It contains only data and basic accessor methods, no business logic.
 *
 * @example
 * ```ts
 * const config = new LocalKeysConfig({
 *   package: 'my-app',
 *   templateFile: '.env.template',
 *   manifestVersion: '1.0'
 * });
 * ```
 */
export class LocalKeysConfig implements ILocalKeysConfig {
  package: string;
  templateFile: string;
  manifestVersion: string;

  constructor(data: ILocalKeysConfig) {
    this.package = data.package;
    this.templateFile = data.templateFile;
    this.manifestVersion = data.manifestVersion;
  }

  /**
   * Get package name
   *
   * @returns Package name
   */
  getPackage(): string {
    return this.package;
  }

  /**
   * Get template file path
   *
   * @returns Template file path
   */
  getTemplateFile(): string {
    return this.templateFile;
  }

  /**
   * Get manifest version
   *
   * @returns Manifest version
   */
  getManifestVersion(): string {
    return this.manifestVersion;
  }

  /**
   * Convert config to plain object
   *
   * @returns Plain object representation
   */
  toObject(): ILocalKeysConfig {
    return {
      package: this.package,
      templateFile: this.templateFile,
      manifestVersion: this.manifestVersion,
    };
  }

  /**
   * Check if config is valid (has all required fields)
   *
   * @returns True if valid
   */
  isValid(): boolean {
    return (
      !!this.package &&
      this.package.trim().length > 0 &&
      !!this.templateFile &&
      this.templateFile.trim().length > 0 &&
      !!this.manifestVersion &&
      this.manifestVersion.trim().length > 0
    );
  }
}
