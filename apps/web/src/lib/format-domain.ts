/**
 * Formats a URL to display format: www.domain.com
 *
 * Examples:
 *   "https://example.com" → "www.example.com"
 *   "https://www.example.com" → "www.example.com"
 *   "https://app.example.com" → "www.app.example.com"
 *   "http://example.com/path?query" → "www.example.com"
 */
export function formatDomainForDisplay(url: string): string {
  if (!url) return '';

  try {
    let cleanUrl = url.trim();

    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const parsed = new URL(cleanUrl);
    let hostname = parsed.hostname;

    if (!hostname.startsWith('www.')) {
      hostname = `www.${hostname}`;
    }

    return hostname;
  } catch {
    const withoutProtocol = url.replace(/^https?:\/\//i, '');
    const domainOnly = withoutProtocol.split('/')[0] || withoutProtocol;

    if (!domainOnly.startsWith('www.')) {
      return `www.${domainOnly}`;
    }
    return domainOnly;
  }
}

/**
 * Extracts just the hostname from a URL without the www prefix
 */
export function getCleanHostname(url: string): string {
  try {
    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }
    const parsed = new URL(cleanUrl);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0] || url;
  }
}
