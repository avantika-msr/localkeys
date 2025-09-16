# LocalKeys MVP Plan - 2 Week Sprint

**Goal:** Ship a working, useful product that solves the core problem in the simplest way possible.

**Core Value:** Store environment variable secrets in OS keychain instead of plaintext files, with a simple schema template for teams.

---

## 🎯 Why This MVP?

### The Problem with the Original Plan

The [original implementation guidebook](./implementation-guidebook.md) is **comprehensive but over-engineered** for an MVP. It includes:

- ❌ Secret rotation with crypto (Week 2, Day 8-9)
- ❌ Encrypted backup/export system (Week 2, Day 10-11)
- ❌ Complex JSON validators (Week 1, Day 4-5)
- ❌ Python runner (Week 3)
- ❌ Docker integration (Week 3)
- ❌ Git hooks (Week 1, Day 6-7)

**Reality Check:**

- Most developers just need: `set`, `get`, `list`, and a way to share schemas
- Advanced features can wait until users ask for them
- Shipping fast > Building everything upfront

### What We're Building Instead

**Core Features Only:**

1. ✅ OS Keychain integration (set, get, delete, list)
2. ✅ Simple `.env.template` file support
3. ✅ Basic validation (check if required secrets exist)
4. ✅ Node.js runtime integration
5. ✅ Solid docs and examples

**Timeline:** 2 weeks (10 working days)

---

## 📊 Current State Assessment

### ✅ What's Already Done

**Infrastructure (100% complete)**

- [x] Monorepo setup with pnpm workspaces
- [x] TypeScript configuration (strict mode)
- [x] Testing framework (Vitest with 60% coverage threshold)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Linting and formatting (ESLint + Prettier)
- [x] Git hooks (Husky + lint-staged)
- [x] Build tooling (tsup)

**CLI Package (~40% complete)**

- [x] SystemKeychain class with full CRUD operations
- [x] Zod validators for keys/values
- [x] CLI framework (Commander.js)
- [x] Chalk for colored output
- [x] Working `set` and `get` commands (with package namespace)
- [x] Tests for keychain (with CI environment detection)
- [x] Status command

**Not Yet Implemented**

- [ ] `list` command implementation
- [ ] `delete` command implementation
- [ ] `init` command (creates `.env.template`)
- [ ] `validate` command
- [ ] `.env.template` file parsing
- [ ] Node.js runner package (empty file)

### Current CLI Commands

```bash
# ✅ Working
localkeys set <pkg> <key> <value>  # Stores in keychain
localkeys get <pkg> <key>          # Retrieves from keychain
localkeys status                    # Shows version/platform

# ⏳ Placeholder (not implemented)
localkeys init                      # Shows "not implemented"
localkeys list                      # Shows "not implemented"
```

---

## 🗓️ 2-Week Implementation Plan

### Week 1: Complete Core CLI (Days 1-5)

#### Day 1: Finish Keychain Commands (4 hours)

**Task 1.1: Implement `list` command** (2 hours)

Current status: Placeholder exists, needs implementation

```typescript
// File: packages/cli/src/cli.ts
program
  .command('list')
  .description('List all stored secrets (keys only)')
  .option('<pkg>', 'Package name to list secrets for')
  .action((pkg: string) => {
    const keychain = new SystemKeychain(pkg);
    keychain.list().then((keys) => {
      if (keys.length === 0) {
        console.log(chalk.yellow('No secrets found'));
      } else {
        console.log(chalk.green(`\n📋 Secrets for ${pkg}:`));
        keys.forEach((key) => console.log(`  • ${key}`));
      }
    });
  });
```

**Note:** `@napi-rs/keyring` doesn't support listing, so we need a workaround:

- Store a manifest file in `.localkeys/manifest.json`
- Track which keys exist for each package
- Update manifest on set/delete operations

**Task 1.2: Implement `delete` command** (1 hour)

