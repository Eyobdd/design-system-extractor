import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock puppeteer
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-1234'),
}));

import { Extractor, createExtractor } from './extractor';
import { CheckpointStore } from '../checkpoint/store';
import type { ExtractorEvent } from './types';

describe('Extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createExtractor helper', () => {
    it('creates extractor instance', () => {
      const extractor = createExtractor({ url: 'https://example.com' });
      expect(extractor).toBeInstanceOf(Extractor);
    });
  });

  describe('event handling', () => {
    it('emits start and complete events during run', async () => {
      const extractor = new Extractor({
        url: 'https://example.com',
        dryRun: true,
      });
      const handler = vi.fn();

      extractor.on(handler);
      await extractor.run();

      const eventTypes = handler.mock.calls.map(call => call[0].type);
      expect(eventTypes).toContain('start');
      expect(eventTypes).toContain('complete');
    });

    it('passes checkpoint data to event handlers', async () => {
      const extractor = new Extractor({
        url: 'https://example.com',
        dryRun: true,
      });
      const events: ExtractorEvent[] = [];

      extractor.on(event => events.push(event));
      await extractor.run();

      const startEvent = events.find(e => e.type === 'start');
      expect(startEvent?.checkpoint.url).toBe('https://example.com');
      expect(startEvent?.checkpoint.status).toBe('pending');
    });
  });

  describe('dry run mode', () => {
    it('skips all extraction steps and completes successfully', async () => {
      const extractor = new Extractor({
        url: 'https://example.com',
        dryRun: true,
      });

      const result = await extractor.run();

      expect(result.dryRun).toBe(true);
      expect(result.checkpoint.status).toBe('complete');
      expect(result.checkpoint.url).toBe('https://example.com');
      expect(result.duration).toBeGreaterThanOrEqual(0);

      // All steps should be skipped in dry run
      expect(result.steps).toHaveLength(3);
      for (const step of result.steps) {
        expect(step.status).toBe('skipped');
      }
    });
  });

  describe('skip options', () => {
    it('skips vision when skipVision is true', async () => {
      const extractor = new Extractor({
        url: 'https://example.com',
        dryRun: true,
        skipVision: true,
      });

      const result = await extractor.run();

      const visionStep = result.steps.find(s => s.name === 'vision');
      expect(visionStep?.status).toBe('skipped');
    });

    it('skips DOM extraction when skipDomExtraction is true', async () => {
      const extractor = new Extractor({
        url: 'https://example.com',
        dryRun: true,
        skipDomExtraction: true,
      });

      const result = await extractor.run();

      const domStep = result.steps.find(s => s.name === 'extraction');
      expect(domStep?.status).toBe('skipped');
    });
  });

  describe('checkpoint store', () => {
    it('returns a functional CheckpointStore instance', () => {
      const extractor = new Extractor({ url: 'https://example.com' });
      const store = extractor.getCheckpointStore();

      expect(store).toBeInstanceOf(CheckpointStore);
    });
  });
});
