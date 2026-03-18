# LocalKeys

**Local-first secret management for developers.**

Instead of storing secrets in `.env` files that can be accidentally committed to git, LocalKeys stores them in your **OS native keychain** — macOS Keychain, Windows Credential Manager, or Linux Secret Service. Only a metadata manifest (no actual values) is committed to version control.

```bash
# Store a secret securely
lkeys set API_KEY sk-abc123

# Retrieve it
lkeys get API_KEY

# Use it in Node.js — drop-in dotenv replacement
import { config } from '@localkeys/node'
await config()
console.log(process.env.API_KEY) // ✓ loaded from keychain
```

---

## Why LocalKeys?

- **No accidental secret leaks** — values never touch the filesystem
- **Zero config sharing** — teammates pull the repo and run `lkeys check` to know what secrets they need
- **Drop-in dotenv replacement** — swap one import, everything else stays the same
- **Works offline** — no network, no cloud service, no IAM roles needed
- **Cross-platform** — macOS, Windows, Linux

---

## Packages

| Package | Version | Description |
|---|---|---|
| [`@localkeys/cli`](./packages/cli) | 0.1.7 | The `lkeys` CLI tool |
| [`@localkeys/node`](./packages/node) | 0.2.0 | Node.js runtime integration (dotenv replacement) |

---

## Installation

> **Note:** npm packages are not published yet. Clone the repo and build locally in the meantime.

### CLI

```bash
git clone https://github.com/avantika-msr/localkeys.git
cd localkeys
pnpm install
pnpm build
cd packages/cli && npm link
```

```bash
lkeys --version
lkeys --help
```

### Node.js runtime

```bash
git clone https://github.com/avantika-msr/localkeys.git
cd localkeys
pnpm install
pnpm build
```

Then link it globally and install it in your project:

```bash
cd packages/node && npm link

# In your target project:
npm link @localkeys/node
```

**Requirements:** Node.js >= 18, pnpm >= 8

---

## Quick Start

### 1. Initialize a project

```bash
cd your-project
lkeys init
```

This creates a `.localkeys/` directory with a `manifest.json` file. **Commit this file** — it tracks which secrets the project needs (but never the values).

### 2. Set secrets

```bash
lkeys set DATABASE_URL postgres://localhost:5432/mydb
lkeys set API_KEY sk-abc123
lkeys set STRIPE_SECRET sk_live_...
```

### 3. Check what's configured

```bash
lkeys list
lkeys check
```

### 4. Use in your app

**Option A — Programmatic (recommended):**

```typescript
// At the top of your entry file
import { config } from '@localkeys/node'
await config()

// Now all secrets are available in process.env
console.log(process.env.DATABASE_URL)
```

**Option B — Auto-load via import:**

```typescript
import '@localkeys/node/config'
// Secrets are loaded automatically on import
```

**Option C — Node.js --require flag (no code changes):**

```bash
node --require @localkeys/node/register src/server.js
```

### 5. Migrate an existing `.env` file

```bash
lkeys migrate --file .env
```

This reads your `.env` file and moves all secrets into the keychain.

---

## CLI Reference

All commands support `-e, --env <name>` to target a specific environment (default: `development`).

| Command | Description |
|---|---|
| `lkeys init` | Initialize LocalKeys in the current project |
| `lkeys set <key> <value>` | Store a secret in the OS keychain |
| `lkeys get <key>` | Retrieve and print a secret value |
| `lkeys show <key>` | Show a secret (masked by default, use `--reveal` to show) |
| `lkeys del <key>` | Delete a secret from the keychain |
| `lkeys list` | List all secret key names for this project |
| `lkeys check` | Audit secrets — validates required keys are present, checks for plain `.env` files |
| `lkeys migrate` | Import secrets from an existing `.env` file |
| `lkeys export` | Export secrets to a `.env` file ⚠️ insecure — use with caution |
| `lkeys template` | Generate a `.env.template` file from current secret names |
| `lkeys edit [key]` | Interactively edit secrets |
| `lkeys copy [key]` | Copy a secret value to the clipboard |

**Global flags:**

```
-e, --env <environment>   Environment name (default: development)
-v, --verbose             Enable verbose output
    --help                Show help
    --version             Print version
```

**Examples:**

```bash
# Work with a specific environment
lkeys set --env production DATABASE_URL postgres://prod-host/db
lkeys list --env staging
lkeys check --env production

# Migrate from .env
lkeys migrate --file .env.local --env development

# Export for debugging (careful!)
lkeys export --env staging > .env.staging.tmp
```

---

## Node.js API

```typescript
import { config, load, populate, detectEnvironment } from '@localkeys/node'
```

### `config(options?)`

