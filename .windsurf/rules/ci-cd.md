# CI/CD Rules

> **Purpose**: This document defines continuous integration, deployment, and code quality automation.

---

## Package Manager: npm

This project uses **npm** (not pnpm or yarn). All commands use npm:

```bash
npm install          # Install dependencies
npm ci               # Clean install (CI)
npm run build        # Build all packages
npm run dev          # Start dev server
npm run lint         # Run linting
npm run test         # Run tests
npm run format       # Format code
npm run format:check # Check formatting
```

---

## Commit Message Format

Use **simple, descriptive messages** without type prefixes:

```
Initialize turborepo monorepo with npm workspaces
Add shared TypeScript configurations
Implement Button primitive component
Add color token validation tests
Fix screenshot capture timeout handling
Update README with deployment instructions
```

### Guidelines

- Start with a verb (Add, Implement, Fix, Update, Remove, Refactor)
- Be specific about what changed
- Keep under 72 characters
- No period at the end

### Examples

| ✅ Good                           | ❌ Bad                               |
| --------------------------------- | ------------------------------------ |
| `Add Button component tests`      | `feat(primitives): add button tests` |
| `Fix screenshot timeout handling` | `fix: timeout`                       |
| `Update dependencies`             | `chore(deps): bump versions`         |
| `Implement checkpointing system`  | `Added checkpoints`                  |

---

## GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test

  build:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

---

## Pre-commit Hooks (Husky + lint-staged)

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml,css}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

---

## Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

## Render Deployment

### Blueprint (render.yaml)

```yaml
services:
  - type: web
    name: design-system-extractor
    runtime: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm run --workspace=apps/web start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: GEMINI_API_KEY
        sync: false
```

### Environment Variables

| Variable         | Description       | Where                     |
| ---------------- | ----------------- | ------------------------- |
| `GEMINI_API_KEY` | Google AI API key | Render dashboard (secret) |
| `NODE_ENV`       | Environment       | render.yaml               |

---

## Branch Strategy

- **main** — Production branch, protected
- **feature/\*** — Feature branches
- All changes via pull request
- CI must pass before merge

---

## Deployment Checklist

Before deploying:

- [ ] All CI checks pass
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Environment variables set in Render
- [ ] Health check endpoint works
