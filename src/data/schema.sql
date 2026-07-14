-- =============================================
-- AgentVerse — Supabase Database Schema
-- Run this SQL in the Supabase SQL Editor
-- =============================================

-- ─── Agents ──────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'assistant',
  description TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  status TEXT DEFAULT 'idle',
  last_active TIMESTAMPTZ DEFAULT NOW(),
  tasks_completed INTEGER DEFAULT 0,
  model TEXT DEFAULT 'meta/llama-3.1-8b-instruct',
  temperature REAL DEFAULT 0.5,
  system_prompt TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tasks ──────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  input TEXT DEFAULT '',
  output TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ─── Workflows ──────────────────────────────
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  steps JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Messages ───────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'agent')),
  content TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ─── API Keys ───────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT '',
  key TEXT NOT NULL DEFAULT '',
  label TEXT DEFAULT '',
  base_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true
);

-- ─── MCP Servers ────────────────────────────
CREATE TABLE IF NOT EXISTS mcp_servers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  endpoint TEXT DEFAULT '',
  tools JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row-Level Security
-- =============================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first for idempotency
DROP POLICY IF EXISTS "Users can read own agents" ON agents;
DROP POLICY IF EXISTS "Users can insert own agents" ON agents;
DROP POLICY IF EXISTS "Users can update own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete own agents" ON agents;

DROP POLICY IF EXISTS "Users can read own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can read own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can insert own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete own workflows" ON workflows;

DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

DROP POLICY IF EXISTS "Users can read own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete own api_keys" ON api_keys;

DROP POLICY IF EXISTS "Users can read own mcp_servers" ON mcp_servers;
DROP POLICY IF EXISTS "Users can insert own mcp_servers" ON mcp_servers;
DROP POLICY IF EXISTS "Users can update own mcp_servers" ON mcp_servers;
DROP POLICY IF EXISTS "Users can delete own mcp_servers" ON mcp_servers;

-- Agents policies
CREATE POLICY "Users can read own agents" ON agents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agents" ON agents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own agents" ON agents
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can read own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Workflows policies
CREATE POLICY "Users can read own workflows" ON workflows
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workflows" ON workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workflows" ON workflows
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workflows" ON workflows
  FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);

-- API Keys policies
CREATE POLICY "Users can read own api_keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api_keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own api_keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- MCP Servers policies
CREATE POLICY "Users can read own mcp_servers" ON mcp_servers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mcp_servers" ON mcp_servers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mcp_servers" ON mcp_servers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mcp_servers" ON mcp_servers
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_user_id ON mcp_servers(user_id);
