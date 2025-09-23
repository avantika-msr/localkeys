/**
 * @module @localkeys/cli/core/keychain
 *
 * @file keychain.ts
 * @fileOverview This file defines the IKeychainProvider interface and the SystemKeychain class
 * for secure storage and retrieval of sensitive information using the system's native keychain services.
 * @public
 *
 * @summary
 * This module provides an interface and implementation for interacting with the system keychain.
 *
 * @description This file defines the IKeychainProvider interface and the SystemKeychain class,
 * which provides a secure way to store and retrieve sensitive information such as tokens and passwords
 * using the system's native keychain services via the NAPI-RS Keyring library.
 *
 * @license MIT
 * @author [avantika-msr](http://www.github.com/avantika-msr)
 *
 * @remarks
 * The IKeychainProvider interface defines the contract for keychain operations,
 * while the SystemKeychain class implements this interface using the NAPI-RS Keyring library.
 * This allows for secure storage and retrieval of sensitive information in a platform-agnostic manner.
 *
 * @see {@link IKeychainProvider} for the interface definition.
 * @see {@link SystemKeychain} for the concrete implementation.
 * @see {@link Entry} from NAPI-RS Keyring for more details on the underlying implementation.
 */

import { Entry } from '@napi-rs/keyring';
import * as console from 'node:console';
import { TKeyChainKey, TKeyChainValue, TPackageName } from '../types';
import {
  validateKey,
  validatePackageName,
  validateValue,
} from './keychain.validator';
import { DefaultKeyChainValueSchema } from '../types/types.schema';
import { ManifestManager } from '../manifest/manifest.manager';

/**
 * IKeychainProvider defines the interface for a keychain provider.
 * It includes methods for getting, listing, setting, deleting, and clearing keychain entries.
 *
 * @interface IKeychainProvider
 * @example
 * ```ts
 * const keychain: IKeychainProvider = new SystemKeychain('my-package-name');
 * await keychain.set('myKey', 'myValue');
 * const value = await keychain.get('myKey');
 * console.log(value); // Outputs: 'myValue'
 * await keychain.delete('myKey');
 * ```
 * @remarks
 * This interface provides a contract for keychain operations, allowing different implementations
 * to be used interchangeably. It is particularly useful for abstracting away platform-specific
 * keychain details and providing a consistent API for secure storage of sensitive information.
 *
 * @see {@link SystemKeychain} for a concrete implementation of this interface.
 * @see {@link Entry} from NAPI-RS Keyring for more details on the underlying implementation.
 * @see {@link set} to store values in the keychain.
 * @see {@link get} to retrieve values from the keychain.
 * @see {@link list} to list all keys in the keychain.
 * @see {@link delete} to remove values from the keychain.
 * @see {@link clear} to clear all entries in the keychain.
 *
 * @author avantika-msr
 */
export interface IKeychainProvider {
  get(key: string): Promise<string | null>;
  list(): Promise<string[]>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * SystemKeychain provides a secure way to store and retrieve sensitive information
 * such as tokens and passwords using the system's native keychain services.
 * It leverages the NAPI-RS Keyring library to interact with the underlying keychain.
 *
 * @implements {IKeychainProvider}
 * @class SystemKeychain
 * @classDesc
 * SystemKeychain provides methods to set, get, delete, list, and clear keychain entries.
 * It uses the package name as the service identifier to namespace the entries.
 * This ensures that entries from different applications do not conflict with each other.
 *
 * @param packageName - The package name used as the service identifier in the keychain.
 *
 * @throws Propagates errors from the underlying keychain operations so callers can handle failures.
 *
 * @example
 * ```ts
 * const keychain = new SystemKeychain('my-package-name');
 * await keychain.set('myKey', 'myValue');
 * const value = await keychain.get('myKey');
 * console.log(value); // Outputs: 'myValue'
 * await keychain.delete('myKey');
 * ```
 *
 * @remarks
 * The SystemKeychain class is designed to provide a simple and consistent interface for keychain operations
 * across different platforms. It abstracts away the complexities of dealing with platform-specific
 * keychain APIs, allowing developers to focus on their application logic.
 *
 * Note that some operations, such as listing all keys or clearing the keychain, are not supported
 * by the underlying NAPI-RS Keyring library and are implemented as no-ops or return empty results.
 *
 * @see {@link IKeychainProvider} for the interface definition.
 * @see {@link Entry} from NAPI-RS Keyring for more details on the underlying implementation.
 * @see {@link set} to store values in the keychain.
 * @see {@link get} to retrieve values from the keychain.
 * @see {@link list} to list all keys in the keychain (not supported).
 * @see {@link delete} to remove values from the keychain.
 * @see {@link clear} to clear all entries in the keychain (not supported).
 *
 * @author avantika-msr
 */
export class SystemKeychain implements IKeychainProvider {
  private readonly packageName: TPackageName;
  private readonly manifest: ManifestManager;
  private readonly projectRoot: string;
  private readonly defaultEnvironment: string;

