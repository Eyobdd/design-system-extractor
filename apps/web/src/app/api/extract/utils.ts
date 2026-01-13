export function generateCheckpointId(): string {
  return `ext_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
