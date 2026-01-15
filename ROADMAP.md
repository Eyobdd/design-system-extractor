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

- [x] Create `packages/tokens/package.json` with dependency on `@extracted/types`
- [x] Create `packages/tokens/tsconfig.json`
- [x] Create `packages/tokens/src/index.ts`

**Commit**: `Scaffold @extracted/tokens package`

---

### CL-3.2: Create Placeholder Token Values

- [x] Create `packages/tokens/src/primitives/colors.ts`:
  ```typescript
  export const surfaceColors = {
    'surface-default': '#ffffff',
    'surface-elevated': '#f8fafc',
    'surface-muted': '#f1f5f9',
  } as const;
  ```
- [x] Create `packages/tokens/src/primitives/typography.ts`
- [x] Create `packages/tokens/src/primitives/spacing.ts`
- [x] Create barrel exports

**Commit**: `Add placeholder token values`

---

### CL-3.3: Create CSS Generation Utility

- [x] Create `packages/tokens/src/css/generate.ts`:
  ```typescript
  export function generateCSSVariables(tokens: Record<string, unknown>): string {
    // Generate :root { --color-surface-default: #fff; ... }
  }
  ```
- [x] Create `packages/tokens/scripts/generate-css.ts` build script
- [x] Add `build:css` script to package.json

**Commit**: `Add CSS variable generation`

---

### CL-3.4: Add Token Tests

- [x] Install Vitest: `npm install -D vitest --workspace=packages/tokens`
- [x] Create `packages/tokens/vitest.config.ts`
- [x] Create `packages/tokens/__tests__/colors.test.ts`:
  - Test: All color values are valid hex
  - Test: Surface colors exist
- [x] Run `npm test --workspace=packages/tokens`

**Commit**: `Add token validation tests`

**🛑 CHECKPOINT**: Tokens package complete with tests.

---

## Phase 4: Primitives Package

### CL-4.1: Create Primitives Package Structure

- [x] Create `packages/primitives/package.json`
- [x] Create `packages/primitives/tsconfig.json`
- [x] Install React: `npm install react react-dom --workspace=packages/primitives`
- [x] Install Vitest + Testing Library

**Commit**: `Scaffold @extracted/primitives package`

---

### CL-4.2: Create Allowed Props Whitelist

- [x] Create `packages/primitives/src/types/allowed-props.ts`:
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
- [x] Create `AllowedDivBehavioralProps`
- [x] Create `AllowedInputBehavioralProps`

**Commit**: `Add allowed behavioral props whitelist`

---

### CL-4.3: Implement Button Primitive

- [x] Create `packages/primitives/src/Button/Button.tsx`:
  - Accept only `AllowedButtonBehavioralProps` + `variant` + `children`
  - Use `forwardRef`
  - NO className, style, id
- [x] Create `packages/primitives/src/Button/index.ts`

**Commit**: `Implement Button primitive component`

---

### CL-4.4: Add Button Tests

- [x] Create `packages/primitives/src/Button/Button.test.tsx`:
  - Test: Renders children
  - Test: Forwards ref
  - Test: onClick fires
  - Test: Disabled prevents click
  - Test: Keyboard accessible (Enter/Space)
  - Test (compile): TypeScript prevents className
  - Test (compile): TypeScript prevents style
  - Test (compile): TypeScript prevents id
- [x] Run tests

**Commit**: `Add Button behavior tests`

---

### CL-4.5: Implement Card Primitive

- [x] Create `packages/primitives/src/Card/Card.tsx`
- [x] Create `packages/primitives/src/Card/Card.test.tsx`
- [x] NO slots — just styled container

**Commit**: `Implement Card primitive component`

---

### CL-4.6: Implement Text and Input Primitives

- [x] Create `packages/primitives/src/Text/Text.tsx`
- [x] Create `packages/primitives/src/Input/Input.tsx`
- [x] Add tests for both
- [x] Create package barrel export

**Commit**: `Implement Text and Input primitives`

**🛑 CHECKPOINT**: All primitives implemented with tests.

---

## Phase 5: Extractor Package — Core

### CL-5.1: Create Extractor Package Structure

- [x] Create `packages/extractor/package.json`
- [x] Install: `puppeteer`, `sharp`, `@langchain/google-genai`
- [x] Create directory structure:
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

