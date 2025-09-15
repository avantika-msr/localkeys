/**
 * @module @localkeys/cli/core/manifest
 * @file manifest.manager.ts
 * @description Manages manifest operations and business logic
 */

import path from 'path';
import { IKeyMetadata, IPackageEntry, Manifest } from './manifest';
import { ManifestParser } from './manifest.parser';

/**
 * Manages manifest operations and business logic
 *
 * @remarks
 * This class handles all business logic related to manifests,
 * including CRUD operations on packages and keys.
 *
 * @example
 * ```ts
 * const manager = new ManifestManager();
 *
 * // Add a key
 * await manager.addKey('my-app', 'API_KEY');
 *
 * // List keys
 * const keys = await manager.listKeys('my-app');
 *
 * // Remove a key
 * await manager.removeKey('my-app', 'API_KEY');
 * ```
 */
export class ManifestManager {
  private manifestPath: string;
  private parser: ManifestParser;
  private readonly projectRoot: string;

  /**
   * Create a new ManifestManager
   *
   * @param projectRoot - Project root directory (defaults to process.cwd())
   */
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.manifestPath = path.join(projectRoot, '.localkeys', 'manifest.json');
    this.parser = new ManifestParser();
  }

  /**
   * Load manifest from disk
   *
   * @returns Manifest instance
   */
  async load(): Promise<Manifest> {
    return await this.parser.readFromFile(this.manifestPath);
  }

  /**
   * Save manifest to disk
   *
   * @param manifest - Manifest to save
   */
  async save(manifest: Manifest): Promise<void> {
    await this.parser.writeToFile(this.manifestPath, manifest);
  }

  /**
   * Add a key to a package
   * Creates the package if it doesn't exist
   *
   * @param pkg - Package name
   * @param key - Key name to add
   * @param required - Whether the key is required (default: true)
   */
  async addKey(
    pkg: string,
    key: string,
    required: boolean = true
  ): Promise<void> {
    const manifest = await this.load();

    if (!manifest.hasPackage(pkg)) {
      manifest.packages[pkg] = {
        keys: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    const packageEntry = manifest.getPackage(pkg);
    if (!packageEntry) {
      throw new Error(`Failed to create package: ${pkg}`);
    }

    // Check if key already exists
    const existingKey = packageEntry.keys.find((k) => k.name === key);

    if (!existingKey) {
      // Key doesn't exist, add it
      packageEntry.keys.push({ name: key, required });
      packageEntry.lastUpdated = new Date().toISOString();
      await this.save(manifest);
    } else if (existingKey.required !== required) {
      // Key exists, update its required status if changed
      existingKey.required = required;
      packageEntry.lastUpdated = new Date().toISOString();
      await this.save(manifest);
    }
  }

  /**
   * Remove a key from a package
   * Removes the package if no keys remain
   *
   * @param pkg - Package name
   * @param key - Key name to remove
   */
  async removeKey(pkg: string, key: string): Promise<void> {
    const manifest = await this.load();

    if (manifest.hasPackage(pkg)) {
      const packageEntry = manifest.getPackage(pkg);
      if (packageEntry) {
        packageEntry.keys = packageEntry.keys.filter((k) => k.name !== key);
        packageEntry.lastUpdated = new Date().toISOString();

        // Remove package if no keys left
        if (packageEntry.keys.length === 0) {
          delete manifest.packages[pkg];
        }

        await this.save(manifest);
      }
    }
  }

  /**
   * List all keys for a package
   *
   * @param pkg - Package name
   * @returns Array of key names
   */
  async listKeys(pkg: string): Promise<string[]> {
    const manifest = await this.load();
    return manifest.getKeys(pkg);
  }

  /**
   * List all package names
   *
   * @returns Array of package names
   */
  async listPackages(): Promise<string[]> {
    const manifest = await this.load();
    return manifest.getPackageNames();
  }

  /**
   * Check if a key exists in a package
   *
   * @param pkg - Package name
   * @param key - Key name
   * @returns True if key exists
   */
  async hasKey(pkg: string, key: string): Promise<boolean> {
    const manifest = await this.load();
    return manifest.hasKey(pkg, key);
  }

  /**
   * Check if a package exists
   *
   * @param pkg - Package name
   * @returns True if package exists
   */
  async hasPackage(pkg: string): Promise<boolean> {
    const manifest = await this.load();
    return manifest.hasPackage(pkg);
  }

  /**
   * Get package entry with metadata
   *
   * @param pkg - Package name
   * @returns Package entry or null if not found
   */
  async getPackageEntry(pkg: string): Promise<IPackageEntry | null> {
    const manifest = await this.load();
    return manifest.getPackage(pkg);
  }

  /**
   * Get required keys for a package
   *
   * @param pkg - Package name
   * @returns Array of required key names
   */
  async getRequiredKeys(pkg: string): Promise<string[]> {
    const manifest = await this.load();
    return manifest.getRequiredKeys(pkg);
  }

  /**
   * Get optional keys for a package
   *
   * @param pkg - Package name
   * @returns Array of optional key names
   */
  async getOptionalKeys(pkg: string): Promise<string[]> {
    const manifest = await this.load();
    return manifest.getOptionalKeys(pkg);
  }

  /**
   * Get key metadata for a package
   *
   * @param pkg - Package name
   * @returns Array of key metadata
   */
  async getKeyMetadata(pkg: string): Promise<IKeyMetadata[]> {
    const manifest = await this.load();
    return manifest.getKeyMetadata(pkg);
  }

  /**
   * Check if a key is required
   *
   * @param pkg - Package name
   * @param key - Key name
   * @returns True if key is required
   */
  async isKeyRequired(pkg: string, key: string): Promise<boolean> {
    const manifest = await this.load();
    return manifest.isKeyRequired(pkg, key);
  }

  /**
   * Remove entire package and all its keys
   *
   * @param pkg - Package name
   */
  async removePackage(pkg: string): Promise<void> {
    const manifest = await this.load();
    delete manifest.packages[pkg];
    await this.save(manifest);
  }

  /**
   * Get path to manifest file
   *
   * @returns Absolute path to manifest file
   */
  getManifestPath(): string {
    return this.manifestPath;
  }

  /**
   * Check if manifest file exists
   *
   * @returns True if file exists
   */
  async exists(): Promise<boolean> {
    return await this.parser.exists(this.manifestPath);
  }

  /**
   * Get total number of keys across all packages
   *
   * @returns Total key count
   */
  async getTotalKeyCount(): Promise<number> {
    const manifest = await this.load();
    return manifest.getTotalKeyCount();
  }

  /**
   * Get total number of packages
   *
   * @returns Package count
   */
  async getPackageCount(): Promise<number> {
    const manifest = await this.load();
    return manifest.getPackageCount();
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
