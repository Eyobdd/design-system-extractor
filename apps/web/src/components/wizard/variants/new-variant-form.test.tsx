import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewVariantForm } from './new-variant-form';
import { WizardProvider } from '@/contexts/wizard-context';
import { useWizard } from '@/hooks/use-wizard';
import type { WizardState } from '@/lib/wizard-types';
import { getInitialWizardState } from '@/lib/wizard-types';

function createWrapper(overrides: Partial<WizardState> = {}) {
  const initialState: WizardState = {
    ...getInitialWizardState(),
    ...overrides,
  };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <WizardProvider initialState={initialState}>{children}</WizardProvider>;
  };
}

function NewVariantFormHarness() {
  const { state } = useWizard();
  const currentVariants = state.variants[state.currentComponent];
  const currentVariant = currentVariants[state.currentVariantIndex];

  return (
    <>
      <div data-testid="variant-count">{currentVariants.length}</div>
      <div data-testid="is-creating">{state.isCreatingNewVariant ? 'yes' : 'no'}</div>
      <div data-testid="current-variant-name">{currentVariant?.name ?? ''}</div>
      <NewVariantForm />
    </>
  );
}

describe('NewVariantForm', () => {
  it('renders header and disables save when name is empty', () => {
    render(<NewVariantForm />, {
      wrapper: createWrapper({ currentComponent: 'buttons' }),
    });

    expect(screen.getByText(/new button variant/i)).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: /save new variant/i });
    expect(saveButton).toBeDisabled();
  });

  it('enables save when name is provided and saves a new variant into wizard state', async () => {
    const user = userEvent.setup();

    render(<NewVariantFormHarness />, {
      wrapper: createWrapper({
        currentComponent: 'buttons',
        isCreatingNewVariant: true,
        tokens: {
          colors: {
            primary: { value: '#111111', source: 'manual', usageCount: 1 },
            foreground: { value: '#eeeeee', source: 'manual', usageCount: 1 },
          },
          spacing: { sm: '4px', md: '8px' },
          radii: { md: '8px' },
          shadows: { none: 'none' },
          fontSizes: { base: '16px' },
          fontWeights: { normal: '400' },
          fontFamilies: { sans: 'system-ui' },
          lineHeights: { normal: '1.5' },
        },
        variants: { buttons: [], text: [], cards: [] },
      }),
    });

    expect(screen.getByTestId('variant-count')).toHaveTextContent('0');

    const nameInput = screen.getByRole('textbox');
    await user.type(nameInput, '  outline  ');

    const saveButton = screen.getByRole('button', { name: /save new variant/i });
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    // Should add a new approved manual variant and select it.
    expect(screen.getByTestId('variant-count')).toHaveTextContent('1');
    expect(screen.getByTestId('current-variant-name')).toHaveTextContent('outline');
    expect(screen.getByTestId('is-creating')).toHaveTextContent('no');
  });

  it('cancel triggers cancelNewVariant and exits creation mode in wizard state', async () => {
    const user = userEvent.setup();

    render(<NewVariantFormHarness />, {
      wrapper: createWrapper({
        currentComponent: 'text',
        isCreatingNewVariant: true,
      }),
    });

    expect(screen.getByTestId('is-creating')).toHaveTextContent('yes');

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByTestId('is-creating')).toHaveTextContent('no');
  });
});
