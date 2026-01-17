import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewStep } from './review-step';
import { WizardProvider } from '@/contexts/wizard-context';
import type {
  WizardState,
  ExtractedTokens,
  VariantsMap,
  ButtonVariantSpec,
  TextVariantSpec,
  CardVariantSpec,
} from '@/lib/wizard-types';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

const mockButtonSpec: ButtonVariantSpec = {
  background: 'primary',
  color: 'white',
  borderRadius: 'md',
  fontSize: 'base',
  fontWeight: 'medium',
  padding: ['16px'],
  borderWidth: '0px',
  borderColor: 'transparent',
  fontFamily: 'sans',
  shadow: 'none',
};

const mockTextSpec: TextVariantSpec = {
  color: 'foreground',
  fontSize: 'base',
  fontWeight: 'normal',
  fontFamily: 'sans',
  lineHeight: 'normal',
};

const mockCardSpec: CardVariantSpec = {
  background: 'surface',
  borderColor: 'border',
  borderWidth: '1px',
  borderRadius: 'md',
  padding: ['16px'],
  shadow: 'sm',
};

const mockTokens: ExtractedTokens = {
  colors: {
    primary: { value: '#3b82f6', source: 'computed', usageCount: 5 },
    secondary: { value: '#6b7280', source: 'computed', usageCount: 3 },
  },
  fontFamilies: { sans: 'Inter, system-ui, sans-serif' },
  fontSizes: { base: '16px', lg: '18px' },
  fontWeights: { normal: '400', medium: '500' },
  lineHeights: { normal: '1.5' },
  spacing: { '4': '16px', '8': '32px' },
  radii: { md: '8px', lg: '12px' },
  shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)' },
};

const mockVariants: VariantsMap = {
  buttons: [
    { id: '1', name: 'Primary', status: 'approved', spec: mockButtonSpec, isManual: false },
  ],
  text: [{ id: '2', name: 'Body', status: 'approved', spec: mockTextSpec, isManual: false }],
  cards: [{ id: '3', name: 'Elevated', status: 'approved', spec: mockCardSpec, isManual: false }],
};

function createWrapper(overrides: Partial<WizardState> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <WizardProvider
        initialState={{
          tokens: mockTokens,
          variants: mockVariants,
          sourceUrl: 'https://example.com',
          ...overrides,
        }}
      >
        {children}
      </WizardProvider>
    );
  };
}

describe('ReviewStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Extracted Design System')).toBeInTheDocument();
  });

  it('shows formatted domain from source URL', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByText(/from:.*example\.com/i)).toBeInTheDocument();
  });

  it('renders Tokens section', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: 'Tokens' })).toBeInTheDocument();
  });

  it('renders Component Variants section', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: 'Component Variants' })).toBeInTheDocument();
  });

  it('shows color count', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByText(/colors \(2\)/i)).toBeInTheDocument();
  });

  it('renders color swatches in visual mode', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByText('primary')).toBeInTheDocument();
    expect(screen.getByText('secondary')).toBeInTheDocument();
  });

  it('shows Typography section', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Typography')).toBeInTheDocument();
  });

  it('shows add tokens button', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /add tokens/i })).toBeInTheDocument();
  });

  it('shows add variant button', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /add variant/i })).toBeInTheDocument();
  });

  it('renders Visual/Code toggle for tokens', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    const visualButtons = screen.getAllByRole('button', { name: 'Visual' });
    const codeButtons = screen.getAllByRole('button', { name: 'Code' });

    expect(visualButtons.length).toBeGreaterThan(0);
    expect(codeButtons.length).toBeGreaterThan(0);
  });

  it('switches to code view when Code button clicked', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    const codeButtons = screen.getAllByRole('button', { name: 'Code' });
    fireEvent.click(codeButtons[0]!);

    // Should show code block with filename
    expect(screen.getByText('tokens/colors.ts')).toBeInTheDocument();
  });

  it('shows approved button variants', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Buttons')).toBeInTheDocument();
    // Multiple elements with 'Primary' text exist (button and label)
    const primaryElements = screen.getAllByText('Primary');
    expect(primaryElements.length).toBeGreaterThan(0);
  });

  it('shows approved text variants', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('shows approved card variants', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Cards')).toBeInTheDocument();
    expect(screen.getByText('Elevated')).toBeInTheDocument();
  });

  it('shows "No variants defined" badge when no approved variants', () => {
    const emptyVariants: VariantsMap = {
      buttons: [],
      text: [],
      cards: [],
    };

    render(<ReviewStep />, {
      wrapper: createWrapper({ variants: emptyVariants }),
    });

    const badges = screen.getAllByText(/no variants defined/i);
    expect(badges.length).toBe(3); // One for each component type
  });

  it('renders Usage section', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: 'Usage' })).toBeInTheDocument();
  });

  it('renders Code Preview section', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: 'Code Preview' })).toBeInTheDocument();
  });

  it('shows package structure preview', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    // Multiple elements contain 'extracted-design-system'
    const structureElements = screen.getAllByText(/extracted-design-system/);
    expect(structureElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Package structure:')).toBeInTheDocument();
  });

  it('renders code blocks with copy buttons in code view', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    const codeButtons = screen.getAllByRole('button', { name: 'Code' });
    fireEvent.click(codeButtons[0]!);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('copies code to clipboard when copy button clicked', async () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    const codeButtons = screen.getAllByRole('button', { name: 'Code' });
    fireEvent.click(codeButtons[0]!);

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    fireEvent.click(copyButtons[0]!);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('has section IDs for navigation', () => {
    const { container } = render(<ReviewStep />, { wrapper: createWrapper() });

    expect(container.querySelector('#review-section-tokens')).toBeInTheDocument();
    expect(container.querySelector('#review-section-variants')).toBeInTheDocument();
    expect(container.querySelector('#review-section-usage')).toBeInTheDocument();
    expect(container.querySelector('#review-section-code')).toBeInTheDocument();
  });

  it('shows variant code in code view', () => {
    render(<ReviewStep />, { wrapper: createWrapper() });

    const codeButtons = screen.getAllByRole('button', { name: 'Code' });
    // Click code button for variants section (second toggle)
    fireEvent.click(codeButtons[1]!);

    expect(screen.getByText('variants/button.ts')).toBeInTheDocument();
  });
});
