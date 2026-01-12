import { MongoClient, Db } from 'mongodb';
import type { DatabaseConfig, HealthCheckResult } from './types';
import { DATABASE_NAME } from './types';

let client: MongoClient | null = null;
let db: Db | null = null;

export function getDefaultConfig(): DatabaseConfig {
  const uri = process.env['MONGODB_URI'];
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  return {
    uri,
    databaseName: process.env['MONGODB_DATABASE'] ?? DATABASE_NAME,
    maxPoolSize: 10,
    minPoolSize: 1,
    connectTimeoutMs: 10000,
  };
}

export async function connect(config?: DatabaseConfig): Promise<Db> {
  if (db) {
    return db;
  }

  const resolvedConfig = config ?? getDefaultConfig();

  const options: Record<string, unknown> = {};
  if (resolvedConfig.maxPoolSize !== undefined) {
    options['maxPoolSize'] = resolvedConfig.maxPoolSize;
  }
  if (resolvedConfig.minPoolSize !== undefined) {
    options['minPoolSize'] = resolvedConfig.minPoolSize;
  }
  if (resolvedConfig.connectTimeoutMs !== undefined) {
    options['connectTimeoutMS'] = resolvedConfig.connectTimeoutMs;
  }

  client = new MongoClient(resolvedConfig.uri, options);

  await client.connect();
  db = client.db(resolvedConfig.databaseName ?? DATABASE_NAME);

  return db;
}

export async function disconnect(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connect() first.');
  }
  return db;
}

export function getClient(): MongoClient {
  if (!client) {
    throw new Error('Database not connected. Call connect() first.');
  }
  return client;
}

export function isConnected(): boolean {
  return client !== null && db !== null;
}

export async function checkDatabaseHealth(config?: DatabaseConfig): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const wasConnected = isConnected();
    const database = wasConnected ? getDatabase() : await connect(config);

    const adminDb = database.admin();
    const serverInfo = await adminDb.serverInfo();

    const latencyMs = Date.now() - startTime;

    return {
      status: 'healthy',
      latencyMs,
      serverInfo: {
        version: serverInfo['version'] as string,
        host: client?.options?.hosts?.[0]?.toString() ?? 'unknown',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function withConnection<T>(
  fn: (db: Db) => Promise<T>,
  config?: DatabaseConfig
): Promise<T> {
  const database = await connect(config);
  return fn(database);
}

// For testing purposes - allows resetting the singleton
export function resetConnection(): void {
  client = null;
  db = null;
}