  /**
   * Creates an instance of SystemKeychain.
   * @param packageName - The package name used as the service identifier in the keychain.
   * @param projectRoot - Project root directory (defaults to process.cwd())
   * @param defaultEnvironment - Default environment name (defaults to 'development')
   *
   * @example
   * ```ts
   * const keychain = new SystemKeychain('my-package-name', '/path/to/project', 'production');
   * ```
   * @remarks
   * The package name and environment are used to namespace the keychain entries in the format
   * `{package}:{environment}:{key}`, ensuring that they do not conflict with entries from
   * other applications or environments. The project root is used to locate the project-local
   * manifest file at .localkeys/manifest.json.
   *
   * @see {@link set} to store values in the keychain.
   * @see {@link get} to retrieve values from the keychain.
   * @see {@link list} to list all keys in the keychain (now supported via manifest).
   * @see {@link delete} to remove values from the keychain.
   */
  constructor(
    packageName: string,
    projectRoot: string = process.cwd(),
    defaultEnvironment: string = 'development'
  ) {
    // validate package name
    if (!validatePackageName(packageName)) {
      // throw error if package name is invalid
      console.error('Invalid package name:', packageName);
      throw new Error('Invalid package name');
    }
    // set package name
    this.packageName = packageName;
    // set project root
    this.projectRoot = projectRoot;
    // set default environment
    this.defaultEnvironment = defaultEnvironment;
    // initialize manifest manager with project root
    this.manifest = new ManifestManager(projectRoot);
  }

  /**
   * Creates a namespaced key in the format {package}:{environment}:{key}
   * @param key - The key name
   * @param environment - Optional environment (defaults to defaultEnvironment)
   * @returns Namespaced key string
   * @private
   */
  private createNamespacedKey(key: string, environment?: string): string {
    const env = environment || this.defaultEnvironment;
    return `${this.packageName}:${env}:${key}`;
  }

  /**
   * Gets a value from the keychain.
   * @returns {Promise<string | null>} A promise that resolves to the value associated with the key, or null if not found.
   * @throws
   * - {@link Error} Will throw an error if the key is not valid.
   * - Will **not** throw an error if the key is not found. Instead, it will return {@link null}.
   * @param key - The key to retrieve.
   * @example
   * ```ts
   * const value = await keychain.get('myKey');
   * console.log(value);
   * ```
   *
   * @remarks
   * This method uses the NAPI-RS Keyring library to retrieve the value securely from the system keychain.
   * If an error occurs during the operation, it is logged and the error is rethrown so callers can decide how to handle it.
   * Use this method to retrieve sensitive information such as tokens or passwords.
   *
   * @see {@link set} to store values in the keychain.
   * @see {@link delete} to remove values from the keychain.
   * @see {@link list} to list all keys in the keychain (not supported).
   * @see {@link clear} to clear all entries in the keychain (not supported).
   */
  async get(key: TKeyChainKey, environment?: string): Promise<string | null> {
    // validate key
    if (!validateKey(key)) {
      // throw error if key is invalid
      console.error('Invalid key:', key);
      throw new Error('Invalid key');
    }
    try {
      // create namespaced key
      const namespacedKey = this.createNamespacedKey(key, environment);
      // create keychain entry with 'localkeys' as service and namespaced key as account
      const entity = new Entry('localkeys', namespacedKey);
      // get password
      return entity.getPassword();
    } catch (error) {
      console.error('Failed to get keychain entry:', error);
      // swallow errors
      return null;
    } finally {
      // noop
    }
  }

  /**
   * Clears all entries from the keychain.
   *
   * @warning NAPI-RS Keyring does not support clearing all entries. This method is a noop.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   * @throws Will not throw; this is a noop.
   * @example
   * ```ts
   * await keychain.clear();
   * ```
   * @remarks
   * This method is included to fulfill the IKeychainProvider interface but does not provide actual
   * functionality due to limitations in the underlying library.
   *
   * @see {@link set} to store values in the keychain.
   * @see {@link get} to retrieve values from the keychain.
   * @see {@link list} to list all keys in the keychain (not supported).
   * @see {@link delete} to remove values from the keychain.
   */
  async clear(): Promise<void> {
    // NAPI-RS Keyring does not support clearing all entries, so this is a noop.
    console.warn('SystemKeychain.clear() is not supported and is a noop.');
    return;
  }

