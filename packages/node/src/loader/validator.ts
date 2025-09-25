/**
 * @module @localkeys/node/loader
 * @description Secret validation
 */

import { ValidationError as ValidationErrorType } from '../types';
import { TemplateEntry } from '../utils/parser';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationErrorType[];
  missing: string[];
  present: string[];
}

/**
 * Validate loaded secrets against template
 *
 * @param loaded - Secrets that were loaded
 * @param template - Template entries
 * @returns Validation result
 */
export function validateSecrets(
  loaded: Record<string, string>,
  template: TemplateEntry[]
): ValidationResult {
  const errors: ValidationErrorType[] = [];
  const missing: string[] = [];
  const present: string[] = [];

  // Check each required key
  for (const entry of template) {
    if (entry.required) {
      if (loaded[entry.key]) {
        present.push(entry.key);
      } else {
        missing.push(entry.key);
        errors.push({
          key: entry.key,
          message: `Required secret "${entry.key}" is not set${
            entry.description ? `: ${entry.description}` : ''
          }`,
          required: true,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missing,
    present,
  };
}

/**
 * Validate against manifest (fallback if no template)
 */
export function validateAgainstManifest(
  loaded: Record<string, string>,
  requiredKeys: string[]
): ValidationResult {
  const errors: ValidationErrorType[] = [];
  const missing: string[] = [];
  const present: string[] = [];

  for (const key of requiredKeys) {
    if (loaded[key]) {
      present.push(key);
    } else {
      missing.push(key);
      errors.push({
        key,
        message: `Required secret "${key}" is not set`,
        required: true,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missing,
    present,
  };
}
