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
import { DATABASE_NAME } from './types';

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
    it('creates a new connection with correct options', async () => {
      const config = {
        uri: 'mongodb://localhost:27017/test',
        maxPoolSize: 20,
      };
      const db = await connect(config);

      expect(db).toBeDefined();
      expect(MongoClient).toHaveBeenCalledWith(
        config.uri,
        expect.objectContaining({
          maxPoolSize: 20,
        })
      );
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

    it('returns database from the client', async () => {
      await connect({ uri: 'mongodb://localhost:27017/test' });
      const db = getDatabase();
      const client = getClient();
      expect(client.db).toHaveBeenCalledWith(DATABASE_NAME);
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
    it('executes the provided function with a database instance', async () => {
      const mockDbInstance = { collection: vi.fn() };
      vi.mocked(MongoClient).mockImplementationOnce(
        () =>
          ({
            connect: vi.fn().mockResolvedValue(undefined),
            db: vi.fn(() => mockDbInstance),
          }) as any
      );

      const fn = vi.fn().mockResolvedValue('success-result');

      const result = await withConnection(fn, {
        uri: 'mongodb://localhost:27017/test',
      });

      expect(fn).toHaveBeenCalledWith(mockDbInstance);
      expect(result).toBe('success-result');
    });
  });
});

