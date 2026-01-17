import { describe, it, expect } from 'vitest';
import { formatDomainForDisplay, getCleanHostname } from './format-domain';

describe('formatDomainForDisplay', () => {
  describe('basic URL formatting', () => {
    it('adds www. prefix to simple domain', () => {
      expect(formatDomainForDisplay('https://example.com')).toBe('www.example.com');
    });

    it('preserves existing www. prefix', () => {
      expect(formatDomainForDisplay('https://www.example.com')).toBe('www.example.com');
    });

    it('handles http protocol', () => {
      expect(formatDomainForDisplay('http://example.com')).toBe('www.example.com');
    });

    it('handles URLs without protocol', () => {
      expect(formatDomainForDisplay('example.com')).toBe('www.example.com');
    });
  });

  describe('subdomains', () => {
    it('adds www. to subdomain URLs', () => {
      expect(formatDomainForDisplay('https://app.example.com')).toBe('www.app.example.com');
    });

    it('handles multiple subdomains', () => {
      expect(formatDomainForDisplay('https://api.v2.example.com')).toBe('www.api.v2.example.com');
    });
  });

  describe('paths and query strings', () => {
    it('strips path from URL', () => {
      expect(formatDomainForDisplay('https://example.com/path/to/page')).toBe('www.example.com');
    });

    it('strips query string from URL', () => {
      expect(formatDomainForDisplay('https://example.com?query=value')).toBe('www.example.com');
    });

    it('strips both path and query string', () => {
      expect(formatDomainForDisplay('http://example.com/path?query=value')).toBe('www.example.com');
    });
  });

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(formatDomainForDisplay('')).toBe('');
    });

    it('handles whitespace-only input', () => {
      // Whitespace-only input is not trimmed before the !url check,
      // so it falls through to error handler which adds 'www.' prefix
      expect(formatDomainForDisplay('   ')).toBe('www.   ');
    });

    it('handles URL with trailing whitespace', () => {
      expect(formatDomainForDisplay('  https://example.com  ')).toBe('www.example.com');
    });

    it('handles invalid URL gracefully', () => {
      expect(formatDomainForDisplay('not-a-valid-url')).toBe('www.not-a-valid-url');
    });

    it('handles URL with port number', () => {
      expect(formatDomainForDisplay('https://example.com:8080')).toBe('www.example.com');
    });
  });

  describe('case sensitivity', () => {
    it('handles uppercase protocol', () => {
      expect(formatDomainForDisplay('HTTPS://example.com')).toBe('www.example.com');
    });

    it('handles mixed case domain', () => {
      expect(formatDomainForDisplay('https://Example.COM')).toBe('www.example.com');
    });
  });
});

describe('getCleanHostname', () => {
  describe('basic hostname extraction', () => {
    it('extracts hostname from full URL', () => {
      expect(getCleanHostname('https://example.com')).toBe('example.com');
    });

    it('removes www. prefix', () => {
      expect(getCleanHostname('https://www.example.com')).toBe('example.com');
    });

    it('handles http protocol', () => {
      expect(getCleanHostname('http://example.com')).toBe('example.com');
    });
  });

  describe('subdomains', () => {
    it('preserves subdomains', () => {
      expect(getCleanHostname('https://app.example.com')).toBe('app.example.com');
    });

    it('removes www. but preserves other subdomains', () => {
      expect(getCleanHostname('https://www.app.example.com')).toBe('app.example.com');
    });
  });

  describe('paths and query strings', () => {
    it('strips path from URL', () => {
      expect(getCleanHostname('https://example.com/path/to/page')).toBe('example.com');
    });

    it('strips query string', () => {
      expect(getCleanHostname('https://example.com?query=value')).toBe('example.com');
    });
  });

  describe('URLs without protocol', () => {
    it('handles domain without protocol', () => {
      expect(getCleanHostname('example.com')).toBe('example.com');
    });

    it('handles www domain without protocol', () => {
      expect(getCleanHostname('www.example.com')).toBe('example.com');
    });
  });

  describe('edge cases', () => {
    it('handles invalid URL gracefully', () => {
      expect(getCleanHostname('not-a-valid-url')).toBe('not-a-valid-url');
    });

    it('handles whitespace', () => {
      expect(getCleanHostname('  https://example.com  ')).toBe('example.com');
    });

    it('handles URL with port', () => {
      expect(getCleanHostname('https://example.com:3000')).toBe('example.com');
    });
  });
});
