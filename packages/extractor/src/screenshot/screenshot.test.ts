import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Browser, Page } from 'puppeteer';

// Mock puppeteer
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

// Mock sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    composite: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('stitched-image')),
  })),
}));

import puppeteer from 'puppeteer';
import { captureScreenshots, captureElementScreenshot } from './capture';
import { captureFullPageStitched, getPageDimensions } from './stitch';
import { CheckpointStore } from '../checkpoint/store';

describe('Screenshot Capture', () => {
  let mockBrowser: Partial<Browser>;
  let mockPage: Partial<Page>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPage = {
      setViewport: vi.fn().mockResolvedValue(undefined),
      goto: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(Buffer.from('test-screenshot')),
      $: vi.fn(),
      evaluate: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(puppeteer.launch).mockResolvedValue(mockBrowser as Browser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('captureScreenshots', () => {
    it('captures viewport and full page screenshots', async () => {
      const result = await captureScreenshots({
        url: 'https://example.com',
        checkpointId: 'test-checkpoint',
      });

      expect(puppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 1440,
        height: 900,
      });
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      expect(mockPage.screenshot).toHaveBeenCalledTimes(2);
      expect(result.viewport).toBeInstanceOf(Buffer);
      expect(result.fullPage).toBeInstanceOf(Buffer);
    });

    it('uses custom viewport dimensions', async () => {
      await captureScreenshots({
        url: 'https://example.com',
        checkpointId: 'test-checkpoint',
        viewportWidth: 1920,
        viewportHeight: 1080,
      });

      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 1920,
        height: 1080,
      });
    });

    it('uses domcontentloaded when waitForNetworkIdle is false', async () => {
      await captureScreenshots({
        url: 'https://example.com',
        checkpointId: 'test-checkpoint',
        waitForNetworkIdle: false,
      });

      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    });

    it('uses custom timeout', async () => {
      await captureScreenshots({
        url: 'https://example.com',
        checkpointId: 'test-checkpoint',
        timeout: 60000,
      });

      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
    });

    it('closes browser after capture', async () => {
      await captureScreenshots({
        url: 'https://example.com',
        checkpointId: 'test-checkpoint',
      });

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('closes browser on error', async () => {
      vi.mocked(mockPage.goto!).mockRejectedValue(new Error('Navigation failed'));

      await expect(
        captureScreenshots({
          url: 'https://example.com',
          checkpointId: 'test-checkpoint',
        })
      ).rejects.toThrow('Navigation failed');

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('updates checkpoint on success when store provided', async () => {
      const mockStore = {
        update: vi.fn().mockResolvedValue(undefined),
      } as unknown as CheckpointStore;

      await captureScreenshots(
        {
          url: 'https://example.com',
          checkpointId: 'test-checkpoint',
        },
        mockStore
      );

      expect(mockStore.update).toHaveBeenCalledWith('test-checkpoint', {
        status: 'screenshot',
        progress: 25,
        screenshots: expect.objectContaining({
          viewport: expect.any(Buffer),
          fullPage: expect.any(Buffer),
        }),
      });
    });

    it('updates checkpoint with error on failure when store provided', async () => {
      vi.mocked(mockPage.goto!).mockRejectedValue(new Error('Network error'));

      const mockStore = {
        update: vi.fn().mockResolvedValue(undefined),
      } as unknown as CheckpointStore;

      await expect(
        captureScreenshots(
          {
            url: 'https://example.com',
            checkpointId: 'test-checkpoint',
          },
          mockStore
        )
      ).rejects.toThrow('Network error');

      expect(mockStore.update).toHaveBeenCalledWith('test-checkpoint', {
        status: 'failed',
        error: 'Network error',
      });
    });
  });

  describe('captureElementScreenshot', () => {
    it('captures screenshot of element by selector', async () => {
      const mockElement = {
        screenshot: vi.fn().mockResolvedValue(Buffer.from('element-screenshot')),
      };
      vi.mocked(mockPage.$!).mockResolvedValue(mockElement as never);

      const result = await captureElementScreenshot(mockPage as Page, '.my-button');

      expect(mockPage.$).toHaveBeenCalledWith('.my-button');
      expect(mockElement.screenshot).toHaveBeenCalledWith({
        type: 'png',
        encoding: 'binary',
      });
      expect(result).toBeInstanceOf(Buffer);
      expect(result?.toString()).toBe('element-screenshot');
    });

    it('returns null when element not found', async () => {
      vi.mocked(mockPage.$!).mockResolvedValue(null);

      const result = await captureElementScreenshot(mockPage as Page, '.non-existent');

      expect(result).toBeNull();
    });

    it('returns null on screenshot error', async () => {
      const mockElement = {
        screenshot: vi.fn().mockRejectedValue(new Error('Screenshot failed')),
      };
      vi.mocked(mockPage.$!).mockResolvedValue(mockElement as never);

      const result = await captureElementScreenshot(mockPage as Page, '.my-button');

      expect(result).toBeNull();
    });
  });
});

describe('Screenshot Stitch', () => {
  let mockPage: Partial<Page>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPage = {
      screenshot: vi.fn().mockResolvedValue(Buffer.from('screenshot-chunk')),
      evaluate: vi.fn(),
    };
  });

  describe('captureFullPageStitched', () => {
    it('captures single screenshot for short pages', async () => {
      vi.mocked(mockPage.evaluate!).mockImplementation((fn: unknown) => {
        if (typeof fn === 'function') {
          const fnStr = fn.toString();
          if (fnStr.includes('viewportHeight')) {
            return Promise.resolve({
              viewportHeight: 900,
              viewportWidth: 1440,
              totalHeight: 800,
              totalWidth: 1440,
            });
          }
          if (fnStr.includes('scrollTo')) {
            return Promise.resolve(undefined);
          }
        }
        return Promise.resolve(undefined);
      });

      const result = await captureFullPageStitched(mockPage as Page);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockPage.screenshot).toHaveBeenCalledTimes(1);
    });

    it('captures multiple screenshots for tall pages', async () => {
      let evaluateCallCount = 0;
      vi.mocked(mockPage.evaluate!).mockImplementation((fn: unknown) => {
        evaluateCallCount++;
        if (typeof fn === 'function') {
          const fnStr = fn.toString();
          if (fnStr.includes('viewportHeight') && evaluateCallCount === 1) {
            return Promise.resolve({
              viewportHeight: 500,
              viewportWidth: 1440,
              totalHeight: 1200,
              totalWidth: 1440,
            });
          }
        }
        return Promise.resolve(undefined);
      });

      const result = await captureFullPageStitched(mockPage as Page);

      expect(result).toBeInstanceOf(Buffer);
      // Should capture 3 screenshots: 0-500, 500-1000, 1000-1200
      expect(mockPage.screenshot).toHaveBeenCalledTimes(3);
    });

    it('respects maxHeight option', async () => {
      vi.mocked(mockPage.evaluate!).mockImplementation((fn: unknown) => {
        if (typeof fn === 'function') {
          const fnStr = fn.toString();
          if (fnStr.includes('viewportHeight')) {
            return Promise.resolve({
              viewportHeight: 500,
              viewportWidth: 1440,
              totalHeight: 50000,
              totalWidth: 1440,
            });
          }
        }
        return Promise.resolve(undefined);
      });

      await captureFullPageStitched(mockPage as Page, { maxHeight: 1000 });

      // With maxHeight 1000 and viewport 500, should capture 2 screenshots
      expect(mockPage.screenshot).toHaveBeenCalledTimes(2);
    });

    it('scrolls back to top after capturing', async () => {
      const scrollCalls: number[] = [];
      vi.mocked(mockPage.evaluate!).mockImplementation((fn: unknown, ...args: unknown[]) => {
        if (typeof fn === 'function') {
          const fnStr = fn.toString();
          if (fnStr.includes('viewportHeight')) {
            return Promise.resolve({
              viewportHeight: 900,
              viewportWidth: 1440,
              totalHeight: 800,
              totalWidth: 1440,
            });
          }
          if (fnStr.includes('scrollTo')) {
            if (args.length > 0) {
              scrollCalls.push(args[0] as number);
            } else {
              scrollCalls.push(0);
            }
          }
        }
        return Promise.resolve(undefined);
      });

      await captureFullPageStitched(mockPage as Page);

      // Last scroll should be back to top (0)
      expect(scrollCalls[scrollCalls.length - 1]).toBe(0);
    });
  });

  describe('getPageDimensions', () => {
    it('returns page dimensions', async () => {
      vi.mocked(mockPage.evaluate!).mockResolvedValue({
        width: 1920,
        height: 3000,
      });

      const result = await getPageDimensions(mockPage as Page);

      expect(result).toEqual({
        width: 1920,
        height: 3000,
      });
    });
  });
});
