import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MongoClient } from 'mongodb';

// Mock mongodb
vi.mock('mongodb', () => {
  const mockDb = {
    admin: vi.fn(() => ({
      serverInfo: vi.fn().mockResolvedValue({ version: '7.0.0' }),
    })),
    collection: vi.fn(),
  };

  const mockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    db: vi.fn(() => mockDb),
    options: {
      hosts: [{ toString: () => 'localhost:27017' }],
    },
  };

  return {
    MongoClient: vi.fn(() => mockClient),
    ObjectId: vi.fn(id => ({ toString: () => id || 'mock-object-id' })),
  };
});

import {
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
import { COLLECTION_NAMES, DATABASE_NAME } from './types';

describe('Database Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConnection();
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017/test';
  });

  afterEach(() => {
    delete process.env['MONGODB_URI'];
    resetConnection();
  });

  describe('getDefaultConfig', () => {
    it('throws if MONGODB_URI is not set', () => {
      delete process.env['MONGODB_URI'];
      expect(() => getDefaultConfig()).toThrow('MONGODB_URI environment variable is not set');
    });

    it('returns config with defaults', () => {
      const config = getDefaultConfig();
      expect(config.uri).toBe('mongodb://localhost:27017/test');
      expect(config.databaseName).toBe(DATABASE_NAME);
      expect(config.maxPoolSize).toBe(10);
    });

    it('uses custom database name from env', () => {
      process.env['MONGODB_DATABASE'] = 'custom_db';
      const config = getDefaultConfig();
      expect(config.databaseName).toBe('custom_db');
      delete process.env['MONGODB_DATABASE'];
    });
  });

  describe('connect', () => {
    it('creates a new connection', async () => {
      const db = await connect({
        uri: 'mongodb://localhost:27017/test',
      });

      expect(db).toBeDefined();
      expect(MongoClient).toHaveBeenCalled();
    });

    it('reuses existing connection', async () => {
      const db1 = await connect({
        uri: 'mongodb://localhost:27017/test',
      });
      const db2 = await connect({
        uri: 'mongodb://localhost:27017/test',
      });

      expect(db1).toBe(db2);
      expect(MongoClient).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('closes the connection', async () => {
      await connect({ uri: 'mongodb://localhost:27017/test' });
      expect(isConnected()).toBe(true);

      await disconnect();
      expect(isConnected()).toBe(false);
    });

    it('handles disconnect when not connected', async () => {
      await expect(disconnect()).resolves.not.toThrow();
    });
  });

  describe('getDatabase', () => {
    it('throws if not connected', () => {
      expect(() => getDatabase()).toThrow('Database not connected');
    });

    it('returns database after connection', async () => {
      await connect({ uri: 'mongodb://localhost:27017/test' });
      const db = getDatabase();
      expect(db).toBeDefined();
    });
  });

  describe('getClient', () => {
    it('throws if not connected', () => {
      expect(() => getClient()).toThrow('Database not connected');
    });

    it('returns client after connection', async () => {
      await connect({ uri: 'mongodb://localhost:27017/test' });
      const client = getClient();
      expect(client).toBeDefined();
    });
  });

  describe('isConnected', () => {
    it('returns false when not connected', () => {
      expect(isConnected()).toBe(false);
    });

    it('returns true when connected', async () => {
      await connect({ uri: 'mongodb://localhost:27017/test' });
      expect(isConnected()).toBe(true);
    });
  });

  describe('checkDatabaseHealth', () => {
    it('returns healthy status when connected', async () => {
      const result = await checkDatabaseHealth({
        uri: 'mongodb://localhost:27017/test',
      });

      expect(result.status).toBe('healthy');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.serverInfo?.version).toBe('7.0.0');
    });

    it('returns unhealthy status on error', async () => {
      vi.mocked(MongoClient).mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      resetConnection();
      const result = await checkDatabaseHealth({
        uri: 'mongodb://invalid:27017/test',
      });

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('withConnection', () => {
    it('executes function with database', async () => {
      const fn = vi.fn().mockResolvedValue('result');

      const result = await withConnection(fn, {
        uri: 'mongodb://localhost:27017/test',
      });

      expect(fn).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });
});

describe('Database Types', () => {
  describe('COLLECTION_NAMES', () => {
    it('defines checkpoint collection', () => {
      expect(COLLECTION_NAMES.CHECKPOINTS).toBe('checkpoints');
    });

    it('defines image collections', () => {
      expect(COLLECTION_NAMES.IMAGES).toBe('images.files');
      expect(COLLECTION_NAMES.IMAGE_CHUNKS).toBe('images.chunks');
    });
  });

  describe('DATABASE_NAME', () => {
    it('has default database name', () => {
      expect(DATABASE_NAME).toBe('design_extractor');
    });
  });
});
