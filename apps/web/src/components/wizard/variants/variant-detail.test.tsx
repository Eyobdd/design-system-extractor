import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VariantDetail } from './variant-detail';
import { WizardProvider } from '@/contexts/wizard-context';
import { useWizard } from '@/hooks/use-wizard';
import type {
  WizardState,
  ExtractedVariant,
  ButtonVariantSpec,
  TextVariantSpec,
  CardVariantSpec,
} from '@/lib/wizard-types';
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

function VariantDetailHarness() {
  const { state } = useWizard();
  const variant = state.variants[state.currentComponent][state.currentVariantIndex];
  if (!variant) return null;
  return <VariantDetail variant={variant} />;
}

describe('VariantDetail', () => {
  it('renders variant name and status label', () => {
    const buttonSpec: ButtonVariantSpec = {
      background: 'primary',
      color: 'foreground',
      borderColor: 'primary',
      borderWidth: '0',
      borderRadius: 'md',
      padding: ['sm', 'md'],
      fontSize: 'base',
      fontWeight: 'normal',
      fontFamily: 'sans',
      shadow: 'none',
    };

    const variant: ExtractedVariant = {
      id: 'v1',
      name: 'Primary',
      status: 'approved',
      spec: buttonSpec,
      isManual: false,
    };

    render(<VariantDetail variant={variant} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('shows "Unnamed Variant" when name is empty', () => {
    const textSpec: TextVariantSpec = {
      color: 'primary',
      fontSize: 'base',
      fontWeight: 'normal',
      fontFamily: 'sans',
      lineHeight: 'normal',
    };

    const variant: ExtractedVariant = {
      id: 'v1',
      name: '',
      status: 'pending',
      spec: textSpec,
      isManual: false,
    };

    render(<VariantDetail variant={variant} />, { wrapper: createWrapper() });

    expect(screen.getByText('Unnamed Variant')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('allows renaming and updates name via wizard state', async () => {
    const user = userEvent.setup();

    const buttonSpec: ButtonVariantSpec = {
      background: 'primary',
      color: 'foreground',
      borderColor: 'primary',
      borderWidth: '0',
      borderRadius: 'md',
      padding: ['sm', 'md'],
      fontSize: 'base',
      fontWeight: 'normal',
      fontFamily: 'sans',
      shadow: 'none',
    };

    render(<VariantDetailHarness />, {
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

    await user.click(screen.getByText('Primary'));

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '  Renamed  ');

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Renamed')).toBeInTheDocument();
  });

  it('cancel renaming restores original name', async () => {
    const user = userEvent.setup();

    const cardSpec: CardVariantSpec = {
      background: 'primary',
      borderColor: 'primary',
      borderWidth: '0',
      borderRadius: 'md',
      padding: ['sm'],
      shadow: 'none',
    };

    const variant: ExtractedVariant = {
      id: 'v1',
      name: 'Original',
      status: 'editing',
      spec: cardSpec,
      isManual: true,
    };

    render(<VariantDetail variant={variant} />, { wrapper: createWrapper() });

    expect(screen.getAllByText('Manually created').length).toBeGreaterThan(0);
    expect(screen.getByText('Editing')).toBeInTheDocument();

    await user.click(screen.getByText('Original', { selector: 'h3' }));

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'New Name');

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByText('Original', { selector: 'h3' })).toBeInTheDocument();
  });

  it('renders original screenshot when available and shows location info', () => {
    const textSpec: TextVariantSpec = {
      color: 'primary',
      fontSize: 'base',
      fontWeight: 'normal',
      fontFamily: 'sans',
      lineHeight: 'normal',
    };

    const variant: ExtractedVariant = {
      id: 'v1',
      name: 'Text',
      status: 'pending',
      spec: textSpec,
      isManual: false,
      instances: [
        {
          selector: '.headline',
          rect: { x: 0, y: 0, width: 10, height: 10 },
          croppedScreenshot: 'data:image/png;base64,AAA',
          contextScreenshot: 'data:image/png;base64,BBB',
        },
      ],
    };

    render(<VariantDetail variant={variant} />, { wrapper: createWrapper() });

    expect(screen.getByAltText('Original component')).toBeInTheDocument();
    expect(screen.getByText(/selector:\s*\.headline/i)).toBeInTheDocument();
    expect(screen.getByText(/instances:\s*1 found/i)).toBeInTheDocument();
  });

  it('shows fallback original panel when no instances exist', () => {
    const cardSpec: CardVariantSpec = {
      background: 'primary',
      borderColor: 'primary',
      borderWidth: '0',
      borderRadius: 'md',
      padding: ['sm'],
      shadow: 'none',
    };

    const variant: ExtractedVariant = {
      id: 'v1',
      name: 'Card',
      status: 'pending',
      spec: cardSpec,
      isManual: false,
    };

    render(<VariantDetail variant={variant} />, { wrapper: createWrapper() });

    expect(screen.getByText('No screenshot')).toBeInTheDocument();
  });
});
