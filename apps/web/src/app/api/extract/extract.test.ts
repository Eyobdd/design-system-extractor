import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { ExtractionCheckpoint } from '@extracted/extractor';

const mockSave = vi.fn().mockResolvedValue(undefined);
const mockLoad = vi.fn();
const mockUpdate = vi.fn().mockResolvedValue(undefined);

const mockExtractorRun = vi.fn();
const mockExtractorOn = vi.fn();

vi.mock('@extracted/extractor', () => ({
  CheckpointStore: vi.fn().mockImplementation(() => ({
    save: mockSave,
    load: mockLoad,
    update: mockUpdate,
  })),
  createExtractor: vi.fn().mockImplementation(() => ({
    run: mockExtractorRun,
    on: mockExtractorOn,
  })),
}));

function createMockCheckpoint(overrides: Partial<ExtractionCheckpoint> = {}): ExtractionCheckpoint {
  return {
    id: 'ext_123',
    url: 'https://example.com',
    status: 'pending',
    progress: 0,
    startedAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:01:00Z'),
    ...overrides,
  };
}

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/extract/start', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function createStatusRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/extract/status/${id}`);
}

describe('Extract API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('Helper Functions (utils.ts)', () => {
    describe('generateCheckpointId', () => {
      it('generates ID with ext_ prefix', async () => {
        const { generateCheckpointId } = await import('./utils');

        const id = generateCheckpointId();

        expect(id).toMatch(/^ext_/);
      });

      it('generates unique IDs', async () => {
        const { generateCheckpointId } = await import('./utils');

        const id1 = generateCheckpointId();
        const id2 = generateCheckpointId();

        expect(id1).not.toBe(id2);
      });

      it('includes timestamp component', async () => {
        const { generateCheckpointId } = await import('./utils');

        const before = Date.now();
        const id = generateCheckpointId();
        const after = Date.now();

        const parts = id.split('_');
        const timestamp = parseInt(parts[1] ?? '0', 10);

        expect(timestamp).toBeGreaterThanOrEqual(before);
        expect(timestamp).toBeLessThanOrEqual(after);
      });
    });

    describe('isValidUrl', () => {
      it('returns true for valid http URL', async () => {
        const { isValidUrl } = await import('./utils');

        expect(isValidUrl('http://example.com')).toBe(true);
      });

      it('returns true for valid https URL', async () => {
        const { isValidUrl } = await import('./utils');

        expect(isValidUrl('https://example.com')).toBe(true);
      });

      it('returns true for URL with path and query', async () => {
        const { isValidUrl } = await import('./utils');

        expect(isValidUrl('https://example.com/path?query=value')).toBe(true);
      });

      it('returns false for ftp URL', async () => {
        const { isValidUrl } = await import('./utils');

        expect(isValidUrl('ftp://files.example.com')).toBe(false);
      });

      it('returns false for invalid URL', async () => {
        const { isValidUrl } = await import('./utils');

        expect(isValidUrl('not-a-url')).toBe(false);
      });

      it('returns false for empty string', async () => {
        const { isValidUrl } = await import('./utils');

        expect(isValidUrl('')).toBe(false);
      });

      it('returns false for javascript protocol', async () => {
        const { isValidUrl } = await import('./utils');

        expect(isValidUrl('javascript:alert(1)')).toBe(false);
      });
    });
  });

  describe('POST /api/extract/start', () => {
    it('returns 400 when URL is missing', async () => {
      const { POST } = await import('./start/route');

      const response = await POST(createPostRequest({}));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('returns 400 when URL is null', async () => {
      const { POST } = await import('./start/route');

      const response = await POST(createPostRequest({ url: null }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('returns 400 when URL is not a string', async () => {
      const { POST } = await import('./start/route');

      const response = await POST(createPostRequest({ url: 12345 }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('returns 400 for invalid URL format', async () => {
      const { POST } = await import('./start/route');

      const response = await POST(createPostRequest({ url: 'not-a-url' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid URL format');
    });

    it('returns 400 for non-http URL', async () => {
      const { POST } = await import('./start/route');

      const response = await POST(createPostRequest({ url: 'ftp://example.com' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid URL format');
    });

    it('accepts valid http URL and returns checkpoint ID', async () => {
      const { POST } = await import('./start/route');

      const response = await POST(createPostRequest({ url: 'http://example.com' }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checkpointId).toBeDefined();
      expect(data.checkpointId).toMatch(/^ext_/);
      expect(data.status).toBe('pending');
      expect(data.message).toBe('Extraction started');
    });

    it('accepts valid https URL', async () => {
      const { POST } = await import('./start/route');

      const response = await POST(createPostRequest({ url: 'https://example.com' }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checkpointId).toBeDefined();
    });

    it('trims whitespace from URL', async () => {
      const { POST } = await import('./start/route');

      const response = await POST(createPostRequest({ url: '  https://example.com  ' }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checkpointId).toBeDefined();
    });

    it('saves checkpoint to store', async () => {
      const { POST } = await import('./start/route');

      await POST(createPostRequest({ url: 'https://example.com' }));

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com',
          status: 'pending',
          progress: 0,
        })
      );
    });

    it('returns 500 for malformed JSON body', async () => {
      const { POST } = await import('./start/route');

      const request = new NextRequest('http://localhost/api/extract/start', {
        method: 'POST',
        body: 'not valid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to start extraction');
    });
  });

  describe('GET /api/extract/status/[id]', () => {
    it('returns 404 for non-existent checkpoint', async () => {
      mockLoad.mockResolvedValueOnce(null);

      const { GET } = await import('./status/[id]/route');

      const response = await GET(createStatusRequest('nonexistent'), {
        params: Promise.resolve({ id: 'nonexistent' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Checkpoint not found');
    });

    it('returns checkpoint data when found', async () => {
      const mockCheckpoint = createMockCheckpoint({
        status: 'screenshot',
        progress: 30,
      });
      mockLoad.mockResolvedValueOnce(mockCheckpoint);

      const { GET } = await import('./status/[id]/route');

      const response = await GET(createStatusRequest('ext_123'), {
        params: Promise.resolve({ id: 'ext_123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('ext_123');
      expect(data.url).toBe('https://example.com');
      expect(data.status).toBe('screenshot');
      expect(data.progress).toBe(30);
    });

    it('serializes dates to ISO format', async () => {
      const mockCheckpoint = createMockCheckpoint();
      mockLoad.mockResolvedValueOnce(mockCheckpoint);

      const { GET } = await import('./status/[id]/route');

      const response = await GET(createStatusRequest('ext_123'), {
        params: Promise.resolve({ id: 'ext_123' }),
      });
      const data = await response.json();

      expect(data.startedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(data.updatedAt).toBe('2024-01-01T00:01:00.000Z');
    });

    it('includes extracted tokens when complete', async () => {
      const mockCheckpoint = createMockCheckpoint({
        status: 'complete',
        progress: 100,
        extractedTokens: { colors: { primary: '#3b82f6' } },
      });
      mockLoad.mockResolvedValueOnce(mockCheckpoint);

      const { GET } = await import('./status/[id]/route');

      const response = await GET(createStatusRequest('ext_123'), {
        params: Promise.resolve({ id: 'ext_123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.extractedTokens).toEqual({ colors: { primary: '#3b82f6' } });
    });

    it('includes error when failed', async () => {
      const mockCheckpoint = createMockCheckpoint({
        status: 'failed',
        progress: 50,
        error: 'Screenshot capture failed',
      });
      mockLoad.mockResolvedValueOnce(mockCheckpoint);

      const { GET } = await import('./status/[id]/route');

      const response = await GET(createStatusRequest('ext_123'), {
        params: Promise.resolve({ id: 'ext_123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('failed');
      expect(data.error).toBe('Screenshot capture failed');
    });

    it('includes hasScreenshots flag', async () => {
      const mockCheckpoint = createMockCheckpoint({
        screenshots: { viewport: Buffer.from('test'), fullPage: Buffer.from('test') },
      });
      mockLoad.mockResolvedValueOnce(mockCheckpoint);

      const { GET } = await import('./status/[id]/route');

      const response = await GET(createStatusRequest('ext_123'), {
        params: Promise.resolve({ id: 'ext_123' }),
      });
      const data = await response.json();

      expect(data.hasScreenshots).toBe(true);
    });

    it('maps comparison results correctly', async () => {
      const mockCheckpoint = createMockCheckpoint({
        comparisons: [
          {
            componentId: 'button',
            originalScreenshot: Buffer.from('original'),
            generatedScreenshot: Buffer.from('generated'),
            ssimScore: 0.95,
            colorScore: 0.92,
            combinedScore: 0.94,
            passed: true,
          },
        ],
      });
      mockLoad.mockResolvedValueOnce(mockCheckpoint);

      const { GET } = await import('./status/[id]/route');

      const response = await GET(createStatusRequest('ext_123'), {
        params: Promise.resolve({ id: 'ext_123' }),
      });
      const data = await response.json();

      expect(data.comparisons).toHaveLength(1);
      expect(data.comparisons[0]).toEqual({
        componentId: 'button',
        ssimScore: 0.95,
        colorScore: 0.92,
        combinedScore: 0.94,
        passed: true,
      });
    });

    it('returns 500 when store throws', async () => {
      mockLoad.mockRejectedValueOnce(new Error('Database error'));

      const { GET } = await import('./status/[id]/route');

      const response = await GET(createStatusRequest('ext_123'), {
        params: Promise.resolve({ id: 'ext_123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get checkpoint status');
    });
  });

  describe('Extraction Logic (extraction.ts)', () => {
    describe('getCheckpointStore', () => {
      it('returns a CheckpointStore instance', async () => {
        const { getCheckpointStore, setCheckpointStore } = await import('./extraction');
        setCheckpointStore(
          null as unknown as InstanceType<typeof import('@extracted/extractor').CheckpointStore>
        );

        const store = getCheckpointStore();

        expect(store).toBeDefined();
        expect(typeof store.load).toBe('function');
        expect(typeof store.save).toBe('function');
      });

      it('returns the same instance on subsequent calls (singleton)', async () => {
        const { getCheckpointStore, setCheckpointStore } = await import('./extraction');
        setCheckpointStore(
          null as unknown as InstanceType<typeof import('@extracted/extractor').CheckpointStore>
        );

        const store1 = getCheckpointStore();
        const store2 = getCheckpointStore();

        expect(store1).toBe(store2);
      });
    });

    describe('setCheckpointStore', () => {
      it('allows setting a custom store instance', async () => {
        const { getCheckpointStore, setCheckpointStore } = await import('./extraction');

        const customStore = {
          load: vi.fn(),
          save: vi.fn(),
          update: vi.fn(),
          list: vi.fn(),
          delete: vi.fn(),
        } as unknown as InstanceType<typeof import('@extracted/extractor').CheckpointStore>;

        setCheckpointStore(customStore);
        const result = getCheckpointStore();

        expect(result).toBe(customStore);
      });
    });

    describe('startExtractionAsync', () => {
      it('calls extractor run and updates checkpoint on success', async () => {
        mockExtractorRun.mockResolvedValue({
          checkpoint: {
            id: 'extractor_checkpoint',
            status: 'complete',
            progress: 100,
            extractedTokens: { colors: {} },
          },
        });

        const { startExtractionAsync } = await import('./extraction');
        const mockStore = {
          update: vi.fn().mockResolvedValue(undefined),
        };

        await startExtractionAsync(
          'ext_123',
          'https://example.com',
          mockStore as unknown as InstanceType<
            typeof import('@extracted/extractor').CheckpointStore
          >
        );

        // The extractor should have been run
        expect(mockExtractorRun).toHaveBeenCalled();
        // Checkpoint should be updated with results
        expect(mockStore.update).toHaveBeenCalled();
      });

      it('sets failed status on error', async () => {
        mockExtractorRun.mockRejectedValue(new Error('Extraction failed'));

        const { startExtractionAsync } = await import('./extraction');
        const mockStore = {
          update: vi.fn().mockResolvedValue(undefined),
        };

        await startExtractionAsync(
          'ext_123',
          'https://example.com',
          mockStore as unknown as InstanceType<
            typeof import('@extracted/extractor').CheckpointStore
          >
        );

        expect(mockStore.update).toHaveBeenLastCalledWith('ext_123', {
          status: 'failed',
          error: 'Extraction failed',
        });
      });

      it('handles non-Error exceptions', async () => {
        mockExtractorRun.mockRejectedValue('string error');

        const { startExtractionAsync } = await import('./extraction');
        const mockStore = {
          update: vi.fn().mockResolvedValue(undefined),
        };

        await startExtractionAsync(
          'ext_123',
          'https://example.com',
          mockStore as unknown as InstanceType<
            typeof import('@extracted/extractor').CheckpointStore
          >
        );

        expect(mockStore.update).toHaveBeenLastCalledWith('ext_123', {
          status: 'failed',
          error: 'Unknown error',
        });
      });
    });
  });
});
