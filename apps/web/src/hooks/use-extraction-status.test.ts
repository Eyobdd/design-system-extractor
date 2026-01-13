import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useExtractionStatus } from './use-extraction-status';
import type { ExtractionStatus } from './use-extraction-status';

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

function mockFetchSuccess(data: ExtractionStatus): void {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
}

function mockFetchError(error: string): void {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ error }),
  } as Response);
}

describe('useExtractionStatus', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('returns null data when no checkpointId', () => {
      const { result } = renderHook(() => useExtractionStatus(null));

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('does not fetch when checkpointId is null', () => {
      renderHook(() => useExtractionStatus(null));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not fetch when enabled is false', () => {
      renderHook(() => useExtractionStatus('ext_123', { enabled: false }));
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Fetching Status', () => {
    it('fetches status when checkpointId is provided', async () => {
      const mockData = createMockStatus({ status: 'screenshot', progress: 30 });
      mockFetchSuccess(mockData);

      const { result } = renderHook(() => useExtractionStatus('ext_123'));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/extract/status/ext_123');
    });

    it('sets isLoading true during fetch', async () => {
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      vi.mocked(global.fetch).mockReturnValueOnce(fetchPromise as Promise<Response>);

      const { result } = renderHook(() => useExtractionStatus('ext_123'));

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve(createMockStatus({ status: 'complete', progress: 100 })),
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('clears error on successful fetch after error', async () => {
      mockFetchError('First error');

      const { result } = renderHook(() =>
        useExtractionStatus('ext_123', { enabled: true, pollingInterval: 50 })
      );

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockStatus({ status: 'complete' })),
      } as Response);

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('sets error from API response', async () => {
      mockFetchError('Not found');

      const { result } = renderHook(() => useExtractionStatus('ext_123'));

      await waitFor(() => {
        expect(result.current.error).toBe('Not found');
      });
    });

    it('uses default error message when API returns no error field', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      const { result } = renderHook(() => useExtractionStatus('ext_123'));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch status');
      });
    });

    it('handles network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useExtractionStatus('ext_123'));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });

    it('handles non-Error exceptions', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce('string error');

      const { result } = renderHook(() => useExtractionStatus('ext_123'));

      await waitFor(() => {
        expect(result.current.error).toBe('An error occurred');
      });
    });
  });

  describe('Polling Behavior', () => {
    it('stops polling when status is complete', async () => {
      mockFetchSuccess(createMockStatus({ status: 'complete', progress: 100 }));

      const { result } = renderHook(() => useExtractionStatus('ext_123', { pollingInterval: 100 }));

      await waitFor(() => {
        expect(result.current.data?.status).toBe('complete');
      });

      const callCount = vi.mocked(global.fetch).mock.calls.length;

      await new Promise(resolve => setTimeout(resolve, 250));

      expect(global.fetch).toHaveBeenCalledTimes(callCount);
    });

    it('stops polling when status is failed', async () => {
      mockFetchSuccess(createMockStatus({ status: 'failed', error: 'Failed' }));

      const { result } = renderHook(() => useExtractionStatus('ext_123', { pollingInterval: 100 }));

      await waitFor(() => {
        expect(result.current.data?.status).toBe('failed');
      });

      const callCount = vi.mocked(global.fetch).mock.calls.length;

      await new Promise(resolve => setTimeout(resolve, 250));

      expect(global.fetch).toHaveBeenCalledTimes(callCount);
    });

    it('continues polling for in-progress status', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockStatus({ status: 'screenshot', progress: 30 })),
      } as Response);

      renderHook(() => useExtractionStatus('ext_123', { pollingInterval: 50 }));

      await waitFor(
        () => {
          expect(vi.mocked(global.fetch).mock.calls.length).toBeGreaterThanOrEqual(2);
        },
        { timeout: 500 }
      );
    });
  });

  describe('Refetch Function', () => {
    it('provides refetch function that triggers new fetch', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createMockStatus({ status: 'complete', progress: 100 })),
      } as Response);

      const { result } = renderHook(() => useExtractionStatus('ext_123'));

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const callCountBefore = vi.mocked(global.fetch).mock.calls.length;

      await act(async () => {
        await result.current.refetch();
      });

      expect(global.fetch).toHaveBeenCalledTimes(callCountBefore + 1);
    });

    it('refetch does nothing when checkpointId is null', async () => {
      const { result } = renderHook(() => useExtractionStatus(null));

      await act(async () => {
        await result.current.refetch();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
