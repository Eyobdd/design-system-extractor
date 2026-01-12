// Database module - MongoDB Atlas integration
export {
  connect,
  disconnect,
  getDatabase,
  getClient,
  isConnected,
  checkDatabaseHealth,
  withConnection,
  getDefaultConfig,
  resetConnection,
} from './connection';

export {
  COLLECTION_NAMES,
  DATABASE_NAME,
  type CheckpointDocument,
  type ImageMetadata,
  type DatabaseConfig,
  type HealthCheckResult,
} from './types';

export {
  MongoCheckpointRepository,
  createCheckpointRepository,
  type CheckpointRepository,
} from './checkpoint-repository';

export { GridFSImageStorage, createImageStorage, type ImageStorage } from './image-storage';

export {
  DatabaseCheckpointStore,
  createDatabaseCheckpointStore,
  type CheckpointStoreInterface,
} from './database-checkpoint-store';