- [x] Create `packages/extractor/src/checkpoint/types.ts`:
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
- [x] Create `packages/extractor/src/checkpoint/store.ts`:
  ```typescript
  export class CheckpointStore {
    async save(checkpoint: ExtractionCheckpoint): Promise<void>;
    async load(id: string): Promise<ExtractionCheckpoint | null>;
    async update(id: string, partial: Partial<ExtractionCheckpoint>): Promise<void>;
  }
  ```
- [x] Implement file-based storage (JSON files in `.checkpoints/`)

**Commit**: `Implement extraction checkpointing system`

---

### CL-5.3: Implement Screenshot Capture

- [x] Create `packages/extractor/src/screenshot/capture.ts`:
  - Launch Puppeteer headless
  - Navigate to URL
  - Wait for network idle
  - Capture viewport screenshot
  - Update checkpoint to 'screenshot' status
- [x] Create `packages/extractor/src/screenshot/stitch.ts`:
  - Scroll and capture full page
  - Stitch into single image

**Commit**: `Implement screenshot capture with checkpointing`

---

### CL-5.4: Add Screenshot Tests

- [x] Create `packages/extractor/__tests__/screenshot.test.ts`:
  - Test: Captures screenshot of valid URL
  - Test: Handles invalid URL
  - Test: Updates checkpoint on success
  - Test: Updates checkpoint on failure

**Commit**: `Add screenshot capture tests`

---

### CL-5.5: Implement Vision Component Identification

- [x] Create `packages/extractor/src/vision/prompts.ts`:
  - System prompt for component identification
  - Output JSON schema
- [x] Create `packages/extractor/src/vision/identify.ts`:
  - Initialize Gemini 2.5 Flash via LangChain
  - Send screenshot
  - Parse response to component list with bounding boxes
  - Update checkpoint to 'vision' status

**Commit**: `Implement vision-based component identification`

---

### CL-5.6: Implement DOM Style Extraction (including Pseudo-classes)

- [x] Create `packages/extractor/src/dom/properties.ts`:
  - `RELEVANT_PROPERTIES` object with kebab-case property names
  - Property groups: core, layout, sizing, interaction, etc.
- [x] Create `packages/extractor/src/dom/extract.ts`:
  - Execute in-page JavaScript
  - Use `getPropertyValue()` with kebab-case
  - Support extracting pseudo-classes (`:hover`, `:active`, `:focus`) by triggering states
  - Handle Shadow DOM traversal where possible
  - Compare against reference element
  - Update checkpoint to 'extraction' status

**Commit**: `Implement DOM style extraction with pseudo-classes`

---

### CL-5.7: Implement Dry Run and Local Verification

- [x] Add a `dryRun` flag to the extractor
- [x] Implement local HTML file extraction (for testing without live URLs)
- [x] Add regression test suite using local fixtures
- [x] Update `package.json` with extraction test scripts

**Commit**: `Add dry run mode and local extraction verification`

**🛑 CHECKPOINT**: Core extraction pipeline works.

---

## Phase 6: Database Integration with MongoDB Atlas

This phase implements persistent storage using MongoDB Atlas, replacing the file-based `.checkpoints/` system. Images are stored using MongoDB GridFS for scalability and multi-server support.

### CL-6.1: Setup MongoDB Connection

- [ ] Install `mongodb` package in `@extracted/extractor`
- [ ] Create `packages/extractor/src/database/connection.ts`:
  - Connection pooling with singleton pattern
  - Environment variable configuration (`MONGODB_URI`)
  - Graceful connection handling
- [ ] Create `packages/extractor/src/database/types.ts`:
  - Database document types
  - Collection name constants
- [ ] Add connection health check function
- [ ] Add tests with mocked MongoDB client

**Commit**: `Setup MongoDB Atlas connection`

---

### CL-6.2: Implement Checkpoint Repository

- [ ] Create `packages/extractor/src/database/checkpoint-repository.ts`:
  ```typescript
  interface CheckpointRepository {
    create(checkpoint: ExtractionCheckpoint): Promise<string>;
    findById(id: string): Promise<ExtractionCheckpoint | null>;
    update(id: string, partial: Partial<ExtractionCheckpoint>): Promise<void>;
    delete(id: string): Promise<void>;
    listByStatus(status: ExtractionStatus): Promise<ExtractionCheckpoint[]>;
    listRecent(limit: number): Promise<ExtractionCheckpoint[]>;
  }
  ```
