import { CheckpointStore, createExtractor } from '@extracted/extractor';
import type { ExtractorEvent } from '@extracted/extractor';

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
 */
export async function startExtractionAsync(
  checkpointId: string,
  url: string,
  store?: CheckpointStore
): Promise<void> {
  const checkpointStore = store ?? getCheckpointStore();

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
      handleExtractionEvent(checkpointId, event, checkpointStore).catch(err => {
        console.error('Error handling extraction event:', err);
      });
    });

    // Run the extraction pipeline
    const result = await extractor.run();

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
    console.error('Extraction failed:', error);
    await checkpointStore.update(checkpointId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
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
