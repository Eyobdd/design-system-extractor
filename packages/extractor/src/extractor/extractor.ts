import { v4 as uuidv4 } from 'uuid';
import { CheckpointStore } from '../checkpoint/store';
import type { ExtractionCheckpoint } from '../checkpoint/types';
import { captureScreenshots } from '../screenshot/capture';
import { identifyComponents } from '../vision/identify';
import { extractMultipleElementStyles, extractColorTokens, extractTypographyTokens } from '../dom';
import type {
  ExtractorConfig,
  ExtractorResult,
  ExtractorStep,
  ExtractorEventHandler,
} from './types';
import puppeteer from 'puppeteer';

interface ResolvedConfig {
  url: string;
  outputDir: string;
  dryRun: boolean;
  skipVision: boolean;
  skipDomExtraction: boolean;
  viewportWidth: number;
  viewportHeight: number;
  timeout: number;
  apiKey: string;
}

export class Extractor {
  private config: ResolvedConfig;
  private checkpointStore: CheckpointStore;
  private eventHandlers: ExtractorEventHandler[] = [];

  constructor(config: ExtractorConfig) {
    this.config = {
      url: config.url,
      outputDir: config.outputDir ?? process.cwd(),
      dryRun: config.dryRun ?? false,
      skipVision: config.skipVision ?? false,
      skipDomExtraction: config.skipDomExtraction ?? false,
      viewportWidth: config.viewportWidth ?? 1440,
      viewportHeight: config.viewportHeight ?? 900,
      timeout: config.timeout ?? 30000,
      apiKey: config.apiKey ?? process.env['GOOGLE_API_KEY'] ?? '',
    };

    this.checkpointStore = new CheckpointStore(this.config.outputDir);
  }

  on(handler: ExtractorEventHandler): void {
    this.eventHandlers.push(handler);
  }

  private emit(
    type: 'start' | 'screenshot' | 'vision' | 'extraction' | 'complete' | 'error',
    checkpoint: ExtractionCheckpoint,
    step?: ExtractorStep,
    error?: Error
  ): void {
    for (const handler of this.eventHandlers) {
      handler({ type, checkpoint, step, error });
    }
  }

