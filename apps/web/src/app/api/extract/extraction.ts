import { CheckpointStore } from '@extracted/extractor';

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

export function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function startExtractionAsync(
  checkpointId: string,
  _url: string,
  store?: CheckpointStore
): Promise<void> {
  const checkpointStore = store ?? new CheckpointStore();

  try {
    // Update to screenshot phase
    await checkpointStore.update(checkpointId, {
      status: 'screenshot',
      progress: 10,
    });

    // STUB: Replace with actual extraction logic
    // For now, simulate the extraction phases
    await simulateDelay(1000);

    await checkpointStore.update(checkpointId, {
      progress: 30,
    });

    await simulateDelay(1000);

    await checkpointStore.update(checkpointId, {
      status: 'vision',
      progress: 50,
    });

    await simulateDelay(1000);

    await checkpointStore.update(checkpointId, {
      status: 'extraction',
      progress: 70,
    });

    await simulateDelay(1000);

    await checkpointStore.update(checkpointId, {
      progress: 90,
    });

    await simulateDelay(500);

    // STUB: Replace with actual extracted tokens from the extraction pipeline
    await checkpointStore.update(checkpointId, {
      status: 'complete',
      progress: 100,
      extractedTokens: {
        colors: {
          primary: '#3b82f6',
          secondary: '#6b7280',
          background: '#ffffff',
          foreground: '#171717',
        },
        typography: {
          fontFamily: 'system-ui, sans-serif',
          fontSize: { base: '16px', lg: '18px' },
        },
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px',
        },
      },
    });
  } catch (error) {
    console.error('Extraction failed:', error);
    await checkpointStore.update(checkpointId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
