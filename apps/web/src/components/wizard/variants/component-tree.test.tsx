import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentTree } from './component-tree';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState, ButtonVariantSpec } from '@/lib/wizard-types';
import { getInitialWizardState, getDefaultVariants } from '@/lib/wizard-types';

const mockButtonSpec: ButtonVariantSpec = {
  background: 'primary',
  color: 'white',
  borderColor: 'transparent',
  borderWidth: '0',
  borderRadius: 'md',
  padding: ['sm', 'md', 'sm', 'md'],
  fontFamily: 'sans',
  fontSize: 'base',
  fontWeight: 'medium',
  shadow: 'none',
};

vi.mock('../tooltip', () => ({
  Tooltip: ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div data-tooltip={content}>{children}</div>
  ),
}));

function createWrapper(overrides: Partial<WizardState> = {}) {
  const initialState = { ...getInitialWizardState(), ...overrides };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <WizardProvider initialState={initialState}>{children}</WizardProvider>;
  };
}

describe('ComponentTree', () => {
  it('renders Components heading', () => {
    render(<ComponentTree />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Components')).toBeInTheDocument();
  });

  it('renders all component types', () => {
    render(<ComponentTree />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Buttons')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Cards')).toBeInTheDocument();
  });

  it('shows variant count for each component', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
      { id: '2', name: 'Secondary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<ComponentTree />, {
      wrapper: createWrapper({ variants }),
    });

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('expands component to show variants', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<ComponentTree />, {
      wrapper: createWrapper({ variants }),
    });

    // Components are expanded by default
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('collapses component when clicked', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<ComponentTree />, {
      wrapper: createWrapper({ variants }),
    });

    fireEvent.click(screen.getByText('Buttons'));

    // After clicking, the variant should be hidden
    expect(screen.queryByText('Primary')).not.toBeInTheDocument();
  });

  it('shows Add new button for each component', () => {
    render(<ComponentTree />, {
      wrapper: createWrapper({ variantsLocked: false }),
    });

    const addButtons = screen.getAllByText('Add new');
    expect(addButtons).toHaveLength(3); // One for each component type
  });

  it('disables Add new button when variants are locked', () => {
    render(<ComponentTree />, {
      wrapper: createWrapper({ variantsLocked: true }),
    });

    const addButtons = screen.getAllByRole('button', { name: /add new/i });
    addButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('shows status icon for approved variant', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'approved', spec: mockButtonSpec, isManual: false },
    ];

    render(<ComponentTree />, {
      wrapper: createWrapper({ variants }),
    });

    // Check icon should be rendered
    const variantButton = screen.getByText('Primary').closest('button');
    expect(variantButton?.querySelector('svg')).toBeInTheDocument();
  });

  it('shows status icon for rejected variant', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'rejected', spec: mockButtonSpec, isManual: false },
    ];

    render(<ComponentTree />, {
      wrapper: createWrapper({ variants }),
    });

    // X icon should be rendered for rejected status
    const variantButton = screen.getByText('Primary').closest('button');
    expect(variantButton?.querySelector('svg')).toBeInTheDocument();
  });

  it('highlights selected variant', () => {
    const variants = getDefaultVariants();
    variants.buttons = [
      { id: '1', name: 'Primary', status: 'pending', spec: mockButtonSpec, isManual: false },
      { id: '2', name: 'Secondary', status: 'pending', spec: mockButtonSpec, isManual: false },
    ];

    render(<ComponentTree />, {
      wrapper: createWrapper({
        variants,
        currentComponent: 'buttons',
        currentVariantIndex: 0,
      }),
    });

    const primaryButton = screen.getByText('Primary').closest('button');
    expect(primaryButton?.textContent).toContain('→');
  });

  it('shows (new) indicator when creating new variant', () => {
    render(<ComponentTree />, {
      wrapper: createWrapper({
        currentComponent: 'buttons',
        isCreatingNewVariant: true,
      }),
    });

    expect(screen.getByText('(new)')).toBeInTheDocument();
  });

  it('renders as navigation', () => {
    render(<ComponentTree />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
