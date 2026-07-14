"""
AgentVerse — AI Agent Dashboard
Streamlit version with the same neural network branding as the React app.
"""

import os
import json
import time
import html
import hashlib
import random
from datetime import datetime
from typing import Optional

import streamlit as st
import requests

# ─── Page Config ───────────────────────────────────────────
st.set_page_config(
    page_title="AgentVerse — AI Agent Dashboard",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─── Secrets ───────────────────────────────────────────────
SUPABASE_URL = st.secrets.get("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", ""))
SUPABASE_ANON_KEY = st.secrets.get("SUPABASE_ANON_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", ""))
NVIDIA_API_KEY = st.secrets.get("NVIDIA_API_KEY", os.getenv("VITE_NVIDIA_API_KEY", ""))

# ─── Custom CSS (matches React app dark theme) ────────────
st.markdown(
    """
<style>
    /* ── Base ── */
    .stApp {
        background: #0a0a1a;
        color: #f0f0f8;
    }
    .stApp header, .stApp footer { display: none; }
    .main > div { padding: 0 !important; }
    .block-container { padding: 0 !important; max-width: 100% !important; }

    /* ── Logo shimmer animation ── */
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

    /* ── Header ── */
    .av-header {
        background: rgba(10, 10, 26, 0.85);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(108, 92, 231, 0.12);
        padding: 0.75rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
        z-index: 1000;
    }
    .av-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 800;
        font-size: 1.25rem;
        color: #f0f0f8;
        letter-spacing: -0.5px;
        text-decoration: none;
    }
    .av-brand-icon {
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
        color: white;
        padding: 0.5rem 0.6rem;
        border-radius: 8px;
        font-weight: 900;
        font-size: 0.85rem;
        box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .av-brand-icon::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
        animation: shimmer 3s ease-in-out infinite;
    }
    .av-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.85rem;
        border-radius: 20px;
        font-size: 0.78rem;
        font-weight: 600;
        color: #a8a8c8;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(108, 92, 231, 0.12);
    }
    .av-badge.active { color: #22c55e; background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.25); }

    /* ── Tabs ── */
    .av-tabs {
        display: flex;
        gap: 0;
        border-bottom: 2px solid rgba(108, 92, 231, 0.12);
        margin-bottom: 0;
        background: rgba(10, 10, 26, 0.5);
        padding: 0 1.5rem;
    }
    .av-tab {
        padding: 0.75rem 1.5rem;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        color: #6868a0;
        transition: all 0.3s;
        font-family: inherit;
    }
    .av-tab:hover { color: #f0f0f8; background: rgba(255,255,255,0.02); }
    .av-tab.active { color: #a29bfe; border-bottom-color: #6c5ce7; }

    /* ── Cards ── */
    .av-card {
        background: rgba(20, 20, 58, 0.6);
        border: 1px solid rgba(108, 92, 231, 0.12);
        border-radius: 14px;
        padding: 1.3rem;
        backdrop-filter: blur(12px);
        margin-bottom: 1rem;
        transition: all 0.3s;
    }
    .av-card:hover { border-color: rgba(108, 92, 231, 0.3); }
    .av-card-title {
        font-size: 0.85rem;
        color: #6868a0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
    }
    .av-card-value {
        font-size: 2rem;
        font-weight: 800;
        color: #f0f0f8;
        line-height: 1.2;
    }

    /* ── Stats grid ── */
    .av-stats {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
        padding: 1.5rem;
    }

    /* ── Agent chat ── */
    .av-chat-container {
        background: rgba(20, 20, 58, 0.6);
        border: 1px solid rgba(108, 92, 231, 0.12);
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        height: 500px;
        overflow: hidden;
    }
    .av-chat-msg {
        padding: 0.85rem 1.2rem;
        margin: 0.5rem 1rem;
        border-radius: 12px;
        max-width: 85%;
        animation: fadeIn 0.3s ease-out;
        line-height: 1.6;
        font-size: 0.9rem;
    }
    .av-chat-msg.user {
        background: rgba(108, 92, 231, 0.12);
        border: 1px solid rgba(108, 92, 231, 0.2);
        align-self: flex-end;
        margin-left: auto;
        border-bottom-right-radius: 4px;
    }
    .av-chat-msg.agent {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(108, 92, 231, 0.12);
        border-bottom-left-radius: 4px;
    }
    .av-chat-msg .role-label {
        font-size: 0.7rem;
        color: #6868a0;
        margin-bottom: 0.3rem;
        font-weight: 600;
    }

    /* ── Agent select cards ── */
    .av-agent-card {
        background: rgba(20, 20, 58, 0.6);
        border: 1px solid rgba(108, 92, 231, 0.12);
        border-radius: 14px;
        padding: 1.2rem;
        cursor: pointer;
        transition: all 0.3s;
        position: relative;
        overflow: hidden;
    }
    .av-agent-card:hover {
        border-color: rgba(108, 92, 231, 0.3);
        transform: translateY(-2px);
    }
    .av-agent-card.selected {
        border-color: #6c5ce7;
        box-shadow: 0 0 20px rgba(108, 92, 231, 0.15);
    }
    .av-agent-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 3px;
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
        opacity: 0;
        transition: all 0.3s;
    }
    .av-agent-card:hover::before { opacity: 1; }

    /* ── Buttons ── */
    .stButton > button {
        background: linear-gradient(135deg, #6c5ce7, #a29bfe) !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 0.88rem !important;
        padding: 0.5rem 1.2rem !important;
        transition: all 0.3s !important;
    }
    .stButton > button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 15px rgba(108, 92, 231, 0.4) !important;
    }

    /* ── Chat input ── */
    div[data-testid="stChatInput"] input {
        background: rgba(255,255,255,0.04) !important;
        border: 1px solid rgba(108, 92, 231, 0.12) !important;
        border-radius: 24px !important;
        color: #f0f0f8 !important;
        padding: 0.7rem 1rem !important;
    }
    div[data-testid="stChatInput"] input:focus {
        border-color: #6c5ce7 !important;
        box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.08) !important;
    }

    /* ── Misc ── */
    .av-page-title {
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        line-height: 1.2;
        background: linear-gradient(135deg, #6c5ce7, #fd79a8, #a29bfe);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        background-size: 200% 200%;
    }
    .av-subtitle {
        color: #6868a0;
        font-size: 1rem;
        margin-top: 0.3rem;
    }
    .av-status-dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 0.3rem;
    }
    .av-status-dot.idle { background: #2ecc71; }
    .av-status-dot.working { background: #3498db; animation: pulse 1.5s infinite; }
    .av-status-dot.error { background: #e74c3c; }

    /* ── Pre-formatted output (code blocks) ── */
    .av-code {
        background: rgba(0,0,0,0.4);
        padding: 0.8rem;
        border-radius: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.82rem;
        border: 1px solid rgba(108, 92, 231, 0.15);
        margin: 0.5rem 0;
        overflow-x: auto;
    }

    /* Hide default Streamlit elements */
    #MainMenu, header, footer, .stDeployButton { visibility: hidden; }
    .st-emotion-cache-18ni7ap { display: none; }
    div[data-testid="stToolbar"] { display: none; }
</style>
""",
    unsafe_allow_html=True,
)

