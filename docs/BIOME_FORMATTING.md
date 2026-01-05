# Biome Formatting Setup

This document covers formatting best practices and Biome configuration for IrisNotes.

## Current Configuration

Biome is configured in `biome.json` with:
- **Line width:** 80 characters
- **Indent:** Tabs (2-space width)
- **Quotes:** Double quotes
- **Semicolons:** Always
- **Trailing commas:** ES5 style

## Best Practices for Formatting

### Option 1: Format on Save (Recommended for Solo Dev)

Enable in VS Code settings:

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

**Pros:** Instant feedback, files always consistent
**Cons:** Requires editor configuration

### Option 2: Pre-commit Hook (Team Projects)

```bash
# Install husky + lint-staged
pnpm add -D husky lint-staged

# Configure in package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": "biome check --write"
  }
}
```

**Pros:** Enforced for everyone, catches issues before commit
**Cons:** Slows commits, can be bypassed with `--no-verify`

### Option 3: CI Check Only

```yaml
# .github/workflows/lint.yml
- run: pnpm biome check
```

**Pros:** Non-intrusive development
**Cons:** Late feedback, noisy PR diffs

## Industry Standard (2024+)

Most teams use a combination:

| Stage | Action | Purpose |
|-------|--------|---------|
| Editor | Format on save | Fast feedback |
| Pre-commit | `biome check --write --staged` | Safety net |
| CI | `biome check` (read-only) | Final enforcement |

## Recommended Setup for IrisNotes

Since this is a solo project:

1. **Format on save** - Primary method
2. **Skip pre-commit** - Unnecessary friction
3. **Optional CI check** - For discipline on PRs

## Reducing Formatting Churn

If Biome reformats too many files:

### Increase Line Width

```json
// biome.json
"formatter": {
  "lineWidth": 100  // or 120
}
```

### Be Explicit About Indent Style

```json
"formatter": {
  "indentStyle": "tab",  // or "space"
  "indentWidth": 2
}
```

### Ignore Generated Files

```json
"files": {
  "ignore": [
    "src-tauri/gen/**",
    "dist/**",
    "node_modules/**"
  ]
}
```

## Commands

```bash
# Check without modifying
pnpm biome check

# Fix all issues
pnpm biome check --write

# Format only (no linting)
pnpm biome format --write

# Check specific files
pnpm biome check src/components/
```

## VS Code Extension

Install the Biome extension: `biomejs.biome`

This provides:
- Real-time linting
- Format on save
- Quick fixes
- Import organization