- [ ] Implement MongoDB-backed repository
- [ ] Add indexes for common queries (id, status, createdAt)
- [ ] Add tests with mocked repository

**Commit**: `Implement checkpoint repository with MongoDB`

---

### CL-6.3: Implement Image Storage with GridFS

- [ ] Create `packages/extractor/src/database/image-storage.ts`:
  ```typescript
  interface ImageStorage {
    upload(buffer: Buffer, filename: string, metadata?: object): Promise<string>;
    download(id: string): Promise<Buffer>;
    delete(id: string): Promise<void>;
    getMetadata(id: string): Promise<ImageMetadata | null>;
  }
  ```
- [ ] Use MongoDB GridFS for storing:
  - Viewport screenshots
  - Full-page screenshots
  - Component comparison images
- [ ] Add content-type detection
- [ ] Add tests with mocked GridFS

**Commit**: `Implement image storage with MongoDB GridFS`

---

### CL-6.4: Migrate CheckpointStore to Database

- [ ] Create `packages/extractor/src/database/database-checkpoint-store.ts`:
  - Implement same interface as file-based `CheckpointStore`
  - Use `CheckpointRepository` for metadata
  - Use `ImageStorage` for screenshots
- [ ] Add factory function to select storage backend:
  ```typescript
  function createCheckpointStore(config: StoreConfig): CheckpointStore {
    if (config.mongodb) {
      return new DatabaseCheckpointStore(config.mongodb);
    }
    return new FileCheckpointStore(config.baseDir);
  }
  ```
- [ ] Update `Extractor` class to use factory
- [ ] Add tests for database-backed store

**Commit**: `Migrate checkpoint storage to MongoDB`

---

### CL-6.5: Add Database Configuration and Environment

- [ ] Create `.env.example` update with:
  ```
  MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/design-extractor
  STORAGE_BACKEND=mongodb  # or 'file' for local development
  ```
- [ ] Update `packages/extractor/src/database/index.ts` with exports
- [ ] Add connection validation on startup
- [ ] Add graceful shutdown handling
- [ ] Update README with MongoDB Atlas setup instructions

**Commit**: `Add database configuration and documentation`

**🛑 CHECKPOINT**: Database integration complete. Checkpoints and images persist in MongoDB Atlas.

---

## Phase 7: Extractor Package — Comparison

### CL-7.1: Implement SSIM Comparison

- [x] Install `pixelmatch` and `pngjs`
- [x] Create `packages/extractor/src/comparison/ssim.ts`:
  - Calculate structural similarity
  - Return score 0-1

**Commit**: `Implement SSIM image comparison`

---

### CL-7.2: Implement Color Histogram Comparison

- [x] Create `packages/extractor/src/comparison/color.ts`:
  - Extract color histogram from images
  - Compare histograms
  - Return score 0-1

**Commit**: `Implement color histogram comparison`

---

### CL-7.3: Implement Combined Comparison

- [x] Create `packages/extractor/src/comparison/compare.ts`:
  - Combine SSIM (60%) + color (40%)
  - Return pass/fail based on 95% threshold
  - Update checkpoint to 'comparison' status
- [x] Add tests

**Commit**: `Implement combined component comparison`

---

### CL-7.4: Implement LLM Refinement Suggestions

- [x] Create `packages/extractor/src/comparison/refine.ts`:
  - Send original + generated to LLM
  - Get specific refinement suggestions
  - Return actionable feedback

**Commit**: `Implement LLM refinement suggestions`

**🛑 CHECKPOINT**: Full extraction + comparison pipeline works.

---

## Phase 8: Next.js Web Application

### CL-8.1: Create Next.js App

- [x] Create `apps/web/` with Next.js 14 (App Router)
- [x] Configure TypeScript, ESLint
- [x] Install Tailwind CSS
- [x] Create basic layout

**Commit**: `Create Next.js web application`

---

### CL-8.2: Implement URL Input Page

- [x] Create `apps/web/app/page.tsx`:
  - Large centered text input
  - URL validation
  - "Extract Design System" button
  - Loading state

**Commit**: `Implement URL input page`

---

### CL-8.3: Implement Extraction API Route

- [x] Create `apps/web/app/api/extract/start/route.ts`:
  - Accept URL
  - Create checkpoint
  - Start extraction (async)
  - Return checkpoint ID
