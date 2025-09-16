export const version = '0.1.0';

export * from './core';
export * from './utils';
// Note: './cli' is not exported to prevent CLI execution when importing from index
// The CLI should only run when ./cli.ts is executed directly
// ==== Export Types ====
export * from './types';
