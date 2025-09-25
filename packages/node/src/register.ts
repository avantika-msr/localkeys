/**
 * @module @localkeys/node/register
 * @description Node.js --require hook entry point
 *
 * Usage:
 * ```bash
 * node --require @localkeys/node/register app.js
 * ```
 *
 * Environment variables:
 * - LOCALKEYS_ENV: Override environment
 * - LOCALKEYS_DEBUG: Enable debug logging
 */

import { load } from './loader';
import { logger } from './utils/logger';

// Load secrets before application starts
(async () => {
  logger.debug('Loading secrets via --require hook');

  try {
    const options: any = {
      debug: process.env['LOCALKEYS_DEBUG'] === 'true',
    };

    const envVar = process.env['LOCALKEYS_ENV'];
    if (envVar) {
      options.environment = envVar;
    }

    const result = await load(options);

    if (!result.success) {
      logger.error('Failed to load secrets via --require hook');
      process.exit(1);
    }

    logger.debug(`Loaded ${result.count} secrets via --require hook`);
  } catch (error) {
    logger.error('Fatal error loading secrets:', error);
    process.exit(1);
  }
})();