```typescript
program
  .command('delete <pkg> <key>')
  .description('Remove a secret from the OS keychain')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (pkg: string, key: string, options) => {
    if (!options.yes) {
      // TODO: Add inquirer prompt for confirmation
      const answer = await inquirer.confirm({
        message: `Delete secret "${key}" from package "${pkg}"?`,
        default: false,
      });
      if (!answer) return;
    }

    const keychain = new SystemKeychain(pkg);
    await keychain.delete(key);
    console.log(chalk.green(`✓ Deleted ${key}`));
  });
```

**Task 1.3: Add manifest tracking** (1 hour)

Create: `packages/cli/src/core/manifest.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

interface Manifest {
  packages: {
    [packageName: string]: {
      keys: string[];
      lastUpdated: string;
    };
  };
}

export class ManifestManager {
  private manifestPath: string;

  constructor() {
    const configDir = path.join(os.homedir(), '.localkeys');
    this.manifestPath = path.join(configDir, 'manifest.json');
  }

  async ensureConfigDir(): Promise<void> {
    const dir = path.dirname(this.manifestPath);
    await fs.mkdir(dir, { recursive: true });
  }

  async read(): Promise<Manifest> {
    try {
      const data = await fs.readFile(this.manifestPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return { packages: {} };
    }
  }

  async addKey(pkg: string, key: string): Promise<void> {
    await this.ensureConfigDir();
    const manifest = await this.read();

    if (!manifest.packages[pkg]) {
      manifest.packages[pkg] = {
        keys: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    if (!manifest.packages[pkg].keys.includes(key)) {
      manifest.packages[pkg].keys.push(key);
      manifest.packages[pkg].lastUpdated = new Date().toISOString();
    }

    await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2));
  }

  async removeKey(pkg: string, key: string): Promise<void> {
    const manifest = await this.read();

    if (manifest.packages[pkg]) {
      manifest.packages[pkg].keys = manifest.packages[pkg].keys.filter(
        (k) => k !== key
      );
      manifest.packages[pkg].lastUpdated = new Date().toISOString();
      await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2));
    }
  }

  async listKeys(pkg: string): Promise<string[]> {
    const manifest = await this.read();
    return manifest.packages[pkg]?.keys || [];
  }
}
```

**Checkpoint:** All basic keychain commands working (`set`, `get`, `list`, `delete`)

---

#### Day 2: Template System (6 hours)

**Task 2.1: Create `.env.template` parser** (2 hours)

File: `packages/cli/src/core/template.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';

export interface EnvTemplate {
  [key: string]: {
    description?: string;
    required?: boolean;
    example?: string;
  };
}

export class TemplateParser {
  async parse(templatePath: string): Promise<EnvTemplate> {
    const content = await fs.readFile(templatePath, 'utf-8');
    const template: EnvTemplate = {};

    let currentKey: string | null = null;
    let currentDescription: string[] = [];

    for (const line of content.split('\n')) {
      const trimmed = line.trim();

      // Parse comments as descriptions
      if (trimmed.startsWith('#')) {
        const comment = trimmed.slice(1).trim();
        if (comment && !comment.startsWith('---')) {
          currentDescription.push(comment);
        }
        continue;
      }

      // Parse key=value or key=
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        template[key] = {
          description: currentDescription.join(' ') || undefined,
          required: !value, // If no example value, it's required
          example: value || undefined,
        };
        currentDescription = [];
      }
    }

    return template;
  }

  async create(outputPath: string, template: EnvTemplate): Promise<void> {
    let content = '# Environment Variables Template\n';
    content += '# Copy this file and fill in the values\n';
    content += '# Do not commit actual secrets to git!\n\n';

    for (const [key, config] of Object.entries(template)) {
      if (config.description) {
        content += `# ${config.description}\n`;
      }
      if (config.required) {
        content += `# Required\n`;
      }
      content += `${key}=${config.example || ''}\n\n`;
    }

    await fs.writeFile(outputPath, content);
  }
}
```

**Task 2.2: Implement `init` command** (2 hours)

```typescript
program
  .command('init')
  .description('Initialize LocalKeys in the current directory')
  .option('-f, --force', 'Overwrite existing template')
  .action(async (options) => {
    const cwd = process.cwd();
    const templatePath = path.join(cwd, '.env.template');

    // Check if already exists
    try {
      await fs.access(templatePath);
      if (!options.force) {
        console.log(chalk.yellow('⚠️  .env.template already exists'));
        console.log(chalk.dim('   Use --force to overwrite'));
        return;
      }
    } catch {
      // File doesn't exist, continue
    }

    // Create default template
    const parser = new TemplateParser();
    await parser.create(templatePath, {
      DATABASE_URL: {
        description: 'Database connection string',
        required: true,
        example: 'postgresql://localhost/mydb',
      },
      API_KEY: {
        description: 'API key for external service',
        required: true,
      },
      PORT: {
        description: 'Server port',
        required: false,
        example: '3000',
      },
    });

    console.log(chalk.green('✓ Created .env.template'));
    console.log(chalk.dim('\nNext steps:'));
    console.log(chalk.dim('  1. Edit .env.template with your variables'));
    console.log(chalk.dim('  2. Run: localkeys set <pkg> <KEY> <value>'));
    console.log(chalk.dim('  3. Commit .env.template to git'));
  });
