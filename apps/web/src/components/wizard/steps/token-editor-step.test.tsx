import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TokenEditorStep } from './token-editor-step';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState, ExtractedTokens } from '@/lib/wizard-types';

// Mock child components
vi.mock('../tokens/color-table', () => ({
  ColorTable: () => <div data-testid="color-table">ColorTable</div>,
}));

vi.mock('../tokens/simple-token-table', () => ({
  SimpleTokenTable: ({ title, category }: { title: string; category: string }) => (
    <div data-testid={`simple-token-table-${category}`}>{title}</div>
  ),
}));

const mockTokens: ExtractedTokens = {
  colors: { primary: { value: '#000', source: 'computed', usageCount: 1 } },
  fontFamilies: { sans: 'Inter' },
  fontSizes: { base: '16px' },
  fontWeights: { normal: '400' },
  lineHeights: { normal: '1.5' },
  spacing: { '4': '16px' },
  radii: { md: '8px' },
  shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)' },
};

function createWrapper(overrides: Partial<WizardState> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <WizardProvider initialState={{ tokens: mockTokens, ...overrides }}>
        {children}
      </WizardProvider>
    );
  };
}

describe('TokenEditorStep', () => {
  it('renders the title and description', () => {
    render(<TokenEditorStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Token Editor')).toBeInTheDocument();
    expect(screen.getByText('Review and edit the extracted design tokens')).toBeInTheDocument();
  });

  it('renders ColorTable component', () => {
    render(<TokenEditorStep />, { wrapper: createWrapper() });

    expect(screen.getByTestId('color-table')).toBeInTheDocument();
  });

  it('renders Typography section with all tables', () => {
    render(<TokenEditorStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByTestId('simple-token-table-fontFamilies')).toBeInTheDocument();
    expect(screen.getByTestId('simple-token-table-fontSizes')).toBeInTheDocument();
    expect(screen.getByTestId('simple-token-table-fontWeights')).toBeInTheDocument();
    expect(screen.getByTestId('simple-token-table-lineHeights')).toBeInTheDocument();
  });

  it('renders spacing table', () => {
    render(<TokenEditorStep />, { wrapper: createWrapper() });

    expect(screen.getByTestId('simple-token-table-spacing')).toBeInTheDocument();
  });

  it('renders radii table', () => {
    render(<TokenEditorStep />, { wrapper: createWrapper() });

    expect(screen.getByTestId('simple-token-table-radii')).toBeInTheDocument();
  });

  it('renders shadows table', () => {
    render(<TokenEditorStep />, { wrapper: createWrapper() });

    expect(screen.getByTestId('simple-token-table-shadows')).toBeInTheDocument();
  });

  it('shows locked banner when tokens are locked', () => {
    render(<TokenEditorStep />, {
      wrapper: createWrapper({ tokensLocked: true }),
    });

    expect(screen.getByText(/tokens are locked/i)).toBeInTheDocument();
    expect(screen.getByText(/use the footer button to unlock/i)).toBeInTheDocument();
  });

  it('does not show locked banner when tokens are unlocked', () => {
    render(<TokenEditorStep />, {
      wrapper: createWrapper({ tokensLocked: false }),
    });

    expect(screen.queryByText(/tokens are locked/i)).not.toBeInTheDocument();
  });

  it('renders all section IDs for navigation', () => {
    const { container } = render(<TokenEditorStep />, { wrapper: createWrapper() });

    expect(container.querySelector('#token-category-colors')).toBeInTheDocument();
    expect(container.querySelector('#token-category-typography')).toBeInTheDocument();
    expect(container.querySelector('#token-category-spacing')).toBeInTheDocument();
    expect(container.querySelector('#token-category-radii')).toBeInTheDocument();
    expect(container.querySelector('#token-category-shadows')).toBeInTheDocument();
  });
});
