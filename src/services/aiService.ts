import type { Agent, AgentMessage, APIKeyConfig } from '../types';
import { buildToolSystemPrompt, parseToolCall, executeTool } from './mcpService';
import { checkRateLimit } from './security';

const DEFAULT_MODEL = 'meta/llama-3.1-8b-instruct';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface AnthropicResponse {
  content: { text: string }[];
}

/**
 * Detect if we're running in a browser dev environment.
 * When true, API calls that are blocked by CORS can be routed
 * through the Vite dev proxy to bypass browser restrictions.
 */
function isDevMode(): boolean {
  return typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

/**
 * Get the correct API base URL for a provider.
 * In dev mode, route NVIDIA API calls through the Vite proxy
 * to avoid CORS issues. All other providers use the original URL.
 */
function getApiBaseUrl(keyConfig: APIKeyConfig): string {
  if (isDevMode() && keyConfig.provider === 'nvidia') {
    // Use Vite dev proxy to bypass CORS
    return '/api/nvidia';
  }
  return keyConfig.baseUrl.replace(/\/$/, '');
}

/**
 * Helper to parse Server-Sent Events (SSE) streams from AI APIs
 */
async function* parseSSE(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        if (data) yield data;
      }
    }
  }
}

/**
 * Stream responses from AI APIs with abort support
 */
async function* streamAIAPI(
  messages: ChatMessage[],
  agent: Agent,
  apiKeys: APIKeyConfig[],
  failures?: { provider: string; status?: number; error: string }[],
  abortSignal?: AbortSignal
): AsyncGenerator<string> {
  const envKey = import.meta.env.VITE_NVIDIA_API_KEY;
  const envProviders: APIKeyConfig[] = envKey
    ? [{
        provider: 'nvidia',
        key: envKey,
        label: 'Environment Variable',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        isActive: true,
      }]
    : [];

  const allKeys = [...apiKeys.filter(k => k.isActive), ...envProviders];

  for (const keyConfig of allKeys) {
    try {
      // Use proxy-aware base URL (routes through Vite proxy in dev)
      const baseUrl = getApiBaseUrl(keyConfig);

      // Combine external abort signal with timeout
      const timeoutSignal = AbortSignal.timeout(30000);
      const combinedSignal = abortSignal
        ? AbortSignal.any([timeoutSignal, abortSignal])
        : timeoutSignal;

      if (keyConfig.provider === 'anthropic') {
        const response = await fetch(`${baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': keyConfig.key,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: agent.model?.includes('claude') ? agent.model : 'claude-3-haiku-20240307',
            messages: messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
            system: messages.find(m => m.role === 'system')?.content,
            temperature: agent.temperature ?? 0.5,
            max_tokens: 4096,
            stream: true,
          }),
          signal: combinedSignal,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          failures?.push({ provider: keyConfig.provider, status: response.status, error: errText.slice(0, 100) });
          continue;
        }

        for await (const chunk of parseSSE(response)) {
          try {
            const data = JSON.parse(chunk);
            if (data.type === 'content_block_delta' && data.delta?.text) {
              yield data.delta.text;
            }
          } catch {
            // Ignore non-JSON chunks
          }
        }
        return;
      }

      // OpenAI-compatible (NVIDIA, OpenAI, custom providers)
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyConfig.key}`,
        },
        body: JSON.stringify({
          model: agent.model || DEFAULT_MODEL,
          messages,
          temperature: agent.temperature ?? 0.5,
          top_p: 1,
          max_tokens: 4096,
          stream: true,
        }),
        signal: combinedSignal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        failures?.push({ provider: keyConfig.provider, status: response.status, error: errText.slice(0, 100) });
        continue;
      }

      for await (const chunk of parseSSE(response)) {
        try {
          const data = JSON.parse(chunk);
          const content = data.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Ignore non-JSON chunks
        }
      }
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      failures?.push({ provider: keyConfig.provider, error: msg });
      continue;
    }
  }
}

/**
 * Generate a simulated agent response for demo/fallback scenarios
 */