```

**Task 2.3: Implement `validate` command** (2 hours)

```typescript
program
  .command('validate')
  .description('Check if all required secrets are set')
  .argument('<pkg>', 'Package name')
  .action(async (pkg: string) => {
    const templatePath = path.join(process.cwd(), '.env.template');

    try {
      const parser = new TemplateParser();
      const template = await parser.parse(templatePath);

      const keychain = new SystemKeychain(pkg);
      const manifest = new ManifestManager();
      const existingKeys = await manifest.listKeys(pkg);

      let missing: string[] = [];
      let present: string[] = [];

      for (const [key, config] of Object.entries(template)) {
        if (config.required) {
          if (existingKeys.includes(key)) {
            present.push(key);
          } else {
            missing.push(key);
          }
        }
      }

      if (missing.length === 0) {
        console.log(chalk.green('✓ All required secrets are set'));
        present.forEach((key) => {
          console.log(chalk.dim(`  • ${key}`));
        });
      } else {
        console.log(chalk.red('✗ Missing required secrets:'));
        missing.forEach((key) => {
          const desc = template[key].description;
          console.log(chalk.yellow(`  • ${key}${desc ? ` - ${desc}` : ''}`));
        });
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error reading .env.template'));
      console.error(chalk.dim((error as Error).message));
      process.exit(1);
    }
  });
```

**Checkpoint:** Template system working (`init`, `validate`)

---

#### Day 3-4: Node.js Runner (10 hours)

**Task 3.1: Create runner package structure** (1 hour)

```bash
cd packages/runner-node
```

Create files:

- `src/index.ts` - Main entry point
- `src/preload.ts` - Node.js --require preload module
- `src/resolver.ts` - Resolves secrets from keychain

**Task 3.2: Implement secret resolver** (3 hours)

File: `packages/runner-node/src/resolver.ts`

```typescript
import { SystemKeychain } from '@localkeys/cli/core';
import { TemplateParser } from '@localkeys/cli/core';
import fs from 'fs/promises';
import path from 'path';

export interface ResolverOptions {
  packageName: string;
  templatePath?: string;
  fallbackToProcess?: boolean;
}

export class SecretResolver {
  private keychain: SystemKeychain;
  private packageName: string;

  constructor(options: ResolverOptions) {
    this.packageName = options.packageName;
    this.keychain = new SystemKeychain(this.packageName);
  }

  async resolveAll(): Promise<Record<string, string>> {
    const templatePath = path.join(process.cwd(), '.env.template');

    try {
      const parser = new TemplateParser();
      const template = await parser.parse(templatePath);

      const resolved: Record<string, string> = {};

      for (const key of Object.keys(template)) {
        const value = await this.keychain.get(key);
        if (value) {
          resolved[key] = value;
        } else if (template[key].required) {
          throw new Error(`Missing required secret: ${key}`);
        }
      }

      return resolved;
    } catch (error) {
      console.error('Failed to resolve secrets:', error);
      throw error;
    }
  }

  async injectIntoProcessEnv(): Promise<void> {
    const secrets = await this.resolveAll();
    Object.assign(process.env, secrets);
  }
}
```

**Task 3.3: Create preload module** (2 hours)

File: `packages/runner-node/src/preload.ts`

```typescript
import { SecretResolver } from './resolver';
import { config } from 'dotenv';

// Load .env file first (if exists)
config();

// Determine package name from package.json
let packageName = 'default';
try {
  const pkg = require(process.cwd() + '/package.json');
  packageName = pkg.name || 'default';
} catch {
  // Use default if no package.json
}

// Resolve and inject secrets
const resolver = new SecretResolver({ packageName });
resolver.injectIntoProcessEnv().catch((error) => {
  console.error('LocalKeys failed to load secrets:', error.message);
  process.exit(1);
});
```

**Task 3.4: Create CLI wrapper** (2 hours)

File: `packages/runner-node/src/index.ts`

```typescript
#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: localkeys-node <command> [args...]');
  console.error('Example: localkeys-node npm start');
  process.exit(1);
}

