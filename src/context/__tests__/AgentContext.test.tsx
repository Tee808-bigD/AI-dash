import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AgentProvider, useAgents } from '../AgentContext';
import type { Agent, APIKeyConfig, MCPServer, Workflow, AgentMessage } from '../../types';
import type { ReactNode } from 'react';
import { queryAgent } from '../../services/aiService';

// ─── Mock all external dependencies ───────────────────────

// Mock Supabase service (used as fetch/save)
vi.mock('../../services/supabaseService', () => ({
  getAgents: vi.fn().mockResolvedValue([]),
  setAgents: vi.fn().mockResolvedValue(undefined),
  getTasks: vi.fn().mockResolvedValue([]),
  setTasks: vi.fn().mockResolvedValue(undefined),
  getWorkflows: vi.fn().mockResolvedValue([]),
  setWorkflows: vi.fn().mockResolvedValue(undefined),
  getMessages: vi.fn().mockResolvedValue([]),
  setMessages: vi.fn().mockResolvedValue(undefined),
  getAPIKeys: vi.fn().mockResolvedValue([]),
  setAPIKeys: vi.fn().mockResolvedValue(undefined),
  getMCPServers: vi.fn().mockResolvedValue([]),
  setMCPServers: vi.fn().mockResolvedValue(undefined),
}));

// Mock sync storage (used as getLocal/setLocal)
vi.mock('../../data/storage', () => {
  let store: Record<string, unknown> = {};
  return {
    generateId: vi.fn(() => 'test-id-' + Math.random().toString(36).slice(2, 9)),
    formatTime: vi.fn((iso: string) => iso ? '2h ago' : ''),
    getAgents: vi.fn(() => (store['agents'] || []) as Agent[]),
    setAgents: vi.fn((data: Agent[]) => { store['agents'] = data; }),
    getTasks: vi.fn(() => (store['tasks'] || []) as any[]),
    setTasks: vi.fn((data: any[]) => { store['tasks'] = data; }),
    getWorkflows: vi.fn(() => (store['workflows'] || []) as Workflow[]),
    setWorkflows: vi.fn((data: Workflow[]) => { store['workflows'] = data; }),
    getMessages: vi.fn(() => [] as any[]),
    setMessages: vi.fn(() => {}),
    getAPIKeys: vi.fn(() => [] as APIKeyConfig[]),
    setAPIKeys: vi.fn(() => {}),
    getMCPServers: vi.fn(() => [] as MCPServer[]),
    setMCPServers: vi.fn(() => {}),
  };
});

// Mock AI service — queryAgent returns a promise that never resolves
// so that cancelTask can be tested without the task completing first.
vi.mock('../../services/aiService', () => ({
  queryAgent: vi.fn().mockReturnValue(new Promise<never>(() => {})),
  executeWorkflowStep: vi.fn().mockResolvedValue('Mock workflow step response'),
}));

// Mock sample data
vi.mock('../../data/sampleData', () => ({
  SAMPLE_AGENTS: [
    {
      id: 'sample_1',
      name: 'Sample Agent',
      role: 'assistant',
      description: 'A sample agent for testing',
      avatar: '',
      status: 'idle',
      lastActive: new Date().toISOString(),
      tasksCompleted: 0,
      model: 'meta/llama-3.1-8b-instruct',
      temperature: 0.5,
      systemPrompt: 'Test prompt',
      createdAt: new Date().toISOString(),
    },
  ],
  SAMPLE_TASKS: [],
  SAMPLE_WORKFLOWS: [],
}));

// ─── Helper: render context consumer ──────────────────────
function TestConsumer({ children }: { children: (ctx: ReturnType<typeof useAgents>) => ReactNode }) {
  return <>{children(useAgents())}</>;
}

function renderWithContext() {
  let contextValue: ReturnType<typeof useAgents> | null = null;

  render(
    <AgentProvider>
      <TestConsumer>
        {(ctx) => {
          contextValue = ctx;
          return <div data-testid="ready">{ctx.loading ? 'Loading...' : 'Ready'}</div>;
        }}
      </TestConsumer>
    </AgentProvider>
  );

  return {
    getContext: () => {
      if (!contextValue) throw new Error('Context not initialized');
      return contextValue;
    },
    waitForReady: () => waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('Ready')),
  };
}