function simulateResponse(
  agent: Agent,
  userMessage: string,
  history: AgentMessage[] = [],
  apiFailures?: { provider: string; status?: number; error: string }[]
): string {
  const prevMessages = history.filter((m) => m.role === 'user').length;

  const researcherResponses = [
    `Based on my analysis of the latest data, here are the key findings:

1. **Market Trend**: The AI industry continues to grow at 35% YoY, with enterprise adoption reaching 72% in 2026
2. **Key Insight**: Organizations implementing multi-agent systems report 3x faster task completion
3. **Recommendation**: Focus on retrieval-augmented generation (RAG) for domain-specific accuracy

I can deep-dive into any of these areas if you need more detail.`,

    `I have gathered several sources on this topic:

**Primary finding**: The data suggests a significant shift toward autonomous AI agents in production environments.

**Supporting evidence**:
- 68% of enterprises now run AI agents in production (up from 34% in 2024)
- Average ROI on agent deployments: 4.2x within 6 months
- Top use cases: Customer support (42%), Code generation (38%), Data analysis (33%)

Would you like me to explore any specific aspect further?`,

    `Let me synthesize what I found:

**Executive Summary**: The convergence of large language models and agentic frameworks is creating a new paradigm in software architecture.

**Detailed Analysis**:
- Multi-agent orchestration frameworks have matured significantly
- Tool-use capabilities have expanded beyond simple API calls
- Safety and alignment remain critical considerations

*Sources indicate this trend will accelerate through 2027.*`,
  ];

  const coderResponses = [
    `Let me write that for you:

\`\`\`typescript
// Optimized implementation with full type safety
interface AppConfig {
  apiEndpoint: string;
  timeout: number;
  retryCount: number;
}

function initializeApp(config: AppConfig): void {
  console.log(\`Starting app with \${config.apiEndpoint}\`);
  // Configure with proper error handling
  if (config.timeout < 1000) {
    throw new Error('Timeout must be at least 1000ms');
  }
}
\`\`\`

This implementation follows best practices with proper error handling, type safety, and clean separation of concerns. I can add tests or documentation if needed.`,

    `I reviewed the approach and here is my recommended architecture:

**Architecture Overview**:
\`\`\`
+-------------+     +-------------+     +-------------+
|  API Layer  | --> | Business    | --> |  Data       |
|  (REST)     | <-- | Logic       | <-- |  Access     |
+-------------+     +-------------+     +-------------+
\`\`\`

Key considerations:
- Use dependency injection for testability
- Implement caching at the API layer
- Add comprehensive error boundaries
- Follow the single responsibility principle

Shall I provide a full implementation?`,

    `Here is a clean solution:

\`\`\`python
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class AgentConfig:
    name: str
    role: str
    model: str
    temperature: float = 0.5

class AgentManager:
    \"\"\"Manages AI agent lifecycle and task distribution.\"\"\"

    def __init__(self):
        self._agents: List[AgentConfig] = []
        self._task_queue: List[dict] = []

    def register_agent(self, agent: AgentConfig) -> None:
        self._agents.append(agent)

    def dispatch_task(self, description: str) -> str:
        msg = f"Task dispatched to {len(self._agents)} agents"
        return msg
\`\`\`

This is production-ready with docstrings and type hints.`,
  ];

  const analystResponses = [
    `Here is my analysis of the data:

**Key Metrics**:
| Metric | Value | Trend |
|--------|-------|-------|
| Growth Rate | 28.5% | Up |
| Efficiency | 94.2% | Strong |
| Risk Score | 12.3 | Low |
| User Adoption | 67.8% | Growing |

**Insights**:
1. The data shows a clear upward trajectory across all key indicators
2. Notable improvement in operational efficiency (+15% QoQ)
3. Risk factors remain well within acceptable thresholds

**Recommendation**: Continue current strategy with increased focus on user adoption.`,

    `I completed the analysis. Here are the critical findings:

**Deep Dive Analysis**:

**Pattern Recognition**:
- Seasonal variance: +22% during Q4, consistent with benchmarks
- User behavior clusters: 3 distinct segments identified
- Anomaly detection: 2 outliers flagged for review

**Predictive Model Output**:
\`\`\`
Forecast (Next Quarter): +15-20% growth
Confidence Interval: 95%
Key Drivers: Automation adoption, Market expansion
\`\`\`

Would you like me to drill down into any specific metric?`,

    `Let me present the data visualization summary:

**Dashboard Overview**:

**Performance Indicators**:
- System uptime: 99.97%
- Response time: 142ms avg
- Error rate: 0.03% (nominal)
- Throughput: 2.4k req/s

**Trend Analysis**:
The 30-day moving average shows consistent improvement with a notable performance spike after the latest optimization deployment.

**Action Items**:
1. Monitor error rate threshold
2. Scale capacity for projected growth
3. Run A/B tests on new optimization strategies`,
  ];

  const writerResponses = [
    `Here is a draft I prepared:

---

**Headline**: The Future of AI: Why Multi-Agent Systems Are Revolutionizing Enterprise Workflows

**Introduction**:
In today's fast-paced digital landscape, organizations are constantly seeking ways to maximize efficiency while maintaining quality. Enter multi-agent AI systems — a paradigm shift in how we approach complex task automation.

**Key Points**:
- **Collaboration at Scale**: Multiple AI agents working in concert can accomplish tasks exponentially faster
- **Specialized Expertise**: Each agent brings domain-specific knowledge to the table
- **Seamless Integration**: Modern frameworks make orchestration transparent

*I can expand this into a full article or adjust the tone for different audiences.*`,

    `I crafted compelling copy for this:

---

**Tagline Options**:

1. "Smarter Together: Orchestrate Your AI Workforce"
2. "From Prompts to Production: AgentVerse Powers Your Pipeline"
3. "Your Ideas, Amplified — AI Agents That Deliver"

**Micro-copy**:
- CTA Button: "Deploy Your First Agent"
- Hero Subtitle: "Build, manage, and orchestrate intelligent agents that work 24/7."
- Feature Description: "Each agent brings unique expertise. Together, they form an unstoppable team."

I can refine the tone or develop full marketing materials.`,

    `Here is the content in a polished format:

---

**Title**: Building Trust in AI: Best Practices for Enterprise Deployments

**Executive Summary**:
As artificial intelligence becomes deeply embedded in enterprise operations, establishing trust through transparency, reliability, and ethical guidelines is paramount.

**Core Principles**:
1. **Transparency**: Clear communication about AI capabilities and limitations
2. **Reliability**: Consistent, verifiable outputs with human oversight
3. **Accountability**: Clear ownership and governance structures
4. **Ethics**: Bias detection, fairness metrics, and inclusive design

---
*Ready to expand this into a full whitepaper or blog series.*`,
  ];

  const assistantResponses = [
    `I am happy to help with that! Here is my response:

Based on your request, I can assist in several ways:

1. **Research**: I can gather and synthesize information from various sources
2. **Analysis**: I can process data and identify patterns
3. **Creation**: I can generate content, code, or creative work
4. **Problem-Solving**: I can break down complex problems into manageable steps

What specific aspect would you like me to focus on? I am here to help!`,

    `Great question! Let me break this down:

**Here is what I can do for you**:

- **Task Management**: Breaking down complex projects into actionable steps
- **Knowledge Work**: Researching, summarizing, and synthesizing information
- **Creative Support**: Brainstorming ideas, drafting content, refining concepts
- **Technical Help**: Code reviews, debugging, architecture advice

**Quick Tip**: For best results, be specific about what you need and I will tailor my approach.

Is there anything else you would like to explore?`,

    `I understand what you are looking for. Here is my approach:

**Strategy**:
1. First, I will gather all relevant context and requirements
2. Then, I will work through the solution step by step
3. Finally, I will present the results with clear explanations

**What I Need From You**:
- Any specific constraints or preferences
- Desired outcome or success criteria
- Timeline or priority level

Let us get started! Drop me the details and I will take it from there.`,
  ];

  const roleResponses: Record<string, string[]> = {
    researcher: researcherResponses,
    coder: coderResponses,
    analyst: analystResponses,
    writer: writerResponses,
    assistant: assistantResponses,
  };

  const responses = roleResponses[agent.role] || assistantResponses;
  const responseIndex = (prevMessages + userMessage.length) % responses.length;

  // Build a detailed failure message when API keys exist but all failed
  let failureDetail = '';
  if (apiFailures && apiFailures.length > 0) {
    const unique = [...new Set(apiFailures.map(f => f.provider))];
    failureDetail = `\n\n**API call failed for: ${unique.join(', ')}**`;
    for (const f of apiFailures.slice(0, 2)) {
      let reason = f.error;
      if (f.status) reason += ` (HTTP ${f.status})`;
      failureDetail += `\n- \`${f.provider}\`: ${reason}`;
    }
    failureDetail += '\n\nCheck the browser console (F12) for full error details.';
  }

  const hasKeys = apiFailures && apiFailures.length > 0
    || !!(import.meta.env.VITE_NVIDIA_API_KEY);
  const tip = hasKeys
    ? 'Your API key may be invalid or expired. Check the Integration Center to verify your keys.'
    : 'Tip: Connect a real AI API via the Integration Center (Integrations → API Keys) for live responses.';

  return (
    `_Simulated response for ${agent.name}_\n\n` +
    `${responses[responseIndex]}${failureDetail}\n\n` +
    `---\n_${tip}_`
  );
}

