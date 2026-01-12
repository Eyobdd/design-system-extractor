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

  const mockGridFSBucket = vi.fn(() => ({
    openUploadStream: vi.fn(),
    openDownloadStream: vi.fn(),
    delete: vi.fn(),
  }));

  return {
    MongoClient: vi.fn(() => mockClient),
    ObjectId: vi.fn(id => ({ toString: () => id || 'mock-object-id' })),
    GridFSBucket: mockGridFSBucket,
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

describe('GridFSImageStorage', () => {
  describe('detectContentType (via module)', () => {
    it('detects PNG content type', async () => {
      const { GridFSImageStorage } = await import('./image-storage');

      // Access private method via prototype for testing
      const storage = Object.create(GridFSImageStorage.prototype);
      const detectContentType = (storage as { detectContentType: (f: string) => string })[
        'detectContentType'
      ].bind(storage);

      expect(detectContentType('test.png')).toBe('image/png');
      expect(detectContentType('test.PNG')).toBe('image/png');
    });

    it('detects JPEG content type', async () => {
      const { GridFSImageStorage } = await import('./image-storage');
      const storage = Object.create(GridFSImageStorage.prototype);
      const detectContentType = (storage as { detectContentType: (f: string) => string })[
        'detectContentType'
      ].bind(storage);

      expect(detectContentType('test.jpg')).toBe('image/jpeg');
      expect(detectContentType('test.jpeg')).toBe('image/jpeg');
    });

    it('detects GIF content type', async () => {
      const { GridFSImageStorage } = await import('./image-storage');
      const storage = Object.create(GridFSImageStorage.prototype);
      const detectContentType = (storage as { detectContentType: (f: string) => string })[
        'detectContentType'
      ].bind(storage);

      expect(detectContentType('test.gif')).toBe('image/gif');
    });

    it('detects WebP content type', async () => {
      const { GridFSImageStorage } = await import('./image-storage');
      const storage = Object.create(GridFSImageStorage.prototype);
      const detectContentType = (storage as { detectContentType: (f: string) => string })[
        'detectContentType'
      ].bind(storage);

      expect(detectContentType('test.webp')).toBe('image/webp');
    });

    it('returns octet-stream for unknown types', async () => {
      const { GridFSImageStorage } = await import('./image-storage');
      const storage = Object.create(GridFSImageStorage.prototype);
      const detectContentType = (storage as { detectContentType: (f: string) => string })[
        'detectContentType'
      ].bind(storage);

      expect(detectContentType('test.xyz')).toBe('application/octet-stream');
      expect(detectContentType('noextension')).toBe('application/octet-stream');
    });
  });

  describe('createImageStorage', () => {
    it('exports createImageStorage as a function', async () => {
      const { createImageStorage } = await import('./image-storage');
      expect(typeof createImageStorage).toBe('function');
    });
  });

  describe('ImageStorage interface', () => {
    it('GridFSImageStorage implements required methods', async () => {
      const { GridFSImageStorage } = await import('./image-storage');

      const methods = [
        'upload',
        'download',
        'delete',
        'getMetadata',
        'exists',
        'deleteByCheckpointId',
        'listByCheckpointId',
      ];

      for (const method of methods) {
        expect(
          typeof GridFSImageStorage.prototype[method as keyof typeof GridFSImageStorage.prototype]
        ).toBe('function');
      }
    });
  });

  describe('upload', () => {
    it('calls openUploadStream with correct parameters', async () => {
      const mockId = { toString: () => 'uploaded-id' };
      let finishCallback: (() => void) | null = null;

      const mockUploadStream = {
        id: mockId,
        write: vi.fn().mockReturnValue(true),
        end: vi.fn(),
        on: vi.fn().mockImplementation(function (this: any, event: string, cb: () => void) {
          if (event === 'finish') finishCallback = cb;
          return this;
        }),
        once: vi.fn().mockReturnThis(),
        emit: vi.fn(),
        removeListener: vi.fn().mockReturnThis(),
        writable: true,
      };

      const mockBucket = {
        openUploadStream: vi.fn().mockReturnValue(mockUploadStream),
      };

      const { GridFSImageStorage } = await import('./image-storage');
      const mockDb = { collection: vi.fn() } as any;
      const storage = new GridFSImageStorage(mockDb);
      (storage as any).bucket = mockBucket;

      const buffer = Buffer.from('test image data');
      const uploadPromise = storage.upload(buffer, 'test.png', { checkpointId: 'cp-1' });

      // Allow microtasks to run, then trigger finish
      await new Promise(resolve => setImmediate(resolve));
      if (finishCallback) (finishCallback as () => void)();

      const result = await uploadPromise;

      expect(mockBucket.openUploadStream).toHaveBeenCalledWith(
        'test.png',
        expect.objectContaining({
          contentType: 'image/png',
          metadata: expect.objectContaining({
            checkpointId: 'cp-1',
            uploadedAt: expect.any(Date),
          }),
        })
      );
      expect(result).toBe(mockId);
    });
  });

  describe('download', () => {
    it('calls openDownloadStream with correct ObjectId', async () => {
      const mockId = { toString: () => 'download-id' } as any;
      const testData = Buffer.from('downloaded image data');

      const mockDownloadStream = {
        on: vi.fn().mockImplementation(function (this: any, event: string, cb: any) {
          if (event === 'data') {
            setImmediate(() => cb(testData));
          } else if (event === 'end') {
            setImmediate(() => setImmediate(cb));
          }
          return this;
        }),
      };

      const mockBucket = {
        openDownloadStream: vi.fn().mockReturnValue(mockDownloadStream),
      };

      const { GridFSImageStorage } = await import('./image-storage');
      const mockDb = { collection: vi.fn() } as any;
      const storage = new GridFSImageStorage(mockDb);
      (storage as any).bucket = mockBucket;

      const result = await storage.download(mockId);

      expect(mockBucket.openDownloadStream).toHaveBeenCalledWith(mockId);
      expect(result).toEqual(testData);
    });
  });

  describe('getMetadata', () => {
    it('returns metadata when file exists', async () => {
      const mockId = { toString: () => 'meta-id' } as any;
      const uploadedAt = new Date('2024-01-01');
      const mockFile = {
        _id: mockId,
        contentType: 'image/png',
        metadata: {
          checkpointId: 'cp-1',
          type: 'viewport',
          uploadedAt,
        },
      };

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(mockFile),
      };
      const mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as any;

      const { GridFSImageStorage } = await import('./image-storage');
      const storage = new GridFSImageStorage(mockDb);

      const result = await storage.getMetadata(mockId);

      expect(mockDb.collection).toHaveBeenCalledWith('images.files');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: mockId });
      expect(result).toEqual({
        checkpointId: 'cp-1',
        type: 'viewport',
        contentType: 'image/png',
        uploadedAt,
      });
    });

    it('returns null when file does not exist', async () => {
      const mockId = { toString: () => 'nonexistent-id' } as any;

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      };
      const mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as any;

      const { GridFSImageStorage } = await import('./image-storage');
      const storage = new GridFSImageStorage(mockDb);

      const result = await storage.getMetadata(mockId);

      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('returns true when file exists', async () => {
      const mockId = { toString: () => 'exists-id' } as any;

      const mockCollection = {
        countDocuments: vi.fn().mockResolvedValue(1),
      };
      const mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as any;

      const { GridFSImageStorage } = await import('./image-storage');
      const storage = new GridFSImageStorage(mockDb);

      const result = await storage.exists(mockId);

      expect(mockCollection.countDocuments).toHaveBeenCalledWith({ _id: mockId }, { limit: 1 });
      expect(result).toBe(true);
    });

    it('returns false when file does not exist', async () => {
      const mockId = { toString: () => 'notexists-id' } as any;

      const mockCollection = {
        countDocuments: vi.fn().mockResolvedValue(0),
      };
      const mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as any;

      const { GridFSImageStorage } = await import('./image-storage');
      const storage = new GridFSImageStorage(mockDb);

      const result = await storage.exists(mockId);

      expect(result).toBe(false);
    });
  });

  describe('deleteByCheckpointId', () => {
    it('deletes all files for checkpoint and returns count', async () => {
      const mockFiles = [
        { _id: { toString: () => 'file-1' } },
        { _id: { toString: () => 'file-2' } },
      ];

      const mockCollection = {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockFiles),
        }),
      };
      const mockBucket = {
        delete: vi.fn().mockResolvedValue(undefined),
      };
      const mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as any;

      const { GridFSImageStorage } = await import('./image-storage');
      const storage = new GridFSImageStorage(mockDb);
      (storage as any).bucket = mockBucket;

      const result = await storage.deleteByCheckpointId('cp-1');

      expect(mockCollection.find).toHaveBeenCalledWith({ 'metadata.checkpointId': 'cp-1' });
      expect(mockBucket.delete).toHaveBeenCalledTimes(2);
      expect(result).toBe(2);
    });

    it('returns 0 when no files found for checkpoint', async () => {
      const mockCollection = {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      };
      const mockBucket = {
        delete: vi.fn(),
      };
      const mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as any;

      const { GridFSImageStorage } = await import('./image-storage');
      const storage = new GridFSImageStorage(mockDb);
      (storage as any).bucket = mockBucket;

      const result = await storage.deleteByCheckpointId('cp-nonexistent');

      expect(mockBucket.delete).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe('listByCheckpointId', () => {
    it('returns list of files for checkpoint', async () => {
      const mockFiles = [
        {
          _id: { toString: () => 'file-1' },
          filename: 'viewport.png',
          metadata: { type: 'viewport' },
        },
        {
          _id: { toString: () => 'file-2' },
          filename: 'fullpage.png',
          metadata: { type: 'fullPage' },
        },
      ];

      const mockCollection = {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockFiles),
        }),
      };
      const mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as any;

      const { GridFSImageStorage } = await import('./image-storage');
      const storage = new GridFSImageStorage(mockDb);

      const result = await storage.listByCheckpointId('cp-1');

      expect(mockCollection.find).toHaveBeenCalledWith({ 'metadata.checkpointId': 'cp-1' });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockFiles[0]._id,
        filename: 'viewport.png',
        type: 'viewport',
      });
      expect(result[1]).toEqual({
        id: mockFiles[1]._id,
        filename: 'fullpage.png',
        type: 'fullPage',
      });
    });

    it('returns empty array when no files for checkpoint', async () => {
      const mockCollection = {
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      };
      const mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection),
      } as any;

      const { GridFSImageStorage } = await import('./image-storage');
      const storage = new GridFSImageStorage(mockDb);

      const result = await storage.listByCheckpointId('cp-empty');

      expect(result).toHaveLength(0);
    });
  });
});

