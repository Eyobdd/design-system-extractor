import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, getLogsForCheckpoint, getAllLogs, clearLogs } from './extraction-logger';

describe('extraction-logger', () => {
  const originalEnv = process.env['LOG_LEVEL'];

  beforeEach(() => {
    clearLogs();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalEnv !== undefined) {
      process.env['LOG_LEVEL'] = originalEnv;
    } else {
      delete process.env['LOG_LEVEL'];
    }
  });

  describe('createLogger', () => {
    it('creates a logger with all log level methods', () => {
      const logger = createLogger('test-checkpoint');

      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('associates logs with the checkpoint ID', () => {
      const logger = createLogger('checkpoint-123');

      logger.info('Test message');

      const logs = getLogsForCheckpoint('checkpoint-123');
      expect(logs).toHaveLength(1);
      expect(logs[0]?.checkpointId).toBe('checkpoint-123');
    });
  });

  describe('log levels', () => {
    it('logs debug messages', () => {
      process.env['LOG_LEVEL'] = 'debug';
      const logger = createLogger('test');

      logger.debug('Debug message', { key: 'value' });

      const logs = getAllLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe('debug');
      expect(logs[0]?.message).toBe('Debug message');
      expect(logs[0]?.data).toEqual({ key: 'value' });
    });

    it('logs info messages', () => {
      const logger = createLogger('test');

      logger.info('Info message');

      const logs = getAllLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe('info');
      expect(logs[0]?.message).toBe('Info message');
    });

    it('logs warn messages', () => {
      const logger = createLogger('test');

      logger.warn('Warning message');

      const logs = getAllLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe('warn');
    });

    it('logs error messages', () => {
      const logger = createLogger('test');

      logger.error('Error message', { error: 'details' });

      const logs = getAllLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.level).toBe('error');
      expect(logs[0]?.data).toEqual({ error: 'details' });
    });

    it('includes timestamp in log entries', () => {
      const before = new Date();
      const logger = createLogger('test');

      logger.info('Test');

      const after = new Date();
      const logs = getAllLogs();
      expect(logs[0]?.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(logs[0]?.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('log filtering by level', () => {
    it('outputs debug when LOG_LEVEL is debug', () => {
      process.env['LOG_LEVEL'] = 'debug';
      const logger = createLogger('test');

      logger.debug('Debug message');

      expect(console.debug).toHaveBeenCalled();
    });

    it('does not output debug when LOG_LEVEL is info', () => {
      process.env['LOG_LEVEL'] = 'info';
      const logger = createLogger('test');

      logger.debug('Debug message');

      expect(console.debug).not.toHaveBeenCalled();
    });

    it('outputs info when LOG_LEVEL is info', () => {
      process.env['LOG_LEVEL'] = 'info';
      const logger = createLogger('test');

      logger.info('Info message');

      expect(console.info).toHaveBeenCalled();
    });

    it('outputs warn when LOG_LEVEL is warn', () => {
      process.env['LOG_LEVEL'] = 'warn';
      const logger = createLogger('test');

      logger.warn('Warning');

      expect(console.warn).toHaveBeenCalled();
    });

    it('outputs error at any LOG_LEVEL', () => {
      process.env['LOG_LEVEL'] = 'error';
      const logger = createLogger('test');

      logger.error('Error');

      expect(console.error).toHaveBeenCalled();
    });

    it('defaults to info level when LOG_LEVEL is not set', () => {
      delete process.env['LOG_LEVEL'];
      const logger = createLogger('test');

      logger.debug('Should not appear');
      logger.info('Should appear');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('getLogsForCheckpoint', () => {
    it('returns only logs for specified checkpoint', () => {
      const logger1 = createLogger('checkpoint-1');
      const logger2 = createLogger('checkpoint-2');

      logger1.info('Message 1');
      logger2.info('Message 2');
      logger1.info('Message 3');

      const logs = getLogsForCheckpoint('checkpoint-1');
      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.checkpointId === 'checkpoint-1')).toBe(true);
    });

    it('returns empty array for unknown checkpoint', () => {
      const logger = createLogger('known');
      logger.info('Test');

      const logs = getLogsForCheckpoint('unknown');
      expect(logs).toEqual([]);
    });
  });

  describe('getAllLogs', () => {
    it('returns all logs from all checkpoints', () => {
      const logger1 = createLogger('checkpoint-1');
      const logger2 = createLogger('checkpoint-2');

      logger1.info('Message 1');
      logger2.warn('Message 2');

      const logs = getAllLogs();
      expect(logs).toHaveLength(2);
    });

    it('returns a copy of the logs array', () => {
      const logger = createLogger('test');
      logger.info('Test');

      const logs1 = getAllLogs();
      const logs2 = getAllLogs();

      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });
  });

  describe('clearLogs', () => {
    it('removes all logs', () => {
      const logger = createLogger('test');
      logger.info('Message 1');
      logger.info('Message 2');

      expect(getAllLogs()).toHaveLength(2);

      clearLogs();

      expect(getAllLogs()).toHaveLength(0);
    });
  });

  describe('log capacity', () => {
    it('maintains maximum of 1000 logs', () => {
      const logger = createLogger('test');

      // Add more than MAX_LOGS entries
      for (let i = 0; i < 1005; i++) {
        logger.info(`Message ${i}`);
      }

      const logs = getAllLogs();
      expect(logs).toHaveLength(1000);
      // First 5 messages should have been removed
      expect(logs[0]?.message).toBe('Message 5');
      expect(logs[999]?.message).toBe('Message 1004');
    });
  });

  describe('log formatting', () => {
    it('formats logs with timestamp, level, checkpoint, and message', () => {
      process.env['LOG_LEVEL'] = 'info';
      const logger = createLogger('ext_123');

      logger.info('Test message');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[INFO\] \[ext_123\] Test message/
        )
      );
    });

    it('includes data in formatted output', () => {
      process.env['LOG_LEVEL'] = 'info';
      const logger = createLogger('test');

      logger.info('With data', { url: 'https://example.com' });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('{"url":"https://example.com"}')
      );
    });
  });
});
