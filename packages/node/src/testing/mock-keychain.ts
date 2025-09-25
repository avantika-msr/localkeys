/**
 * @module @localkeys/node/testing
 * @description Mock keychain for testing
 */

import { IKeychainProvider } from '@localkeys/core';

/**
 * Mock keychain implementation for testing
 */
export class MockKeychain implements IKeychainProvider {
  private storage: Map<string, string>;

  constructor(initialSecrets: Record<string, string> = {}) {
    this.storage = new Map(Object.entries(initialSecrets));
  }

  async get(key: string, environment?: string): Promise<string | null> {
    const namespacedKey = environment ? `${environment}:${key}` : key;
    return this.storage.get(namespacedKey) || null;
  }

  async set(
    key: string,
    value: string,
    _required?: boolean,
    environment?: string
  ): Promise<void> {
    const namespacedKey = environment ? `${environment}:${key}` : key;
    this.storage.set(namespacedKey, value);
  }

  async delete(key: string, environment?: string): Promise<void> {
    const namespacedKey = environment ? `${environment}:${key}` : key;
    this.storage.delete(namespacedKey);
  }

  async list(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  /**
   * Get all secrets (for testing)
   */
  getAll(): Record<string, string> {
    return Object.fromEntries(this.storage);
  }

  /**
   * Set multiple secrets at once
   */
  setAll(secrets: Record<string, string>, environment?: string): void {
    for (const [key, value] of Object.entries(secrets)) {
      const namespacedKey = environment ? `${environment}:${key}` : key;
      this.storage.set(namespacedKey, value);
    }
  }
}

/**
 * Create a mock keychain instance
 */
export function createMockKeychain(
  initialSecrets?: Record<string, string>
): MockKeychain {
  return new MockKeychain(initialSecrets);
}
