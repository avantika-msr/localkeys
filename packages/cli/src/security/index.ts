/**
 * @module @localkeys/cli/security
 * @description Barrel export for all secret-security utilities.
 */

export {
  fullMask,
  partialMask,
  formatMasked,
  formatRevealed,
} from './maskSecret';

export {
  REVEAL_STDERR_WARNING,
  isStdoutTty,
  emitRevealWarning,
  promptConfirm,
  guardReveal,
} from './confirmReveal';

export type { RevealGuardOptions } from './confirmReveal';
