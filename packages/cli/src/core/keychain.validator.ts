/**
 * @module @localkeys/cli/core/keychain.validator
 * 
 * @file keychain.validator.ts
 * @fileOverview This file defines the validateKey and validateValue functions
 * for validating keychain keys and values using the Zod library.
 * @public
 * 
 * @summary
 * This module provides functions for validating keychain keys and values using the Zod library.
 * 
 * @description This file defines the validateKey and validateValue functions
 * for validating keychain keys and values using the Zod library.
 * 
 * @license MIT
 * @author [avantika-msr](http://www.github.com/avantika-msr)
 * 
 * @remarks
 * The validateKey function uses the Zod library to validate the key against the schema.
 * If the key is valid, it returns true; otherwise, it returns false.
 * 
 * @see {@link DefaultKeyChainValueSchema} for the default schema.
 * @see {@link KeyChainKeySchema} for the key schema.
 * @see {@link z.ZodType} for more details on the underlying implementation.
 * @see {@link validateValue} for more details on the value validation.
 */

import z from "zod";
import { DefaultKeyChainValueSchema, KeyChainKeySchema, PackageNameSchema } from "../types/types.schema";

/**
 * Validates a key using a Zod schema.
 * 
 * @param key The key to validate.
 * @returns {boolean} True if the key is valid, false otherwise.
 * @example
 * ```ts
 * const isValid = validateKey('myKey');
 * console.log(isValid); // Outputs: true
 * ```
 * @remarks
 * This function uses the Zod library to validate the key against the schema.
 * If the key is valid, it returns true; otherwise, it returns false.
 * 
 * @see {@link DefaultKeyChainValueSchema} for the default schema.
 * @see {@link KeyChainKeySchema} for the key schema.
 * @see {@link z.ZodType} for more details on the underlying implementation.
 * @see {@link validateValue} for more details on the value validation.
 */
export function validateKey(key: string): boolean {
  const result = KeyChainKeySchema.safeParse(key);
  if (!result.success) {
    console.error('Invalid key:', result.error);
    return false;
  }
  return true;
}

/**
 * Validates a value using a Zod schema.
 * 
 * @param schma The Zod schema to validate the value against.
 * @param value The value to validate.
 * @returns {boolean} True if the value is valid, false otherwise.
 * @example
 * ```ts
 * const isValid = validateValue(DefaultKeyChainValueSchema, 'myValue');
 * console.log(isValid); // Outputs: true
 * ```
 * @remarks
 * This function uses the Zod library to validate the value against the schema.
 * If the value is valid, it returns true; otherwise, it returns false.
 * 
 * @see {@link DefaultKeyChainValueSchema} for the default schema.
 * @see {@link KeyChainKeySchema} for the key schema.
 * @see {@link z.ZodType} for more details on the underlying implementation.
 * @see {@link validateKey} for more details on the key validation.
 */
export function validateValue(schma:z.ZodType<any> = DefaultKeyChainValueSchema, value: string): boolean {
  const result = schma.safeParse(value);
  if (!result.success) {
    console.error('Invalid value:', result.error);
    return false;
  }
  return true;
}

/**
 * Validates a package name using a Zod schema.
 * 
 * @param packageName The package name to validate.
 * @returns {boolean} True if the package name is valid, false otherwise.
 * @example
 * ```ts
 * const isValid = validatePackageName('my-package-name');
 * console.log(isValid); // Outputs: true
 * ```
 * @remarks
 * This function uses the Zod library to validate the package name against the schema.
 * If the package name is valid, it returns true; otherwise, it returns false.
 * 
 * @see {@link PackageNameSchema} for the package name schema.
 * @see {@link z.ZodType} for more details on the underlying implementation.
 * @see {@link validateKey} for more details on the key validation.
 */
export function validatePackageName(packageName: string): boolean {
  const result = PackageNameSchema.safeParse(packageName);
  if (!result.success) {
    console.error('Invalid package name:', result.error);
    return false;
  }
  return true;
}