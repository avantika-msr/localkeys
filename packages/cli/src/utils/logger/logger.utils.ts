import { Logger } from './logger';

/**
 * Logs a verbose message if verbose mode is enabled.
 * Accepts multiple arguments like console.log
 * @param v - Verbose flag
 * @param tag - Log tag to use
 * @param args - Any number of messages/objects to log
 * @example
 * ```ts
 * verbose(true, LogTag.INFO, 'User:', user, 'Count:', 42);
 * verbose(false, LogTag.DEBUG, 'This will not show');
 * ```
 */
export function verbose(v: boolean, tag: string, ...args: any[]) {
  if (!v) return;
  new Logger(v).verbose(tag, ...args);
}

/**
 * Logs an informational message.
 * Accepts multiple arguments like console.log
 * @param args - Any number of messages/objects to log
 */
export function info(...args: any[]) {
  new Logger().info(...args);
}

/**
 * Logs a warning message.
 * Accepts multiple arguments like console.log
 * @param args - Any number of messages/objects to log
 */
export function warn(...args: any[]) {
  new Logger().warn(...args);
}

/**
 * Logs an error message.
 * Accepts multiple arguments like console.log
 * @param args - Any number of messages/objects to log
 */
export function error(...args: any[]) {
  new Logger().error(...args);
}

/**
 * Logs a success message.
 * Accepts multiple arguments like console.log
 * @param args - Any number of messages/objects to log
 */
export function success(...args: any[]) {
  new Logger().success(...args);
}

/**
 * Logs a debug message if verbose mode is enabled.
 * Accepts multiple arguments like console.log
 * @param v - Verbose flag
 * @param args - Any number of messages/objects to log
 */
export function debug(v: boolean, ...args: any[]) {
  if (!v) return;
  new Logger(v).debug(...args);
}

/**
 * Logs a simple message.
 * Accepts multiple arguments like console.log
 * @param args - Any number of messages/objects to log
 */
export function log(...args: any[]) {
  new Logger().log(...args);
}
