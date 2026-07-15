import type { MCPTool, MCPServer } from '../types';
import { getMCPServers } from '../data/storage';

interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Built-in tools that are always available to agents.
 * These don't require an MCP server — they use web APIs directly.
 */
const BUILTIN_TOOLS: MCPTool[] = [
  {
    name: 'search_web',
    description: 'Search the internet for current information on any topic. Returns snippets and summaries from relevant web pages.',
    inputSchema: JSON.stringify({
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query string' },
      },
      required: ['query'],
    }),
  },
  {
    name: 'read_url',
    description: 'Fetch and read the text content of a web page or API endpoint. Returns the raw text/JSON content.',
    inputSchema: JSON.stringify({
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The full URL to fetch (https://...)' },
      },
      required: ['url'],
    }),
  },
  {
    name: 'generate_chart',
    description: 'Generate a chart/graph image (bar, line, pie, doughnut, radar, polarArea, bubble, scatter) from data. Returns a markdown image URL. Use this to create visual data representations for reports and dashboards.',
    inputSchema: JSON.stringify({
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Chart type: bar, line, pie, doughnut, radar, polarArea, bubble, scatter' },
        labels: { type: 'array', description: 'Array of label strings for the x-axis or categories', items: { type: 'string' } },
        datasets: { type: 'array', description: 'Array of dataset objects. Each has: label (string), data (array of numbers), backgroundColor (optional string or array), borderColor (optional string)' },
        title: { type: 'string', description: 'Optional chart title text' },
        width: { type: 'number', description: 'Image width in pixels (default 600)' },
        height: { type: 'number', description: 'Image height in pixels (default 350)' },
      },
      required: ['type', 'labels', 'datasets'],
    }),
  },
  {
    name: 'random_cat',
    description: 'Get a random cat image URL. Can also get a cat image with text overlaid. Useful for adding fun visuals or testing image rendering.',
    inputSchema: JSON.stringify({
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Optional text to display on the cat image' },
        filter: { type: 'string', description: 'Optional filter effect: blur, mono, sepia, negative, paint, pixel' },
      },
    }),
  },
  {
    name: 'get_favicon',
    description: 'Get the favicon (website icon) URL for any domain. Uses the Icon Horse API. Returns a small icon image URL representing the website.',
    inputSchema: JSON.stringify({
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'The domain to fetch the favicon for (e.g., "github.com", "ycombinator.com")' },
        size: { type: 'number', description: 'Icon size in pixels (default 64, max 512)' },
      },
      required: ['domain'],
    }),
  },
  {
    name: 'predict_age',
    description: 'Predict the age of a person based on their first name. Uses the Agify.io API. Returns estimated age and count of samples.',
    inputSchema: JSON.stringify({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The first name to predict age for' },
      },
      required: ['name'],
    }),
  },
  {
    name: 'predict_gender',
    description: 'Predict the gender of a person based on their first name. Uses the Genderize.io API. Returns estimated gender (male/female) and probability.',
    inputSchema: JSON.stringify({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The first name to predict gender for' },
      },
      required: ['name'],
    }),
  },
  {
    name: 'predict_nationality',
    description: 'Predict the nationality of a person based on their first name. Uses the Nationalize.io API. Returns a list of most likely countries with probabilities.',
    inputSchema: JSON.stringify({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The first name to predict nationality for' },
      },
      required: ['name'],
    }),
  },
];

/** Shared headers for all HTTP requests */
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/json,*/*',
};

/**
 * Standalone web search function — search DuckDuckGo and return results.
 * Used directly by chat interfaces for fetching context before AI calls.
 */