  /**
   * Deletes a value from the keychain.
   *
   * @returns {Promise<void>} A promise that resolves when the value is deleted.
   * @throws
   * - {@link Error} Will throw an error if the key is not valid.
   * - {@link Error} Rethrows any error encountered while deleting the underlying keychain entry.
   * @param key - The key to delete.
   * @example
   * ```ts
   * await keychain.delete('myKey');
   * ```
   * @remarks
   * This method uses the NAPI-RS Keyring library to delete the value securely from the system keychain.
   * If an error occurs during the operation, it is logged and the error is rethrown so callers can decide how to handle it.
   * Use this method to remove sensitive information such as tokens or passwords.
   *
   * @see {@link set} to store values in the keychain.
   * @see {@link get} to retrieve values from the keychain.
   * @see {@link list} to list all keys in the keychain (not supported).
   * @see {@link clear} to clear all entries in the keychain (not supported).
   */
  async delete(key: TKeyChainKey, environment?: string): Promise<void> {
    // validate key
    if (!validateKey(key)) {
      // throw error if key is invalid
      console.error('Invalid key:', key);
      throw new Error('Invalid key');
    }
    try {
      // create namespaced key
      const namespacedKey = this.createNamespacedKey(key, environment);
      const entity = new Entry('localkeys', namespacedKey);
      entity.deletePassword();
      // Remove from manifest
      await this.manifest.removeKey(this.packageName, key);
    } catch (error) {
      // swallow errors
      console.error('Failed to delete keychain entry:', error);
      throw new Error('Failed to delete keychain entry', { cause: error });
    } finally {
      // noop
    }
  }

  /**
   * Sets a value in the keychain.
   *
   * @param key - The key to set.
   * @param value - The value to set.
   * @param required - Whether the key is required (default: true)
   * @returns {Promise<void>} A promise that resolves when the value is set.
   * @throws
   * - {@link Error} Will throw an error if the key is not valid.
   * - {@link Error} Will throw an error if the value is not valid.
   * - {@link Error} Rethrows any error encountered while storing the value in the underlying keychain entry.
   * @example
   * ```ts
   * await keychain.set('myKey', 'myValue');
   * await keychain.set('optionalKey', 'value', false); // Mark as optional
   * ```
   *
   * @remarks
   * This method uses the NAPI-RS Keyring library to store the value securely in the system keychain.
   * If an error occurs during the operation, it is logged and the error is rethrown so callers can decide how to handle it.
   * Use this method to store sensitive information such as tokens or passwords.
   *
   * @see {@link get} to retrieve values from the keychain.
   * @see {@link delete} to remove values from the keychain.
   * @see {@link list} to list all keys in the keychain (not supported).
   * @see {@link clear} to clear all entries in the keychain (not supported).
   */
  async set(
    key: TKeyChainKey,
    value: TKeyChainValue,
    required: boolean = true,
    environment?: string
  ): Promise<void> {
    // validate key
    if (!validateKey(key)) {
      // throw error if key is invalid
      console.error('Invalid key:', key);
      throw new Error('Invalid key');
    }
    // validate value
    if (!validateValue(DefaultKeyChainValueSchema, value)) {
      // throw error if value is invalid
      console.error('Invalid value:', value);
      throw new Error('Invalid value');
    }
    try {
      // create namespaced key
      const namespacedKey = this.createNamespacedKey(key, environment);
      const entity = new Entry('localkeys', namespacedKey);
      entity.setPassword(value);
      // Add to manifest with required flag
      await this.manifest.addKey(this.packageName, key, required);
    } catch (error) {
      // swallow errors
      console.error('Failed to set keychain entry:', error);
      throw new Error('Failed to set keychain entry', { cause: error });
    } finally {
      // noop
    }
  }

  /**
   * Lists all keys stored in the keychain for this package.
   *
   * @returns {Promise<string[]>} Array of key names stored for this package.
   * @throws  Will not throw under normal circumstances.
   * @example
   * ```ts
   * const keys = await keychain.list();
   * console.log(keys); // ['API_KEY', 'DATABASE_URL']
   * ```
   * @remarks
   * This method reads from the manifest file since NAPI-RS Keyring does not support listing entries directly.
   * The manifest tracks which keys have been set for each package.
   *
   * @see {@link get} to retrieve values from the keychain.
   * @see {@link set} to store values in the keychain.
   * @see {@link delete} to remove values from the keychain.
   * @see {@link clear} to clear all entries in the keychain (not supported).
   */
  async list(): Promise<string[]> {
    return await this.manifest.listKeys(this.packageName);
  }

  /**
   * Get project root directory
   *
   * @returns Project root path
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }
}
