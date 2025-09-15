/**
 * @module @localkeys/cli/core/manifest
 * @file manifest.factory.ts
 * @description Factory pattern for creating Manifest instances
 */

import { Manifest, IManifest, IPackageEntry } from './manifest';

/**
 * Factory for creating Manifest instances
 *
 * @remarks
 * This factory provides various ways to create Manifest instances,
 * ensuring consistent initialization and validation.
 *
 * @example
 * ```ts
 * // Create empty manifest
 * const manifest = ManifestFactory.createEmpty();
 *
 * // Create with initial package
 * const manifest = ManifestFactory.createWithPackage('my-app', ['API_KEY']);
 * ```
 */
export class ManifestFactory {
  /**
   * Create an empty manifest
   *
   * @returns Empty Manifest instance
   */
  static createEmpty(): Manifest {
    return new Manifest({ packages: {} });
  }

  /**
   * Create manifest from raw data
   *
   * @param data - Raw manifest data
   * @returns Manifest instance
   */
  static createFromData(data: IManifest): Manifest {
    return new Manifest(data);
  }

  /**
   * Create manifest with a single package
   *
   * @param pkg - Package name
   * @param keys - Initial keys for the package (as strings, will be marked as required)
   * @returns Manifest instance with the package
   */
  static createWithPackage(pkg: string, keys: string[] = []): Manifest {
    const manifest = new Manifest();
    manifest.packages[pkg] = {
      keys: keys.map((name) => ({ name, required: true })),
      lastUpdated: new Date().toISOString(),
    };
    return manifest;
  }

  /**
   * Create manifest with multiple packages
   *
   * @param packages - Record of package names to their entries
   * @returns Manifest instance with the packages
   */
  static createWithPackages(packages: Record<string, IPackageEntry>): Manifest {
    return new Manifest({ packages });
  }

  /**
   * Clone a manifest (deep copy)
   *
   * @param manifest - Manifest to clone
   * @returns Deep copy of the manifest
   */
  static clone(manifest: Manifest): Manifest {
    return new Manifest({
      packages: JSON.parse(JSON.stringify(manifest.packages)),
    });
  }

  /**
   * Merge two manifests
   *
   * @param manifest1 - First manifest
   * @param manifest2 - Second manifest (takes precedence)
   * @returns Merged manifest
   */
  static merge(manifest1: Manifest, manifest2: Manifest): Manifest {
    const merged = ManifestFactory.clone(manifest1);

    for (const [pkg, entry] of Object.entries(manifest2.packages)) {
      if (merged.hasPackage(pkg)) {
        // Merge keys, avoiding duplicates
        const existingKeyNames = merged.getKeys(pkg);
        const existingKeyMetadata = merged.getKeyMetadata(pkg);
        const newKeys = entry.keys.filter(
          (k) => !existingKeyNames.includes(k.name)
        );
        const packageEntry = merged.packages[pkg];
        if (packageEntry) {
          packageEntry.keys = [...existingKeyMetadata, ...newKeys];
          packageEntry.lastUpdated = entry.lastUpdated;
        }
      } else {
        // Add new package
        merged.packages[pkg] = { ...entry };
      }
    }

    return merged;
  }
}
