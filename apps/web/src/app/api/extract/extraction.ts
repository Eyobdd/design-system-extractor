import { CheckpointStore, createExtractor } from '@extracted/extractor';
import type { ExtractorEvent } from '@extracted/extractor';
import { createLogger } from '@/lib/extraction-logger';
import { withRetry } from '@/lib/retry';

let checkpointStoreInstance: CheckpointStore | null = null;

export function getCheckpointStore(): CheckpointStore {
  if (!checkpointStoreInstance) {
    checkpointStoreInstance = new CheckpointStore();
  }
  return checkpointStoreInstance;
}

export function setCheckpointStore(store: CheckpointStore): void {
  checkpointStoreInstance = store;
}

/**
 * Determines if we should use dry run mode (no actual browser)
 * Useful for testing or when Puppeteer is not available
 */
function shouldUseDryRun(): boolean {
  return process.env['EXTRACTION_DRY_RUN'] === 'true';
}

/**
 * Starts the real extraction pipeline using the Extractor class
 * Includes logging and retry logic for resilience
 */
export async function startExtractionAsync(
  checkpointId: string,
  url: string,
  store?: CheckpointStore
): Promise<void> {
  const checkpointStore = store ?? getCheckpointStore();
  const logger = createLogger(checkpointId);

  logger.info('Starting extraction', { url });

  try {
    // Create the extractor with the URL
    const extractor = createExtractor({
      url,
      outputDir: process.cwd(),
      dryRun: shouldUseDryRun(),
      apiKey: process.env['GOOGLE_API_KEY'] || process.env['GEMINI_API_KEY'],
      viewportWidth: 1440,
      viewportHeight: 900,
      timeout: 30000,
    });

    // Set up event handlers to update the checkpoint as extraction progresses
    extractor.on((event: ExtractorEvent) => {
      logger.debug('Extraction event', { type: event.type });
      handleExtractionEvent(checkpointId, event, checkpointStore).catch(err => {
        logger.error('Error handling extraction event', {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    });

    // Run the extraction pipeline with retry logic
    const result = await withRetry(() => extractor.run(), {
      maxRetries: 2,
      initialDelayMs: 2000,
      onRetry: (attempt, error, delayMs) => {
        logger.warn(`Extraction attempt ${attempt} failed, retrying in ${delayMs}ms`, {
          error: error instanceof Error ? error.message : String(error),
        });
      },
    });

    logger.info('Extraction completed successfully');

    // If the extractor created its own checkpoint, merge the data
    if (result.checkpoint.id !== checkpointId) {
      // Copy extracted data to our checkpoint
      await checkpointStore.update(checkpointId, {
        status: result.checkpoint.status,
        progress: result.checkpoint.progress,
        screenshots: result.checkpoint.screenshots,
        identifiedComponents: result.checkpoint.identifiedComponents,
        extractedTokens: result.checkpoint.extractedTokens,
        comparisons: result.checkpoint.comparisons,
        error: result.checkpoint.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Extraction failed', { error: errorMessage });

    await checkpointStore.update(checkpointId, {
      status: 'failed',
      error: errorMessage,
    });
  }
}

/**
 * Handles extraction events and updates the checkpoint accordingly
 */
async function handleExtractionEvent(
  checkpointId: string,
  event: ExtractorEvent,
  store: CheckpointStore
): Promise<void> {
  switch (event.type) {
    case 'start':
      await store.update(checkpointId, {
        status: 'pending',
        progress: 0,
      });
      break;

    case 'screenshot':
      await store.update(checkpointId, {
        status: 'screenshot',
        progress: 20,
      });
      break;

    case 'vision':
      await store.update(checkpointId, {
        status: 'vision',
        progress: 40,
        identifiedComponents: event.checkpoint.identifiedComponents,
      });
      break;

    case 'extraction':
      await store.update(checkpointId, {
        status: 'extraction',
        progress: 60,
        extractedTokens: event.checkpoint.extractedTokens,
      });
      break;

    case 'complete':
      await store.update(checkpointId, {
        status: 'complete',
        progress: 100,
        screenshots: event.checkpoint.screenshots,
        identifiedComponents: event.checkpoint.identifiedComponents,
        extractedTokens: event.checkpoint.extractedTokens,
        comparisons: event.checkpoint.comparisons,
      });
      break;

    case 'error':
      await store.update(checkpointId, {
        status: 'failed',
        error: event.error?.message || 'Unknown error',
      });
      break;
  }
}
