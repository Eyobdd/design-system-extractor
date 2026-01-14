import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UrlInput } from './url-input';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('UrlInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the input field with accessible label', () => {
      render(<UrlInput />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'https://example.com');
    });

    it('renders the submit button', () => {
      render(<UrlInput />);

      expect(screen.getByRole('button', { name: /extract/i })).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows error for empty URL submission', async () => {
      render(<UrlInput />);

      const button = screen.getByRole('button', { name: /extract/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Please enter a URL');
      });
    });

    it('shows error for invalid URL format', async () => {
      render(<UrlInput />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'not-a-valid-url');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Please enter a valid URL (e.g., example.com)'
        );
      });
    });

    it('rejects non-http/https protocols', async () => {
      render(<UrlInput />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'ftp://files.example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('accepts valid http URL', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'http://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith('http://example.com');
      });
    });

    it('accepts valid https URL', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith('https://example.com');
      });
    });

    it('accepts URLs with paths and query strings', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com/path?query=value');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith('https://example.com/path?query=value');
      });
    });

    it('trims whitespace from URL', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, '  https://example.com  ');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith('https://example.com');
      });
    });
  });

  describe('submission', () => {
    it('submits on button click', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('submits on Enter key press', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com{Enter}');

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith('https://example.com');
      });
    });

    it('calls fetch and navigates when no onSubmit provided', async () => {
      const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ checkpointId: 'test-123' }),
      } as Response);

      render(<UrlInput />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/extract/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://example.com' }),
        });
        expect(mockPush).toHaveBeenCalledWith('/extract/test-123');
      });

      mockFetch.mockRestore();
    });

    it('displays error when fetch fails', async () => {
      const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      } as Response);

      render(<UrlInput />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Server error');
      });

      mockFetch.mockRestore();
    });
  });

  describe('loading state', () => {
    it('shows loading spinner during submission', async () => {
      const mockSubmit = vi.fn().mockImplementation(() => new Promise(() => {}));
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(screen.getByLabelText('Loading')).toBeInTheDocument();
      });
    });

    it('disables input during loading', async () => {
      const mockSubmit = vi.fn().mockImplementation(() => new Promise(() => {}));
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });

    it('disables button during loading', async () => {
      const mockSubmit = vi.fn().mockImplementation(() => new Promise(() => {}));
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      const button = screen.getByRole('button', { name: /extract/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('re-enables form after submission completes', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(input).not.toBeDisabled();
        expect(screen.getByRole('button', { name: /extract/i })).not.toBeDisabled();
      });
    });

    it('re-enables form after submission error', async () => {
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Failed'));
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(input).not.toBeDisabled();
        expect(screen.getByRole('button', { name: /extract/i })).not.toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('displays error from onSubmit callback', async () => {
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Network error');
      });
    });

    it('displays generic error for non-Error exceptions', async () => {
      const mockSubmit = vi.fn().mockRejectedValue('string error');
      render(<UrlInput onSubmit={mockSubmit} />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('An error occurred');
      });
    });

    it('clears error when user types', async () => {
      render(<UrlInput />);

      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const input = screen.getByRole('textbox', { name: /website url/i });
      await userEvent.type(input, 'h');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct default accessibility attributes', () => {
      render(<UrlInput />);

      const input = screen.getByRole('textbox', { name: /website url/i });
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('sets aria-invalid when error exists', async () => {
      render(<UrlInput />);

      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        const input = screen.getByRole('textbox', { name: /website url/i });
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('links input to error message via aria-describedby', async () => {
      render(<UrlInput />);

      await userEvent.click(screen.getByRole('button', { name: /extract/i }));

      await waitFor(() => {
        const input = screen.getByRole('textbox', { name: /website url/i });
        expect(input).toHaveAttribute('aria-describedby', 'url-error');

        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveAttribute('id', 'url-error');
      });
    });
  });
});
