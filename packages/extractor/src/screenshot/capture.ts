import puppeteer, { type Browser, type Page } from 'puppeteer';
import type { CheckpointStore } from '../checkpoint/store';

export interface CaptureOptions {
  url: string;
  checkpointId: string;
  viewportWidth?: number;
  viewportHeight?: number;
  waitForNetworkIdle?: boolean;
  timeout?: number;
}

export interface CaptureResult {
  viewport: Buffer;
  fullPage: Buffer;
}

export async function captureScreenshots(
  options: CaptureOptions,
  checkpointStore?: CheckpointStore
): Promise<CaptureResult> {
  const {
    url,
    checkpointId,
    viewportWidth = 1440,
    viewportHeight = 900,
    waitForNetworkIdle = true,
    timeout = 30000,
  } = options;

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
    });

    await page.goto(url, {
      waitUntil: waitForNetworkIdle ? 'networkidle2' : 'domcontentloaded',
      timeout,
    });

    const viewport = await page.screenshot({
      type: 'png',
      encoding: 'binary',
    });

    const fullPage = await page.screenshot({
      type: 'png',
      fullPage: true,
      encoding: 'binary',
    });

    const result: CaptureResult = {
      viewport: Buffer.from(viewport),
      fullPage: Buffer.from(fullPage),
    };

    if (checkpointStore) {
      await checkpointStore.update(checkpointId, {
        status: 'screenshot',
        progress: 25,
        screenshots: result,
      });
    }

    return result;
  } catch (error) {
    if (checkpointStore) {
      await checkpointStore.update(checkpointId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error during screenshot capture',
      });
    }
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function captureElementScreenshot(
  page: Page,
  selector: string
): Promise<Buffer | null> {
  try {
    const element = await page.$(selector);
    if (!element) {
      return null;
    }

    const screenshot = await element.screenshot({
      type: 'png',
      encoding: 'binary',
    });

    return Buffer.from(screenshot);
  } catch {
    return null;
  }
}
