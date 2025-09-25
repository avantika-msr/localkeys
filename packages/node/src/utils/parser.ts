/**
 * @module @localkeys/node/utils
 * @description Template file parser
 */

import fs from 'fs/promises';

/**
 * Template entry definition
 */
export interface TemplateEntry {
  key: string;
  required: boolean;
  description?: string;
  example?: string;
}

/**
 * Parse .env.template file
 *
 * Format:
 * ```
 * # Description
 * # Required
 * KEY_NAME=example_value
 * ```
 *
 * @param filePath - Path to template file
 * @returns Array of template entries
 */
export async function parseTemplate(
  filePath: string
): Promise<TemplateEntry[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseTemplateString(content);
  } catch (error) {
    // File not found is okay, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Parse template content string
 */
export function parseTemplateString(content: string): TemplateEntry[] {
  const entries: TemplateEntry[] = [];
  const lines = content.split('\n');

  let currentDescription: string[] = [];
  let currentRequired = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Parse comments
    if (trimmed.startsWith('#')) {
      const comment = trimmed.slice(1).trim();

      // Check for "Required" marker
      if (comment.toLowerCase() === 'required') {
        currentRequired = true;
      } else if (comment && !comment.startsWith('---')) {
        currentDescription.push(comment);
      }
      continue;
    }

    // Parse key=value
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && match[1]) {
      const key: string = match[1];
      const value = match[2] || '';

      const entry: TemplateEntry = {
        key,
        required: currentRequired || !value, // Required if marked OR no example
      };

      if (currentDescription.length > 0) {
        entry.description = currentDescription.join(' ');
      }

      if (value.length > 0) {
        entry.example = value;
      }

      entries.push(entry);

      // Reset for next entry
      currentDescription = [];
      currentRequired = false;
    }
  }

  return entries;
}

/**
 * Get required keys from template
 */
export function getRequiredKeys(entries: TemplateEntry[]): string[] {
  return entries.filter((e) => e.required).map((e) => e.key);
}

/**
 * Get optional keys from template
 */
export function getOptionalKeys(entries: TemplateEntry[]): string[] {
  return entries.filter((e) => !e.required).map((e) => e.key);
}
