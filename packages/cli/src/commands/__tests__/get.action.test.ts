/**
 * @file get.action.test.ts
 * @description Integration tests for the `get` command action.
 *
 * Strategy: mock the OS keychain and the reveal guard's injectable deps so
 * tests run without any real keychain or filesystem access.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock @localkeys/core before importing the action ───────────────────────
vi.mock('@localkeys/core', () => {
  const mockKeychain = {
    get: vi.fn(),
  };
  const mockConfig = {
    getPackage: vi.fn(() => 'test-pkg'),
    getDefaultEnvironment: vi.fn(() => 'development'),
  };
  const mockConfigManager = {
    load: vi.fn(async () => mockConfig),
  };

  return {
    SystemKeychain: vi.fn(() => mockKeychain),
    ConfigManager: vi.fn(() => mockConfigManager),
    // expose refs so tests can control them
    __mockKeychain: mockKeychain,
    __mockConfig: mockConfig,
    __mockConfigManager: mockConfigManager,
  };
});

import { getAction } from '../../commands/get.action';
import * as core from '@localkeys/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockKeychain = (core as any).__mockKeychain as {
  get: ReturnType<typeof vi.fn>;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockConfigManager = (core as any).__mockConfigManager as {
  load: ReturnType<typeof vi.fn>;
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Capture stdout calls from the `log` utility (which uses console.log). */
function captureStdout() {
  const lines: string[] = [];
  const spy = vi
    .spyOn(console, 'log')
    .mockImplementation((...args: unknown[]) => {
      lines.push(args.map(String).join(' '));
    });
  return { lines, restore: () => spy.mockRestore() };
}

function captureStderr() {
  const lines: string[] = [];
  const spy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    lines.push(String(chunk));
    return true;
  });
  return { lines, restore: () => spy.mockRestore() };
}

/** Guard deps that always approves without prompting. */
const approvedDeps = {
  guardReveal: vi.fn(async () => true),
};

/** Guard deps that always rejects. */
const rejectedDeps = {
  guardReveal: vi.fn(async () => false),
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('getAction — masked output (default)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKeychain.get.mockResolvedValue('sk-abcdef1234');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints a masked value to stdout when --reveal is not set', async () => {
    const { lines, restore } = captureStdout();

    await getAction('API_KEY', {}, approvedDeps);

    restore();
    const output = lines.join('\n');
    // Should NOT contain the raw secret
    expect(output).not.toContain('sk-abcdef1234');
    // Should contain the key name
    expect(output).toContain('API_KEY');
    // Should contain masked portion (stars)
    expect(output).toMatch(/\*+/);
  });

  it('does not call guardReveal when --reveal is not set', async () => {
    const { restore } = captureStdout();
    const deps = { guardReveal: vi.fn(async () => true) };

    await getAction('API_KEY', {}, deps);

    restore();
    expect(deps.guardReveal).not.toHaveBeenCalled();
  });
});

describe('getAction — reveal output', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKeychain.get.mockResolvedValue('sk-abcdef1234');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints the full secret when --reveal is approved', async () => {
    const { lines, restore } = captureStdout();

    await getAction(
      'API_KEY',
      { reveal: true, yes: true, force: false },
      approvedDeps
    );

    restore();
    const output = lines.join('\n');
    expect(output).toContain('sk-abcdef1234');
    expect(output).toContain('API_KEY');
  });

  it('calls guardReveal with correct options when --reveal is set', async () => {
    const { restore } = captureStdout();
    const deps = { guardReveal: vi.fn(async () => true) };

    await getAction('SECRET', { reveal: true, yes: true, force: true }, deps);

    restore();
    expect(deps.guardReveal).toHaveBeenCalledWith('SECRET', {
      yes: true,
      force: true,
    });
  });
});

describe('getAction — confirmation rejection', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockKeychain.get.mockResolvedValue('sk-abcdef1234');
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exits with code 1 and does not print the secret when guard returns false', async () => {
    const { lines, restore } = captureStdout();

    await expect(
      getAction('API_KEY', { reveal: true }, rejectedDeps)
    ).rejects.toThrow('process.exit called');

    restore();
    const output = lines.join('\n');
    expect(output).not.toContain('sk-abcdef1234');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('getAction — fallback value', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKeychain.get.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints masked fallback when secret is missing and defaultFallback provided', async () => {
    const { lines, restore } = captureStdout();

    await getAction(
      'MISSING_KEY',
      { defaultFallback: 'fallback-value-123' },
      approvedDeps
    );

    restore();
    const output = lines.join('\n');
    // Fallback is also masked in default mode
    expect(output).not.toContain('fallback-value-123');
    expect(output).toContain('MISSING_KEY');
    // head + stars + tail (fall...-123)
    expect(output).toMatch(/fall\*+-123/);
  });

  it('exits when secret is missing and no fallback is provided', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    const { restore } = captureStdout();

    await expect(getAction('MISSING_KEY', {}, approvedDeps)).rejects.toThrow(
      'process.exit called'
    );

    restore();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});

describe('getAction — initialization guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exits when LocalKeys is not initialized (config is null)', async () => {
    mockConfigManager.load.mockResolvedValueOnce(null);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    await expect(getAction('API_KEY', {})).rejects.toThrow(
      'process.exit called'
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
