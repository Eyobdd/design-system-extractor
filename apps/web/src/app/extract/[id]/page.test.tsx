import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExtractionStatus } from '@/hooks/use-extraction-status';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({ id: 'ext_123' }),
}));

vi.mock('@/hooks/use-extraction-status', () => ({
  useExtractionStatus: vi.fn(),
}));

function createMockStatus(overrides: Partial<ExtractionStatus> = {}): ExtractionStatus {
  return {
    id: 'ext_123',
    url: 'https://example.com',
    status: 'pending',
    progress: 0,
    startedAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:01:00Z',
    ...overrides,
  };
}

describe('ExtractPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('Loading State', () => {
    it('shows loading spinner and message when loading', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      expect(screen.getByText('Loading extraction status...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message and back link', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: null,
        error: 'Checkpoint not found',
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Checkpoint not found')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    });
  });

  describe('Not Found State', () => {
    it('shows not found when no data and not loading', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: null,
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      expect(screen.getByText('Extraction Not Found')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    });
  });

  describe('In-Progress State', () => {
    it('shows progress for screenshot phase', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({ status: 'screenshot', progress: 30 }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      expect(screen.getByText('Extracting Design System')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('displays target URL as external link', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({ url: 'https://example.com/path' }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      const link = screen.getByRole('link', { name: /example\.com/i });
      expect(link).toHaveAttribute('href', 'https://example.com/path');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('View Mode Toggle', () => {
    it('defaults to comparison view mode', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({ status: 'complete', progress: 100 }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      // Default view is now tokens, so tokens button should be active
      const tokensButton = screen.getByRole('button', { name: /extracted tokens/i });
      expect(tokensButton).toHaveClass('bg-blue-600');
    });

    it('switches to comparison view when clicked', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({
          status: 'complete',
          progress: 100,
          extractedTokens: { colors: { '#3b82f6': ['button'] } },
        }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      const comparisonButton = screen.getByRole('button', { name: /component variants/i });
      await userEvent.click(comparisonButton);

      expect(comparisonButton).toHaveClass('bg-blue-600');
    });

    it('switches back to tokens view', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({
          status: 'complete',
          progress: 100,
          extractedTokens: { colors: { '#3b82f6': ['button'] } },
        }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      const tokensButton = screen.getByRole('button', { name: /extracted tokens/i });
      const comparisonButton = screen.getByRole('button', { name: /component variants/i });

      await userEvent.click(comparisonButton);
      await userEvent.click(tokensButton);

      expect(tokensButton).toHaveClass('bg-blue-600');
    });

    it('hides comparison view when in tokens mode', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({
          status: 'complete',
          progress: 100,
          extractedTokens: { colors: { '#3b82f6': ['button'] } },
        }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      // Default is tokens view, so comparison list should not show
      expect(screen.queryByText('No variants to review')).not.toBeInTheDocument();
    });
  });

  describe('Complete State', () => {
    it('shows success message and view button', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({
          status: 'complete',
          progress: 100,
          extractedTokens: { colors: { primary: '#3b82f6' } },
        }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      expect(screen.getByText('Extraction Complete')).toBeInTheDocument();
      expect(screen.getByText('Design system extracted successfully!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view design system/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /extract another/i })).toHaveAttribute('href', '/');
    });

    it('navigates to design system on button click', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({ status: 'complete', progress: 100 }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      await userEvent.click(screen.getByRole('button', { name: /view design system/i }));

      expect(mockPush).toHaveBeenCalledWith('/design-system/ext_123');
    });

    it('displays extracted tokens visually', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({
          status: 'complete',
          progress: 100,
          extractedTokens: { colors: { '#3b82f6': ['button'], '#6b7280': ['text'] } },
        }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      // Default view is tokens, so colors should be visible
      expect(screen.getByText('#3b82f6')).toBeInTheDocument();
      expect(screen.getByText('#6b7280')).toBeInTheDocument();
    });
  });

  describe('Failed State', () => {
    it('shows error details and retry link', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({
          status: 'failed',
          progress: 50,
          error: 'Screenshot capture failed',
        }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      expect(screen.getByText('Extraction Failed')).toBeInTheDocument();
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText('Screenshot capture failed')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /try again/i })).toHaveAttribute('href', '/');
    });
  });

  describe('Metadata Display', () => {
    it('displays checkpoint ID', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({ id: 'ext_abc123' }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      expect(screen.getByText('Checkpoint ID')).toBeInTheDocument();
      expect(screen.getByText('ext_abc123')).toBeInTheDocument();
    });

    it('displays status', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({ status: 'vision' }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('vision')).toBeInTheDocument();
    });

    it('displays timestamps', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus({
          startedAt: '2024-06-15T10:30:00Z',
          updatedAt: '2024-06-15T10:35:00Z',
        }),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      expect(screen.getByText('Started')).toBeInTheDocument();
      expect(screen.getByText('Last Updated')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('has back to home link in header', async () => {
      const { useExtractionStatus } = await import('@/hooks/use-extraction-status');
      vi.mocked(useExtractionStatus).mockReturnValue({
        data: createMockStatus(),
        error: null,
        isLoading: false,
        refetch: vi.fn(),
      });

      const ExtractPage = (await import('./page')).default;
      render(<ExtractPage />);

      const backLinks = screen.getAllByRole('link', { name: /back to home/i });
      expect(backLinks[0]).toHaveAttribute('href', '/');
    });
  });
});
