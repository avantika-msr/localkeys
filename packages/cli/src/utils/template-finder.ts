/**
 * @module @localkeys/cli/utils
 * @file template-finder.ts
 * @description Utility for finding and validating template files
 */

import fs from 'fs/promises';
import { PathResolver } from './path-resolver';

/**
 * Default template file names to search for, in priority order
 */
const DEFAULT_TEMPLATE_FILES = [
  '.env.template',
  '.env.example',
  '.env.sample',
  '.env.defaults',
];

/**
 * Validation result for template file paths
 */
export interface TemplateValidationResult {
  valid: boolean;
  resolved: string;
  relative: string;
  error?: string;
}

/**
 * Utility class for finding and validating template files
 *
 * @remarks
 * Handles detection of common template file names and validation
 * of custom template paths (both relative and absolute).
 *
 * @example
 * ```ts
 * const finder = new TemplateFileFinder();
 *
 * // Find existing templates
 * const files = await finder.findExisting();
 *
 * // Auto-detect best template
 * const template = await finder.autoDetect();
 *
 * // Validate custom path
 * const result = await finder.validatePath('../shared/.env');
 * ```
 */
export class TemplateFileFinder {
  private pathResolver: PathResolver;
  private projectRoot: string;

  /**
   * Create a new TemplateFileFinder
   *
   * @param projectRoot - Project root directory (defaults to process.cwd())
   */
  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.pathResolver = new PathResolver(projectRoot);
  }

  /**
   * Find existing template files in the project root
   *
   * @returns Array of template file names found (relative paths)
   *
   * @example
   * ```ts
   * const files = await finder.findExisting();
   * // → ['.env.template', '.env.example']
   * ```
   */
  async findExisting(): Promise<string[]> {
    const found: string[] = [];

    for (const filename of DEFAULT_TEMPLATE_FILES) {
      const exists = await this.pathResolver.exists(filename);
      if (exists) {
        found.push(filename);
      }
    }

    return found;
  }

  /**
   * Auto-detect the best template file to use
   * Returns the first one found in priority order
   *
   * @returns Template filename or null if none found
   *
   * @example
   * ```ts
   * const template = await finder.autoDetect();
   * // → '.env.template' (if exists)
   * ```
   */
  async autoDetect(): Promise<string | null> {
    const existing = await this.findExisting();
    return existing.length > 0 ? (existing[0] ?? null) : null;
  }

  /**
   * Validate a template file path (handles relative and absolute paths)
   *
   * @param inputPath - Path to validate
   * @returns Validation result with resolved paths and any errors
   *
   * @example
   * ```ts
   * const result = await finder.validatePath('.env.example');
   * if (result.valid) {
   *   console.log('Resolved:', result.resolved);
   *   console.log('Relative:', result.relative);
   * } else {
   *   console.error('Error:', result.error);
   * }
   * ```
   */
  async validatePath(inputPath: string): Promise<TemplateValidationResult> {
    try {
      const exists = await this.pathResolver.exists(inputPath);

      if (!exists) {
        return {
          valid: false,
          resolved: '',
          relative: '',
          error: `File not found: ${inputPath}`,
        };
      }

      const resolved = this.pathResolver.resolve(inputPath);
      const relative = this.pathResolver.toRelative(inputPath);

      // Check if it's a file (not directory)
      const stats = await fs.stat(resolved);
      if (!stats.isFile()) {
        return {
          valid: false,
          resolved,
          relative,
          error: `Path is not a file: ${inputPath}`,
        };
      }

      return {
        valid: true,
        resolved,
        relative: this.pathResolver.normalize(relative),
      };
    } catch (err) {
      return {
        valid: false,
        resolved: '',
        relative: '',
        error: `Error accessing path: ${(err as Error).message}`,
      };
    }
  }

  /**
   * Check if a path is readable
   *
   * @param inputPath - Path to check
   * @returns True if path is readable
   */
  async isReadable(inputPath: string): Promise<boolean> {
    try {
      const resolved = this.pathResolver.resolve(inputPath);
      await fs.access(resolved, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a path is writable
   *
   * @param inputPath - Path to check
   * @returns True if path is writable
   */
  async isWritable(inputPath: string): Promise<boolean> {
    try {
      const resolved = this.pathResolver.resolve(inputPath);
      await fs.access(resolved, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get default template file names
   *
   * @returns Array of default template filenames
   */
  getDefaultTemplateFiles(): string[] {
    return [...DEFAULT_TEMPLATE_FILES];
  }

  /**
   * Check if a filename is a common template file
   *
   * @param filename - Filename to check
   * @returns True if filename is in the default list
   */
  isDefaultTemplate(filename: string): boolean {
    return DEFAULT_TEMPLATE_FILES.includes(filename);
  }

  /**
   * Get project root
   *
   * @returns Project root directory
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }
}
