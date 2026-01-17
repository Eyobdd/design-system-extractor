'use client';

import { AlertTriangle, Plus } from 'lucide-react';
import { useWizard } from '@/hooks/use-wizard';
import type { AnyVariantSpec, TokenCategory, SpacingTuple } from '@/lib/wizard-types';
import { PROPERTY_TOKEN_CATEGORY } from '@/lib/wizard-types';
import { DEFAULT_TOKEN_VALUE } from '@/lib/component-defaults';

interface TokenMappingsProps {
  spec: AnyVariantSpec;
  rawStyles?: Record<string, string>;
}

const CATEGORY_LABELS: Record<TokenCategory, string> = {
  colors: 'colors',
  fontFamilies: 'font families',
  fontSizes: 'font sizes',
  fontWeights: 'font weights',
  lineHeights: 'line heights',
  spacing: 'spacing',
  radii: 'radii',
  shadows: 'shadows',
};

export function TokenMappings({ spec, rawStyles: _rawStyles }: TokenMappingsProps) {
  const { state, updateVariantSpec, goToStep } = useWizard();

  const getTokensForCategory = (category: TokenCategory): string[] => {
    const tokens = state.tokens[category as keyof typeof state.tokens];
    if (!tokens) return [];

    if (category === 'colors') {
      return Object.keys(tokens);
    }
    return Object.keys(tokens as Record<string, string>);
  };

  const isCategoryEmpty = (category: TokenCategory): boolean => {
    return getTokensForCategory(category).length === 0;
  };

  // Get all empty categories needed by this component's properties
  const getEmptyCategories = (): TokenCategory[] => {
    const neededCategories = new Set<TokenCategory>();
    Object.keys(spec).forEach(property => {
      const category = PROPERTY_TOKEN_CATEGORY[property];
      if (category) neededCategories.add(category);
    });
    return Array.from(neededCategories).filter(cat => isCategoryEmpty(cat));
  };

  const handleChange = (property: string, value: string) => {
    updateVariantSpec(property, value);
  };

  const handleGoToTokenEditor = () => {
    goToStep(2);
  };

  const renderEmptyCategory = (category: TokenCategory) => {
    const label = CATEGORY_LABELS[category] || category;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          No {label} defined
        </span>
        <button
          type="button"
          onClick={handleGoToTokenEditor}
          className="flex items-center gap-1 text-xs hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
    );
  };

  const renderTokenSelect = (
    _property: string,
    category: TokenCategory,
    currentValue: string,
    onChange: (value: string) => void
  ) => {
    const tokens = getTokensForCategory(category);

    // If category is empty, show inline message instead of dropdown
    if (tokens.length === 0) {
      return renderEmptyCategory(category);
    }

    const isDefault = currentValue === DEFAULT_TOKEN_VALUE;

    // Check if current value is a deleted key (not in tokens and not default)
    const isDeletedKey = currentValue !== DEFAULT_TOKEN_VALUE && !tokens.includes(currentValue);

    return (
      <select
        value={currentValue}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded px-3 py-1.5 text-sm transition-colors"
        style={{
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          color: isDeletedKey ? '#ef4444' : isDefault ? 'var(--muted)' : 'var(--foreground)',
        }}
      >
        {/* Show [deleted] option only if current value is a deleted key */}
        {isDeletedKey && (
          <option value={currentValue} style={{ color: '#ef4444' }}>
            [deleted] {currentValue}
          </option>
        )}
        {tokens.map(key => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    );
  };

  const emptyCategories = getEmptyCategories();

  const renderPaddingGrid = (value: unknown) => {
    const paddingArray = Array.isArray(value) ? value : [DEFAULT_TOKEN_VALUE];
    const top = paddingArray[0] || DEFAULT_TOKEN_VALUE;
    const right = paddingArray[1] || paddingArray[0] || DEFAULT_TOKEN_VALUE;
    const bottom = paddingArray[2] || paddingArray[0] || DEFAULT_TOKEN_VALUE;
    const left = paddingArray[3] || paddingArray[1] || paddingArray[0] || DEFAULT_TOKEN_VALUE;

    const updatePadding = (position: 'top' | 'right' | 'bottom' | 'left', newValue: string) => {
      const newPadding: SpacingTuple = [
        position === 'top' ? newValue : top,
        position === 'right' ? newValue : right,
        position === 'bottom' ? newValue : bottom,
        position === 'left' ? newValue : left,
      ];
      updateVariantSpec('padding', newPadding);
    };

    return (
      <div className="space-y-3">
        <div
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: 'var(--muted)' }}
        >
          Padding
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--muted)' }}>
              top
            </label>
            {renderTokenSelect('paddingTop', 'spacing', top, v => updatePadding('top', v))}
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--muted)' }}>
              right
            </label>
            {renderTokenSelect('paddingRight', 'spacing', right, v => updatePadding('right', v))}
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--muted)' }}>
              bottom
            </label>
            {renderTokenSelect('paddingBottom', 'spacing', bottom, v => updatePadding('bottom', v))}
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--muted)' }}>
              left
            </label>
            {renderTokenSelect('paddingLeft', 'spacing', left, v => updatePadding('left', v))}
          </div>
        </div>
      </div>
    );
  };

  const renderPropertyRow = (property: string, value: unknown) => {
    const category = PROPERTY_TOKEN_CATEGORY[property];
    if (!category) return null;

    if (property === 'padding') {
      return (
        <div key={property} className="py-3">
          {renderPaddingGrid(value)}
        </div>
      );
    }

    const stringValue = typeof value === 'string' ? value : DEFAULT_TOKEN_VALUE;

    return (
      <div key={property} className="flex items-center justify-between py-3">
        <span className="text-sm" style={{ color: 'var(--foreground)' }}>
          {property}
        </span>
        <div className="w-40">
          {renderTokenSelect(property, category, stringValue, v => handleChange(property, v))}
        </div>
      </div>
    );
  };

  const specEntries = Object.entries(spec).filter(
    ([key]) => PROPERTY_TOKEN_CATEGORY[key] !== undefined
  );

  const paddingEntry = specEntries.find(([key]) => key === 'padding');
  const otherEntries = specEntries.filter(([key]) => key !== 'padding');

  return (
    <div className="space-y-4">
      {/* Warning banner for empty categories */}
      {emptyCategories.length > 0 && (
        <div
          className="flex items-start gap-3 rounded-lg p-4"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#92400e' }}>
              Some token categories are empty
            </p>
            <p className="text-sm mt-1" style={{ color: '#a16207' }}>
              Missing: {emptyCategories.map(cat => CATEGORY_LABELS[cat]).join(', ')}
            </p>
            <button
              type="button"
              onClick={handleGoToTokenEditor}
              className="mt-2 text-sm font-medium hover:opacity-70"
              style={{ color: '#92400e' }}
            >
              Go to Token Editor →
            </button>
          </div>
        </div>
      )}

      {/* Padding gets special 4-dropdown grid treatment */}
      {paddingEntry && renderPropertyRow(paddingEntry[0], paddingEntry[1])}

      {paddingEntry && otherEntries.length > 0 && <div className="divider-centered my-4" />}

      {/* Other properties */}
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {otherEntries.map(([property, value]) => renderPropertyRow(property, value))}
      </div>
    </div>
  );
}
