/**
 * URL normalization utilities for simplified user input
 */

/**
 * Normalizes a URL input by adding protocol if missing
 * Accepts: "example.com", "www.example.com", "http://example.com", "https://example.com"
 * Returns: Full URL with protocol
 */
export function normalizeUrl(input: string): string {
  let url = input.trim();

  // Return empty string for empty input
  if (!url) {
    return '';
  }

  // If already has a protocol, return as-is (but ensure it's lowercase)
  if (/^https?:\/\//i.test(url)) {
    return url.replace(/^(https?):\/\//i, (_, protocol) => `${protocol.toLowerCase()}://`);
  }

  // Add https:// by default
  return `https://${url}`;
}

/**
 * Extracts the display-friendly version of a URL (without protocol)
 */
export function getDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '');
}

/**
 * Validates if a string can be normalized into a valid URL
 * More permissive than strict URL validation - accepts simplified inputs
 */
export function isValidUrlInput(input: string): boolean {
  const trimmed = input.trim();

  if (!trimmed) {
    return false;
  }

  // Try to construct a URL from the normalized input
  try {
    const normalized = normalizeUrl(trimmed);
    const url = new URL(normalized);

    // Must have a valid hostname with at least one dot (e.g., example.com)
    // Exception: localhost
    if (url.hostname === 'localhost') {
      return true;
    }

    if (!url.hostname.includes('.')) {
      return false;
    }

    // Basic TLD check - hostname should end with at least 2 characters after last dot
    const parts = url.hostname.split('.');
    const tld = parts[parts.length - 1] ?? '';
    if (tld.length < 2) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the hostname from a URL for display purposes
 */
export function getHostname(url: string): string {
  try {
    const normalized = normalizeUrl(url);
    return new URL(normalized).hostname;
  } catch {
    return url;
  }
}

/**
 * Checks if a URL is using HTTPS
 */
export function isHttps(url: string): boolean {
  return url.toLowerCase().startsWith('https://');
}