# ─── Agent Definitions ────────────────────────────────────
AGENTS = [
    {
        "id": "athena",
        "name": "Athena",
        "role": "researcher",
        "description": "Searches, gathers, and summarizes information from the web",
        "color": "#3498db",
        "icon": "🔍",
        "model": "meta/llama-3.1-8b-instruct",
        "temperature": 0.3,
        "systemPrompt": "You are Athena, an expert research assistant. Search the web, analyze data, and present clear findings.",
    },
    {
        "id": "neo",
        "name": "Neo",
        "role": "coder",
        "description": "Writes, reviews, and debugs code in any language",
        "color": "#2ecc71",
        "icon": "💻",
        "model": "meta/llama-3.1-8b-instruct",
        "temperature": 0.3,
        "systemPrompt": "You are Neo, an expert software engineer. Write clean, well-documented code with proper type safety.",
    },
    {
        "id": "nova",
        "name": "Nova",
        "role": "analyst",
        "description": "Analyzes data, finds patterns, and generates actionable insights",
        "color": "#9b59b6",
        "icon": "📊",
        "model": "meta/llama-3.1-8b-instruct",
        "temperature": 0.3,
        "systemPrompt": "You are Nova, a senior data analyst. Present data-driven insights with clear metrics and visualizations.",
    },
    {
        "id": "luna",
        "name": "Luna",
        "role": "writer",
        "description": "Creates compelling content, copy, and documentation",
        "color": "#e67e22",
        "icon": "✍️",
        "model": "meta/llama-3.1-8b-instruct",
        "temperature": 0.5,
        "systemPrompt": "You are Luna, a professional content writer. Craft clear, engaging content tailored to the audience.",
    },
    {
        "id": "orion",
        "name": "Orion",
        "role": "assistant",
        "description": "Versatile AI assistant for any general task",
        "color": "#1abc9c",
        "icon": "🤖",
        "model": "meta/llama-3.1-8b-instruct",
        "temperature": 0.5,
        "systemPrompt": "You are Orion, a versatile AI assistant. Help with any task clearly and thoroughly.",
    },
]

