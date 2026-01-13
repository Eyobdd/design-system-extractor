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

import { POST, GET } from './route';

function createRequest(method: string, body?: unknown, searchParams?: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/feedback');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  if (body) {
    return new NextRequest(url, {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new NextRequest(url, { method });
}

const mockCheckpoint = {
  id: 'ext_123',
  url: 'https://example.com',
  status: 'complete' as const,
  progress: 100,
  startedAt: new Date(),
  updatedAt: new Date(),
};

describe('Feedback API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/feedback', () => {
    it('requires checkpointId', async () => {
      const request = createRequest('POST', {
        componentId: 'button',
        feedback: 'approve',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('checkpointId is required');
    });

    it('requires componentId', async () => {
      const request = createRequest('POST', {
        checkpointId: 'ext_123',
        feedback: 'approve',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('componentId is required');
    });

    it('requires valid feedback value', async () => {
      const request = createRequest('POST', {
        checkpointId: 'ext_123',
        componentId: 'button',
        feedback: 'invalid',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('feedback must be "approve" or "reject"');
    });

    it('returns 404 if checkpoint not found', async () => {
      mockLoad.mockResolvedValue(null);

      const request = createRequest('POST', {
        checkpointId: 'ext_notfound',
        componentId: 'button',
        feedback: 'approve',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Checkpoint not found');
    });

    it('saves feedback successfully', async () => {
      mockLoad.mockResolvedValue(mockCheckpoint);

      const request = createRequest('POST', {
        checkpointId: 'ext_123',
        componentId: 'button-primary',
        feedback: 'approve',
        comment: 'Looks good!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.feedback.componentId).toBe('button-primary');
      expect(data.feedback.feedback).toBe('approve');
      expect(data.feedback.comment).toBe('Looks good!');
      expect(data.feedback.timestamp).toBeDefined();
    });

    it('accepts reject feedback', async () => {
      mockLoad.mockResolvedValue(mockCheckpoint);

      const request = createRequest('POST', {
        checkpointId: 'ext_123',
        componentId: 'card-header',
        feedback: 'reject',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.feedback.feedback).toBe('reject');
    });

    it('saves feedback without optional comment', async () => {
      mockLoad.mockResolvedValue(mockCheckpoint);

      const request = createRequest('POST', {
        checkpointId: 'ext_123',
        componentId: 'button',
        feedback: 'approve',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.feedback.comment).toBeUndefined();
    });

    it('returns valid ISO timestamp', async () => {
      mockLoad.mockResolvedValue(mockCheckpoint);

      const request = createRequest('POST', {
        checkpointId: 'ext_123',
        componentId: 'button',
        feedback: 'approve',
      });

      const response = await POST(request);
      const data = await response.json();

      const timestamp = new Date(data.feedback.timestamp);
      expect(timestamp.toISOString()).toBe(data.feedback.timestamp);
    });

    it('returns 500 on malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        body: 'not valid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save feedback');
    });
  });

  describe('GET /api/feedback', () => {
    it('requires checkpointId', async () => {
      const request = createRequest('GET');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('checkpointId is required');
    });

    it('returns 404 if checkpoint not found', async () => {
      mockLoad.mockResolvedValue(null);

      const request = createRequest('GET', undefined, { checkpointId: 'ext_notfound' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Checkpoint not found');
    });

    it('returns empty feedback array for new checkpoint', async () => {
      mockLoad.mockResolvedValue(mockCheckpoint);

      const request = createRequest('GET', undefined, { checkpointId: 'ext_new' });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.checkpointId).toBe('ext_new');
      expect(data.feedback).toEqual([]);
    });

    it('returns saved feedback', async () => {
      mockLoad.mockResolvedValue(mockCheckpoint);

      const postRequest = createRequest('POST', {
        checkpointId: 'ext_feedback_test',
        componentId: 'button',
        feedback: 'approve',
      });
      await POST(postRequest);

      const getRequest = createRequest('GET', undefined, { checkpointId: 'ext_feedback_test' });
      const response = await GET(getRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.feedback).toHaveLength(1);
      expect(data.feedback[0].componentId).toBe('button');
    });
  });

  describe('Feedback Update Behavior', () => {
    it('replaces existing feedback for same component', async () => {
      mockLoad.mockResolvedValue(mockCheckpoint);

      const firstRequest = createRequest('POST', {
        checkpointId: 'ext_update_test',
        componentId: 'button',
        feedback: 'approve',
      });
      await POST(firstRequest);

      const secondRequest = createRequest('POST', {
        checkpointId: 'ext_update_test',
        componentId: 'button',
        feedback: 'reject',
        comment: 'Changed my mind',
      });
      await POST(secondRequest);

      const getRequest = createRequest('GET', undefined, { checkpointId: 'ext_update_test' });
      const response = await GET(getRequest);
      const data = await response.json();

      expect(data.feedback).toHaveLength(1);
      expect(data.feedback[0].feedback).toBe('reject');
      expect(data.feedback[0].comment).toBe('Changed my mind');
    });

    it('stores separate feedback for different components', async () => {
      mockLoad.mockResolvedValue(mockCheckpoint);

      const buttonRequest = createRequest('POST', {
        checkpointId: 'ext_multi_component',
        componentId: 'button',
        feedback: 'approve',
      });
      await POST(buttonRequest);

      const cardRequest = createRequest('POST', {
        checkpointId: 'ext_multi_component',
        componentId: 'card',
        feedback: 'reject',
      });
      await POST(cardRequest);

      const getRequest = createRequest('GET', undefined, { checkpointId: 'ext_multi_component' });
      const response = await GET(getRequest);
      const data = await response.json();

      expect(data.feedback).toHaveLength(2);
      const buttonFeedback = data.feedback.find(
        (f: { componentId: string }) => f.componentId === 'button'
      );
      const cardFeedback = data.feedback.find(
        (f: { componentId: string }) => f.componentId === 'card'
      );
      expect(buttonFeedback.feedback).toBe('approve');
      expect(cardFeedback.feedback).toBe('reject');
    });
  });
});
