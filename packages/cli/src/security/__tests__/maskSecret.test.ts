/**
 * @file maskSecret.test.ts
 * @description Unit tests for the pure secret-masking utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  fullMask,
  partialMask,
  formatMasked,
  formatRevealed,
} from '../../security/maskSecret';

describe('fullMask', () => {
  it('returns 8 asterisks for a long secret', () => {
    expect(fullMask('super-long-secret-value')).toBe('********');
  });

  it('returns asterisks equal to value length for short secrets (≤8 chars)', () => {
    expect(fullMask('abc')).toBe('***');
    expect(fullMask('abcdefgh')).toBe('********');
  });

  it('handles an empty string', () => {
    expect(fullMask('')).toBe('');
  });
});

describe('partialMask', () => {
  it('reveals first 4 and last 4 characters for long secrets', () => {
    const result = partialMask('sk-live-abcdef1234');
    // 'sk-l' (4) + '****' + '1234' (4)
    expect(result.startsWith('sk-l')).toBe(true);
    expect(result.endsWith('1234')).toBe(true);
    expect(result).toMatch(/^sk-l\*+1234$/);
  });

  it('falls back to fullMask for secrets shorter than 12 characters', () => {
    // 'tiny' is 4 chars
    expect(partialMask('tiny')).toBe('****');
    // 'ten_chars_' is 10 chars
    expect(partialMask('ten_chars_')).toBe('*'.repeat(8));
    // 'elevenchars' is 11 chars
    expect(partialMask('elevenchars')).toBe('*'.repeat(8));
  });

  it('shows correct star count for exactly 12-char secret', () => {
    // '1234567890ab' length=12, head='1234', tail='90ab', stars=4
    expect(partialMask('1234567890ab')).toBe('1234****90ab');
  });

  it('handles a longer secret correctly', () => {
    // 16 chars: '1234' + 8 stars + 'wxyz'
    expect(partialMask('1234567890abcdefwxyz')).toBe('1234************wxyz');
  });
});

describe('formatMasked', () => {
  it('formats as KEY=<masked>', () => {
    const result = formatMasked('API_KEY', 'sk-live-abcdef1234');
    // sk-l...1234
    expect(result).toMatch(/^API_KEY=sk-l\*+1234$/);
  });

  it('uses fullMask for short values', () => {
    const result = formatMasked('TOKEN', 'abc');
    expect(result).toBe('TOKEN=***');
  });
});

describe('formatRevealed', () => {
  it('formats as KEY=<full value>', () => {
    expect(formatRevealed('API_KEY', 'my-secret-123')).toBe(
      'API_KEY=my-secret-123'
    );
  });

  it('does not modify the secret value in any way', () => {
    const secret = 'sk-abcdef1234!@#$%';
    expect(formatRevealed('TOKEN', secret)).toBe(`TOKEN=${secret}`);
  });
});
