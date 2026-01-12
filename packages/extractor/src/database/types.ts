import type { ObjectId } from 'mongodb';
import type { ExtractionStatus, ComponentIdentification } from '../checkpoint/types';

export const COLLECTION_NAMES = {
  CHECKPOINTS: 'checkpoints',
  IMAGES: 'images.files',
  IMAGE_CHUNKS: 'images.chunks',
} as const;

export const DATABASE_NAME = 'design_extractor';

export interface CheckpointDocument {
  _id: ObjectId;
  checkpointId: string;
  url: string;
  status: ExtractionStatus;
  progress: number;
  startedAt: Date;
  updatedAt: Date;
  screenshotIds?:
    | {
        viewport?: ObjectId | undefined;
        fullPage?: ObjectId | undefined;
      }
    | undefined;
  identifiedComponents?: ComponentIdentification[] | undefined;
  extractedTokens?: Record<string, unknown> | undefined;
  comparisonIds?: ObjectId[] | undefined;
  error?: string | undefined;
}

export interface ImageMetadata {
  checkpointId: string;
  type: 'viewport' | 'fullPage' | 'comparison';
  contentType: string;
  uploadedAt: Date;
}

export interface DatabaseConfig {
  uri: string;
  databaseName?: string | undefined;
  maxPoolSize?: number | undefined;
  minPoolSize?: number | undefined;
  connectTimeoutMs?: number | undefined;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  serverInfo?:
    | {
        version: string;
        host: string;
      }
    | undefined;
  error?: string | undefined;
}
