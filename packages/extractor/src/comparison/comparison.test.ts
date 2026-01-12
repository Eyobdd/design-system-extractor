import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PNG } from 'pngjs';
import type { ColorHistogram } from './color';
import { calculateSSIM } from './ssim';
import {
  extractColorHistogram,
  compareHistograms,
  calculateColorSimilarity,
  isColorPass,
} from './color';

vi.mock('pixelmatch', () => ({
  default: vi.fn(() => 0),
}));

describe('SSIM Comparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateSSIM', () => {
    it('returns score of 1 for identical images', async () => {
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
      const pixelmatch = (await import('pixelmatch')).default;
      vi.mocked(pixelmatch).mockReturnValue(0);

      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateSSIM(buffer, buffer);

      expect(result.diffImage).toBeUndefined();
    });

    it('handles images of different sizes', async () => {
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

describe('Color Comparison', () => {
  describe('extractColorHistogram', () => {
    it('extracts histogram from image with correct bucket count', async () => {
      const png = new PNG({ width: 2, height: 2 });
      // Set all pixels to red
      for (let i = 0; i < 4; i++) {
        png.data[i * 4] = 255; // R
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 0; // B
        png.data[i * 4 + 3] = 255; // A
      }
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer);

      expect(histogram.red).toHaveLength(256);
      expect(histogram.green).toHaveLength(256);
      expect(histogram.blue).toHaveLength(256);
      expect(histogram.red[255]).toBe(1); // All red pixels in highest bucket
    });

    it('normalizes histogram values to sum to 1', async () => {
      const png = new PNG({ width: 2, height: 2 });
      png.data.fill(255); // All white pixels
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer);

      const redSum = histogram.red.reduce((sum, val) => sum + val, 0);
      const greenSum = histogram.green.reduce((sum, val) => sum + val, 0);
      const blueSum = histogram.blue.reduce((sum, val) => sum + val, 0);

      expect(redSum).toBeCloseTo(1, 5);
      expect(greenSum).toBeCloseTo(1, 5);
      expect(blueSum).toBeCloseTo(1, 5);
    });

    it('respects bucket count option', async () => {
      const png = new PNG({ width: 2, height: 2 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer, { buckets: 16 });

      expect(histogram.red).toHaveLength(16);
      expect(histogram.green).toHaveLength(16);
      expect(histogram.blue).toHaveLength(16);
    });

    it('ignores transparent pixels when ignoreAlpha is true (default)', async () => {
      const png = new PNG({ width: 2, height: 2 });
      // Set 2 opaque red pixels, 2 transparent blue pixels
      for (let i = 0; i < 2; i++) {
        png.data[i * 4] = 255; // R
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 0; // B
        png.data[i * 4 + 3] = 255; // A (opaque)
      }
      for (let i = 2; i < 4; i++) {
        png.data[i * 4] = 0; // R
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 255; // B
        png.data[i * 4 + 3] = 0; // A (transparent)
      }
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer);

      // Only red pixels should be counted (ignoring transparent blue)
      expect(histogram.red[255]).toBe(1);
      expect(histogram.blue[255]).toBe(0);
    });

    it('includes transparent pixels when ignoreAlpha is false', async () => {
      const png = new PNG({ width: 2, height: 2 });
      // Set 2 opaque red pixels, 2 transparent blue pixels
      for (let i = 0; i < 2; i++) {
        png.data[i * 4] = 255; // R
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 0; // B
        png.data[i * 4 + 3] = 255; // A (opaque)
      }
      for (let i = 2; i < 4; i++) {
        png.data[i * 4] = 0; // R
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 255; // B
        png.data[i * 4 + 3] = 0; // A (transparent)
      }
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer, { ignoreAlpha: false });

      // Both red and blue pixels should be counted
      expect(histogram.red[255]).toBe(0.5);
      expect(histogram.blue[255]).toBe(0.5);
    });

    it('distributes colors across correct buckets', async () => {
      const png = new PNG({ width: 2, height: 2 });
      // Set pixels with different red values
      png.data[0] = 0; // bucket 0 for 16 buckets
      png.data[4] = 64; // bucket 4 for 16 buckets
      png.data[8] = 128; // bucket 8 for 16 buckets
      png.data[12] = 255; // bucket 15 for 16 buckets
      // Fill other channels and alpha
      for (let i = 0; i < 4; i++) {
        png.data[i * 4 + 1] = 0; // G
        png.data[i * 4 + 2] = 0; // B
        png.data[i * 4 + 3] = 255; // A
      }
      const buffer = PNG.sync.write(png);

      const histogram = extractColorHistogram(buffer, { buckets: 16 });

      expect(histogram.red[0]).toBe(0.25); // 0 -> bucket 0
      expect(histogram.red[4]).toBe(0.25); // 64 -> bucket 4
      expect(histogram.red[8]).toBe(0.25); // 128 -> bucket 8
      expect(histogram.red[15]).toBe(0.25); // 255 -> bucket 15
    });
  });

  describe('compareHistograms', () => {
    it('returns 1 for identical histograms', async () => {
      const histogram: ColorHistogram = {
        red: [0.5, 0.5],
        green: [0.5, 0.5],
        blue: [0.5, 0.5],
      };

      const score = compareHistograms(histogram, histogram);

      expect(score).toBe(1);
    });

    it('returns 0 for completely different histograms', async () => {
      const h1: ColorHistogram = {
        red: [1, 0],
        green: [1, 0],
        blue: [1, 0],
      };

      const h2: ColorHistogram = {
        red: [0, 1],
        green: [0, 1],
        blue: [0, 1],
      };

      const score = compareHistograms(h1, h2);

      expect(score).toBe(0);
    });

    it('returns partial score for overlapping histograms', async () => {
      const h1: ColorHistogram = {
        red: [0.5, 0.5],
        green: [0.5, 0.5],
        blue: [0.5, 0.5],
      };

      const h2: ColorHistogram = {
        red: [0.25, 0.75],
        green: [0.25, 0.75],
        blue: [0.25, 0.75],
      };

      const score = compareHistograms(h1, h2);

      // Intersection: min(0.5, 0.25) + min(0.5, 0.75) = 0.25 + 0.5 = 0.75 per channel
      expect(score).toBe(0.75);
    });

    it('averages scores across all three channels', async () => {
      const h1: ColorHistogram = {
        red: [1, 0], // Will have 0 similarity with h2.red
        green: [0.5, 0.5], // Will have 1 similarity with h2.green
        blue: [0.5, 0.5], // Will have 0.5 similarity with h2.blue
      };

      const h2: ColorHistogram = {
        red: [0, 1],
        green: [0.5, 0.5],
        blue: [0.25, 0.75],
      };

      const score = compareHistograms(h1, h2);

      // (0 + 1 + 0.75) / 3 ≈ 0.583
      expect(score).toBeCloseTo(0.583, 2);
    });
  });

  describe('calculateColorSimilarity', () => {
    it('returns score of 1 for identical images', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateColorSimilarity(buffer, buffer);

      expect(result.score).toBe(1);
      expect(result.histogram1).toBeDefined();
      expect(result.histogram2).toBeDefined();
    });

    it('returns lower score for different images', async () => {
      const png1 = new PNG({ width: 2, height: 2 });
      // All red
      for (let i = 0; i < 4; i++) {
        png1.data[i * 4] = 255;
        png1.data[i * 4 + 1] = 0;
        png1.data[i * 4 + 2] = 0;
        png1.data[i * 4 + 3] = 255;
      }
      const buffer1 = PNG.sync.write(png1);

      const png2 = new PNG({ width: 2, height: 2 });
      // All blue
      for (let i = 0; i < 4; i++) {
        png2.data[i * 4] = 0;
        png2.data[i * 4 + 1] = 0;
        png2.data[i * 4 + 2] = 255;
        png2.data[i * 4 + 3] = 255;
      }
      const buffer2 = PNG.sync.write(png2);

      const result = await calculateColorSimilarity(buffer1, buffer2);

      expect(result.score).toBeLessThan(1);
      expect(result.histogram1.red[255]).toBe(1);
      expect(result.histogram2.blue[255]).toBe(1);
    });

    it('passes options to extractColorHistogram', async () => {
      const png = new PNG({ width: 2, height: 2 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await calculateColorSimilarity(buffer, buffer, { buckets: 16 });

      expect(result.histogram1.red).toHaveLength(16);
      expect(result.histogram2.red).toHaveLength(16);
    });

    it('returns both histograms for comparison', async () => {
      const png = new PNG({ width: 2, height: 2 });
      png.data.fill(128);
      const buffer = PNG.sync.write(png);

      const result = await calculateColorSimilarity(buffer, buffer);

      expect(result.histogram1).toHaveProperty('red');
      expect(result.histogram1).toHaveProperty('green');
      expect(result.histogram1).toHaveProperty('blue');
      expect(result.histogram2).toHaveProperty('red');
      expect(result.histogram2).toHaveProperty('green');
      expect(result.histogram2).toHaveProperty('blue');
    });
  });

  describe('isColorPass', () => {
    it('returns true when score meets threshold', async () => {
      expect(isColorPass(0.95)).toBe(true);
      expect(isColorPass(1.0)).toBe(true);
    });

    it('returns true when score exactly equals threshold', async () => {
      expect(isColorPass(0.95, 0.95)).toBe(true);
      expect(isColorPass(0.8, 0.8)).toBe(true);
    });

    it('returns false when score below threshold', async () => {
      expect(isColorPass(0.94)).toBe(false);
      expect(isColorPass(0.5)).toBe(false);
      expect(isColorPass(0)).toBe(false);
    });

    it('respects custom threshold', async () => {
      expect(isColorPass(0.8, 0.8)).toBe(true);
      expect(isColorPass(0.79, 0.8)).toBe(false);
      expect(isColorPass(0.5, 0.5)).toBe(true);
      expect(isColorPass(0.49, 0.5)).toBe(false);
    });

    it('uses default threshold of 0.95', async () => {
      expect(isColorPass(0.95)).toBe(true);
      expect(isColorPass(0.949)).toBe(false);
    });
  });
});
