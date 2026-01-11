# Architecture Rules

> **Purpose**: This document defines the architectural principles, patterns, and constraints for the Design System Extractor project. Windsurf agents should reference this when making implementation decisions.

---

## Core Values

These principles are **non-negotiable**. When in doubt, refer back to these. If an implementation violates these values, push back and ask for clarification.

### 1. Type Safety as Enforcement

Types are not just for developer experience — they are the **enforcement mechanism** that prevents misuse.

```typescript
// ✅ CORRECT: Use Pick<> to whitelist allowed props
type AllowedButtonProps = Pick<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'onFocus' | 'onBlur' | 'disabled' | 'type' | 'aria-label'
  // ... explicit whitelist
>;

// ❌ WRONG: Using Omit<> creates a blacklist that can be bypassed
type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'style' // What about id? data-*?
>;
```

If `className` isn't in the type definition, an AI **cannot** pass it. This is the goal.

---

### 2. Primitives Are Style-Locked

Base components accept **ONLY** behavioral props:

- Event handlers: `onClick`, `onFocus`, `onBlur`, `onKeyDown`, etc.
- Form attributes: `disabled`, `type`, `name`, `value`, `form`
- Accessibility: `aria-*` attributes, `tabIndex`
- Refs: `ref` via `forwardRef`

**NEVER** expose:

- `id` — Can be targeted by CSS (`#myId { ... }`)
- `className` — Direct style override
- `style` — Inline style override
- `data-*` (user-provided) — Can be targeted by CSS (`[data-foo] { ... }`)

The `variant` prop is the **ONLY** way to affect appearance.

```typescript
// packages/primitives/src/types/allowed-props.ts

/**
 * Strict whitelist of behavioral props for button elements.
 * This list is intentionally explicit — if it's not here, it's not allowed.
 */
export type AllowedButtonBehavioralProps = Pick<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  // Event handlers
  | 'onClick'
  | 'onDoubleClick'
  | 'onMouseDown'
  | 'onMouseUp'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onFocus'
  | 'onBlur'
  | 'onKeyDown'
  | 'onKeyUp'
  | 'onKeyPress'
  // Form integration
  | 'disabled'
  | 'type'
  | 'form'
  | 'name'
  | 'value'
  | 'autoFocus'
  // Accessibility
  | 'aria-label'
  | 'aria-describedby'
  | 'aria-pressed'
  | 'aria-expanded'
  | 'aria-haspopup'
  | 'aria-controls'
  | 'aria-disabled'
  | 'aria-busy'
  | 'aria-live'
  | 'aria-atomic'
  | 'aria-hidden'
  // Keyboard navigation
  | 'tabIndex'
>;

/**
 * Strict whitelist of behavioral props for div-based components (Card, etc.)
 */
export type AllowedDivBehavioralProps = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  // Event handlers
  | 'onClick'
  | 'onDoubleClick'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onFocus'
  | 'onBlur'
  | 'onKeyDown'
  | 'onKeyUp'
  // Accessibility
  | 'aria-label'
  | 'aria-describedby'
  | 'aria-labelledby'
  | 'aria-hidden'
  | 'role'
  | 'tabIndex'
>;
```

---

### 3. Types Define Contract, Tokens Implement

The `@extracted/types` package defines **what values are allowed** (the vocabulary).
The `@extracted/tokens` package defines **the actual values** (the implementation).

```
@extracted/types    →  "You can use 'surface-default', 'surface-elevated', ..."
@extracted/tokens   →  "surface-default = '#ffffff', surface-elevated = '#f8fafc'"
```

**Adding a new token requires updating the type first.** TypeScript enforces this.

```typescript
// packages/types/src/primitives/colors.ts
export type SurfaceColorKey = 'surface-default' | 'surface-elevated' | 'surface-muted';

// packages/tokens/src/primitives/colors.ts
import type { SurfaceColorKey } from '@extracted/types';

export const surfaceColors = {
  'surface-default': '#ffffff',
  'surface-elevated': '#f8fafc',
  'surface-muted': '#f1f5f9',
} as const satisfies Record<SurfaceColorKey, string>;

// If you add a new key to SurfaceColorKey, TypeScript errors until you add it to surfaceColors
```

---

### 4. Extract Reality, Don't Normalize

We extract **what exists** on the source site, not what we think **should** exist.

