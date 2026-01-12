import type { Db } from 'mongodb';
import type { ObjectId } from 'mongodb';
import type { ExtractionCheckpoint } from '../checkpoint/types';
import { MongoCheckpointRepository } from './checkpoint-repository';
import { GridFSImageStorage } from './image-storage';

export interface CheckpointStoreInterface {
  save(checkpoint: ExtractionCheckpoint): Promise<void>;
  load(id: string): Promise<ExtractionCheckpoint | null>;
  update(id: string, partial: Partial<ExtractionCheckpoint>): Promise<void>;
  list(): Promise<string[]>;
  delete(id: string): Promise<void>;
}

export class DatabaseCheckpointStore implements CheckpointStoreInterface {
  private repository: MongoCheckpointRepository;
  private imageStorage: GridFSImageStorage;

  constructor(db: Db) {
    this.repository = new MongoCheckpointRepository(db);
    this.imageStorage = new GridFSImageStorage(db);
  }

  async initialize(): Promise<void> {
    await this.repository.ensureIndexes();
  }

  async save(checkpoint: ExtractionCheckpoint): Promise<void> {
    const exists = await this.repository.exists(checkpoint.id);

    if (exists) {
      await this.update(checkpoint.id, checkpoint);
      return;
    }

    await this.repository.create(checkpoint);

    if (checkpoint.screenshots) {
      const viewportId = await this.imageStorage.upload(
        checkpoint.screenshots.viewport,
        `${checkpoint.id}_viewport.png`,
        { checkpointId: checkpoint.id, type: 'viewport', contentType: 'image/png' }
      );

      const fullPageId = await this.imageStorage.upload(
        checkpoint.screenshots.fullPage,
        `${checkpoint.id}_fullpage.png`,
        { checkpointId: checkpoint.id, type: 'fullPage', contentType: 'image/png' }
      );

      await this.repository.updateScreenshotIds(checkpoint.id, {
        viewport: viewportId,
        fullPage: fullPageId,
      });
    }
  }

  async load(id: string): Promise<ExtractionCheckpoint | null> {
    const checkpoint = await this.repository.findById(id);

    if (!checkpoint) {
      return null;
    }

    const screenshotIds = await this.repository.getScreenshotIds(id);

    if (screenshotIds?.viewport && screenshotIds?.fullPage) {
      try {
        const viewport = await this.imageStorage.download(screenshotIds.viewport as ObjectId);
        const fullPage = await this.imageStorage.download(screenshotIds.fullPage as ObjectId);

        checkpoint.screenshots = { viewport, fullPage };
      } catch {
        // Screenshots may have been deleted or corrupted
      }
    }

    return checkpoint;
  }

  async update(id: string, partial: Partial<ExtractionCheckpoint>): Promise<void> {
    const { screenshots, ...metadataUpdate } = partial;

    if (Object.keys(metadataUpdate).length > 0) {
      await this.repository.update(id, metadataUpdate);
    }

    if (screenshots) {
      const existingIds = await this.repository.getScreenshotIds(id);

      if (existingIds?.viewport) {
        await this.imageStorage.delete(existingIds.viewport as ObjectId);
      }
      if (existingIds?.fullPage) {
        await this.imageStorage.delete(existingIds.fullPage as ObjectId);
      }

      const viewportId = await this.imageStorage.upload(
        screenshots.viewport,
        `${id}_viewport.png`,
        { checkpointId: id, type: 'viewport', contentType: 'image/png' }
      );

      const fullPageId = await this.imageStorage.upload(
        screenshots.fullPage,
        `${id}_fullpage.png`,
        { checkpointId: id, type: 'fullPage', contentType: 'image/png' }
      );

      await this.repository.updateScreenshotIds(id, {
        viewport: viewportId,
        fullPage: fullPageId,
      });
    }
  }

  async list(): Promise<string[]> {
    const checkpoints = await this.repository.listRecent(1000);
    return checkpoints.map(cp => cp.id);
  }

  async delete(id: string): Promise<void> {
    await this.imageStorage.deleteByCheckpointId(id);
    await this.repository.delete(id);
  }

  async listByStatus(status: ExtractionCheckpoint['status']): Promise<ExtractionCheckpoint[]> {
    return this.repository.listByStatus(status);
  }

  async listRecent(limit: number): Promise<ExtractionCheckpoint[]> {
    return this.repository.listRecent(limit);
  }
}

export function createDatabaseCheckpointStore(db: Db): DatabaseCheckpointStore {
  return new DatabaseCheckpointStore(db);
}
