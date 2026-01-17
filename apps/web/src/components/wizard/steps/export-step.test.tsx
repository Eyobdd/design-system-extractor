import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportStep } from './export-step';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState, ExtractedTokens, VariantsMap } from '@/lib/wizard-types';

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

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

const mockVariants: VariantsMap = {
  buttons: [],
  text: [],
  cards: [],
};

function createWrapper(overrides: Partial<WizardState> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <WizardProvider
        initialState={{
          tokens: mockTokens,
          variants: mockVariants,
          sourceUrl: 'https://example.com',
          checkpointId: 'test-checkpoint',
          ...overrides,
        }}
      >
        {children}
      </WizardProvider>
    );
  };
}

describe('ExportStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['test'])),
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="design-system.zip"',
      }),
    });
  });

  it('renders the title and description', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Export Package')).toBeInTheDocument();
    expect(screen.getByText('Your design system is ready to download!')).toBeInTheDocument();
  });

  it('renders package name input', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Package Name')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('generates default package name from source URL', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('@example-com/extracted-design-system');
  });

  it('shows download button', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /download package/i })).toBeInTheDocument();
  });

  it('shows token and variant counts', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    // 8 tokens (1 color + 1 fontFamily + 1 fontSize + 1 fontWeight + 1 lineHeight + 1 spacing + 1 radius + 1 shadow)
    expect(screen.getByText(/8 tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/0 variants/i)).toBeInTheDocument();
  });

  it('shows installation instructions', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Installation')).toBeInTheDocument();
    expect(screen.getByText(/extract the zip to your project/i)).toBeInTheDocument();
  });

  it('shows code example with package name', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    expect(screen.getByText(/import.*Button.*Text.*Card/)).toBeInTheDocument();
  });

  it('shows start new extraction button', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /start new extraction/i })).toBeInTheDocument();
  });

  it('validates package name - requires @ prefix', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'invalid-name' } });

    expect(screen.getByText(/must start with @/i)).toBeInTheDocument();
  });

  it('validates package name - requires valid format', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '@invalid' } });

    expect(screen.getByText(/must be a valid npm scope/i)).toBeInTheDocument();
  });

  it('disables download button when package name is invalid', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'invalid' } });

    const downloadButton = screen.getByRole('button', { name: /download package/i });
    expect(downloadButton).toBeDisabled();
  });

  it('enables download button when package name is valid', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    const downloadButton = screen.getByRole('button', { name: /download package/i });
    expect(downloadButton).not.toBeDisabled();
  });

  it('calls fetch on download click', async () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    const downloadButton = screen.getByRole('button', { name: /download package/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/export?checkpointId=test-checkpoint')
      );
    });
  });

  it('shows loading state during export', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<ExportStep />, { wrapper: createWrapper() });

    const downloadButton = screen.getByRole('button', { name: /download package/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByText(/preparing/i)).toBeInTheDocument();
    });
  });

  it('shows error message on export failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<ExportStep />, { wrapper: createWrapper() });

    const downloadButton = screen.getByRole('button', { name: /download package/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByText(/export failed/i)).toBeInTheDocument();
    });
  });

  it('shows package icon', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    const icon = document.querySelector('svg.lucide-package');
    expect(icon).toBeInTheDocument();
  });

  it('displays zip filename based on package name', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    expect(screen.getByText(/extracted-design-system\.zip/i)).toBeInTheDocument();
  });

  it('shows estimated size', () => {
    render(<ExportStep />, { wrapper: createWrapper() });

    expect(screen.getByText(/estimated size/i)).toBeInTheDocument();
  });
});
