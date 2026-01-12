import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PNG } from 'pngjs';
import type { ColorHistogram } from './color';
import type { BatchComparisonResult } from './compare';
import { calculateSSIM, isSSIMPass } from './ssim';
import {
  extractColorHistogram,
  compareHistograms,
  calculateColorSimilarity,
  isColorPass,
} from './color';
import { compareComponents, compareComponentsBatch, getComparisonSummary } from './compare';

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
    it('returns true when score meets threshold', () => {
      expect(isSSIMPass(0.95)).toBe(true);
      expect(isSSIMPass(0.99)).toBe(true);
      expect(isSSIMPass(1.0)).toBe(true);
    });

    it('returns false when score below threshold', () => {
      expect(isSSIMPass(0.94)).toBe(false);
      expect(isSSIMPass(0.5)).toBe(false);
      expect(isSSIMPass(0)).toBe(false);
    });

    it('respects custom threshold', () => {
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

describe('Combined Comparison', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const pixelmatch = (await import('pixelmatch')).default;
    vi.mocked(pixelmatch).mockReturnValue(0);
  });

  describe('compareComponents', () => {
    it('returns all required fields in result', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      expect(result).toHaveProperty('ssimScore');
      expect(result).toHaveProperty('colorScore');
      expect(result).toHaveProperty('combinedScore');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('ssimResult');
      expect(result).toHaveProperty('colorResult');
      expect(typeof result.ssimScore).toBe('number');
      expect(typeof result.colorScore).toBe('number');
      expect(typeof result.combinedScore).toBe('number');
      expect(typeof result.passed).toBe('boolean');
    });

    it('returns high scores for identical images', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      expect(result.ssimScore).toBe(1);
      expect(result.colorScore).toBe(1);
      expect(result.combinedScore).toBe(1);
    });

    it('calculates combined score with default weights (60% SSIM, 40% color)', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      const expectedCombined = result.ssimScore * 0.6 + result.colorScore * 0.4;
      expect(result.combinedScore).toBeCloseTo(expectedCombined, 5);
    });

    it('passes when combined score >= threshold', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer, { passThreshold: 0.5 });

      expect(result.combinedScore).toBeGreaterThanOrEqual(0.5);
      expect(result.passed).toBe(true);
    });

    it('fails when combined score < threshold', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer, { passThreshold: 1.1 });

      expect(result.passed).toBe(false);
    });

    it('respects custom passThreshold', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const resultLow = await compareComponents(buffer, buffer, { passThreshold: 0.5 });
      const resultHigh = await compareComponents(buffer, buffer, { passThreshold: 1.1 });

      expect(resultLow.passed).toBe(true);
      expect(resultHigh.passed).toBe(false);
    });

    it('respects custom weights', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer, {
        ssimWeight: 0.8,
        colorWeight: 0.2,
      });

      const expectedCombined = result.ssimScore * 0.8 + result.colorScore * 0.2;
      expect(result.combinedScore).toBeCloseTo(expectedCombined, 5);
    });

    it('generates diff image when requested', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer, { generateDiff: true });

      expect(result.diffImage).toBeDefined();
      expect(result.diffImage).toBeInstanceOf(Buffer);
    });

    it('does not generate diff image by default', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      expect(result.diffImage).toBeUndefined();
    });

    it('includes nested ssimResult with correct structure', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      expect(result.ssimResult).toHaveProperty('score');
      expect(result.ssimResult).toHaveProperty('diffPixels');
      expect(result.ssimResult).toHaveProperty('totalPixels');
      expect(result.ssimResult.score).toBe(result.ssimScore);
    });

    it('includes nested colorResult with histograms', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const result = await compareComponents(buffer, buffer);

      expect(result.colorResult).toHaveProperty('score');
      expect(result.colorResult).toHaveProperty('histogram1');
      expect(result.colorResult).toHaveProperty('histogram2');
      expect(result.colorResult.score).toBe(result.colorScore);
    });
  });

  describe('compareComponentsBatch', () => {
    it('compares multiple components and preserves order', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const results = await compareComponentsBatch([
        { componentId: 'button', originalImage: buffer, generatedImage: buffer },
        { componentId: 'card', originalImage: buffer, generatedImage: buffer },
        { componentId: 'input', originalImage: buffer, generatedImage: buffer },
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]?.componentId).toBe('button');
      expect(results[1]?.componentId).toBe('card');
      expect(results[2]?.componentId).toBe('input');
    });

    it('returns full ComparisonResult for each component', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const results = await compareComponentsBatch([
        { componentId: 'button', originalImage: buffer, generatedImage: buffer },
      ]);

      const result = results[0]?.result;
      expect(result).toHaveProperty('ssimScore');
      expect(result).toHaveProperty('colorScore');
      expect(result).toHaveProperty('combinedScore');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('ssimResult');
      expect(result).toHaveProperty('colorResult');
    });

    it('passes options to all comparisons', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const results = await compareComponentsBatch(
        [
          { componentId: 'button', originalImage: buffer, generatedImage: buffer },
          { componentId: 'card', originalImage: buffer, generatedImage: buffer },
        ],
        { passThreshold: 0.5, ssimWeight: 0.7, colorWeight: 0.3 }
      );

      for (const item of results) {
        const expectedCombined = item.result.ssimScore * 0.7 + item.result.colorScore * 0.3;
        expect(item.result.combinedScore).toBeCloseTo(expectedCombined, 5);
        expect(item.result.passed).toBe(true);
      }
    });

    it('returns empty array for empty input', async () => {
      const results = await compareComponentsBatch([]);

      expect(results).toEqual([]);
    });

    it('handles single component', async () => {
      const png = new PNG({ width: 10, height: 10 });
      png.data.fill(255);
      const buffer = PNG.sync.write(png);

      const results = await compareComponentsBatch(
        [{ componentId: 'solo', originalImage: buffer, generatedImage: buffer }],
        { passThreshold: 0.5 }
      );

      expect(results).toHaveLength(1);
      expect(results[0]?.componentId).toBe('solo');
      expect(results[0]?.result.combinedScore).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('getComparisonSummary', () => {
    const createMockResult = (
      componentId: string,
      combinedScore: number,
      passed: boolean
    ): BatchComparisonResult => ({
      componentId,
      result: {
        ssimScore: combinedScore,
        colorScore: combinedScore,
        combinedScore,
        passed,
        ssimResult: { score: combinedScore, diffPixels: 0, totalPixels: 100 },
        colorResult: {
          score: combinedScore,
          histogram1: { red: [], green: [], blue: [] },
          histogram2: { red: [], green: [], blue: [] },
        },
      },
    });

    it('calculates correct totals for mixed results', () => {
      const mockResults: BatchComparisonResult[] = [
        createMockResult('button', 1, true),
        createMockResult('card', 0.8, false),
      ];

      const summary = getComparisonSummary(mockResults);

      expect(summary.total).toBe(2);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.averageScore).toBe(0.9);
    });

    it('handles all passing results', () => {
      const mockResults: BatchComparisonResult[] = [
        createMockResult('button', 1, true),
        createMockResult('card', 0.98, true),
        createMockResult('input', 0.96, true),
      ];

      const summary = getComparisonSummary(mockResults);

      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(3);
      expect(summary.failed).toBe(0);
      expect(summary.averageScore).toBeCloseTo(0.98, 2);
    });

    it('handles all failing results', () => {
      const mockResults: BatchComparisonResult[] = [
        createMockResult('button', 0.5, false),
        createMockResult('card', 0.6, false),
      ];

      const summary = getComparisonSummary(mockResults);

      expect(summary.total).toBe(2);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(2);
      expect(summary.averageScore).toBe(0.55);
    });

    it('handles single result', () => {
      const mockResults: BatchComparisonResult[] = [createMockResult('button', 0.95, true)];

      const summary = getComparisonSummary(mockResults);

      expect(summary.total).toBe(1);
      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(0);
      expect(summary.averageScore).toBe(0.95);
    });

    it('handles empty results array', () => {
      const summary = getComparisonSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.averageScore).toBe(0);
    });

    it('calculates average score correctly with varying scores', () => {
      const mockResults: BatchComparisonResult[] = [
        createMockResult('a', 1.0, true),
        createMockResult('b', 0.8, false),
        createMockResult('c', 0.6, false),
        createMockResult('d', 0.4, false),
      ];

      const summary = getComparisonSummary(mockResults);

      expect(summary.averageScore).toBe(0.7);
    });
  });
});
