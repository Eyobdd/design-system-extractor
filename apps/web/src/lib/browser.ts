import type { Browser, LaunchOptions } from 'puppeteer-core';
import puppeteer from 'puppeteer-core';

let browserInstance: Browser | null = null;

/**
 * Detects if we're running in a serverless/production environment
 */
export function isProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env['RENDER'] === 'true' ||
    process.env['VERCEL'] === '1'
  );
}

/**
 * Gets the Chromium executable path based on environment
 */
async function getChromiumExecutable(): Promise<string> {
  if (isProduction()) {
    // In production, use @sparticuz/chromium
    const chromium = await import('@sparticuz/chromium');
    return await chromium.default.executablePath();
  }

  // In development, try common local Chrome paths
  const possiblePaths = [
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  // Check if CHROME_PATH is set
  if (process.env['CHROME_PATH']) {
    return process.env['CHROME_PATH'];
  }

  // Try to find Chrome in common locations
  const fs = await import('fs/promises');
  for (const path of possiblePaths) {
    try {
      await fs.access(path);
      return path;
    } catch {
      // Path doesn't exist, try next
    }
  }

  throw new Error(
    'Could not find Chrome/Chromium. Set CHROME_PATH environment variable or install Chrome.'
  );
}

/**
 * Gets browser launch options based on environment
 */
async function getLaunchOptions(): Promise<LaunchOptions> {
  const executablePath = await getChromiumExecutable();

  const baseOptions: LaunchOptions = {
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  };

  if (isProduction()) {
    // Additional options for serverless environments
    const chromium = await import('@sparticuz/chromium');
    return {
      ...baseOptions,
      args: [...(baseOptions.args || []), ...chromium.default.args],
      defaultViewport: { width: 1920, height: 1080 },
    };
  }

  return baseOptions;
}

/**
 * Gets or creates a browser instance
 * Uses singleton pattern to reuse browser across requests
 */
export async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const options = await getLaunchOptions();
  browserInstance = await puppeteer.launch(options);

  // Handle browser disconnect
  browserInstance.on('disconnected', () => {
    browserInstance = null;
  });

  return browserInstance;
}

/**
 * Closes the browser instance if it exists
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Creates a new page with common settings
 */
export async function createPage(browser: Browser) {
  const page = await browser.newPage();

  // Set reasonable defaults
  await page.setViewport({ width: 1440, height: 900 });

  // Set user agent to avoid bot detection
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  return page;
}

/**
 * Checks if the browser is available and working
 */
export async function checkBrowserHealth(): Promise<{
  available: boolean;
  error?: string;
}> {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.close();
    return { available: true };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
