import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseToolCall, buildToolSystemPrompt, executeTool, discoverTools } from '../mcpService';
import { setMCPServers } from '../../data/storage';
import type { MCPServer } from '../../types';

// ─── Mock storage ─────────────────────────────────────────
const mockMCPServers: MCPServer[] = [
  {
    id: 'server_1',
    name: 'Code Analysis Server',
    description: 'Analyzes code for bugs and security issues',
    endpoint: 'https://mcp.example.com/code',
    tools: [
      { name: 'analyze_code', description: 'Analyze source code for issues', inputSchema: '{}' },
      { name: 'suggest_fix', description: 'Suggest a fix for a code issue', inputSchema: '{}' },
    ],
    status: 'online',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'server_2',
    name: 'Weather Service',
    description: 'Provides weather data',
    endpoint: 'https://mcp.example.com/weather',
    tools: [
      { name: 'get_weather', description: 'Get weather for a location', inputSchema: '{"type":"object"}' },
    ],
    status: 'online',
    createdAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'server_3',
    name: 'Offline Server',
    description: 'This server is offline',
    endpoint: 'https://mcp.example.com/offline',
    tools: [
      { name: 'unused_tool', description: 'Not available', inputSchema: '{}' },
    ],
    status: 'offline',
    createdAt: '2026-01-03T00:00:00Z',
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

// ─── parseToolCall ────────────────────────────────────────
describe('parseToolCall', () => {
  it('parses a valid tool_call block', () => {
    const text = `Here is my analysis.

\`\`\`tool_call
{
  "name": "analyze_code",
  "arguments": { "code": "console.log('hello')", "language": "javascript" }
}
\`\`\`

Let me know if you need more detail.`;

    const result = parseToolCall(text);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('analyze_code');
    expect(result!.arguments).toEqual({ code: "console.log('hello')", language: 'javascript' });
  });

  it('returns null when no tool_call block exists', () => {
    const text = 'This is just a regular response without any tool calls.';
    expect(parseToolCall(text)).toBeNull();
  });

  it('returns null for malformed JSON inside tool_call block', () => {
    const text = '```tool_call\n{ invalid json }\n```';
    expect(parseToolCall(text)).toBeNull();
  });

  it('returns null for empty tool_call block', () => {
    const text = '```tool_call\n\n```';
    expect(parseToolCall(text)).toBeNull();
  });

  it('extracts tool name from inline JSON when outer parse fails', () => {
    const text = '```tool_call\nSome text with "name": "analyze_code" inside\n```';
    const result = parseToolCall(text);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('analyze_code');
    expect(result!.arguments).toEqual({});
  });

  it('handles tool_call with multiline JSON', () => {
    const text = '```tool_call\n{\n  "name": "get_weather",\n  "arguments": {\n    "location": "New York"\n  }\n}\n```';
    const result = parseToolCall(text);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('get_weather');
    expect(result!.arguments).toEqual({ location: 'New York' });
  });

  it('returns null when name field is missing', () => {
    const text = '```tool_call\n{ "arguments": { "foo": "bar" } }\n```';
    expect(parseToolCall(text)).toBeNull();
  });

  it('returns null when arguments field is not an object', () => {
    const text = '```tool_call\n{ "name": "foo", "arguments": "not_an_object" }\n```';
    expect(parseToolCall(text)).toBeNull();
  });

  it('handles tool_call with no newline after opening backticks', () => {
    const text = '```tool_call\n{"name": "test", "arguments": {}}\n```';
    const result = parseToolCall(text);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('test');
  });
});

// ─── buildToolSystemPrompt ────────────────────────────────
describe('buildToolSystemPrompt', () => {
  beforeEach(() => {
    setMCPServers([]);
  });

  it('always includes built-in tools even when no MCP servers exist', () => {
    const result = buildToolSystemPrompt();
    expect(result).toContain('search_web');
    expect(result).toContain('read_url');
    expect(result).toContain('Built-in Tools');
    expect(result).not.toContain('Server:');
  });

  it('still shows built-in tools when all MCP servers are offline', () => {
    setMCPServers([{ ...mockMCPServers[2] }]); // server_3 is offline
    const result = buildToolSystemPrompt();
    expect(result).toContain('search_web');
    expect(result).toContain('read_url');
    expect(result).not.toContain('Offline Server');
    expect(result).not.toContain('unused_tool');
  });

  it('includes tool format instructions when servers are available', () => {
    setMCPServers([mockMCPServers[0]]);
    const result = buildToolSystemPrompt();
    expect(result).toContain('tool_call');
    expect(result).toContain('Code Analysis Server');
    expect(result).toContain('analyze_code');
    expect(result).toContain('suggest_fix');
  });

  it('includes multiple online servers with tools', () => {
    setMCPServers([mockMCPServers[0], mockMCPServers[1]]);
    const result = buildToolSystemPrompt();
    expect(result).toContain('Code Analysis Server');
    expect(result).toContain('Weather Service');
    expect(result).toContain('get_weather');
    expect(result).toContain('analyze_code');
    expect(result).not.toContain('Offline Server');
    expect(result).not.toContain('unused_tool');
  });
});

// ─── executeTool ──────────────────────────────────────────
describe('executeTool', () => {
  beforeEach(() => {
    setMCPServers([]);
  });

  it('returns error message when tool is not found on any server', async () => {
    setMCPServers([mockMCPServers[0]]);
    const result = await executeTool('nonexistent_tool', {});
    expect(result).toContain('not found');
    expect(result).toContain('nonexistent_tool');
  });

  it('returns error message when no servers are online', async () => {
    setMCPServers([mockMCPServers[2]]); // only offline server
    const result = await executeTool('unused_tool', {});
    expect(result).toContain('not found');
  });

  it('returns error from fetch failure with server info', async () => {
    setMCPServers([mockMCPServers[0]]);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await executeTool('analyze_code', { code: 'test' });
    expect(result).toContain('Error calling tool');
    expect(result).toContain('analyze_code');
    expect(result).toContain('Network error');
    vi.unstubAllGlobals();
  });

  it('successfully calls tool and returns content', async () => {
    setMCPServers([mockMCPServers[0]]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        result: {
          content: [{ type: 'text', text: 'Analysis complete: no issues found.' }],
        },
      }),
    }));

    const result = await executeTool('analyze_code', { code: 'console.log("hi")' });
    expect(result).toBe('Analysis complete: no issues found.');

    const fetchCalls = (vi.mocked(fetch).mock.calls);
    expect(fetchCalls.length).toBe(1);
    expect(fetchCalls[0][0]).toContain('mcp.example.com/code');
    vi.unstubAllGlobals();
  });
});

// ─── discoverTools ────────────────────────────────────────
describe('discoverTools', () => {
  beforeEach(() => {
    setMCPServers([]);
  });

  it('returns empty array when no online servers exist', async () => {
    const result = await discoverTools();
    expect(result).toEqual([]);
  });

  it('discovers tools from online servers', async () => {
    setMCPServers([mockMCPServers[1]]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        result: { tools: [{ name: 'get_weather', description: 'Get weather for a location', inputSchema: { type: 'object' } }] },
      }),
    }));

    const result = await discoverTools();
    expect(result.length).toBe(1);
    expect(result[0].server.name).toBe('Weather Service');
    expect(result[0].tools[0].name).toBe('get_weather');
    vi.unstubAllGlobals();
  });

  it('skips offline servers and only queries online ones', async () => {
    setMCPServers([mockMCPServers[2]]); // only offline server
    const result = await discoverTools();
    expect(result).toEqual([]);
  });

  it('handles server discovery failure gracefully', async () => {
    setMCPServers([mockMCPServers[0]]);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')));
    const result = await discoverTools();
    expect(result).toEqual([]);
    vi.unstubAllGlobals();
  });
});
