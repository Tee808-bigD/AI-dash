# AgentVerse — AI Agent Dashboard

A fully-featured AI agent orchestration dashboard built with React + TypeScript + Vite. Create, manage, and chat with AI agents, design multi-step workflows, and integrate with real AI APIs.

## Quick Start

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

The dashboard will open at **http://localhost:5173** with sample data pre-loaded. No API key needed — agents respond with realistic simulated responses.

## Setup API Keys (Optional)

For **real-time AI responses** instead of simulated ones, you have two options:

### Option 1: Via the UI (Recommended)
1. Open the dashboard
2. Go to **Integrations → API Keys**
3. Click **Add API Key** and enter your key
4. Supported providers: **NVIDIA AI**, **OpenAI**, **Anthropic**, **Google AI**
5. Keys are stored locally in your browser — no backend needed

### Option 2: Via Environment Variable
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your NVIDIA API key
# Get a free key at: https://build.nvidia.com/
```

> **Note:** UI-stored keys take priority over environment variables.

## Features

- **Dashboard** — Stats overview, quick task execution, active agents, task history
- **Agents** — Create, filter, and manage AI agents with different roles (Researcher, Coder, Analyst, Writer, Assistant)
- **Agent Chat** — Real-time conversation with any agent with code block formatting
- **Workflows** — Design and run multi-agent process pipelines with sequential steps
- **Integrations** — Connect AI providers (NVIDIA, OpenAI, Anthropic, Google) and MCP servers

## Tech Stack

- **React 19** + **TypeScript 6**
- **Vite 8** for fast development
- **React Router 7** for routing
- **Lucide React** for icons
- All data persisted in **localStorage**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run Oxlint |