```typescript
// ❌ WRONG: Assuming a standard scale
export type FontSizeKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ✅ CORRECT: Labels derived from actual usage
// (if the site uses 14px for body and 32px for headings, that's what we extract)
export type FontSizeKey = 'body-small' | 'body' | 'heading-sm' | 'heading-lg';
```

Labels are determined by **where** the value is used, not arbitrary semantic names.

---

### 5. Variants Reference Tokens, Never Raw Values

A variant spec contains **token keys**, not CSS values. This indirection enables theme-wide changes.

```typescript
// ❌ WRONG: Raw values in variant
const buttonVariants = {
  primary: {
    backgroundColor: '#2563eb', // Raw value
    color: '#ffffff',
  },
};

// ✅ CORRECT: Token references in variant
const buttonVariants = {
  primary: {
    surface: 'surface-primary', // Key into surfaceColors
    text: 'text-on-primary', // Key into textColors
    border: null,
    radius: 'md', // Key into radii
    paddingX: 4, // Key into spacing
    paddingY: 2,
  },
} as const satisfies Record<ButtonVariant, ButtonVariantSpec>;
```

---

### 6. Structural Freedom, Stylistic Constraint

Primitives have **ZERO** opinion on children or layout. They are styled containers.

```typescript
// ❌ WRONG: Card with opinionated slots
<Card variant="elevated">
  <Card.Header>Title</Card.Header>      // Forces structure
  <Card.Body>Content</Card.Body>
  <Card.Actions>...</Card.Actions>
</Card>

// ✅ CORRECT: Card is just a styled container
<Card variant="elevated">
  {/* User controls what goes inside and in what order */}
  <Button variant="primary">Action First</Button>
  <Text variant="heading">Title Second</Text>
  <Text variant="body">Content Third</Text>
</Card>
```

The design system controls **appearance**. Users control **structure**.

---

### 7. Composition Over Inheritance

Complex styles are built from **flat composition** of primitive tokens. No cascading, no inheritance.

```typescript
// Each variant is complete and self-contained
const textVariants = {
  heading: {
    family: 'sans',
    size: 'heading-lg',
    weight: 'bold',
    lineHeight: 'tight',
    letterSpacing: 'tight',
    color: 'text-primary',
  },
  body: {
    family: 'sans',
    size: 'body',
    weight: 'normal',
    lineHeight: 'normal',
    letterSpacing: 'normal',
    color: 'text-primary',
  },
} as const;
```

---

### 8. Test Behavior, Not Implementation

Tests verify **what** components do, not **how** they do it internally.

**The Refactor Test**: If you completely rewrote the component internals but kept the same external behavior, would your tests still pass? If no, you're testing implementation.

```typescript
// ❌ TESTING IMPLEMENTATION (Don't do this)

// Testing internal state
test('sets isHovered state on mouse enter', () => {
  const { result } = renderHook(() => useButtonState());
  act(() => result.current.onMouseEnter());
  expect(result.current.isHovered).toBe(true);
});

// Testing specific CSS values
test('has background color #2563eb', () => {
  render(<Button variant="primary">Click</Button>);
  expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: '#2563eb' });
});

// Testing internal function calls
test('calls useVariantStyles hook', () => {
  const spy = vi.spyOn(hooks, 'useVariantStyles');
  render(<Button variant="primary">Click</Button>);
  expect(spy).toHaveBeenCalled();
});


// ✅ TESTING BEHAVIOR (Do this)

// Testing user-visible outcome
test('shows visual feedback on hover', async () => {
  render(<Button variant="primary">Click</Button>);
  const button = screen.getByRole('button');
  const initialBg = window.getComputedStyle(button).backgroundColor;

  await userEvent.hover(button);
  const hoveredBg = window.getComputedStyle(button).backgroundColor;

  expect(hoveredBg).not.toBe(initialBg);  // Something changed, don't care what
});

// Testing accessibility behavior
test('can be activated with keyboard', async () => {
  const handleClick = vi.fn();
  render(<Button variant="primary" onClick={handleClick}>Click</Button>);

  screen.getByRole('button').focus();
  await userEvent.keyboard('{Enter}');

  expect(handleClick).toHaveBeenCalledOnce();
});

// Testing behavioral contract
test('disabled button is not interactive', async () => {
  const handleClick = vi.fn();
  render(<Button variant="primary" onClick={handleClick} disabled>Click</Button>);

  await userEvent.click(screen.getByRole('button'));

  expect(handleClick).not.toHaveBeenCalled();
  expect(screen.getByRole('button')).toBeDisabled();
});

// Testing type enforcement (compile-time)
test('TypeScript prevents styling props', () => {
  // @ts-expect-error - className is not in AllowedButtonBehavioralProps
  <Button variant="primary" className="override">Click</Button>;
});
```