/**
 * Try calling AI APIs using keys from the Integration Center.
 * Iterates through all active API keys and tries each one until success.
 * Returns the response text OR fills `failures` with error details and returns null.
 */
async function callAIAPI(
  messages: ChatMessage[],
  agent: Agent,
  apiKeys: APIKeyConfig[],
  failures?: { provider: string; status?: number; error: string }[]
): Promise<string | null> {
  // Also check env var as fallback
  const envKey = import.meta.env.VITE_NVIDIA_API_KEY;
  const envProviders: APIKeyConfig[] = envKey
    ? [{
        provider: 'nvidia',
        key: envKey,
        label: 'Environment Variable',
        baseUrl: 'https://integrate.api.nvidia.com/v1',
        isActive: true,
      }]
    : [];

  const allKeys = [...apiKeys.filter(k => k.isActive), ...envProviders];

  for (const keyConfig of allKeys) {
    try {
      // Use proxy-aware base URL (routes through Vite proxy in dev)
      const baseUrl = getApiBaseUrl(keyConfig);

      // Handle different provider API formats
      if (keyConfig.provider === 'anthropic') {
        const response = await fetch(`${baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': keyConfig.key,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: agent.model?.includes('claude') ? agent.model : 'claude-3-haiku-20240307',
            messages: messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
            system: messages.find(m => m.role === 'system')?.content,
            temperature: agent.temperature ?? 0.5,
            max_tokens: 4096,
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          const msg = `HTTP ${response.status}: ${errText.slice(0, 100) || response.statusText}`;
          failures?.push({ provider: keyConfig.provider, status: response.status, error: msg });
          console.warn(`[AI Service] ${keyConfig.provider} returned ${response.status}: ${errText.slice(0, 200)}`);
          continue;
        }
        const data = (await response.json()) as AnthropicResponse;
        return data.content?.[0]?.text || null;
      }

      // OpenAI-compatible (NVIDIA, OpenAI, custom providers)
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyConfig.key}`,
        },
        body: JSON.stringify({
          model: agent.model || DEFAULT_MODEL,
          messages,
          temperature: agent.temperature ?? 0.5,
          top_p: 1,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        const msg = `HTTP ${response.status}: ${errText.slice(0, 100) || response.statusText}`;
        failures?.push({ provider: keyConfig.provider, status: response.status, error: msg });
        console.warn(`[AI Service] ${keyConfig.provider} returned ${response.status}: ${errText.slice(0, 200)}`);
        continue;
      }

      const data = (await response.json()) as CompletionResponse;
      return data.choices?.[0]?.message?.content || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      failures?.push({ provider: keyConfig.provider, error: msg });
      console.warn(`[AI Service] ${keyConfig.provider} threw: ${msg}`);
      continue; // Try next key
    }
  }

  return null; // All keys failed
}

/**
/**
 * Send a prompt to an AI agent and get a response
 * Supports MCP tool-calling loop: detects tool requests, executes them, continues
 * Now supports real-time streaming via onChunk callback.
 * Includes rate limiting — max 10 calls per 5 seconds per agent.
 */
export async function queryAgent(
  agent: Agent,
  userMessage: string,
  conversationHistory: AgentMessage[] = [],
  apiKeys: APIKeyConfig[] = [],
  onChunk?: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<string> {
  // Rate limiting: max 10 calls per agent per 5 seconds
  const rateLimitKey = `agent:${agent.id}`;
  if (!checkRateLimit(rateLimitKey, 10, 5000)) {
    return `_I'm receiving too many requests. Please wait a moment and try again._\n\n---\n_Rate limit exceeded. You can send another message in a few seconds._`;
  }

  try {
    const mcpPrompt = buildToolSystemPrompt();
    const systemPrompt = agent.systemPrompt + mcpPrompt;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent conversation history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add the new user message
    messages.push({ role: 'user', content: userMessage });

    // Try real API first with Integration Center keys
    const apiFailures: { provider: string; status?: number; error: string }[] = [];
    let content = '';

    if (onChunk) {
      // Streaming mode
      for await (const chunk of streamAIAPI(messages, agent, apiKeys, apiFailures, abortSignal)) {
        content += chunk;
        onChunk(chunk);
      }
    } else {
      // Legacy synchronous mode
      content = await callAIAPI(messages, agent, apiKeys, apiFailures) || '';
    }

    // Fall back to simulation if API fails/returns empty
    if (!content && (!onChunk || apiFailures.length > 0)) {
      return simulateResponse(agent, userMessage, conversationHistory, apiFailures);
    }

    // MCP Tool-Calling Loop: check if the response contains a tool call
    // Max 3 tool calls per request to prevent infinite loops
    let toolCallCount = 0;
    const MAX_TOOL_CALLS = 3;

    while (toolCallCount < MAX_TOOL_CALLS) {
      const toolCall = parseToolCall(content);
      if (!toolCall) break; // No more tool calls

      toolCallCount++;

      // Execute the tool
      const toolResult = await executeTool(toolCall.name, toolCall.arguments);

      // Add the assistant's message (with tool call) to history
      messages.push({ role: 'assistant', content });

      // Add a "tool result" as a user message so the AI can continue
      messages.push({
        role: 'user',
        content: `[Tool ${toolCall.name} returned]:\n${toolResult}\n\nPlease use this result to continue your response. Do NOT include another tool_call block unless necessary.`,
      });

      // Get the AI's synthesis
      let nextContent = '';
      if (onChunk) {
        for await (const chunk of streamAIAPI(messages, agent, apiKeys, apiFailures, abortSignal)) {
          nextContent += chunk;
          onChunk(chunk);
        }
      } else {
        nextContent = await callAIAPI(messages, agent, apiKeys, apiFailures) || '';
      }

      if (!nextContent) break;

      content = nextContent;

      // Remove the tool_call instruction from the output if present
      content = content.replace(/```tool_call[\s\S]*?```/g, '').trim();
    }

    return content;
  } catch (error) {
    console.warn('AI query failed, using simulation fallback:', error);
    return simulateResponse(agent, userMessage, conversationHistory);
  }
}

/**
 * Execute a multi-step workflow by chaining agent calls
 */
export async function executeWorkflowStep(
  agent: Agent,
  prompt: string,
  contextFromPreviousSteps: string,
  apiKeys: APIKeyConfig[] = []
): Promise<string> {
  const fullPrompt = contextFromPreviousSteps
    ? `Context from previous steps:\n${contextFromPreviousSteps}\n\nYour task:\n${prompt}`
    : prompt;

  try {
    const mcpPrompt = buildToolSystemPrompt();
    const messages: ChatMessage[] = [
      { role: 'system', content: agent.systemPrompt + mcpPrompt },
      { role: 'user', content: fullPrompt },
    ];

    const apiFailures: { provider: string; status?: number; error: string }[] = [];
    const content = await callAIAPI(messages, agent, apiKeys, apiFailures);
    if (content) {
      // Process any tool calls in workflow steps too
      let result = content;
      const toolCall = parseToolCall(result);
      if (toolCall) {
        const toolResult = await executeTool(toolCall.name, toolCall.arguments);
        messages.push({ role: 'assistant', content: result });
        messages.push({
          role: 'user',
          content: `[Tool ${toolCall.name} returned]:\n${toolResult}\n\nContinue your response.`,
        });
        const nextContent = await callAIAPI(messages, agent, apiKeys, apiFailures);
        if (nextContent) {
          result = nextContent.replace(/```tool_call[\s\S]*?```/g, '').trim();
        }
      }
      return result;
    }

    return simulateResponse(agent, fullPrompt, [], apiFailures);
  } catch (error) {
    console.warn('Workflow step failed, using simulation fallback:', error);
    return simulateResponse(agent, fullPrompt, [], [{ provider: 'all', error: error instanceof Error ? error.message : 'Unknown error' }]);
  }
}
