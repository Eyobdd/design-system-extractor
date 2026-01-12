import type { Page } from 'puppeteer';
import sharp from 'sharp';

export interface StitchOptions {
  scrollDelay?: number;
  maxHeight?: number;
}

export interface ScrollPosition {
  x: number;
  y: number;
  viewportHeight: number;
  totalHeight: number;
}

export async function captureFullPageStitched(
  page: Page,
  options: StitchOptions = {}
): Promise<Buffer> {
  const { scrollDelay = 100, maxHeight = 20000 } = options;

  const dimensions = await page.evaluate(() => ({
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    totalHeight: Math.min(document.documentElement.scrollHeight, document.body.scrollHeight),
    totalWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));

  const effectiveHeight = Math.min(dimensions.totalHeight, maxHeight);
  const screenshots: Buffer[] = [];
  let currentY = 0;

  while (currentY < effectiveHeight) {
    await page.evaluate(y => window.scrollTo(0, y), currentY);
    await new Promise(resolve => setTimeout(resolve, scrollDelay));

    const screenshot = await page.screenshot({
      type: 'png',
      encoding: 'binary',
    });

    screenshots.push(Buffer.from(screenshot));

    currentY += dimensions.viewportHeight;
  }

  await page.evaluate(() => window.scrollTo(0, 0));

  if (screenshots.length === 1) {
    return screenshots[0]!;
  }

  return stitchVertically(
    screenshots,
    dimensions.viewportWidth,
    effectiveHeight,
    dimensions.viewportHeight
  );
}

async function stitchVertically(
  screenshots: Buffer[],
  width: number,
  totalHeight: number,
  viewportHeight: number
): Promise<Buffer> {
  const compositeOperations = screenshots.map((screenshot, index) => ({
    input: screenshot,
    top: index * viewportHeight,
    left: 0,
  }));

  const stitched = await sharp({
    create: {
      width,
      height: totalHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(compositeOperations)
    .png()
    .toBuffer();

  return stitched;
}

export async function getPageDimensions(page: Page): Promise<{ width: number; height: number }> {
  return page.evaluate(() => ({
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }));
}
