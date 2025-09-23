# LocalKeys Implementation Guidebook

## Your Complete Roadmap from Day 1 to Launch

---

# 📋 Table of Contents

1. [Pre-Development (Day 0)](#phase-0-pre-development-day-0)
2. [Week 1: Foundation](#week-1-foundation-days-1-7)
3. [Week 2: Core Features](#week-2-core-features-days-8-14)
4. [Week 3: Runners & Integration](#week-3-runners--integration-days-15-21)
5. [Week 4: Polish & Release](#week-4-polish--release-days-22-28)
6. [Post-Launch](#post-launch-day-29)

---

# Phase 0: Pre-Development (Day 0)

## 🎯 Objective

Set up your development environment and project structure correctly from the start.

## 📝 Tasks

### Task 0.1: Install Required Tools (30 minutes)

**What to install:**

```bash
# 1. Node.js (v18 or higher)
# Download from: https://nodejs.org/

# 2. pnpm (fast package manager)
npm install -g pnpm

# 3. Visual Studio Code (recommended)
# Download from: https://code.visualstudio.com/

# 4. Git
# Download from: https://git-scm.com/

# Verify installations
node --version    # Should show v18.x or higher
pnpm --version    # Should show 8.x or higher
git --version     # Should show any version
```

**VSCode Extensions to Install:**

- ESLint
- Prettier
- TypeScript + JavaScript
- GitLens
- Error Lens
- Thunder Client (for API testing later)

### Task 0.2: Create Project Structure (15 minutes)

```bash
# 1. Create root directory
mkdir localkeys
cd localkeys

# 2. Initialize Git
git init
git branch -M main

# 3. Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
*.tsbuildinfo
EOF

# 4. Initialize pnpm workspace
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
EOF

# 5. Create root package.json
pnpm init

# 6. Create directory structure
mkdir -p packages/cli/src/{commands,core,utils}
mkdir -p packages/node/src
mkdir -p packages/runner-python/localkeys
mkdir -p scripts
mkdir -p docs
```

### Task 0.3: Setup Root Configuration (20 minutes)

**Root `package.json`:**

```json
{
  "name": "localkeys-monorepo",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @localkeys/cli dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "format": "prettier --write \"packages/**/*.{ts,tsx,js,json}\""
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3",
    "prettier": "^3.1.1",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "vitest": "^1.0.4"
  }
}
```

**Install root dependencies:**

```bash
pnpm install
```

**Create `.prettierrc`:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

**Create `tsconfig.base.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## ✅ Checkpoint: Day 0 Complete

**You should have:**

- ✅ All tools installed and working
- ✅ Project structure created
- ✅ Git repository initialized
- ✅ VSCode with extensions

**Test it:**

```bash
pnpm --version  # Should work
tree -L 3       # Should show clean structure
git status      # Should show untracked files
```

---

# Week 1: Foundation (Days 1-7)

## Day 1: Keychain Module (Core Foundation)

### 🎯 Objective

Get secrets storing and retrieving from OS keychain. This is the MOST IMPORTANT module - everything depends on it.

### 📝 Tasks

#### Task 1.1: Setup CLI Package (30 min)

```bash
cd packages/cli
pnpm init

# Edit package.json
cat > package.json << 'EOF'
{
  "name": "@localkeys/cli",
  "version": "0.1.0",
  "main": "dist/index.js",
  "bin": {
    "localkeys": "dist/index.js"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format cjs --clean",
    "test": "vitest"
  },
  "dependencies": {
    "keytar": "^7.9.0",
    "chalk": "^4.1.2"
  },
  "devDependencies": {
    "@types/keytar": "^4.4.2",
    "tsx": "^4.7.0",
    "tsup": "^8.0.1"
  }
}
EOF

pnpm install
```

**Create `tsconfig.json`:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Task 1.2: Create Keychain Module (2 hours)

**File**: `packages/cli/src/core/keychain.ts`

```typescript
import keytar from '@electron/keytar';

const SERVICE_NAME = 'io.localkeys.secrets';

export interface KeychainProvider {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<boolean>;
  list(): Promise<string[]>;
}

export class SystemKeychain implements KeychainProvider {
  async set(key: string, value: string): Promise<void> {
    try {
      await keytar.setPassword(SERVICE_NAME, key, value);
      console.log(`✓ Stored ${key} in keychain`);
    } catch (error) {
      throw new Error(`Failed to store ${key}: ${error.message}`);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await keytar.getPassword(SERVICE_NAME, key);
    } catch (error) {
      throw new Error(`Failed to retrieve ${key}: ${error.message}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return await keytar.deletePassword(SERVICE_NAME, key);
    } catch (error) {
      throw new Error(`Failed to delete ${key}: ${error.message}`);
    }
  }

  async list(): Promise<string[]> {
    try {
      const credentials = await keytar.findCredentials(SERVICE_NAME);
      return credentials.map((c) => c.account);
    } catch (error) {
      throw new Error(`Failed to list secrets: ${error.message}`);
    }
  }
}

export function createKeychain(): KeychainProvider {
  return new SystemKeychain();
}
```

#### Task 1.3: Test Keychain (1 hour)

**Create test file**: `packages/cli/src/core/__tests__/keychain.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SystemKeychain } from '../keychain';

describe('SystemKeychain', () => {
  let keychain: SystemKeychain;
  const testKey = `TEST_KEY_${Date.now()}`;
  const testValue = 'test_secret_value';

  beforeEach(() => {
    keychain = new SystemKeychain();
  });

  afterEach(async () => {
    await keychain.delete(testKey);
  });

  it('should store and retrieve a secret', async () => {
    await keychain.set(testKey, testValue);
    const retrieved = await keychain.get(testKey);
    expect(retrieved).toBe(testValue);
  });

  it('should return null for non-existent key', async () => {
    const value = await keychain.get('DOES_NOT_EXIST');
    expect(value).toBeNull();
  });

  it('should delete a secret', async () => {
    await keychain.set(testKey, testValue);
    const deleted = await keychain.delete(testKey);
    expect(deleted).toBe(true);

    const value = await keychain.get(testKey);
    expect(value).toBeNull();
  });

  it('should list all secrets', async () => {
    await keychain.set(testKey, testValue);
    const list = await keychain.list();
    expect(list).toContain(testKey);
  });
});
```

**Run tests:**

```bash
pnpm test
```

#### Task 1.4: Manual Testing (30 min)

**Create manual test script**: `packages/cli/src/test-keychain.ts`

```typescript
import { createKeychain } from './core/keychain';

async function testKeychain() {
  console.log('Testing keychain functionality...\n');

  const keychain = createKeychain();

  try {
    // Test 1: Set
    console.log('1. Testing SET...');
    await keychain.set('TEST_API_KEY', 'secret123');

    // Test 2: Get
    console.log('2. Testing GET...');
    const value = await keychain.get('TEST_API_KEY');
    console.log(`   Retrieved: ${value}`);

    // Test 3: List
    console.log('3. Testing LIST...');
    const secrets = await keychain.list();
    console.log(`   Found ${secrets.length} secrets`);

    // Test 4: Delete
    console.log('4. Testing DELETE...');
    await keychain.delete('TEST_API_KEY');
    console.log('   Deleted successfully');

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testKeychain();
```

**Run it:**

```bash
pnpm tsx src/test-keychain.ts
```

## ✅ Checkpoint: Day 1 Complete

**You should have:**

- ✅ Keychain module working on your machine
- ✅ Tests passing
- ✅ Manual verification successful

**If it doesn't work:**

- macOS: Check keychain access permissions
- Windows: Ensure you're running as admin (first time)
- Linux: Install `libsecret-1-dev`: `sudo apt-get install libsecret-1-dev`

---

## Day 2-3: CLI Framework & Commands

### 🎯 Objective

Build the command-line interface skeleton and basic commands (init, set, get).

### 📝 Tasks

#### Task 2.1: Setup CLI Framework (1 hour)

**Install dependencies:**

```bash
cd packages/cli
pnpm add commander ora inquirer
pnpm add -D @types/inquirer
```

**Create CLI entry**: `packages/cli/src/index.ts`

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { setCommand } from './commands/set';
import { getCommand } from './commands/get';
import { listCommand } from './commands/list';

const program = new Command();

program
  .name('localkeys')
  .description('Local-first secret management for developers')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize LocalKeys in the current directory')
  .action(initCommand);

program
  .command('set <key> <value>')
  .description('Store a secret in the OS keychain')
  .action(setCommand);

program
  .command('get <key>')
  .description('Retrieve a secret from the OS keychain')
  .option('-j, --json', 'Output as JSON')
  .action(getCommand);

program
  .command('list')
  .description('List all stored secrets')
  .action(listCommand);

program.parse();
```

#### Task 2.2: Implement INIT Command (2 hours)

**File**: `packages/cli/src/commands/init.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

export async function initCommand() {
  const spinner = ora('Initializing LocalKeys...').start();

  try {
    const cwd = process.cwd();

    // Check if already initialized
    const localkeysDir = path.join(cwd, '.localkeys');
    try {
      await fs.access(localkeysDir);
      spinner.warn(
        chalk.yellow('LocalKeys already initialized in this directory')
      );
      return;
    } catch {
      // Not initialized, continue
    }

    // Create .localkeys directory
    await fs.mkdir(localkeysDir);

    // Create .env.tpl template
    const template = {
      version: '1.0',
      secrets: [
        {
          name: 'EXAMPLE_SECRET',
          description: 'An example secret - delete this',
          required: false,
          scope: 'development',
        },
      ],
    };

    await fs.writeFile(
      path.join(cwd, '.env.tpl'),
      JSON.stringify(template, null, 2)
    );

    // Create empty .env.redacted
    await fs.writeFile(
      path.join(cwd, '.env.redacted'),
      '# LocalKeys Redacted Secrets\n'
    );

    // Create config
    const config = {
      version: '1.0',
      placeholderStrategy: 'random',
    };

    await fs.writeFile(
      path.join(localkeysDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    // Update .gitignore
    await updateGitignore(cwd);

    spinner.succeed(chalk.green('✓ LocalKeys initialized successfully!'));

    console.log(chalk.blue('\n📝 Next steps:'));
    console.log(chalk.white('  1. Edit .env.tpl to define your secrets'));
    console.log(chalk.white('  2. Run: localkeys set SECRET_NAME value'));
    console.log(chalk.white('  3. Commit .env.tpl and .env.redacted to Git'));
    console.log(chalk.dim('\n  Tip: .localkeys/ is automatically gitignored\n'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

async function updateGitignore(cwd: string): Promise<void> {
  const gitignorePath = path.join(cwd, '.gitignore');
  let content = '';

  try {
    content = await fs.readFile(gitignorePath, 'utf-8');
  } catch {
    // File doesn't exist, create it
  }

  const localkeysSection = `
# LocalKeys
.localkeys/
.env
.env.local
*.env.local
`;

  if (!content.includes('.localkeys/')) {
    content += localkeysSection;
    await fs.writeFile(gitignorePath, content);
  }
}
```

#### Task 2.3: Implement SET Command (1.5 hours)

**File**: `packages/cli/src/commands/set.ts`

```typescript
import chalk from 'chalk';
import ora from 'ora';
import { createKeychain } from '../core/keychain';
import { generatePlaceholder, updateRedactedFile } from '../utils/helpers';

export async function setCommand(key: string, value: string) {
  const spinner = ora(`Storing secret: ${key}`).start();

  try {
    // Store in keychain
    const keychain = createKeychain();
    await keychain.set(key, value);

    // Generate placeholder
    const placeholder = generatePlaceholder(key, value);

    // Update .env.redacted
    await updateRedactedFile(key, placeholder);

    spinner.succeed(chalk.green(`✓ Secret '${key}' stored successfully`));
    console.log(chalk.dim(`  Placeholder: ${placeholder}`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to store secret'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

#### Task 2.4: Implement GET Command (1 hour)

**File**: `packages/cli/src/commands/get.ts`

```typescript
import chalk from 'chalk';
import { createKeychain } from '../core/keychain';

export async function getCommand(key: string, options: { json?: boolean }) {
  try {
    const keychain = createKeychain();
    const value = await keychain.get(key);

    if (!value) {
      console.log(chalk.yellow(`Secret '${key}' not found`));
      process.exit(1);
    }

    if (options.json) {
      console.log(JSON.stringify({ [key]: value }));
    } else {
      console.log(value);
    }
  } catch (error) {
    console.error(chalk.red('Failed to retrieve secret'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

#### Task 2.5: Implement LIST Command (1 hour)

**File**: `packages/cli/src/commands/list.ts`

```typescript
import chalk from 'chalk';
import { createKeychain } from '../core/keychain';

export async function listCommand() {
  try {
    const keychain = createKeychain();
    const secrets = await keychain.list();

    if (secrets.length === 0) {
      console.log(chalk.yellow('No secrets stored'));
      return;
    }

    console.log(chalk.blue(`\n📦 Stored secrets (${secrets.length}):\n`));
    secrets.forEach((secret) => {
      console.log(chalk.white(`  • ${secret}`));
    });
    console.log();
  } catch (error) {
    console.error(chalk.red('Failed to list secrets'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

#### Task 2.6: Create Helper Utilities (1 hour)

**File**: `packages/cli/src/utils/helpers.ts`

```typescript
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export function generatePlaceholder(key: string, value: string): string {
  const tag = crypto.randomBytes(3).toString('hex');
  return `redacted:${key}:${tag}`;
}

export async function updateRedactedFile(
  key: string,
  placeholder: string
): Promise<void> {
  const redactedPath = path.join(process.cwd(), '.env.redacted');

  let content = '';
  try {
    content = await fs.readFile(redactedPath, 'utf-8');
  } catch {
    // File doesn't exist
  }

  const lines = content.split('\n').filter((line) => line.trim());
  const existingIndex = lines.findIndex((line) => line.startsWith(`${key}=`));

  if (existingIndex !== -1) {
    lines[existingIndex] = `${key}=${placeholder}`;
  } else {
    lines.push(`${key}=${placeholder}`);
  }

  lines.sort();
  await fs.writeFile(redactedPath, lines.join('\n') + '\n');
}

export function parsePlaceholder(placeholder: string): {
  key: string;
  tag: string;
} | null {
  const match = placeholder.match(/^redacted:([^:]+):([^:]+)$/);
  if (!match) return null;

  return {
    key: match[1],
    tag: match[2],
  };
}
```

#### Task 2.7: Test CLI Commands (1 hour)

**Manual test script:**

```bash
# Build CLI
pnpm build

# Test init
./dist/index.js init

# Test set
./dist/index.js set DATABASE_URL postgres://localhost/mydb
./dist/index.js set API_KEY sk_test_12345

# Test list
./dist/index.js list

# Test get
./dist/index.js get DATABASE_URL
./dist/index.js get API_KEY --json

# Check .env.redacted
cat .env.redacted
```

## ✅ Checkpoint: Day 2-3 Complete

**You should have:**

- ✅ Working CLI with 4 commands
- ✅ Secrets storing in keychain
- ✅ .env.redacted file updating
- ✅ Manual tests passing

**Test the complete flow:**

```bash
mkdir test-project
cd test-project
localkeys init
localkeys set MY_SECRET hello123
localkeys get MY_SECRET
cat .env.redacted  # Should show redacted:MY_SECRET:abc123
```

---

## Day 4-5: Config Parser & Validation

### 🎯 Objective

Parse .env.tpl files and validate secrets against defined schemas.

### 📝 Tasks

#### Task 4.1: Install Dependencies (15 min)

```bash
cd packages/cli
pnpm add zod ajv toml
```

#### Task 4.2: Create Config Module (2 hours)

**File**: `packages/cli/src/core/config.ts`

```typescript
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

const SecretDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  required: z.boolean().default(true),
  default: z.string().optional(),
  validator: z.enum(['url', 'email', 'base64', 'regex', 'length']).optional(),
  validatorPattern: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  rotationDays: z.number().optional(),
  scope: z.enum(['development', 'staging', 'production', 'all']).default('all'),
});

const EnvTemplateSchema = z.object({
  version: z.string(),
  secrets: z.array(SecretDefinitionSchema),
});

export type SecretDefinition = z.infer<typeof SecretDefinitionSchema>;
export type EnvTemplate = z.infer<typeof EnvTemplateSchema>;

export class ConfigManager {
  constructor(private projectPath: string) {}

  async readTemplate(): Promise<EnvTemplate> {
    const templatePath = path.join(this.projectPath, '.env.tpl');

    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      const parsed = JSON.parse(content);
      return EnvTemplateSchema.parse(parsed);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('.env.tpl not found. Run "localkeys init" first.');
      }
      throw new Error(`Failed to parse .env.tpl: ${error.message}`);
    }
  }

  async readRedacted(): Promise<Map<string, string>> {
    const redactedPath = path.join(this.projectPath, '.env.redacted');

    try {
      const content = await fs.readFile(redactedPath, 'utf-8');
      const map = new Map<string, string>();

      content.split('\n').forEach((line) => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value) {
            map.set(key.trim(), value.trim());
          }
        }
      });

      return map;
    } catch {
      return new Map();
    }
  }

  async validateSecret(
    definition: SecretDefinition,
    value: string
  ): Promise<{ valid: boolean; error?: string }> {
    if (!definition.validator) {
      return { valid: true };
    }

    try {
      switch (definition.validator) {
        case 'url':
          new URL(value);
          return { valid: true };

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return { valid: false, error: 'Invalid email format' };
          }
          return { valid: true };

        case 'base64':
          const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
          if (!base64Regex.test(value)) {
            return { valid: false, error: 'Invalid base64 format' };
          }
          return { valid: true };

        case 'regex':
          if (!definition.validatorPattern) {
            return { valid: true };
          }
          const regex = new RegExp(definition.validatorPattern);
          if (!regex.test(value)) {
            return {
              valid: false,
              error: `Must match pattern: ${definition.validatorPattern}`,
            };
          }
          return { valid: true };

        case 'length':
          const len = value.length;
          if (definition.minLength && len < definition.minLength) {
            return {
              valid: false,
              error: `Must be at least ${definition.minLength} characters`,
            };
          }
          if (definition.maxLength && len > definition.maxLength) {
            return {
              valid: false,
              error: `Must be at most ${definition.maxLength} characters`,
            };
          }
          return { valid: true };

        default:
          return { valid: true };
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async getSecretDefinition(key: string): Promise<SecretDefinition | null> {
    const template = await this.readTemplate();
    return template.secrets.find((s) => s.name === key) || null;
  }
}
```

#### Task 4.3: Update SET Command with Validation (1 hour)

**Update**: `packages/cli/src/commands/set.ts`

```typescript
import chalk from 'chalk';
import ora from 'ora';
import { createKeychain } from '../core/keychain';
import { ConfigManager } from '../core/config';
import { generatePlaceholder, updateRedactedFile } from '../utils/helpers';

export async function setCommand(key: string, value: string) {
  const spinner = ora(`Storing secret: ${key}`).start();

  try {
    const config = new ConfigManager(process.cwd());

    // Check if secret is defined in .env.tpl
    spinner.text = 'Validating secret...';
    const definition = await config.getSecretDefinition(key);

    if (!definition) {
      spinner.warn(
        chalk.yellow(
          `Warning: '${key}' is not defined in .env.tpl. Consider adding it.`
        )
      );
    } else {
      // Validate value
      const validation = await config.validateSecret(definition, value);
      if (!validation.valid) {
        spinner.fail(chalk.red(`Validation failed: ${validation.error}`));
        process.exit(1);
      }
    }

    // Store in keychain
    spinner.text = 'Storing in keychain...';
    const keychain = createKeychain();
    await keychain.set(key, value);

    // Generate placeholder
    const placeholder = generatePlaceholder(key, value);

    // Update .env.redacted
    spinner.text = 'Updating .env.redacted...';
    await updateRedactedFile(key, placeholder);

    spinner.succeed(chalk.green(`✓ Secret '${key}' stored successfully`));
    console.log(chalk.dim(`  Placeholder: ${placeholder}`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to store secret'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

#### Task 4.4: Add VALIDATE Command (1.5 hours)

**File**: `packages/cli/src/commands/validate.ts`

```typescript
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../core/config';
import { createKeychain } from '../core/keychain';

export async function validateCommand() {
  const spinner = ora('Validating project configuration...').start();

  try {
    const config = new ConfigManager(process.cwd());
    const keychain = createKeychain();

    // Read template
    const template = await config.readTemplate();
    const redacted = await config.readRedacted();
    const stored = await keychain.list();

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required secrets
    for (const secret of template.secrets) {
      if (!secret.required) continue;

      // Check if in .env.redacted
      if (!redacted.has(secret.name)) {
        errors.push(`Missing in .env.redacted: ${secret.name}`);
      }

      // Check if in keychain
      if (!stored.includes(secret.name)) {
        errors.push(`Missing in keychain: ${secret.name}`);
      }
    }

    // Check for undefined secrets in .env.redacted
    for (const [key] of redacted) {
      const defined = template.secrets.find((s) => s.name === key);
      if (!defined) {
        warnings.push(`'${key}' in .env.redacted but not defined in .env.tpl`);
      }
    }

    spinner.stop();

    if (errors.length === 0 && warnings.length === 0) {
      console.log(chalk.green('✓ Configuration is valid'));
      return;
    }

    if (errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:\n'));
      errors.forEach((err) => console.log(chalk.red(`  • ${err}`)));
    }

    if (warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:\n'));
      warnings.forEach((warn) => console.log(chalk.yellow(`  • ${warn}`)));
    }

    if (errors.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(chalk.red('Validation failed'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

**Add to CLI**: Update `src/index.ts`

```typescript
import { validateCommand } from './commands/validate';

program
  .command('validate')
  .description('Validate configuration against .env.tpl')
  .action(validateCommand);
```

## ✅ Checkpoint: Day 4-5 Complete

**You should have:**

- ✅ Config parser working
- ✅ Validation system functional
- ✅ Validate command working

**Test it:**

```bash
# Create a .env.tpl with validators
cat > .env.tpl << 'EOF'
{
  "version": "1.0",
  "secrets": [
    {
      "name": "DATABASE_URL",
      "required": true,
      "validator": "url"
    },
    {
      "name": "API_KEY",
      "required": true,
      "validator": "length",
      "minLength": 32
    }
  ]
}
EOF

# Try invalid values
localkeys set DATABASE_URL "not-a-url"  # Should fail
localkeys set API_KEY "short"            # Should fail

# Try valid values
localkeys set DATABASE_URL "postgresql://localhost/db"
localkeys set API_KEY "a".repeat(32)

# Validate
localkeys validate  # Should pass
```

---

## Day 6-7: DIFF Command & Git Integration

### 🎯 Objective

Show differences between template and actual state, install Git hooks.

### 📝 Tasks

#### Task 6.1: Implement DIFF Command (2 hours)

**File**: `packages/cli/src/commands/diff.ts`

```typescript
import chalk from 'chalk';
import { ConfigManager } from '../core/config';
import { createKeychain } from '../core/keychain';

export async function diffCommand() {
  try {
    const config = new ConfigManager(process.cwd());
    const keychain = createKeychain();

    const template = await config.readTemplate();
    const redacted = await config.readRedacted();
    const stored = await keychain.list();

    console.log(chalk.blue('\n📊 Configuration Status:\n'));

    let hasDifferences = false;

    for (const secret of template.secrets) {
      const inRedacted = redacted.has(secret.name);
      const inKeychain = stored.includes(secret.name);

      let status = '';
      if (inRedacted && inKeychain) {
        status = chalk.green('✓');
      } else if (!inRedacted && !inKeychain) {
        status = chalk.red('✗ MISSING');
        hasDifferences = true;
      } else if (inKeychain && !inRedacted) {
        status = chalk.yellow('⚠ Not in .env.redacted');
        hasDifferences = true;
      } else {
        status = chalk.yellow('⚠ Not in keychain');
        hasDifferences = true;
      }

      const requiredBadge = secret.required
        ? chalk.red('REQUIRED')
        : chalk.dim('optional');

      console.log(
        `  ${status} ${chalk.white(secret.name.padEnd(30))} ${requiredBadge}`
      );
    }

    // Check for secrets not in template
    const undefinedSecrets = [...redacted.keys()].filter(
      (key) => !template.secrets.find((s) => s.name === key)
    );

    if (undefinedSecrets.length > 0) {
      console.log(chalk.yellow('\n⚠️  Secrets not defined in .env.tpl:'));
      undefinedSecrets.forEach((key) => {
        console.log(chalk.yellow(`  • ${key}`));
      });
      hasDifferences = true;
    }

    console.log();

    if (!hasDifferences) {
      console.log(chalk.green('✓ Everything is in sync!\n'));
    } else {
      console.log(chalk.yellow('Run "localkeys set" to add missing secrets.\n'));
    }
  } catch (error) {
    console.error(chalk.red('Failed to generate diff'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

#### Task 6.2: Git Hooks Module (2 hours)

**File**: `packages/cli/src/core/git.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export class GitManager {
  constructor(private projectPath: string) {}

  async isGitRepo(): Promise<boolean> {
    try {
      const gitDir = path.join(this.projectPath, '.git');
      await fs.access(gitDir);
      return true;
    } catch {
      return false;
    }
  }

  async installPreCommitHook(): Promise<void> {
    const hooksDir = path.join(this.projectPath, '.git', 'hooks');
    const hookPath = path.join(hooksDir, 'pre-commit');

    // Ensure hooks directory exists
    await fs.mkdir(hooksDir, { recursive: true });

    const hookContent = `#!/bin/bash
# LocalKeys pre-commit hook

echo "🔒 LocalKeys: Checking for exposed secrets..."

# Check if any .env files (except .env.tpl and .env.redacted) are staged
if git diff --cached --name-only | grep -E "^\\.env$|^\\.env\\.local$"; then
  echo "❌ Error: Attempted to commit .env or .env.local file"
  echo "   These files contain secrets and should not be committed."
  echo ""
  echo "   To fix:"
  echo "   1. Remove the file from staging: git reset HEAD .env"
  echo "   2. Add to .gitignore if not already there"
  echo "   3. Use: localkeys set KEY value"
  echo ""
  exit 1
fi

# Check for potential secret patterns in staged files
if git diff --cached | grep -E "(password|secret|api[_-]?key|private[_-]?key|token)\\s*=\\s*['\"][^'\"]{8,}" -i; then
  echo "⚠️  Warning: Potential secrets found in staged changes"
  echo "   Review your changes carefully before committing."
  echo ""
  read -p "Continue with commit? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "✓ No exposed secrets detected"
`;

    await fs.writeFile(hookPath, hookContent, { mode: 0o755 });
  }
}
```

#### Task 6.3: Add INSTALL-HOOKS Command (1 hour)

**File**: `packages/cli/src/commands/install-hooks.ts`

```typescript
import chalk from 'chalk';
import ora from 'ora';
import { GitManager } from '../core/git';

export async function installHooksCommand() {
  const spinner = ora('Installing Git hooks...').start();

  try {
    const git = new GitManager(process.cwd());

    const isRepo = await git.isGitRepo();
    if (!isRepo) {
      spinner.fail(chalk.red('Not a Git repository'));
      console.log(chalk.yellow('\nInitialize Git first: git init'));
      process.exit(1);
    }

    await git.installPreCommitHook();

    spinner.succeed(chalk.green('✓ Git hooks installed successfully'));
    console.log(
      chalk.dim('\n  Pre-commit hook will prevent committing secrets\n')
    );
  } catch (error) {
    spinner.fail(chalk.red('Failed to install hooks'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

**Add to CLI**:

```typescript
import { installHooksCommand } from './commands/install-hooks';

program
  .command('install-hooks')
  .description('Install Git pre-commit hooks')
  .action(installHooksCommand);
```

## ✅ Checkpoint: Day 6-7 Complete

**You should have:**

- ✅ DIFF command showing configuration status
- ✅ Git hooks preventing secret commits
- ✅ Complete CLI with 7 commands

**Week 1 Complete!**

Test everything:

```bash
localkeys init
localkeys set API_KEY test123
localkeys diff
localkeys validate
localkeys install-hooks

# Try to commit a .env file (should be blocked)
echo "SECRET=123" > .env
git add .env
git commit -m "test"  # Should fail!
```

---

# Week 2: Core Features (Days 8-14)

## Day 8-9: Placeholder System & Crypto

### 🎯 Objective

Enhance placeholder generation with multiple strategies and add encryption utilities.

### 📝 Tasks

#### Task 8.1: Enhanced Placeholder Module (2 hours)

**File**: `packages/cli/src/core/placeholder.ts`

```typescript
import crypto from 'crypto';

export type PlaceholderStrategy =
  | 'random'
  | 'content-hash'
  | 'timestamp'
  | 'sequential';

export interface ParsedPlaceholder {
  key: string;
  tag: string;
}

export class PlaceholderGenerator {
  private counter: number = 0;

  constructor(private strategy: PlaceholderStrategy = 'random') {}

  generate(key: string, value: string): string {
    const tag = this.generateTag(value);
    return `redacted:${key}:${tag}`;
  }

  parse(placeholder: string): ParsedPlaceholder | null {
    const match = placeholder.match(/^redacted:([^:]+):([^:]+)$/);
    if (!match) return null;

    return {
      key: match[1],
      tag: match[2],
    };
  }

  private generateTag(value: string): string {
    switch (this.strategy) {
      case 'random':
        return crypto.randomBytes(3).toString('hex');

      case 'content-hash':
        return crypto
          .createHash('sha256')
          .update(value)
          .digest('hex')
          .substring(0, 6);

      case 'timestamp':
        return new Date().toISOString().split('T')[0].replace(/-/g, '');

      case 'sequential':
        return (this.counter++).toString(36).padStart(6, '0');

      default:
        return crypto.randomBytes(3).toString('hex');
    }
  }

  /**
   * Check if two placeholders are different (indicating rotation)
   */
  static hasChanged(old: string, new_: string): boolean {
    const oldParsed = new PlaceholderGenerator().parse(old);
    const newParsed = new PlaceholderGenerator().parse(new_);

    if (!oldParsed || !newParsed) return false;
    if (oldParsed.key !== newParsed.key) return false;

    return oldParsed.tag !== newParsed.tag;
  }
}
```

#### Task 8.2: Crypto Module (2 hours)

**File**: `packages/cli/src/core/crypto.ts`

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

export class CryptoManager {
  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(plaintext: string, key: Buffer): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(ciphertext: string, key: Buffer): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      'sha256'
    );
  }

  /**
   * Generate a cryptographically secure random salt
   */
  generateSalt(): Buffer {
    return crypto.randomBytes(SALT_LENGTH);
  }

  /**
   * Hash a value (for placeholder generation)
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Generate a secure random string
   */
  randomString(length: number = 32): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }
}
```

#### Task 8.3: Add ROTATE Command (2.5 hours)

**File**: `packages/cli/src/commands/rotate.ts`

```typescript
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { createKeychain } from '../core/keychain';
import { ConfigManager } from '../core/config';
import { PlaceholderGenerator } from '../core/placeholder';
import { updateRedactedFile } from '../utils/helpers';
import { CryptoManager } from '../core/crypto';

export async function rotateCommand(
  key: string,
  options: { generate?: boolean; interactive?: boolean }
) {
  const spinner = ora(`Rotating secret: ${key}`).start();

  try {
    const keychain = createKeychain();
    const config = new ConfigManager(process.cwd());

    // Check if secret exists
    const currentValue = await keychain.get(key);
    if (!currentValue) {
      spinner.fail(chalk.red(`Secret '${key}' not found`));
      process.exit(1);
    }

    let newValue: string;

    if (options.generate) {
      // Generate a new random value
      const crypto = new CryptoManager();
      newValue = crypto.randomString(32);
      spinner.succeed(chalk.green('Generated new random value'));
    } else if (options.interactive) {
      spinner.stop();
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'newValue',
          message: `Enter new value for '${key}':`,
          mask: '*',
        },
        {
          type: 'password',
          name: 'confirmValue',
          message: 'Confirm new value:',
          mask: '*',
        },
      ]);

      if (answers.newValue !== answers.confirmValue) {
        console.log(chalk.red('Values do not match'));
        process.exit(1);
      }

      newValue = answers.newValue;
      spinner.start('Rotating secret...');
    } else {
      spinner.fail(chalk.red('Must specify --generate or --interactive'));
      process.exit(1);
    }

    // Validate new value
    const definition = await config.getSecretDefinition(key);
    if (definition) {
      const validation = await config.validateSecret(definition, newValue);
      if (!validation.valid) {
        spinner.fail(chalk.red(`Validation failed: ${validation.error}`));
        process.exit(1);
      }
    }

    // Store new value
    await keychain.set(key, newValue);

    // Generate new placeholder
    const generator = new PlaceholderGenerator('random');
    const newPlaceholder = generator.generate(key, newValue);
    await updateRedactedFile(key, newPlaceholder);

    spinner.succeed(chalk.green(`✓ Secret '${key}' rotated successfully`));
    console.log(chalk.dim(`  New placeholder: ${newPlaceholder}`));
    console.log(
      chalk.yellow(
        '\n  ⚠️  Remember to commit the updated .env.redacted file\n'
      )
    );
  } catch (error) {
    spinner.fail(chalk.red('Failed to rotate secret'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

**Add to CLI**:

```typescript
program
  .command('rotate <key>')
  .description('Rotate a secret (generate new value)')
  .option('-g, --generate', 'Auto-generate a new random value')
  .option('-i, --interactive', 'Prompt for new value')
  .action(rotateCommand);
```

## ✅ Checkpoint: Day 8-9 Complete

**You should have:**

- ✅ Enhanced placeholder system
- ✅ Crypto utilities
- ✅ ROTATE command working

**Test rotation:**

```bash
localkeys set API_KEY old_value_123
cat .env.redacted  # Note the placeholder tag
localkeys rotate API_KEY --generate
cat .env.redacted  # Tag should be different
localkeys get API_KEY  # Should show new value
```

---

## Day 10-11: EXPORT/IMPORT & Backup System

### 🎯 Objective

Allow users to backup and transfer secrets between machines.

### 📝 Tasks

#### Task 10.1: Export/Import Module (3 hours)

**File**: `packages/cli/src/core/backup.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';
import { createKeychain } from './keychain';
import { CryptoManager } from './crypto';

export interface BackupData {
  version: string;
  timestamp: string;
  secrets: Array<{
    key: string;
    value: string; // Will be encrypted
  }>;
}

export class BackupManager {
  private crypto = new CryptoManager();

  async export(password: string, outputPath?: string): Promise<string> {
    const keychain = createKeychain();
    const secretKeys = await keychain.list();

    const secrets = [];
    for (const key of secretKeys) {
      const value = await keychain.get(key);
      if (value) {
        secrets.push({ key, value });
      }
    }

    const backup: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      secrets,
    };

    // Encrypt the backup
    const salt = this.crypto.generateSalt();
    const key = this.crypto.deriveKey(password, salt);
    const encrypted = this.crypto.encrypt(JSON.stringify(backup), key);

    // Format: salt:encrypted_data
    const backupContent = `${salt.toString('hex')}:${encrypted}`;

    // Write to file
    const filename = outputPath || `localkeys-backup-${Date.now()}.enc`;
    await fs.writeFile(filename, backupContent);

    return filename;
  }

  async import(
    backupPath: string,
    password: string,
    options: { overwrite?: boolean } = {}
  ): Promise<void> {
    // Read backup file
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const [saltHex, encrypted] = backupContent.split(':');

    if (!saltHex || !encrypted) {
      throw new Error('Invalid backup file format');
    }

    // Decrypt
    const salt = Buffer.from(saltHex, 'hex');
    const key = this.crypto.deriveKey(password, salt);

    let decrypted: string;
    try {
      decrypted = this.crypto.decrypt(encrypted, key);
    } catch {
      throw new Error('Invalid password or corrupted backup file');
    }

    const backup: BackupData = JSON.parse(decrypted);

    // Validate backup format
    if (!backup.version || !backup.secrets) {
      throw new Error('Invalid backup file structure');
    }

    // Import secrets
    const keychain = createKeychain();
    const existingSecrets = await keychain.list();

    for (const secret of backup.secrets) {
      if (existingSecrets.includes(secret.key) && !options.overwrite) {
        console.warn(`Skipping existing secret: ${secret.key}`);
        continue;
      }

      await keychain.set(secret.key, secret.value);
    }
  }
}
```

#### Task 10.2: EXPORT Command (1.5 hours)

**File**: `packages/cli/src/commands/export.ts`

```typescript
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { BackupManager } from '../core/backup';

export async function exportCommand(options: { output?: string }) {
  console.log(chalk.blue('🔒 Exporting secrets to encrypted backup\n'));

  try {
    // Prompt for password
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter encryption password:',
        mask: '*',
        validate: (input: string) =>
          input.length >= 8 || 'Password must be at least 8 characters',
      },
      {
        type: 'password',
        name: 'confirmPassword',
        message: 'Confirm password:',
        mask: '*',
      },
    ]);

    if (answers.password !== answers.confirmPassword) {
      console.log(chalk.red('\n❌ Passwords do not match'));
      process.exit(1);
    }

    const spinner = ora('Creating encrypted backup...').start();

    const backup = new BackupManager();
    const filename = await backup.export(answers.password, options.output);

    spinner.succeed(chalk.green(`✓ Backup created: ${filename}`));
    console.log(chalk.yellow('\n⚠️  Keep this file and password safe!'));
    console.log(
      chalk.dim("   You'll need both to restore secrets on another machine\n")
    );
  } catch (error) {
    console.error(chalk.red('Failed to export secrets'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

#### Task 10.3: IMPORT Command (1.5 hours)

**File**: `packages/cli/src/commands/import.ts`

```typescript
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { BackupManager } from '../core/backup';

export async function importCommand(
  backupFile: string,
  options: { overwrite?: boolean }
) {
  console.log(chalk.blue('🔓 Importing secrets from encrypted backup\n'));

  try {
    // Prompt for password
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter backup password:',
        mask: '*',
      },
    ]);

    const spinner = ora('Decrypting and importing secrets...').start();

    const backup = new BackupManager();
    await backup.import(backupFile, answers.password, {
      overwrite: options.overwrite,
    });

    spinner.succeed(chalk.green('✓ Secrets imported successfully'));
    console.log(chalk.dim('\n  Run "localkeys list" to see imported secrets\n'));
  } catch (error) {
    if (error.message.includes('password')) {
      console.error(chalk.red('\n❌ Incorrect password'));
    } else {
      console.error(chalk.red('\n❌ Failed to import secrets'));
      console.error(chalk.red(error.message));
    }
    process.exit(1);
  }
}
```

**Add to CLI**:

```typescript
program
  .command('export')
  .description('Export secrets to encrypted backup file')
  .option('-o, --output <path>', 'Output file path')
  .action(exportCommand);

program
  .command('import <backup-file>')
  .description('Import secrets from encrypted backup file')
  .option('--overwrite', 'Overwrite existing secrets')
  .action(importCommand);
```

## ✅ Checkpoint: Day 10-11 Complete

**Test backup/restore:**

```bash
# Export
localkeys export -o my-backup.enc
# Enter password when prompted

# Delete a secret
localkeys delete API_KEY

# Import
localkeys import my-backup.enc
# Enter password when prompted

# Verify
localkeys get API_KEY  # Should be restored
```

---

## Day 12-13: DELETE Command & Cleanup

### 🎯 Objective

Add ability to delete secrets and clean up stale entries.

### 📝 Tasks

#### Task 12.1: DELETE Command (1 hour)

**File**: `packages/cli/src/commands/delete.ts`

```typescript
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { createKeychain } from '../core/keychain';
import { updateRedactedFile } from '../utils/helpers';
import fs from 'fs/promises';
import path from 'path';

export async function deleteCommand(key: string, options: { force?: boolean }) {
  try {
    const keychain = createKeychain();

    // Check if exists
    const value = await keychain.get(key);
    if (!value) {
      console.log(chalk.yellow(`Secret '${key}' not found`));
      process.exit(1);
    }

    // Confirm deletion
    if (!options.force) {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Delete secret '${key}'?`,
          default: false,
        },
      ]);

      if (!answers.confirm) {
        console.log(chalk.dim('Cancelled'));
        return;
      }
    }

    const spinner = ora(`Deleting secret: ${key}`).start();

    // Delete from keychain
    await keychain.delete(key);

    // Remove from .env.redacted
    await removeFromRedacted(key);

    spinner.succeed(chalk.green(`✓ Secret '${key}' deleted`));
  } catch (error) {
    console.error(chalk.red('Failed to delete secret'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

async function removeFromRedacted(key: string): Promise<void> {
  const redactedPath = path.join(process.cwd(), '.env.redacted');

  try {
    const content = await fs.readFile(redactedPath, 'utf-8');
    const lines = content
      .split('\n')
      .filter((line) => !line.startsWith(`${key}=`));

    await fs.writeFile(redactedPath, lines.join('\n'));
  } catch {
    // File doesn't exist, ignore
  }
}
```

#### Task 12.2: CLEAN Command (1.5 hours)

**File**: `packages/cli/src/commands/clean.ts`

```typescript
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ConfigManager } from '../core/config';
import { createKeychain } from '../core/keychain';

export async function cleanCommand(options: { force?: boolean }) {
  const spinner = ora('Analyzing secrets...').start();

  try {
    const config = new ConfigManager(process.cwd());
    const keychain = createKeychain();

    const template = await config.readTemplate();
    const redacted = await config.readRedacted();
    const stored = await keychain.list();

    // Find secrets that are:
    // 1. In keychain but not in .env.tpl
    // 2. In .env.redacted but not in keychain
    const toClean: string[] = [];

    for (const key of stored) {
      const defined = template.secrets.find((s) => s.name === key);
      if (!defined) {
        toClean.push(key);
      }
    }

    spinner.stop();

    if (toClean.length === 0) {
      console.log(chalk.green('✓ No stale secrets found'));
      return;
    }

    console.log(chalk.yellow(`\nFound ${toClean.length} stale secret(s):\n`));
    toClean.forEach((key) => {
      console.log(chalk.white(`  • ${key}`));
    });
    console.log();

    if (!options.force) {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Delete these secrets?',
          default: false,
        },
      ]);

      if (!answers.confirm) {
        console.log(chalk.dim('Cancelled'));
        return;
      }
    }

    // Delete each secret
    for (const key of toClean) {
      await keychain.delete(key);
    }

    console.log(chalk.green(`\n✓ Cleaned ${toClean.length} stale secret(s)\n`));
  } catch (error) {
    spinner.fail(chalk.red('Failed to clean secrets'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
```

**Add to CLI**:

```typescript
program
  .command('delete <key>')
  .description('Delete a secret from keychain')
  .option('-f, --force', 'Skip confirmation')
  .action(deleteCommand);

program
  .command('clean')
  .description('Remove secrets not defined in .env.tpl')
  .option('-f, --force', 'Skip confirmation')
  .action(cleanCommand);
```

## ✅ Checkpoint: Day 12-13 Complete

**Test cleanup:**

```bash
# Add a secret not in .env.tpl
localkeys set TEMP_SECRET test123

# Check it exists
localkeys list

# Clean it up
localkeys clean

# Verify it's gone
localkeys list
```

---

## Day 14: Documentation & Testing

### 🎯 Objective

Write comprehensive documentation and add integration tests.

### 📝 Tasks

#### Task 14.1: Create README (2 hours)

**File**: `README.md`

````markdown
# LocalKeys 🔒

Local-first secret management for developers. Keep your `.env` files secure without the complexity of enterprise secret managers.

## Features

- ✅ **OS Keychain Integration** - Secrets stored in macOS Keychain, Windows Credential Manager, or Linux Secret Service
- ✅ **Git-Friendly** - Commit placeholder files, not plaintext secrets
- ✅ **Zero Config** - Works out of the box, no servers required
- ✅ **Type Validation** - Validate secrets against schemas
- ✅ **Rotation Tracking** - See when secrets were last rotated
- ✅ **Encrypted Backups** - Transfer secrets between machines securely

## Installation

```bash
npm install -g @localkeys/cli
```
````

## Quick Start

```bash
# 1. Initialize in your project
cd my-project
localkeys init

# 2. Store secrets
localkeys set DATABASE_URL postgresql://localhost/mydb
localkeys set API_KEY sk_live_abc123

# 3. Run your app (secrets auto-injected)
npm run dev
```

## Commands

### `localkeys init`

Initialize LocalKeys in the current directory.

### `localkeys set <key> <value>`

Store a secret in the OS keychain.

### `localkeys get <key>`

Retrieve a secret (for debugging).

### `localkeys list`

List all stored secrets (keys only, not values).

### `localkeys diff`

Show which secrets are missing or out of sync.

### `localkeys validate`

Validate all secrets against `.env.tpl`.

### `localkeys rotate <key>`

Rotate a secret (generate new value).

### `localkeys export`

Create an encrypted backup of all secrets.

### `localkeys import <backup-file>`

Restore secrets from a backup.

### `localkeys delete <key>`

Delete a secret from the keychain.

### `localkeys clean`

Remove secrets not defined in `.env.tpl`.

### `localkeys install-hooks`

Install Git pre-commit hooks to prevent leaks.

## File Structure

```
my-project/
├── .env.tpl           # Template (committed)
├── .env.redacted      # Placeholders (committed)
├── .localkeys/         # Config (gitignored)
└── .gitignore         # Updated by init
```

## How It Works

1. **Define** secrets in `.env.tpl` (JSON schema)
2. **Store** actual values with `localkeys set`
3. **Commit** `.env.tpl` and `.env.redacted` to Git
4. **Share** - teammates run `localkeys sync` to get secrets

Secrets never touch your repository!

## Security Model

- Secrets stored in OS keychain (encrypted at rest)
- Machine-bound (can't copy to another device)
- `.env.redacted` contains safe placeholders only
- Git hooks prevent committing plaintext

## License

MIT

````

#### Task 14.2: Add Integration Tests (2 hours)

**File**: `packages/cli/src/__tests__/integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('LocalKeys Integration Tests', () => {
  let testDir: string;
  let cliPath: string;

  beforeAll(() => {
    // Create temp directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'localkeys-test-'));
    cliPath = path.join(__dirname, '../../dist/index.js');

    // Build CLI
    execSync('pnpm build', { cwd: path.join(__dirname, '../..') });
  });

  afterAll(() => {
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  function run(command: string): string {
    return execSync(`node ${cliPath} ${command}`, {
      cwd: testDir,
      encoding: 'utf-8',
    });
  }

  it('should initialize project', () => {
    const output = run('init');
    expect(output).toContain('initialized');
    expect(fs.existsSync(path.join(testDir, '.env.tpl'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, '.env.redacted'))).toBe(true);
  });

  it('should set and get secret', () => {
    run('init');
    run('set TEST_KEY test_value');
    const output = run('get TEST_KEY');
    expect(output.trim()).toBe('test_value');
  });

  it('should list secrets', () => {
    run('init');
    run('set KEY1 value1');
    run('set KEY2 value2');
    const output = run('list');
    expect(output).toContain('KEY1');
    expect(output).toContain('KEY2');
  });

  it('should update .env.redacted', () => {
    run('init');
    run('set MY_SECRET secretvalue');
    const redacted = fs.readFileSync(
      path.join(testDir, '.env.redacted'),
      'utf-8'
    );
    expect(redacted).toContain('MY_SECRET=redacted:');
  });

  it('should validate missing secrets', () => {
    run('init');

    // Add required secret to template
    const template = {
      version: '1.0',
      secrets: [{ name: 'REQUIRED_KEY', required: true }],
    };
    fs.writeFileSync(
      path.join(testDir, '.env.tpl'),
      JSON.stringify(template)
    );

    try {
      run('validate');
      expect(false).toBe(true); // Should have thrown
    } catch (error) {
      expect(error.message).toContain('REQUIRED_KEY');
    }
  });
});
````

**Run tests:**

```bash
pnpm test
```

## ✅ Checkpoint: Week 2 Complete!

**You now have:**

- ✅ Complete CLI with all core commands
- ✅ Backup/restore functionality
- ✅ Secret rotation
- ✅ Comprehensive tests
- ✅ Full documentation

---

# Week 3: Runners & Integration (Days 15-21)

## Day 15-16: Node.js Runner

### 🎯 Objective

Create Node.js runtime that auto-resolves placeholders.

### 📝 Tasks

#### Task 15.1: Setup Runner Package (30 min)

```bash
mkdir -p packages/node/src
cd packages/node

cat > package.json << 'EOF'
{
  "name": "@localkeys/node",
  "version": "0.1.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsup src/index.ts --format cjs --clean",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@electron/keytar": "^7.9.0"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "tsup": "^8.0.1"
  }
}
EOF

pnpm install
```

#### Task 15.2: Implement Preload Script (2 hours)

**File**: `packages/node/src/preload.ts`

```typescript
import keytar from '@electron/keytar';

const SERVICE_NAME = 'io.localkeys.secrets';
const PLACEHOLDER_PATTERN = /^redacted:([^:]+):([^:]+)$/;

// Cache resolved values for performance
const cache = new Map<string, string>();

function resolveSecret(placeholder: string): string | undefined {
  // Check cache first
  if (cache.has(placeholder)) {
    return cache.get(placeholder);
  }

  const match = placeholder.match(PLACEHOLDER_PATTERN);
  if (!match) {
    return placeholder; // Not a placeholder
  }

  const [, key] = match;

  try {
    // Synchronous keychain access
    const value = keytar.getPasswordSync(SERVICE_NAME, key);
    if (value) {
      cache.set(placeholder, value);
      return value;
    }
  } catch (error) {
    console.error(`[LocalKeys] Failed to resolve ${key}:`, error.message);
  }

  return undefined;
}

// Wrap process.env with a Proxy
const originalEnv = process.env;

const envProxy = new Proxy(originalEnv, {
  get(target, prop: string) {
    const value = target[prop];

    if (typeof value === 'string' && value.startsWith('redacted:')) {
      return resolveSecret(value);
    }

    return value;
  },

  set(target, prop: string, value: any) {
    target[prop] = value;
    return true;
  },

  has(target, prop: string) {
    return prop in target;
  },

  ownKeys(target) {
    return Reflect.ownKeys(target);
  },

  getOwnPropertyDescriptor(target, prop) {
    return Reflect.getOwnPropertyDescriptor(target, prop);
  },
});

// Replace process.env
Object.defineProperty(process, 'env', {
  value: envProxy,
  writable: false,
  configurable: false,
});

console.log('[LocalKeys] Node.js runner initialized');
```

**File**: `packages/node/src/index.ts`

```typescript
// Re-export preload for --require usage
export * from './preload';
```

#### Task 15.3: Test Runner (1 hour)

**Create test app**:

```bash
mkdir test-app
cd test-app
npm init -y

# Create test script
cat > index.js << 'EOF'
// Load env vars from .env.redacted
require('dotenv').config({ path: '.env.redacted' });

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('API_KEY:', process.env.API_KEY);
EOF

# Create .env.redacted
cat > .env.redacted << 'EOF'
DATABASE_URL=redacted:DATABASE_URL:abc123
API_KEY=redacted:API_KEY:def456
EOF

# Store actual secrets
localkeys set DATABASE_URL postgresql://localhost/test
localkeys set API_KEY sk_test_12345

# Run with LocalKeys runner
node --require @localkeys/node/preload index.js
```

#### Task 15.4: Package Script Helper (30 min)

**File**: `packages/node/bin/localkeys-node`

```bash
#!/usr/bin/env node

// Helper script to run Node apps with LocalKeys
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const preloadPath = path.join(__dirname, '../dist/preload.js');

const child = spawn('node', ['--require', preloadPath, ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
```

Make executable:

```bash
chmod +x packages/node/bin/localkeys-node
```

Add to package.json:

```json
{
  "bin": {
    "localkeys-node": "./bin/localkeys-node"
  }
}
```

## ✅ Checkpoint: Day 15-16 Complete

**Test Node runner:**

```bash
# In your test app
localkeys-node index.js
# Should print actual secret values, not placeholders
```

---

## Day 17-18: Python Runner

### 🎯 Objective

Create Python runner using sitecustomize.py.

### 📝 Tasks

#### Task 17.1: Setup Python Package (30 min)

```bash
mkdir -p packages/runner-python/localkeys
cd packages/runner-python

cat > setup.py << 'EOF'
from setuptools import setup, find_packages

setup(
    name='localkeys-runner',
    version='0.1.0',
    packages=find_packages(),
    install_requires=[
        'keyring>=24.0.0',
    ],
    python_requires='>=3.8',
    description='LocalKeys runtime for Python applications',
    author='LocalKeys',
    license='MIT',
)
EOF
```

#### Task 17.2: Implement Python Runner (2 hours)

**File**: `packages/runner-python/localkeys/__init__.py`

```python
"""LocalKeys Python Runner"""

__version__ = '0.1.0'

from .sitecustomize import setup

__all__ = ['setup']
```

**File**: `packages/runner-python/localkeys/sitecustomize.py`

```python
import os
import sys
import re
from typing import Optional

try:
    import keyring
except ImportError:
    print("[LocalKeys] Warning: keyring not installed. Run: pip install keyring", file=sys.stderr)
    keyring = None

SERVICE_NAME = "io.localkeys.secrets"
PLACEHOLDER_PATTERN = re.compile(r'^redacted:([^:]+):([^:]+)$')

# Cache for resolved secrets
_cache = {}


class LocalKeysDict(dict):
    """Dictionary that automatically resolves LocalKeys placeholders"""

    def __getitem__(self, key: str):
        value = super().__getitem__(key)

        if isinstance(value, str) and value.startswith('redacted:'):
            resolved = self._resolve_placeholder(value)
            if resolved is not None:
                return resolved

        return value

    def get(self, key: str, default=None):
        try:
            return self[key]
        except KeyError:
            return default

    def _resolve_placeholder(self, placeholder: str) -> Optional[str]:
        # Check cache first
        if placeholder in _cache:
            return _cache[placeholder]

        match = PLACEHOLDER_PATTERN.match(placeholder)
        if not match or not keyring:
            return None

        secret_key = match.group(1)

        try:
            value = keyring.get_password(SERVICE_NAME, secret_key)
            if value:
                _cache[placeholder] = value
                return value
        except Exception as e:
            print(f"[LocalKeys] Failed to resolve {secret_key}: {e}", file=sys.stderr)

        return None


def setup():
    """Setup LocalKeys environment variable resolution"""
    # Replace os.environ with LocalKeysDict
    os.environ = LocalKeysDict(os.environ)
    print("[LocalKeys] Python runner initialized", file=sys.stderr)


# Auto-run setup when imported via sitecustomize
if __name__ != '__main__':
    setup()
```

#### Task 17.3: Test Python Runner (1 hour)

**Create test script**:

```bash
mkdir test-python-app
cd test-python-app

# Create test script
cat > app.py << 'EOF'
import os
from dotenv import load_dotenv

# Load .env.redacted
load_dotenv('.env.redacted')

print('DATABASE_URL:', os.environ.get('DATABASE_URL'))
print('API_KEY:', os.environ.get('API_KEY'))
EOF

# Create .env.redacted
cat > .env.redacted << 'EOF'
DATABASE_URL=redacted:DATABASE_URL:abc123
API_KEY=redacted:API_KEY:def456
EOF

# Store secrets
localkeys set DATABASE_URL postgresql://localhost/test
localkeys set API_KEY sk_test_12345

# Install runner
pip install -e ../packages/runner-python

# Run with LocalKeys
python app.py
```

#### Task 17.4: Create CLI Helper (30 min)

**File**: `packages/runner-python/localkeys-python`

```bash
#!/usr/bin/env python3

import sys
import os

# Add sitecustomize to Python path
site_packages = os.path.join(os.path.dirname(__file__), 'localkeys')
os.environ['PYTHONPATH'] = f"{site_packages}:{os.environ.get('PYTHONPATH', '')}"

# Execute the Python script
os.execvp('python3', ['python3'] + sys.argv[1:])
```

Make executable:

```bash
chmod +x packages/runner-python/localkeys-python
```

## ✅ Checkpoint: Day 17-18 Complete

**Test Python runner:**

```bash
cd test-python-app
python app.py
# Should print actual secret values
```

---

## Day 19-20: Docker Compose Integration

### 🎯 Objective

Create Docker Compose integration for containerized apps.

### 📝 Tasks

#### Task 19.1: Create Docker Extension (3 hours)

**File**: `runners/docker-compose/Dockerfile`

```dockerfile
FROM node:18-alpine

# Install LocalKeys CLI
RUN npm install -g @localkeys/cli

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/localkeys-entrypoint
RUN chmod +x /usr/local/bin/localkeys-entrypoint

ENTRYPOINT ["/usr/local/bin/localkeys-entrypoint"]
```

**File**: `runners/docker-compose/entrypoint.sh`

```bash
#!/bin/sh
set -e

echo "[LocalKeys] Resolving secrets..."

# Check if .env.redacted exists
if [ ! -f ".env.redacted" ]; then
  echo "[LocalKeys] Warning: .env.redacted not found"
  exec "$@"
  exit 0
fi

# Read .env.redacted and resolve placeholders
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  if [ -z "$key" ] || [ "${key###}" != "$key" ]; then
    continue
  fi

  # Check if it's a placeholder
  if echo "$value" | grep -q "^redacted:"; then
    # Extract the secret key
    secret_key=$(echo "$value" | cut -d':' -f2)

    # Resolve using LocalKeys CLI
    resolved=$(localkeys get "$secret_key" 2>/dev/null || echo "")

    if [ -n "$resolved" ]; then
      export "$key=$resolved"
      echo "[LocalKeys] ✓ Resolved $key"
    else
      echo "[LocalKeys] ✗ Failed to resolve $key"
    fi
  else
    # Not a placeholder, export as-is
    export "$key=$value"
  fi
done < .env.redacted

echo "[LocalKeys] Starting application..."
exec "$@"
```

#### Task 19.2: Create docker-compose Template (1 hour)

**File**: `runners/docker-compose/docker-compose.localkeys.yml`

```yaml
version: '3.8'

services:
  app:
    build: ../../../../Downloads
    volumes:
      # Mount .env.redacted
      - ./.env.redacted:/app/.env.redacted:ro
      # Mount LocalKeys config (for keychain access)
      - ~/.localkeys:/root/.localkeys:ro
    environment:
      # Variables will be resolved at runtime
      - NODE_ENV=production
    command: npm start

  # Add LocalKeys sidecar for secret resolution
  localkeys:
    image: localkeys/injector:latest
    volumes:
      - ./.env.redacted:/app/.env.redacted:ro
      - ~/.localkeys:/root/.localkeys:ro
```

#### Task 19.3: Documentation (30 min)

**File**: `docs/docker-integration.md`

````markdown
# Docker Integration Guide

## Option 1: Using entrypoint script

Add to your Dockerfile:

```dockerfile
FROM node:18

COPY --from=localkeys/cli /usr/local/bin/localkeys /usr/local/bin/
COPY --from=localkeys/cli /usr/local/bin/localkeys-entrypoint /usr/local/bin/

ENTRYPOINT ["localkeys-entrypoint"]
CMD ["npm", "start"]
```
````

## Option 2: Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    volumes:
      - ./.env.redacted:/app/.env.redacted:ro
      - ~/.localkeys:/root/.localkeys:ro
```

## Limitations

Docker containers cannot access host keychain directly. Use one of:

1. Mount keychain data (development only)
2. Use cloud sync mode (production)
3. Build secrets into image (CI/CD)

````

## ✅ Checkpoint: Day 19-20 Complete

Docker integration documented and tested.

---

## Day 21: Integration Testing & Fixes

### 🎯 Objective
Test all runners end-to-end and fix bugs.

### 📝 Tasks

#### Task 21.1: Create E2E Test Suite (3 hours)

**File**: `tests/e2e/runners.test.sh`

```bash
#!/bin/bash
set -e

echo "=== LocalKeys E2E Runner Tests ==="

# Setup
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

echo "1. Initialize LocalKeys"
localkeys init

echo "2. Store test secrets"
localkeys set TEST_SECRET "hello_world"
localkeys set DATABASE_URL "postgresql://localhost/test"

echo "3. Create .env.redacted"
cat > .env.redacted << 'EOF'
TEST_SECRET=redacted:TEST_SECRET:abc123
DATABASE_URL=redacted:DATABASE_URL:def456
EOF

# Test Node.js runner
echo "4. Testing Node.js runner..."
cat > test-node.js << 'EOF'
require('dotenv').config({ path: '.env.redacted' });
console.log('NODE:', process.env.TEST_SECRET);
EOF

node --require @localkeys/node/preload test-node.js | grep "hello_world"

# Test Python runner
echo "5. Testing Python runner..."
cat > test-python.py << 'EOF'
import os
from dotenv import load_dotenv
load_dotenv('.env.redacted')
print('PYTHON:', os.environ.get('TEST_SECRET'))
EOF

python test-python.py | grep "hello_world"

echo "=== All runner tests passed! ==="

# Cleanup
cd ..
rm -rf "$TEST_DIR"
````

Make executable and run:

```bash
chmod +x tests/e2e/runners.test.sh
./tests/e2e/runners.test.sh
```

#### Task 21.2: Fix Any Bugs (2 hours)

Common issues to check:

- Keychain permissions on different platforms
- Placeholder parsing edge cases
- Runner import paths
- Error messages

#### Task 21.3: Performance Testing (1 hour)

**File**: `tests/performance/keychain-bench.js`

```javascript
const { createKeychain } = require('@localkeys/cli/dist/core/keychain');
const { performance } = require('perf_hooks');

async function benchmark() {
  const keychain = createKeychain();
  const iterations = 100;

  // Benchmark SET
  const setStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await keychain.set(`BENCH_KEY_${i}`, `value_${i}`);
  }
  const setEnd = performance.now();

  // Benchmark GET
  const getStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await keychain.get(`BENCH_KEY_${i}`);
  }
  const getEnd = performance.now();

  // Cleanup
  for (let i = 0; i < iterations; i++) {
    await keychain.delete(`BENCH_KEY_${i}`);
  }

  console.log(`\nBenchmark Results (${iterations} operations):`);
  console.log(
    `  SET: ${((setEnd - setStart) / iterations).toFixed(2)}ms per operation`
  );
  console.log(
    `  GET: ${((getEnd - getStart) / iterations).toFixed(2)}ms per operation`
  );
}

benchmark();
```

## ✅ Checkpoint: Week 3 Complete!

**You now have:**

- ✅ Node.js runner
- ✅ Python runner
- ✅ Docker integration
- ✅ Complete test suite
- ✅ Performance benchmarks

---

# Week 4: Polish & Release (Days 22-28)

## Day 22-23: Packaging & Distribution

### 🎯 Objective

Package CLI as standalone executables for all platforms.

### 📝 Tasks

#### Task 22.1: Setup pkg for Binary Packaging (1 hour)

```bash
cd packages/cli
pnpm add -D pkg

# Add to package.json
cat >> package.json << 'EOF'
{
  "pkg": {
    "targets": [
      "node18-macos-x64",
      "node18-macos-arm64",
      "node18-win-x64",
      "node18-linux-x64"
    ],
    "outputPath": "../../dist",
    "assets": [
      "node_modules/keytar/**/*"
    ]
  }
}
EOF
```

#### Task 22.2: Create Build Script (1 hour)

**File**: `scripts/build-binaries.sh`

```bash
#!/bin/bash
set -e

echo "🔨 Building LocalKeys binaries..."

# Clean dist
rm -rf dist
mkdir -p dist

# Build CLI
cd packages/cli
pnpm build

# Package binaries
echo "📦 Packaging for macOS (x64)..."
pnpm pkg . --target node18-macos-x64 --output ../../dist/localkeys-macos-x64

echo "📦 Packaging for macOS (ARM64)..."
pnpm pkg . --target node18-macos-arm64 --output ../../dist/localkeys-macos-arm64

echo "📦 Packaging for Windows..."
pnpm pkg . --target node18-win-x64 --output ../../dist/localkeys-windows.exe

echo "📦 Packaging for Linux..."
pnpm pkg . --target node18-linux-x64 --output ../../dist/localkeys-linux

echo "✅ Build complete!"
echo ""
echo "📁 Binaries created:"
ls -lh ../../dist/
```

Make executable:

```bash
chmod +x scripts/build-binaries.sh
./scripts/build-binaries.sh
```

#### Task 22.3: Create Installers (2 hours)

**macOS/Linux installer**: `scripts/install.sh`

```bash
#!/bin/bash
set -e

INSTALL_DIR="/usr/local/bin"
REPO="localkeys/localkeys"
LATEST_RELEASE="v0.1.0"  # Will be dynamic later

echo "🔒 Installing LocalKeys..."

# Detect OS
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    if [ "$ARCH" = "arm64" ]; then
      BINARY="localkeys-macos-arm64"
    else
      BINARY="localkeys-macos-x64"
    fi
    ;;
  Linux)
    BINARY="localkeys-linux"
    ;;
  *)
    echo "❌ Unsupported OS: $OS"
    exit 1
    ;;
esac

# Download binary
echo "📥 Downloading $BINARY..."
curl -fsSL "https://github.com/$REPO/releases/download/$LATEST_RELEASE/$BINARY" -o /tmp/localkeys

# Install
echo "📝 Installing to $INSTALL_DIR..."
chmod +x /tmp/localkeys
sudo mv /tmp/localkeys "$INSTALL_DIR/localkeys"

echo "✅ LocalKeys installed successfully!"
echo ""
echo "Run: localkeys --version"
```

**Windows installer**: `scripts/install.ps1`

```powershell
$ErrorActionPreference = "Stop"

Write-Host "🔒 Installing LocalKeys..." -ForegroundColor Blue

$InstallDir = "$env:LOCALAPPDATA\LocalKeys"
$BinPath = "$InstallDir\localkeys.exe"

# Create directory
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

# Download
$DownloadUrl = "https://github.com/localkeys/localkeys/releases/latest/download/localkeys-windows.exe"
Write-Host "📥 Downloading..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $DownloadUrl -OutFile $BinPath

# Add to PATH
$CurrentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($CurrentPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$CurrentPath;$InstallDir", "User")
    Write-Host "✅ Added to PATH" -ForegroundColor Green
}

Write-Host "✅ LocalKeys installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Restart your terminal and run: localkeys --version"
```

#### Task 22.4: npm Package (1 hour)

Create wrapper package for npm:

**File**: `packages/npm-wrapper/package.json`

```json
{
  "name": "localkeys",
  "version": "0.1.0",
  "description": "Local-first secret management",
  "bin": {
    "localkeys": "./bin/localkeys.js"
  },
  "scripts": {
    "postinstall": "node ./scripts/download-binary.js"
  }
}
```

**File**: `packages/npm-wrapper/scripts/download-binary.js`

```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = '0.1.0';
const PLATFORM = process.platform;
const ARCH = process.arch;

let binaryName;
if (PLATFORM === 'darwin') {
  binaryName = ARCH === 'arm64' ? 'localkeys-macos-arm64' : 'localkeys-macos-x64';
} else if (PLATFORM === 'win32') {
  binaryName = 'localkeys-windows.exe';
} else if (PLATFORM === 'linux') {
  binaryName = 'localkeys-linux';
} else {
  console.error(`Unsupported platform: ${PLATFORM}`);
  process.exit(1);
}

const url = `https://github.com/localkeys/localkeys/releases/download/v${VERSION}/${binaryName}`;
const binDir = path.join(__dirname, '..', 'bin');
const outputPath = path.join(
  binDir,
  PLATFORM === 'win32' ? 'localkeys.exe' : 'localkeys'
);

console.log('Downloading LocalKeys binary...');

// Ensure bin directory exists
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

// Download binary
const file = fs.createWriteStream(outputPath);
https
  .get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      fs.chmodSync(outputPath, 0o755);
      console.log('✓ LocalKeys installed successfully');
    });
  })
  .on('error', (err) => {
    fs.unlinkSync(outputPath);
    console.error('Failed to download binary:', err.message);
    process.exit(1);
  });
```

**File**: `packages/npm-wrapper/bin/localkeys.js`

```javascript
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const binaryName = process.platform === 'win32' ? 'localkeys.exe' : 'localkeys';
const binaryPath = path.join(__dirname, binaryName);

const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
```

## ✅ Checkpoint: Day 22-23 Complete

**You now have:**

- ✅ Standalone binaries for all platforms
- ✅ Shell/PowerShell installers
- ✅ npm package wrapper

**Test installation:**

```bash
# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/localkeys/localkeys/main/scripts/install.sh | bash

# npm
npm install -g localkeys

# Verify
localkeys --version
```

---

## Day 24-25: CI/CD & GitHub Actions

### 🎯 Objective

Automate builds, tests, and releases with GitHub Actions.

### 📝 Tasks

#### Task 24.1: Setup GitHub Repository (30 min)

```bash
# Create GitHub repo
gh repo create localkeys --public --description "Local-first secret management"

# Push code
git add .
git commit -m "Initial commit"
git push -u origin main
```

#### Task 24.2: CI Workflow (2 hours)

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [18.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build

      - name: Run tests
        run: pnpm test

      - name: Upload coverage
        if: matrix.os == 'ubuntu-latest'
        uses: codecov/codecov-action@v3

  build-binaries:
    name: Build binaries
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Build binaries
        run: bash scripts/build-binaries.sh

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: binaries
          path: dist/localkeys-*
          retention-days: 7
```

#### Task 24.3: Release Workflow (1.5 hours)

**File**: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build-and-release:
    name: Build and Release
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Build binaries
        run: bash scripts/build-binaries.sh

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            dist/localkeys-macos-x64
            dist/localkeys-macos-arm64
            dist/localkeys-windows.exe
            dist/localkeys-linux
          generate_release_notes: true
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Publish to npm
        run: |
          cd packages/npm-wrapper
          echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > .npmrc
          npm publish --access public
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

#### Task 24.4: Setup Secrets (30 min)

```bash
# Create npm token
npm login
npm token create

# Add to GitHub secrets
gh secret set NPM_TOKEN

# Add to repository settings:
# Settings > Secrets and variables > Actions > New repository secret
```

#### Task 24.5: Add Status Badges (15 min)

**Update README.md**:

```markdown
# LocalKeys 🔒

[![CI](https://github.com/localkeys/localkeys/workflows/CI/badge.svg)](https://github.com/localkeys/localkeys/actions)
[![npm version](https://badge.fury.io/js/localkeys.svg)](https://www.npmjs.com/package/localkeys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

...rest of README...
```

## ✅ Checkpoint: Day 24-25 Complete

**You now have:**

- ✅ Automated CI tests on 3 platforms
- ✅ Automated binary builds
- ✅ Automated releases to GitHub + npm
- ✅ Status badges

**Test the release process:**

```bash
# Tag a release
git tag v0.1.0
git push origin v0.1.0

# GitHub Actions will automatically:
# 1. Run tests
# 2. Build binaries
# 3. Create GitHub release
# 4. Publish to npm
```

---

## Day 26: Website & Documentation

### 🎯 Objective

Create a landing page and comprehensive documentation site.

### 📝 Tasks

#### Task 26.1: Simple Landing Page (2 hours)

**File**: `docs/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LocalKeys - Local-First Secret Management</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .hero {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 100px 20px;
        text-align: center;
      }
      .hero h1 {
        font-size: 3rem;
        margin-bottom: 20px;
      }
      .hero p {
        font-size: 1.5rem;
        margin-bottom: 40px;
        opacity: 0.9;
      }
      .install-box {
        background: rgba(0, 0, 0, 0.2);
        padding: 20px;
        border-radius: 8px;
        display: inline-block;
        font-family: 'Courier New', monospace;
        font-size: 1.2rem;
      }
      .features {
        max-width: 1200px;
        margin: 80px auto;
        padding: 0 20px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 40px;
      }
      .feature {
        text-align: center;
      }
      .feature-icon {
        font-size: 3rem;
        margin-bottom: 20px;
      }
      .feature h3 {
        margin-bottom: 10px;
        color: #667eea;
      }
      .cta {
        background: #f7f7f7;
        padding: 80px 20px;
        text-align: center;
      }
      .cta h2 {
        margin-bottom: 20px;
      }
      .button {
        display: inline-block;
        background: #667eea;
        color: white;
        padding: 15px 40px;
        border-radius: 5px;
        text-decoration: none;
        font-weight: bold;
        margin: 10px;
      }
      .button:hover {
        background: #5568d3;
      }
    </style>
  </head>
  <body>
    <div class="hero">
      <h1>🔒 LocalKeys</h1>
      <p>Local-First Secret Management for Developers</p>
      <div class="install-box">$ npm install -g localkeys</div>
    </div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">🔐</div>
        <h3>OS Keychain</h3>
        <p>
          Secrets stored in macOS Keychain, Windows Credential Manager, or Linux
          Secret Service
        </p>
      </div>
      <div class="feature">
        <div class="feature-icon">🌳</div>
        <h3>Git-Friendly</h3>
        <p>
          Commit placeholder files, not plaintext secrets. Never leak
          credentials again.
        </p>
      </div>
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <h3>Zero Config</h3>
        <p>Works out of the box. No servers, no APIs, no complexity.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">✅</div>
        <h3>Type Validation</h3>
        <p>Validate secrets against schemas. Catch errors before deployment.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">🔄</div>
        <h3>Rotation Tracking</h3>
        <p>See when secrets were last rotated. Stay compliant effortlessly.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">📦</div>
        <h3>Encrypted Backups</h3>
        <p>
          Transfer secrets between machines securely with encrypted exports.
        </p>
      </div>
    </div>

    <div class="cta">
      <h2>Get Started in 30 Seconds</h2>
      <a href="https://github.com/localkeys/localkeys" class="button"
        >View on GitHub</a
      >
      <a href="https://localkeys.github.io/docs" class="button">Read the Docs</a>
    </div>
  </body>
</html>
```

#### Task 26.2: Documentation Site (2 hours)

Use a simple static site generator or GitHub Pages:

**File**: `docs/README.md` (or use Docusaurus/VitePress)

````markdown
# LocalKeys Documentation

## Quick Start

### Installation

**macOS/Linux:**

```bash
curl -fsSL https://localkeys.dev/install.sh | bash
```
````

**Windows (PowerShell):**

```powershell
irm https://localkeys.dev/install.ps1 | iex
```

**npm:**

```bash
npm install -g localkeys
```

### First Steps

1. **Initialize your project**

   ```bash
   cd my-project
   localkeys init
   ```

2. **Store secrets**

   ```bash
   localkeys set DATABASE_URL postgresql://localhost/mydb
   localkeys set API_KEY sk_live_abc123
   ```

3. **Run your app**
   ```bash
   npm run dev
   ```

## Commands Reference

### `localkeys init`

Initialize LocalKeys in the current directory.

**Options:**

- `--force` - Overwrite existing configuration

**Example:**

```bash
localkeys init
```

### `localkeys set <key> <value>`

Store a secret in the OS keychain.

**Example:**

```bash
localkeys set API_KEY sk_live_abc123
localkeys set DATABASE_URL "postgresql://localhost:5432/db"
```

### `localkeys get <key>`

Retrieve a secret (for debugging).

**Options:**

- `-j, --json` - Output as JSON

**Example:**

```bash
localkeys get API_KEY
localkeys get DATABASE_URL --json
```

### `localkeys list`

List all stored secrets (keys only).

**Example:**

```bash
localkeys list
```

### `localkeys diff`

Show configuration status.

**Example:**

```bash
localkeys diff
```

### `localkeys validate`

Validate all secrets against `.env.tpl`.

**Example:**

```bash
localkeys validate
```

### `localkeys rotate <key>`

Rotate a secret.

**Options:**

- `-g, --generate` - Auto-generate new value
- `-i, --interactive` - Prompt for new value

**Example:**

```bash
localkeys rotate API_KEY --generate
localkeys rotate DATABASE_URL --interactive
```

### `localkeys export`

Create encrypted backup.

**Options:**

- `-o, --output <path>` - Output file path

**Example:**

```bash
localkeys export -o backup.enc
```

### `localkeys import <file>`

Restore from backup.

**Options:**

- `--overwrite` - Overwrite existing secrets

**Example:**

```bash
localkeys import backup.enc
```

### `localkeys delete <key>`

Delete a secret.

**Options:**

- `-f, --force` - Skip confirmation

**Example:**

```bash
localkeys delete OLD_SECRET --force
```

### `localkeys clean`

Remove undefined secrets.

**Example:**

```bash
localkeys clean
```

### `localkeys install-hooks`

Install Git pre-commit hooks.

**Example:**

```bash
localkeys install-hooks
```

## Configuration

### `.env.tpl` Format

Define your secrets schema:

```json
{
  "version": "1.0",
  "secrets": [
    {
      "name": "DATABASE_URL",
      "description": "PostgreSQL connection string",
      "required": true,
      "validator": "url",
      "rotationDays": 90,
      "scope": "all"
    },
    {
      "name": "API_KEY",
      "description": "Third-party API key",
      "required": true,
      "validator": "length",
      "minLength": 32,
      "rotationDays": 30,
      "scope": "production"
    }
  ]
}
```

### Validators

- `url` - Must be valid URL
- `email` - Must be valid email
- `base64` - Must be valid base64
- `regex` - Match custom pattern
- `length` - Length constraints

### Scopes

- `development` - Dev environment only
- `staging` - Staging environment
- `production` - Production environment
- `all` - All environments (default)

## Runners

### Node.js

**Method 1: Preload script**

```bash
node --require @localkeys/node/preload app.js
```

**Method 2: package.json**

```json
{
  "scripts": {
    "dev": "node --require @localkeys/node/preload src/index.js"
  }
}
```

### Python

**Automatic with sitecustomize:**

```bash
pip install localkeys-runner
python app.py
```

### Docker

Add to Dockerfile:

```dockerfile
COPY --from=localkeys/cli /usr/local/bin/localkeys /usr/local/bin/
ENTRYPOINT ["localkeys-entrypoint"]
```

## Best Practices

### 1. Define All Secrets in .env.tpl

Always document required secrets:

```json
{
  "name": "SECRET_NAME",
  "description": "What this secret is for",
  "required": true
}
```

### 2. Use Validators

Catch errors early:

```json
{
  "name": "DATABASE_URL",
  "validator": "url"
}
```

### 3. Set Rotation Policies

Stay compliant:

```json
{
  "name": "API_KEY",
  "rotationDays": 30
}
```

### 4. Install Git Hooks

Prevent leaks:

```bash
localkeys install-hooks
```

### 5. Regular Backups

Export secrets before major changes:

```bash
localkeys export -o backup-$(date +%Y%m%d).enc
```

## Troubleshooting

### "Secret not found" errors

Check keychain access:

```bash
localkeys list  # See what's stored
localkeys get KEY_NAME  # Test retrieval
```

### Keychain permission denied (macOS)

Grant terminal access:

1. System Preferences > Security & Privacy > Privacy
2. Full Disk Access > Add Terminal

### Import fails with "Invalid password"

- Check password carefully
- Verify backup file isn't corrupted
- Try re-exporting from source machine

### Git hooks not working

Reinstall hooks:

```bash
localkeys install-hooks
```

## FAQ

**Q: Where are secrets stored?**
A: In your OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service).

**Q: Can I use LocalKeys in CI/CD?**
A: Yes! Use `localkeys export` to create backups, then `localkeys import` in CI.

**Q: How do teammates get secrets?**
A: Share the encrypted backup file + password via secure channel (1Password, LastPass, etc.).

**Q: What if I lose my backup password?**
A: Secrets are unrecoverable. Re-create them and update teammates.

**Q: Does this replace Vault/AWS Secrets Manager?**
A: No, it complements them. LocalKeys is for local dev; use enterprise tools for prod.

## Security Model

- Secrets encrypted by OS (AES-256)
- Machine-bound (can't copy to another device)
- Placeholders safe to commit
- Git hooks prevent plaintext leaks
- Backups encrypted with PBKDF2 + AES-256-GCM

## Support

- GitHub Issues: https://github.com/localkeys/localkeys/issues
- Discussions: https://github.com/localkeys/localkeys/discussions
- Email: support@localkeys.dev

````

#### Task 26.3: Setup GitHub Pages (30 min)

```bash
# Enable GitHub Pages
gh repo edit --enable-pages --pages-branch gh-pages

# Deploy docs
cd docs
git checkout --orphan gh-pages
git add .
git commit -m "Deploy docs"
git push origin gh-pages
````

## ✅ Checkpoint: Day 26 Complete

**You now have:**

- ✅ Landing page
- ✅ Complete documentation
- ✅ Hosted on GitHub Pages

**Visit**: https://localkeys.github.io

---

## Day 27: Final Testing & Bug Fixes

### 🎯 Objective

Thorough testing on all platforms and fix critical bugs.

### 📝 Tasks

#### Task 27.1: Create Testing Checklist (30 min)

**File**: `TESTING_CHECKLIST.md`

```markdown
# LocalKeys Testing Checklist

## Platform Tests

### macOS (Intel)

- [ ] Installation via curl script
- [ ] `localkeys init` creates files
- [ ] `localkeys set` stores in Keychain
- [ ] `localkeys get` retrieves correctly
- [ ] Node.js runner works
- [ ] Python runner works
- [ ] Git hooks prevent commits
- [ ] Export/import works

### macOS (Apple Silicon)

- [ ] Installation via curl script
- [ ] All commands work
- [ ] Runners work

### Windows

- [ ] Installation via PowerShell
- [ ] All commands work
- [ ] Credential Manager storage works
- [ ] Node.js runner works
- [ ] Python runner works

### Linux (Ubuntu)

- [ ] Installation via curl script
- [ ] libsecret works
- [ ] All commands work
- [ ] Runners work

## Feature Tests

### CLI Commands

- [ ] `init` - Creates correct files
- [ ] `set` - Validates and stores
- [ ] `get` - Retrieves correctly
- [ ] `list` - Shows all keys
- [ ] `diff` - Shows status correctly
- [ ] `validate` - Catches errors
- [ ] `rotate` - Updates placeholders
- [ ] `export` - Creates encrypted backup
- [ ] `import` - Restores from backup
- [ ] `delete` - Removes secrets
- [ ] `clean` - Removes stale secrets
- [ ] `install-hooks` - Creates Git hooks

### Validation

- [ ] URL validator works
- [ ] Email validator works
- [ ] Regex validator works
- [ ] Length validator works

### Error Handling

- [ ] Missing .env.tpl shows helpful error
- [ ] Invalid template shows parse error
- [ ] Keychain access denied shows help
- [ ] Non-existent secret returns null
- [ ] Invalid backup password rejected

### Edge Cases

- [ ] Empty values allowed
- [ ] Special characters in values
- [ ] Very long values (1MB+)
- [ ] Unicode in secret names
- [ ] Concurrent access

## Integration Tests

### Node.js

- [ ] Works with dotenv
- [ ] Works with Next.js
- [ ] Works with Express
- [ ] Nested env access works

### Python

- [ ] Works with Django
- [ ] Works with Flask
- [ ] os.environ access works
- [ ] subprocess inherits env

### Docker

- [ ] Entrypoint resolves secrets
- [ ] Multi-stage builds work
- [ ] Docker Compose works

## Performance Tests

- [ ] 1000 secrets: set < 30s
- [ ] 1000 secrets: get all < 5s
- [ ] Large values (1MB): < 1s
- [ ] Binary startup: < 100ms

## Security Tests

- [ ] Plaintext never in memory dumps
- [ ] Placeholders safe in Git
- [ ] Git hooks block .env commits
- [ ] Export requires strong password
- [ ] Import validates integrity
```

#### Task 27.2: Run Tests (3 hours)

Set up test environments:

**macOS:**

```bash
# Borrow a Mac or use cloud Mac
# Install and run through checklist
```

**Windows:**

```bash
# Use WSL or Windows VM
# Install and run through checklist
```

**Linux:**

```bash
# Use Docker or cloud instance
docker run -it ubuntu:22.04 bash
# Install and run through checklist
```

#### Task 27.3: Fix Critical Bugs (2 hours)

Common issues and fixes:

**Issue: Keychain access denied on macOS**

```typescript
// Add better error message
catch (error) {
  if (error.message.includes('access')) {
    console.error('Keychain access denied.');
    console.error('Grant access: System Preferences > Security > Privacy > Full Disk Access');
  }
}
```

**Issue: Windows PowerShell execution policy**

```powershell
# Update install script
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

**Issue: Linux libsecret not installed**

```bash
# Add to install script
if ! dpkg -l | grep libsecret-1-0; then
  sudo apt-get update
  sudo apt-get install -y libsecret-1-0
fi
```

#### Task 27.4: Add Telemetry (Optional) (1 hour)

**File**: `packages/cli/src/utils/telemetry.ts`

```typescript
import https from 'https';

export class Telemetry {
  private endpoint = 'https://api.localkeys.dev/telemetry';
  private enabled = process.env.LOCALKEYS_TELEMETRY !== 'false';

  async track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    try {
      const data = JSON.stringify({
        event,
        properties: {
          ...properties,
          version: '0.1.0',
          platform: process.platform,
          nodeVersion: process.version,
        },
        timestamp: new Date().toISOString(),
      });

      // Fire and forget (don't block CLI)
      const req = https.request(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        },
      });

      req.write(data);
      req.end();
    } catch {
      // Silently fail - don't impact CLI
    }
  }
}
```

Usage in commands:

```typescript
const telemetry = new Telemetry();
telemetry.track('command_executed', { command: 'set' });
```

## ✅ Checkpoint: Day 27 Complete

**You now have:**

- ✅ Comprehensive test coverage
- ✅ Critical bugs fixed
- ✅ Tested on all platforms
- ✅ Optional telemetry

---

## Day 28: Launch Preparation

### 🎯 Objective

Final polish and prepare for public launch.

### 📝 Tasks

#### Task 28.1: Create Launch Materials (2 hours)

**Blog post**: `docs/blog/introducing-localkeys.md`

````markdown
# Introducing LocalKeys: Local-First Secret Management

I built LocalKeys because I was tired of committing `.env` files to Git by accident.

## The Problem

As developers, we've all been there:

- Accidentally commit API keys to GitHub
- Slack teammates: "Hey, what's the database password?"
- `.env` files scattered across your machine
- Can't remember which secrets are for which project

Existing solutions are either:

- Too complex (HashiCorp Vault, AWS Secrets Manager)
- Not secure enough (plaintext .env files)
- Require servers/APIs (Doppler, Infisical)

## The Solution

LocalKeys stores secrets in your OS keychain (the same place your passwords live) and commits safe placeholder files to Git.

```bash
# Store a secret
localkeys set API_KEY sk_live_abc123

# Git shows this (safe!)
API_KEY=redacted:API_KEY:6c9d5a

# Your app gets this (automatically!)
process.env.API_KEY  // "sk_live_abc123"
```
````

## How It Works

1. **OS Keychain**: Secrets stored encrypted, machine-bound
2. **Git Placeholders**: Commit redacted files, not plaintext
3. **Runtime Injection**: Runners resolve secrets in-memory
4. **Zero Config**: Works out of the box, no servers

## Try It Now

```bash
npm install -g localkeys
localkeys init
localkeys set MY_SECRET hello
```

## Open Source

LocalKeys is MIT licensed and available on GitHub.
Star it if you find it useful!

[GitHub](https://github.com/localkeys/localkeys)

```

**Twitter Thread**:
```

🚀 Launching LocalKeys: Local-first secret management for developers

Stop committing .env files to Git. Stop Slacking API keys to teammates.

Here's how it works 🧵

1/ LocalKeys stores secrets in your OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)

Just like your saved passwords, but for development secrets.

2/ When you run `localkeys set API_KEY sk_live_abc123`, it:

- Stores the value in your keychain
- Updates .env.redacted with a safe placeholder
- You commit the placeholder, not the secret

3/ Your app automatically gets real values at runtime

No code changes. Just: node --require localkeys/runner app.js

Works with Node.js, Python, Docker, and more.

4/ Why not use Vault/AWS Secrets Manager?

Those are great for production. LocalKeys is for local development.

No servers. No APIs. No complexity.

Just: npm install -g localkeys

5/ Free, open source, MIT licensed

⭐ Star it: github.com/localkeys/localkeys
📚 Docs: localkeys.dev

```

**Product Hunt Launch** (if applicable):

**Title**: LocalKeys - Stop committing secrets to Git

**Tagline**: Local-first secret management for developers. Store secrets in your OS keychain, commit safe placeholders to Git.

**Description**:
```

LocalKeys solves the .env file problem:

- Never commit API keys to Git again
- Share config requirements, not secret values
- No servers, no complexity, works offline
- Free and open source

Perfect for individual developers and small teams who want security without enterprise complexity.

````

#### Task 28.2: Final Checks (1 hour)

```bash
# Version bump
pnpm version 0.1.0

# Tag release
git tag v0.1.0
git push origin v0.1.0

# Verify GitHub release created
gh release view v0.1.0

# Verify npm package published
npm view localkeys

# Test installation
npm install -g localkeys@latest
localkeys --version
````

#### Task 28.3: Launch Checklist (30 min)

**File**: `LAUNCH_CHECKLIST.md`

```markdown
# Launch Checklist

## Pre-Launch

- [ ] All tests passing on CI
- [ ] Binaries built for all platforms
- [ ] npm package published
- [ ] GitHub release created
- [ ] Documentation complete
- [ ] Landing page live
- [ ] Install scripts tested
- [ ] README badges working

## Launch Day

- [ ] Post on Twitter
- [ ] Post on Product Hunt
- [ ] Post on Hacker News (Show HN)
- [ ] Post on Reddit (r/programming, r/selfhosted)
- [ ] Post on Dev.to
- [ ] Email dev newsletter subscribers
- [ ] Post in relevant Discord/Slack communities

## Post-Launch

- [ ] Monitor GitHub issues
- [ ] Respond to comments/questions
- [ ] Track downloads/stars
- [ ] Collect user feedback
- [ ] Plan v0.2.0 features

## Support Channels

- GitHub Issues: https://github.com/localkeys/localkeys/issues
- Discord: https://discord.gg/localkeys
- Email: support@localkeys.dev
```

#### Task 28.4: Launch! (Variable)

**Submit to platforms:**

1. **Hacker News**:

   ```
   Title: Show HN: LocalKeys – Local-first secret management
   URL: https://github.com/localkeys/localkeys
   ```

2. **Reddit**:
   - r/programming
   - r/selfhosted
   - r/node
   - r/Python

3. **Product Hunt**:
   - Schedule for Tuesday-Thursday (best days)
   - Add demo video
   - Respond to all comments

4. **Dev.to**:
   - Publish blog post
   - Add to #opensource

5. **Twitter**:
   - Post thread
   - Tag relevant accounts
   - Use hashtags: #opensource #devsecops #nodejs

## ✅ Checkpoint: Day 28 Complete - LAUNCH DAY! 🚀

**You now have:**

- ✅ Complete product ready for public use
- ✅ All platforms supported
- ✅ Documentation complete
- ✅ Launch materials prepared
- ✅ v0.1.0 released

---

# Post-Launch (Day 29+)

## Week 5+: Maintenance & Growth

### 🎯 Objective

Support users, fix bugs, plan future features.

### 📝 Ongoing Tasks

#### Community Management (Daily)

```bash
# Monitor feedback channels
- GitHub Issues (respond within 24h)
- Product Hunt comments (respond within 1h)
- Twitter mentions
- Reddit threads
- Discord messages
```

#### Bug Fixes (As needed)

**Process:**

1. User reports bug in GitHub Issues
2. Reproduce locally
3. Write failing test
4. Fix bug
5. Verify test passes
6. Release patch version
7. Close issue

#### Feature Requests (Weekly)

**Prioritization:**

1. **P0**: Critical bugs blocking users
2. **P1**: High-value features requested by multiple users
3. **P2**: Nice-to-have improvements
4. **P3**: Future ideas

**Example roadmap for v0.2.0:**

- [ ] Cloud sync (most requested)
- [ ] Team management
- [ ] Rotation reminders
- [ ] Browser extension
- [ ] Mobile app (iOS/Android)

#### Metrics to Track

**Growth:**

- GitHub stars
- npm downloads/week
- Active users (telemetry)
- GitHub issues opened/closed

**Engagement:**

- Average session length
- Commands used per session
- Retention (Day 7, Day 30)

**Success Metrics:**

- 1,000 GitHub stars (Month 1)
- 10,000 npm downloads/month (Month 2)
- 100 active projects (Month 3)

---

## 📊 Summary: 28-Day Timeline

| Week       | Days  | Focus           | Deliverables                   |
| ---------- | ----- | --------------- | ------------------------------ |
| **Week 1** | 1-7   | Foundation      | Keychain + CLI + Git hooks     |
| **Week 2** | 8-14  | Core Features   | Rotation + Backup + Validation |
| **Week 3** | 15-21 | Runners         | Node + Python + Docker         |
| **Week 4** | 22-28 | Polish & Launch | Packaging + CI/CD + Launch     |

---

## 🎯 Key Success Factors

### 1. **Start Simple**

- Don't build cloud sync until local works perfectly
- Ship MVP fast, iterate based on feedback

### 2. **Test Thoroughly**

- Test on all platforms before launch
- Write tests for every bug fix

### 3. **Document Everything**

- Good docs = fewer support requests
- Examples > long explanations

### 4. **Engage Community**

- Respond quickly to issues
- Celebrate user wins
- Ask for feedback often

### 5. **Stay Focused**

- Resist feature creep
- "No" is often the right answer
- Keep the core simple

---

## 🚦 Next Steps After Launch

### Month 1: Stabilization

- Fix critical bugs
- Improve documentation
- Add examples for common frameworks
- Write blog posts

### Month 2: Growth

- Add cloud sync (if demand is high)
- Create video tutorials
- Guest post on dev blogs
- Sponsor relevant podcasts

### Month 3: Monetization

- Launch Team tier ($8/dev/month)
- Add SSO support
- Build compliance features
- Target small startups

---

## 🎓 Lessons for Implementation

### Do's ✅

- Start with macOS (easiest keychain API)
- Use TypeScript for type safety
- Write tests from day 1
- Ask for help when stuck
- Ship imperfect but working features

### Don'ts ❌

- Don't optimize prematurely
- Don't build features users don't want
- Don't ignore Windows/Linux users
- Don't skip documentation
- Don't launch without testing

---

## 📞 Get Help When Needed

**Stuck on something?**

1. **Search first**: GitHub Issues, Stack Overflow
2. **Ask community**: Reddit, Discord, Twitter
3. **Hire expert**: Upwork/Fiverr for specific tasks
4. **Pair program**: Find a coding buddy

**Remember**: Every developer gets stuck. Asking for help is smart, not weak.

---

## 🏆 Final Motivation

You're building something USEFUL.

Developers everywhere are committing secrets to Git right now. You're solving a real problem.

**Stay focused. Ship fast. Iterate based on feedback.**

You've got this! 🚀

---

## Appendix: Quick Reference

### Essential Commands

```bash
# Development
pnpm dev              # Run CLI in dev mode
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Check code quality

# Release
git tag v0.x.0        # Tag version
git push origin v0.x.0  # Trigger release

# Deploy docs
cd docs && git push origin gh-pages

# Check stats
gh repo view --web    # Open repo
npm view localkeys     # Check npm stats
```

### Important Files

```
README.md              # Main documentation
CHANGELOG.md           # Version history
CONTRIBUTING.md        # Contribution guide
LICENSE               # MIT license
.github/workflows/    # CI/CD
docs/                 # Documentation site
scripts/              # Build scripts
packages/cli/         # Main CLI
packages/runner-*/    # Language runners
```

### Useful Links

- Repo: https://github.com/localkeys/localkeys
- Docs: https://localkeys.dev
- npm: https://npmjs.com/package/localkeys
- Issues: https://github.com/localkeys/localkeys/issues

---

**END OF IMPLEMENTATION GUIDEBOOK**

You now have everything you need to build LocalKeys from scratch in 28 days.

Good luck! 🎉