describe('MongoCheckpointRepository', () => {
  const mockCollection = {
    createIndex: vi.fn().mockResolvedValue('index'),
    insertOne: vi.fn().mockResolvedValue({ insertedId: { toString: () => 'inserted-id' } }),
    findOne: vi.fn(),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        toArray: vi.fn().mockResolvedValue([]),
        limit: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    countDocuments: vi.fn().mockResolvedValue(0),
  };

  const mockDb = {
    collection: vi.fn(() => mockCollection),
  };

  let MongoCheckpointRepository: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('./checkpoint-repository');
    MongoCheckpointRepository = module.MongoCheckpointRepository;
  });

  describe('ensureIndexes', () => {
    it('creates required indexes', async () => {
      const repo = new MongoCheckpointRepository(mockDb as any);
      await repo.ensureIndexes();

      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { checkpointId: 1 },
        { unique: true }
      );
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ status: 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ startedAt: -1 });
    });
  });

  describe('create', () => {
    it('maps extraction checkpoint to database document correctly', async () => {
      const repo = new MongoCheckpointRepository(mockDb as any);
      const checkpoint = {
        id: 'test-id',
        url: 'https://example.com',
        status: 'pending',
        progress: 0,
        startedAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        identifiedComponents: [{ type: 'button', selector: '.btn', confidence: 0.9 }],
      };

      await repo.create(checkpoint as any);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          checkpointId: 'test-id',
          url: 'https://example.com',
          status: 'pending',
          identifiedComponents: expect.arrayContaining([
            expect.objectContaining({ type: 'button' }),
          ]),
        })
      );
    });
  });

  describe('findById', () => {
    it('returns null when not found', async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);
      const repo = new MongoCheckpointRepository(mockDb as any);

      const result = await repo.findById('non-existent');

      expect(result).toBeNull();
    });

    it('returns checkpoint when found', async () => {
      const startedAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const doc = {
        _id: { toString: () => 'obj-id' },
        checkpointId: 'test-id',
        url: 'https://example.com',
        status: 'pending',
        progress: 0,
        startedAt,
        updatedAt,
      };
      mockCollection.findOne.mockResolvedValueOnce(doc);
      const repo = new MongoCheckpointRepository(mockDb as any);

      const result = await repo.findById('test-id');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'test-id',
          url: 'https://example.com',
          status: 'pending',
          startedAt,
          updatedAt,
        })
      );
    });
  });

  describe('update', () => {
    it('updates checkpoint fields and sets updatedAt timestamp', async () => {
      const repo = new MongoCheckpointRepository(mockDb as any);
      const beforeUpdate = new Date();

      await repo.update('test-id', {
        status: 'screenshot',
        progress: 25,
      });

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { checkpointId: 'test-id' },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'screenshot',
            progress: 25,
            updatedAt: expect.any(Date),
          }),
        })
      );

      const callArgs = mockCollection.updateOne.mock.calls[0];
      const setPayload = callArgs[1].$set;
      expect(setPayload.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('delete', () => {
    it('deletes checkpoint by id', async () => {
      const repo = new MongoCheckpointRepository(mockDb as any);

      await repo.delete('test-id');

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        checkpointId: 'test-id',
      });
    });
  });

  describe('exists', () => {
    it('returns false when checkpoint does not exist', async () => {
      mockCollection.countDocuments.mockResolvedValueOnce(0);
      const repo = new MongoCheckpointRepository(mockDb as any);

      const result = await repo.exists('non-existent');

      expect(result).toBe(false);
    });

    it('returns true when checkpoint exists', async () => {
      mockCollection.countDocuments.mockResolvedValueOnce(1);
      const repo = new MongoCheckpointRepository(mockDb as any);

      const result = await repo.exists('test-id');

      expect(result).toBe(true);
    });
  });

  describe('updateScreenshotIds', () => {
    it('updates screenshot IDs for checkpoint', async () => {
      const repo = new MongoCheckpointRepository(mockDb as any);
      const viewportId = { toString: () => 'viewport-id' };
      const fullPageId = { toString: () => 'fullpage-id' };

      await repo.updateScreenshotIds('test-id', {
        viewport: viewportId as any,
        fullPage: fullPageId as any,
      });

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { checkpointId: 'test-id' },
        expect.objectContaining({
          $set: expect.objectContaining({
            screenshotIds: {
              viewport: viewportId,
              fullPage: fullPageId,
            },
          }),
        })
      );
    });
  });

  describe('listByStatus', () => {
    it('returns checkpoints filtered by status', async () => {
      const docs = [
        {
          _id: { toString: () => 'obj-1' },
          checkpointId: 'cp-1',
          url: 'https://example1.com',
          status: 'pending',
          progress: 0,
          startedAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: { toString: () => 'obj-2' },
          checkpointId: 'cp-2',
          url: 'https://example2.com',
          status: 'pending',
          progress: 0,
          startedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.find.mockReturnValueOnce({
        sort: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue(docs),
        })),
      } as any);

      const repo = new MongoCheckpointRepository(mockDb as any);
      const result = await repo.listByStatus('pending' as any);

      expect(mockCollection.find).toHaveBeenCalledWith({ status: 'pending' });
      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('cp-1');
      expect(result[1]?.id).toBe('cp-2');
    });
  });

  describe('listRecent', () => {
    it('returns recent checkpoints with limit', async () => {
      const docs = [
        {
          _id: { toString: () => 'obj-1' },
          checkpointId: 'cp-recent',
          url: 'https://recent.com',
          status: 'complete',
          progress: 100,
          startedAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.find.mockReturnValueOnce({
        sort: vi.fn(() => ({
          limit: vi.fn(() => ({
            toArray: vi.fn().mockResolvedValue(docs),
          })),
        })),
      } as any);

      const repo = new MongoCheckpointRepository(mockDb as any);
      const result = await repo.listRecent(5);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('cp-recent');
    });
  });

  describe('getScreenshotIds', () => {
    it('returns screenshot IDs when they exist', async () => {
      const screenshotIds = {
        viewport: { toString: () => 'viewport-id' },
        fullPage: { toString: () => 'fullpage-id' },
      };
      mockCollection.findOne.mockResolvedValueOnce({ screenshotIds });

      const repo = new MongoCheckpointRepository(mockDb as any);
      const result = await repo.getScreenshotIds('test-id');

      expect(mockCollection.findOne).toHaveBeenCalledWith(
        { checkpointId: 'test-id' },
        { projection: { screenshotIds: 1 } }
      );
      expect(result).toEqual(screenshotIds);
    });

    it('returns null when checkpoint not found', async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      const repo = new MongoCheckpointRepository(mockDb as any);
      const result = await repo.getScreenshotIds('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createCheckpointRepository', () => {
    it('creates a MongoCheckpointRepository instance', async () => {
      const { createCheckpointRepository } = await import('./checkpoint-repository');
      const repo = createCheckpointRepository(mockDb as any);

      expect(repo).toBeInstanceOf(MongoCheckpointRepository);
    });
  });

  describe('documentToCheckpoint (via findById)', () => {
    it('correctly maps all document fields to checkpoint', async () => {
      const startedAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const doc = {
        _id: { toString: () => 'obj-id' },
        checkpointId: 'test-id',
        url: 'https://example.com',
        status: 'vision',
        progress: 40,
        startedAt,
        updatedAt,
        identifiedComponents: [{ name: 'Button', type: 'button' }],
        extractedTokens: { colors: ['#fff'] },
        error: 'test error',
      };
      mockCollection.findOne.mockResolvedValueOnce(doc);

      const repo = new MongoCheckpointRepository(mockDb as any);
      const result = await repo.findById('test-id');

      expect(result).toEqual({
        id: 'test-id',
        url: 'https://example.com',
        status: 'vision',
        progress: 40,
        startedAt,
        updatedAt,
        identifiedComponents: [{ name: 'Button', type: 'button' }],
        extractedTokens: { colors: ['#fff'] },
        error: 'test error',
      });
    });
  });
});