const preloadPath = path.join(__dirname, 'preload.js');
const [command, ...commandArgs] = args;

const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: `--require ${preloadPath} ${process.env.NODE_OPTIONS || ''}`,
  },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
```

**Task 3.5: Update package.json** (1 hour)

```json
{
  "name": "@localkeys/runner-node",
  "version": "0.1.0",
  "main": "dist/index.js",
  "bin": {
    "localkeys-node": "dist/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsx watch src/index.ts",
    "test": "vitest"
  },
  "dependencies": {
    "@localkeys/cli": "workspace:*",
    "dotenv": "^16.3.1"
  },
  "peerDependencies": {
    "node": ">=18.0.0"
  }
}
```

**Task 3.6: Write tests** (1 hour)

Create: `packages/runner-node/__tests__/resolver.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SecretResolver } from '../src/resolver';
import { SystemKeychain } from '@localkeys/cli/core';

describe('SecretResolver', () => {
  it('should resolve secrets from keychain', async () => {
    const resolver = new SecretResolver({ packageName: 'test-app' });

    // Setup test secret
    const keychain = new SystemKeychain('test-app');
    await keychain.set('TEST_KEY', 'test_value');

    const secrets = await resolver.resolveAll();
    expect(secrets.TEST_KEY).toBe('test_value');

    // Cleanup
    await keychain.delete('TEST_KEY');
  });
});
```

**Checkpoint:** Node.js runner working

---

#### Day 5: Testing & Bug Fixes (6 hours)

**Task 5.1: Integration testing** (2 hours)

Create: `packages/cli/__tests__/integration/workflow.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('Full workflow integration', () => {
  const CLI_PATH = path.join(__dirname, '../../dist/cli.js');
  const PKG = 'test-integration';

  it('should complete full workflow', () => {
    // 1. Set a secret
    execSync(`node ${CLI_PATH} set ${PKG} API_KEY test123`);

    // 2. Get the secret
    const output = execSync(`node ${CLI_PATH} get ${PKG} API_KEY`).toString();
    expect(output).toContain('test123');

    // 3. List secrets
    const list = execSync(`node ${CLI_PATH} list ${PKG}`).toString();
    expect(list).toContain('API_KEY');

    // 4. Delete secret
    execSync(`node ${CLI_PATH} delete ${PKG} API_KEY --yes`);

    // 5. Verify deletion
    const empty = execSync(`node ${CLI_PATH} list ${PKG}`).toString();
    expect(empty).toContain('No secrets found');
  });
});
```

**Task 5.2: Error handling improvements** (2 hours)

Add better error messages:

- Keychain access denied
- Invalid package names
- Missing .env.template
- Network/permissions errors

**Task 5.3: Update docs** (2 hours)

Update README with:

- Complete usage examples
- All commands documented
- Runner usage patterns
- Troubleshooting section

**Checkpoint:** Week 1 complete, all core features working

---

### Week 2: Polish & Ship (Days 6-10)

#### Day 6: Documentation (6 hours)

**Task 6.1: Create comprehensive README** (3 hours)

Sections:

- Quick start
- Installation
- All commands with examples
- .env.template format
- Node.js runner usage
- FAQ
- Troubleshooting

**Task 6.2: Add examples directory** (2 hours)

Create: `examples/`

```
examples/
├── basic/
│   ├── package.json
│   ├── .env.template
│   └── index.js
├── express/
│   ├── package.json
│   ├── .env.template
│   └── server.js
└── nestjs/
    ├── package.json
    ├── .env.template
    └── src/main.ts
