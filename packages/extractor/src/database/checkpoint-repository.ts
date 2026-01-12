import { Collection, ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import type { ExtractionCheckpoint, ExtractionStatus } from '../checkpoint/types';
import type { CheckpointDocument } from './types';
import { COLLECTION_NAMES } from './types';

export interface CheckpointRepository {
  create(checkpoint: ExtractionCheckpoint): Promise<string>;
  findById(id: string): Promise<ExtractionCheckpoint | null>;
  update(id: string, partial: Partial<ExtractionCheckpoint>): Promise<void>;
  delete(id: string): Promise<void>;
  listByStatus(status: ExtractionStatus): Promise<ExtractionCheckpoint[]>;
  listRecent(limit: number): Promise<ExtractionCheckpoint[]>;
}

export class MongoCheckpointRepository implements CheckpointRepository {
  private collection: Collection<CheckpointDocument>;

  constructor(db: Db) {
    this.collection = db.collection<CheckpointDocument>(COLLECTION_NAMES.CHECKPOINTS);
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ checkpointId: 1 }, { unique: true });
    await this.collection.createIndex({ status: 1 });
    await this.collection.createIndex({ startedAt: -1 });
    await this.collection.createIndex({ updatedAt: -1 });
  }

  async create(checkpoint: ExtractionCheckpoint): Promise<string> {
    const doc: Omit<CheckpointDocument, '_id'> = {
      checkpointId: checkpoint.id,
      url: checkpoint.url,
      status: checkpoint.status,
      progress: checkpoint.progress,
      startedAt: checkpoint.startedAt,
      updatedAt: checkpoint.updatedAt,
      identifiedComponents: checkpoint.identifiedComponents,
      extractedTokens: checkpoint.extractedTokens as Record<string, unknown>,
      error: checkpoint.error,
    };

    const result = await this.collection.insertOne(doc as CheckpointDocument);
    return result.insertedId.toString();
  }

  async findById(id: string): Promise<ExtractionCheckpoint | null> {
    const doc = await this.collection.findOne({ checkpointId: id });
    if (!doc) {
      return null;
    }
    return this.documentToCheckpoint(doc);
  }

  async update(id: string, partial: Partial<ExtractionCheckpoint>): Promise<void> {
    const updateDoc: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (partial.status !== undefined) {
      updateDoc['status'] = partial.status;
    }
    if (partial.progress !== undefined) {
      updateDoc['progress'] = partial.progress;
    }
    if (partial.identifiedComponents !== undefined) {
      updateDoc['identifiedComponents'] = partial.identifiedComponents;
    }
    if (partial.extractedTokens !== undefined) {
      updateDoc['extractedTokens'] = partial.extractedTokens;
    }
    if (partial.error !== undefined) {
      updateDoc['error'] = partial.error;
    }

    await this.collection.updateOne({ checkpointId: id }, { $set: updateDoc });
  }

  async updateScreenshotIds(
    id: string,
    screenshotIds: { viewport?: ObjectId; fullPage?: ObjectId }
  ): Promise<void> {
    await this.collection.updateOne(
      { checkpointId: id },
      {
        $set: {
          screenshotIds,
          updatedAt: new Date(),
        },
      }
    );
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ checkpointId: id });
  }

  async listByStatus(status: ExtractionStatus): Promise<ExtractionCheckpoint[]> {
    const docs = await this.collection.find({ status }).sort({ updatedAt: -1 }).toArray();

    return docs.map(doc => this.documentToCheckpoint(doc));
  }

  async listRecent(limit: number): Promise<ExtractionCheckpoint[]> {
    const docs = await this.collection.find().sort({ startedAt: -1 }).limit(limit).toArray();

    return docs.map(doc => this.documentToCheckpoint(doc));
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.collection.countDocuments({ checkpointId: id }, { limit: 1 });
    return count > 0;
  }

  async getScreenshotIds(
    id: string
  ): Promise<{ viewport?: ObjectId | undefined; fullPage?: ObjectId | undefined } | null> {
    const doc = await this.collection.findOne(
      { checkpointId: id },
      { projection: { screenshotIds: 1 } }
    );
    return doc?.screenshotIds ?? null;
  }

  private documentToCheckpoint(doc: CheckpointDocument): ExtractionCheckpoint {
    return {
      id: doc.checkpointId,
      url: doc.url,
      status: doc.status,
      progress: doc.progress,
      startedAt: doc.startedAt,
      updatedAt: doc.updatedAt,
      identifiedComponents: doc.identifiedComponents,
      extractedTokens: doc.extractedTokens,
      error: doc.error,
    };
  }
}

export function createCheckpointRepository(db: Db): MongoCheckpointRepository {
  return new MongoCheckpointRepository(db);
}