---

### 9. 95%+ Match Before User Review

Automated comparison must achieve **95%+ similarity** before showing the user.

```typescript
const MATCH_THRESHOLDS = {
  FAIL_FAST: 0.7, // Below this, don't waste LLM tokens
  NEEDS_ITERATION: 0.95, // Below this, keep iterating
  PASS: 0.95, // At or above this, show to user
} as const;
```

The system iterates automatically until 95%+ is achieved. Human review is the **final** step, not a crutch for poor automated matching.

---

### 10. Human Verification Required

Even at 95%+ match, the user makes the final accept/reject decision. The system can be wrong — edge cases exist. User feedback should be tracked and used to improve the system.

---

## Package Architecture

### Dependency Graph

```
@extracted/types        (no dependencies)
        ↓
@extracted/tokens       (depends on types)
        ↓
@extracted/primitives   (depends on types, tokens)
        ↓
@extracted/extractor    (depends on types, tokens)
        ↓
apps/web                (depends on all packages)
```

### Package Responsibilities

| Package                 | Responsibility                                 | Runtime Code? |
| ----------------------- | ---------------------------------------------- | ------------- |
| `@extracted/types`      | Type definitions only                          | No            |
| `@extracted/tokens`     | Token values + CSS generation                  | Yes           |
| `@extracted/primitives` | Locked-down base components                    | Yes           |
| `@extracted/extractor`  | Screenshot, vision, DOM extraction, comparison | Yes           |
| `apps/web`              | Next.js UI for extraction workflow             | Yes           |

---

## File Naming Conventions

```
packages/
├── types/
│   └── src/
│       ├── primitives/
│       │   ├── colors.ts           # Primitive type definitions
│       │   └── index.ts
│       └── components/
│           ├── button.ts           # Component-specific types
│           └── index.ts
├── tokens/
│   └── src/
│       ├── primitives/
│       │   ├── colors.ts           # Token values
│       │   └── index.ts
│       └── components/
│           ├── button.variants.ts  # .variants.ts suffix for variant files
│           └── index.ts
├── primitives/
│   └── src/
│       ├── Button/
│       │   ├── Button.tsx          # Component implementation
│       │   ├── Button.test.tsx     # Component tests
│       │   ├── types.ts            # Component-specific types
│       │   └── index.ts            # Barrel export
│       └── index.ts                # Package barrel export
└── extractor/
    └── src/
        ├── screenshot/
        │   ├── capture.ts
        │   └── index.ts
        └── index.ts
```

---

## TypeScript Configuration

All packages extend the shared base configuration:

```json
// packages/tsconfig/base.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

## Error Handling

### API Errors

```typescript
// Use typed error responses
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Return errors, don't throw in API routes
export async function POST(request: Request) {
  try {
    // ... logic
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'EXTRACTION_FAILED', message: error.message } },
      { status: 500 }
    );
  }
}
```

### Graceful Degradation

```typescript
// Always have fallbacks for external services
async function identifyComponents(screenshot: Buffer): Promise<Component[]> {
  try {
    return await visionLLM.identify(screenshot);
  } catch (error) {
    if (error.code === 'RATE_LIMITED') {
      await delay(exponentialBackoff(attempt));
      return identifyComponents(screenshot); // Retry
    }
    // If LLM fails completely, return empty array and let user manually identify
    console.error('Vision identification failed:', error);
    return [];
  }
}
```

---

## Questions to Ask Before Implementing

1. **Does this add a styling escape hatch?** If yes, reconsider.
2. **Does this test implementation or behavior?** If implementation, rewrite.
3. **Does this variant contain raw values or token keys?** If raw values, refactor.
4. **Does this component have opinion on children?** If yes, remove.
5. **Is this type a whitelist or blacklist?** If blacklist, use whitelist.
