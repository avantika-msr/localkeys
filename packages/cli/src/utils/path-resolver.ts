/**
 * @module @localkeys/cli/utils
 * @file path-resolver.ts
 * @description Utility for resolving and normalizing file paths
 */

import path from 'path';
import fs from 'fs/promises';

/**
 * Utility class for resolving and normalizing file paths
 *
 * @remarks
 * Handles both relative and absolute paths, with proper cross-platform support.
 *
 * @example
 * ```ts
 * const resolver = new PathResolver();
 *
 * // Resolve relative path
 * const abs = resolver.resolve('.env.example');
 *
 * // Check if path exists
 * const exists = await resolver.exists('.env.example');
 *
 * // Get relative path from cwd
 * const rel = resolver.toRelative('/Users/avantika/project/.env.example');
 * ```
 */
export class PathResolver {
  private cwd: string;

  /**
   * Create a new PathResolver
   *
   * @param cwd - Current working directory (defaults to process.cwd())
   */
  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  /**
   * Resolve a path (relative or absolute) from current working directory
   *
   * @param inputPath - Path to resolve
   * @returns Absolute path
   *
   * @example
   * ```ts
   * resolver.resolve('.env.example')        // → /Users/avantika/project/.env.example
   * resolver.resolve('../shared/.env')      // → /Users/avantika/shared/.env
   * resolver.resolve('/absolute/path')      // → /absolute/path
   * ```
   */
  resolve(inputPath: string): string {
    // If absolute path, use as-is
    if (path.isAbsolute(inputPath)) {
      return inputPath;
    }

    // If relative path, resolve from cwd
    return path.resolve(this.cwd, inputPath);
  }

  /**
   * Check if a resolved path exists
   *
   * @param inputPath - Path to check
   * @returns True if path exists
   */
  async exists(inputPath: string): Promise<boolean> {
    try {
      const resolved = this.resolve(inputPath);
      await fs.access(resolved);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get relative path from cwd
   * If path is outside cwd, returns absolute path
   *
   * @param inputPath - Path to convert to relative
   * @returns Relative path from cwd, or absolute if outside cwd
   *
   * @example
   * ```ts
   * // Path inside cwd
   * resolver.toRelative('/Users/avantika/project/.env')
   * // → .env
   *
   * // Path outside cwd
   * resolver.toRelative('/Users/avantika/.env.shared')
   * // → /Users/avantika/.env.shared
   * ```
   */
  toRelative(inputPath: string): string {
    const resolved = this.resolve(inputPath);
    const relative = path.relative(this.cwd, resolved);

    // If the relative path goes outside cwd, use absolute
    if (relative.startsWith('..')) {
      return resolved; // Store absolute path
    }

    return relative; // Store relative path
  }

  /**
   * Normalize path separators for cross-platform compatibility
   * Converts backslashes to forward slashes
   *
   * @param inputPath - Path to normalize
   * @returns Normalized path with forward slashes
   *
   * @example
   * ```ts
   * resolver.normalize('src\\config\\file.ts')
   * // → src/config/file.ts
   * ```
   */
  normalize(inputPath: string): string {
    return path.normalize(inputPath).replace(/\\/g, '/');
  }

  /**
   * Join path segments and normalize
   *
   * @param segments - Path segments to join
   * @returns Joined and normalized path
   */
  join(...segments: string[]): string {
    return this.normalize(path.join(...segments));
  }

  /**
   * Get directory name from path
   *
   * @param inputPath - Path to get directory from
   * @returns Directory path
   */
  dirname(inputPath: string): string {
    return path.dirname(this.resolve(inputPath));
  }

  /**
   * Get base name from path
   *
   * @param inputPath - Path to get basename from
   * @param ext - Optional extension to remove
   * @returns Base name
   */
  basename(inputPath: string, ext?: string): string {
    return path.basename(inputPath, ext);
  }

  /**
   * Get file extension
   *
   * @param inputPath - Path to get extension from
   * @returns File extension (including dot)
   */
  extname(inputPath: string): string {
    return path.extname(inputPath);
  }

  /**
   * Check if path is absolute
   *
   * @param inputPath - Path to check
   * @returns True if absolute
   */
  isAbsolute(inputPath: string): boolean {
    return path.isAbsolute(inputPath);
  }

  /**
   * Get current working directory
   *
   * @returns Current working directory
   */
  getCwd(): string {
    return this.cwd;
  }

  /**
   * Set current working directory
   *
   * @param newCwd - New working directory
   */
  setCwd(newCwd: string): void {
    this.cwd = newCwd;
  }
}