ROLE_COLORS = {
    "researcher": "#3498db",
    "coder": "#2ecc71",
    "analyst": "#9b59b6",
    "writer": "#e67e22",
    "assistant": "#1abc9c",
}

# ─── Session State ─────────────────────────────────────────
if "current_tab" not in st.session_state:
    st.session_state.current_tab = "Dashboard"
if "messages" not in st.session_state:
    st.session_state.messages = {}
if "selected_agent" not in st.session_state:
    st.session_state.selected_agent = None
if "workflows" not in st.session_state:
    st.session_state.workflows = []
if "tasks" not in st.session_state:
    st.session_state.tasks = []


# ─── AI API Call ──────────────────────────────────────────
def query_ai_api(
    messages: list,
    model: str = "meta/llama-3.1-8b-instruct",
    temperature: float = 0.5,
) -> Optional[str]:
    """Call NVIDIA NIM API for AI responses."""
    if not NVIDIA_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "top_p": 1,
        "max_tokens": 4096,
        "stream": False,
    }

    try:
        resp = requests.post(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30,
        )
        if resp.ok:
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        st.error(f"API error: {e}")

    return None


def simulate_response(agent: dict, user_message: str) -> str:
    """Generate a simulated response when no API key is available."""
    responses = {
        "researcher": [
            "Based on my analysis, here are the key findings:\n\n"
            "1. **Market Trend**: The AI industry continues to grow at 35% YoY\n"
            "2. **Key Insight**: Multi-agent systems report 3x faster task completion\n"
            "3. **Recommendation**: Focus on RAG for domain-specific accuracy",
            "I gathered several sources on this topic. The data suggests a significant "
            "shift toward autonomous AI agents in production environments.",
        ],
        "coder": [
            "```python\n"
            "def optimized_solution(data: list) -> dict:\n"
            '    \"\"\"Production-ready implementation.\"\"\"\n'
            "    result = {}\n"
            "    for item in data:\n"
            "        key = item.get('id')\n"
            "        if key:\n"
            "            result[key] = item\n"
            "    return result\n```\n\n"
            "This follows best practices with type hints and error handling.",
            "Here's the architecture I recommend:\n\n"
            "- Use dependency injection for testability\n"
            "- Implement caching at the API layer\n"
            "- Add comprehensive error boundaries",
        ],
        "analyst": [
            "| Metric | Value | Trend |\n|--------|-------|-------|\n"
            "| Growth | 28.5% | ↑ |\n| Efficiency | 94.2% | ✅ |\n"
            "| Risk Score | 12.3 | ↓ |\n\n"
            "**Insights**: Strong upward trajectory across all indicators.",
            "**Deep Dive**: Performance indicators show:\n- Uptime: 99.97%\n"
            "- Response: 142ms avg\n- Error rate: 0.03%",
        ],
        "writer": [
            "**Headline**: The Future of AI: Why Multi-Agent Systems Are "
            "Revolutionizing Enterprise Workflows\n\n"
            "In today's digital landscape, organizations are seeking ways to "
            "maximize efficiency. Multi-agent AI systems are the answer.",
            "**Tagline**: \"Smarter Together: Orchestrate Your AI Workforce\"\n\n"
            "I can refine the tone or expand this into a full article.",
        ],
        "assistant": [
            "I'm happy to help! I can:\n"
            "1. **Research** - Gather and synthesize information\n"
            "2. **Analysis** - Process data and identify patterns\n"
            "3. **Create** - Generate content, code, or creative work\n\n"
            "What would you like me to focus on?",
            "Great question! Let me break this down:\n\n"
            "Here's my approach to help you get the best results.",
        ],
    }

    role_responses = responses.get(agent["role"], responses["assistant"])
    idx = (len(user_message) + len(st.session_state.messages.get(agent["id"], []))) % len(role_responses)

    result = f"_Simulated response for {agent['name']}_\n\n{role_responses[idx]}"
    if not NVIDIA_API_KEY:
        result += "\n\n---\n_Tip: Add your NVIDIA_API_KEY to get live AI responses._"
    return result