  async run(): Promise<ExtractorResult> {
    const startTime = Date.now();
    const steps: ExtractorStep[] = [];
    const checkpointId = uuidv4();

    const checkpoint: ExtractionCheckpoint = {
      id: checkpointId,
      url: this.config.url,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.checkpointStore.save(checkpoint);
    this.emit('start', checkpoint);

    try {
      // Step 1: Screenshot capture
      const screenshotStep = await this.runScreenshotStep(checkpoint);
      steps.push(screenshotStep);

      if (screenshotStep.status === 'failed') {
        throw new Error(screenshotStep.error);
      }

      // Step 2: Vision component identification
      const visionStep = await this.runVisionStep(checkpoint);
      steps.push(visionStep);

      // Step 3: DOM style extraction
      const domStep = await this.runDomExtractionStep(checkpoint);
      steps.push(domStep);

      // Complete
      const finalCheckpoint = await this.checkpointStore.load(checkpointId);
      if (finalCheckpoint) {
        finalCheckpoint.status = 'complete';
        finalCheckpoint.progress = 100;
        await this.checkpointStore.save(finalCheckpoint);
        this.emit('complete', finalCheckpoint);

        return {
          checkpoint: finalCheckpoint,
          dryRun: this.config.dryRun,
          duration: Date.now() - startTime,
          steps,
        };
      }

      return {
        checkpoint,
        dryRun: this.config.dryRun,
        duration: Date.now() - startTime,
        steps,
      };
    } catch (error) {
      const failedCheckpoint = await this.checkpointStore.load(checkpointId);
      if (failedCheckpoint) {
        failedCheckpoint.status = 'failed';
        failedCheckpoint.error = error instanceof Error ? error.message : 'Unknown error';
        await this.checkpointStore.save(failedCheckpoint);
        this.emit('error', failedCheckpoint, undefined, error as Error);
      }

      return {
        checkpoint: failedCheckpoint || checkpoint,
        dryRun: this.config.dryRun,
        duration: Date.now() - startTime,
        steps,
      };
    }
  }

  private async runScreenshotStep(checkpoint: ExtractionCheckpoint): Promise<ExtractorStep> {
    const stepStart = Date.now();

    if (this.config.dryRun) {
      return {
        name: 'screenshot',
        status: 'skipped',
        duration: Date.now() - stepStart,
        data: { reason: 'Dry run mode - skipping actual screenshot capture' },
      };
    }

    try {
      const result = await captureScreenshots(
        {
          url: this.config.url,
          checkpointId: checkpoint.id,
          viewportWidth: this.config.viewportWidth,
          viewportHeight: this.config.viewportHeight,
          timeout: this.config.timeout,
        },
        this.checkpointStore
      );

      const step: ExtractorStep = {
        name: 'screenshot',
        status: 'success',
        duration: Date.now() - stepStart,
        data: {
          viewportSize: result.viewport.length,
          fullPageSize: result.fullPage.length,
        },
      };

      this.emit('screenshot', checkpoint, step);
      return step;
    } catch (error) {
      return {
        name: 'screenshot',
        status: 'failed',
        duration: Date.now() - stepStart,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async runVisionStep(checkpoint: ExtractionCheckpoint): Promise<ExtractorStep> {
    const stepStart = Date.now();

    if (this.config.dryRun || this.config.skipVision) {
      return {
        name: 'vision',
        status: 'skipped',
        duration: Date.now() - stepStart,
        data: {
          reason: this.config.dryRun
            ? 'Dry run mode - skipping vision API call'
            : 'Vision step disabled by config',
        },
      };
    }

    if (!this.config.apiKey) {
      return {
        name: 'vision',
        status: 'skipped',
        duration: Date.now() - stepStart,
        data: { reason: 'No API key provided - skipping vision step' },
      };
    }

    try {
      const currentCheckpoint = await this.checkpointStore.load(checkpoint.id);
      if (!currentCheckpoint?.screenshots?.viewport) {
        return {
          name: 'vision',
          status: 'skipped',
          duration: Date.now() - stepStart,
          data: { reason: 'No screenshot available for vision analysis' },
        };
      }

      const result = await identifyComponents(
        {
          checkpointId: checkpoint.id,
          screenshot: currentCheckpoint.screenshots.viewport,
          apiKey: this.config.apiKey,
        },
        this.checkpointStore
      );

      const step: ExtractorStep = {
        name: 'vision',
        status: 'success',
        duration: Date.now() - stepStart,
        data: {
          componentsIdentified: result.components.length,
          components: result.components,
        },
      };

      this.emit('vision', checkpoint, step);
      return step;
    } catch (error) {
      return {
        name: 'vision',
        status: 'failed',
        duration: Date.now() - stepStart,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async runDomExtractionStep(checkpoint: ExtractionCheckpoint): Promise<ExtractorStep> {
    const stepStart = Date.now();

    if (this.config.dryRun || this.config.skipDomExtraction) {
      return {
        name: 'extraction',
        status: 'skipped',
        duration: Date.now() - stepStart,
        data: {
          reason: this.config.dryRun
            ? 'Dry run mode - skipping DOM extraction'
            : 'DOM extraction disabled by config',
        },
      };
    }

    let browser = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setViewport({
        width: this.config.viewportWidth,
        height: this.config.viewportHeight,
      });

      await page.goto(this.config.url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      const currentCheckpoint = await this.checkpointStore.load(checkpoint.id);
      const selectors: string[] = [];

      if (currentCheckpoint?.identifiedComponents) {
        for (const comp of currentCheckpoint.identifiedComponents) {
          selectors.push(`[class*="${comp.type}"]`);
        }
      }

      if (selectors.length === 0) {
        selectors.push('button', 'input', 'a', 'h1', 'h2', 'h3', 'p');
      }

      const styles = await extractMultipleElementStyles(page, selectors);
      const colorTokens = extractColorTokens(styles);
      const typographyTokens = extractTypographyTokens(styles);

      await this.checkpointStore.update(checkpoint.id, {
        status: 'extraction',
        progress: 75,
        extractedTokens: {
          colors: colorTokens,
          typography: typographyTokens,
        },
      });

      const step: ExtractorStep = {
        name: 'extraction',
        status: 'success',
        duration: Date.now() - stepStart,
        data: {
          stylesExtracted: styles.length,
          colorTokens: Object.keys(colorTokens).length,
          typographyTokens: Object.keys(typographyTokens).length,
        },
      };

      this.emit('extraction', checkpoint, step);
      return step;
    } catch (error) {
      return {
        name: 'extraction',
        status: 'failed',
        duration: Date.now() - stepStart,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async resume(checkpointId: string): Promise<ExtractorResult | null> {
    const checkpoint = await this.checkpointStore.load(checkpointId);
    if (!checkpoint) {
      return null;
    }

    this.config.url = checkpoint.url;
    return this.run();
  }

  getCheckpointStore(): CheckpointStore {
    return this.checkpointStore;
  }
}

export function createExtractor(config: ExtractorConfig): Extractor {
  return new Extractor(config);
}