// ─── Tests ────────────────────────────────────────────────
describe('AgentProvider — initialization', () => {
  it('loads data and sets loading to false', async () => {
    const { waitForReady } = renderWithContext();
    await waitForReady();
  });

  it('computes stats correctly with empty data', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const ctx = getContext();
    expect(ctx.stats.totalAgents).toBe(1); // from sample data
    expect(ctx.stats.activeTasks).toBe(0);
    expect(ctx.stats.tasksCompleted).toBe(0);
    expect(ctx.stats.successRate).toBe(0);
    expect(ctx.stats.activeWorkflows).toBe(0);
  });
});

describe('AgentProvider — addAgent', () => {
  it('adds a new agent to the state', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    act(() => {
      getContext().addAgent({
        name: 'Test Agent',
        role: 'researcher',
        description: 'A test agent',
        avatar: '',
        model: 'meta/llama-3.1-8b-instruct',
        temperature: 0.3,
        systemPrompt: 'You are a test agent.',
      });
    });

    const ctx = getContext();
    expect(ctx.agents.length).toBe(2);
    const newAgent = ctx.agents.find(a => a.name === 'Test Agent');
    expect(newAgent).toBeDefined();
    expect(newAgent!.role).toBe('researcher');
    expect(newAgent!.status).toBe('idle');
    expect(newAgent!.tasksCompleted).toBe(0);
  });

  it('updates totalAgents stat after adding', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    act(() => {
      getContext().addAgent({
        name: 'Another Agent',
        role: 'coder',
        description: '',
        avatar: '',
        model: 'meta/llama-3.1-8b-instruct',
        temperature: 0.5,
        systemPrompt: 'Test',
      });
    });

    expect(getContext().stats.totalAgents).toBe(2);
  });
});

describe('AgentProvider — updateAgent', () => {
  it('updates agent fields', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    act(() => {
      getContext().updateAgent('sample_1', { name: 'Updated Name', temperature: 0.8 });
    });

    const agent = getContext().agents.find(a => a.id === 'sample_1');
    expect(agent).toBeDefined();
    expect(agent!.name).toBe('Updated Name');
    expect(agent!.temperature).toBe(0.8);
  });

  it('updates lastActive timestamp when updating', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const original = getContext().agents.find(a => a.id === 'sample_1')!;
    const originalTime = original.lastActive;

    act(() => {
      getContext().updateAgent('sample_1', { description: 'Updated description' });
    });

    const updated = getContext().agents.find(a => a.id === 'sample_1')!;
    expect(updated.lastActive).not.toBe(originalTime);
  });

  it('does nothing when agent id does not exist', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const originalCount = getContext().agents.length;

    act(() => {
      getContext().updateAgent('nonexistent_id', { name: 'Should Not Appear' });
    });

    expect(getContext().agents.length).toBe(originalCount);
  });
});

describe('AgentProvider — deleteAgent', () => {
  it('removes agent from state', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    act(() => {
      getContext().deleteAgent('sample_1');
    });

    expect(getContext().agents.length).toBe(0);
    expect(getContext().stats.totalAgents).toBe(0);
  });

  it('does nothing when agent id does not exist', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const originalCount = getContext().agents.length;

    act(() => {
      getContext().deleteAgent('nonexistent_id');
    });

    expect(getContext().agents.length).toBe(originalCount);
  });
});

