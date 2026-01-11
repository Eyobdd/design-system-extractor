# Design System Extractor — Implementation Roadmap

> **Purpose**: Step-by-step implementation guide for Windsurf. Each CL is atomic, small, and focused. Check off tasks as you complete them.

---

## ⚠️ Instructions for Windsurf

### Before Starting

1. **Read this entire document** to understand the scope
2. **Read `.windsurf/rules/architecture.md`** for core principles
3. **Review and critique this roadmap** — suggest improvements before implementing
4. **Ask clarifying questions** if anything is unclear

### During Implementation

1. **Work through CLs sequentially** — each builds on the previous
2. **Check off tasks** as you complete them using `- [x]`
3. **Run verification commands** before moving to the next CL
4. **STOP at checkpoints** and surface any concerns
5. **Commit after each CL** with the provided commit message (no type prefix)
6. **If something seems wrong**, ask rather than guess
7. **Suggest improvements** as you discover them

### Commit Message Format

Use simple, descriptive commit messages WITHOUT type prefixes:

```
Initialize turborepo monorepo with npm workspaces
Add shared TypeScript configurations
Create @extracted/types package structure
```

---

## Core Values (Reference)

1. **Type Safety as Enforcement** — Types prevent misuse
2. **Primitives Are Style-Locked** — No `className`, `style`, or `id` props
3. **Types Define Contract, Tokens Implement** — Separation of concerns
4. **Extract Reality, Don't Normalize** — Capture what exists
5. **95%+ Match Before User Review** — Automated threshold
6. **Human Verification Required** — Final accept/reject is human

---

## Phase 0: Repository Setup

### CL-0.1: Create GitHub Repository

- [x] Go to github.com/new
- [x] Repository name: `design-system-extractor`
- [x] Owner: `Eyobdd`
- [x] Public repository
- [x] Do NOT initialize with README (we have one)
- [x] Create repository

**Commit**: N/A (GitHub UI)

---

### CL-0.2: Initialize Local Repository

- [x] Run `git init` in project root
- [x] Run `git add .`
- [x] Run `git commit -m "Initialize project structure"`
- [x] Run `git remote add origin https://github.com/Eyobdd/design-system-extractor.git`
- [x] Run `git branch -M main`
- [x] Run `git push -u origin main`

**Commit**: `Initialize project structure`

---

### CL-0.3: Verify CI Pipeline

