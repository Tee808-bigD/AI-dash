import { useState, useEffect, useRef, useMemo } from 'react';
import type { Agent, AgentMessage } from '../types';
import { useAgents } from '../context/AgentContext';
import { AGENT_ROLE_CONFIG } from '../types';
import { ROLE_ICONS } from './Icons';
import { searchWeb } from '../services/mcpService';
import { sanitizeChatContent } from '../services/security';
import { Send, AlertTriangle, User as UserIcon, Globe } from 'lucide-react';

interface AgentChatProps {
  agent: Agent;
  messages: AgentMessage[];
}

export default function AgentChat({ agent, messages }: AgentChatProps) {
  const { sendMessage } = useAgents();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roleConfig = AGENT_ROLE_CONFIG[agent.role];

  // Waiting for first token → show typing indicator dots
  const isWaitingForFirstToken = useMemo(() => {
    return sending && messages.some(m => m.role === 'agent' && m.content === '');
  }, [sending, messages]);
  // Tokens are flowing → show streaming cursor + glow
  const isStreamingActive = useMemo(() => {
    return sending && messages.some(m => m.role === 'agent' && m.content !== '');
  }, [sending, messages]);
  const RoleIcon = ROLE_ICONS[agent.role] || ROLE_ICONS.assistant;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const text = input.trim();
    setInput('');
    setSending(true);
    setError(null);

    try {
      // If web search is enabled, fetch search results and add to message context
      if (webSearchEnabled) {
        const searchResults = await searchWeb(text, 3).catch(() => []);
        if (searchResults.length > 0) {
          const searchContext = searchResults.map((r, i) =>
            `[${i + 1}] ${r.title} — ${r.snippet.slice(0, 200)} (${r.url})`
          ).join('\n');
          await sendMessage(agent.id, `${text}\n\n---\n**Web Search Results:**\n${searchContext}`);
        } else {
          await sendMessage(agent.id, text);
        }
      } else {
        await sendMessage(agent.id, text);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setError(msg);
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatContent = (content: string) => {
    // Sanitize content against XSS before rendering
    const safeContent = sanitizeChatContent(content);
    // Split into code blocks, image markdown, and text
    const parts = safeContent.split(/(```[\s\S]*?```|!\[[^\]]*\]\([^)]+\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
        return (
          <pre key={i} className="chat-code-block">
            <code>{code}</code>
          </pre>
        );
      }
      // Render markdown images inline
      const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2];
        // Detect if it's a chart image (QuickChart) or other image
        const isChart = src.includes('quickchart.io');
        return (
          <div key={i} className={`chat-image-wrapper ${isChart ? 'chat-chart-wrapper' : ''}`}>
            <img
              src={src}
              alt={alt}
              className={isChart ? 'chat-chart-image' : 'chat-inline-image'}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="agent-chat">
      <div className="chat-header-bar" style={{ borderLeftColor: roleConfig.color }}>
        <RoleIcon size={18} />
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({roleConfig.label})</span>
      </div>

      <div className="chat-messages-area">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div style={{ marginBottom: '1rem', opacity: 0.5 }}>
              <RoleIcon size={48} />
            </div>
            <h3 style={{ color: 'var(--text-primary)' }}>Chat with {agent.name}</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', textAlign: 'center' }}>
              {agent.systemPrompt.substring(0, 150)}...
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`chat-msg ${msg.role === 'agent' ? 'chat-msg-agent' : 'chat-msg-user'} ${isStreamingActive && idx === messages.length - 1 ? 'chat-msg-streaming' : ''}`}
            >
              <div className="chat-msg-avatar">
                {msg.role === 'agent' ? (
                  <RoleIcon size={18} />
                ) : (
                  <UserIcon size={18} />
                )}
              </div>
              <div className={`chat-msg-bubble ${msg.role === 'user' ? 'chat-msg-bubble-user' : ''}`}>
                <div className="chat-msg-text">
                  {formatContent(msg.content)}
                  {isStreamingActive && idx === messages.length - 1 && (
                    <span className="streaming-cursor" />
                  )}
                </div>
                <div className="chat-msg-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))
        )}
        {sending && messages.length > 0 && messages[messages.length - 1]?.role === 'agent' && messages[messages.length - 1]?.content === '' && (
          <div className="chat-msg chat-msg-agent">
            <div className="chat-msg-avatar">
              <RoleIcon size={18} />
            </div>
            <div className="chat-msg-bubble">
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="status-message error" style={{ margin: '0 1rem' }}>
            <AlertTriangle size={16} />
            {error}
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={sending}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          aria-label="Send message"
        >
          {sending ? (
            <div className="spinner-sm" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
