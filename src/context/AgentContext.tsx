import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Agent, Task, Workflow, AgentMessage, DashboardStats, APIKeyConfig, MCPServer, Toast } from '../types';
import {
  generateId,
} from '../data/storage';
import {
  getAgents as fetchAgents, setAgents as saveAgents,
  getTasks as fetchTasks, setTasks as saveTasks,
  getWorkflows as fetchWorkflows, setWorkflows as saveWorkflows,
  getMessages as fetchMessages, setMessages as saveMessages,
  getAPIKeys as fetchAPIKeys, setAPIKeys as saveAPIKeys,
  getMCPServers as fetchMCPServers, setMCPServers as saveMCPServers,
} from '../services/supabaseService';
import { getAgents as getLocalAgents, getTasks as getLocalTasks, getWorkflows as getLocalWorkflows, getMessages as getLocalMessages, getAPIKeys as getLocalAPIKeys, getMCPServers as getLocalMCPServers, setAgents as setLocalAgents, setTasks as setLocalTasks, setWorkflows as setLocalWorkflows, setMessages as setLocalMessages, setAPIKeys as setLocalAPIKeys, setMCPServers as setLocalMCPServers } from '../data/storage';
import { SAMPLE_AGENTS, SAMPLE_TASKS, SAMPLE_WORKFLOWS } from '../data/sampleData';
import { queryAgent, executeWorkflowStep } from '../services/aiService';