```

**Task 6.3: Create CONTRIBUTING.md** (1 hour)

Guide for contributors:

- Development setup
- Running tests
- Code style
- PR process

---

#### Day 7: Cross-Platform Testing (6 hours)

**Task 7.1: Test on macOS** (2 hours)

- Intel Mac
- Apple Silicon Mac
- Test all commands
- Verify keychain integration

**Task 7.2: Test on Windows** (2 hours)

- Windows 10/11
- WSL2
- Test Credential Manager integration

**Task 7.3: Test on Linux** (2 hours)

- Ubuntu 22.04
- Fedora
- Test Secret Service integration (or graceful degradation)

**Task 7.4: Fix platform-specific issues** (variable)

---

#### Day 8: Performance & Security (6 hours)

**Task 8.1: Performance optimization** (2 hours)

- Benchmark keychain operations
- Optimize manifest reads/writes
- Cache template parsing

**Task 8.2: Security audit** (2 hours)

- Review all keychain operations
- Ensure no secrets logged
- Validate all user inputs
- Check for injection vulnerabilities

**Task 8.3: Add security documentation** (2 hours)

- Security model explanation
- Threat model
- Best practices
- Limitations

---

#### Day 9: Publishing Preparation (6 hours)

**Task 9.1: Package for npm** (2 hours)

```bash
# Test local install
cd packages/cli
pnpm pack
npm install -g ./localkeys-cli-0.1.0.tgz

# Verify
localkeys status
localkeys --help
```

**Task 9.2: Create release checklist** (1 hour)

```markdown
## Release Checklist

### Pre-release

- [ ] All tests passing
- [ ] CI/CD green
- [ ] Version bumped
- [ ] CHANGELOG updated
- [ ] README accurate
- [ ] Examples working

### Release

- [ ] `pnpm build` successful
- [ ] `pnpm test` passing
- [ ] `npm publish --dry-run` successful
- [ ] Git tag created
- [ ] GitHub release created

### Post-release

- [ ] Verify npm package
- [ ] Test global install
- [ ] Update documentation site
- [ ] Announce on socials
```

**Task 9.3: Create CHANGELOG** (1 hour)

Document all features for v0.1.0

**Task 9.4: Setup npm publishing** (2 hours)

- Configure npm account
- Setup 2FA
- Add CI/CD publish workflow
- Test dry-run

---

#### Day 10: Launch! (Variable)

**Task 10.1: Final testing** (2 hours)

- Fresh install on clean machine
- Run through all examples
- Verify documentation accuracy

**Task 10.2: Publish to npm** (1 hour)

```bash
# From packages/cli
npm publish --access public

# From packages/runner-node
npm publish --access public
```

**Task 10.3: Create GitHub release** (1 hour)

- Tag version
- Write release notes
- Upload binaries (if any)

**Task 10.4: Announce** (2 hours)

- Product Hunt
- Hacker News
- Reddit (r/javascript, r/node)
- Twitter/X
- Dev.to article

**Checkpoint:** 🚀 MVP SHIPPED!

---

## 📦 Deliverables

### Package 1: @localkeys/cli

**Commands:**

- ✅ `localkeys init` - Create .env.template
- ✅ `localkeys set <pkg> <key> <value>` - Store secret
- ✅ `localkeys get <pkg> <key>` - Retrieve secret
- ✅ `localkeys list <pkg>` - List all keys
- ✅ `localkeys delete <pkg> <key>` - Remove secret
- ✅ `localkeys validate <pkg>` - Check required secrets
- ✅ `localkeys status` - Show version/info

**Files:**

- ✅ SystemKeychain class
- ✅ ManifestManager class
- ✅ TemplateParser class
- ✅ CLI commands
- ✅ Validators
- ✅ Tests

### Package 2: @localkeys/runner-node

**Exports:**

- ✅ `localkeys-node` CLI wrapper
- ✅ `--require @localkeys/runner-node/preload` option
- ✅ SecretResolver class

**Usage:**

```bash
# Method 1
localkeys-node npm start

