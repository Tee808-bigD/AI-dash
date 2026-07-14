import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Agent, APIKeyConfig } from '../../types';
import type { AgentMessage } from '../../types';

// We'll test private functions via the public API
import { queryAgent, executeWorkflowStep } from '../aiService';
import { resetRateLimits } from '../security';

// ─── Mock SSE streaming helper ────────────────────────────
// Creates a mock Response-like object that simulates Server-Sent Events
// for testing the private streamAIAPI and parseSSE functions via queryAgent.
function createMockSSEResponse(sseDataLines: string[]): any {
  // sseDataLines: full SSE data, e.g.
  // ['data: {"choices":[{"delta":{"content":"hello"}}]}', '', 'data: [DONE]', '']
  const fullText = sseDataLines.join('\n') + '\n';
  const encoder = new TextEncoder();
  const encoded = encoder.encode(fullText);

  let offset = 0;
  const chunks: Uint8Array[] = [];
  while (offset < encoded.length) {
    const size = Math.min(64, encoded.length - offset);
    chunks.push(encoded.slice(offset, offset + size));
    offset += size;
  }

  let chunkIndex = 0;

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'text/event-stream' }),
    body: {
      getReader: () => ({
        read: async () => {
          if (chunkIndex < chunks.length) {
            return { value: chunks[chunkIndex++], done: false };
          }
          return { value: undefined, done: true };
        },
        releaseLock: () => {},
        cancel: () => {},
        closed: Promise.resolve(undefined),
      }),
    },
    text: async () => fullText,
    json: async () => { throw new Error('Not available'); },
    clone: function () { return createMockSSEResponse(sseDataLines) as Response; },
  } as Response;
}

