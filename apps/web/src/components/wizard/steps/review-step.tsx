'use client';

import { useState } from 'react';
import { Plus, Copy, Check } from 'lucide-react';
import { useWizard } from '@/hooks/use-wizard';
import { formatDomainForDisplay } from '@/lib/format-domain';
import { BUTTON_DEFAULTS, TEXT_DEFAULTS, CARD_DEFAULTS } from '@/lib/component-defaults';

type ViewMode = 'visual' | 'code';

function CodeBlock({ filename, code }: { filename: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: 'var(--border)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
          {filename}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs hover:opacity-70 transition-opacity"
          style={{ color: 'var(--muted)' }}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre
        className="p-4 text-sm overflow-x-auto"
        style={{ backgroundColor: '#1a1a1a', color: '#e5e5e5' }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function ReviewStep() {
  const { state, goToStep } = useWizard();
  const [tokensViewMode, setTokensViewMode] = useState<ViewMode>('visual');
  const [variantsViewMode, setVariantsViewMode] = useState<ViewMode>('visual');

  const domain = formatDomainForDisplay(state.sourceUrl);

  const approvedButtons = state.variants.buttons.filter(v => v.status === 'approved');
  const approvedText = state.variants.text.filter(v => v.status === 'approved');
  const approvedCards = state.variants.cards.filter(v => v.status === 'approved');

  const ViewToggle = ({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) => (
    <div
      className="flex rounded-lg overflow-hidden text-xs"
      style={{ border: '1px solid var(--border)' }}
    >
      <button
        type="button"
        onClick={() => onChange('visual')}
        className="px-3 py-1 transition-colors"
        style={{
          backgroundColor: mode === 'visual' ? 'var(--foreground)' : 'transparent',
          color: mode === 'visual' ? 'var(--background)' : 'var(--muted)',
        }}
      >
        Visual
      </button>
      <button
        type="button"
        onClick={() => onChange('code')}
        className="px-3 py-1 transition-colors"
        style={{
          backgroundColor: mode === 'code' ? 'var(--foreground)' : 'transparent',
          color: mode === 'code' ? 'var(--background)' : 'var(--muted)',
        }}
      >
        Code
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div>
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
          Extracted Design System
        </h2>
        <p style={{ color: 'var(--muted)' }}>from: {domain}</p>
      </div>

      {/* Tokens Section */}
      <section id="review-section-tokens" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
            Tokens
          </h3>
          <div className="flex items-center gap-4">
            <ViewToggle mode={tokensViewMode} onChange={setTokensViewMode} />
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="flex items-center gap-1 text-sm hover:opacity-70"
              style={{ color: 'var(--accent)' }}
            >
              <Plus className="h-3 w-3" />
              Add tokens
            </button>
          </div>
        </div>

        <div className="divider-centered" />

        {tokensViewMode === 'visual' ? (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <h4 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                Colors ({Object.keys(state.tokens.colors).length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(state.tokens.colors).map(([name, token]) => (
                  <div key={name} className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded border border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: token.value }}
                      title={`${name}: ${token.value}`}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                Typography
              </h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Families:</strong>{' '}
                  {Object.keys(state.tokens.fontFamilies).join(', ') || 'None'}
                </li>
                <li>
                  <strong>Sizes:</strong> {Object.keys(state.tokens.fontSizes).join(', ') || 'None'}
                </li>
                <li>
                  <strong>Weights:</strong>{' '}
                  {Object.keys(state.tokens.fontWeights).join(', ') || 'None'}
                </li>
                <li>
                  <strong>Line Heights:</strong>{' '}
                  {Object.keys(state.tokens.lineHeights).join(', ') || 'None'}
                </li>
              </ul>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Spacing
                </h4>
                <p className="text-sm text-gray-500">
                  {Object.keys(state.tokens.spacing).join(', ') || 'None'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Radii</h4>
                <p className="text-sm text-gray-500">
                  {Object.keys(state.tokens.radii).join(', ') || 'None'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Shadows
                </h4>
                <p className="text-sm text-gray-500">
                  {Object.keys(state.tokens.shadows).join(', ') || 'None'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <CodeBlock
              filename="tokens/colors.ts"
              code={`export const colors = {
${Object.entries(state.tokens.colors)
  .map(([name, token]) => `  ${name}: '${token.value}',`)
  .join('\n')}
} as const;

export type ColorKey = keyof typeof colors;`}
            />

            <CodeBlock
              filename="tokens/typography.ts"
              code={`export const fontFamilies = {
${Object.entries(state.tokens.fontFamilies)
  .map(([name, value]) => `  ${name}: '${value}',`)
  .join('\n')}
} as const;

export const fontSizes = {
${Object.entries(state.tokens.fontSizes)
  .map(([name, value]) => `  ${name}: '${value}',`)
  .join('\n')}
} as const;

export const fontWeights = {
${Object.entries(state.tokens.fontWeights)
  .map(([name, value]) => `  ${name}: '${value}',`)
  .join('\n')}
} as const;

export const lineHeights = {
${Object.entries(state.tokens.lineHeights)
  .map(([name, value]) => `  ${name}: '${value}',`)
  .join('\n')}
} as const;`}
            />

            <CodeBlock
              filename="tokens/spacing.ts"
              code={`export const spacing = {
${Object.entries(state.tokens.spacing)
  .map(([name, value]) => `  ${name}: '${value}',`)
  .join('\n')}
} as const;

export const radii = {
${Object.entries(state.tokens.radii)
  .map(([name, value]) => `  ${name}: '${value}',`)
  .join('\n')}
} as const;

export const shadows = {
${Object.entries(state.tokens.shadows)
  .map(([name, value]) => `  ${name}: '${value}',`)
  .join('\n')}
} as const;`}
            />
          </div>
        )}
      </section>

      {/* Variants Section */}
      <section id="review-section-variants" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
            Component Variants
          </h3>
          <div className="flex items-center gap-4">
            <ViewToggle mode={variantsViewMode} onChange={setVariantsViewMode} />
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="flex items-center gap-1 text-sm hover:opacity-70"
              style={{ color: 'var(--accent)' }}
            >
              <Plus className="h-3 w-3" />
              Add variant
            </button>
          </div>
        </div>

        <div className="divider-centered" />

        {variantsViewMode === 'visual' ? (
          <>
            {/* Buttons */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Buttons
                </h4>
                {approvedButtons.length === 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: 'var(--border)', color: 'var(--muted)' }}
                  >
                    No variants defined
                  </span>
                )}
              </div>
              <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)' }}>
                {approvedButtons.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {approvedButtons.map(variant => (
                      <div key={variant.id} className="text-center">
                        <button
                          className="mb-2 rounded-lg px-6 py-2 text-sm font-medium text-white"
                          style={{ backgroundColor: BUTTON_DEFAULTS.background }}
                        >
                          {variant.name}
                        </button>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {variant.name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <button
                      className="rounded-lg px-6 py-2 text-sm font-medium text-white"
                      style={{
                        backgroundColor: BUTTON_DEFAULTS.background,
                        borderRadius: BUTTON_DEFAULTS.borderRadius,
                      }}
                    >
                      Button Text
                    </button>
                    <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                      Base Button (using default styles)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Text */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Text
                </h4>
                {approvedText.length === 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: 'var(--border)', color: 'var(--muted)' }}
                  >
                    No variants defined
                  </span>
                )}
              </div>
              <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)' }}>
                {approvedText.length > 0 ? (
                  <div className="space-y-3">
                    {approvedText.map(variant => (
                      <div key={variant.id} className="flex items-center gap-4">
                        <span className="w-24 text-sm" style={{ color: 'var(--muted)' }}>
                          {variant.name}
                        </span>
                        <span style={{ color: TEXT_DEFAULTS.color }}>Sample text</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p style={{ color: TEXT_DEFAULTS.color, fontSize: TEXT_DEFAULTS.fontSize }}>
                      Sample Text
                    </p>
                    <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                      Base Text (using default styles)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Cards
                </h4>
                {approvedCards.length === 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: 'var(--border)', color: 'var(--muted)' }}
                  >
                    No variants defined
                  </span>
                )}
              </div>
              <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)' }}>
                {approvedCards.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {approvedCards.map(variant => (
                      <div key={variant.id} className="text-center">
                        <div
                          className="mb-2 flex h-24 w-32 items-center justify-center"
                          style={{
                            backgroundColor: CARD_DEFAULTS.background,
                            borderRadius: CARD_DEFAULTS.borderRadius,
                            border: `${CARD_DEFAULTS.borderWidth} solid ${CARD_DEFAULTS.borderColor}`,
                            boxShadow: CARD_DEFAULTS.shadow,
                          }}
                        >
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>
                            Card
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {variant.name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div
                      className="mx-auto flex h-24 w-32 items-center justify-center"
                      style={{
                        backgroundColor: CARD_DEFAULTS.background,
                        borderRadius: CARD_DEFAULTS.borderRadius,
                        border: `${CARD_DEFAULTS.borderWidth} solid ${CARD_DEFAULTS.borderColor}`,
                        boxShadow: CARD_DEFAULTS.shadow,
                      }}
                    >
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        Card
                      </span>
                    </div>
                    <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                      Base Card (using default styles)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <CodeBlock
              filename="variants/button.ts"
              code={`import type { ButtonVariantSpec } from '../types';

export const buttonVariants = {
${
  approvedButtons.length > 0
    ? approvedButtons
        .map(
          v => `  ${v.name}: {
    background: '${(v.spec as { background?: string }).background || '_default'}',
    color: '${(v.spec as { color?: string }).color || '_default'}',
    borderRadius: '${(v.spec as { borderRadius?: string }).borderRadius || '_default'}',
    fontSize: '${(v.spec as { fontSize?: string }).fontSize || '_default'}',
    fontWeight: '${(v.spec as { fontWeight?: string }).fontWeight || '_default'}',
  },`
        )
        .join('\n')
    : '  // No button variants defined'
}
} as const satisfies Record<string, ButtonVariantSpec>;

export type ButtonVariant = keyof typeof buttonVariants;`}
            />

            <CodeBlock
              filename="variants/text.ts"
              code={`import type { TextVariantSpec } from '../types';

export const textVariants = {
${
  approvedText.length > 0
    ? approvedText
        .map(
          v => `  ${v.name}: {
    color: '${(v.spec as { color?: string }).color || '_default'}',
    fontSize: '${(v.spec as { fontSize?: string }).fontSize || '_default'}',
    fontWeight: '${(v.spec as { fontWeight?: string }).fontWeight || '_default'}',
    lineHeight: '${(v.spec as { lineHeight?: string }).lineHeight || '_default'}',
  },`
        )
        .join('\n')
    : '  // No text variants defined'
}
} as const satisfies Record<string, TextVariantSpec>;

export type TextVariant = keyof typeof textVariants;`}
            />

            <CodeBlock
              filename="variants/card.ts"
              code={`import type { CardVariantSpec } from '../types';

export const cardVariants = {
${
  approvedCards.length > 0
    ? approvedCards
        .map(
          v => `  ${v.name}: {
    background: '${(v.spec as { background?: string }).background || '_default'}',
    borderColor: '${(v.spec as { borderColor?: string }).borderColor || '_default'}',
    borderRadius: '${(v.spec as { borderRadius?: string }).borderRadius || '_default'}',
    shadow: '${(v.spec as { shadow?: string }).shadow || '_default'}',
  },`
        )
        .join('\n')
    : '  // No card variants defined'
}
} as const satisfies Record<string, CardVariantSpec>;

export type CardVariant = keyof typeof cardVariants;`}
            />
          </div>
        )}
      </section>

      <section id="review-section-usage" className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usage</h3>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Your components are simple to use — just pass a variant:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
            <code>{`import { Button, Text, Card } from './extracted-design-system';

// Buttons
<Button variant="primary">Get Started</Button>
<Button variant="secondary">Cancel</Button>

// Text
<Text variant="h1">Welcome</Text>
<Text variant="body">Content here...</Text>

// Cards
<Card variant="elevated">
  <Text variant="h3">Card Title</Text>
  <Text variant="body">Card content</Text>
</Card>`}</code>
          </pre>
        </div>
      </section>

      <section id="review-section-code" className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Code Preview</h3>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h4 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
            Package structure:
          </h4>
          <pre className="text-sm" style={{ color: 'var(--muted)' }}>
            {`extracted-design-system/
├── tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── radii.ts
│   ├── shadows.ts
│   └── index.ts
├── variants/
│   ├── button.ts
│   ├── text.ts
│   ├── card.ts
│   └── index.ts
├── components/
│   ├── Button.tsx
│   ├── Text.tsx
│   ├── Card.tsx
│   └── index.ts
├── types/
│   └── index.ts
└── index.ts`}
          </pre>
        </div>
      </section>
    </div>
  );
}
