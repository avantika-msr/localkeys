/**
 * @module @localkeys/node/utils
 * @description Debug logging utility
 */

import { DEBUG_ENV_VAR } from '../config/defaults';

/**
 * Simple logger for debug output
 */
export class Logger {
  private enabled: boolean;
  private prefix: string;

  constructor(prefix: string = '@localkeys/node', enabled?: boolean) {
    this.prefix = prefix;
    this.enabled = enabled ?? process.env[DEBUG_ENV_VAR] === 'true';
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`[${this.prefix}]`, message, ...args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    console.log(`[${this.prefix}]`, message, ...args);
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.prefix}]`, message, ...args);
  }

  /**
   * Log error message
   */
  error(message: string, ...args: any[]): void {
    console.error(`[${this.prefix}]`, message, ...args);
  }

  /**
   * Enable debug logging
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable debug logging
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if debug logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const logger = new Logger();
