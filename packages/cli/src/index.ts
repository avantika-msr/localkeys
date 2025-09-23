// Re-export everything from @localkeys/core
export * from '@localkeys/core';

// Export CLI-specific utilities
export * from './utils';

// Note: './cli' is not exported to prevent CLI execution when importing from index
// The CLI should only run when ./cli.ts is executed directly

// CLI version
export const cliVersion = '0.1.7';
