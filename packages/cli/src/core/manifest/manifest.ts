/**
 * @module @localkeys/cli/core/manifest
 * @file manifest.ts
 * @description Pure data model for the LocalKeys manifest structure
 */

/**
 * Represents metadata for a single key
 */
export interface IKeyMetadata {
  name: string;
  required: boolean;
}

/**
 * Represents a single package entry in the manifest
 */
export interface IPackageEntry {
  keys: IKeyMetadata[];
  lastUpdated: string;
}

/**
 * Represents the complete manifest structure
 */
export interface IManifest {
  packages: Record<string, IPackageEntry>;
}

/**
 * Manifest class - pure data model
 *
 * @remarks
 * This class represents the manifest data structure without any business logic.
 * It only contains the data and basic accessor methods.
 *
 * @example
 * ```ts
 * const manifest = new Manifest({
 *   packages: {
 *     "my-app": {
 *       keys: ["API_KEY", "DATABASE_URL"],
 *       lastUpdated: "2025-10-19T10:30:00.000Z"
 *     }
 *   }
 * });
 * ```
 */
export class Manifest implements IManifest {
  packages: Record<string, IPackageEntry>;

  constructor(data?: Partial<IManifest>) {
    this.packages = data?.packages || {};
  }

  /**
   * Get a package entry by name
   *
   * @param pkg - Package name
   * @returns Package entry or null if not found
   */
  getPackage(pkg: string): IPackageEntry | null {
    return this.packages[pkg] || null;
  }

  /**
   * Check if a package exists in the manifest
   *
   * @param pkg - Package name
   * @returns True if package exists
   */
  hasPackage(pkg: string): boolean {
    return pkg in this.packages;
  }

  /**
   * Get all package names in the manifest
   *
   * @returns Array of package names
   */
  getPackageNames(): string[] {
    return Object.keys(this.packages);
  }

  /**
   * Get all key names for a specific package
   *
   * @param pkg - Package name
   * @returns Array of key names or empty array if package doesn't exist
   */
  getKeys(pkg: string): string[] {
    return this.getPackage(pkg)?.keys.map((k) => k.name) || [];
  }

  /**
   * Get all key metadata for a specific package
   *
   * @param pkg - Package name
   * @returns Array of key metadata or empty array if package doesn't exist
   */
  getKeyMetadata(pkg: string): IKeyMetadata[] {
    return this.getPackage(pkg)?.keys || [];
  }

  /**
   * Get required keys for a specific package
   *
   * @param pkg - Package name
   * @returns Array of required key names
   */
  getRequiredKeys(pkg: string): string[] {
    return this.getKeyMetadata(pkg)
      .filter((k) => k.required)
      .map((k) => k.name);
  }

  /**
   * Get optional keys for a specific package
   *
   * @param pkg - Package name
   * @returns Array of optional key names
   */
  getOptionalKeys(pkg: string): string[] {
    return this.getKeyMetadata(pkg)
      .filter((k) => !k.required)
      .map((k) => k.name);
  }

  /**
   * Check if a key exists in a package
   *
   * @param pkg - Package name
   * @param key - Key name
   * @returns True if key exists in package
   */
  hasKey(pkg: string, key: string): boolean {
    return this.getKeys(pkg).includes(key);
  }

  /**
   * Check if a key is required
   *
   * @param pkg - Package name
   * @param key - Key name
   * @returns True if key is required, false if optional or doesn't exist
   */
  isKeyRequired(pkg: string, key: string): boolean {
    const metadata = this.getKeyMetadata(pkg).find((k) => k.name === key);
    return metadata?.required ?? false;
  }

  /**
   * Get total number of packages
   *
   * @returns Number of packages
   */
  getPackageCount(): number {
    return this.getPackageNames().length;
  }

  /**
   * Get total number of keys across all packages
   *
   * @returns Total number of keys
   */
  getTotalKeyCount(): number {
    return Object.values(this.packages).reduce(
      (total, pkg) => total + pkg.keys.length,
      0
    );
  }

  /**
   * Convert manifest to plain object
   *
   * @returns Plain object representation
   */
  toObject(): IManifest {
    return {
      packages: this.packages,
    };
  }
}