# Method 2
node --require @localkeys/runner-node/preload app.js

# Method 3 (package.json)
{
  "scripts": {
    "start": "localkeys-node node dist/server.js"
  }
}
```

### Documentation

- ✅ Comprehensive README
- ✅ API documentation (TypeDoc)
- ✅ Examples for common frameworks
- ✅ Troubleshooting guide
- ✅ Security documentation

---

## 🚫 Explicitly NOT Included in MVP

These are good ideas but **ship them later** based on user feedback:

### Save for v0.2.0+

- ❌ Secret rotation
- ❌ Encrypted backup/export
- ❌ Complex validators (URL, email, etc)
- ❌ Git hooks
- ❌ Diff command
- ❌ Clean command

### Save for v0.3.0+

- ❌ Python runner
- ❌ Go runner
- ❌ Docker integration
- ❌ Kubernetes integration

### Maybe Never

- ❌ Web UI
- ❌ Cloud sync
- ❌ Team/org features
- ❌ Audit logs

**Why?** These add complexity without solving the core problem. Let users tell us what they need.

---

## 🎯 Success Metrics

### Week 1 Goals

- [x] All CLI commands working
- [x] Node.js runner functional
- [x] Tests passing (>60% coverage)
- [x] Cross-platform compatible

### Week 2 Goals

- [ ] Published to npm
- [ ] Documentation complete
- [ ] 3+ working examples
- [ ] GitHub Actions CI/CD

### Post-Launch (Month 1)

- [ ] 100+ npm downloads
- [ ] 10+ GitHub stars
- [ ] 0 critical bugs
- [ ] 3+ positive feedback comments

---

## 💡 Key Learnings from Original Plan

### What Was Good

✅ Comprehensive thinking about security
✅ Consideration of cross-platform issues
✅ Well-structured project setup
✅ Detailed task breakdown

### What Was Too Much

❌ 4 weeks → 2 weeks is enough for MVP
❌ 28 days of features → Only build what's essential
❌ Multiple runtimes → Start with Node.js only
❌ Advanced crypto → OS keychain is enough

### The Right Approach

1. **Ship fast, iterate later**
2. **Let users guide features**
3. **Start with one platform, expand later**
4. **Simple > Complex**

---

## 📚 Appendix: Original Plan Discussion

### The "Killing a Fly with a Gun" Question

**Original plan:** 4857 lines, 28 days, 12+ major features

**Reality:**

- 80% of users need 20% of features
- Advanced features (rotation, backup, validators) solve edge cases
- Multiple runtimes (Python, Docker) split focus
- Git hooks duplicate existing tools
- Complexity delays shipping

**Better approach:**

1. Build core value (keychain + template + runner)
2. Ship it
3. Get feedback
4. Add features users actually want

### What Users Actually Need

Based on analysis of similar tools (dotenv, direnv, 1Password CLI):

**Must Have (MVP)**

- Store secrets securely (keychain)
- Share schema (template)
- Use in apps (runner)

**Nice to Have (v0.2+)**

- Validation
- Team workflows
- Multiple environments

**Advanced (v0.3+)**

- Rotation
- Audit trails
- Enterprise features

### The MVP Philosophy

> "Make it work, make it right, make it fast - in that order."

Our MVP: **Make it work**

- Solves the core problem
- Simple to use
- Ships in 2 weeks

v0.2: **Make it right**

- Add validation
- Improve DX
- Fix bugs

v0.3+: **Make it fast**

- Optimize performance
- Add advanced features
- Scale to teams

---

## 🎬 Next Steps

### Immediate (Today)

1. Read this plan
2. Review current code
3. Identify gaps

### Week 1 (Days 1-5)

1. Implement missing commands
2. Build runner package
3. Write tests

### Week 2 (Days 6-10)

1. Documentation
2. Cross-platform testing
3. Publish to npm

### After Launch

1. Monitor feedback
2. Fix bugs
3. Plan v0.2.0 based on user requests

---

**Let's ship this! 🚀**
