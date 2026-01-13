import { NextRequest, NextResponse } from 'next/server';
import { CheckpointStore } from '@extracted/extractor';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Checkpoint ID is required' }, { status: 400 });
    }

    const store = new CheckpointStore();
    const checkpoint = await store.load(id);

    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: checkpoint.id,
      url: checkpoint.url,
      status: checkpoint.status,
      progress: checkpoint.progress,
      startedAt: checkpoint.startedAt.toISOString(),
      updatedAt: checkpoint.updatedAt.toISOString(),
      identifiedComponents: checkpoint.identifiedComponents,
      extractedTokens: checkpoint.extractedTokens,
      error: checkpoint.error,
      hasScreenshots: !!checkpoint.screenshots,
      comparisons: checkpoint.comparisons?.map(c => ({
        componentId: c.componentId,
        ssimScore: c.ssimScore,
        colorScore: c.colorScore,
        combinedScore: c.combinedScore,
        passed: c.passed,
      })),
    });
  } catch (error) {
    console.error('Failed to get checkpoint status:', error);
    return NextResponse.json({ error: 'Failed to get checkpoint status' }, { status: 500 });
  }
}
