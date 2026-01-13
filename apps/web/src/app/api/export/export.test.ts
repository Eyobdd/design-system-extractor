import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockLoad = vi.fn();

vi.mock('../extract/extraction', () => ({
  getCheckpointStore: vi.fn(() => ({
    load: mockLoad,
    save: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
    delete: vi.fn(),
  })),
}));

import { GET, POST } from './route';

function createGetRequest(searchParams?: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/export');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return new NextRequest(url, { method: 'GET' });
}

function createPostRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/export', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const mockCompleteCheckpoint = {
  id: 'ext_123',
  url: 'https://example.com',
  status: 'complete' as const,
  progress: 100,
  startedAt: new Date(),
  updatedAt: new Date(),
  extractedTokens: {
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: {
        base: '16px',
        lg: '18px',
      },
    },
    spacing: {
      sm: '8px',
      md: '16px',
    },
  },
};

const mockIncompleteCheckpoint = {
  id: 'ext_456',
  url: 'https://example.com',
  status: 'screenshot' as const,
  progress: 30,
  startedAt: new Date(),
  updatedAt: new Date(),
};

describe('Export API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/export', () => {
    it('requires checkpointId', async () => {
      const request = createGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('checkpointId is required');
    });

    it('validates format parameter', async () => {
      const request = createGetRequest({ checkpointId: 'ext_123', format: 'invalid' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('format must be one of: json, css, tailwind, scss');
    });

    it('returns 404 if checkpoint not found', async () => {
      mockLoad.mockResolvedValue(null);

      const request = createGetRequest({ checkpointId: 'ext_notfound' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Checkpoint not found');
    });

    it('returns error if extraction not complete', async () => {
      mockLoad.mockResolvedValue(mockIncompleteCheckpoint);

      const request = createGetRequest({ checkpointId: 'ext_456' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Extraction not complete');
    });

    it('exports as JSON by default', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createGetRequest({ checkpointId: 'ext_123' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Content-Disposition')).toContain('design-tokens.json');

      const content = await response.text();
      const tokens = JSON.parse(content);
      expect(tokens.colors.primary).toBe('#3b82f6');
    });

    it('exports as CSS variables', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createGetRequest({ checkpointId: 'ext_123', format: 'css' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/css');
      expect(response.headers.get('Content-Disposition')).toContain('design-tokens.css');

      const content = await response.text();
      expect(content).toContain(':root {');
      expect(content).toContain('--colors-primary: #3b82f6');
    });

    it('exports as SCSS variables', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createGetRequest({ checkpointId: 'ext_123', format: 'scss' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/x-scss');
      expect(response.headers.get('Content-Disposition')).toContain('design-tokens.scss');

      const content = await response.text();
      expect(content).toContain('$colors-primary: #3b82f6');
    });

    it('exports as Tailwind config', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createGetRequest({ checkpointId: 'ext_123', format: 'tailwind' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/javascript');
      expect(response.headers.get('Content-Disposition')).toContain('tailwind.config.js');

      const content = await response.text();
      expect(content).toContain('module.exports');
      expect(content).toContain('"primary": "#3b82f6"');
    });

    it('returns 500 when store throws', async () => {
      mockLoad.mockRejectedValue(new Error('Database error'));

      const request = createGetRequest({ checkpointId: 'ext_123' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to export tokens');
    });

    it('handles checkpoint with no extractedTokens', async () => {
      mockLoad.mockResolvedValue({
        ...mockCompleteCheckpoint,
        extractedTokens: undefined,
      });

      const request = createGetRequest({ checkpointId: 'ext_123' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const content = await response.text();
      expect(content).toBe('{}');
    });
  });

  describe('POST /api/export', () => {
    it('requires checkpointId', async () => {
      const request = createPostRequest({ format: 'json' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('checkpointId is required');
    });

    it('validates format parameter', async () => {
      const request = createPostRequest({ checkpointId: 'ext_123', format: 'invalid' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('format must be one of: json, css, tailwind, scss');
    });

    it('returns 404 if checkpoint not found', async () => {
      mockLoad.mockResolvedValue(null);

      const request = createPostRequest({ checkpointId: 'ext_notfound' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Checkpoint not found');
    });

    it('returns error if extraction not complete', async () => {
      mockLoad.mockResolvedValue(mockIncompleteCheckpoint);

      const request = createPostRequest({ checkpointId: 'ext_456' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Extraction not complete');
    });

    it('returns JSON content in response body', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createPostRequest({ checkpointId: 'ext_123', format: 'json' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.format).toBe('json');
      expect(data.checkpointId).toBe('ext_123');
      expect(JSON.parse(data.content).colors.primary).toBe('#3b82f6');
    });

    it('returns CSS content in response body', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createPostRequest({ checkpointId: 'ext_123', format: 'css' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.format).toBe('css');
      expect(data.content).toContain('--colors-primary: #3b82f6');
    });

    it('defaults to JSON format', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createPostRequest({ checkpointId: 'ext_123' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.format).toBe('json');
    });

    it('returns SCSS content in response body', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createPostRequest({ checkpointId: 'ext_123', format: 'scss' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.format).toBe('scss');
      expect(data.content).toContain('$colors-primary: #3b82f6');
    });

    it('returns Tailwind content in response body', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createPostRequest({ checkpointId: 'ext_123', format: 'tailwind' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.format).toBe('tailwind');
      expect(data.content).toContain('module.exports');
      expect(data.content).toContain('"primary": "#3b82f6"');
    });

    it('returns 500 when store throws', async () => {
      mockLoad.mockRejectedValue(new Error('Database error'));

      const request = createPostRequest({ checkpointId: 'ext_123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to export tokens');
    });

    it('returns 500 on malformed JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: 'not valid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to export tokens');
    });
  });

  describe('Format Output', () => {
    it('generates nested CSS variables correctly', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createGetRequest({ checkpointId: 'ext_123', format: 'css' });
      const response = await GET(request);
      const content = await response.text();

      expect(content).toContain('--typography-fontFamily: Inter, sans-serif');
      expect(content).toContain('--typography-fontSize-base: 16px');
      expect(content).toContain('--spacing-sm: 8px');
    });

    it('generates nested SCSS variables correctly', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createGetRequest({ checkpointId: 'ext_123', format: 'scss' });
      const response = await GET(request);
      const content = await response.text();

      expect(content).toContain('$typography-fontFamily: Inter, sans-serif');
      expect(content).toContain('$typography-fontSize-base: 16px');
      expect(content).toContain('$spacing-sm: 8px');
    });

    it('generates Tailwind config with colors and spacing', async () => {
      mockLoad.mockResolvedValue(mockCompleteCheckpoint);

      const request = createGetRequest({ checkpointId: 'ext_123', format: 'tailwind' });
      const response = await GET(request);
      const content = await response.text();

      expect(content).toContain('"colors"');
      expect(content).toContain('"spacing"');
      expect(content).toContain('"fontFamily"');
      expect(content).toContain('"fontSize"');
    });

    it('generates Tailwind config with only colors when no other tokens', async () => {
      mockLoad.mockResolvedValue({
        ...mockCompleteCheckpoint,
        extractedTokens: { colors: { primary: '#ff0000' } },
      });

      const request = createGetRequest({ checkpointId: 'ext_123', format: 'tailwind' });
      const response = await GET(request);
      const content = await response.text();

      expect(content).toContain('"colors"');
      expect(content).not.toContain('"spacing"');
      expect(content).not.toContain('"fontFamily"');
    });

    it('generates Tailwind config with typography without fontFamily', async () => {
      mockLoad.mockResolvedValue({
        ...mockCompleteCheckpoint,
        extractedTokens: {
          typography: { fontSize: { base: '16px' } },
        },
      });

      const request = createGetRequest({ checkpointId: 'ext_123', format: 'tailwind' });
      const response = await GET(request);
      const content = await response.text();

      expect(content).toContain('"fontSize"');
      expect(content).not.toContain('"fontFamily"');
    });
  });
});
