import { NextRequest, NextResponse } from 'next/server';
import { CheckpointStore } from '@extracted/extractor';
import type { ExtractionCheckpoint } from '@extracted/extractor';
import { startExtractionAsync } from '../extraction';
import { generateCheckpointId, isValidUrl } from '../utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const trimmedUrl = url.trim();

    if (!isValidUrl(trimmedUrl)) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const checkpointId = generateCheckpointId();
    const store = new CheckpointStore();

    const checkpoint: ExtractionCheckpoint = {
      id: checkpointId,
      url: trimmedUrl,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    await store.save(checkpoint);

    // Start extraction in background (non-blocking)
    startExtractionAsync(checkpointId, trimmedUrl).catch(console.error);

    return NextResponse.json({
      checkpointId,
      status: 'pending',
      message: 'Extraction started',
    });
  } catch (error) {
    console.error('Failed to start extraction:', error);
    return NextResponse.json({ error: 'Failed to start extraction' }, { status: 500 });
  }
}
