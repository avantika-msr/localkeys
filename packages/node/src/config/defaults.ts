/**
 * @module @localkeys/node/config
 * @description Default configuration values
 */

import { LoadOptions } from '../types';

/**
 * Default options for loading secrets
 */
export const DEFAULT_LOAD_OPTIONS: Required<
  Omit<LoadOptions, 'environment' | 'packageName' | 'templatePath' | 'keychain'>
> = {
  projectRoot: process.cwd(),
  debug: false,
  override: false,
  validate: true,
  processEnv: process.env,
};

/**
 * Default environment name
 */
export const DEFAULT_ENVIRONMENT = 'development';

/**
 * Default template file name
 */
export const DEFAULT_TEMPLATE_FILE = '.env.template';

/**
 * Environment variable name for debug mode
 */
export const DEBUG_ENV_VAR = 'LOCALKEYS_DEBUG';

/**
 * Environment variable name for environment override
 */
export const ENVIRONMENT_ENV_VAR = 'LOCALKEYS_ENV';
