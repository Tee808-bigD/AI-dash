import type { Agent, Task, Workflow, AgentMessage, APIKeyConfig, MCPServer } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  getAgents as getLocalAgents, setAgents as setLocalAgents,
  getTasks as getLocalTasks, setTasks as setLocalTasks,
  getWorkflows as getLocalWorkflows, setWorkflows as setLocalWorkflows,
  getMessages as getLocalMessages, setMessages as setLocalMessages,
  getAPIKeys as getLocalAPIKeys, setAPIKeys as setLocalAPIKeys,
  getMCPServers as getLocalMCPServers, setMCPServers as setLocalMCPServers,
} from '../data/storage';

/**
 * Supabase data service — mirrors the localStorage-based storage.ts API
 * but reads/writes through Supabase when configured.
 *
 * Falls back to localStorage when:
 * - Supabase credentials are missing from .env
 * - The user is not authenticated
 * - A network error occurs
 */

// ─── Auth helpers ──────────────────────────────────────────
async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Agents ────────────────────────────────────────────────
export async function getAgents(): Promise<Agent[]> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) return getLocalAgents();

  const { data, error } = await supabase!
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[Supabase] getAgents error, falling back to localStorage:', error.message);
    return getLocalAgents();
  }

  // Map Supabase snake_case → camelCase
  return (data || []).map(mapAgentFromDB);
}

export async function setAgents(agents: Agent[]): Promise<void> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) {
    setLocalAgents(agents);
    return;
  }

  // Convert to DB format and upsert
  const dbRows = agents.map(a => ({ ...mapAgentToDB(a), user_id: userId }));

  const { error } = await supabase!
    .from('agents')
    .upsert(dbRows, { onConflict: 'id' });

  if (error) {
    console.warn('[Supabase] setAgents error, falling back to localStorage:', error.message);
    setLocalAgents(agents);
  }
}

// ─── Tasks ─────────────────────────────────────────────────
export async function getTasks(): Promise<Task[]> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) return getLocalTasks();

  const { data, error } = await supabase!
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[Supabase] getTasks error, falling back to localStorage:', error.message);
    return getLocalTasks();
  }

  return (data || []).map(mapTaskFromDB);
}

export async function setTasks(tasks: Task[]): Promise<void> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) {
    setLocalTasks(tasks);
    return;
  }

  const dbRows = tasks.map(t => ({ ...mapTaskToDB(t), user_id: userId }));
  const { error } = await supabase!
    .from('tasks')
    .upsert(dbRows, { onConflict: 'id' });

  if (error) {
    console.warn('[Supabase] setTasks error, falling back to localStorage:', error.message);
    setLocalTasks(tasks);
  }
}

// ─── Workflows ─────────────────────────────────────────────
export async function getWorkflows(): Promise<Workflow[]> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) return getLocalWorkflows();

  const { data, error } = await supabase!
    .from('workflows')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[Supabase] getWorkflows error, falling back to localStorage:', error.message);
    return getLocalWorkflows();
  }

  return (data || []).map(mapWorkflowFromDB);
}

export async function setWorkflows(workflows: Workflow[]): Promise<void> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) {
    setLocalWorkflows(workflows);
    return;
  }

  const dbRows = workflows.map(w => ({ ...mapWorkflowToDB(w), user_id: userId }));
  const { error } = await supabase!
    .from('workflows')
    .upsert(dbRows, { onConflict: 'id' });

  if (error) {
    console.warn('[Supabase] setWorkflows error, falling back to localStorage:', error.message);
    setLocalWorkflows(workflows);
  }
}

// ─── Messages ──────────────────────────────────────────────
export async function getMessages(agentId: string): Promise<AgentMessage[]> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) return getLocalMessages(agentId);

  const { data, error } = await supabase!
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.warn('[Supabase] getMessages error, falling back to localStorage:', error.message);
    return getLocalMessages(agentId);
  }

  return (data || []).map(mapMessageFromDB);
}

export async function setMessages(agentId: string, messages: AgentMessage[]): Promise<void> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) {
    setLocalMessages(agentId, messages);
    return;
  }

  // Delete old messages for this agent, then insert new ones
  const { error: delErr } = await supabase!
    .from('messages')
    .delete()
    .eq('user_id', userId)
    .eq('agent_id', agentId);

  if (delErr) {
    console.warn('[Supabase] setMessages delete error, falling back to localStorage:', delErr.message);
    setLocalMessages(agentId, messages);
    return;
  }

  if (messages.length === 0) return;

  const dbRows = messages.map(m => ({
    id: m.id,
    user_id: userId,
    agent_id: m.agentId,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }));

  const { error: insErr } = await supabase!
    .from('messages')
    .insert(dbRows);

  if (insErr) {
    console.warn('[Supabase] setMessages insert error, falling back to localStorage:', insErr.message);
    setLocalMessages(agentId, messages);
  }
}

// ─── API Keys ──────────────────────────────────────────────
export async function getAPIKeys(): Promise<APIKeyConfig[]> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) return getLocalAPIKeys();

  const { data, error } = await supabase!
    .from('api_keys')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('[Supabase] getAPIKeys error, falling back to localStorage:', error.message);
    return getLocalAPIKeys();
  }

  return (data || []).map(mapAPIKeyFromDB);
}

