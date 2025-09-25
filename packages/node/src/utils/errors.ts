/**
 * @module @localkeys/node/utils
 * @description Custom error classes
 */

/**
 * Base error class for LocalKeys
 */
export class LocalKeysError extends Error {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'LocalKeysError';
    if (cause) {
      this.cause = cause;
    }

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when project is not initialized
 */
export class NotInitializedError extends LocalKeysError {
  constructor() {
    super(
      'LocalKeys not initialized. Run "localkeys init" in your project root.'
    );
    this.name = 'NotInitializedError';
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends LocalKeysError {
  constructor(
    message: string,
    public readonly errors: Array<{ key: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when keychain access fails
 */
export class KeychainError extends LocalKeysError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'KeychainError';
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends LocalKeysError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