export async function searchWeb(query: string, maxResults = 5): Promise<{ title: string; url: string; snippet: string }[]> {
  const results: { title: string; url: string; snippet: string }[] = [];
  const isDev = typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

  // Try DuckDuckGo Instant Answer API first
  try {
    const ddgUrl = isDev
      ? `/api/ddg/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      : `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl, { signal: AbortSignal.timeout(8000) });
    if (ddgRes.ok) {
      const data = await ddgRes.json() as {
        AbstractText?: string;
        Heading?: string;
        AbstractURL?: string;
        RelatedTopics?: { Text?: string; FirstURL?: string }[];
      };
      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: data.AbstractText,
        });
      }
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, maxResults - 1)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 60),
              url: topic.FirstURL,
              snippet: topic.Text,
            });
          }
        }
      }
      if (results.length > 0) return results;
    }
  } catch { /* fallback */ }

  // Fallback: DuckDuckGo Lite HTML search
  try {
    const liteUrl = isDev
      ? `/api/search/?q=${encodeURIComponent(query)}`
      : `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
    const liteRes = await fetch(liteUrl, { signal: AbortSignal.timeout(10000) });
    if (liteRes.ok) {
      const html = await liteRes.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a[href^="http"]');
      const seen = new Set<string>();
      links.forEach((el) => {
        const href = (el as HTMLAnchorElement).href;
        const text = el.textContent?.trim() || '';
        if (href && text.length > 10 && !seen.has(href) && !href.includes('duckduckgo.com')) {
          seen.add(href);
          results.push({ title: text.slice(0, 120), url: href, snippet: text.slice(0, 300) });
        }
      });
    }
  } catch { /* no results */ }

  return results.slice(0, maxResults);
}

/**
 * Standalone URL reader — fetch and return plain text from any URL.
 * Used directly by chat interfaces for fetching content before AI calls.
 */
export async function readUrl(url: string): Promise<string> {
  const isDev = typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

  try {
    const fetchUrl = isDev
      ? `/api/fetch/?url=${encodeURIComponent(url)}`
      : url;

    const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // Strip HTML tags for plain text
    const tmp = document.createElement('div');
    tmp.innerHTML = text;
    return tmp.textContent || tmp.innerText || text;
  } catch (err) {
    throw new Error(`Failed to fetch URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Generate a QuickChart URL from chart configuration.
 */
export function buildChartUrl(
  type: string,
  labels: string[],
  datasets: { label: string; data: number[]; backgroundColor?: string | string[]; borderColor?: string }[],
  title?: string,
  width?: number,
  height?: number,
): string {
  const chartConfig: Record<string, unknown> = {
    type,
    data: {
      labels,
      datasets: datasets.map(d => ({
        label: d.label,
        data: d.data,
        backgroundColor: d.backgroundColor || undefined,
        borderColor: d.borderColor || undefined,
        ...(type === 'line' ? { fill: false, tension: 0.3 } : {}),
      })),
    },
    options: {
      responsive: false,
      plugins: {
        legend: { labels: { color: '#e0e0e8', font: { size: 11 } } },
      },
      ...(title ? {
        plugins: {
          title: { display: true, text: title, color: '#f0f0f8', font: { size: 14, weight: 'bold' as const } },
          legend: { labels: { color: '#e0e0e8', font: { size: 11 } } },
        },
      } : {}),
    },
  };

  const params = new URLSearchParams({
    c: JSON.stringify(chartConfig),
    w: String(width || 600),
    h: String(height || 350),
    backgroundColor: 'transparent',
    format: 'png',
    version: '4',
  });

  return `https://quickchart.io/chart?${params.toString()}`;
}

/**
 * Execute a built-in web tool (search_web, read_url, generate_chart, etc.).
 */
async function executeBuiltinTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<string | null> {
  // Use Vite proxy in dev mode to avoid CORS; direct URLs in production/Node
  const isDev = typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

  switch (toolName) {
    case 'search_web': {
      const query = String(args.query || '');
      if (!query) return 'Error: No search query provided.';

      try {
        // Step 1: Try DuckDuckGo Lite (returns real search results as HTML)
        const liteUrl = isDev
          ? `/api/search/?q=${encodeURIComponent(query)}`
          : `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;

        const liteResp = await fetch(liteUrl, {
          headers: FETCH_HEADERS,
          signal: AbortSignal.timeout(10000),
        });

        if (liteResp.ok) {
          const html = await liteResp.text();
          // Extract result snippets from the HTML table
          const snippets = html.match(/<td[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/td>/gi);
          const results = snippets
            ? snippets.slice(0, 6).map((m: string) => m.replace(/<[^>]*>/g, '').trim())
            : [];

          if (results.length > 0) {
            return `Search results for "${query}":\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
          }
        }

        // Step 2: Fall back to DuckDuckGo Instant Answer API
        const ddgUrl = isDev
          ? `/api/ddg/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
          : `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

        const ddgResp = await fetch(ddgUrl, {
          headers: FETCH_HEADERS,
          signal: AbortSignal.timeout(10000),
        });

        if (ddgResp.ok) {
          const data = await ddgResp.json() as {
            AbstractText?: string;
            RelatedTopics?: { Text?: string; FirstURL?: string }[];
          };

          let result = '';
          if (data.AbstractText) {
            result += `Summary: ${data.AbstractText}\n\n`;
          }
          if (data.RelatedTopics) {
            result += 'Related results:\n';
            data.RelatedTopics.slice(0, 8).forEach((t, i) => {
              if (t.Text) result += `${i + 1}. ${t.Text}\n`;
            });
          }
          if (result) return result;
        }

        return `No results found for "${query}". The search service may be rate-limited; try a different query or check your network connection.`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return `Web search failed: ${msg}. The agent will continue without internet data. (Tip: Check the browser console for details.)`;
      }
    }

    case 'read_url': {
      const targetUrl = String(args.url || '');
      if (!targetUrl) return 'Error: No URL provided.';
      if (!targetUrl.startsWith('https://') && !targetUrl.startsWith('http://')) {
        return 'Error: URL must start with http:// or https://';
      }

      try {
        const fetchUrl = isDev
          ? `/api/fetch/?url=${encodeURIComponent(targetUrl)}`
          : targetUrl;

        const response = await fetch(fetchUrl, {
          headers: FETCH_HEADERS,
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          return `HTTP ${response.status}: ${response.statusText}`;
        }

        const contentType = response.headers.get('content-type') || '';
        let text: string;

        if (contentType.includes('application/json')) {
          text = JSON.stringify(await response.json(), null, 2);
        } else {
          text = await response.text();
          // Strip HTML tags for readability
          text = text
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        // Limit response length
        const MAX_LENGTH = 8000;
        if (text.length > MAX_LENGTH) {
          text = text.slice(0, MAX_LENGTH) + '\n\n... (truncated, full content too long)';
        }

        return text || '(Empty response)';
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return `Failed to fetch URL: ${msg}`;
      }
    }

    case 'generate_chart': {
      const type = String(args.type || 'bar');
      const labels = args.labels as string[] || [];
      const datasets = args.datasets as { label: string; data: number[]; backgroundColor?: string | string[]; borderColor?: string }[] || [];
      const title = args.title ? String(args.title) : undefined;
      const width = args.width ? Number(args.width) : undefined;
      const height = args.height ? Number(args.height) : undefined;

      if (!labels.length || !datasets.length) {
        return 'Error: labels and datasets are required for chart generation.';
      }

      const chartUrl = buildChartUrl(type, labels, datasets, title, width, height);

      // Return markdown image that renders inline in chat
      const description = title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`;
      return `![${description}](${chartUrl})\n\nChart generated successfully! Type: **${type}**, Datasets: ${datasets.length}, Data points: ${labels.length}`;
    }

    case 'random_cat': {
      const text = args.text ? String(args.text) : '';
      const filter = args.filter ? String(args.filter) : '';

      let catUrl = 'https://cataas.com/cat';
      if (text) catUrl += `/says/${encodeURIComponent(text)}`;
      if (filter) catUrl += `?filter=${encodeURIComponent(filter)}`;

      return `![Random Cat](${catUrl})\n\n🐱 Meow! Here's a random cat image${text ? ` saying "${text}"` : ''}${filter ? ` with ${filter} filter` : ''}.`;
    }

    case 'get_favicon': {
      const domain = String(args.domain || '').trim();
      const size = args.size ? Number(args.size) : 64;

      if (!domain) return 'Error: No domain provided.';

      const faviconUrl = `https://icon.horse/icon/${encodeURIComponent(domain)}`;
      return `![${domain} favicon](${faviconUrl})\n\nFavicon for **${domain}** (${size}x${size}): ${faviconUrl}`;
    }

    case 'predict_age': {
      const name = String(args.name || '').trim();
      if (!name) return 'Error: No name provided.';

      try {
        const res = await fetch(`https://api.agify.io/?name=${encodeURIComponent(name)}`, {
          headers: FETCH_HEADERS,
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return `Age prediction failed (HTTP ${res.status})`;
        const data = await res.json() as { name: string; age: number | null; count: number };
        if (data.age === null) return `No data found for name "${name}".`;
        return `**Age Prediction for "${name}"**\n- Estimated Age: **${data.age}**\n- Sample Count: ${data.count.toLocaleString()}`;
      } catch (err) {
        return `Age prediction failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    }

    case 'predict_gender': {
      const name = String(args.name || '').trim();
      if (!name) return 'Error: No name provided.';

      try {
        const res = await fetch(`https://api.genderize.io/?name=${encodeURIComponent(name)}`, {
          headers: FETCH_HEADERS,
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return `Gender prediction failed (HTTP ${res.status})`;
        const data = await res.json() as { name: string; gender: string | null; probability: number; count: number };
        if (data.gender === null) return `No data found for name "${name}".`;
        return `**Gender Prediction for "${name}"**\n- Estimated Gender: **${data.gender.charAt(0).toUpperCase() + data.gender.slice(1)}**\n- Probability: **${(data.probability * 100).toFixed(1)}%**\n- Sample Count: ${data.count.toLocaleString()}`;
      } catch (err) {
        return `Gender prediction failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    }

    case 'predict_nationality': {
      const name = String(args.name || '').trim();
      if (!name) return 'Error: No name provided.';

      try {
        const res = await fetch(`https://api.nationalize.io/?name=${encodeURIComponent(name)}`, {
          headers: FETCH_HEADERS,
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return `Nationality prediction failed (HTTP ${res.status})`;
        const data = await res.json() as { name: string; country: { country_id: string; probability: number }[] };
        if (!data.country.length) return `No nationality data found for name "${name}".`;
        const countryFlags = data.country.slice(0, 5).map(c => {
          const flagCode = c.country_id.toLowerCase();
          const flag = String.fromCodePoint(...[...flagCode].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 97));
          return `- ${flag} **${c.country_id}** — ${(c.probability * 100).toFixed(1)}%`;
        }).join('\n');
        return `**Nationality Prediction for "${name}"**\n${countryFlags}`;
      } catch (err) {
        return `Nationality prediction failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    }

    default:
      return null; // Not a built-in tool
  }
}

/**
 * Send a JSON-RPC call to an MCP server endpoint
 */
async function rpcCall(endpoint: string, method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const body: JSONRPCRequest = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  };

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });

  if (!resp.ok) {
    throw new Error(`MCP server returned ${resp.status}: ${resp.statusText}`);
  }

  const data = (await resp.json()) as JSONRPCResponse;
  if (data.error) {
    throw new Error(`MCP error: ${data.error.message}`);
  }
  return data.result;
}

/**
 * Discover tools from all online MCP servers
 */
export async function discoverTools(): Promise<{ server: MCPServer; tools: MCPTool[] }[]> {
  const servers = getMCPServers().filter(s => s.status === 'online');
  const results: { server: MCPServer; tools: MCPTool[] }[] = [];

  for (const server of servers) {
    try {
      const result = await rpcCall(server.endpoint, 'tools/list');
      const toolsList = (result as { tools?: { name: string; description?: string; inputSchema?: Record<string, unknown> }[] })?.tools || [];
      results.push({
        server,
        tools: toolsList.map(t => ({
          name: t.name,
          description: t.description || '',
          inputSchema: JSON.stringify(t.inputSchema || {}),
        })),
      });
    } catch (err) {
      console.warn(`Failed to discover tools from ${server.name}:`, err);
    }
  }

  return results;
}

/**
 * Execute a tool by name.
 * First checks built-in tools (search_web, read_url), then connected MCP servers.
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  // Try built-in tools first
  const builtinResult = await executeBuiltinTool(toolName, args);
  if (builtinResult !== null) return builtinResult;

  // Fall back to connected MCP servers
  const servers = getMCPServers().filter(s => s.status === 'online');

  for (const server of servers) {
    const hasTool = server.tools.some(t => t.name === toolName);
    if (!hasTool) continue;

    try {
      const result = await rpcCall(server.endpoint, 'tools/call', {
        name: toolName,
        arguments: args,
      });

      const content = (result as { content?: { type: string; text?: string }[] })?.content;
      if (content) {
        return content.map(c => c.text || '').join('\n');
      }
      return JSON.stringify(result);
    } catch (err) {
      return `Error calling tool ${toolName}: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }

  return `Tool "${toolName}" not found on any connected MCP server`;
}

/**
 * Build a system message that describes available MCP tools so the AI can use them.
 * Always includes built-in tools (search_web, read_url) plus any connected MCP servers.
 */
export function buildToolSystemPrompt(): string {
  let prompt = '\n\nYou have access to the following tools. When you need to use one, ' +
    'respond with the EXACT format:\n\n';
  prompt += '```tool_call\n{\n  "name": "tool_name",\n  "arguments": { ... }\n}\n```\n\n';

  // Always include built-in tools
  prompt += '**Built-in Tools (always available, no server needed):**\n';
  for (const tool of BUILTIN_TOOLS) {
    prompt += `- \`${tool.name}\`: ${tool.description}\n`;
  }

  // Include connected MCP servers
  const servers = getMCPServers().filter(s => s.status === 'online' && s.tools.length > 0);
  for (const server of servers) {
    prompt += `\n**Server: ${server.name}**\n`;
    for (const tool of server.tools) {
      prompt += `- \`${tool.name}\`: ${tool.description}\n`;
    }
  }

  prompt += '\nWhen you need current information, always use `search_web` first. ' +
    'After the tool executes, the result will be appended and you can continue your response.';
  return prompt;
}

/**
 * Parse a tool call from the AI's response text
 * Returns null if no tool call is detected
 */
export function parseToolCall(text: string): { name: string; arguments: Record<string, unknown> } | null {
  // Match ```tool_call { ... } ``` blocks
  const match = text.match(/```tool_call\n?([\s\S]*?)```/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
    if (parsed.name && typeof parsed.arguments === 'object') {
      return { name: parsed.name, arguments: parsed.arguments as Record<string, unknown> };
    }
  } catch {
    // Not valid JSON — try to find inline tool calls
    const inline = text.match(/"name"\s*:\s*"([^"]+)"/);
    if (inline) {
      return { name: inline[1], arguments: {} };
    }
  }

  return null;
}
