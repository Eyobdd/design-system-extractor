import { PNG } from 'pngjs';

export interface ColorHistogram {
  red: number[];
  green: number[];
  blue: number[];
}

export interface ColorComparisonResult {
  score: number;
  histogram1: ColorHistogram;
  histogram2: ColorHistogram;
}

export interface ColorComparisonOptions {
  buckets?: number;
  ignoreAlpha?: boolean;
}

export function extractColorHistogram(
  imageBuffer: Buffer,
  options: ColorComparisonOptions = {}
): ColorHistogram {
  const { buckets = 256, ignoreAlpha = true } = options;

  const png = PNG.sync.read(imageBuffer);
  const histogram: ColorHistogram = {
    red: new Array(buckets).fill(0) as number[],
    green: new Array(buckets).fill(0) as number[],
    blue: new Array(buckets).fill(0) as number[],
  };

  const bucketSize = 256 / buckets;
  let pixelCount = 0;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (y * png.width + x) * 4;
      const alpha = png.data[idx + 3] ?? 255;

      if (ignoreAlpha && alpha < 128) {
        continue;
      }

      const r = png.data[idx] ?? 0;
      const g = png.data[idx + 1] ?? 0;
      const b = png.data[idx + 2] ?? 0;

      const rBucket = Math.min(Math.floor(r / bucketSize), buckets - 1);
      const gBucket = Math.min(Math.floor(g / bucketSize), buckets - 1);
      const bBucket = Math.min(Math.floor(b / bucketSize), buckets - 1);

      histogram.red[rBucket] = (histogram.red[rBucket] ?? 0) + 1;
      histogram.green[gBucket] = (histogram.green[gBucket] ?? 0) + 1;
      histogram.blue[bBucket] = (histogram.blue[bBucket] ?? 0) + 1;
      pixelCount++;
    }
  }

  if (pixelCount > 0) {
    for (let i = 0; i < buckets; i++) {
      histogram.red[i] = histogram.red[i]! / pixelCount;
      histogram.green[i] = histogram.green[i]! / pixelCount;
      histogram.blue[i] = histogram.blue[i]! / pixelCount;
    }
  }

  return histogram;
}

export function compareHistograms(h1: ColorHistogram, h2: ColorHistogram): number {
  const redScore = calculateChannelSimilarity(h1.red, h2.red);
  const greenScore = calculateChannelSimilarity(h1.green, h2.green);
  const blueScore = calculateChannelSimilarity(h1.blue, h2.blue);

  return (redScore + greenScore + blueScore) / 3;
}

function calculateChannelSimilarity(channel1: number[], channel2: number[]): number {
  if (channel1.length !== channel2.length) {
    throw new Error('Histogram channels must have the same length');
  }

  let intersection = 0;

  for (let i = 0; i < channel1.length; i++) {
    intersection += Math.min(channel1[i]!, channel2[i]!);
  }

  return intersection;
}

export async function calculateColorSimilarity(
  image1: Buffer,
  image2: Buffer,
  options: ColorComparisonOptions = {}
): Promise<ColorComparisonResult> {
  const histogram1 = extractColorHistogram(image1, options);
  const histogram2 = extractColorHistogram(image2, options);
  const score = compareHistograms(histogram1, histogram2);

  return {
    score,
    histogram1,
    histogram2,
  };
}

export function isColorPass(score: number, threshold: number = 0.95): boolean {
  return score >= threshold;
}
