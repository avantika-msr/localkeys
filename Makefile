# LocalKeys Makefile
# Enterprise-grade shortcuts for common tasks

.PHONY: help install dev build test lint format clean reset release

# Default target
.DEFAULT_GOAL := help

## help: Display this help message
help:
	@echo "LocalKeys Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install        Install dependencies"
	@echo "  make setup          Full project setup (install + hooks)"
	@echo ""
	@echo "Development:"
	@echo "  make dev            Start development server"
	@echo "  make build          Build all packages"
	@echo "  make test           Run all tests"
	@echo "  make test-watch     Run tests in watch mode"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint           Run linter"
	@echo "  make lint-fix       Fix linting issues"
	@echo "  make format         Format code"
	@echo "  make typecheck      Check TypeScript types"
	@echo "  make validate       Run all validation checks"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean          Clean build artifacts"
	@echo "  make reset          Reset project (clean + reinstall)"
	@echo ""
	@echo "Release:"
	@echo "  make changeset      Create a changeset"
	@echo "  make release        Publish release"

## install: Install all dependencies
install:
	@echo "📦 Installing dependencies..."
	@pnpm install

## setup: Full project setup
setup: install
	@echo "🔧 Setting up project..."
	@pnpm prepare
	@echo "✅ Setup complete!"

## dev: Start development server
dev:
	@echo "🚀 Starting development server..."
	@pnpm dev

## build: Build all packages
build:
	@echo "📦 Building packages..."
	@pnpm build

## build-force: Force rebuild all packages
build-force:
	@echo "🔨 Force rebuilding packages..."
	@pnpm build:force

## test: Run all tests
test:
	@echo "🧪 Running tests..."
	@pnpm test

## test-watch: Run tests in watch mode
test-watch:
	@echo "👀 Running tests in watch mode..."
	@pnpm test:watch

## test-coverage: Run tests with coverage
test-coverage:
	@echo "📊 Running tests with coverage..."
	@pnpm test:coverage

## lint: Run linter
lint:
	@echo "🔍 Running linter..."
	@pnpm lint:errors

## lint-fix: Fix linting issues
lint-fix:
	@echo "🔧 Fixing linting issues..."
	@pnpm lint:fix

## format: Format code
format:
	@echo "✨ Formatting code..."
	@pnpm format

## format-check: Check code formatting
format-check:
	@echo "🔍 Checking formatting..."
	@pnpm format:check

## typecheck: Check TypeScript types
typecheck:
	@echo "🔍 Type checking..."
	@pnpm typecheck

## validate: Run all validation checks
validate:
	@echo "✅ Running all validations..."
	@pnpm validate

## validate-quick: Run quick validation (skip tests)
validate-quick:
	@echo "⚡ Running quick validation..."
	@pnpm validate:quick

## clean: Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@pnpm clean

## clean-all: Clean everything
clean-all:
	@echo "🧹 Cleaning everything..."
	@pnpm clean:all

## reset: Reset project (clean + reinstall)
reset:
	@echo "🔄 Resetting project..."
	@pnpm reset
	@echo "✅ Reset complete!"

## changeset: Create a changeset
changeset:
	@echo "📝 Creating changeset..."
	@pnpm changeset

## release: Publish release
release:
	@echo "🚀 Publishing release..."
	@pnpm release

## ci: Run CI pipeline
ci:
	@echo "🚀 Running CI pipeline..."
	@pnpm ci

## size: Check bundle sizes
size:
	@echo "📊 Checking bundle sizes..."
	@pnpm size
