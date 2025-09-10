/**
 * Zod schemas for validating system keychain keys and values.
 *
 * @module @localkeys/cli/types/schema
 *
 * @file types/schema.ts
 * @fileOverview Zod schemas for validating system keychain keys and values.
 * @module KeychainSchemas
 * @public
 *
 * @summary
 * This module contains Zod schemas for validating keys and values used in the system keychain.
 * It ensures that keys and values conform to specified formats and constraints.
 *
 * @author [avantika-msr](http://www.github.com/avantika-msr)
 * @license MIT
 *
 * @remarks
 * This module provides Zod schemas for validating keys and values in the system keychain.
 * It includes constraints on allowed characters, lengths, and formats to ensure data integrity.
 */

import { z } from 'zod';

/**
 * Schema for validating system keychain keys.
 * Ensures the key is a non-empty string with allowed characters and length limits.
 * - Allowed characters: alphanumeric, hyphens, underscores
 * - Minimum length: 1 character
 * - Maximum length: 255 characters
 * @remarks
 * This schema is used to validate keys used in the system keychain to ensure they conform to expected formats.
 * @example
 * ```ts
 * import { KeyChainKeySchema } from './types.schema';
 *
 * const validKey = "my_key-123";
 * const parsedKey = KeyChainKeySchema.parse(validKey); // succeeds
 * ```
 * @public
 */
export const KeyChainKeySchema = z
  .string()
  .min(1, { message: 'Key cannot be empty' })
  .max(255, { message: 'Key is too long' })
  .regex(/^[a-zA-Z0-9-_]+$/, { message: 'Key contains invalid characters' })
  .describe('System keychain value identifier');

/**
 * Schema for validating system keychain values.
 * Ensures the value does not contain control characters and is within length limits.
 * - Must not contain control characters (ASCII 0-31)
 * - Minimum length: 0 characters
 * - No maximum length enforced here, but practical limits may apply based on the keychain implementation.
 * @remarks
 * This schema is used to validate values stored in the system keychain to ensure they are safe and conform to expected formats.
 * @example
 * ```ts
 * import { DefaultKeyChainValueSchema } from './types.schema';
 *
 * const validValue = "my_secure_value";
 * const parsedValue = DefaultKeyChainValueSchema.parse(validValue); // succeeds
 * ```
 * @see {@link KeyChainKeySchema} for the corresponding key schema.
 * @public
 */
export const DefaultKeyChainValueSchema = z
  .string()
  .min(0)
  .regex(/^[^\x00-\x1F]*$/, {
    message: 'Value contains invalid control characters',
  })
  .refine((value) => value === '' || value.trim().length > 0, {
    message: 'Value cannot be whitespace only',
  })
  .describe('System keychain stored value');

/**
 * Schema for validating system keychain package names.
 * Ensures the package name is a non-empty string with allowed characters and length limits.
 * - Allowed characters: alphanumeric, hyphens, underscores, periods, at symbols, and forward slashes
 * - Minimum length: 1 character
 * - Maximum length: 255 characters
 * @remarks
 * This schema is used to validate package names used in the system keychain to ensure they conform to expected formats.
 * @example
 * ```ts
 * import { PackageNameSchema } from './types.schema';
 *
 * const validPackageName = "my_package_name";
 * const parsedPackageName = PackageNameSchema.parse(validPackageName); // succeeds
 * ```
 * @public
 */
export const PackageNameSchema = z
  .string()
  .min(1, { message: 'Package name cannot be empty' })
  .max(255, { message: 'Package name is too long' })
  .regex(/^[a-zA-Z0-9-_.@/]+$/, {
    message: 'Package name contains invalid characters',
  })
  .describe('System keychain package name');