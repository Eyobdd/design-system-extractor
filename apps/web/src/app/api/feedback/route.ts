import { NextRequest, NextResponse } from 'next/server';
import { getCheckpointStore } from '../extract/extraction';

export interface FeedbackRequest {
  checkpointId: string;
  componentId: string;
  feedback: 'approve' | 'reject';
  comment?: string;
}

export interface FeedbackEntry {
  componentId: string;
  feedback: 'approve' | 'reject';
  comment?: string;
  timestamp: string;
}

const feedbackStore = new Map<string, FeedbackEntry[]>();

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FeedbackRequest;

    if (!body.checkpointId || typeof body.checkpointId !== 'string') {
      return NextResponse.json({ error: 'checkpointId is required' }, { status: 400 });
    }

    if (!body.componentId || typeof body.componentId !== 'string') {
      return NextResponse.json({ error: 'componentId is required' }, { status: 400 });
    }

    if (body.feedback !== 'approve' && body.feedback !== 'reject') {
      return NextResponse.json(
        { error: 'feedback must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const store = getCheckpointStore();
    const checkpoint = await store.load(body.checkpointId);

    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    const entry: FeedbackEntry = {
      componentId: body.componentId,
      feedback: body.feedback,
      timestamp: new Date().toISOString(),
      ...(body.comment !== undefined && { comment: body.comment }),
    };

    const existing = feedbackStore.get(body.checkpointId) || [];
    const filteredExisting = existing.filter(e => e.componentId !== body.componentId);
    feedbackStore.set(body.checkpointId, [...filteredExisting, entry]);

    return NextResponse.json({
      success: true,
      feedback: entry,
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkpointId = searchParams.get('checkpointId');

    if (!checkpointId) {
      return NextResponse.json({ error: 'checkpointId is required' }, { status: 400 });
    }

    const store = getCheckpointStore();
    const checkpoint = await store.load(checkpointId);

    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    const feedback = feedbackStore.get(checkpointId) || [];

    return NextResponse.json({
      checkpointId,
      feedback,
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json({ error: 'Failed to get feedback' }, { status: 500 });
  }
}
