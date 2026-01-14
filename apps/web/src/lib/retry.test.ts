import { describe, it, expect, vi } from 'vitest';
import { withRetry, RetryableError, NonRetryableError } from './retry';

describe('retry', () => {
  describe('withRetry', () => {
    it('returns result on first successful attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable error and succeeds', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 2, initialDelayMs: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws after max retries exhausted', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('network timeout'));

      await expect(withRetry(fn, { maxRetries: 2, initialDelayMs: 1 })).rejects.toThrow(
        'network timeout'
      );
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('does not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('validation failed'));

      await expect(withRetry(fn, { maxRetries: 3, initialDelayMs: 1 })).rejects.toThrow(
        'validation failed'
      );
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('uses custom shouldRetry function', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('custom retryable'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxRetries: 2,
        initialDelayMs: 1,
        shouldRetry: err => err instanceof Error && err.message.includes('custom'),
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('calls onRetry callback with attempt info', async () => {
      const onRetry = vi.fn();
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      await withRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
        backoffMultiplier: 2,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 10);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 20);
    });

    it('applies exponential backoff', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn().mockRejectedValue(new Error('econnreset'));

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          initialDelayMs: 10,
          backoffMultiplier: 2,
          onRetry,
        })
      ).rejects.toThrow();

      // Check delays: 10, 20, 40
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 10);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 20);
      expect(onRetry).toHaveBeenNthCalledWith(3, 3, expect.any(Error), 40);
    });

    it('respects maxDelayMs cap', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn().mockRejectedValue(new Error('socket hang up'));

      await expect(
        withRetry(fn, {
          maxRetries: 3,
          initialDelayMs: 10,
          maxDelayMs: 15,
          backoffMultiplier: 3,
          onRetry,
        })
      ).rejects.toThrow();

      // Delays should be capped at 15
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 10);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 15); // 30 capped to 15
      expect(onRetry).toHaveBeenNthCalledWith(3, 3, expect.any(Error), 15); // 90 capped to 15
    });

    it('uses default shouldRetry for retryable errors', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('temporarily unavailable'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 1, initialDelayMs: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryable error detection', () => {
    const retryableMessages = [
      'network error',
      'timeout exceeded',
      'econnreset',
      'econnrefused',
      'socket hang up',
      'temporarily unavailable',
    ];

    it.each(retryableMessages)('retries on "%s" error', async message => {
      const fn = vi.fn().mockRejectedValueOnce(new Error(message)).mockResolvedValue('success');

      const result = await withRetry(fn, { maxRetries: 1, initialDelayMs: 1 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    const nonRetryableMessages = ['invalid argument', 'not found', 'unauthorized', 'forbidden'];

    it.each(nonRetryableMessages)('does not retry on "%s" error', async message => {
      const fn = vi.fn().mockRejectedValue(new Error(message));

      await expect(withRetry(fn, { maxRetries: 3, initialDelayMs: 1 })).rejects.toThrow(message);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('handles non-Error thrown values', async () => {
      const fn = vi.fn().mockRejectedValue('string error');

      await expect(withRetry(fn, { maxRetries: 2, initialDelayMs: 1 })).rejects.toBe(
        'string error'
      );
      expect(fn).toHaveBeenCalledTimes(1); // Non-Error not retryable by default
    });
  });

  describe('RetryableError', () => {
    it('creates an error with isRetryable true by default', () => {
      const error = new RetryableError('Temporary failure');

      expect(error.message).toBe('Temporary failure');
      expect(error.name).toBe('RetryableError');
      expect(error.isRetryable).toBe(true);
    });

    it('allows setting isRetryable to false', () => {
      const error = new RetryableError('Not actually retryable', false);

      expect(error.isRetryable).toBe(false);
    });

    it('is instance of Error', () => {
      const error = new RetryableError('Test');

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('NonRetryableError', () => {
    it('creates an error with correct name', () => {
      const error = new NonRetryableError('Permanent failure');

      expect(error.message).toBe('Permanent failure');
      expect(error.name).toBe('NonRetryableError');
    });

    it('is instance of Error', () => {
      const error = new NonRetryableError('Test');

      expect(error).toBeInstanceOf(Error);
    });
  });
});
