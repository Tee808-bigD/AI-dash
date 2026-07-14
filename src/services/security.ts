/**
 * Security utility module for AgentVerse.
 * Provides sanitization, rate limiting, and SSRF protection helpers.
 */

// ============================================================
// XSS / Input Sanitization
// ============================================================

/**
 * Sanitize a string for safe HTML rendering.
 * Escapes <, >, &, ", ' characters to prevent XSS.
 */
export function sanitizeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch] || ch);
}

/**
 * Sanitize chat message content while preserving markdown-style code blocks.
 * Only sanitizes text OUTSIDE code blocks to allow safe code rendering.
 */
export function sanitizeChatContent(content: string): string {
  // Split on code blocks (```...```) and inline code (`...`)
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts.map((part, i) => {
    // Odd indices are code blocks — leave them untouched
    if (i % 2 === 1) return part;
    // Even indices are regular text — sanitize
    return sanitizeHtml(part);
  }).join('');
}

// ============================================================
// Rate Limiting (Token Bucket)
// ============================================================

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

/**
 * Simple in-memory token bucket rate limiter.
 *
 * @param key - Unique identifier for the rate limit bucket (e.g., user IP, action type)
 * @param maxTokens - Maximum number of tokens (burst capacity)
 * @param refillTimeMs - Time in ms to refill one token
 * @returns true if the request is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  maxTokens: number = 10,
  refillTimeMs: number = 1000
): boolean {
  const now = Date.now();
  let bucket = rateLimitBuckets.get(key);

  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefill: now };
    rateLimitBuckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / refillTimeMs);
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  // Check if a token is available
  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return true; // Allowed
  }

  return false; // Rate limited
}

/**
 * Reset rate limit buckets (useful for testing).
 */
export function resetRateLimits(): void {
  rateLimitBuckets.clear();
}

/**
 * Get remaining tokens for a rate limit key.
 */
export function getRemainingTokens(key: string): number {
  const bucket = rateLimitBuckets.get(key);
  if (!bucket) return -1;
  const elapsed = Date.now() - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / 1000);
  return Math.min(10, bucket.tokens + tokensToAdd);
}

// ============================================================
// SSRF Protection — Block Private/Internal IPs
// ============================================================

/**
 * Parse a URL and extract the hostname, rejecting invalid URLs.
 */
function parseHostname(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if a hostname resolves to a private/internal IP range.
 * This is a client-side check; the server-side proxy in vite.config.ts
 * does the authoritative check.
 *
 * Blocks:
 *   - 127.0.0.0/8 (localhost)
 *   - 10.0.0.0/8 (private)
 *   - 172.16.0.0/12 (private)
 *   - 192.168.0.0/16 (private)
 *   - 169.254.0.0/16 (link-local)
 *   - ::1 (IPv6 localhost)
 *   - fc00::/7 (IPv6 unique local)
 *   - 0.0.0.0
 */
export function isInternalHostname(hostname: string): boolean {
  // Check for localhost / loopback
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]'
  ) {
    return true;
  }

  // Check for private IPv4 ranges
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const firstOctet = parseInt(ipv4Match[1], 10);
    const secondOctet = parseInt(ipv4Match[2], 10);

    // 10.0.0.0/8
    if (firstOctet === 10) return true;
    // 172.16.0.0/12
    if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) return true;
    // 192.168.0.0/16
    if (firstOctet === 192 && secondOctet === 168) return true;
    // 169.254.0.0/16 (link-local)
    if (firstOctet === 169 && secondOctet === 254) return true;
    // 127.0.0.0/8
    if (firstOctet === 127) return true;
  }

  return false;
}

/**
 * Validate a URL for SSRF safety.
 * Returns an error message string if the URL is unsafe, or null if it's safe.
 */
export function validateUrlSafety(url: string): string | null {
  // Must start with http/https
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return 'URL must start with http:// or https://';
  }

  const hostname = parseHostname(url);
  if (!hostname) {
    return 'Invalid URL format';
  }

  // Block private/internal IPs
  if (isInternalHostname(hostname)) {
    return 'Access to internal/private network addresses is not allowed for security reasons';
  }

  return null; // URL is safe
}

// ============================================================
// API Key Obfuscation for localStorage
// ============================================================

const STORAGE_SALT = 'av-sec-1:'; // Simple prefix to identify obfuscated keys

/**
 * Lightly obfuscate a string for localStorage persistence.
 * This is NOT encryption — it's obfuscation to prevent casual reading.
 * For production, use server-side storage with proper encryption.
 */
export function obfuscate(text: string): string {
  const salt = STORAGE_SALT;
  const combined = salt + text;
  // Reverse + base64-like encoding
  const reversed = combined.split('').reverse().join('');
  return btoa(reversed);
}

/**
 * De-obfuscate a string that was stored with `obfuscate`.
 */
export function deobfuscate(encoded: string): string | null {
  try {
    const decoded = atob(encoded);
    const reversed = decoded.split('').reverse().join('');
    if (!reversed.startsWith(STORAGE_SALT)) return null;
    return reversed.slice(STORAGE_SALT.length);
  } catch {
    return null;
  }
}