Drop-in replacement for `dotenv.config()`. Loads secrets from the keychain into `process.env`.

```typescript
const result = await config({
  environment: 'staging',   // override NODE_ENV detection
  projectRoot: '/my/app',   // default: process.cwd()
  debug: true,              // log what's being loaded
  override: false,          // don't overwrite existing process.env values
})
```

### `load(options?)`

Same as `config()` — returns a `LoadResult` object with parsed values.

### `populate(options?)`

Returns the secrets as a plain object without modifying `process.env`.

```typescript
const secrets = await populate({ environment: 'test' })
console.log(secrets.DATABASE_URL)
```

### `detectEnvironment()`

Returns the detected environment string (checks `LOCALKEYS_ENV`, then `NODE_ENV`, then `'development'`).

### Testing utilities

```typescript
import { MockKeychain, withCleanEnv } from '@localkeys/node/testing'

const mock = new MockKeychain()
mock.set('my-app', 'test', 'API_KEY', 'test-value')
```

---

## Environments

LocalKeys namespaces secrets per environment. This lets you have separate values for `development`, `staging`, and `production` on the same machine.

```bash
lkeys set --env development DATABASE_URL postgres://localhost/dev
lkeys set --env staging    DATABASE_URL postgres://staging-host/db
lkeys set --env production DATABASE_URL postgres://prod-host/db
```

Environment is auto-detected at runtime from (in priority order):

1. `LOCALKEYS_ENV` environment variable
2. `NODE_ENV` environment variable
3. Defaults to `development`

---

## How It Works

```
┌─────────────────────────────────────────────┐
│  Your Project                               │
│                                             │
│  .localkeys/                                │
│    manifest.json  ← committed to git        │
│    (key names, required flags, timestamps)  │
│                                             │
│  NO .env files with real values             │
└──────────────────┬──────────────────────────┘
                   │ lkeys set / get
                   ▼
┌─────────────────────────────────────────────┐
│  OS Keychain                                │
│                                             │
│  my-app:development:DATABASE_URL = "..."    │
│  my-app:development:API_KEY      = "..."    │
│  my-app:production:DATABASE_URL  = "..."    │
└─────────────────────────────────────────────┘
```

Secrets are keyed as `{package}:{environment}:{key}` to prevent collisions across projects and environments sharing the same machine.

The manifest file tracks which keys exist and which are required — so teammates can run `lkeys check` after cloning to know exactly what secrets they need to set up.

---

## Development Setup

This is a pnpm monorepo using Turbo.

```bash
# Clone the repo
git clone https://github.com/avantika-msr/localkeys.git
cd localkeys

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the CLI locally
node packages/cli/dist/cli.js --help

# Or link globally
cd packages/cli && npm link
lkeys --help
```

### Common scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run CLI in watch mode (hot-reload via tsx) |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm lint:fix` | ESLint with auto-fix |
| `pnpm format` | Prettier format |
| `pnpm validate` | Full validation (format + lint + types + tests) |
| `pnpm clean` | Remove all build artifacts |

### Project structure

```
envguard/
├── packages/
│   ├── cli/          # @localkeys/cli — the lkeys binary
│   │   └── src/
│   │       ├── cli.ts
│   │       └── commands/
│   │           ├── init.action.ts
│   │           ├── set.action.ts
│   │           ├── get.action.ts
│   │           └── ...
│   ├── node/         # @localkeys/node — Node.js runtime
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config.ts
│   │       ├── register.ts
│   │       └── testing/
│   └── core/         # @localkeys/core — internal (not published)
│       └── src/
│           ├── keychain/
│           ├── manifest/
│           └── config/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Security

- Secret **values** are stored exclusively in the OS keychain — never written to disk in plaintext
- The manifest file contains only key names, not values — safe to commit publicly
- Input validation via Zod: key names are restricted to alphanumeric, `-`, `_` (max 255 chars); values reject control characters
- The `export` command explicitly warns that writing to `.env` files is insecure
- `lkeys check` detects existing `.env` files and missing `.gitignore` entries

---

## Platform Support

| Platform | Keychain Backend |
|---|---|
| macOS | Keychain Access |
| Windows | Credential Manager |
| Linux | Secret Service (e.g. GNOME Keyring, KWallet) |

Native bindings provided by [`@napi-rs/keyring`](https://github.com/nicolo-ribaudo/keyring) — pre-built for each platform, no native compilation needed on install.

---

## Contributing

```bash
pnpm install
pnpm build
pnpm test
pnpm validate  # run before submitting a PR
```

Pre-commit hooks (Husky + lint-staged) run lint and type-check automatically on each commit.

---

## License

MIT — see [LICENSE](./LICENSE)

---

*Built by [Avantika](https://github.com/avantika-msr)*