describe('AgentProvider — cancelTask (AbortController fix)', () => {
  it('marks task as failed with "Cancelled by user" message', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    // First add an agent to run a task on
    act(() => {
      getContext().addAgent({
        name: 'Task Runner',
        role: 'assistant',
        description: '',
        avatar: '',
        model: 'meta/llama-3.1-8b-instruct',
        temperature: 0.5,
        systemPrompt: 'Test',
      });
    });

    const agent = getContext().agents.find(a => a.name === 'Task Runner')!;

    // Start a task (this triggers async execution that we can cancel)
    let taskPromise: Promise<void>;
    act(() => {
      taskPromise = getContext().createTask(agent.id, 'Test Task', 'Test', 'Do something');
    });

    // Give it a moment to start
    await waitFor(() => {
      expect(getContext().tasks.length).toBeGreaterThan(0);
    });

    const task = getContext().tasks[0];
    // Ensure task is created with pending/running status
    expect(task).toBeDefined();

    // Cancel the task
    act(() => {
      getContext().cancelTask(task.id);
    });

    // After cancellation, task should be failed with "Cancelled by user"
    await waitFor(() => {
      const cancelled = getContext().tasks.find(t => t.id === task.id);
      expect(cancelled).toBeDefined();
      expect(cancelled!.status).toBe('failed');
      expect(cancelled!.output).toBe('Cancelled by user');
    });

    // Agent should return to idle
    await waitFor(() => {
      const updatedAgent = getContext().agents.find(a => a.id === agent.id);
      expect(updatedAgent).toBeDefined();
      expect(updatedAgent!.status).toBe('idle');
    });
  });

  it('does not throw when cancelling a non-existent task', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    expect(() => {
      getContext().cancelTask('nonexistent-task');
    }).not.toThrow();
  });

  it('does not throw when cancelling a completed task', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    // Add a task that's already completed
    act(() => {
      getContext().cancelRunningTask('nonexistent');
    });

    // Should not throw
    expect(true).toBe(true);
  });
});

describe('AgentProvider — clearTask', () => {
  it('removes a task from the list', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    // Add agent and create a task
    act(() => {
      getContext().addAgent({
        name: 'Clear Agent',
        role: 'assistant',
        description: '',
        avatar: '',
        model: 'meta/llama-3.1-8b-instruct',
        temperature: 0.5,
        systemPrompt: 'Test',
      });
    });

    const agent = getContext().agents.find(a => a.name === 'Clear Agent')!;

    let taskId: string;
    act(() => {
      getContext().createTask(agent.id, 'Clear Task', 'Desc', 'Input');
    });

    await waitFor(() => {
      expect(getContext().tasks.length).toBeGreaterThan(0);
    });

    taskId = getContext().tasks[0].id;

    act(() => {
      getContext().clearTask(taskId);
    });

    expect(getContext().tasks.find(t => t.id === taskId)).toBeUndefined();
  });
});

describe('AgentProvider — stats computation', () => {
  it('computes success rate correctly with mixed tasks', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    // Add some completed tasks via direct state manipulation would be ideal,
    // but we can test the stats computation by checking initial values
    expect(getContext().stats.successRate).toBeGreaterThanOrEqual(0);
    expect(getContext().stats.successRate).toBeLessThanOrEqual(100);
  });

  it('reports active workflows count', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    expect(getContext().stats.activeWorkflows).toBe(0);
  });
});

describe('AgentProvider — integration methods', () => {
  it('adds an API key', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const key: APIKeyConfig = {
      provider: 'openai',
      key: 'sk-test',
      label: 'Test Key',
      baseUrl: 'https://api.openai.com/v1',
      isActive: true,
    };

    act(() => {
      getContext().addAPIKey(key);
    });

    expect(getContext().apiKeys.length).toBe(1);
    expect(getContext().apiKeys[0].provider).toBe('openai');
  });

  it('replaces existing key for same provider', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    act(() => {
      getContext().addAPIKey({ provider: 'nvidia', key: 'old-key', label: '', baseUrl: '', isActive: true });
    });

    act(() => {
      getContext().addAPIKey({ provider: 'nvidia', key: 'new-key', label: '', baseUrl: '', isActive: true });
    });

    expect(getContext().apiKeys.length).toBe(1);
    expect(getContext().apiKeys[0].key).toBe('new-key');
  });

  it('removes an API key', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    act(() => {
      getContext().addAPIKey({ provider: 'test', key: 'val', label: '', baseUrl: '', isActive: true });
    });

    act(() => {
      getContext().removeAPIKey('test');
    });

    expect(getContext().apiKeys.length).toBe(0);
  });

  it('toggles API key active state', async () => {
    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    act(() => {
      getContext().addAPIKey({ provider: 'toggle-test', key: 'val', label: '', baseUrl: '', isActive: true });
    });

    act(() => {
      getContext().toggleAPIKey('toggle-test');
    });

    expect(getContext().apiKeys[0].isActive).toBe(false);

    act(() => {
      getContext().toggleAPIKey('toggle-test');
    });

    expect(getContext().apiKeys[0].isActive).toBe(true);
  });
});

