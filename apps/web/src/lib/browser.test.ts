import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('browser', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe('isProduction', () => {
    it('returns true when NODE_ENV is production', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const { isProduction } = await import('./browser');
      expect(isProduction()).toBe(true);
    });

    it('returns true when RENDER is true', async () => {
      vi.stubEnv('NODE_ENV', 'test');
      vi.stubEnv('RENDER', 'true');

      const { isProduction } = await import('./browser');
      expect(isProduction()).toBe(true);
    });

    it('returns true when VERCEL is 1', async () => {
      vi.stubEnv('NODE_ENV', 'test');
      vi.stubEnv('VERCEL', '1');

      const { isProduction } = await import('./browser');
      expect(isProduction()).toBe(true);
    });

    it('returns false when not in production environment', async () => {
      vi.stubEnv('NODE_ENV', 'test');
      vi.stubEnv('RENDER', '');
      vi.stubEnv('VERCEL', '');

      const { isProduction } = await import('./browser');
      expect(isProduction()).toBe(false);
    });
  });

  describe('createPage', () => {
    it('creates a new page with default viewport', async () => {
      const { createPage } = await import('./browser');
      const mockPage = {
        setViewport: vi.fn().mockResolvedValue(undefined),
        setUserAgent: vi.fn().mockResolvedValue(undefined),
      };
      const mockBrowser = { newPage: vi.fn().mockResolvedValue(mockPage) };

      await createPage(mockBrowser as unknown as import('puppeteer-core').Browser);

      expect(mockPage.setViewport).toHaveBeenCalledWith({ width: 1440, height: 900 });
    });

    it('sets user agent to avoid bot detection', async () => {
      const { createPage } = await import('./browser');
      const mockPage = {
        setViewport: vi.fn().mockResolvedValue(undefined),
        setUserAgent: vi.fn().mockResolvedValue(undefined),
      };
      const mockBrowser = { newPage: vi.fn().mockResolvedValue(mockPage) };

      await createPage(mockBrowser as unknown as import('puppeteer-core').Browser);

      expect(mockPage.setUserAgent).toHaveBeenCalledWith(expect.stringContaining('Chrome'));
    });

    it('returns the created page', async () => {
      const { createPage } = await import('./browser');
      const mockPage = {
        setViewport: vi.fn().mockResolvedValue(undefined),
        setUserAgent: vi.fn().mockResolvedValue(undefined),
      };
      const mockBrowser = { newPage: vi.fn().mockResolvedValue(mockPage) };

      const result = await createPage(mockBrowser as unknown as import('puppeteer-core').Browser);

      expect(result).toBe(mockPage);
    });
  });
});
