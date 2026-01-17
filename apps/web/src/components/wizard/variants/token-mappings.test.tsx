import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TokenMappings } from './token-mappings';
import { WizardProvider } from '@/contexts/wizard-context';
import { useWizard } from '@/hooks/use-wizard';
import type { WizardState, ButtonVariantSpec } from '@/lib/wizard-types';
import { getInitialWizardState } from '@/lib/wizard-types';
import { DEFAULT_TOKEN_VALUE } from '@/lib/component-defaults';

function createWrapper(overrides: Partial<WizardState> = {}) {
  const initialState: WizardState = {
    ...getInitialWizardState(),
    ...overrides,
  };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <WizardProvider initialState={initialState}>{children}</WizardProvider>;
  };
}

function TokenMappingsHarness() {
  const { state } = useWizard();
  const currentVariants = state.variants[state.currentComponent];
  const variant = currentVariants[state.currentVariantIndex];

  if (!variant) {
    return null;
  }

  return <TokenMappings spec={variant.spec} />;
}

function CurrentStepReader() {
  const { state } = useWizard();
  return <div data-testid="current-step">{state.currentStep}</div>;
}

describe('TokenMappings', () => {
  it('renders token selects for non-padding properties', () => {
    const buttonSpec: ButtonVariantSpec = {
      background: 'primary',
      color: 'foreground',
      borderColor: 'primary',
      borderWidth: 'sm',
      borderRadius: 'md',
      padding: ['sm', 'md'],
      fontSize: 'base',
      fontWeight: 'normal',
      fontFamily: 'sans',
      shadow: 'none',
    };

    render(<TokenMappings spec={buttonSpec} />, {
      wrapper: createWrapper({
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
      }),
    });

    expect(screen.getByText('background')).toBeInTheDocument();
    expect(screen.getByText('color')).toBeInTheDocument();
    expect(screen.getByText('borderRadius')).toBeInTheDocument();
  });

  it('shows empty category warning and navigates to token editor when clicked', async () => {
    const user = userEvent.setup();

    const buttonSpec: ButtonVariantSpec = {
      background: 'primary',
      color: 'foreground',
      borderColor: 'primary',
      borderWidth: 'sm',
      borderRadius: 'md',
      padding: ['sm', 'md'],
      fontSize: 'base',
      fontWeight: 'normal',
      fontFamily: 'sans',
      shadow: 'none',
    };

    render(
      <>
        <CurrentStepReader />
        <TokenMappings spec={buttonSpec} />
      </>,
      {
        wrapper: createWrapper({
          currentStep: 3,
          tokens: {
            ...getInitialWizardState().tokens,
            colors: {
              primary: { value: '#111111', source: 'manual', usageCount: 1 },
              foreground: { value: '#eeeeee', source: 'manual', usageCount: 1 },
            },
            // spacing is empty -> required by padding/borderWidth
            spacing: {},
            radii: { md: '8px' },
            shadows: { none: 'none' },
            fontSizes: { base: '16px' },
            fontWeights: { normal: '400' },
            fontFamilies: { sans: 'system-ui' },
            lineHeights: { normal: '1.5' },
          },
        }),
      }
    );

    expect(screen.getByText(/some token categories are empty/i)).toBeInTheDocument();
    expect(screen.getByText(/missing:/i)).toBeInTheDocument();

    expect(screen.getByTestId('current-step')).toHaveTextContent('3');

    await user.click(screen.getByRole('button', { name: /go to token editor/i }));

    // Going back from step 3 -> step 2 is always allowed by the reducer.
    expect(screen.getByTestId('current-step')).toHaveTextContent('2');
  });

  it('updates selected token value when a dropdown changes (via wizard state)', async () => {
    const user = userEvent.setup();

    const buttonSpec: ButtonVariantSpec = {
      background: 'primary',
      color: 'foreground',
      borderColor: 'primary',
      borderWidth: 'sm',
      borderRadius: 'md',
      padding: ['sm', 'md'],
      fontSize: 'base',
      fontWeight: 'normal',
      fontFamily: 'sans',
      shadow: 'none',
    };

    render(<TokenMappingsHarness />, {
      wrapper: createWrapper({
        tokens: {
          colors: {
            primary: { value: '#111111', source: 'manual', usageCount: 1 },
            secondary: { value: '#222222', source: 'manual', usageCount: 1 },
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
        variants: {
          buttons: [
            { id: 'v1', name: 'Primary', status: 'pending', spec: buttonSpec, isManual: false },
          ],
          text: [],
          cards: [],
        },
        currentComponent: 'buttons',
        currentVariantIndex: 0,
      }),
    });

    // Background select should start at 'primary'
    const selects = screen.getAllByRole('combobox');
    // Find the background select by its current value.
    const backgroundSelect = selects.find(s => (s as HTMLSelectElement).value === 'primary');
    expect(backgroundSelect).toBeTruthy();

    await user.selectOptions(backgroundSelect as HTMLSelectElement, 'secondary');

    // Harness should re-render with updated spec from wizard state
    expect((backgroundSelect as HTMLSelectElement).value).toBe('secondary');
  });

  it('renders [deleted] option when spec references a token key that no longer exists', () => {
    const buttonSpec: ButtonVariantSpec = {
      background: 'does-not-exist',
      color: 'foreground',
      borderColor: 'primary',
      borderWidth: DEFAULT_TOKEN_VALUE,
      borderRadius: 'md',
      padding: ['sm', 'md'],
      fontSize: 'base',
      fontWeight: 'normal',
      fontFamily: 'sans',
      shadow: 'none',
    };

    render(<TokenMappings spec={buttonSpec} />, {
      wrapper: createWrapper({
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
      }),
    });

    expect(screen.getByRole('option', { name: /\[deleted\] does-not-exist/i })).toBeInTheDocument();
  });
});
