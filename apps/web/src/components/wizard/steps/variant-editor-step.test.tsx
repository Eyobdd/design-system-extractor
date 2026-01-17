import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VariantEditorStep } from './variant-editor-step';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState, VariantsMap, ButtonVariantSpec } from '@/lib/wizard-types';

// Mock child components
vi.mock('../variants/variant-detail', () => ({
  VariantDetail: ({ variant }: { variant: { name: string } }) => (
    <div data-testid="variant-detail">{variant.name}</div>
  ),
}));

vi.mock('../variants/new-variant-form', () => ({
  NewVariantForm: () => <div data-testid="new-variant-form">New Variant Form</div>,
}));

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

function getDefaultVariants(): VariantsMap {
  return {
    buttons: [],
    text: [],
    cards: [],
  };
}

function createWrapper(overrides: Partial<WizardState> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <WizardProvider
        initialState={{
          variants: getDefaultVariants(),
          currentComponent: 'buttons',
          currentVariantIndex: 0,
          ...overrides,
        }}
      >
        {children}
      </WizardProvider>
    );
  };
}

describe('VariantEditorStep', () => {
  it('renders the title and description', () => {
    render(<VariantEditorStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Variant Editor')).toBeInTheDocument();
    expect(screen.getByText('Review and approve component variants')).toBeInTheDocument();
  });

  it('shows empty state when no variants exist', () => {
    render(<VariantEditorStep />, { wrapper: createWrapper() });

    expect(screen.getByText(/no variants found/i)).toBeInTheDocument();
    expect(screen.getByText(/use the sidebar to add new variants/i)).toBeInTheDocument();
  });

  it('shows locked banner when variants are locked', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'approved', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants, variantsLocked: true }),
    });

    expect(screen.getByText(/variants are locked/i)).toBeInTheDocument();
  });

  it('shows NewVariantForm when creating new variant', () => {
    render(<VariantEditorStep />, {
      wrapper: createWrapper({ isCreatingNewVariant: true }),
    });

    expect(screen.getByTestId('new-variant-form')).toBeInTheDocument();
  });

  it('shows VariantDetail when variant exists', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants }),
    });

    expect(screen.getByTestId('variant-detail')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('shows variant counter', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
      { id: '2', name: 'Secondary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants }),
    });

    expect(screen.getByText(/variant 1 of 2/i)).toBeInTheDocument();
  });

  it('shows navigation buttons', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
      { id: '2', name: 'Secondary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants }),
    });

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(b => b.querySelector('svg.lucide-chevron-left'));
    const nextButton = buttons.find(b => b.querySelector('svg.lucide-chevron-right'));

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('disables prev button on first variant', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
      { id: '2', name: 'Secondary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants, currentVariantIndex: 0 }),
    });

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(b => b.querySelector('svg.lucide-chevron-left'));
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last variant', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
      { id: '2', name: 'Secondary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants, currentVariantIndex: 1 }),
    });

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(b => b.querySelector('svg.lucide-chevron-right'));
    expect(nextButton).toBeDisabled();
  });

  it('shows approve and reject buttons when not locked', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants, variantsLocked: false }),
    });

    expect(screen.getByRole('button', { name: /approved/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rejected/i })).toBeInTheDocument();
  });

  it('hides approve/reject buttons when locked', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'approved', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants, variantsLocked: true }),
    });

    const approveButtons = screen.queryAllByRole('button', { name: /approved/i });
    // When locked, it shows status span instead of buttons
    expect(approveButtons.length).toBe(0);
  });

  it('shows review progress with counts', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
      { id: '2', name: 'Secondary', status: 'approved', spec: mockButtonSpec, isManual: false },
      { id: '3', name: 'Tertiary', status: 'rejected', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants }),
    });

    expect(screen.getByText('Review Progress')).toBeInTheDocument();
    expect(screen.getByText(/pending: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/approved: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/rejected: 1/i)).toBeInTheDocument();
  });

  it('shows component type label', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants, currentComponent: 'buttons' }),
    });

    expect(screen.getByText(/buttons variant/i)).toBeInTheDocument();
  });

  it('shows lock instruction when pending variants remain', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<VariantEditorStep />, {
      wrapper: createWrapper({ variants }),
    });

    expect(screen.getByText(/review all variants to lock and continue/i)).toBeInTheDocument();
  });
});
