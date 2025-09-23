/**
 * Types and schemas for the **LocalKeys cli** package.
 *
 * @module @localkeys/cli/types
 *
 * @file types/index.ts
 * @fileOverview Type definitions and schemas for the **LocalKeys cli** package.
 * @public
 *
 * @summary
 * This module contains type definitions and schemas related to the system keychain functionality.
 * It defines types for valid keys and values used in the keychain, ensuring they adhere to specified formats.
 *
 * @description
 * This module provides type definitions for the system keychain used in the **LocalKeys cli** package.
 * It includes types for valid keys and values, derived from Zod schemas that enforce constraints on their formats.
 * These types ensure that any interaction with the keychain adheres to expected standards, promoting data integrity and security.
 *
 * @license MIT
 * @author [avantika-msr](http://www.github.com/avantika-msr)
 *
 * @remarks
 * This module provides type definitions and schemas for interacting with the system keychain.
 * It includes types for valid keys and values, ensuring they conform to expected formats.
 */

import {
  DefaultKeyChainValueSchema,
  KeyChainKeySchema,
  PackageNameSchema,
} from './types.schema';
import { z } from 'zod';

/**
 * Type representing a valid key for the system keychain.
 * Derived from the {@link KeyChainKeySchema}.
 * @public
 */
export type TKeyChainKey = z.infer<typeof KeyChainKeySchema>;
/**
 * Type representing a valid value for the system keychain.
 * Derived from the {@link DefaultKeyChainValueSchema}.
 * @public
 */
export type TKeyChainValue = z.infer<typeof DefaultKeyChainValueSchema>;

/**
 * Type representing a valid package name for the system keychain.
 * Derived from the {@link PackageNameSchema}.
 * @public
 */
export type TPackageName = z.infer<typeof PackageNameSchema>;