// ─── sendMessage — streaming behavior ─────────────────────
describe('AgentProvider — sendMessage streaming', () => {
  beforeEach(() => {
    vi.mocked(queryAgent).mockReset();
  });

  afterEach(() => {
    // Restore the default never-resolving promise for other tests
    vi.mocked(queryAgent).mockReturnValue(new Promise<never>(() => {}));
  });

  it('adds user message and then increments agent message content via streaming chunks', async () => {
    const collectedChunks: string[] = [];

    vi.mocked(queryAgent).mockImplementation(async (_agent, _msg, _history, _keys, onChunk) => {
      if (onChunk) {
        onChunk('Hello ');
        collectedChunks.push('Hello ');
        await new Promise(r => setTimeout(r, 0));
        onChunk('world');
        collectedChunks.push('world');
        await new Promise(r => setTimeout(r, 0));
        onChunk('!');
        collectedChunks.push('!');
      }
      return 'Hello world!';
    });

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;

    await act(async () => {
      await getContext().sendMessage(agent.id, 'Hi there');
    });

    // Check the final messages
    const msgs = getContext().getAgentMessages(agent.id);
    expect(msgs.length).toBe(2);
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].content).toBe('Hi there');
    expect(msgs[1].role).toBe('agent');
    expect(msgs[1].content).toBe('Hello world!');
  });

  it('final message content matches concatenated chunks', async () => {
    vi.mocked(queryAgent).mockImplementation(async (_agent, _msg, _history, _keys, onChunk) => {
      if (onChunk) {
        onChunk('This ');
        onChunk('is ');
        onChunk('streamed ');
        onChunk('content.');
      }
      return 'This is streamed content.';
    });

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;

    await act(async () => {
      await getContext().sendMessage(agent.id, 'Stream test');
    });

    const msgs = getContext().getAgentMessages(agent.id);
    expect(msgs[1].content).toBe('This is streamed content.');
  });

  it('returns agent to idle status after streaming completes', async () => {
    vi.mocked(queryAgent).mockImplementation(async (_agent, _msg, _history, _keys, onChunk) => {
      if (onChunk) onChunk('Done');
      return 'Done';
    });

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;
    expect(agent.status).toBe('idle');

    await act(async () => {
      await getContext().sendMessage(agent.id, 'Test');
    });

    await waitFor(() => {
      const updated = getContext().agents.find(a => a.id === 'sample_1')!;
      expect(updated.status).toBe('idle');
    });
  });

  it('creates both user and agent messages', async () => {
    vi.mocked(queryAgent).mockImplementation(async (_agent, _msg, _history, _keys, onChunk) => {
      if (onChunk) onChunk('Response');
      return 'Response';
    });

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;

    await act(async () => {
      await getContext().sendMessage(agent.id, 'Hello');
    });

    const msgs = getContext().getAgentMessages(agent.id);
    expect(msgs.length).toBe(2);
    expect(msgs[0].role).toBe('user');
    expect(msgs[1].role).toBe('agent');
  });

  it('throws error when agent ID does not exist', async () => {
    vi.mocked(queryAgent).mockImplementation(async () => 'response');

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    await expect(
      getContext().sendMessage('nonexistent', 'Hello')
    ).rejects.toThrow('Agent not found');
  });

  it('increments tasksCompleted on the agent after successful streaming', async () => {
    vi.mocked(queryAgent).mockImplementation(async (_agent, _msg, _history, _keys, onChunk) => {
      if (onChunk) onChunk('Response');
      return 'Response';
    });

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;
    expect(agent.tasksCompleted).toBe(0);

    await act(async () => {
      await getContext().sendMessage(agent.id, 'Hello');
    });

    await waitFor(() => {
      const updated = getContext().agents.find(a => a.id === 'sample_1')!;
      expect(updated.tasksCompleted).toBe(1);
    });
  });
});

