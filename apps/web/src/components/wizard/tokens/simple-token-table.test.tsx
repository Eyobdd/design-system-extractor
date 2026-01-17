import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimpleTokenTable } from './simple-token-table';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState } from '@/lib/wizard-types';
import { getInitialWizardState } from '@/lib/wizard-types';

function createWrapper(overrides: Partial<WizardState> = {}) {
  const initialState = { ...getInitialWizardState(), ...overrides };
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <WizardProvider initialState={initialState}>{children}</WizardProvider>;
  };
}

describe('SimpleTokenTable', () => {
  const defaultProps = {
    category: 'spacing' as const,
    title: 'Spacing',
    tokens: { sm: '8px', md: '16px', lg: '24px' },
  };

  it('renders title', () => {
    render(<SimpleTokenTable {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Spacing')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<SimpleTokenTable {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('renders token entries', () => {
    render(<SimpleTokenTable {...defaultProps} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('sm')).toBeInTheDocument();
    expect(screen.getByText('md')).toBeInTheDocument();
    expect(screen.getByText('lg')).toBeInTheDocument();
    expect(screen.getByText('8px')).toBeInTheDocument();
    expect(screen.getByText('16px')).toBeInTheDocument();
    expect(screen.getByText('24px')).toBeInTheDocument();
  });

  it('renders Add button when not locked', () => {
    render(<SimpleTokenTable {...defaultProps} />, {
      wrapper: createWrapper({ tokensLocked: false }),
    });

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('hides Add button when locked', () => {
    render(<SimpleTokenTable {...defaultProps} />, {
      wrapper: createWrapper({ tokensLocked: true }),
    });

    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
  });

  it('renders empty state when no tokens', () => {
    render(<SimpleTokenTable {...defaultProps} tokens={{}} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/no tokens/i)).toBeInTheDocument();
  });

  it('shows edit and delete buttons when unlocked', () => {
    render(<SimpleTokenTable {...defaultProps} />, {
      wrapper: createWrapper({ tokensLocked: false }),
    });

    expect(screen.getAllByLabelText('Edit')).toHaveLength(3);
    expect(screen.getAllByLabelText('Delete')).toHaveLength(3);
  });

  it('hides edit and delete buttons when locked', () => {
    render(<SimpleTokenTable {...defaultProps} />, {
      wrapper: createWrapper({ tokensLocked: true }),
    });

    expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
  });

  it('shows add row when Add button is clicked', () => {
    render(<SimpleTokenTable {...defaultProps} />, {
      wrapper: createWrapper({ tokensLocked: false }),
    });

    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', () => {
    render(<SimpleTokenTable {...defaultProps} />, {
      wrapper: createWrapper({ tokensLocked: false }),
    });

    fireEvent.click(screen.getAllByLabelText('Edit')[0]!);

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('exits edit mode when Cancel is clicked', () => {
    render(<SimpleTokenTable {...defaultProps} />, {
      wrapper: createWrapper({ tokensLocked: false }),
    });

    fireEvent.click(screen.getAllByLabelText('Edit')[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('renders different input types for different categories', () => {
    render(<SimpleTokenTable category="spacing" title="Spacing" tokens={{ sm: '8px' }} />, {
      wrapper: createWrapper({ tokensLocked: false }),
    });

    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    // Spacing uses UnitInput which has a combobox for units
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders text input for fontFamilies category', () => {
    render(
      <SimpleTokenTable
        category="fontFamilies"
        title="Font Families"
        tokens={{ sans: 'system-ui' }}
      />,
      { wrapper: createWrapper({ tokensLocked: false }) }
    );

    fireEvent.click(screen.getAllByLabelText('Edit')[0]!);
    // fontFamilies uses plain text input
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });
});