# ─── Header Component ────────────────────────────────────
def render_header():
    active_count = sum(
        1 for msgs in st.session_state.messages.values() if len(msgs) > 0
    )

    cols = st.columns([1, 1])
    with cols[0]:
        st.markdown(
            f"""
            <div class="av-header">
                <a href="#" class="av-brand">
                    <div class="av-brand-icon" aria-hidden="true">
                        ⚡
                    </div>
                    AgentVerse
                </a>
                <div style="display:flex;gap:0.5rem;">
                    <span class="av-badge active">⚡ {active_count} Active</span>
                    <span class="av-badge">👥 {len(AGENTS)} Agents</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )


# ─── Tab Navigation ──────────────────────────────────────
def render_tabs():
    tabs = ["Dashboard", "Agents", "Workflows"]
    icons = ["📊", "🤖", "⚡"]
    cols = st.columns(len(tabs))
    for i, tab in enumerate(tabs):
        with cols[i]:
            active = st.session_state.current_tab == tab
            st.markdown(
                f'<button onclick="" class="av-tab {"active" if active else ""}" '
                f'onclick="alert(\'click\')">'
                f'{icons[i]} {tab}'
                f'</button>',
                unsafe_allow_html=True,
            )
            # Use a tiny hidden button to handle the actual rerun
            triggered = st.button(
                f"{tab}",
                key=f"tab_{tab}",
                use_container_width=True,
                type="secondary" if not active else "primary",
            )
            if triggered:
                st.session_state.current_tab = tab
                st.rerun()


# ─── Dashboard Page ──────────────────────────────────────
def render_dashboard():
    st.markdown(
        f"""
        <div style="padding:1.5rem 1.5rem 0;">
            <div class="av-page-title">Dashboard</div>
            <div class="av-subtitle">Overview of your AI agent ecosystem</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Stats cards
    total_tasks = len(st.session_state.tasks)
    completed_tasks = sum(1 for t in st.session_state.tasks if t["status"] == "completed")
    active_chats = sum(1 for msgs in st.session_state.messages.values() if len(msgs) > 0)

    stats = [
        ("🤖", "Total Agents", len(AGENTS)),
        ("📋", "Total Tasks", total_tasks),
        ("✅", "Completed", completed_tasks),
        ("💬", "Active Chats", active_chats),
    ]

    st.markdown('<div class="av-stats">', unsafe_allow_html=True)
    cols = st.columns(len(stats))
    for i, (icon, label, value) in enumerate(stats):
        with cols[i]:
            st.markdown(
                f"""
                <div class="av-card">
                    <div style="font-size:1.5rem;margin-bottom:0.5rem;">{icon}</div>
                    <div class="av-card-value">{value}</div>
                    <div class="av-card-title">{label}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
    st.markdown("</div>", unsafe_allow_html=True)

    # Quick task
    st.markdown(
        '<div style="padding:0 1.5rem 1rem;">'
        '<div class="av-card-title" style="margin-bottom:0.5rem;">⚡ Quick Task</div>'
        "</div>",
        unsafe_allow_html=True,
    )

    col1, col2 = st.columns([3, 1])
    with col1:
        task_input = st.text_input(
            "Task description",
            placeholder="e.g., Research AI trends for Q3 2026...",
            label_visibility="collapsed",
        )
    with col2:
        agent_names = [a["name"] for a in AGENTS]
        selected_agent_name = st.selectbox("Agent", agent_names, label_visibility="collapsed")

    if task_input:
        agent = next(a for a in AGENTS if a["name"] == selected_agent_name)
        with st.spinner(f"🔄 {agent['name']} is working..."):
            if agent["id"] not in st.session_state.messages:
                st.session_state.messages[agent["id"]] = []
            st.session_state.messages[agent["id"]].append({
                "role": "user",
                "content": task_input,
            })

            messages_payload = [
                {"role": "system", "content": agent["systemPrompt"]},
            ]
            for msg in st.session_state.messages[agent["id"]][-6:]:
                messages_payload.append({"role": msg["role"], "content": msg["content"]})

            response = query_ai_api(messages_payload, agent["model"], agent["temperature"])
            if not response:
                response = simulate_response(agent, task_input)

            st.session_state.messages[agent["id"]].append({
                "role": "assistant",
                "content": response,
            })
            st.session_state.tasks.append({
                "id": hashlib.md5(task_input.encode()).hexdigest()[:8],
                "title": task_input[:60] + ("..." if len(task_input) > 60 else ""),
                "agent": agent["name"],
                "status": "completed" if response else "failed",
                "time": datetime.now().strftime("%H:%M"),
            })
        st.rerun()

    # Active agents
    st.markdown(
        '<div style="padding:1.5rem 1.5rem 0;">'
        '<div class="av-card-title" style="margin-bottom:1rem;">🤖 Active Agents</div>'
        "</div>",
        unsafe_allow_html=True,
    )

    agent_cols = st.columns(len(AGENTS))
    for i, agent in enumerate(AGENTS):
        with agent_cols[i]:
            active = st.session_state.selected_agent == agent["id"]
            has_msgs = agent["id"] in st.session_state.messages and st.session_state.messages[agent["id"]]

            st.markdown(
                f"""
                <div class="av-agent-card {'selected' if active else ''}"
                     onclick="document.querySelector('[data-testid=\\'baseButton-secondary\\']').click()">
                    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
                        <span style="font-size:1.3rem;">{agent['icon']}</span>
                        <div>
                            <div style="font-weight:700;color:#f0f0f8;font-size:0.95rem;">{agent['name']}</div>
                            <div style="font-size:0.75rem;color:{ROLE_COLORS[agent['role']]};font-weight:600;">
                                {agent['role'].title()}
                            </div>
                        </div>
                        <div class="av-status-dot {'idle' if has_msgs else 'idle'}" style="margin-left:auto;"></div>
                    </div>
                    <div style="font-size:0.8rem;color:#6868a0;">{agent['description']}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
            if st.button(f"Chat with {agent['name']}", key=f"dash_chat_{agent['id']}"):
                st.session_state.selected_agent = agent["id"]
                st.session_state.current_tab = "Agents"
                st.rerun()


# ─── Agents / Chat Page ──────────────────────────────────
def render_agents():
    st.markdown(
        f"""
        <div style="padding:1.5rem 1.5rem 0;">
            <div class="av-page-title">AI Agents</div>
            <div class="av-subtitle">Chat with your {len(AGENTS)} AI agents</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Agent selector
    agent_cols = st.columns(len(AGENTS))
    for i, agent in enumerate(AGENTS):
        with agent_cols[i]:
            active = st.session_state.selected_agent == agent["id"]
            if st.button(
                f"{agent['icon']} {agent['name']}",
                key=f"agent_{agent['id']}",
                use_container_width=True,
                type="secondary" if not active else "primary",
            ):
                st.session_state.selected_agent = agent["id"]
                if agent["id"] not in st.session_state.messages:
                    st.session_state.messages[agent["id"]] = []
                st.rerun()

    selected = st.session_state.selected_agent
    if not selected:
        st.info("👈 Select an agent to start chatting")
        return

    agent = next((a for a in AGENTS if a["id"] == selected), None)
    if not agent:
        return

    # Chat container
    st.markdown(
        f"""
        <div style="padding:0 1.5rem;">
            <div class="av-chat-container">
                <div style="padding:0.75rem 1.2rem;border-bottom:1px solid rgba(108,92,231,0.12);
                     border-left:3px solid {agent['color']};">
                    <div style="font-weight:700;color:#f0f0f8;">{agent['icon']} {agent['name']}</div>
                    <div style="font-size:0.78rem;color:#6868a0;">{agent['role'].title()} • {agent['description']}</div>
                </div>
                <div style="flex:1;overflow-y:auto;padding:0.5rem 0;display:flex;flex-direction:column;">
        """,
        unsafe_allow_html=True,
    )

    messages = st.session_state.messages.get(agent["id"], [])
    for msg in messages:
        role_class = "user" if msg["role"] == "user" else "agent"
        role_label = "You" if msg["role"] == "user" else agent["name"]
        # Use Streamlit's native chat message component (auto-escapes HTML)
        with st.chat_message("user" if role_class == "user" else "ai"):
            st.markdown(
                f'<div style="font-size:0.7rem;color:#6868a0;margin-bottom:0.3rem;font-weight:600;">'
                f'{html.escape(role_label)}</div>',
                unsafe_allow_html=True,
            )
            st.markdown(msg["content"])

    st.markdown("</div></div></div>", unsafe_allow_html=True)

    # Chat input
    prompt = st.chat_input(f"Message {agent['name']}...")
    if prompt:
        if agent["id"] not in st.session_state.messages:
            st.session_state.messages[agent["id"]] = []
        st.session_state.messages[agent["id"]].append({"role": "user", "content": prompt})

        with st.spinner(f"🔄 {agent['name']} is thinking..."):
            messages_payload = [{"role": "system", "content": agent["systemPrompt"]}]
            for msg in st.session_state.messages[agent["id"]][-10:]:
                messages_payload.append({"role": msg["role"], "content": msg["content"]})

            response = query_ai_api(messages_payload, agent["model"], agent["temperature"])
            if not response:
                response = simulate_response(agent, prompt)

            st.session_state.messages[agent["id"]].append({"role": "assistant", "content": response})
        st.rerun()


# ─── Workflows Page ──────────────────────────────────────
def render_workflows():
    st.markdown(
        f"""
        <div style="padding:1.5rem 1.5rem 0;">
            <div class="av-page-title">Workflows</div>
            <div class="av-subtitle">Orchestrate multi-step AI agent workflows</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Stats
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown(
            f'<div class="av-card"><div class="av-card-value">{len(st.session_state.workflows)}</div>'
            f'<div class="av-card-title">Total Workflows</div></div>',
            unsafe_allow_html=True,
        )
    with col2:
        running = sum(1 for w in st.session_state.workflows if w["status"] == "running")
        st.markdown(
            f'<div class="av-card"><div class="av-card-value">{running}</div>'
            f'<div class="av-card-title">Running</div></div>',
            unsafe_allow_html=True,
        )
    with col3:
        completed = sum(1 for w in st.session_state.workflows if w["status"] == "completed")
        st.markdown(
            f'<div class="av-card"><div class="av-card-value">{completed}</div>'
            f'<div class="av-card-title">Completed</div></div>',
            unsafe_allow_html=True,
        )

    # Existing workflows
    for wf in st.session_state.workflows:
        with st.expander(f"{'▶️' if wf['status'] == 'running' else '✅' if wf['status'] == 'completed' else '⏸️'} {wf['name']}"):
            st.markdown(f"**Description:** {wf['description']}")
            st.markdown(f"**Status:** {wf['status']}")
            st.markdown(f"**Steps:** {wf['step_count']}")
            st.markdown(f"<div class='av-code'><small>Created: {wf['created']}</small></div>", unsafe_allow_html=True)

    # Create workflow
    st.markdown("---")
    st.markdown("### Create New Workflow")

    with st.form("new_workflow"):
        wf_name = st.text_input("Workflow Name", placeholder="e.g., Market Research Pipeline")
        wf_desc = st.text_input("Description", placeholder="What does this workflow do?")
        step1_agent = st.selectbox("Step 1 Agent", [a["name"] for a in AGENTS], key="step1")
        step1_prompt = st.text_input("Step 1 Prompt", placeholder="e.g., Research top market trends")
        step2_agent = st.selectbox("Step 2 Agent", [a["name"] for a in AGENTS], key="step2")
        step2_prompt = st.text_input("Step 2 Prompt", placeholder="e.g., Analyze the research findings")
        submitted = st.form_submit_button("Create Workflow", use_container_width=True)

        if submitted and wf_name:
            st.session_state.workflows.append({
                "id": hashlib.md5(wf_name.encode()).hexdigest()[:8],
                "name": wf_name,
                "description": wf_desc or "Multi-step AI workflow",
                "status": "inactive",
                "step_count": 2,
                "created": datetime.now().strftime("%b %d, %Y"),
            })
            st.success(f"Workflow '{wf_name}' created!")
            st.rerun()


# ─── Main App ────────────────────────────────────────────
def main():
    render_header()
    render_tabs()

    # Tab content
    if st.session_state.current_tab == "Dashboard":
        render_dashboard()
    elif st.session_state.current_tab == "Agents":
        render_agents()
    elif st.session_state.current_tab == "Workflows":
        render_workflows()

    # Footer
    st.markdown(
        f"""
        <div style="text-align:center;padding:1.5rem;color:#6868a0;font-size:0.78rem;border-top:1px solid rgba(108,92,231,0.12);">
            AgentVerse — AI Agent Dashboard &nbsp;·&nbsp;
            <span style="color:#a29bfe;">⚡ {len(AGENTS)} agents ready</span>
        </div>
        """,
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    main()
