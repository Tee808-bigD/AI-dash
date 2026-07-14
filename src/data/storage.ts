import type { Agent, Task, Workflow, AgentMessage, APIKeyConfig, MCPServer } from '../types';
import { obfuscate, deobfuscate } from '../services/security';

const KEYS = {
  agents: 'aia_agents',
  tasks: 'aia_tasks',
  workflows: 'aia_workflows',
  messages: 'aia_messages',
  apiKeys: 'aia_api_keys',
  mcpServers: 'aia_mcp_servers',
};

function get<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Agents
export function getAgents(): Agent[] {
  return get<Agent[]>(KEYS.agents, []);
}
export function setAgents(agents: Agent[]): void {
  set(KEYS.agents, agents);
}

// Tasks
export function getTasks(): Task[] {
  return get<Task[]>(KEYS.tasks, []);
}
export function setTasks(tasks: Task[]): void {
  set(KEYS.tasks, tasks);
}

// Workflows
export function getWorkflows(): Workflow[] {
  return get<Workflow[]>(KEYS.workflows, []);
}
export function setWorkflows(workflows: Workflow[]): void {
  set(KEYS.workflows, workflows);
}

// Messages
export function getMessages(agentId: string): AgentMessage[] {
  const all = get<Record<string, AgentMessage[]>>(KEYS.messages, {});
  return all[agentId] || [];
}
export function setMessages(agentId: string, messages: AgentMessage[]): void {
  const all = get<Record<string, AgentMessage[]>>(KEYS.messages, {});
  all[agentId] = messages;
  set(KEYS.messages, all);
}

// API Keys — stored with light obfuscation to prevent casual reading
export function getAPIKeys(): APIKeyConfig[] {
  const raw = localStorage.getItem(KEYS.apiKeys);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    // Deobfuscate each key
    if (Array.isArray(parsed)) {
      return parsed.map((k: APIKeyConfig) => ({
        ...k,
        key: k.key?.startsWith('av-sec') ? (deobfuscate(k.key) || k.key) : k.key,
      }));
    }
    return parsed;
  } catch {
    return [];
  }
}
export function setAPIKeys(keys: APIKeyConfig[]): void {
  // Obfuscate each key before storing
  const obfuscated = keys.map(k => ({
    ...k,
    key: obfuscate(k.key),
  }));
  set(KEYS.apiKeys, obfuscated);
}

// MCP Servers
export function getMCPServers(): MCPServer[] {
  return get<MCPServer[]>(KEYS.mcpServers, []);
}
export function setMCPServers(servers: MCPServer[]): void {
  set(KEYS.mcpServers, servers);
}

// Utility
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
