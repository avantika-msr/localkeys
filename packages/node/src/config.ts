/**
 * @module @localkeys/node/config
 * @description Auto-loader entry point
 *
 * Usage:
 * ```javascript
 * // CommonJS
 * require('@localkeys/node/config');
 *
 * // ESM
 * import '@localkeys/node/config';
 * ```
 *
 * This will automatically load secrets from keychain into process.env
 */

import { load } from './loader';
import { logger } from './utils/logger';

// Auto-load on import
(async () => {
  try {
    logger.debug('Auto-loading secrets from keychain');

    const result = await load({
      debug: process.env['LOCALKEYS_DEBUG'] === 'true',
    });

    if (!result.success) {
      logger.error('Failed to auto-load secrets');

      if (result.errors.length > 0) {
        result.errors.forEach((err) => {
          logger.error(`  ${err.key}: ${err.message}`);
        });
      }

      // Don't exit in auto-load mode, just warn
      logger.warn(
        'Application will continue with existing environment variables'
      );
    } else {
      logger.debug(`Auto-loaded ${result.count} secrets`);
    }
  } catch (error) {
    logger.error('Failed to auto-load secrets:', error);
    logger.warn(
      'Application will continue with existing environment variables'
    );
  }
})();
