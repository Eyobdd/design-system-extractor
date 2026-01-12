import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface SSIMResult {
  score: number;
  diffPixels: number;
  totalPixels: number;
  diffImage?: Buffer | undefined;
}

export interface SSIMOptions {
  threshold?: number;
  includeAA?: boolean;
  generateDiff?: boolean;
}

export async function calculateSSIM(
  image1: Buffer,
  image2: Buffer,
  options: SSIMOptions = {}
): Promise<SSIMResult> {
  const { threshold = 0.1, includeAA = false, generateDiff = false } = options;

  const png1 = PNG.sync.read(image1);
  const png2 = PNG.sync.read(image2);

  const width = Math.max(png1.width, png2.width);
  const height = Math.max(png1.height, png2.height);

  const img1Resized = resizeToFit(png1, width, height);
  const img2Resized = resizeToFit(png2, width, height);

  let diffImage: PNG | undefined;
  let diffBuffer: Buffer | undefined;

  if (generateDiff) {
    diffImage = new PNG({ width, height });
  }

  const diffPixels = pixelmatch(
    img1Resized.data,
    img2Resized.data,
    diffImage?.data,
    width,
    height,
    {
      threshold,
      includeAA,
    }
  );

  if (diffImage) {
    diffBuffer = PNG.sync.write(diffImage);
  }

  const totalPixels = width * height;
  const score = 1 - diffPixels / totalPixels;

  return {
    score,
    diffPixels,
    totalPixels,
    diffImage: diffBuffer,
  };
}

function resizeToFit(png: PNG, targetWidth: number, targetHeight: number): PNG {
  if (png.width === targetWidth && png.height === targetHeight) {
    return png;
  }

  const resized = new PNG({ width: targetWidth, height: targetHeight });

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const idx = (y * targetWidth + x) * 4;

      if (x < png.width && y < png.height) {
        const srcIdx = (y * png.width + x) * 4;
        resized.data[idx] = png.data[srcIdx] ?? 0;
        resized.data[idx + 1] = png.data[srcIdx + 1] ?? 0;
        resized.data[idx + 2] = png.data[srcIdx + 2] ?? 0;
        resized.data[idx + 3] = png.data[srcIdx + 3] ?? 255;
      } else {
        resized.data[idx] = 255;
        resized.data[idx + 1] = 255;
        resized.data[idx + 2] = 255;
        resized.data[idx + 3] = 255;
      }
    }
  }

  return resized;
}

export function isSSIMPass(score: number, threshold: number = 0.95): boolean {
  return score >= threshold;
}
