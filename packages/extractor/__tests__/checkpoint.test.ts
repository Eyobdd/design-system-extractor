import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { CheckpointStore } from '../src/checkpoint/store';
import type { ExtractionCheckpoint } from '../src/checkpoint/types';

describe('CheckpointStore', () => {
  let tempDir: string;
  let store: CheckpointStore;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'checkpoint-test-'));
    store = new CheckpointStore(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const createTestCheckpoint = (
    id: string,
    overrides: Partial<ExtractionCheckpoint> = {}
  ): ExtractionCheckpoint => ({
    id,
    url: 'https://example.com',
    status: 'pending',
    progress: 0,
    startedAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  });

  describe('save and load', () => {
    it('saves and loads a basic checkpoint', async () => {
      const checkpoint = createTestCheckpoint('test-1');

      await store.save(checkpoint);
      const loaded = await store.load('test-1');

      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe('test-1');
      expect(loaded!.url).toBe('https://example.com');
      expect(loaded!.status).toBe('pending');
      expect(loaded!.progress).toBe(0);
    });

    it('saves and loads checkpoint with screenshots', async () => {
      const viewportBuffer = Buffer.from('viewport-png-data');
      const fullPageBuffer = Buffer.from('fullpage-png-data');

      const checkpoint = createTestCheckpoint('test-2', {
        status: 'screenshot',
        progress: 25,
        screenshots: {
          viewport: viewportBuffer,
          fullPage: fullPageBuffer,
        },
      });

      await store.save(checkpoint);
      const loaded = await store.load('test-2');

      expect(loaded).not.toBeNull();
      expect(loaded!.screenshots).toBeDefined();
      expect(loaded!.screenshots!.viewport.toString()).toBe('viewport-png-data');
      expect(loaded!.screenshots!.fullPage.toString()).toBe('fullpage-png-data');
    });

    it('saves and loads checkpoint with identified components', async () => {
      const checkpoint = createTestCheckpoint('test-3', {
        status: 'vision',
        progress: 50,
        identifiedComponents: [
          {
            type: 'button',
            name: 'Primary Button',
            boundingBox: { x: 100, y: 200, width: 120, height: 40 },
            confidence: 0.95,
          },
          {
            type: 'card',
            name: 'Product Card',
            boundingBox: { x: 300, y: 100, width: 280, height: 350 },
            confidence: 0.88,
          },
        ],
      });

      await store.save(checkpoint);
      const loaded = await store.load('test-3');

      expect(loaded).not.toBeNull();
      expect(loaded!.identifiedComponents).toHaveLength(2);
      expect(loaded!.identifiedComponents![0].type).toBe('button');
      expect(loaded!.identifiedComponents![1].confidence).toBe(0.88);
    });

    it('saves and loads checkpoint with extracted tokens', async () => {
      const checkpoint = createTestCheckpoint('test-4', {
        status: 'extraction',
        progress: 75,
        extractedTokens: {
          colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
          },
          typography: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
          },
        },
      });

      await store.save(checkpoint);
      const loaded = await store.load('test-4');

      expect(loaded).not.toBeNull();
      expect(loaded!.extractedTokens).toBeDefined();
      expect((loaded!.extractedTokens as Record<string, unknown>).colors).toEqual({
        primary: '#3b82f6',
        secondary: '#64748b',
      });
    });

    it('saves and loads checkpoint with error', async () => {
      const checkpoint = createTestCheckpoint('test-5', {
        status: 'failed',
        progress: 25,
        error: 'Network timeout while capturing screenshot',
      });

      await store.save(checkpoint);
      const loaded = await store.load('test-5');

      expect(loaded).not.toBeNull();
      expect(loaded!.status).toBe('failed');
      expect(loaded!.error).toBe('Network timeout while capturing screenshot');
    });

    it('returns null for non-existent checkpoint', async () => {
      const loaded = await store.load('non-existent');
      expect(loaded).toBeNull();
    });
  });

  describe('update', () => {
    it('updates checkpoint status and progress', async () => {
      const checkpoint = createTestCheckpoint('test-update');
      await store.save(checkpoint);

      await store.update('test-update', {
        status: 'screenshot',
        progress: 25,
      });

      const loaded = await store.load('test-update');
      expect(loaded!.status).toBe('screenshot');
      expect(loaded!.progress).toBe(25);
      expect(loaded!.updatedAt.getTime()).toBeGreaterThan(checkpoint.updatedAt.getTime());
    });

    it('throws error when updating non-existent checkpoint', async () => {
      await expect(store.update('non-existent', { status: 'complete' })).rejects.toThrow(
        'Checkpoint non-existent not found'
      );
    });
  });

  describe('list', () => {
    it('lists all checkpoints', async () => {
      await store.save(createTestCheckpoint('checkpoint-a'));
      await store.save(createTestCheckpoint('checkpoint-b'));
      await store.save(createTestCheckpoint('checkpoint-c'));

      const ids = await store.list();

      expect(ids).toHaveLength(3);
      expect(ids).toContain('checkpoint-a');
      expect(ids).toContain('checkpoint-b');
      expect(ids).toContain('checkpoint-c');
    });

    it('returns empty array when no checkpoints exist', async () => {
      const ids = await store.list();
      expect(ids).toEqual([]);
    });
  });

  describe('delete', () => {
    it('deletes a checkpoint', async () => {
      await store.save(createTestCheckpoint('to-delete'));

      let loaded = await store.load('to-delete');
      expect(loaded).not.toBeNull();

      await store.delete('to-delete');

      loaded = await store.load('to-delete');
      expect(loaded).toBeNull();
    });

    it('does not throw when deleting non-existent checkpoint', async () => {
      await expect(store.delete('non-existent')).resolves.not.toThrow();
    });
  });
});