- [x] Create `apps/web/app/api/extract/status/[id]/route.ts`:
  - Return checkpoint status and progress

**Commit**: `Implement extraction API routes`

---

### CL-8.4: Implement Progress Display

- [x] Create `apps/web/app/extract/[id]/page.tsx`:
  - Fetch checkpoint status
  - Display progress bar
  - Show current stage
  - Poll for updates

**Commit**: `Implement extraction progress page`

---

### CL-8.5: Implement Component Comparison UI

- [x] Add component comparison section to extract page:
  - Original screenshot (left)
  - Generated preview (right)
  - Match percentage
  - Accept/Reject buttons

**Commit**: `Implement component comparison UI`

---

### CL-8.6: Implement Feedback API

- [x] Create `apps/web/app/api/feedback/route.ts`:
  - Accept component ID + accept/reject
  - Update checkpoint
  - Store feedback in memory

**Commit**: `Implement feedback API route`

---

### CL-8.7: Implement Design System View

- [x] Create `apps/web/app/design-system/[id]/page.tsx`:
  - Display extracted colors
  - Display typography scale
  - Display spacing scale
  - Display component variants
  - "Export" button

**Commit**: `Implement design system view page`

---

### CL-8.8: Implement Export API

- [x] Create `apps/web/app/api/export/route.ts`:
  - Export tokens as JSON, CSS, SCSS, or Tailwind config
  - Download as file

**Commit**: `Implement design system export`

**🛑 CHECKPOINT**: Full application works end-to-end.

---

## Phase 10: Connect Web App to Real Extractor Pipeline

> **Goal**: Replace stub extraction logic with actual Puppeteer-based extraction. The web app currently uses hardcoded values — this phase wires it to the real `Extractor` class.

### CL-10.1: Configure Puppeteer for Server-Side Execution

- [x] Add `@sparticuz/chromium` for serverless Chromium support
- [x] Create `apps/web/src/lib/browser.ts`:
  - Configure Puppeteer to use bundled Chromium in production
  - Use local Chrome in development
- [x] Update `apps/web/next.config.js` for Puppeteer compatibility
- [x] Add environment detection (local vs Render)

**Commit**: `Configure Puppeteer for server-side execution`

---

### CL-10.2: Wire Extraction API to Real Extractor

- [x] Update `apps/web/src/app/api/extract/extraction.ts`:
  - Import and use `Extractor` from `@extracted/extractor`
  - Remove `simulateDelay` stubs
  - Pass real URL to extractor
- [x] Handle extraction events for progress updates
- [x] Store real screenshots and extracted tokens in checkpoint

**Commit**: `Wire extraction API to real extractor pipeline`

---

### CL-10.3: Add URL Normalization

- [x] Create `apps/web/src/lib/url-utils.ts`:
  ```typescript
  export function normalizeUrl(input: string): string {
    // "example.com" → "https://example.com"
    // "www.example.com" → "https://www.example.com"
    // "http://example.com" → "http://example.com" (preserve)
  }
  ```
- [x] Update URL input component to auto-normalize
- [x] Update validation to accept simplified URLs
- [x] Add tests for URL normalization

**Commit**: `Add URL normalization for simplified input`

---

### CL-10.4: Add Extraction Error Recovery

- [x] Implement retry logic for transient failures
- [x] Add timeout handling for slow pages
- [x] Surface meaningful error messages to UI
- [x] Add extraction logs for debugging

**Commit**: `Add extraction error recovery and logging`

**🛑 CHECKPOINT**: Web app performs real extractions with Puppeteer.

---

## Phase 11: Visual Comparison UI with Primitives + Variants

> **Goal**: Replace token-only view with side-by-side comparison showing original component (via iframe) next to our rendered primitive variant.

### CL-11.1: Define Shared Types for Review System

- [x] Create `packages/types/src/primitives/component-type.ts`:
  ```typescript
  // Source of truth for primitive component types
  export type PrimitiveComponentType = 'button' | 'card' | 'input' | 'text';
  export const PRIMITIVE_COMPONENT_TYPES: readonly PrimitiveComponentType[] = [
    'button',
    'card',
    'input',
    'text',
  ] as const;
  ```
- [x] Create `packages/types/src/geometry/bounding-box.ts`:
  ```typescript
  export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  ```
