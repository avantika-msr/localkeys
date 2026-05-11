/**
 * @file confirmReveal.test.ts
 * @description Unit tests for the reveal guard — covers TTY detection,
 * interactive confirmation, --yes bypass, --force bypass, and stderr warnings.
 *
 * All tests use injectable deps so no real stdin/stdout/stderr is touched.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import inquirer from 'inquirer';
import {
  guardReveal,
  REVEAL_STDERR_WARNING,
  emitRevealWarning,
  promptConfirm,
} from '../../security/confirmReveal';

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

// ── Shared dep factories ────────────────────────────────────────────────────

const ttyDeps = (confirmResult: boolean) => ({
  isStdoutTty: () => true,
  promptConfirm: vi.fn(async () => confirmResult),
  emitRevealWarning: vi.fn(),
});

const nonTtyDeps = (confirmResult = true) => ({
  isStdoutTty: () => false,
  promptConfirm: vi.fn(async () => confirmResult),
  emitRevealWarning: vi.fn(),
});

// ── promptConfirm ───────────────────────────────────────────────────────────

describe('promptConfirm', () => {
  it('returns true when inquirer resolves confirmed: true', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValueOnce({ confirmed: true });
    const result = await promptConfirm('Test message');
    expect(result).toBe(true);
    expect(inquirer.prompt).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'confirm',
          name: 'confirmed',
          message: 'Test message\nContinue?',
        }),
      ])
    );
  });

  it('returns false when inquirer resolves confirmed: false', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValueOnce({ confirmed: false });
    const result = await promptConfirm('Test message');
    expect(result).toBe(false);
  });
});

// ── emitRevealWarning ───────────────────────────────────────────────────────

describe('emitRevealWarning', () => {
  it('writes the warning message to stderr', () => {
    const stderrSpy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    emitRevealWarning();

    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining(REVEAL_STDERR_WARNING)
    );

    stderrSpy.mockRestore();
  });
});

// ── guardReveal — TTY environment ──────────────────────────────────────────

describe('guardReveal (TTY environment)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true and emits warning when user confirms in TTY', async () => {
    const deps = ttyDeps(true);
    const result = await guardReveal(
      'API_KEY',
      { yes: false, force: false },
      deps
    );

    expect(result).toBe(true);
    expect(deps.promptConfirm).toHaveBeenCalledOnce();
    expect(deps.emitRevealWarning).toHaveBeenCalledOnce();
  });

  it('returns false and does NOT emit warning when user rejects in TTY', async () => {
    const deps = ttyDeps(false);
    const result = await guardReveal(
      'API_KEY',
      { yes: false, force: false },
      deps
    );

    expect(result).toBe(false);
    expect(deps.promptConfirm).toHaveBeenCalledOnce();
    expect(deps.emitRevealWarning).not.toHaveBeenCalled();
  });

  it('skips the prompt when --yes is set and emits warning', async () => {
    const deps = ttyDeps(true);
    const result = await guardReveal(
      'API_KEY',
      { yes: true, force: false },
      deps
    );

    expect(result).toBe(true);
    expect(deps.promptConfirm).not.toHaveBeenCalled();
    expect(deps.emitRevealWarning).toHaveBeenCalledOnce();
  });
});

// ── guardReveal — non-TTY environment ─────────────────────────────────────

describe('guardReveal (non-TTY environment)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false and writes error to stderr when not a TTY and --force not set', async () => {
    const stderrSpy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    const deps = nonTtyDeps();

    const result = await guardReveal(
      'API_KEY',
      { yes: false, force: false },
      deps
    );

    expect(result).toBe(false);
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('stdout is not a TTY')
    );
    expect(deps.promptConfirm).not.toHaveBeenCalled();
    expect(deps.emitRevealWarning).not.toHaveBeenCalled();

    stderrSpy.mockRestore();
  });

  it('returns false with non-TTY even if --yes is set but --force is missing', async () => {
    const stderrSpy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    const deps = nonTtyDeps();

    const result = await guardReveal(
      'API_KEY',
      { yes: true, force: false },
      deps
    );

    expect(result).toBe(false);
    expect(deps.promptConfirm).not.toHaveBeenCalled();

    stderrSpy.mockRestore();
  });

  it('returns true with non-TTY when --force is set (and skips prompt with --yes)', async () => {
    const deps = nonTtyDeps(true);

    const result = await guardReveal(
      'API_KEY',
      { yes: true, force: true },
      deps
    );

    expect(result).toBe(true);
    expect(deps.promptConfirm).not.toHaveBeenCalled();
    expect(deps.emitRevealWarning).toHaveBeenCalledOnce();
  });

  it('still prompts interactively in non-TTY when --force is set but --yes is not', async () => {
    const deps = nonTtyDeps(true);

    const result = await guardReveal(
      'API_KEY',
      { yes: false, force: true },
      deps
    );

    expect(result).toBe(true);
    expect(deps.promptConfirm).toHaveBeenCalledOnce();
    expect(deps.emitRevealWarning).toHaveBeenCalledOnce();
  });

  it('returns false in non-TTY with --force when user rejects the prompt', async () => {
    const deps = nonTtyDeps(false);

    const result = await guardReveal(
      'API_KEY',
      { yes: false, force: true },
      deps
    );

    expect(result).toBe(false);
    expect(deps.emitRevealWarning).not.toHaveBeenCalled();
  });
});

// ── REVEAL_STDERR_WARNING constant ─────────────────────────────────────────

describe('REVEAL_STDERR_WARNING', () => {
  it('contains the localkeys tag', () => {
    expect(REVEAL_STDERR_WARNING).toContain('[localkeys]');
  });

  it('mentions logs/history as risk vectors', () => {
    expect(REVEAL_STDERR_WARNING).toMatch(/logs.*history|history.*logs/i);
  });
});
