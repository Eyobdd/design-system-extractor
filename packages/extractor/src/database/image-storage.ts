import { GridFSBucket, ObjectId } from 'mongodb';
import type { Db } from 'mongodb';
import { Readable } from 'stream';
import type { ImageMetadata } from './types';

export interface ImageStorage {
  upload(buffer: Buffer, filename: string, metadata?: Partial<ImageMetadata>): Promise<ObjectId>;
  download(id: ObjectId): Promise<Buffer>;
  delete(id: ObjectId): Promise<void>;
  getMetadata(id: ObjectId): Promise<ImageMetadata | null>;
}

export class GridFSImageStorage implements ImageStorage {
  private bucket: GridFSBucket;
  private db: Db;

  constructor(db: Db, bucketName: string = 'images') {
    this.db = db;
    this.bucket = new GridFSBucket(db, { bucketName });
  }

  async upload(
    buffer: Buffer,
    filename: string,
    metadata?: Partial<ImageMetadata>
  ): Promise<ObjectId> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.bucket.openUploadStream(filename, {
        contentType: this.detectContentType(filename),
        metadata: {
          ...metadata,
          uploadedAt: new Date(),
        },
      });

      const readable = Readable.from(buffer);

      readable
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => {
          resolve(uploadStream.id);
        });
    });
  }

  async download(id: ObjectId): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const downloadStream = this.bucket.openDownloadStream(id);

      downloadStream
        .on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        })
        .on('error', reject)
        .on('end', () => {
          resolve(Buffer.concat(chunks));
        });
    });
  }

  async delete(id: ObjectId): Promise<void> {
    await this.bucket.delete(id);
  }

  async getMetadata(id: ObjectId): Promise<ImageMetadata | null> {
    const filesCollection = this.db.collection('images.files');
    const file = await filesCollection.findOne({ _id: id });

    if (!file) {
      return null;
    }

    const metadata = file['metadata'] as Record<string, unknown> | undefined;

    return {
      checkpointId: (metadata?.['checkpointId'] as string) ?? '',
      type: (metadata?.['type'] as 'viewport' | 'fullPage' | 'comparison') ?? 'viewport',
      contentType: (file['contentType'] as string) ?? 'image/png',
      uploadedAt: (metadata?.['uploadedAt'] as Date) ?? new Date(),
    };
  }

  async exists(id: ObjectId): Promise<boolean> {
    const filesCollection = this.db.collection('images.files');
    const count = await filesCollection.countDocuments({ _id: id }, { limit: 1 });
    return count > 0;
  }

  async deleteByCheckpointId(checkpointId: string): Promise<number> {
    const filesCollection = this.db.collection('images.files');
    const files = await filesCollection.find({ 'metadata.checkpointId': checkpointId }).toArray();

    let deletedCount = 0;
    for (const file of files) {
      await this.bucket.delete(file['_id'] as ObjectId);
      deletedCount++;
    }

    return deletedCount;
  }

  async listByCheckpointId(
    checkpointId: string
  ): Promise<Array<{ id: ObjectId; filename: string; type: string }>> {
    const filesCollection = this.db.collection('images.files');
    const files = await filesCollection.find({ 'metadata.checkpointId': checkpointId }).toArray();

    return files.map(file => ({
      id: file['_id'] as ObjectId,
      filename: file['filename'] as string,
      type:
        ((file['metadata'] as Record<string, unknown> | undefined)?.['type'] as string) ??
        'unknown',
    }));
  }

  private detectContentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'application/octet-stream';
    }
  }
}

export function createImageStorage(db: Db, bucketName?: string): GridFSImageStorage {
  return new GridFSImageStorage(db, bucketName);
}
