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
