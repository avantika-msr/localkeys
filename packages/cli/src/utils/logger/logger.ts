import chalk from 'chalk';

export const LogTag = {
  LOG: chalk.dim('›'),
  INFO: chalk.cyan('ℹ'),
  WARN: chalk.bgYellow.black(' ⚠ WARNING '),
  ERROR: chalk.bgRed.white.bold(' ✗ ERROR '),
  SUCCESS: chalk.green('✓'),
  DEBUG: chalk.magenta.dim('[DEBUG]'),
};

export class Logger {
  private readonly verboseFlag: boolean;
  constructor(verbose: boolean = false) {
    this.verboseFlag = verbose;
  }

  /**
   * Logs a verbose message if verbose mode is enabled.
   * Accepts multiple arguments like console.log
   * @param tag {@link string} : The log tag to use.
   * > See {@link LogTag} for the list of available options
   * @param args Any number of values to log (strings, objects, numbers, etc.)
   * @example
   * ```ts
   * const logger = new Logger(true);
   * logger.verbose(LogTag.INFO, 'User:', user, 'Count:', 42);
   * logger.verbose(LogTag.DEBUG, { foo: 'bar' }, [1, 2, 3]);
   * ```
   * @remarks
   * This method checks if verbose mode is enabled before logging the message.
   * It displays the tag followed by the arguments in dim text.
   *
   * @see {@link LogTag} for available log tags.
   */
  verbose(tag: string, ...args: any[]) {
    if (!this.verboseFlag) return;
    console.log(
      tag,
      chalk.dim(
        ...args.map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        )
      )
    );
  }

  /**
   * Logs an informational message.
   * Accepts multiple arguments like console.log
   * @param args Any number of values to log
   * @example
   * ```ts
   * logger.info('User created:', user);
   * logger.info('Count:', 42, 'Status:', 'active');
   * ```
   */
  info(...args: any[]) {
    console.info(LogTag.INFO, ...args);
  }

  /**
   * Logs a warning message.
   * Accepts multiple arguments like console.log
   * @param args Any number of values to log
   */
  warn(...args: any[]) {
    console.warn(LogTag.WARN, ...args);
  }

  /**
   * Logs an error message.
   * Accepts multiple arguments like console.log
   * @param args Any number of values to log
   */
  error(...args: any[]) {
    console.error(LogTag.ERROR, ...args);
  }

  /**
   * Logs a success message.
   * Accepts multiple arguments like console.log
   * @param args Any number of values to log
   */
  success(...args: any[]) {
    console.log(LogTag.SUCCESS, chalk.green(...args.map(String)));
  }

  /**
   * Logs a debug message if verbose mode is enabled.
   * Accepts multiple arguments like console.log
   * @param args Any number of values to log
   */
  debug(...args: any[]) {
    if (!this.verboseFlag) return;
    console.log(
      LogTag.DEBUG,
      chalk.dim(
        ...args.map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        )
      )
    );
  }

  /**
   * Logs a simple message with the LOG tag.
   * Accepts multiple arguments like console.log
   * @param args Any number of values to log
   */
  log(...args: any[]) {
    console.log(LogTag.LOG, ...args);
  }
}
