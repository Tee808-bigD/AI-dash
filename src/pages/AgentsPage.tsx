import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAgents } from '../context/AgentContext';
import AgentCard from '../components/AgentCard';
import AgentCreateModal from '../components/AgentCreateModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import type { AgentRole, AgentMessage } from '../types';
import { AGENT_ROLE_CONFIG } from '../types';
import { searchWeb } from '../services/mcpService';
import { Plus, Search as SearchIcon, CheckCircle2, CircleDot, XCircle, Zap, MessageSquare, Send, User, X, Loader2, Globe, Bot } from 'lucide-react';

export default function AgentsPage() {
  const { agents, loading, sendMessage, getAgentMessages, addToast } = useAgents();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<AgentRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [chatAgentId, setChatAgentId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Open chat from URL param
  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId && agents.some(a => a.id === chatId)) {
      setChatAgentId(chatId);
      setSearchParams({});
    }
  }, [searchParams, agents, setSearchParams]);

  if (loading) {
    return (
      <div className="container fade-in">
        <div className="page-header">
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <div className="skeleton" style={{ width: '200px', height: '2rem', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div className="skeleton" style={{ width: '250px', height: '1rem', borderRadius: 'var(--radius-sm)' }} />
          </div>
          <div className="skeleton" style={{ width: '130px', height: '2.5rem', borderRadius: 'var(--radius-sm)' }} />
        </div>

        <div className="filters-bar">
          <div className="skeleton" style={{ flex: 1, height: '2.5rem', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '140px', height: '2.5rem', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '140px', height: '2.5rem', borderRadius: 'var(--radius-sm)' }} />
        </div>

        <div className="stats-row">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ width: '120px', height: '2rem', borderRadius: '20px' }} />
          ))}
        </div>

        <div className="agent-grid">
          {[1,2,3,4,5,6].map(i => (
            <LoadingSkeleton key={i} variant="agent-card" />
          ))}
        </div>
      </div>
    );
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = !searchQuery ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || agent.role === filterRole;
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Agents</h1>
          <p className="page-subtitle">Manage your team of {agents.length} AI agents</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Agent
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">
            <SearchIcon size={16} />
          </span>
          <input
            className="search-input"
            id="agent-search"
            name="agentSearch"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            className="form-select filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as AgentRole | 'all')}
            id="agent-role-filter"
            name="agentRole"
          >
            <option value="all">All Roles</option>
            {(Object.entries(AGENT_ROLE_CONFIG) as [AgentRole, typeof AGENT_ROLE_CONFIG[AgentRole]][]).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
          <select
            className="form-select filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            id="agent-status-filter"
            name="agentStatus"
          >
            <option value="all">All Status</option>
            <option value="idle">Idle</option>
            <option value="working">Working</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-chip">
          <span style={{ color: '#2ecc71', display: 'flex' }}>
            <CircleDot size={12} />
          </span>
          {agents.filter(a => a.status === 'idle').length} Idle
        </div>
        <div className="stat-chip">
          <span style={{ color: '#3498db', display: 'flex' }}>
            <Zap size={12} />
          </span>
          {agents.filter(a => a.status === 'working').length} Working
        </div>
        <div className="stat-chip">
          <span style={{ color: '#e74c3c', display: 'flex' }}>
            <XCircle size={12} />
          </span>
          {agents.filter(a => a.status === 'error').length} Error
        </div>
        <div className="stat-chip">
          <CheckCircle2 size={12} style={{ color: '#2ecc71' }} />
          {agents.reduce((sum, a) => sum + a.tasksCompleted, 0)} Total Tasks
        </div>
      </div>

      {chatAgentId ? (
        /* Inline Chat View */
        <AgentChatInline
          agentId={chatAgentId}
          onClose={() => setChatAgentId(null)}
          sendMessage={sendMessage}
          getAgentMessages={getAgentMessages}
          addToast={addToast}
        />
      ) : (
        <>
          {/* Agent Cards Grid */}
          {filteredAgents.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
                <SearchIcon size={48} />
              </div>
              <h3 style={{ color: 'var(--text-primary)' }}>No agents found</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                {searchQuery ? 'Try a different search term.' : 'Create your first AI agent to get started!'}
              </p>
            </div>
          ) : (
            <div className="agent-grid">
              {filteredAgents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </>
      )}

      {showCreateModal && <AgentCreateModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}

/* =========== Inline Chat Component =========== */
function AgentChatInline({
  agentId,
  onClose,
  sendMessage,
  getAgentMessages,
  addToast,
}: {
  agentId: string;
  onClose: () => void;
  sendMessage: (agentId: string, content: string) => Promise<AgentMessage>;
  getAgentMessages: (agentId: string) => AgentMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const { agents } = useAgents();
  const agent = agents.find(a => a.id === agentId);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(getAgentMessages(agentId));
  }, [agentId, getAgentMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!agent) {
    return <div className="empty-state"><h3>Agent not found</h3></div>;
  }

  const roleConfig = AGENT_ROLE_CONFIG[agent.role];

  const handleSend = async () => {
    if (!messageInput.trim() || sending) return;
    const userContent = messageInput.trim();
    setMessageInput('');
    setSending(true);

    // Optimistically add user message
    const userMsg: AgentMessage = {
      id: 'temp-' + Date.now(),
      agentId,
      role: 'user',
      content: userContent,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // If web search is enabled, fetch live search results as context
      if (webSearchEnabled) {
        const searchResults = await searchWeb(userContent, 3).catch(() => []);
        if (searchResults.length > 0) {
          const searchContext = searchResults.map((r, i) =>
            `[${i + 1}] ${r.title} — ${r.snippet.slice(0, 200)} (${r.url})`
          ).join('\n');
          await sendMessage(agentId, `${userContent}\n\n---\n**Web Search Results:**\n${searchContext}`);
        } else {
          await sendMessage(agentId, userContent);
        }
      } else {
        await sendMessage(agentId, userContent);
      }
      setMessages(getAgentMessages(agentId));
    } catch (err) {
      addToast('Failed to get response', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="agent-chat" style={{ height: '600px', marginBottom: 0 }}>
      <div className="chat-header-bar" style={{ borderLeftColor: roleConfig.color }}>
        <div className="chat-agent-icon">
          <User size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{agent.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{roleConfig.label} • Online</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          <X size={16} /> Close
        </button>
      </div>

      <div className="chat-messages-area">
        {messages.length === 0 && !sending ? (
          <div className="chat-empty">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.4 }}>
              <MessageSquare size={40} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Start a conversation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '300px' }}>
              Ask {agent.name} anything. The agent can search the web and read URLs in real-time.
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-agent'}`}>
              <div
                className="chat-msg-avatar"
                style={{
                  background: msg.role === 'user' ? 'var(--accent-gradient)' : `${roleConfig.color}20`,
                  color: msg.role === 'user' ? 'white' : roleConfig.color,
                }}
              >
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div>
                <div className={`chat-msg-bubble ${msg.role === 'user' ? 'chat-msg-bubble-user' : ''}`}>
                  <div className="chat-msg-text">{msg.content || '...'}</div>
                </div>
                <div className="chat-msg-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="chat-msg chat-msg-agent">
            <div className="chat-msg-avatar" style={{ background: `${roleConfig.color}20`, color: roleConfig.color }}>
              <Bot size={16} />
            </div>
            <div className="chat-msg-bubble">
              <div className="typing-indicator"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <button
          className={`btn btn-sm ${webSearchEnabled ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          title={webSearchEnabled ? 'Web search is ON — fetches live results for each message' : 'Web search is OFF — agent uses its training data only'}
          style={{ padding: '0.4rem 0.6rem', flexShrink: 0 }}
        >
          <Globe size={16} />
        </button>
        <textarea
          className="chat-input"
          placeholder={`Message ${agent.name}...`}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          rows={1}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={sending || !messageInput.trim()}>
          {sending ? <Loader2 size={18} className="spinner-sm" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}