- [x] Create `packages/types/src/review/variant-review.ts`:

  ```typescript
  import type { PrimitiveComponentType } from '../primitives/component-type';
  import type { BoundingBox } from '../geometry/bounding-box';
  import type {
    ButtonVariantSpec,
    CardVariantSpec,
    InputVariantSpec,
    TextVariantSpec,
  } from '../components';

  // 'dne' = "does not exist" (detected component that isn't actually a variant)
  export type VariantReviewStatus = 'pending' | 'accepted' | 'failed' | 'dne';

  export interface VariantReview {
    componentType: PrimitiveComponentType;
    variantId: string;
    variantName: string;
    status: VariantReviewStatus;
    extractedSpec: ButtonVariantSpec | CardVariantSpec | InputVariantSpec | TextVariantSpec;
    originalSelector: string;
    originalBoundingBox: BoundingBox;
    matchScore?: number;
    reviewedAt?: Date;
    // User feedback passed to LLM on retry extraction
    reviewComment?: string;
  }
  ```

- [x] Update `ComponentIdentification` to use `BoundingBox` type
- [x] Add to checkpoint type: `variantReviews?: VariantReview[]`
- [x] Export all new types from `@extracted/types`

**Commit**: `Define shared types for review system`

---

### CL-11.2: Create Iframe Component Preview

- [x] Create `apps/web/src/components/original-preview.tsx`:
  - Render iframe pointing to source URL
  - Scroll/position to show specific component
  - Add overlay mask to highlight component area
- [x] Handle cross-origin restrictions gracefully
- [x] Fallback to screenshot crop if iframe blocked

**Commit**: `Create iframe-based original component preview`

---

### CL-11.3: Create Primitive Variant Renderer

- [x] Create `apps/web/src/components/variant-renderer.tsx`:
  - Import primitives from `@extracted/primitives`
  - Dynamically apply extracted variant spec as inline styles
  - Render actual `<Button>`, `<Card>`, `<Input>`, `<Text>` components
- [x] Create style injection utility for variant specs
- [x] Add visual match percentage overlay

**Commit**: `Create primitive variant renderer`

---

### CL-11.4: Build Variant Comparison Accordion

- [x] Create `apps/web/src/components/variant-comparison.tsx`:
  - Group variants by component type (Button, Card, Input, Text)
  - Each accordion item shows all variants of that type
  - Side-by-side: Original (iframe) | Extracted (primitive)
  - Status badge: pending/accepted/failed/dne
- [x] Create `VariantComparison` component:
  - Individual variant comparison
  - Accept / Reject / Mark as DNE buttons
  - Optional comment field

**Commit**: `Build variant comparison accordion UI`

---

### CL-11.5: Update Extract Page with Variant Comparison

- [x] Replace token-only display with variant accordion
- [x] Show extraction progress → variant review flow
- [x] Add view mode toggle (Visual Comparison / Raw Tokens)
- [ ] Add "Proceed to Export" button (only when all reviewed)

**Commit**: `Update extract page with variant comparison UI`

**🛑 CHECKPOINT**: Users can visually compare original vs extracted variants.

---

## Phase 12: Variant Retry System

> **Goal**: Allow users to retry extraction for failed variants while keeping approved ones.

### CL-12.1: Implement Variant Feedback API

- [ ] Update `apps/web/src/app/api/feedback/route.ts`:
  - Accept `status: 'accepted' | 'failed' | 'hallucinated'`
  - Accept optional `comment` field
  - Update checkpoint's `variantReviews` array
- [ ] Add GET endpoint to retrieve variant statuses

**Commit**: `Implement variant feedback API with status types`

---

### CL-12.2: Implement Batch Retry Extraction

- [ ] Create `apps/web/src/app/api/extract/retry/route.ts`:
  - Accept checkpoint ID + list of failed variant IDs
  - Re-run extraction ONLY for failed variants
  - Preserve approved variants
  - Update checkpoint with new results
- [ ] Add retry logic to `Extractor` class:
  ```typescript
  async retryVariants(
    checkpointId: string,
    variantIds: string[],
    feedback?: Map<string, string>  // variantId → reviewComment for LLM context
  ): Promise<void>
  ```
- [ ] Update LLM prompt to include user feedback on what failed

**Commit**: `Implement batch retry extraction for failed variants`

---

### CL-12.3: Add Retry UI Flow