interface AgentContextType {
  agents: Agent[];
  tasks: Task[];
  workflows: Workflow[];
  stats: DashboardStats;
  loading: boolean;
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'status' | 'tasksCompleted' | 'lastActive'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  createTask: (agentId: string, title: string, description: string, input: string) => Promise<void>;
  runWorkflow: (workflowId: string) => Promise<void>;
  sendMessage: (agentId: string, content: string) => Promise<AgentMessage>;
  getAgentMessages: (agentId: string) => AgentMessage[];
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'status'>) => void;
  deleteWorkflow: (id: string) => void;
  cancelTask: (taskId: string) => void;
  clearTask: (taskId: string) => void;
  cancelRunningTask: (taskId: string) => void;
  // Integration methods
  apiKeys: APIKeyConfig[];
  mcpServers: MCPServer[];
  addAPIKey: (config: APIKeyConfig) => void;
  removeAPIKey: (provider: string) => void;
  toggleAPIKey: (provider: string) => void;
  addMCPServer: (server: Omit<MCPServer, 'id' | 'createdAt'>) => void;
  updateMCPServer: (id: string, updates: Partial<Omit<MCPServer, 'id' | 'createdAt'>>) => void;
  removeMCPServer: (id: string) => void;
  // Toast system
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgentsState] = useState<Agent[]>([]);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [workflows, setWorkflowsState] = useState<Workflow[]>([]);
  const [apiKeys, setApiKeysState] = useState<APIKeyConfig[]>([]);
  const [mcpServers, setMcpServersState] = useState<MCPServer[]>([]);
  const [messages, setMessagesState] = useState<Record<string, AgentMessage[]>>({});
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const abortControllers = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    async function init() {
      // Try loading from Supabase first, fall back to localStorage
      let storedAgents = await fetchAgents();
      let storedTasks = await fetchTasks();
      let storedWorkflows = await fetchWorkflows();

      if (storedAgents.length === 0) {
        storedAgents = getLocalAgents();
      }
      if (storedAgents.length === 0) {
        storedAgents = SAMPLE_AGENTS;
        await saveAgents(storedAgents);
      }

      if (storedTasks.length === 0) {
        storedTasks = getLocalTasks();
      }
      if (storedTasks.length === 0) {
        storedTasks = SAMPLE_TASKS;
        await saveTasks(storedTasks);
      }

      if (storedWorkflows.length === 0) {
        storedWorkflows = getLocalWorkflows();
      }
      if (storedWorkflows.length === 0) {
        storedWorkflows = SAMPLE_WORKFLOWS;
        await saveWorkflows(storedWorkflows);
      }

      setAgentsState(storedAgents);
      setTasksState(storedTasks);
      setWorkflowsState(storedWorkflows);

      // Load integrations
      let storedKeys = await fetchAPIKeys();
      if (storedKeys.length === 0) storedKeys = getLocalAPIKeys();
      let storedServers = await fetchMCPServers();
      if (storedServers.length === 0) storedServers = getLocalMCPServers();

      setApiKeysState(storedKeys);
      setMcpServersState(storedServers);

      setLoading(false);
    }
    init();
  }, []);

  const stats: DashboardStats = {
    totalAgents: agents.length,
    activeTasks: tasks.filter(t => t.status === 'running' || t.status === 'pending').length,
    tasksCompleted: tasks.filter(t => t.status === 'completed').length,
    successRate: tasks.length > 0
      ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
      : 0,
    activeWorkflows: workflows.filter(w => w.status === 'running').length,
  };

  const addAgent = useCallback((agentData: Omit<Agent, 'id' | 'createdAt' | 'status' | 'tasksCompleted' | 'lastActive'>) => {
    const newAgent: Agent = {
      ...agentData,
      id: generateId(),
      status: 'idle',
      tasksCompleted: 0,
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...agents, newAgent];
    setAgentsState(updated);
    saveAgents(updated).catch(() => setLocalAgents(updated));
  }, [agents]);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    const updated = agents.map(a => a.id === id ? { ...a, ...updates, lastActive: new Date().toISOString() } : a);
    setAgentsState(updated);
    saveAgents(updated).catch(() => setLocalAgents(updated));
  }, [agents]);

  const deleteAgent = useCallback((id: string) => {
    const updated = agents.filter(a => a.id !== id);
    setAgentsState(updated);
    saveAgents(updated).catch(() => setLocalAgents(updated));
  }, [agents]);

  const createTask = useCallback(async (agentId: string, title: string, description: string, input: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const taskId = generateId();
    const newTask: Task = {
      id: taskId,
      agentId,
      agentName: agent.name,
      title,
      description,
      status: 'pending',
      input,
      output: '',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    // Create AbortController for this task
    const controller = new AbortController();
    abortControllers.current[taskId] = controller;

    const updatedTasks = [newTask, ...tasks];
    setTasksState(updatedTasks);
    saveTasks(updatedTasks).catch(() => setLocalTasks(updatedTasks));

    // Update agent status
    updateAgent(agentId, { status: 'working' });

    // Mark as running
    setTasksState(prev => prev.map(t => t.id === taskId ? { ...t, status: 'running' } : t));

    try {
      // Get conversation history for context
      const history = getLocalMessages(agentId);

      // Call queryAgent with streaming callback to fill task output in real-time
      const response = await queryAgent(agent, input, history, apiKeys, (chunk) => {
        setTasksState(prev => prev.map(t =>
          t.id === taskId
            ? { ...t, output: (t.output || '') + chunk }
            : t
        ));
      }, controller.signal);

      // Clean up abort controller
      delete abortControllers.current[taskId];

      const completedTask: Task = {
        ...newTask,
        status: 'completed',
        output: response || '',
        completedAt: new Date().toISOString(),
      };
      setTasksState(prev => prev.map(t => t.id === taskId ? completedTask : t));
      setTasksState(current => {
        saveTasks(current).catch(() => setLocalTasks(current));
        return current;
      });
      updateAgent(agentId, { status: 'idle', tasksCompleted: agent.tasksCompleted + 1 });
    } catch (error) {
      // Clean up abort controller
      delete abortControllers.current[taskId];

      // If aborted, don't update (cancelTask already handles it)
      if ((error as Error)?.name === 'AbortError') return;

      const failedTask: Task = {
        ...newTask,
        status: 'failed',
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        completedAt: new Date().toISOString(),
      };
      setTasksState(prev => prev.map(t => t.id === taskId ? failedTask : t));
      setTasksState(current => {
        saveTasks(current).catch(() => setLocalTasks(current));
        return current;
      });
      updateAgent(agentId, { status: 'error' });
    }
  }, [agents, tasks, updateAgent, apiKeys]);

  const runWorkflow = useCallback(async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow || workflow.steps.length === 0) return;

    setWorkflowsState(prev => prev.map(w => w.id === workflowId ? { ...w, status: 'running' } : w));
    setWorkflowsState(current => {
      saveWorkflows(current).catch(() => setLocalWorkflows(current));
      return current;
    });

    let context = '';

    for (const step of workflow.steps) {
      const agent = agents.find(a => a.id === step.agentId);
      if (!agent) continue;

      // Create a task for this step
      const taskId = generateId();
      const stepTask: Task = {
        id: taskId,
        agentId: agent.id,
        agentName: agent.name,
        title: `${workflow.name} - Step ${step.order}`,
        description: step.prompt.substring(0, 100),
        status: 'running',
        input: step.prompt,
        output: '',
        createdAt: new Date().toISOString(),
        completedAt: null,
      };

      setTasksState(prev => [stepTask, ...prev]);
      updateAgent(agent.id, { status: 'working' });

      try {
        const result = await executeWorkflowStep(agent, step.prompt, context, apiKeys);
        context += `\n--- ${agent.name} (Step ${step.order}) ---\n${result}\n`;

        const completedTask: Task = { ...stepTask, status: 'completed', output: result, completedAt: new Date().toISOString() };
        setTasksState(prev => prev.map(t => t.id === taskId ? completedTask : t));
        updateAgent(agent.id, { status: 'idle', tasksCompleted: agent.tasksCompleted + 1 });
      } catch (error) {
        const failedTask: Task = { ...stepTask, status: 'failed', output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, completedAt: new Date().toISOString() };
        setTasksState(prev => prev.map(t => t.id === taskId ? failedTask : t));
        updateAgent(agent.id, { status: 'error' });
        break;
      }
    }

    setWorkflowsState(prev => prev.map(w => w.id === workflowId ? { ...w, status: 'completed' } : w));
    setWorkflowsState(current => {
      saveWorkflows(current).catch(() => setLocalWorkflows(current));
      return current;
    });
  }, [workflows, agents, updateAgent, apiKeys]);

  const sendMessage = useCallback(async (agentId: string, content: string): Promise<AgentMessage> => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    // Save user message
    const userMsg: AgentMessage = {
      id: generateId(),
      agentId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const history = getLocalMessages(agentId);
    const updatedHistory = [...history, userMsg];
    saveMessages(agentId, updatedHistory).catch(() => setLocalMessages(agentId, updatedHistory));

    updateAgent(agentId, { status: 'working' });

    // Create AbortController for this send
    const controller = new AbortController();
    abortControllers.current[agentId] = controller;

    try {
      // Create an initial empty agent message for streaming
      const agentMsgId = generateId();
      const initialAgentMsg: AgentMessage = {
        id: agentMsgId,
        agentId,
        role: 'agent',
        content: '',
        timestamp: new Date().toISOString(),
      };

      // Update state immediately to show the message bubble
      setMessagesState(prev => ({
        ...prev,
        [agentId]: [...updatedHistory, initialAgentMsg],
      }));

      // Call queryAgent with streaming callback
      const response = await queryAgent(agent, content, updatedHistory, apiKeys, (chunk) => {
        setMessagesState(prev => {
          const existing = prev[agentId] || [];
          return {
            ...prev,
            [agentId]: existing.map(msg =>
              msg.id === agentMsgId
                ? { ...msg, content: msg.content + chunk }
                : msg
            ),
          };
        });
      }, controller.signal);

      delete abortControllers.current[agentId];

      // Save the final complete message to localStorage
      const finalContent = response || '';
      const finalMessages = [...updatedHistory, { ...initialAgentMsg, content: finalContent }];
      saveMessages(agentId, finalMessages).catch(() => setLocalMessages(agentId, finalMessages));

      // Final state sync with complete content
      setMessagesState(prev => ({
        ...prev,
        [agentId]: finalMessages,
      }));

      updateAgent(agentId, { status: 'idle', tasksCompleted: agent.tasksCompleted + 1 });

      return { ...initialAgentMsg, content: finalContent };
    } catch (error) {
      delete abortControllers.current[agentId];
      if ((error as Error)?.name === 'AbortError') {
        updateAgent(agentId, { status: 'idle' });
        throw error;
      }
      updateAgent(agentId, { status: 'error' });
      throw error;
    }
  }, [agents, updateAgent, apiKeys]);

  const getAgentMessages = useCallback((agentId: string): AgentMessage[] => {
    return messages[agentId] || getLocalMessages(agentId);
  }, [messages]);

  const createWorkflow = useCallback((workflowData: Omit<Workflow, 'id' | 'createdAt' | 'status'>) => {
    const newWorkflow: Workflow = {
      ...workflowData,
      id: generateId(),
      status: 'inactive',
      createdAt: new Date().toISOString(),
    };
    const updated = [...workflows, newWorkflow];
    setWorkflowsState(updated);
    saveWorkflows(updated).catch(() => setLocalWorkflows(updated));
  }, [workflows]);

  const deleteWorkflow = useCallback((id: string) => {
    const updated = workflows.filter(w => w.id !== id);
    setWorkflowsState(updated);
    saveWorkflows(updated).catch(() => setLocalWorkflows(updated));
  }, [workflows]);

  const cancelTask = useCallback((taskId: string) => {
    // Abort any in-flight fetch for this task
    if (abortControllers.current[taskId]) {
      abortControllers.current[taskId].abort();
      delete abortControllers.current[taskId];
    }
    setTasksState(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed', output: 'Cancelled by user', completedAt: new Date().toISOString() } : t));
    setTasksState(current => {
      saveTasks(current).catch(() => setLocalTasks(current));
      return current;
    });
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateAgent(task.agentId, { status: 'idle' });
    }
  }, [tasks, updateAgent]);

  const cancelRunningTask = useCallback((taskId: string) => {
    cancelTask(taskId);
  }, [cancelTask]);

  const clearTask = useCallback((taskId: string) => {
    setTasksState(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      saveTasks(updated).catch(() => setLocalTasks(updated));
      return updated;
    });
  }, []);

  // Integration methods
  const addAPIKey = useCallback((config: APIKeyConfig) => {
    const updated = apiKeys.filter(k => k.provider !== config.provider);
    const newKeys = [...updated, config];
    setApiKeysState(newKeys);
    saveAPIKeys(newKeys).catch(() => setLocalAPIKeys(newKeys));
  }, [apiKeys]);

  const removeAPIKey = useCallback((provider: string) => {
    const updated = apiKeys.filter(k => k.provider !== provider);
    setApiKeysState(updated);
    saveAPIKeys(updated).catch(() => setLocalAPIKeys(updated));
  }, [apiKeys]);

  const toggleAPIKey = useCallback((provider: string) => {
    const updated = apiKeys.map(k =>
      k.provider === provider ? { ...k, isActive: !k.isActive } : k
    );
    setApiKeysState(updated);
    saveAPIKeys(updated).catch(() => setLocalAPIKeys(updated));
  }, [apiKeys]);

  const addMCPServer = useCallback((server: Omit<MCPServer, 'id' | 'createdAt'>) => {
    const newServer: MCPServer = {
      ...server,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...mcpServers, newServer];
    setMcpServersState(updated);
    saveMCPServers(updated).catch(() => setLocalMCPServers(updated));
  }, [mcpServers]);

  const removeMCPServer = useCallback((id: string) => {
    const updated = mcpServers.filter(s => s.id !== id);
    setMcpServersState(updated);
    saveMCPServers(updated).catch(() => setLocalMCPServers(updated));
  }, [mcpServers]);

  const updateMCPServer = useCallback((id: string, updates: Partial<Omit<MCPServer, 'id' | 'createdAt'>>) => {
    const updated = mcpServers.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    setMcpServersState(updated);
    saveMCPServers(updated).catch(() => setLocalMCPServers(updated));
  }, [mcpServers]);

  // Toast system
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AgentContext.Provider value={{
      agents, tasks, workflows, stats, loading,
      addAgent, updateAgent, deleteAgent,
      createTask, runWorkflow, sendMessage, getAgentMessages,
      createWorkflow, deleteWorkflow, cancelTask, clearTask, cancelRunningTask,
      apiKeys, mcpServers, addAPIKey, removeAPIKey, toggleAPIKey,
      addMCPServer, updateMCPServer, removeMCPServer,
      toasts, addToast, removeToast,
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgents must be used within AgentProvider');
  return ctx;
}
