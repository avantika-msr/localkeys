/**
 * @module @localkeys/cli/core/manifest
 * @file manifest.parser.ts
 * @description Handles file I/O, serialization, and validation for Manifests
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { Manifest, IManifest } from './manifest';
import { ManifestFactory } from './manifest.factory';
import { ManifestSchema } from '../types/types.schema';

/**
 * Handles file I/O and validation for Manifests
 *
 * @remarks
 * This class is responsible for reading/writing manifests from/to disk
 * and validating the data structure using Zod schemas.
 *
 * @example
 * ```ts
 * const parser = new ManifestParser();
 *
 * // Read from file
 * const manifest = await parser.readFromFile('~/.localkeys/manifest.json');
 *
 * // Write to file
 * await parser.writeToFile('~/.localkeys/manifest.json', manifest);
 * ```
 */
export class ManifestParser {
  /**
   * Read manifest from JSON file
   *
   * @param filePath - Absolute path to manifest file
   * @returns Manifest instance (empty if file doesn't exist)
   * @throws Error if file exists but is invalid
   */
  async readFromFile(filePath: string): Promise<Manifest> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.parseFromJSON(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, return empty manifest
        return ManifestFactory.createEmpty();
      }
      throw new Error(`Failed to read manifest: ${(error as Error).message}`);
    }
  }

  /**
   * Write manifest to JSON file
   *
   * @param filePath - Absolute path to manifest file
   * @param manifest - Manifest instance to write
   * @throws Error if write fails
   */
  async writeToFile(filePath: string, manifest: Manifest): Promise<void> {
    try {
      const json = this.serializeToJSON(manifest);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, json);
    } catch (error) {
      throw new Error(`Failed to write manifest: ${(error as Error).message}`);
    }
  }

  /**
   * Parse and validate JSON string to Manifest
   *
   * @param jsonString - JSON string to parse
   * @returns Manifest instance
   * @throws Error if JSON is invalid or doesn't match schema
   */
  parseFromJSON(jsonString: string): Manifest {
    try {
      const rawData = JSON.parse(jsonString);
      const validated = this.validate(rawData);
      return ManifestFactory.createFromData(validated);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format for manifest');
      }
      throw error;
    }
  }

  /**
   * Serialize Manifest to JSON string
   *
   * @param manifest - Manifest instance
   * @returns Formatted JSON string
   */
  serializeToJSON(manifest: Manifest): string {
    const data: IManifest = manifest.toObject();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Validate manifest data against schema
   *
   * @param data - Data to validate
   * @returns Validated manifest data
   * @throws Error if validation fails
   */
  validate(data: unknown): IManifest {
    const result = ManifestSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Manifest validation failed: ${result.error.message}`);
    }
    return result.data;
  }

  /**
   * Check if data is a valid manifest
   *
   * @param data - Data to check
   * @returns True if data matches manifest schema
   */
  isValid(data: unknown): data is IManifest {
    return ManifestSchema.safeParse(data).success;
  }

  /**
   * Check if a manifest file exists
   *
   * @param filePath - Path to check
   * @returns True if file exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Export type for validation
export type ValidatedManifest = z.infer<typeof ManifestSchema>;
