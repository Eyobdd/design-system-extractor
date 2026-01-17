'use client';

import { useWizard } from '@/hooks/use-wizard';
import { ColorTable } from '../tokens/color-table';
import { SimpleTokenTable } from '../tokens/simple-token-table';

export function TokenEditorStep() {
  const { state } = useWizard();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
          Token Editor
        </h2>
        <p style={{ color: 'var(--muted)' }}>Review and edit the extracted design tokens</p>
      </div>

      {state.tokensLocked && (
        <div
          className="mb-8 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--accent)',
          }}
        >
          Tokens are locked. Use the footer button to unlock.
        </div>
      )}

      <div className="space-y-12">
        <section id="token-category-colors">
          <ColorTable />
        </section>

        <div className="divider-centered" />

        <section id="token-category-typography">
          <h3 className="mb-6 text-lg font-medium" style={{ color: 'var(--foreground)' }}>
            Typography
          </h3>

          <div className="space-y-6">
            <SimpleTokenTable
              category="fontFamilies"
              title="Font Families"
              tokens={state.tokens.fontFamilies}
              placeholder="Inter, system-ui, sans-serif"
            />

            <SimpleTokenTable
              category="fontSizes"
              title="Font Sizes"
              tokens={state.tokens.fontSizes}
              placeholder="16px"
            />

            <SimpleTokenTable
              category="fontWeights"
              title="Font Weights"
              tokens={state.tokens.fontWeights}
              placeholder="500"
            />

            <SimpleTokenTable
              category="lineHeights"
              title="Line Heights"
              tokens={state.tokens.lineHeights}
              placeholder="1.5"
            />
          </div>
        </section>

        <section id="token-category-spacing">
          <SimpleTokenTable
            category="spacing"
            title="Spacing"
            tokens={state.tokens.spacing}
            placeholder="16px"
          />
        </section>

        <section id="token-category-radii">
          <SimpleTokenTable
            category="radii"
            title="Border Radii"
            tokens={state.tokens.radii}
            placeholder="8px"
          />
        </section>

        <section id="token-category-shadows">
          <SimpleTokenTable
            category="shadows"
            title="Shadows"
            tokens={state.tokens.shadows}
            placeholder="0 4px 6px rgba(0,0,0,0.1)"
          />
        </section>
      </div>
    </div>
  );
}