- [ ] Add "Retry Failed Variants" button to extract page
- [ ] Show retry progress indicator
- [ ] Update variant statuses after retry completes
- [ ] Allow multiple retry cycles

**Commit**: `Add retry UI flow for failed variants`

**🛑 CHECKPOINT**: Users can iteratively refine extraction results.

---

## Phase 13: Export Package Generator

> **Goal**: Generate a complete TypeScript package with typed primitives and variants based on extraction results.

### CL-13.1: Define Export Package Structure

- [ ] Create `packages/extractor/src/export/types.ts`:

  ```typescript
  export interface ExportPackageConfig {
    name: string;
    extractedTokens: ExtractedTokens;
    approvedVariants: VariantReview[];
    includeDefaults: boolean;
  }

  export interface GeneratedPackage {
    files: Map<string, string>;
    packageJson: object;
  }
  ```

**Commit**: `Define export package structure types`

---

### CL-13.2: Implement Token Type Generator

- [ ] Create `packages/extractor/src/export/generate-tokens.ts`:
  - Generate `tokens/colors.ts` with extracted color keys
  - Generate `tokens/spacing.ts` with type-narrowed spacing keys
  - Generate `tokens/typography.ts` with font specs
  - Generate `tokens/easing.ts` for transitions
  - Fallback to sensible defaults for unextracted token types
  - Use `as const satisfies` pattern for type safety:

  ```typescript
  // Generated example:
  export type SpacingKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  } as const satisfies Record<SpacingKey, string>;

  export type EasingKey = 'default' | 'in' | 'out' | 'inOut';
  export const easing = {
    default: 'ease',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  } as const satisfies Record<EasingKey, string>;
  ```

**Commit**: `Implement token type generator with satisfies pattern`

---

### CL-13.3: Implement Variant Generator

- [ ] Create `packages/extractor/src/export/generate-variants.ts`:
  - Generate `variants/button.ts` with approved button variants
  - Generate `variants/card.ts`, `variants/input.ts`, `variants/text.ts`
  - Use `as const satisfies` for type safety
  - Include interactive states (hover, active, focus) when extracted

  ```typescript
  // Generated example:
  import type { ButtonVariantSpec } from './types';
  import type { ColorKey, SpacingKey, EasingKey } from '../tokens';

  export const buttonVariants = {
    primary: {
      surface: 'primary',
      text: 'white',
      paddingX: 'md',
      paddingY: 'sm',
      // Interactive states
      states: {
        hover: { surface: 'primary-dark' },
        active: { surface: 'primary-darker' },
        focus: { outline: '2px solid primary' },
      },
      transition: {
        property: 'background-color',
        duration: '150ms',
        easing: 'default',
      },
    },
    secondary: {
      /* ... */
    },
  } as const satisfies Record<string, ButtonVariantSpec>;

  // Type for variant keys (for props)
  export type ButtonVariantKey = keyof typeof buttonVariants;
  ```

- [ ] Add clear comments showing how to add new variants:
  ```typescript
  // To add a new variant, add an entry to buttonVariants:
  // myCustom: { surface: 'custom-color', text: 'white', ... }
  ```

**Commit**: `Implement variant generator with interactive states`

---

### CL-13.4: Implement Primitive Wrapper Generator

- [ ] Create `packages/extractor/src/export/generate-primitives.ts`:
  - Generate typed wrapper components
  - Import from base `@extracted/primitives`
  - Accept variant key as string prop, lookup from variants object

  ```typescript
  // Generated example:
  import { Button as BaseButton } from '@extracted/primitives';
  import { buttonVariants, type ButtonVariantKey } from './variants/button';

  export interface ButtonProps extends Omit<BaseButtonProps, 'variant'> {
    variant: ButtonVariantKey;  // 'primary' | 'secondary' | ...
  }

  export const Button = ({ variant, ...props }: ButtonProps) => {
    const variantSpec = buttonVariants[variant];
    return <BaseButton variant={variantSpec} {...props} />;
  };

  // To add a new variant:
  // 1. Add entry to variants/button.ts in buttonVariants object
  // 2. The ButtonVariantKey type updates automatically
  // 3. Use: <Button variant="myNewVariant" />
  ```

- [ ] Generate CSS file for keyframe animations (if any extracted):
  ```css
  /* Generated: primitives/button.css */
  @keyframes button-primary-pulse { ... }
  .button-hover-primary { ... }
  ```