- [ ] Push triggers GitHub Actions
- [ ] CI workflow appears in Actions tab (includes Docker/Puppeteer environment)
- [ ] All jobs run (may fail until code exists — that's OK)

**Commit**: N/A (verification only)

**🛑 CHECKPOINT**: Repository is live on GitHub. CI is configured.

---

## Phase 1: Monorepo Foundation

### CL-1.1: Install Root Dependencies

- [x] Run `npm install`
- [x] Verify `node_modules/` created
- [x] Verify `package-lock.json` created
- [x] Run `npx turbo --version` — should output version

**Commit**: `Install root dependencies`

---

### CL-1.2: Setup Husky Pre-commit Hooks

- [x] Run `npx husky init`
- [x] Create `.husky/pre-commit` with content:
  ```bash
  npx lint-staged
  ```
- [x] Test: Create dummy file, stage it, commit — hooks should run
- [x] Delete dummy file

**Commit**: `Setup husky pre-commit hooks`

---

### CL-1.3: Create ESLint Config Package

- [x] Create `packages/eslint-config/package.json`:
  ```json
  {
    "name": "@extracted/eslint-config",
    "version": "0.0.0",
    "private": true,
    "main": "base.js",
    "files": ["base.js", "react.js", "node.js"],
    "devDependencies": {
      "@typescript-eslint/eslint-plugin": "^8.0.0",
      "@typescript-eslint/parser": "^8.0.0",
      "eslint": "^9.0.0",
      "eslint-config-prettier": "^9.1.0",
      "eslint-plugin-react": "^7.37.0",
      "eslint-plugin-react-hooks": "^5.0.0"
    }
  }
  ```
- [x] Create `packages/eslint-config/base.js` with TypeScript rules
- [x] Create `packages/eslint-config/react.js` extending base
- [x] Run `npm install`

**Commit**: `Add ESLint configuration package`

---

### CL-1.4: Add Root ESLint Config

- [x] Create root `eslint.config.js` that uses shared config
- [x] Run `npm run lint` — should work (no files to lint yet)

**Commit**: `Configure root ESLint`

**🛑 CHECKPOINT**: Tooling complete. `npm run lint`, `npm run format:check` work.

---

## Phase 2: Type System Foundation

### CL-2.1: Create Types Package Structure

- [x] Create `packages/types/package.json`:
  ```json
  {
    "name": "@extracted/types",
    "version": "0.0.0",
    "private": true,
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
      "build": "tsc",
      "typecheck": "tsc --noEmit",
      "lint": "eslint src"
    },
    "devDependencies": {
      "@extracted/tsconfig": "*",
      "typescript": "^5.7.0"
    }
  }
  ```
- [x] Create `packages/types/tsconfig.json` extending base
- [x] Create `packages/types/src/index.ts` (empty export)

**Commit**: `Scaffold @extracted/types package`

---

### CL-2.2: Define Primitive Token Types

- [x] Create `packages/types/src/primitives/colors.ts`:
  ```typescript
  export type SurfaceColorKey = string; // Narrowed during extraction
  export type TextColorKey = string;
  export type BorderColorKey = string;
  export type ShadowKey = string;
  ```
- [x] Create `packages/types/src/primitives/typography.ts`
- [x] Create `packages/types/src/primitives/spacing.ts`
- [x] Create `packages/types/src/primitives/index.ts` barrel export
- [x] Export from main `index.ts`

**Commit**: `Add primitive token type definitions`

---

### CL-2.3: Define Component Variant Specs

- [x] Create `packages/types/src/components/button.ts`:
  ```typescript
  export interface ButtonVariantSpec {
    surface: string;
    text: string;
    border: string | null;
    radius: string;
    paddingX: number;
    paddingY: number;
    fontSize: string;
    fontWeight: string;
  }
  ```
- [x] Create `packages/types/src/components/card.ts`
- [x] Create `packages/types/src/components/input.ts`
- [x] Create `packages/types/src/components/text.ts`
- [x] Create `packages/types/src/components/index.ts` barrel export

**Commit**: `Add component variant spec types`

---

### CL-2.4: Build and Verify Types Package

- [x] Run `npm run build --workspace=packages/types`
- [x] Verify `packages/types/dist/` contains `.js` and `.d.ts` files
- [x] Run `npm run typecheck --workspace=packages/types`

**Commit**: `Verify types package builds`

**🛑 CHECKPOINT**: Types package compiles. Ready for tokens.

---

## Phase 3: Tokens Package

### CL-3.1: Create Tokens Package Structure

- [ ] Create `packages/tokens/package.json` with dependency on `@extracted/types`
- [ ] Create `packages/tokens/tsconfig.json`
- [ ] Create `packages/tokens/src/index.ts`

**Commit**: `Scaffold @extracted/tokens package`

---

### CL-3.2: Create Placeholder Token Values

- [ ] Create `packages/tokens/src/primitives/colors.ts`:
  ```typescript
  export const surfaceColors = {
    'surface-default': '#ffffff',
    'surface-elevated': '#f8fafc',
    'surface-muted': '#f1f5f9',
  } as const;
  ```
- [ ] Create `packages/tokens/src/primitives/typography.ts`
- [ ] Create `packages/tokens/src/primitives/spacing.ts`
- [ ] Create barrel exports

**Commit**: `Add placeholder token values`

---

### CL-3.3: Create CSS Generation Utility

- [ ] Create `packages/tokens/src/css/generate.ts`:
  ```typescript
  export function generateCSSVariables(tokens: Record<string, unknown>): string {
    // Generate :root { --color-surface-default: #fff; ... }
  }
  ```
- [ ] Create `packages/tokens/scripts/generate-css.ts` build script
- [ ] Add `build:css` script to package.json

**Commit**: `Add CSS variable generation`

---

### CL-3.4: Add Token Tests

- [ ] Install Vitest: `npm install -D vitest --workspace=packages/tokens`
- [ ] Create `packages/tokens/vitest.config.ts`
- [ ] Create `packages/tokens/__tests__/colors.test.ts`:
  - Test: All color values are valid hex
  - Test: Surface colors exist
- [ ] Run `npm test --workspace=packages/tokens`

**Commit**: `Add token validation tests`

**🛑 CHECKPOINT**: Tokens package complete with tests.

---

## Phase 4: Primitives Package

### CL-4.1: Create Primitives Package Structure

- [ ] Create `packages/primitives/package.json`
- [ ] Create `packages/primitives/tsconfig.json`
- [ ] Install React: `npm install react react-dom --workspace=packages/primitives`
- [ ] Install Vitest + Testing Library

**Commit**: `Scaffold @extracted/primitives package`

---

### CL-4.2: Create Allowed Props Whitelist

- [ ] Create `packages/primitives/src/types/allowed-props.ts`:
  ```typescript
  export type AllowedButtonBehavioralProps = Pick<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    | 'onClick'
    | 'onFocus'
    | 'onBlur'
    | 'disabled'
    | 'type'
    | 'aria-label'
    | 'aria-pressed'
    | 'tabIndex'
    // ... full whitelist, NO id/className/style
  >;
  ```
- [ ] Create `AllowedDivBehavioralProps`
- [ ] Create `AllowedInputBehavioralProps`

**Commit**: `Add allowed behavioral props whitelist`

---

### CL-4.3: Implement Button Primitive

- [ ] Create `packages/primitives/src/Button/Button.tsx`:
  - Accept only `AllowedButtonBehavioralProps` + `variant` + `children`
  - Use `forwardRef`
  - NO className, style, id
- [ ] Create `packages/primitives/src/Button/index.ts`

**Commit**: `Implement Button primitive component`

---

### CL-4.4: Add Button Tests

- [ ] Create `packages/primitives/src/Button/Button.test.tsx`:
  - Test: Renders children
  - Test: Forwards ref
  - Test: onClick fires
  - Test: Disabled prevents click
  - Test: Keyboard accessible (Enter/Space)
  - Test (compile): TypeScript prevents className
  - Test (compile): TypeScript prevents style
  - Test (compile): TypeScript prevents id
- [ ] Run tests

**Commit**: `Add Button behavior tests`

---

### CL-4.5: Implement Card Primitive

- [ ] Create `packages/primitives/src/Card/Card.tsx`
- [ ] Create `packages/primitives/src/Card/Card.test.tsx`
- [ ] NO slots — just styled container

**Commit**: `Implement Card primitive component`

---

### CL-4.6: Implement Text and Input Primitives

- [ ] Create `packages/primitives/src/Text/Text.tsx`
- [ ] Create `packages/primitives/src/Input/Input.tsx`
- [ ] Add tests for both
- [ ] Create package barrel export

**Commit**: `Implement Text and Input primitives`

**🛑 CHECKPOINT**: All primitives implemented with tests.

---

## Phase 5: Extractor Package — Core

### CL-5.1: Create Extractor Package Structure

- [ ] Create `packages/extractor/package.json`
- [ ] Install: `puppeteer`, `sharp`, `@langchain/google-genai`
- [ ] Create directory structure:
  ```
  src/
  ├── screenshot/
  ├── vision/
  ├── dom/
  ├── tokens/
  ├── comparison/
  ├── checkpoint/
  └── index.ts
  ```

**Commit**: `Scaffold @extracted/extractor package`

---

### CL-5.2: Implement Checkpointing System

- [ ] Create `packages/extractor/src/checkpoint/types.ts`:
  ```typescript
  export interface ExtractionCheckpoint {
    id: string;
    url: string;
    status:
      | 'pending'
      | 'screenshot'
      | 'vision'
      | 'extraction'
      | 'comparison'
      | 'complete'
      | 'failed';
    progress: number; // 0-100
    startedAt: Date;
    updatedAt: Date;
    screenshots?: { viewport: Buffer; fullPage: Buffer };
    identifiedComponents?: ComponentIdentification[];
    extractedTokens?: Record<string, unknown>;
    comparisons?: ComponentComparison[];
    error?: string;
  }
  ```
- [ ] Create `packages/extractor/src/checkpoint/store.ts`:
  ```typescript
  export class CheckpointStore {
    async save(checkpoint: ExtractionCheckpoint): Promise<void>;
    async load(id: string): Promise<ExtractionCheckpoint | null>;
    async update(id: string, partial: Partial<ExtractionCheckpoint>): Promise<void>;
  }
  ```
- [ ] Implement file-based storage (JSON files in `.checkpoints/`)

**Commit**: `Implement extraction checkpointing system`

---

### CL-5.3: Implement Screenshot Capture

- [ ] Create `packages/extractor/src/screenshot/capture.ts`:
  - Launch Puppeteer headless
  - Navigate to URL
  - Wait for network idle
  - Capture viewport screenshot
  - Update checkpoint to 'screenshot' status
- [ ] Create `packages/extractor/src/screenshot/stitch.ts`:
  - Scroll and capture full page
  - Stitch into single image

**Commit**: `Implement screenshot capture with checkpointing`

---

### CL-5.4: Add Screenshot Tests

- [ ] Create `packages/extractor/__tests__/screenshot.test.ts`:
  - Test: Captures screenshot of valid URL
  - Test: Handles invalid URL
  - Test: Updates checkpoint on success
  - Test: Updates checkpoint on failure

**Commit**: `Add screenshot capture tests`

---

### CL-5.5: Implement Vision Component Identification

- [ ] Create `packages/extractor/src/vision/prompts.ts`:
  - System prompt for component identification
  - Output JSON schema
- [ ] Create `packages/extractor/src/vision/identify.ts`:
  - Initialize Gemini 2.5 Flash via LangChain
  - Send screenshot
  - Parse response to component list with bounding boxes
  - Update checkpoint to 'vision' status

**Commit**: `Implement vision-based component identification`

---

### CL-5.6: Implement DOM Style Extraction (including Pseudo-classes)

- [ ] Create `packages/extractor/src/dom/properties.ts`:
  - `RELEVANT_PROPERTIES` object with kebab-case property names
  - Property groups: core, layout, sizing, interaction, etc.
- [ ] Create `packages/extractor/src/dom/extract.ts`:
  - Execute in-page JavaScript
  - Use `getPropertyValue()` with kebab-case
  - Support extracting pseudo-classes (`:hover`, `:active`, `:focus`) by triggering states
  - Handle Shadow DOM traversal where possible
  - Compare against reference element
  - Update checkpoint to 'extraction' status

**Commit**: `Implement DOM style extraction with pseudo-classes`

---

### CL-5.7: Implement Dry Run and Local Verification

- [ ] Add a `dryRun` flag to the extractor
- [ ] Implement local HTML file extraction (for testing without live URLs)
- [ ] Add regression test suite using local fixtures
- [ ] Update `package.json` with extraction test scripts

**Commit**: `Add dry run mode and local extraction verification`

**🛑 CHECKPOINT**: Core extraction pipeline works.

---

## Phase 6: Extractor Package — Comparison

### CL-6.1: Implement SSIM Comparison

- [ ] Install `pixelmatch` and `pngjs`
- [ ] Create `packages/extractor/src/comparison/ssim.ts`:
  - Calculate structural similarity
  - Return score 0-1

**Commit**: `Implement SSIM image comparison`

---

### CL-6.2: Implement Color Histogram Comparison

- [ ] Create `packages/extractor/src/comparison/color.ts`:
  - Extract color histogram from images
  - Compare histograms
  - Return score 0-1

**Commit**: `Implement color histogram comparison`

---

### CL-6.3: Implement Combined Comparison

- [ ] Create `packages/extractor/src/comparison/compare.ts`:
  - Combine SSIM (60%) + color (40%)
  - Return pass/fail based on 95% threshold
  - Update checkpoint to 'comparison' status
- [ ] Add tests

**Commit**: `Implement combined component comparison`

---

### CL-6.4: Implement LLM Refinement Suggestions

- [ ] Create `packages/extractor/src/comparison/refine.ts`:
  - Send original + generated to LLM
  - Get specific refinement suggestions
  - Return actionable feedback

**Commit**: `Implement LLM refinement suggestions`

**🛑 CHECKPOINT**: Full extraction + comparison pipeline works.

---

## Phase 7: Next.js Web Application

### CL-7.1: Create Next.js App

- [ ] Create `apps/web/` with Next.js 14 (App Router)
- [ ] Configure TypeScript, ESLint
- [ ] Install Tailwind CSS
- [ ] Create basic layout

**Commit**: `Create Next.js web application`

---

### CL-7.2: Implement URL Input Page

- [ ] Create `apps/web/app/page.tsx`:
  - Large centered text input
  - URL validation
  - "Extract Design System" button
  - Loading state

**Commit**: `Implement URL input page`

---

### CL-7.3: Implement Extraction API Route

- [ ] Create `apps/web/app/api/extract/start/route.ts`:
  - Accept URL
  - Create checkpoint
  - Start extraction (async)
  - Return checkpoint ID
- [ ] Create `apps/web/app/api/extract/status/[id]/route.ts`:
  - Return checkpoint status and progress

**Commit**: `Implement extraction API routes`

---

### CL-7.4: Implement Progress Display

- [ ] Create `apps/web/app/extract/[id]/page.tsx`:
  - Fetch checkpoint status
  - Display progress bar
  - Show current stage
  - Poll for updates

**Commit**: `Implement extraction progress page`

---

### CL-7.5: Implement Component Comparison UI

- [ ] Add component comparison section to extract page:
  - Original screenshot (left)
  - Generated preview (right)
  - Match percentage
  - Accept/Reject buttons

**Commit**: `Implement component comparison UI`

---

### CL-7.6: Implement Feedback API

- [ ] Create `apps/web/app/api/extract/feedback/route.ts`:
  - Accept component ID + accept/reject
  - Update checkpoint
  - Trigger re-extraction if rejected

**Commit**: `Implement feedback API route`

---

### CL-7.7: Implement Design System View

- [ ] Create `apps/web/app/design-system/[id]/page.tsx`:
  - Display extracted colors
  - Display typography scale
  - Display spacing scale
  - Display component variants
  - "Export" button

**Commit**: `Implement design system view page`

---

### CL-7.8: Implement Export API

- [ ] Create `apps/web/app/api/export/route.ts`:
  - Generate TypeScript package
  - Create package.json, index.ts, types
  - Return download URL

**Commit**: `Implement design system export`

**🛑 CHECKPOINT**: Full application works end-to-end.

---

## Phase 8: Polish and Deploy

### CL-8.1: Add Error Handling

- [ ] Add error boundaries
- [ ] Add retry logic with exponential backoff
- [ ] Add user-friendly error messages

**Commit**: `Add comprehensive error handling`

---

### CL-8.2: Add Health Check Endpoint

- [ ] Create `apps/web/app/api/health/route.ts`
- [ ] Return status, timestamp, version

**Commit**: `Add health check endpoint`

---

### CL-8.3: Deploy to Render

- [ ] Push all code to GitHub
- [ ] Connect Render to repository
- [ ] Set `GEMINI_API_KEY` in Render dashboard
- [ ] Trigger deploy
- [ ] Verify health check responds

**Commit**: N/A (deployment)

---

### CL-8.4: Final Documentation

- [ ] Update README with final instructions
- [ ] Add inline code comments where helpful
- [ ] Verify all links work

**Commit**: `Finalize documentation`

**🛑 FINAL CHECKPOINT**: Application deployed and functional.

---

## Checkpointing System Details

The extraction pipeline uses a checkpoint system to:

1. **Resume on failure** — If any step fails, restart from last checkpoint
2. **Show progress** — User sees real-time progress (0-100%)
3. **Persist state** — Stored as JSON files in `.checkpoints/` directory

### Checkpoint Stages

| Stage        | Progress | Description           |
| ------------ | -------- | --------------------- |
| `pending`    | 0%       | Just started          |
| `screenshot` | 20%      | Screenshots captured  |
| `vision`     | 40%      | Components identified |
| `extraction` | 60%      | DOM styles extracted  |
| `comparison` | 80%      | Components compared   |
| `complete`   | 100%     | Ready for export      |
| `failed`     | varies   | Error occurred        |

### Usage

```typescript
const store = new CheckpointStore();

// Create checkpoint
const checkpoint = await store.save({
  id: generateId(),
  url: 'https://example.com',
  status: 'pending',
  progress: 0,
  startedAt: new Date(),
  updatedAt: new Date(),
});

// Update as we progress
await store.update(checkpoint.id, {
  status: 'screenshot',
  progress: 20,
  screenshots: { viewport, fullPage },
});

// Resume on failure
const existing = await store.load(checkpointId);
if (existing?.status === 'screenshot') {
  // Skip screenshot step, continue from vision
}
```

---

## Questions to Ask Before Each Phase

1. **Does this implementation match the core values?**
2. **Are there any edge cases I should handle?**
3. **Is this the simplest implementation that works?**
4. **Should I suggest any improvements to the roadmap?**

---

## Completion Checklist

- [ ] All CLs committed and pushed
- [ ] CI passes on main branch
- [ ] App deploys to Render
- [ ] Can extract design system from a real website
- [ ] Can export TypeScript package
- [ ] Checkpointing works (can resume failed extractions)
