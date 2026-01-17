import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExtractStep } from './extract-step';
import { WizardProvider } from '@/contexts/wizard-context';
import type { WizardState } from '@/lib/wizard-types';

// Mock useExtractionStatus hook
vi.mock('@/hooks/use-extraction-status', () => ({
  useExtractionStatus: vi.fn(() => ({ data: null })),
}));

// Mock fetch
global.fetch = vi.fn();

function createWrapper(overrides: Partial<WizardState> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <WizardProvider initialState={overrides}>{children}</WizardProvider>;
  };
}

describe('ExtractStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ checkpointId: 'test-checkpoint' }),
    });
  });

  it('renders the title and description', () => {
    render(<ExtractStep />, { wrapper: createWrapper() });

    expect(screen.getByText('Design System Extractor Tool')).toBeInTheDocument();
    expect(
      screen.getByText('Enter a website URL to extract its design system')
    ).toBeInTheDocument();
  });

  it('renders URL input with placeholder', () => {
    render(<ExtractStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox', { name: /website url/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'https://example.com');
  });

  it('renders extract button', () => {
    render(<ExtractStep />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /extract/i })).toBeInTheDocument();
  });

  it('renders subpages checkbox', () => {
    render(<ExtractStep />, { wrapper: createWrapper() });

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText(/include subpages/i)).toBeInTheDocument();
  });

  it('disables extract button when URL is empty', () => {
    render(<ExtractStep />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /extract/i });
    expect(button).toBeDisabled();
  });

  it('enables extract button when URL is entered', () => {
    render(<ExtractStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox', { name: /website url/i });
    fireEvent.change(input, { target: { value: 'example.com' } });

    const button = screen.getByRole('button', { name: /extract/i });
    expect(button).not.toBeDisabled();
  });

  it('shows validation error for empty URL on submit', async () => {
    render(<ExtractStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox', { name: /website url/i });
    fireEvent.change(input, { target: { value: '   ' } });

    const form = input.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Please enter a URL')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid URL', async () => {
    render(<ExtractStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox', { name: /website url/i });
    fireEvent.change(input, { target: { value: 'not-a-valid-url' } });

    const form = input.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    });
  });

  it('shows extracting state with progress message', () => {
    render(<ExtractStep />, {
      wrapper: createWrapper({
        extractionStatus: 'extracting',
        extractionProgress: 20,
      }),
    });

    expect(screen.getByText(/extracting css variables/i)).toBeInTheDocument();
  });

  it('shows complete state', () => {
    render(<ExtractStep />, {
      wrapper: createWrapper({
        extractionStatus: 'complete',
      }),
    });

    expect(screen.getByText('Extraction complete')).toBeInTheDocument();
  });

  it('shows error state with message', () => {
    render(<ExtractStep />, {
      wrapper: createWrapper({
        extractionStatus: 'error',
        extractionError: 'Network error occurred',
      }),
    });

    expect(screen.getByText('Network error occurred')).toBeInTheDocument();
  });

  it('disables input during extraction', () => {
    render(<ExtractStep />, {
      wrapper: createWrapper({
        extractionStatus: 'extracting',
      }),
    });

    const input = screen.getByRole('textbox', { name: /website url/i });
    expect(input).toBeDisabled();
  });

  it('disables checkbox during extraction', () => {
    render(<ExtractStep />, {
      wrapper: createWrapper({
        extractionStatus: 'extracting',
      }),
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('calls fetch with correct payload on valid submit', async () => {
    render(<ExtractStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox', { name: /website url/i });
    fireEvent.change(input, { target: { value: 'example.com' } });

    const form = input.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/extract/start',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('includes subpages option in fetch payload when checked', async () => {
    render(<ExtractStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox', { name: /website url/i });
    const checkbox = screen.getByRole('checkbox');

    fireEvent.change(input, { target: { value: 'example.com' } });
    fireEvent.click(checkbox);

    const form = input.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/extract/start',
        expect.objectContaining({
          body: expect.stringContaining('"includeSubpages":true'),
        })
      );
    });
  });

  it('shows different progress messages based on progress', () => {
    const { rerender } = render(<ExtractStep />, {
      wrapper: createWrapper({
        extractionStatus: 'extracting',
        extractionProgress: 5,
      }),
    });

    expect(screen.getByText(/capturing screenshot/i)).toBeInTheDocument();

    rerender(
      <WizardProvider initialState={{ extractionStatus: 'extracting', extractionProgress: 50 }}>
        <ExtractStep />
      </WizardProvider>
    );

    expect(screen.getByText(/clustering colors/i)).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    render(<ExtractStep />, { wrapper: createWrapper() });

    const input = screen.getByRole('textbox', { name: /website url/i });
    fireEvent.change(input, { target: { value: 'example.com' } });

    const form = input.closest('form');
    fireEvent.submit(form!);

    // Should not throw
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