**Commit**: `Implement primitive wrapper generator with variant lookup`

---

### CL-13.5: Implement Package Bundler

- [ ] Create `packages/extractor/src/export/bundle.ts`:
  - Combine all generated files
  - Generate `package.json` with dependencies
  - Generate `index.ts` barrel export
  - Generate `tsconfig.json`
  - Generate `README.md` with usage instructions
- [ ] Create ZIP file for download

**Commit**: `Implement package bundler`

---

### CL-13.6: Update Export API

- [ ] Update `apps/web/src/app/api/export/route.ts`:
  - Add `format: 'package'` option
  - Generate full TypeScript package
  - Return as downloadable ZIP
- [ ] Add export preview showing generated file structure

**Commit**: `Update export API with package generation`

**🛑 CHECKPOINT**: Users can export a complete typed component package.

---

## Phase 14: UX Polish and Production Readiness

> **Goal**: Final polish for production deployment.

### CL-14.1: Improve URL Input UX

- [ ] Auto-focus input on page load
- [ ] Show normalized URL preview as user types
- [ ] Add example URLs / recent extractions
- [ ] Add keyboard shortcut (Enter to submit)

**Commit**: `Improve URL input UX`

---

### CL-14.2: Add Loading States and Animations

- [ ] Add skeleton loaders for comparison cards
- [ ] Add progress animations during extraction
- [ ] Add success/error toast notifications
- [ ] Add smooth transitions between states

**Commit**: `Add loading states and animations`

---

### CL-14.3: Add Extraction History

- [ ] Create `apps/web/src/app/history/page.tsx`:
  - List recent extractions
  - Show status, URL, date
  - Allow resuming incomplete extractions
- [ ] Store extraction history in localStorage (or DB)

**Commit**: `Add extraction history page`

---

### CL-14.4: Production Deployment Configuration

- [ ] Update `render.yaml` with Puppeteer dependencies
- [ ] Configure Chrome/Chromium for Render
- [ ] Set up environment variables
- [ ] Add health checks for browser availability
- [ ] Test full extraction flow on Render

**Commit**: `Configure production deployment with Puppeteer`

**🛑 CHECKPOINT**: UX polished and production deployment configured.

---

## Phase 15: Final Polish and Deploy

> **Goal**: Final deployment and documentation. Moved from Phase 9 to ensure core functionality is complete first.

### CL-15.1: Add Error Handling

- [ ] Add error boundaries to React components
- [ ] Add retry logic with exponential backoff for API calls
- [ ] Add user-friendly error messages with actionable suggestions

**Commit**: `Add comprehensive error handling`

---

### CL-15.2: Add Health Check Endpoint

- [ ] Create `apps/web/app/api/health/route.ts`
- [ ] Return status, timestamp, version, browser availability

**Commit**: `Add health check endpoint`

---

### CL-15.3: Deploy to Render

- [ ] Push all code to GitHub
- [ ] Connect Render to repository
- [ ] Set environment variables (`GEMINI_API_KEY`, `MONGODB_URI`)
- [ ] Configure Puppeteer/Chromium for Render
- [ ] Trigger deploy
- [ ] Verify health check responds
- [ ] Test full extraction flow end-to-end

**Commit**: N/A (deployment)

---

### CL-15.4: Final Documentation

- [ ] Update README with:
  - Setup instructions
  - Environment variables
  - How to run locally
  - How to deploy
  - How to extend with new primitives
- [ ] Add inline code comments where helpful
- [ ] Verify all links work
- [ ] Add architecture diagram

**Commit**: `Finalize documentation`

**🛑 FINAL CHECKPOINT**: Production-ready application deployed and functional.

---

## Checkpointing System Details

The extraction pipeline uses a checkpoint system to:

1. **Resume on failure** — If any step fails, restart from last checkpoint
2. **Show progress** — User sees real-time progress (0-100%)
3. **Persist state** — Stored in MongoDB Atlas (production) or JSON files in `.checkpoints/` (local development)

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
- [ ] Visual comparison UI works (iframe + primitives side-by-side)
- [ ] Variant review flow works (accept/fail/dne)
- [ ] Retry extraction works for failed variants
- [ ] Can export typed TypeScript component package
- [ ] Checkpointing works (can resume failed extractions)
- [ ] URL input accepts simplified URLs (no https:// required)