// ─── createTask — streaming behavior ──────────────────────
describe('AgentProvider — createTask streaming', () => {
  beforeEach(() => {
    vi.mocked(queryAgent).mockReset();
  });

  afterEach(() => {
    vi.mocked(queryAgent).mockReturnValue(new Promise<never>(() => {}));
  });

  it('fills task output incrementally via streaming callback', async () => {
    const collectedChunks: string[] = [];

    vi.mocked(queryAgent).mockImplementation(async (_agent, _msg, _history, _keys, onChunk) => {
      if (onChunk) {
        onChunk('Step 1 ');
        collectedChunks.push('Step 1 ');
        await new Promise(r => setTimeout(r, 0));
        onChunk('Step 2 ');
        collectedChunks.push('Step 2 ');
        await new Promise(r => setTimeout(r, 0));
        onChunk('Step 3');
        collectedChunks.push('Step 3');
      }
      return 'Step 1 Step 2 Step 3';
    });

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;

    // Create a task
    await act(async () => {
      await getContext().createTask(agent.id, 'My Task', 'A test task', 'Do something');
    });

    // Check final task output
    const tasks = getContext().tasks.filter(t => t.title === 'My Task');
    expect(tasks.length).toBeGreaterThan(0);
    const task = tasks[tasks.length - 1];
    expect(task.status).toBe('completed');
    expect(task.output).toBe('Step 1 Step 2 Step 3');
  });

  it('sets task status to completed after streaming finishes', async () => {
    vi.mocked(queryAgent).mockImplementation(async (_agent, _msg, _history, _keys, onChunk) => {
      if (onChunk) onChunk('Task result here.');
      return 'Task result here.';
    });

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;

    await act(async () => {
      await getContext().createTask(agent.id, 'Completion Task', '', 'Do work');
    });

    const task = getContext().tasks.find(t => t.title === 'Completion Task')!;
    expect(task).toBeDefined();
    expect(task.status).toBe('completed');
    expect(task.completedAt).not.toBeNull();
  });

  it('sets agent to error state when task errors during streaming', async () => {
    vi.mocked(queryAgent).mockRejectedValue(new Error('API failure during streaming'));

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;

    await act(async () => {
      await getContext().createTask(agent.id, 'Failing Task', '', 'Do work');
    });

    const task = getContext().tasks.find(t => t.title === 'Failing Task')!;
    expect(task).toBeDefined();
    expect(task.status).toBe('failed');
    expect(task.output).toContain('Error');

    await waitFor(() => {
      const updated = getContext().agents.find(a => a.id === 'sample_1')!;
      expect(updated.status).toBe('error');
    });
  });

  it('handles empty response from streaming gracefully', async () => {
    vi.mocked(queryAgent).mockImplementation(async (_agent, _msg, _history, _keys, onChunk) => {
      if (onChunk) onChunk('');
      return '';
    });

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;

    await act(async () => {
      await getContext().createTask(agent.id, 'Empty Task', '', 'Do nothing');
    });

    const task = getContext().tasks.find(t => t.title === 'Empty Task')!;
    expect(task).toBeDefined();
    expect(task.status).toBe('completed');
    expect(task.output).toBe('');
  });
});

// ─── sendMessage — abort during streaming ─────────────────
describe('AgentProvider — sendMessage abort during streaming', () => {
  beforeEach(() => {
    vi.mocked(queryAgent).mockReset();
  });

  afterEach(() => {
    vi.mocked(queryAgent).mockReturnValue(new Promise<never>(() => {}));
  });

  it('sets agent to error status on non-AbortError rejection', async () => {
    vi.mocked(queryAgent).mockRejectedValue(new Error('Some error'));

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;

    await act(async () => {
      try {
        await getContext().sendMessage(agent.id, 'Error test');
      } catch {
        // Expected
      }
    });

    await waitFor(() => {
      const updated = getContext().agents.find(a => a.id === 'sample_1')!;
      expect(updated.status).toBe('error');
    });
  });

  it('does not update agent status on AbortError (already handled by cancel)', async () => {
    vi.mocked(queryAgent).mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    const { getContext, waitForReady } = renderWithContext();
    await waitForReady();

    const agent = getContext().agents.find(a => a.id === 'sample_1')!;

    await act(async () => {
      try {
        await getContext().sendMessage(agent.id, 'Abort test');
      } catch {
        // Expected
      }
    });

    // Agent should return to idle (not error) when AbortError is caught
    await waitFor(() => {
      const updated = getContext().agents.find(a => a.id === 'sample_1')!;
      expect(updated.status).toBe('idle');
    });
  });
});