export async function setAPIKeys(keys: APIKeyConfig[]): Promise<void> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) {
    setLocalAPIKeys(keys);
    return;
  }

  // Delete old keys, insert new ones
  const { error: delErr } = await supabase!
    .from('api_keys')
    .delete()
    .eq('user_id', userId);

  if (delErr) {
    console.warn('[Supabase] setAPIKeys delete error, falling back to localStorage:', delErr.message);
    setLocalAPIKeys(keys);
    return;
  }

  if (keys.length === 0) return;

  const dbRows = keys.map(k => ({
    id: `${k.provider}_${userId?.slice(0, 8)}`,
    user_id: userId,
    provider: k.provider,
    key: k.key,
    label: k.label,
    base_url: k.baseUrl,
    is_active: k.isActive,
  }));

  const { error: insErr } = await supabase!
    .from('api_keys')
    .insert(dbRows);

  if (insErr) {
    console.warn('[Supabase] setAPIKeys insert error, falling back to localStorage:', insErr.message);
    setLocalAPIKeys(keys);
  }
}

// ─── MCP Servers ───────────────────────────────────────────
export async function getMCPServers(): Promise<MCPServer[]> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) return getLocalMCPServers();

  const { data, error } = await supabase!
    .from('mcp_servers')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('[Supabase] getMCPServers error, falling back to localStorage:', error.message);
    return getLocalMCPServers();
  }

  return (data || []).map(mapMCPServerFromDB);
}

export async function setMCPServers(servers: MCPServer[]): Promise<void> {
  const userId = await getUserId();
  if (!userId || !isSupabaseConfigured) {
    setLocalMCPServers(servers);
    return;
  }

  const dbRows = servers.map(s => ({
    ...mapMCPServerToDB(s),
    user_id: userId,
  }));

  const { error } = await supabase!
    .from('mcp_servers')
    .upsert(dbRows, { onConflict: 'id' });

  if (error) {
    console.warn('[Supabase] setMCPServers error, falling back to localStorage:', error.message);
    setLocalMCPServers(servers);
  }
}

// ============================================================
// DB Mappers — Supabase snake_case ↔ TypeScript camelCase
// ============================================================

function mapAgentFromDB(row: Record<string, unknown>): Agent {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as Agent['role'],
    description: (row.description as string) || '',
    avatar: (row.avatar as string) || '',
    status: (row.status as Agent['status']) || 'idle',
    lastActive: (row.last_active as string) || new Date().toISOString(),
    tasksCompleted: (row.tasks_completed as number) || 0,
    model: (row.model as string) || 'meta/llama-3.1-8b-instruct',
    temperature: (row.temperature as number) ?? 0.5,
    systemPrompt: (row.system_prompt as string) || '',
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

function mapAgentToDB(agent: Agent): Record<string, unknown> {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    description: agent.description,
    avatar: agent.avatar,
    status: agent.status,
    last_active: agent.lastActive,
    tasks_completed: agent.tasksCompleted,
    model: agent.model,
    temperature: agent.temperature,
    system_prompt: agent.systemPrompt,
    created_at: agent.createdAt,
  };
}

function mapTaskFromDB(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    agentName: (row.agent_name as string) || '',
    title: (row.title as string) || '',
    description: (row.description as string) || '',
    status: row.status as Task['status'],
    input: (row.input as string) || '',
    output: (row.output as string) || '',
    createdAt: (row.created_at as string) || new Date().toISOString(),
    completedAt: (row.completed_at as string) || null,
  };
}

function mapTaskToDB(task: Task): Record<string, unknown> {
  return {
    id: task.id,
    agent_id: task.agentId,
    agent_name: task.agentName,
    title: task.title,
    description: task.description,
    status: task.status,
    input: task.input,
    output: task.output,
    created_at: task.createdAt,
    completed_at: task.completedAt,
  };
}

function mapWorkflowFromDB(row: Record<string, unknown>): Workflow {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    description: (row.description as string) || '',
    category: (row.category as string) || 'general',
    steps: (row.steps as Workflow['steps']) || [],
    status: (row.status as Workflow['status']) || 'inactive',
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

function mapWorkflowToDB(workflow: Workflow): Record<string, unknown> {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    category: workflow.category,
    steps: workflow.steps,
    status: workflow.status,
    created_at: workflow.createdAt,
  };
}

function mapMessageFromDB(row: Record<string, unknown>): AgentMessage {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    role: row.role as 'user' | 'agent',
    content: (row.content as string) || '',
    timestamp: (row.timestamp as string) || new Date().toISOString(),
  };
}

function mapAPIKeyFromDB(row: Record<string, unknown>): APIKeyConfig {
  return {
    provider: (row.provider as string) || '',
    key: (row.key as string) || '',
    label: (row.label as string) || '',
    baseUrl: (row.base_url as string) || '',
    isActive: (row.is_active as boolean) ?? true,
  };
}

function mapMCPServerFromDB(row: Record<string, unknown>): MCPServer {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    description: (row.description as string) || '',
    endpoint: (row.endpoint as string) || '',
    tools: (row.tools as MCPServer['tools']) || [],
    status: (row.status as MCPServer['status']) || 'online',
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

function mapMCPServerToDB(server: MCPServer): Record<string, unknown> {
  return {
    id: server.id,
    name: server.name,
    description: server.description,
    endpoint: server.endpoint,
    tools: server.tools,
    status: server.status,
    created_at: server.createdAt,
  };
}