// Creates an OpenAI-compatible streaming SSE response from content chunks
function createOpenAIStreamResponse(contentChunks: string[]): any {
  const lines: string[] = [];
  for (const chunk of contentChunks) {
    lines.push(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}`);
    lines.push('');
  }
  lines.push('data: [DONE]');
  lines.push('');
  return createMockSSEResponse(lines);
}

// Creates an Anthropic-compatible streaming SSE response from content chunks
function createAnthropicStreamResponse(textChunks: string[]): any {
  const lines: string[] = [];
  for (const chunk of textChunks) {
    lines.push(`data: ${JSON.stringify({ type: 'content_block_delta', delta: { text: chunk } })}`);
    lines.push('');
  }
  lines.push('data: [DONE]');
  lines.push('');
  return createMockSSEResponse(lines);
}

// ─── Test fixtures ────────────────────────────────────────
const researcherAgent: Agent = {
  id: 'agent_1',
  name: 'Athena',
  role: 'researcher',
  description: 'Research agent',
  avatar: '',
  status: 'idle' as const,
  lastActive: '2026-01-01T00:00:00Z',
  tasksCompleted: 10,
  model: 'meta/llama-3.1-8b-instruct',
  temperature: 0.3,
  systemPrompt: 'You are an expert research assistant.',
  createdAt: '2026-01-01T00:00:00Z',
};

const coderAgent: Agent = {
  ...researcherAgent,
  id: 'agent_2',
  name: 'Neo',
  role: 'coder',
  systemPrompt: 'You are an expert software engineer.',
};

const analystAgent: Agent = {
  ...researcherAgent,
  id: 'agent_3',
  name: 'Nova',
  role: 'analyst',
  systemPrompt: 'You are a senior data analyst.',
};

const writerAgent: Agent = {
  ...researcherAgent,
  id: 'agent_4',
  name: 'Luna',
  role: 'writer',
  systemPrompt: 'You are a professional content writer.',
};

const assistantAgent: Agent = {
  ...researcherAgent,
  id: 'agent_5',
  name: 'Orion',
  role: 'assistant',
  systemPrompt: 'You are a versatile AI assistant.',
};

// API key fixture
const nvidiaKey: APIKeyConfig = {
  provider: 'nvidia',
  key: 'nvapi-test-key',
  label: 'Test Key',
  baseUrl: 'https://integrate.api.nvidia.com/v1',
  isActive: true,
};

beforeEach(() => {
  vi.restoreAllMocks();
  // Reset rate limits between tests to avoid cross-test interference
  resetRateLimits();
  // Reset env - no API key by default (to test simulation fallback)
  process.env.VITE_NVIDIA_API_KEY = '';
  process.env.VITE_SUPABASE_URL = '';
  process.env.VITE_SUPABASE_ANON_KEY = '';
});

// ─── queryAgent (simulation fallback) ─────────────────────
describe('queryAgent — simulation fallback (no API keys)', () => {
  it('returns a simulated response for a researcher agent', async () => {
    const result = await queryAgent(researcherAgent, 'Analyze market trends', []);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(50);
    // Simulated responses start with a marker
    expect(result).toContain('_Simulated response');
    expect(result).toContain('Athena');
  });

  it('returns a simulated response for a coder agent', async () => {
    const result = await queryAgent(coderAgent, 'Write a React component', []);
    expect(result).toContain('_Simulated response');
    expect(result).toContain('Neo');
  });

  it('returns a simulated response for an analyst agent', async () => {
    const result = await queryAgent(analystAgent, 'Analyze this data', []);
    expect(result).toContain('_Simulated response');
    expect(result).toContain('Nova');
  });

  it('returns a simulated response for a writer agent', async () => {
    const result = await queryAgent(writerAgent, 'Write a blog post', []);
    expect(result).toContain('_Simulated response');
    expect(result).toContain('Luna');
  });

  it('returns a simulated response for an assistant agent', async () => {
    const result = await queryAgent(assistantAgent, 'Help me with a task', []);
    expect(result).toContain('_Simulated response');
    expect(result).toContain('Orion');
  });

  it('uses conversation history for context (does not throw)', async () => {
    const history: AgentMessage[] = [
      { id: 'msg_1', agentId: 'agent_1', role: 'user', content: 'Previous question', timestamp: '2026-01-01T00:00:00Z' },
      { id: 'msg_2', agentId: 'agent_1', role: 'agent', content: 'Previous answer', timestamp: '2026-01-01T00:01:00Z' },
    ];
    const result = await queryAgent(researcherAgent, 'Follow up question', history);
    expect(result).toBeTruthy();
  });

  it('includes a tip about connecting a real API when no env key is set', async () => {
    const result = await queryAgent(researcherAgent, 'Test', []);
    expect(result).toContain('Tip');
    expect(result).toContain('Integration Center');
  });

  it('includes a tip about checking API key validity when env key IS set', async () => {
    process.env.VITE_NVIDIA_API_KEY = 'nvapi-some-key';
    const result = await queryAgent(researcherAgent, 'Test', []);
    delete process.env.VITE_NVIDIA_API_KEY;
    expect(result).toContain('invalid');
  });

  it('returns different responses across multiple calls (not constant)', async () => {
    const results = await Promise.all([
      queryAgent(researcherAgent, 'Research topic A', []),
      queryAgent(researcherAgent, 'Research topic B with a very different query to change index', []),
    ]);
    // Different inputs should produce different responses (based on message length index)
    // At minimum, the responses should differ in some way
    expect(results[0]).not.toEqual(results[1]);
  });
});

// ─── queryAgent (with API keys — fetch mock) ──────────────
describe('queryAgent — real API path (with mocks)', () => {
  it('returns API response when fetch succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Real API response content' } }],
      }),
    }));

    const result = await queryAgent(researcherAgent, 'Test', [], [nvidiaKey]);
    expect(result).toBe('Real API response content');
  });

  it('falls back to simulation when API returns non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    }));

    const result = await queryAgent(researcherAgent, 'Test', [], [nvidiaKey]);
    expect(result).toContain('_Simulated response');
  });

  it('falls back to simulation when all API keys fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await queryAgent(researcherAgent, 'Test', [], [nvidiaKey]);
    expect(result).toContain('_Simulated response');
  });

  it('falls back to simulation when apiKeys array is empty', async () => {
    const result = await queryAgent(researcherAgent, 'Test', [], []);
    expect(result).toContain('_Simulated response');
  });

  it('tries multiple keys before falling back', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('First key fails'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Second key works' } }],
        }),
      });

    vi.stubGlobal('fetch', mockFetch);

    const keys: APIKeyConfig[] = [
      { ...nvidiaKey, key: 'bad-key' },
      { ...nvidiaKey, key: 'good-key' },
    ];

    const result = await queryAgent(researcherAgent, 'Test', [], keys);
    expect(result).toBe('Second key works');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('tries env var key as additional fallback', async () => {
    process.env.VITE_NVIDIA_API_KEY = 'nvapi-env-key';

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Env key response' } }],
      }),
    }));

    // Pass empty apiKeys array — should pick up env var
    const result = await queryAgent(researcherAgent, 'Test', [], []);
    expect(result).toBe('Env key response');
  });

  it('processes MCP tool calls when detected in response', async () => {
    // First fetch returns a tool call, second fetch returns the final response
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: '```tool_call\n{\n  "name": "analyze_code",\n  "arguments": { "code": "test.js" }\n}\n```\nI will analyze this now.',
            },
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: 'The analysis found no issues.' },
          }],
        }),
      }),
    );

    const result = await queryAgent(researcherAgent, 'Check this code', [], [nvidiaKey]);
    // Should have the final response without the tool_call block
    expect(result).not.toContain('tool_call');
  });
});

// ─── executeWorkflowStep ──────────────────────────────────
describe('executeWorkflowStep', () => {
  it('returns simulated response when no API keys', async () => {
    const result = await executeWorkflowStep(researcherAgent, 'Research topic', '');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('includes context from previous steps in the prompt', async () => {
    const context = 'Previous step found key trends in the market.';
    const result = await executeWorkflowStep(analystAgent, 'Analyze these trends', context);
    expect(result).toBeTruthy();
  });

  it('returns API response when fetch succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Workflow step result' } }],
      }),
    }));

    const result = await executeWorkflowStep(researcherAgent, 'Step prompt', 'Context', [nvidiaKey]);
    expect(result).toBe('Workflow step result');
  });

  it('falls back to simulation on API failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API down')));

    const result = await executeWorkflowStep(researcherAgent, 'Step prompt', 'Context', [nvidiaKey]);
    expect(result).toContain('_Simulated response');
  });

  it('handles MCP tool calls in workflow steps', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: '```tool_call\n{\n  "name": "get_weather",\n  "arguments": { "location": "NYC" }\n}\n```\nFetching weather data...',
            },
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: 'The weather in NYC is 72°F and sunny.' },
          }],
        }),
      }),
    );

    const result = await executeWorkflowStep(researcherAgent, 'What is the weather?', '', [nvidiaKey]);
    expect(result).not.toContain('tool_call');
    expect(result).toContain('NYC');
  });
});

// ─── queryAgent — streaming behavior ────────────────────
describe('queryAgent — streaming behavior (onChunk callback)', () => {
  it('delivers OpenAI-compatible chunks via onChunk callback in order', async () => {
    const mockFetch = vi.fn().mockResolvedValue(createOpenAIStreamResponse(['Hello', ' world', '!']));
    vi.stubGlobal('fetch', mockFetch);

    const chunks: string[] = [];
    const result = await queryAgent(researcherAgent, 'Hi', [], [nvidiaKey], (chunk) => {
      chunks.push(chunk);
    });

    expect(chunks).toEqual(['Hello', ' world', '!']);
    expect(result).toBe('Hello world!');
    vi.unstubAllGlobals();
  });

  it('delivers Anthropic-format chunks via onChunk callback', async () => {
    const anthropicKey: APIKeyConfig = {
      provider: 'anthropic',
      key: 'sk-ant-test',
      label: 'Test Anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      isActive: true,
    };

    const mockFetch = vi.fn().mockResolvedValue(createAnthropicStreamResponse(['Hello', ' Anthropic', ' streaming!']));
    vi.stubGlobal('fetch', mockFetch);

    const chunks: string[] = [];
    const result = await queryAgent(researcherAgent, 'Hi', [], [anthropicKey], (chunk) => {
      chunks.push(chunk);
    });

    expect(chunks).toEqual(['Hello', ' Anthropic', ' streaming!']);
    expect(result).toBe('Hello Anthropic streaming!');
    vi.unstubAllGlobals();
  });

  it('delivers multiple chunks even when SSE events arrive in a single read', async () => {
    // All SSE data arrives as one encoded chunk
    const fullText = [
      'data: {"choices":[{"delta":{"content":"A"}}]}',
      '',
      'data: {"choices":[{"delta":{"content":"B"}}]}',
      '',
      'data: [DONE]',
      '',
    ].join('\n') + '\n';

    const encoder = new TextEncoder();
    const encoded = encoder.encode(fullText);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/event-stream' }),
      body: {
        getReader: () => {
          let done = false;
          return {
            read: async () => {
              if (!done) {
                done = true;
                return { value: encoded, done: false };
              }
              return { value: undefined, done: true };
            },
            releaseLock: () => {},
            cancel: () => {},
            closed: Promise.resolve(undefined),
          };
        },
      },
      text: async () => fullText,
      json: async () => { throw new Error('Not available'); },
      clone: function () { return this; },
    } as any);

    vi.stubGlobal('fetch', mockFetch);

    const chunks: string[] = [];
    const result = await queryAgent(researcherAgent, 'Hi', [], [nvidiaKey], (chunk) => {
      chunks.push(chunk);
    });

    expect(chunks).toEqual(['A', 'B']);
    expect(result).toBe('AB');
    vi.unstubAllGlobals();
  });

  it('handles empty delta content (skips null/undefined chunks)', async () => {
    const sseLines = [
      'data: {"choices":[{"delta":{}}]}',
      '',
      'data: {"choices":[{"delta":{"content":"Hi"}}]}',
      '',
      'data: {"choices":[{"delta":{"content":" there"}}]}',
      '',
      'data: [DONE]',
      '',
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockSSEResponse(sseLines)));

    const chunks: string[] = [];
    const result = await queryAgent(researcherAgent, 'Hi', [], [nvidiaKey], (chunk) => {
      chunks.push(chunk);
    });

    expect(chunks).toEqual(['Hi', ' there']);
    expect(result).toBe('Hi there');
    vi.unstubAllGlobals();
  });

  it('falls back to simulation when streaming fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const chunks: string[] = [];
    const result = await queryAgent(researcherAgent, 'Test', [], [nvidiaKey], (chunk) => {
      chunks.push(chunk);
    });

    expect(result).toContain('_Simulated response');
    // No chunks should have been delivered from the failed stream
    expect(chunks).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('falls back to simulation when streaming returns non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Rate Limited',
      text: async () => 'Rate limited',
      headers: new Headers(),
    }));

    const chunks: string[] = [];
    const result = await queryAgent(researcherAgent, 'Test', [], [nvidiaKey], (chunk) => {
      chunks.push(chunk);
    });

    expect(result).toContain('_Simulated response');
    expect(chunks).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('tries multiple streaming keys before falling back', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('First key fails'))
      .mockResolvedValueOnce(createOpenAIStreamResponse(['Second', ' key', ' works!']));

    vi.stubGlobal('fetch', mockFetch);

    const keys: APIKeyConfig[] = [
      { ...nvidiaKey, key: 'bad-key' },
      { ...nvidiaKey, key: 'good-key' },
    ];

    const chunks: string[] = [];
    const result = await queryAgent(researcherAgent, 'Test', [], keys, (chunk) => {
      chunks.push(chunk);
    });

    expect(chunks).toEqual(['Second', ' key', ' works!']);
    expect(result).toBe('Second key works!');
    expect(mockFetch).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it('uses env var NVIDIA key for streaming when no apiKeys provided', async () => {
    process.env.VITE_NVIDIA_API_KEY = 'nvapi-env-stream-key';

    const mockFetch = vi.fn().mockResolvedValue(createOpenAIStreamResponse(['Env', ' var', ' streaming!']));
    vi.stubGlobal('fetch', mockFetch);

    const chunks: string[] = [];
    const result = await queryAgent(researcherAgent, 'Test', [], [], (chunk) => {
      chunks.push(chunk);
    });

    expect(chunks).toEqual(['Env', ' var', ' streaming!']);
    expect(result).toBe('Env var streaming!');
    expect(mockFetch).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('includes failure details in simulated response after streaming API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid API key',
      headers: new Headers(),
    }));

    const result = await queryAgent(researcherAgent, 'Test', [], [nvidiaKey], () => {});

    expect(result).toContain('_Simulated response');
    expect(result).toContain('API call failed');
    expect(result).toContain('nvidia');
    vi.unstubAllGlobals();
  });

  it('passes AbortSignal correctly to fetch in streaming mode', async () => {
    const controller = new AbortController();
    const mockFetch = vi.fn().mockResolvedValue(createOpenAIStreamResponse(['Hello', ' world']));
    vi.stubGlobal('fetch', mockFetch);

    const result = await queryAgent(researcherAgent, 'Test', [], [nvidiaKey], () => {}, controller.signal);

    // Verify the signal was passed to fetch
    expect(mockFetch).toHaveBeenCalled();
    const callOptions = mockFetch.mock.calls[0][1];
    expect(callOptions.signal).toBeDefined();
    expect(callOptions.signal).toBeInstanceOf(AbortSignal);
    expect(result).toBe('Hello world');
    vi.unstubAllGlobals();
  });

  it('handles MCP tool call loop with streaming', async () => {
    // Build tool call content with proper JSON encoding via JSON.stringify
    const toolCallContent = 'I will check that code.\n```tool_call\n{\n  "name": "analyze_code",\n  "arguments": { "code": "test.js" }\n}\n```\nAnalyzing now...';

    const firstStreamEvents = [
      `data: ${JSON.stringify({ choices: [{ delta: { content: toolCallContent } }] })}`,
      '',
      'data: [DONE]',
      '',
    ];

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(createMockSSEResponse(firstStreamEvents))
      .mockResolvedValueOnce(createOpenAIStreamResponse(['The', ' analysis', ' found', ' no issues.']));

    vi.stubGlobal('fetch', mockFetch);

    const chunks: string[] = [];
    const result = await queryAgent(researcherAgent, 'Check this code', [], [nvidiaKey], (chunk) => {
      chunks.push(chunk);
    });

    // Should NOT contain the tool_call block in the final output
    expect(result).not.toContain('tool_call');
    expect(result).toContain('The analysis found no issues.');
    // Should have made 2 fetch calls (tool call + synthesis)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  // Note: queryAgent always catches errors internally and falls back to
  // simulateResponse, so it never rejects. Abort signal behavior is
  // covered by the 'passes AbortSignal correctly to fetch' test above,
  // and by the AgentContext tests which test AbortError at the context level.
});

// ─── Edge cases ───────────────────────────────────────────
describe('queryAgent — edge cases', () => {
  it('handles empty user message gracefully', async () => {
    const result = await queryAgent(researcherAgent, '', []);
    expect(result).toBeTruthy();
  });

  it('handles very long conversation history without crashing', async () => {
    const history: AgentMessage[] = [];
    for (let i = 0; i < 100; i++) {
      history.push({
        id: `msg_${i}`,
        agentId: 'agent_1',
        role: i % 2 === 0 ? 'user' : 'agent',
        content: `Message ${i} with some content to simulate a long conversation.`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
      });
    }
    const result = await queryAgent(researcherAgent, 'Final question', history);
    expect(result).toBeTruthy();
  });

  it('handles special characters in user message', async () => {
    const result = await queryAgent(researcherAgent, 'Special chars: <script>alert("xss")</script> & "quotes"', []);
    expect(result).toBeTruthy();
  });

  it('handles newlines and multi-line input', async () => {
    const result = await queryAgent(researcherAgent, 'Line 1\nLine 2\nLine 3', []);
    expect(result).toBeTruthy();
  });
});
