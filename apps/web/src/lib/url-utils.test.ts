import { describe, it, expect } from 'vitest';
import { normalizeUrl, getDisplayUrl, isValidUrlInput, getHostname, isHttps } from './url-utils';

describe('url-utils', () => {
  describe('normalizeUrl', () => {
    it('adds https:// to bare domain', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    it('adds https:// to www subdomain', () => {
      expect(normalizeUrl('www.example.com')).toBe('https://www.example.com');
    });

    it('preserves existing https://', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('preserves existing http://', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('handles uppercase protocols', () => {
      expect(normalizeUrl('HTTPS://Example.com')).toBe('https://Example.com');
      expect(normalizeUrl('HTTP://Example.com')).toBe('http://Example.com');
    });

    it('trims whitespace', () => {
      expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
    });

    it('returns empty string for empty input', () => {
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl('   ')).toBe('');
    });

    it('handles paths and query strings', () => {
      expect(normalizeUrl('example.com/path?query=1')).toBe('https://example.com/path?query=1');
    });
  });

  describe('getDisplayUrl', () => {
    it('removes https://', () => {
      expect(getDisplayUrl('https://example.com')).toBe('example.com');
    });

    it('removes http://', () => {
      expect(getDisplayUrl('http://example.com')).toBe('example.com');
    });

    it('returns as-is if no protocol', () => {
      expect(getDisplayUrl('example.com')).toBe('example.com');
    });
  });

  describe('isValidUrlInput', () => {
    it('accepts valid domains', () => {
      expect(isValidUrlInput('example.com')).toBe(true);
      expect(isValidUrlInput('www.example.com')).toBe(true);
      expect(isValidUrlInput('sub.example.com')).toBe(true);
    });

    it('accepts URLs with protocols', () => {
      expect(isValidUrlInput('https://example.com')).toBe(true);
      expect(isValidUrlInput('http://example.com')).toBe(true);
    });

    it('accepts localhost', () => {
      expect(isValidUrlInput('localhost')).toBe(true);
      expect(isValidUrlInput('localhost:3000')).toBe(true);
    });

    it('rejects empty input', () => {
      expect(isValidUrlInput('')).toBe(false);
      expect(isValidUrlInput('   ')).toBe(false);
    });

    it('rejects invalid domains', () => {
      expect(isValidUrlInput('example')).toBe(false);
      expect(isValidUrlInput('example.c')).toBe(false);
    });

    it('accepts URLs with paths', () => {
      expect(isValidUrlInput('example.com/path')).toBe(true);
    });
  });

  describe('getHostname', () => {
    it('extracts hostname from full URL', () => {
      expect(getHostname('https://example.com/path')).toBe('example.com');
    });

    it('extracts hostname from bare domain', () => {
      expect(getHostname('example.com')).toBe('example.com');
    });

    it('returns input if invalid URL', () => {
      expect(getHostname('not-a-url')).toBe('not-a-url');
    });
  });

  describe('isHttps', () => {
    it('returns true for https URLs', () => {
      expect(isHttps('https://example.com')).toBe(true);
    });

    it('returns false for http URLs', () => {
      expect(isHttps('http://example.com')).toBe(false);
    });

    it('handles case insensitively', () => {
      expect(isHttps('HTTPS://example.com')).toBe(true);
    });

    it('returns false for URLs without protocol', () => {
      expect(isHttps('example.com')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('normalizeUrl handles special characters in path', () => {
      expect(normalizeUrl('example.com/path?q=hello%20world')).toBe(
        'https://example.com/path?q=hello%20world'
      );
    });

    it('isValidUrlInput rejects javascript protocol', () => {
      expect(isValidUrlInput('javascript:alert(1)')).toBe(false);
    });

    it('isValidUrlInput rejects data URLs', () => {
      expect(isValidUrlInput('data:text/html,<h1>Hello</h1>')).toBe(false);
    });

    it('getHostname handles ports', () => {
      expect(getHostname('https://example.com:8080/path')).toBe('example.com');
    });

    it('isValidUrlInput rejects IP addresses (requires valid TLD)', () => {
      // The function requires a valid TLD, so IPs are rejected
      expect(isValidUrlInput('192.168.1.1')).toBe(false);
      expect(isValidUrlInput('http://192.168.1.1')).toBe(false);
    });

    it('isValidUrlInput accepts localhost with port', () => {
      expect(isValidUrlInput('http://localhost:8080')).toBe(true);
    });
  });
});
