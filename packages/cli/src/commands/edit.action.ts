/**
 * @module @localkeys/cli/commands
 * @file edit.action.ts
 * @description Edit secrets interactively
 */

import inquirer from 'inquirer';
import { SystemKeychain } from '@localkeys/core';
import { ConfigManager } from '@localkeys/core';
import { ManifestManager } from '@localkeys/core';
import { error, success, verbose, info, LogTag, warn } from '../utils/logger';

export interface EditOptions {
  verbose?: boolean;
  env?: string;
  add?: boolean;
}

export async function editAction(
  key?: string,
  options: EditOptions = {}
): Promise<void> {
  const configManager = new ConfigManager();
  const manifestManager = new ManifestManager();

  verbose(options.verbose === true, LogTag.LOG, 'options:', options);

  const config = await configManager.load();
  if (!config) {
    error('LocalKeys not initialized. Run "lkeys init" first.');
    process.exit(1);
  }

  const packageName = config.getPackage();
  const defaultEnvironment = config.getDefaultEnvironment();
  const environment = options.env || defaultEnvironment;
  const keychain = new SystemKeychain(
    packageName,
    process.cwd(),
    defaultEnvironment
  );

  // Edit specific key
  if (key) {
    const currentValue = await keychain.get(key, options.env);
    const keyExists = await manifestManager.hasKey(packageName, key);
    const isCurrentlyRequired = keyExists
      ? await manifestManager.isKeyRequired(packageName, key)
      : true;

    if (!currentValue && !options.add) {
      warn(`Secret "${key}" not found in ${environment}.`);
      const { shouldAdd } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldAdd',
          message: 'Add it now?',
          default: true,
        },
      ]);

      if (!shouldAdd) {
        info('Cancelled.');
        return;
      }
    }

    const { newValue } = await inquirer.prompt([
      {
        type: 'password',
        name: 'newValue',
        message: currentValue
          ? `Update ${key} (${environment}):`
          : `New value for ${key} (${environment}):`,
        default: currentValue || '',
        mask: '*',
      },
    ]);

    if (!newValue || newValue.trim() === '') {
      error('Value cannot be empty');
      process.exit(1);
    }

    // Show current status and allow changing it
    const statusMessage = keyExists
      ? `Currently: ${isCurrentlyRequired ? 'required' : 'optional'}. Mark as optional?`
      : 'Is this secret optional?';

    const { isOptional } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'isOptional',
        message: statusMessage,
        default: !isCurrentlyRequired, // Default to current status
      },
    ]);

    await keychain.set(key, newValue, !isOptional, options.env);
    success(
      `✓ ${currentValue ? 'Updated' : 'Added'} ${key} in ${environment} environment`
    );
    return;
  }

  // Interactive menu: edit all or select
  const allKeys = await manifestManager.listKeys(packageName);

  if (allKeys.length === 0) {
    warn('No secrets found.');
    const { shouldAdd } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldAdd',
        message: 'Add your first secret?',
        default: true,
      },
    ]);

    if (!shouldAdd) return;

    const { key, value, isOptional } = await inquirer.prompt([
      {
        type: 'input',
        name: 'key',
        message: 'Secret name (e.g., API_KEY):',
        validate: (input) => (input.trim() ? true : 'Key cannot be empty'),
      },
      {
        type: 'password',
        name: 'value',
        message: 'Secret value:',
        mask: '*',
        validate: (input) => (input.trim() ? true : 'Value cannot be empty'),
      },
      {
        type: 'confirm',
        name: 'isOptional',
        message: 'Is this secret optional?',
        default: false,
      },
    ]);

    await keychain.set(key.trim(), value, !isOptional, options.env);
    success(`✓ Added ${key} to ${environment} environment`);
    info('\nTip: Use "lkeys edit" to edit all secrets at once');
    return;
  }

  // Show menu
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `What would you like to do? (${environment} environment)`,
      choices: [
        { name: 'Edit all secrets', value: 'all' },
        { name: 'Edit specific secret', value: 'select' },
        { name: 'Add new secret', value: 'add' },
        { name: 'Rename secret', value: 'rename' },
        { name: 'Cancel', value: 'cancel' },
      ],
    },
  ]);

  if (action === 'cancel') {
    info('Cancelled.');
    return;
  }

  if (action === 'add') {
    const { key, value, isOptional } = await inquirer.prompt([
      {
        type: 'input',
        name: 'key',
        message: 'Secret name:',
        validate: (input) => (input.trim() ? true : 'Key cannot be empty'),
      },
      {
        type: 'password',
        name: 'value',
        message: 'Secret value:',
        mask: '*',
        validate: (input) => (input.trim() ? true : 'Value cannot be empty'),
      },
      {
        type: 'confirm',
        name: 'isOptional',
        message: 'Is this secret optional?',
        default: false,
      },
    ]);

    await keychain.set(key.trim(), value, !isOptional, options.env);
    success(`✓ Added ${key} to ${environment} environment`);
    return;
  }

  if (action === 'select') {
    const { selectedKey } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedKey',
        message: 'Select secret to edit:',
        choices: allKeys,
      },
    ]);

    const currentValue = await keychain.get(selectedKey, options.env);
    const isCurrentlyRequired = await manifestManager.isKeyRequired(
      packageName,
      selectedKey
    );

    const { newValue } = await inquirer.prompt([
      {
        type: 'password',
        name: 'newValue',
        message: `Update ${selectedKey}:`,
        default: currentValue || '',
        mask: '*',
      },
    ]);

    if (!newValue || !newValue.trim()) {
      info('Cancelled.');
      return;
    }

    // Allow changing optional/required status
    const { isOptional } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'isOptional',
        message: `Currently: ${isCurrentlyRequired ? 'required' : 'optional'}. Mark as optional?`,
        default: !isCurrentlyRequired,
      },
    ]);

    await keychain.set(selectedKey, newValue, !isOptional, options.env);
    success(`✓ Updated ${selectedKey}`);
    return;
  }

  if (action === 'rename') {
    const { oldKey } = await inquirer.prompt([
      {
        type: 'list',
        name: 'oldKey',
        message: 'Select secret to rename:',
        choices: allKeys,
      },
    ]);

    const currentValue = await keychain.get(oldKey, options.env);

    if (!currentValue) {
      error(
        `Secret "${oldKey}" has no value in ${environment}. Cannot rename.`
      );
      return;
    }

    const isCurrentlyRequired = await manifestManager.isKeyRequired(
      packageName,
      oldKey
    );

    const { newKey } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newKey',
        message: `New name for "${oldKey}":`,
        validate: (input) => {
          if (!input.trim()) return 'Key name cannot be empty';
          if (input === oldKey) return 'New name must be different';
          if (allKeys.includes(input)) return `Key "${input}" already exists`;
          return true;
        },
      },
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Rename "${oldKey}" to "${newKey}"?`,
        default: true,
      },
    ]);

    if (!confirm) {
      info('Cancelled.');
      return;
    }

    // Atomic rename: copy to new key, then delete old key
    await keychain.set(newKey, currentValue, isCurrentlyRequired, options.env);
    await keychain.delete(oldKey, options.env);

    success(`✓ Renamed ${oldKey} → ${newKey}`);
    info('\nReminder: Update your code to use the new key name!');
    return;
  }

  // Edit all
  info(`\nEdit secrets for ${environment} environment:\n`);

  const answers: Record<string, string> = {};

  for (const key of allKeys) {
    const currentValue = await keychain.get(key, options.env);

    const { value } = await inquirer.prompt([
      {
        type: 'password',
        name: 'value',
        message: `${key}:`,
        default: currentValue || '',
        mask: '*',
      },
    ]);

    if (value && value.trim()) {
      answers[key] = value;
    }
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Save changes to ${Object.keys(answers).length} secret(s)?`,
      default: true,
    },
  ]);

  if (confirm) {
    for (const [key, value] of Object.entries(answers)) {
      await keychain.set(key, value, true, options.env);
    }
    success(`✓ Updated ${Object.keys(answers).length} secret(s)`);
  } else {
    info('Cancelled.');
  }
}
