export type AgentStatus = 'idle' | 'working' | 'error';
export type AgentRole = 'researcher' | 'coder' | 'analyst' | 'writer' | 'assistant';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type WorkflowStatus = 'inactive' | 'running' | 'completed';

// Integration types
export interface APIKeyConfig {
  provider: string;
  key: string;
  label: string;
  baseUrl: string;
  isActive: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: string;
}

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  tools: MCPTool[];
  status: 'online' | 'offline' | 'error';
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  avatar: string;
  status: AgentStatus;
  lastActive: string;
  tasksCompleted: number;
  model: string;
  temperature: number;
  systemPrompt: string;
  createdAt: string;
}

export interface Task {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  description: string;
  status: TaskStatus;
  input: string;
  output: string;
  createdAt: string;
  completedAt: string | null;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  agentName: string;
  prompt: string;
  order: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  createdAt: string;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface DashboardStats {
  totalAgents: number;
  activeTasks: number;
  tasksCompleted: number;
  successRate: number;
  activeWorkflows: number;
}

export const AGENT_ROLE_CONFIG: Record<AgentRole, { label: string; icon: string; color: string; description: string }> = {
  researcher: {
    label: 'Researcher',
    icon: 'Search',
    color: '#3498db',
    description: 'Searches, gathers, and summarizes information',
  },
  coder: {
    label: 'Coder',
    icon: 'Code2',
    color: '#2ecc71',
    description: 'Writes, reviews, and debugs code',
  },
  analyst: {
    label: 'Analyst',
    icon: 'BarChart3',
    color: '#9b59b6',
    description: 'Analyzes data and generates insights',
  },
  writer: {
    label: 'Writer',
    icon: 'PenTool',
    color: '#e67e22',
    description: 'Creates and edits content',
  },
  assistant: {
    label: 'Assistant',
    icon: 'Bot',
    color: '#1abc9c',
    description: 'General purpose AI assistant',
  },
};
