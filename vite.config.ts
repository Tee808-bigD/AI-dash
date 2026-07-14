/// <reference types="vitest" />
import { defineConfig, type PluginOption } from 'vite'
import * as net from 'net'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'http'

/**
 * SSRF protection — check if a hostname resolves to a private/internal IP.
 */
function isPrivateHostname(hostname: string): boolean {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0'
  ) {
    return true;
  }

  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const o1 = parseInt(ipv4Match[1], 10);
    const o2 = parseInt(ipv4Match[2], 10);
    if (o1 === 10) return true;
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
    if (o1 === 192 && o2 === 168) return true;
    if (o1 === 169 && o2 === 254) return true;
    if (o1 === 127) return true;
  }

  return false;
}

/**
 * Custom Vite plugin that adds Content-Security-Policy headers to all HTML responses.
 */
function cspPlugin(): PluginOption {
  return {
    name: 'csp-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        const originalWriteHead = res.writeHead;
        res.writeHead = function (statusCode: number, ...args: unknown[]) {
          const headers = typeof args[0] === 'object' && args[0] !== null ? args[0] as Record<string, string> : {};
          headers['Content-Security-Policy'] =
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "connect-src 'self' https://*.duckduckgo.com https://integrate.api.nvidia.com https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com wss:; " +
            "font-src 'self' data:; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self';";
          return originalWriteHead.call(this, statusCode, headers, ...args.slice(headers ? 1 : 0));
        };
        next();
      });
    },
  };
}

/**
 * Custom Vite plugin that proxies arbitrary URL fetch requests server-side.
 * Includes SSRF protection to block requests to private/internal network addresses.
 *
 * The MCP `read_url` tool calls `/api/fetch/?url=https://example.com` in dev mode.
 */
function fetchProxyPlugin(): PluginOption {
  const FETCH_TIMEOUT = 15000;
  const MAX_RESPONSE_LENGTH = 8000;
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  return {
    name: 'fetch-proxy',
    configureServer(server) {
      server.middlewares.use('/api/fetch', async (req: IncomingMessage, res: ServerResponse, next) => {
        // Only handle GET requests
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const queryIndex = req.url?.indexOf('?') ?? -1;
        const searchParams = new URLSearchParams(queryIndex >= 0 ? req.url!.slice(queryIndex) : '');
        const targetUrl = searchParams.get('url');

        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing "url" query parameter' }));
          return;
        }

        // Safety: only allow http/https URLs
        if (!targetUrl.startsWith('https://') && !targetUrl.startsWith('http://')) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'URL must start with http:// or https://' }));
          return;
        }

        // ═══════════════════════════════════════════════════════
        // SSRF PROTECTION: Block requests to private/internal IPs
        // ═══════════════════════════════════════════════════════
        let parsedHostname: string;
        try {
          parsedHostname = new URL(targetUrl).hostname;
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid URL format' }));
          return;
        }

        // Check if hostname resolves to a private IP or is localhost
        if (isPrivateHostname(parsedHostname)) {
          // Try DNS resolution for hostnames that might point to internal IPs
          try {
            const resolved = await net.promises.lookup(parsedHostname, 4);
            if (isPrivateHostname(resolved)) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: 'Forbidden',
                detail: 'Access to internal/private network addresses is not allowed',
              }));
              return;
            }
          } catch {
            // DNS resolution failed — still block known private hostnames
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'Forbidden',
              detail: 'Access to internal/private network addresses is not allowed',
            }));
            return;
          }
        } else {
          // Even for non-localhost hostnames, do a DNS check to block hostnames that
          // resolve to private IPs (e.g., internal.company.com → 10.0.0.5)
          try {
            const resolved = await net.promises.lookup(parsedHostname, 4);
            if (isPrivateHostname(resolved)) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: 'Forbidden',
                detail: 'This hostname resolves to an internal network address',
              }));
              return;
            }
          } catch {
            // DNS resolution failed — allow through (could be a transient error)
            // but still reject if it's a known private hostname pattern
          }
        }

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': USER_AGENT,
              'Accept': 'text/html,application/json,*/*',
            },
            signal: controller.signal,
            redirect: 'follow',
          });

          clearTimeout(timeout);

          // Read the full response text
          const text = await response.text();
          const truncated = text.length > MAX_RESPONSE_LENGTH
            ? text.slice(0, MAX_RESPONSE_LENGTH) + '\n\n... (truncated, full content too long)'
            : text;

          // Forward response headers
          res.statusCode = response.status;
          res.setHeader('Content-Type', response.headers.get('content-type') || 'text/plain');
          res.setHeader('X-Proxy', 'vite-dev');

          res.end(truncated);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';

          // Timeout vs other errors
          if ((err as Error)?.name === 'AbortError') {
            res.statusCode = 504;
            res.end(`Proxy timeout: request did not respond within ${FETCH_TIMEOUT / 1000}s`);
          } else {
            // Don't expose the target URL in error messages to prevent info leaks
            res.statusCode = 502;
            res.end(`Proxy error: ${msg}`);
          }
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cspPlugin(), fetchProxyPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    css: false,
  },
  server: {
    proxy: {
      // ── DuckDuckGo Search Proxies ──────────────────────────
      // These proxy search requests from the browser to DuckDuckGo,
      // avoiding CORS issues in development.

      // DuckDuckGo Lite HTML search — returns search result snippets
      // Used by: mcpService.ts → search_web tool
      // Dev URL:  /api/search/?q=query
      // Target:   https://lite.duckduckgo.com/lite/?q=query
      '/api/search': {
        target: 'https://lite.duckduckgo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/search/, '/lite'),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[Vite Proxy] DuckDuckGo Lite search error:', err.message);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log(`[Vite Proxy] → DuckDuckGo Lite: ${(req as IncomingMessage).url}`);
          });
        },
      },

      // DuckDuckGo Instant Answer API — used as fallback when Lite fails
      // Used by: mcpService.ts → search_web tool (fallback)
      // Dev URL:  /api/ddg/?q=query&format=json&no_html=1&skip_disambig=1
      // Target:   https://api.duckduckgo.com/?q=query&format=json...
      '/api/ddg': {
        target: 'https://api.duckduckgo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ddg/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[Vite Proxy] DuckDuckGo API error:', err.message);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log(`[Vite Proxy] → DuckDuckGo API: ${(req as IncomingMessage).url}`);
          });
        },
      },

      // ── NVIDIA AI API Proxy ────────────────────────────────
      // Routes /api/nvidia/* requests to the NVIDIA NIM API,
      // bypassing CORS restrictions in the browser.
      // Used by: aiService.ts → streamAIAPI / callAIAPI
      // Dev URL:  /api/nvidia/chat/completions
      // Target:   https://integrate.api.nvidia.com/v1/chat/completions
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[Vite Proxy] NVIDIA API error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            // Log the proxied request at verbose level
            console.log(`[Vite Proxy] → NVIDIA API: ${(req as IncomingMessage).method} ${(req as IncomingMessage).url}`);
          });
          proxy.on('proxyRes', (proxyRes) => {
            // NVIDIA returns no-cache headers; allow caching for performance
            proxyRes.headers['cache-control'] = 'no-store';
          });
        },
      },
    },
  },
})
