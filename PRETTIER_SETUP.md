# Prettier & Husky Setup

This document outlines the code formatting and pre-commit hook setup for the IrisNotes project.

## What's Configured

### 1. Prettier (Code Formatting)

- **Prettier**: Automatic code formatting for consistent style
- **Configuration**: `.prettierrc` with opinionated defaults for React/TypeScript
- **Ignore**: `.prettierignore` excludes build outputs, node_modules, and generated files

### 2. ESLint Integration

- **eslint-config-prettier**: Disables ESLint rules that conflict with Prettier
- **eslint-plugin-prettier**: Runs Prettier as an ESLint rule

### 3. Husky (Git Hooks)

- **Pre-commit hook**: Automatically formats and lints staged files before commit
- **lint-staged**: Only runs on staged files for better performance

## Configuration Files

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "jsxSingleQuote": true,
  "bracketSameLine": false
}
```

### `package.json` Scripts

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "format:fix": "prettier --write . && eslint . --ext ts,tsx --fix",
  "prepare": "husky"
}
```

### `lint-staged` Configuration

```json
{
  "*.{ts,tsx,js,jsx}": ["prettier --write", "eslint --fix"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

## Available Commands

### Manual Formatting

```bash
# Format all files
pnpm run format

# Check if files are formatted (without changing them)
pnpm run format:check

# Format and fix linting issues
pnpm run format:fix

# Just lint
pnpm run lint

# Lint and fix
pnpm run lint:fix
```

## How It Works

### Pre-commit Hook

1. When you run `git commit`, Husky intercepts the command
2. `lint-staged` runs only on staged files:
   - Formats TypeScript/JavaScript files with Prettier
   - Fixes ESLint issues automatically
   - Formats other files (JSON, Markdown) with Prettier
3. If any files are modified, they're automatically staged
4. Commit proceeds if no errors occur

### Integration Points

- **ESLint**: Prettier runs as an ESLint rule (`prettier/prettier`)
- **Editor**: Works with VS Code Prettier extension
- **CI/CD**: Can be used in build pipelines with `format:check`

## Benefits

1. **Consistent Code Style**: All code follows the same formatting rules
2. **Automatic Formatting**: No manual formatting needed
3. **Pre-commit Safety**: Ensures all committed code is properly formatted
4. **Team Collaboration**: Reduces style-related code review comments
5. **Integration**: Works seamlessly with existing ESLint setup

## Customization

To modify formatting rules:

1. Edit `.prettierrc` for Prettier rules
2. Edit `eslint.config.js` for ESLint rules
3. Update `.prettierignore` to exclude additional files
4. Modify `lint-staged` in `package.json` for different file patterns

## Troubleshooting

### Hook Not Running

```bash
# Reinstall Husky hooks
pnpm exec husky init
```

### Format Issues

```bash
# Check what files have issues
pnpm run format:check

# Fix all formatting issues
pnpm run format
```

### Bypass Hook (Emergency)

```bash
# Skip pre-commit hook (not recommended)
git commit --no-verify -m "message"
```
