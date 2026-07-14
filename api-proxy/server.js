/**
 * API Proxy Server — handles the /api/fetch route for production.
 *
 * This server runs inside Docker and handles arbitrary URL fetch requests
 * from the MCP `read_url` tool. It performs server-side HTTP requests
 * to bypass browser CORS restrictions.
 *
 * Zero external dependencies — uses Node.js 20 built-in `fetch` and `http`.
 *
 * Usage:
 *   node server.js        # Starts on port 3001
 *   PORT=4000 node server.js  # Custom port
 */

const http = require('node:http');
const { URL } = require('node:url');

const PORT = parseInt(process.env.PORT || '3001', 10);
const FETCH_TIMEOUT = 15_000;          // 15 seconds
const MAX_RESPONSE_LENGTH = 8_000;     // 8 KB max response
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const server = http.createServer(async (req, res) => {
  // ── CORS headers (needed if accessed directly, not through nginx) ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Proxy', 'api-proxy/1.0');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only allow GET
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Parse the query parameters
  const host = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url || '/', `http://${host}`);
  const targetUrl = parsedUrl.searchParams.get('url');

  // ── Validation ────────────────────────────────────────────
  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing "url" query parameter' }));
    return;
  }

  if (!targetUrl.startsWith('https://') && !targetUrl.startsWith('http://')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'URL must start with http:// or https://' }));
    return;
  }

  // ── Fetch the target URL server-side ───────────────────────
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/json,*/*',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    // Read full response and truncate
    const text = await response.text();
    const truncated = text.length > MAX_RESPONSE_LENGTH
      ? text.slice(0, MAX_RESPONSE_LENGTH) + '\n\n... (truncated, full content too long)'
      : text;

    // Forward the response
    const contentType = response.headers.get('content-type') || 'text/plain';
    res.writeHead(response.status, {
      'Content-Type': contentType,
      'X-Proxy-Target': targetUrl.slice(0, 100),
    });
    res.end(truncated);

    console.log(`[api-proxy] ${response.status} ${targetUrl.slice(0, 80)} — ${truncated.length} bytes`);    } catch (err) {
        // Safely determine error type (handle non-Error throws gracefully)
        const errName = (err && typeof err === 'object' && 'name' in err) ? err.name : '';
        const isTimeout = errName === 'AbortError';

    if (isTimeout) {
      res.writeHead(504, { 'Content-Type': 'text/plain' });
      res.end(`Proxy timeout: ${targetUrl} did not respond within ${FETCH_TIMEOUT / 1000}s`);
      console.warn(`[api-proxy] TIMEOUT ${targetUrl.slice(0, 80)}`);
    } else {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Proxy error for ${targetUrl}: ${err.message}`);
      console.warn(`[api-proxy] ERROR ${targetUrl.slice(0, 80)}: ${err.message}`);
    }
  }
});

server.listen(PORT, () => {
  console.log(`[api-proxy] Server listening on port ${PORT}`);
  console.log(`[api-proxy] Timeout: ${FETCH_TIMEOUT / 1000}s, Max response: ${MAX_RESPONSE_LENGTH} bytes`);
});