describe('DatabaseCheckpointStore', () => {
  const mockRepository = {
    ensureIndexes: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
    create: vi.fn().mockResolvedValue('created-id'),
    findById: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    updateScreenshotIds: vi.fn().mockResolvedValue(undefined),
    getScreenshotIds: vi.fn(),
    listByStatus: vi.fn().mockResolvedValue([]),
    listRecent: vi.fn().mockResolvedValue([]),
  };

  const mockImageStorage = {
    upload: vi.fn().mockResolvedValue({ toString: () => 'uploaded-id' }),
    download: vi.fn().mockResolvedValue(Buffer.from('image data')),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteByCheckpointId: vi.fn().mockResolvedValue(2),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('calls repository.ensureIndexes', async () => {
      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;

      await store.initialize();

      expect(mockRepository.ensureIndexes).toHaveBeenCalledTimes(1);
    });
  });

  describe('save', () => {
    it('creates new checkpoint when it does not exist', async () => {
      mockRepository.exists.mockResolvedValueOnce(false);

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;
      (store as any).imageStorage = mockImageStorage;

      const checkpoint = {
        id: 'cp-1',
        url: 'https://example.com',
        status: 'pending' as const,
        progress: 0,
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      await store.save(checkpoint);

      expect(mockRepository.exists).toHaveBeenCalledWith('cp-1');
      expect(mockRepository.create).toHaveBeenCalledWith(checkpoint);
    });

    it('updates existing checkpoint instead of creating', async () => {
      mockRepository.exists.mockResolvedValueOnce(true);

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;
      (store as any).imageStorage = mockImageStorage;

      const checkpoint = {
        id: 'cp-existing',
        url: 'https://example.com',
        status: 'pending' as const,
        progress: 50,
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      await store.save(checkpoint);

      expect(mockRepository.exists).toHaveBeenCalledWith('cp-existing');
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('uploads screenshots and updates IDs when screenshots provided', async () => {
      mockRepository.exists.mockResolvedValueOnce(false);
      const viewportId = { toString: () => 'viewport-id' };
      const fullPageId = { toString: () => 'fullpage-id' };
      mockImageStorage.upload.mockResolvedValueOnce(viewportId).mockResolvedValueOnce(fullPageId);

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;
      (store as any).imageStorage = mockImageStorage;

      const checkpoint = {
        id: 'cp-with-screenshots',
        url: 'https://example.com',
        status: 'screenshot' as const,
        progress: 25,
        startedAt: new Date(),
        updatedAt: new Date(),
        screenshots: {
          viewport: Buffer.from('viewport image'),
          fullPage: Buffer.from('fullpage image'),
        },
      };

      await store.save(checkpoint);

      expect(mockImageStorage.upload).toHaveBeenCalledTimes(2);
      expect(mockImageStorage.upload).toHaveBeenCalledWith(
        checkpoint.screenshots.viewport,
        'cp-with-screenshots_viewport.png',
        expect.objectContaining({ checkpointId: 'cp-with-screenshots', type: 'viewport' })
      );
      expect(mockRepository.updateScreenshotIds).toHaveBeenCalledWith('cp-with-screenshots', {
        viewport: viewportId,
        fullPage: fullPageId,
      });
    });
  });

  describe('load', () => {
    it('returns null when checkpoint not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;

      const result = await store.load('nonexistent');

      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith('nonexistent');
    });

    it('returns checkpoint without screenshots when none stored', async () => {
      const checkpoint = {
        id: 'cp-1',
        url: 'https://example.com',
        status: 'pending',
        progress: 0,
        startedAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findById.mockResolvedValueOnce(checkpoint);
      mockRepository.getScreenshotIds.mockResolvedValueOnce(null);

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;

      const result = await store.load('cp-1');

      expect(result).toEqual(checkpoint);
      expect(result?.screenshots).toBeUndefined();
    });

    it('downloads and attaches screenshots when IDs exist', async () => {
      const checkpoint = {
        id: 'cp-1',
        url: 'https://example.com',
        status: 'screenshot',
        progress: 25,
        startedAt: new Date(),
        updatedAt: new Date(),
      };
      const screenshotIds = {
        viewport: { toString: () => 'viewport-id' },
        fullPage: { toString: () => 'fullpage-id' },
      };
      const viewportBuffer = Buffer.from('viewport data');
      const fullPageBuffer = Buffer.from('fullpage data');

      mockRepository.findById.mockResolvedValueOnce(checkpoint);
      mockRepository.getScreenshotIds.mockResolvedValueOnce(screenshotIds);
      mockImageStorage.download
        .mockResolvedValueOnce(viewportBuffer)
        .mockResolvedValueOnce(fullPageBuffer);

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;
      (store as any).imageStorage = mockImageStorage;

      const result = await store.load('cp-1');

      expect(mockImageStorage.download).toHaveBeenCalledTimes(2);
      expect(result?.screenshots).toEqual({
        viewport: viewportBuffer,
        fullPage: fullPageBuffer,
      });
    });
  });

  describe('update', () => {
    it('updates metadata fields via repository', async () => {
      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;
      (store as any).imageStorage = mockImageStorage;

      await store.update('cp-1', { status: 'vision' as const, progress: 50 });

      expect(mockRepository.update).toHaveBeenCalledWith('cp-1', {
        status: 'vision',
        progress: 50,
      });
    });

    it('replaces screenshots when provided in update', async () => {
      const existingIds = {
        viewport: { toString: () => 'old-viewport' },
        fullPage: { toString: () => 'old-fullpage' },
      };
      const newViewportId = { toString: () => 'new-viewport' };
      const newFullPageId = { toString: () => 'new-fullpage' };

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;
      (store as any).imageStorage = mockImageStorage;

      mockRepository.getScreenshotIds.mockResolvedValueOnce(existingIds);
      mockImageStorage.upload
        .mockResolvedValueOnce(newViewportId)
        .mockResolvedValueOnce(newFullPageId);

      const newScreenshots = {
        viewport: Buffer.from('new viewport'),
        fullPage: Buffer.from('new fullpage'),
      };

      await store.update('cp-1', { screenshots: newScreenshots });

      expect(mockImageStorage.delete).toHaveBeenCalledWith(existingIds.viewport);
      expect(mockImageStorage.delete).toHaveBeenCalledWith(existingIds.fullPage);
      expect(mockImageStorage.upload).toHaveBeenCalledTimes(2);
      expect(mockRepository.updateScreenshotIds).toHaveBeenCalledWith('cp-1', {
        viewport: newViewportId,
        fullPage: newFullPageId,
      });
    });
  });

  describe('list', () => {
    it('returns array of checkpoint IDs', async () => {
      const checkpoints = [
        { id: 'cp-1', url: 'https://example1.com' },
        { id: 'cp-2', url: 'https://example2.com' },
        { id: 'cp-3', url: 'https://example3.com' },
      ];
      mockRepository.listRecent.mockResolvedValueOnce(checkpoints);

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;

      const result = await store.list();

      expect(mockRepository.listRecent).toHaveBeenCalledWith(1000);
      expect(result).toEqual(['cp-1', 'cp-2', 'cp-3']);
    });

    it('returns empty array when no checkpoints', async () => {
      mockRepository.listRecent.mockResolvedValueOnce([]);

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;

      const result = await store.list();

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('deletes images and checkpoint', async () => {
      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;
      (store as any).imageStorage = mockImageStorage;

      await store.delete('cp-1');

      expect(mockImageStorage.deleteByCheckpointId).toHaveBeenCalledWith('cp-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('cp-1');
    });

    it('deletes images before checkpoint data', async () => {
      const callOrder: string[] = [];
      mockImageStorage.deleteByCheckpointId.mockImplementationOnce(() => {
        callOrder.push('images');
        return Promise.resolve(1);
      });
      mockRepository.delete.mockImplementationOnce(() => {
        callOrder.push('checkpoint');
        return Promise.resolve();
      });

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;
      (store as any).imageStorage = mockImageStorage;

      await store.delete('cp-1');

      expect(callOrder).toEqual(['images', 'checkpoint']);
    });
  });

  describe('listByStatus', () => {
    it('delegates to repository.listByStatus', async () => {
      const checkpoints = [
        { id: 'cp-1', status: 'pending', progress: 0 },
        { id: 'cp-2', status: 'pending', progress: 0 },
      ];
      mockRepository.listByStatus.mockResolvedValueOnce(checkpoints);

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;

      const result = await store.listByStatus('pending');

      expect(mockRepository.listByStatus).toHaveBeenCalledWith('pending');
      expect(result).toEqual(checkpoints);
    });
  });

  describe('listRecent', () => {
    it('delegates to repository.listRecent with limit', async () => {
      const checkpoints = [{ id: 'cp-recent', status: 'complete', progress: 100 }];
      mockRepository.listRecent.mockResolvedValueOnce(checkpoints);

      const { DatabaseCheckpointStore } = await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;
      const store = new DatabaseCheckpointStore(mockDb);

      (store as any).repository = mockRepository;

      const result = await store.listRecent(10);

      expect(mockRepository.listRecent).toHaveBeenCalledWith(10);
      expect(result).toEqual(checkpoints);
    });
  });

  describe('createDatabaseCheckpointStore', () => {
    it('returns a DatabaseCheckpointStore instance', async () => {
      const { createDatabaseCheckpointStore, DatabaseCheckpointStore } =
        await import('./database-checkpoint-store');
      const mockDb = { collection: vi.fn() } as any;

      const store = createDatabaseCheckpointStore(mockDb);

      expect(store).toBeInstanceOf(DatabaseCheckpointStore);
    });
  });
});

describe('Database Config', () => {
  describe('getDatabaseConfigFromEnv', () => {
    it('returns config from environment', async () => {
      const { getDatabaseConfigFromEnv } = await import('./config');

      const env = {
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_DATABASE: 'test_db',
      };

      const config = getDatabaseConfigFromEnv(env);

      expect(config.uri).toBe('mongodb://localhost:27017');
      expect(config.databaseName).toBe('test_db');
    });

    it('supports mongodb+srv:// URI format', async () => {
      const { getDatabaseConfigFromEnv } = await import('./config');

      const env = {
        MONGODB_URI: 'mongodb+srv://cluster.mongodb.net',
      };

      const config = getDatabaseConfigFromEnv(env);

      expect(config.uri).toBe('mongodb+srv://cluster.mongodb.net');
    });

    it('uses default database name when not provided', async () => {
      const { getDatabaseConfigFromEnv } = await import('./config');

      const env = {
        MONGODB_URI: 'mongodb://localhost:27017',
      };

      const config = getDatabaseConfigFromEnv(env);

      expect(config.databaseName).toBe('design_extractor');
    });

    it('throws error when MONGODB_URI is missing', async () => {
      const { getDatabaseConfigFromEnv } = await import('./config');

      expect(() => getDatabaseConfigFromEnv({})).toThrow(
        'MONGODB_URI environment variable is required'
      );
    });

    it('parses pool size settings', async () => {
      const { getDatabaseConfigFromEnv } = await import('./config');

      const env = {
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_MAX_POOL_SIZE: '20',
        MONGODB_MIN_POOL_SIZE: '5',
        MONGODB_CONNECT_TIMEOUT_MS: '5000',
      };

      const config = getDatabaseConfigFromEnv(env);

      expect(config.maxPoolSize).toBe(20);
      expect(config.minPoolSize).toBe(5);
      expect(config.connectTimeoutMs).toBe(5000);
    });

    it('accepts zero as valid minPoolSize', async () => {
      const { getDatabaseConfigFromEnv } = await import('./config');

      const env = {
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_MIN_POOL_SIZE: '0',
      };

      const config = getDatabaseConfigFromEnv(env);

      expect(config.minPoolSize).toBe(0);
    });

    it('ignores invalid pool size values', async () => {
      const { getDatabaseConfigFromEnv } = await import('./config');

      const env = {
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_MAX_POOL_SIZE: 'invalid',
        MONGODB_MIN_POOL_SIZE: '-5',
      };

      const config = getDatabaseConfigFromEnv(env);

      expect(config.maxPoolSize).toBeUndefined();
      expect(config.minPoolSize).toBeUndefined();
    });

    it('ignores zero and negative maxPoolSize', async () => {
      const { getDatabaseConfigFromEnv } = await import('./config');

      const zeroConfig = getDatabaseConfigFromEnv({
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_MAX_POOL_SIZE: '0',
      });
      expect(zeroConfig.maxPoolSize).toBeUndefined();

      const negativeConfig = getDatabaseConfigFromEnv({
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_MAX_POOL_SIZE: '-10',
      });
      expect(negativeConfig.maxPoolSize).toBeUndefined();
    });

    it('ignores invalid connectTimeoutMs values', async () => {
      const { getDatabaseConfigFromEnv } = await import('./config');

      const invalidConfig = getDatabaseConfigFromEnv({
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_CONNECT_TIMEOUT_MS: 'abc',
      });
      expect(invalidConfig.connectTimeoutMs).toBeUndefined();

      const zeroConfig = getDatabaseConfigFromEnv({
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_CONNECT_TIMEOUT_MS: '0',
      });
      expect(zeroConfig.connectTimeoutMs).toBeUndefined();
    });
  });

  describe('validateDatabaseConfig', () => {
    it('returns empty array for valid config with mongodb://', async () => {
      const { validateDatabaseConfig } = await import('./config');

      const errors = validateDatabaseConfig({
        uri: 'mongodb://localhost:27017',
        maxPoolSize: 10,
        minPoolSize: 2,
      });

      expect(errors).toHaveLength(0);
    });

    it('returns empty array for valid config with mongodb+srv://', async () => {
      const { validateDatabaseConfig } = await import('./config');

      const errors = validateDatabaseConfig({
        uri: 'mongodb+srv://cluster.mongodb.net',
      });

      expect(errors).toHaveLength(0);
    });

    it('returns error for missing URI', async () => {
      const { validateDatabaseConfig } = await import('./config');

      const errors = validateDatabaseConfig({ uri: '' });

      expect(errors).toContain('Database URI is required');
    });

    it('returns error for invalid URI prefix', async () => {
      const { validateDatabaseConfig } = await import('./config');

      const errors = validateDatabaseConfig({ uri: 'http://localhost:27017' });

      expect(errors).toContain('Database URI must start with mongodb:// or mongodb+srv://');
    });

    it('returns error for maxPoolSize less than 1', async () => {
      const { validateDatabaseConfig } = await import('./config');

      const errors = validateDatabaseConfig({
        uri: 'mongodb://localhost:27017',
        maxPoolSize: 0,
      });

      expect(errors).toContain('maxPoolSize must be at least 1');
    });

    it('returns error for negative minPoolSize', async () => {
      const { validateDatabaseConfig } = await import('./config');

      const errors = validateDatabaseConfig({
        uri: 'mongodb://localhost:27017',
        minPoolSize: -1,
      });

      expect(errors).toContain('minPoolSize must be at least 0');
    });

    it('returns error for connectTimeoutMs less than 1', async () => {
      const { validateDatabaseConfig } = await import('./config');

      const errors = validateDatabaseConfig({
        uri: 'mongodb://localhost:27017',
        connectTimeoutMs: 0,
      });

      expect(errors).toContain('connectTimeoutMs must be at least 1');
    });

    it('returns error when minPoolSize exceeds maxPoolSize', async () => {
      const { validateDatabaseConfig } = await import('./config');

      const errors = validateDatabaseConfig({
        uri: 'mongodb://localhost:27017',
        maxPoolSize: 5,
        minPoolSize: 10,
      });

      expect(errors).toContain('minPoolSize cannot be greater than maxPoolSize');
    });

    it('accumulates multiple validation errors', async () => {
      const { validateDatabaseConfig } = await import('./config');

      const errors = validateDatabaseConfig({
        uri: 'http://invalid',
        maxPoolSize: 0,
        minPoolSize: -1,
        connectTimeoutMs: 0,
      });

      expect(errors).toHaveLength(4);
      expect(errors).toContain('Database URI must start with mongodb:// or mongodb+srv://');
      expect(errors).toContain('maxPoolSize must be at least 1');
      expect(errors).toContain('minPoolSize must be at least 0');
      expect(errors).toContain('connectTimeoutMs must be at least 1');
    });
  });

  describe('isDatabaseConfigured', () => {
    it('returns true when MONGODB_URI is set', async () => {
      const { isDatabaseConfigured } = await import('./config');

      expect(isDatabaseConfigured({ MONGODB_URI: 'mongodb://localhost' })).toBe(true);
    });

    it('returns false when MONGODB_URI is not set', async () => {
      const { isDatabaseConfigured } = await import('./config');

      expect(isDatabaseConfigured({})).toBe(false);
    });

    it('returns false when MONGODB_URI is undefined', async () => {
      const { isDatabaseConfigured } = await import('./config');

      expect(isDatabaseConfigured({ MONGODB_URI: undefined })).toBe(false);
    });

    it('returns true even for empty string (truthy check)', async () => {
      const { isDatabaseConfigured } = await import('./config');

      // Empty string is falsy, so returns false
      expect(isDatabaseConfigured({ MONGODB_URI: '' })).toBe(false);
    });
  });
});
