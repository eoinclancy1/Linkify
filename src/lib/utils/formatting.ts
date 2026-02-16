/**
 * Format a number for display with K/M suffixes.
 * Examples: 1500 -> "1.5K", 2300000 -> "2.3M", 42 -> "42"
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return `${n}`;
}

/**
 * Strip null bytes and malformed Unicode escape sequences that PostgreSQL rejects.
 */
export function sanitizeForDb(text: string): string {
  // Remove literal null bytes
  // eslint-disable-next-line no-control-regex
  let cleaned = text.replace(/\x00/g, '');
  // Remove backslash-u-0000 sequences that appear as literal text
  cleaned = cleaned.replace(/\\u0000/g, '');
  return cleaned;
}

/**
 * Truncate text to a maximum length, appending "..." if truncated.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}
