/**
 * @module @localkeys/cli/core/config
 * @file config.manager.ts
 * @description Manages LocalKeys configuration operations and business logic
 */

import path from 'path';
import { LocalKeysConfig } from './config';
import { ConfigParser } from './config.parser';
import { ConfigFactory } from './config.factory';

/**
 * Manages LocalKeys configuration operations and business logic
 *
 * @remarks
 * Handles all business logic related to project configuration,
 * including reading, writing, and accessing config values.
 *
 * @example
 * ```ts
 * const manager = new ConfigManager();
 *
 * // Load config
 * const config = await manager.load();
 *
 * // Get package name
 * const pkg = await manager.getPackageName();
 *
 * // Get template file path
 * const template = await manager.getTemplateFilePath();
 * ```
 */
export class ConfigManager {
  private configPath: string;
  private projectRoot: string;
  private parser: ConfigParser;

  /**
   * Create a new ConfigManager
   *
   * @param projectRoot - Project root directory (defaults to process.cwd())
   */
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.configPath = path.join(projectRoot, '.localkeys', 'config.json');
    this.parser = new ConfigParser();
  }

  /**
   * Load config from disk
   *
   * @returns LocalKeysConfig instance or null if not initialized
   */
  async load(): Promise<LocalKeysConfig | null> {
    return await this.parser.readFromFile(this.configPath);
  }

  /**
   * Save config to disk
   *
   * @param config - Config to save
   */
  async save(config: LocalKeysConfig): Promise<void> {
    await this.parser.writeToFile(this.configPath, config);
  }

  /**
   * Get package name from config
   * Throws error if not initialized
   *
   * @returns Package name
   * @throws Error if LocalKeys not initialized
   */
  async getPackageName(): Promise<string> {
    const config = await this.load();
    if (!config) {
      throw new Error('LocalKeys not initialized. Run "localkeys init" first.');
    }
    return config.getPackage();
  }

  /**
   * Get template file path (resolved to absolute path)
   *
   * @returns Absolute path to template file
   * @throws Error if LocalKeys not initialized
   */
  async getTemplateFilePath(): Promise<string> {
    const config = await this.load();
    if (!config) {
      throw new Error('LocalKeys not initialized. Run "localkeys init" first.');
    }
    return path.join(this.projectRoot, config.getTemplateFile());
  }

  /**
   * Get template file path (relative as stored in config)
   *
   * @returns Relative path to template file
   * @throws Error if LocalKeys not initialized
   */
  async getTemplateFileRelativePath(): Promise<string> {
    const config = await this.load();
    if (!config) {
      throw new Error('LocalKeys not initialized. Run "localkeys init" first.');
    }
    return config.getTemplateFile();
  }

  /**
   * Get manifest version
   *
   * @returns Manifest version
   * @throws Error if LocalKeys not initialized
   */
  async getManifestVersion(): Promise<string> {
    const config = await this.load();
    if (!config) {
      throw new Error('LocalKeys not initialized. Run "localkeys init" first.');
    }
    return config.getManifestVersion();
  }

  /**
   * Get default environment
   *
   * @returns Default environment name
   * @throws Error if LocalKeys not initialized
   */
  async getDefaultEnvironment(): Promise<string> {
    const config = await this.load();
    if (!config) {
      throw new Error('LocalKeys not initialized. Run "localkeys init" first.');
    }
    return config.getDefaultEnvironment();
  }

  /**
   * Check if LocalKeys is initialized in current project
   *
   * @returns True if config file exists
   */
  async isInitialized(): Promise<boolean> {
    return await this.parser.exists(this.configPath);
  }

  /**
   * Create a new config file
   *
   * @param packageName - Package name
   * @param templateFile - Template file path
   * @returns Created config instance
   */
  async create(
    packageName: string,
    templateFile: string = '.env.template'
  ): Promise<LocalKeysConfig> {
    const config = ConfigFactory.createDefault(packageName, templateFile);
    await this.save(config);
    return config;
  }

  /**
   * Update existing config
   *
   * @param updates - Partial config updates
   * @throws Error if LocalKeys not initialized
   */
  async update(
    updates: Partial<{
      package: string;
      templateFile: string;
      manifestVersion: string;
      defaultEnvironment: string;
    }>
  ): Promise<void> {
    const config = await this.load();
    if (!config) {
      throw new Error('LocalKeys not initialized. Run "localkeys init" first.');
    }

    if (updates.package !== undefined) {
      config.package = updates.package;
    }
    if (updates.templateFile !== undefined) {
      config.templateFile = updates.templateFile;
    }
    if (updates.manifestVersion !== undefined) {
      config.manifestVersion = updates.manifestVersion;
    }
    if (updates.defaultEnvironment !== undefined) {
      config.defaultEnvironment = updates.defaultEnvironment;
    }

    await this.save(config);
  }

  /**
   * Get config file path
   *
   * @returns Absolute path to config file
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Get project root directory
   *
   * @returns Project root path
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }
}
