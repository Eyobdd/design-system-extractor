# Testing Rules

> **Purpose**: This document defines testing philosophy, patterns, and requirements for the Design System Extractor project.

---

## Core Principle: Test Behavior, Not Implementation

**The Refactor Test**: If you completely rewrote the component internals but kept the same external behavior, would your tests still pass?

- **Yes** → You're testing behavior ✅
- **No** → You're testing implementation ❌

---

## What Counts as Implementation Details?

### ❌ These Are Implementation Details (Don't Test)

| Category | Examples |
|----------|----------|
| **Internal state** | `useState` values, reducer state shape, `isLoading` flags |
| **Internal functions** | Private helper functions, internal hooks |
| **CSS specifics** | Exact color values, specific class names, inline styles |
| **DOM structure** | Number of wrapper divs, specific element nesting |
| **Library internals** | How a library implements a feature |
| **Function call counts** | "Called 3 times" (unless it's the behavioral contract) |

### ✅ These Are Behavior (Do Test)

| Category | Examples |
|----------|----------|
| **User interactions** | Click triggers action, keyboard navigates |
| **Rendered output** | Text appears, element is visible/hidden |
| **Accessibility** | Has correct role, label, ARIA state |
| **Form behavior** | Submits data, validates input, shows errors |
| **Visual feedback** | Something changes on hover (not what changes) |
| **Prop contracts** | Required props work, variants render differently |
| **Error states** | Error message appears when appropriate |

---

## Testing Patterns

### Pattern 1: Test User-Visible Outcomes

```typescript
// ❌ BAD: Testing internal state
test('sets loading state', () => {
  const { result } = renderHook(() => useSubmit());
  act(() => result.current.submit());
  expect(result.current.isLoading).toBe(true);  // Internal state
});

// ✅ GOOD: Testing what the user sees
test('shows loading indicator during submission', async () => {
  render(<SubmitButton />);
  await userEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### Pattern 2: Test Accessibility Requirements

```typescript
// ✅ GOOD: Testing accessibility contract
test('button is keyboard accessible', async () => {
  const onClick = vi.fn();
  render(<Button variant="primary" onClick={onClick}>Click</Button>);
  
  const button = screen.getByRole('button');
  button.focus();
  
  await userEvent.keyboard('{Enter}');
  expect(onClick).toHaveBeenCalledOnce();
  
  await userEvent.keyboard(' ');  // Space
  expect(onClick).toHaveBeenCalledTimes(2);
});

test('disabled button has correct aria state', () => {
  render(<Button variant="primary" disabled>Click</Button>);
  expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  // OR
  expect(screen.getByRole('button')).toBeDisabled();
});
```

### Pattern 3: Test Variant Differentiation (Not Specific Styles)

```typescript
// ❌ BAD: Testing specific style values
test('primary button has blue background', () => {
  render(<Button variant="primary">Click</Button>);
  expect(screen.getByRole('button')).toHaveStyle({ 
    backgroundColor: '#2563eb' 
  });
});

// ✅ GOOD: Testing that variants are different
test('each variant renders a visually distinct button', () => {
  const { rerender } = render(<Button variant="primary">Click</Button>);
  const primaryStyle = window.getComputedStyle(screen.getByRole('button'));
  
  rerender(<Button variant="secondary">Click</Button>);
  const secondaryStyle = window.getComputedStyle(screen.getByRole('button'));
  
  // Test that they're different, not what they are
  expect(primaryStyle.backgroundColor).not.toBe(secondaryStyle.backgroundColor);
});
```

### Pattern 4: Test Type Enforcement (Compile-Time)

```typescript
// ✅ GOOD: Testing that TypeScript prevents invalid usage
test('TypeScript prevents styling props', () => {
  // These should cause TypeScript errors — if the file compiles, the test fails
  
  // @ts-expect-error - className is not allowed
  <Button variant="primary" className="override">Click</Button>;
  
  // @ts-expect-error - style is not allowed
  <Button variant="primary" style={{ color: 'red' }}>Click</Button>;
  
  // @ts-expect-error - id is not allowed
  <Button variant="primary" id="my-button">Click</Button>;
});
```

### Pattern 5: Test Form Integration

```typescript
// ✅ GOOD: Testing form behavior end-to-end
test('submit button submits the form', async () => {
  const onSubmit = vi.fn((e) => e.preventDefault());
  
  render(
    <form onSubmit={onSubmit}>
      <Input name="email" variant="default" />
      <Button variant="primary" type="submit">Submit</Button>
    </form>
  );
  
  await userEvent.type(screen.getByRole('textbox'), 'test@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(onSubmit).toHaveBeenCalledOnce();
});
```

### Pattern 6: Test Error States

```typescript
// ✅ GOOD: Testing error feedback
test('shows error message for invalid input', async () => {
  render(<EmailInput variant="default" />);
  
  const input = screen.getByRole('textbox');
  await userEvent.type(input, 'invalid-email');
  await userEvent.tab();  // Trigger blur validation
  
  expect(screen.getByRole('alert')).toHaveTextContent(/invalid email/i);
});
```

---

## Test File Organization

```
packages/primitives/src/Button/
├── Button.tsx
├── Button.test.tsx      # Component tests
├── types.ts
└── index.ts
```

### Test File Structure

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  // Group by behavior category
  
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Button variant="primary">Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });
    
    it('forwards ref to button element', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button variant="primary" ref={ref}>Click</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
  
  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const onClick = vi.fn();
      render(<Button variant="primary" onClick={onClick}>Click</Button>);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });
    
    it('does not call onClick when disabled', async () => {
      const onClick = vi.fn();
      render(<Button variant="primary" onClick={onClick} disabled>Click</Button>);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });
  
  describe('accessibility', () => {
    it('is keyboard accessible', async () => {
      const onClick = vi.fn();
      render(<Button variant="primary" onClick={onClick}>Click</Button>);
      screen.getByRole('button').focus();
      await userEvent.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledOnce();
    });
    
    it('has correct aria-disabled when disabled', () => {
      render(<Button variant="primary" disabled>Click</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
  
  describe('variants', () => {
    it('renders different variants with distinct styles', () => {
      const { rerender } = render(<Button variant="primary">Click</Button>);
      const primaryBg = window.getComputedStyle(screen.getByRole('button')).backgroundColor;
      
      rerender(<Button variant="secondary">Click</Button>);
      const secondaryBg = window.getComputedStyle(screen.getByRole('button')).backgroundColor;
      
      expect(primaryBg).not.toBe(secondaryBg);
    });
  });
  
  describe('type safety', () => {
    it('prevents styling props at compile time', () => {
      // @ts-expect-error - className not allowed
      <Button variant="primary" className="x">Click</Button>;
      
      // @ts-expect-error - style not allowed
      <Button variant="primary" style={{}}>Click</Button>;
      
      // @ts-expect-error - id not allowed
      <Button variant="primary" id="x">Click</Button>;
    });
  });
});
```

---

## Testing Tools

### Required Dependencies

```json
{
  "devDependencies": {
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0"
  }
}
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules',
        'dist',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/index.ts',
      ],
    },
  },
});
```

### Test Setup

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

---

## Token Tests

Tokens have different testing needs — we test **design relationships**, not implementation.

```typescript
// packages/tokens/__tests__/colors.test.ts
import { describe, it, expect } from 'vitest';
import { surfaceColors, textColors } from '../src/primitives/colors';

describe('color tokens', () => {
  describe('surface colors', () => {
    it('all values are valid hex colors', () => {
      const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
      Object.values(surfaceColors).forEach(color => {
        expect(color).toMatch(hexPattern);
      });
    });
    
    it('elevated surface is lighter than default (for light theme)', () => {
      const defaultLightness = getLightness(surfaceColors['surface-default']);
      const elevatedLightness = getLightness(surfaceColors['surface-elevated']);
      // In a light theme, elevated surfaces are typically lighter
      // Adjust assertion based on actual theme direction
      expect(elevatedLightness).toBeGreaterThanOrEqual(defaultLightness);
    });
  });
  
  describe('text colors', () => {
    it('primary text has sufficient contrast against surfaces', () => {
      const contrastRatio = getContrastRatio(
        textColors['text-primary'],
        surfaceColors['surface-default']
      );
      // WCAG AA requires 4.5:1 for normal text
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
```

---

## Extractor Tests

Extractor tests can be more integration-heavy since they deal with external services.

```typescript
// packages/extractor/__tests__/screenshot/capture.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { captureScreenshot } from '../../src/screenshot/capture';

describe('captureScreenshot', () => {
  // Use real browser in CI, mock in local dev (optional)
  
  it('captures screenshot of valid URL', async () => {
    const result = await captureScreenshot('https://example.com');
    
    expect(result.success).toBe(true);
    expect(result.screenshot).toBeInstanceOf(Buffer);
    expect(result.screenshot.length).toBeGreaterThan(0);
  });
  
  it('returns error for invalid URL', async () => {
    const result = await captureScreenshot('not-a-url');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid URL');
  });
  
  it('handles timeout gracefully', async () => {
    const result = await captureScreenshot('https://httpstat.us/200?sleep=30000', {
      timeout: 1000,
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('timeout');
  });
});
```

---

## Snapshot Testing Policy

**Generally avoid snapshots** because they:
- Test implementation details (DOM structure)
- Break on any change, even valid refactors
- Encourage "update snapshot" without review

**Exception**: Snapshots are acceptable for generated output that should remain stable:

```typescript
// ✅ Acceptable: Testing generated token CSS
it('generates expected CSS variables', () => {
  const css = generateCSS(tokens);
  expect(css).toMatchInlineSnapshot(`
    ":root {
      --color-surface-default: #ffffff;
      --color-surface-elevated: #f8fafc;
    }"
  `);
});
```

---

## Test Coverage Requirements

| Package | Minimum Coverage | Focus Areas |
|---------|------------------|-------------|
| `@extracted/types` | N/A (types only) | N/A |
| `@extracted/tokens` | 80% | Token validation, CSS generation |
| `@extracted/primitives` | 90% | All component behavior |
| `@extracted/extractor` | 70% | Critical paths, error handling |
| `apps/web` | 60% | API routes, critical UI flows |

---

## When to Write Tests

1. **Before implementation (TDD)** — Write failing test, then implement
2. **Bug fixes** — Write test that reproduces bug, then fix
3. **Edge cases** — When you think "this could break if..."
4. **Public API changes** — Any change to component props or exports

---

## When NOT to Write Tests

1. **Trivial code** — Simple re-exports, type-only files
2. **Third-party libraries** — They have their own tests
3. **Implementation details** — Internal functions that may change
4. **One-off scripts** — Build scripts, generators (unless complex)
