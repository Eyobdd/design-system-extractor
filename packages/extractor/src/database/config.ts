import type { DatabaseConfig } from './types';
import { DATABASE_NAME } from './types';

export interface DatabaseEnvironment {
  MONGODB_URI?: string;
  MONGODB_DATABASE?: string;
  MONGODB_MAX_POOL_SIZE?: string;
  MONGODB_MIN_POOL_SIZE?: string;
  MONGODB_CONNECT_TIMEOUT_MS?: string;
  [key: string]: string | undefined;
}

export function getDatabaseConfigFromEnv(env?: DatabaseEnvironment): DatabaseConfig {
  const resolvedEnv = env ?? (process.env as DatabaseEnvironment);
  const uri = resolvedEnv.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const config: DatabaseConfig = {
    uri,
    databaseName: resolvedEnv.MONGODB_DATABASE ?? DATABASE_NAME,
  };

  if (resolvedEnv.MONGODB_MAX_POOL_SIZE) {
    const maxPoolSize = parseInt(resolvedEnv.MONGODB_MAX_POOL_SIZE, 10);
    if (!isNaN(maxPoolSize) && maxPoolSize > 0) {
      config.maxPoolSize = maxPoolSize;
    }
  }

  if (resolvedEnv.MONGODB_MIN_POOL_SIZE) {
    const minPoolSize = parseInt(resolvedEnv.MONGODB_MIN_POOL_SIZE, 10);
    if (!isNaN(minPoolSize) && minPoolSize >= 0) {
      config.minPoolSize = minPoolSize;
    }
  }

  if (resolvedEnv.MONGODB_CONNECT_TIMEOUT_MS) {
    const connectTimeoutMs = parseInt(resolvedEnv.MONGODB_CONNECT_TIMEOUT_MS, 10);
    if (!isNaN(connectTimeoutMs) && connectTimeoutMs > 0) {
      config.connectTimeoutMs = connectTimeoutMs;
    }
  }

  return config;
}

export function validateDatabaseConfig(config: DatabaseConfig): string[] {
  const errors: string[] = [];

  if (!config.uri) {
    errors.push('Database URI is required');
  } else if (!config.uri.startsWith('mongodb://') && !config.uri.startsWith('mongodb+srv://')) {
    errors.push('Database URI must start with mongodb:// or mongodb+srv://');
  }

  if (config.maxPoolSize !== undefined && config.maxPoolSize < 1) {
    errors.push('maxPoolSize must be at least 1');
  }

  if (config.minPoolSize !== undefined && config.minPoolSize < 0) {
    errors.push('minPoolSize must be at least 0');
  }

  if (
    config.maxPoolSize !== undefined &&
    config.minPoolSize !== undefined &&
    config.minPoolSize > config.maxPoolSize
  ) {
    errors.push('minPoolSize cannot be greater than maxPoolSize');
  }

  if (config.connectTimeoutMs !== undefined && config.connectTimeoutMs < 1) {
    errors.push('connectTimeoutMs must be at least 1');
  }

  return errors;
}

export function isDatabaseConfigured(env?: DatabaseEnvironment): boolean {
  const resolvedEnv = env ?? (process.env as DatabaseEnvironment);
  return !!resolvedEnv.MONGODB_URI;
}
