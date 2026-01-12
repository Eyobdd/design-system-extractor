import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PNG } from 'pngjs';

vi.mock('pixelmatch', () => ({
  default: vi.fn(() => 0),
}));

describe('SSIM Comparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateSSIM', () => {
    it('returns score of 1 for identical images', async () => {
      const { calculateSSIM } = await import('./ssim');
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(0);

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateSSIM(buffer, buffer);

      expect(result.score).toBe(1);
      expect(result.diffPixels).toBe(0);
      expect(result.totalPixels).toBe(100);
    });

    it('returns lower score when images differ', async () => {
      const { calculateSSIM } = await import('./ssim');
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(50);

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateSSIM(buffer, buffer);

      expect(result.score).toBe(0.5);
      expect(result.diffPixels).toBe(50);
    });

    it('generates diff image when requested', async () => {
      const { calculateSSIM } = await import('./ssim');
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(0);

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateSSIM(buffer, buffer, { generateDiff: true });

      expect(result.diffImage).toBeDefined();
      expect(result.diffImage).toBeInstanceOf(Buffer);
    });

    it('does not generate diff image by default', async () => {
      const { calculateSSIM } = await import('./ssim');
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(0);

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateSSIM(buffer, buffer);

      expect(result.diffImage).toBeUndefined();
    });

    it('handles images of different sizes', async () => {
      const { calculateSSIM } = await import('./ssim');
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(25);

      const png1 = new PNG({ width: 10, height: 10 });
      png1.data.fill(255);
      const buffer1 = PNG.sync.write(png1);

      const png2 = new PNG({ width: 5, height: 5 });
      png2.data.fill(255);
      const buffer2 = PNG.sync.write(png2);

      const result = await calculateSSIM(buffer1, buffer2);

      expect(result.totalPixels).toBe(100);
      expect(result.score).toBe(0.75);
    });

    it('respects threshold option', async () => {
      const { calculateSSIM } = await import('./ssim');
      const pixelmatch = (await import('pixelmatch')).default;

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      await calculateSSIM(buffer, buffer, { threshold: 0.5 });

      expect(pixelmatch).toHaveBeenCalled();
      const callArgs = vi.mocked(pixelmatch).mock.calls[0];
      expect(callArgs?.[5]).toMatchObject({ threshold: 0.5 });
    });
  });

  describe('isSSIMPass', () => {
    it('returns true when score meets threshold', async () => {
      const { isSSIMPass } = await import('./ssim');

      expect(isSSIMPass(0.95)).toBe(true);
      expect(isSSIMPass(0.99)).toBe(true);
      expect(isSSIMPass(1.0)).toBe(true);
    });

    it('returns false when score below threshold', async () => {
      const { isSSIMPass } = await import('./ssim');

      expect(isSSIMPass(0.94)).toBe(false);
      expect(isSSIMPass(0.5)).toBe(false);
      expect(isSSIMPass(0)).toBe(false);
    });

    it('respects custom threshold', async () => {
      const { isSSIMPass } = await import('./ssim');

      expect(isSSIMPass(0.8, 0.8)).toBe(true);
      expect(isSSIMPass(0.79, 0.8)).toBe(false);
    });
  });
});
