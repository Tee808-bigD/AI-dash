import { useState } from 'react';
import { useAgents } from '../context/AgentContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Plus, Trash2, Server, Key, Webhook, Power,
  CheckCircle2, XCircle, AlertTriangle, Globe, Database,
  Zap, Eye, EyeOff, X, RefreshCw, Bot
} from 'lucide-react';

const PROVIDER_TEMPLATES = [
  { provider: 'nvidia', label: 'NVIDIA AI', baseUrl: 'https://integrate.api.nvidia.com/v1', color: '#76b900' },
  { provider: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', color: '#00a67e' },
  { provider: 'anthropic', label: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', color: '#d4a574' },
  { provider: 'google', label: 'Google AI', baseUrl: 'https://generativelanguage.googleapis.com/v1', color: '#4285f4' },
];

export default function IntegrationsPage() {
  const { apiKeys, mcpServers, addAPIKey, removeAPIKey, toggleAPIKey, addMCPServer, updateMCPServer, removeMCPServer, loading } = useAgents();
  const [activeTab, setActiveTab] = useState<'api' | 'mcp'>('api');
  const [showAddKey, setShowAddKey] = useState(false);
  const [showAddMCP, setShowAddMCP] = useState(false);
  const [keyProvider, setKeyProvider] = useState(PROVIDER_TEMPLATES[0].provider);
  const [keyValue, setKeyValue] = useState('');
  const [keyLabel, setKeyLabel] = useState('');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [mcpName, setMcpName] = useState('');
  const [mcpDesc, setMcpDesc] = useState('');
  const [mcpEndpoint, setMcpEndpoint] = useState('');

  if (loading) return <div className="container"><LoadingSpinner text="Loading integrations..." /></div>;

  const handleAddKey = () => {
    if (!keyValue.trim() || !keyProvider) return;
    const template = PROVIDER_TEMPLATES.find(t => t.provider === keyProvider);
    addAPIKey({
      provider: keyProvider,
      key: keyValue.trim(),
      label: keyLabel.trim() || template?.label || keyProvider,
      baseUrl: template?.baseUrl || '',
      isActive: true,
    });
    setKeyValue('');
    setKeyLabel('');
    setShowAddKey(false);
  };

  const handleAddMCP = () => {
    if (!mcpName.trim() || !mcpEndpoint.trim()) return;
    addMCPServer({
      name: mcpName.trim(),
      description: mcpDesc.trim(),
      endpoint: mcpEndpoint.trim(),
      tools: [],
      status: 'offline',
    });
    setMcpName('');
    setMcpDesc('');
    setMcpEndpoint('');
    setShowAddMCP(false);
  };

  const suggestMCPEndpoint = async (server: typeof mcpServers[0]) => {
    updateMCPServer(server.id, { status: 'online' });
    try {
      const resp = await fetch(server.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.result?.tools) {
          updateMCPServer(server.id, {
            tools: data.result.tools.map((t: { name: string; description?: string; inputSchema?: unknown }) => ({
              name: t.name,
              description: t.description || '',
              inputSchema: JSON.stringify(t.inputSchema || {}),
            })),
            status: 'online',
          });
        }
      } else {
        updateMCPServer(server.id, { status: 'error' });
      }
    } catch {
      updateMCPServer(server.id, { status: 'error' });
    }
  };

  const providersInUse = apiKeys.map(k => k.provider);

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Integration Center</h1>
          <p className="page-subtitle">Connect AI providers and MCP servers to extend agent capabilities</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <Key size={16} style={{ marginRight: '0.4rem' }} />
          API Keys ({apiKeys.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'mcp' ? 'active' : ''}`}
          onClick={() => setActiveTab('mcp')}
        >
          <Webhook size={16} style={{ marginRight: '0.4rem' }} />
          MCP Servers ({mcpServers.length})
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-icon" style={{ background: 'rgba(108, 92, 231, 0.1)', color: 'var(--accent)' }}>
                  <Key size={22} />
                </div>
              </div>
              <div className="stats-value">{apiKeys.length}</div>
              <div className="stats-label">Connected Providers</div>
            </div>
            <div className="stats-card">
              <div className="stats-card-header">
                <div className="stats-icon" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
                  <Power size={22} />
                </div>
              </div>
              <div className="stats-value">{apiKeys.filter(k => k.isActive).length}</div>
              <div className="stats-label">Active Keys</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setShowAddKey(true)}>
              <Plus size={16} />
              Add API Key
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
                <Key size={48} />
              </div>
              <h3 style={{ color: 'var(--text-primary)' }}>No API Keys Configured</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '450px', textAlign: 'center' }}>
                Connect AI providers to enable real-time agent responses. Add a key from NVIDIA, OpenAI, Anthropic, or any OpenAI-compatible provider.
              </p>
              <button className="btn btn-primary" onClick={() => setShowAddKey(true)} style={{ marginTop: '1rem' }}>
                <Plus size={16} />
                Add Your First API Key
              </button>
            </div>
          ) : (
            <div className="panel">
              <h3 className="panel-title">
                <Key size={18} style={{ color: 'var(--accent)' }} />
                Configured Providers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {apiKeys.map((apiKey) => {
                  const template = PROVIDER_TEMPLATES.find(t => t.provider === apiKey.provider);
                  const maskedKey = apiKey.key.length > 12
                    ? apiKey.key.substring(0, 8) + '••••••••' + apiKey.key.substring(apiKey.key.length - 4)
                    : '••••••••';
                  return (
                    <div key={apiKey.provider} className="config-item config-item-full" style={{
                      display: 'flex', flexDirection: 'row', alignItems: 'center',
                      justifyContent: 'space-between', gap: '1rem',
                      padding: '1rem', borderRadius: 'var(--radius)',
                      border: `1px solid ${apiKey.isActive ? 'rgba(46, 204, 113, 0.3)' : 'var(--border)'}`,
                      background: apiKey.isActive ? 'rgba(46, 204, 113, 0.03)' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
                        <div className="stats-icon" style={{
                          background: `${template?.color || 'var(--accent)'}15`,
                          color: template?.color || 'var(--accent)',
                          width: 40, height: 40, borderRadius: 10,
                        }}>
                          <Globe size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {apiKey.label}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <code style={{ fontSize: '0.78rem' }}>
                              {showKey[apiKey.provider] ? apiKey.key : maskedKey}
                            </code>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0.2rem', minWidth: 'auto' }}
                              onClick={() => setShowKey(prev => ({ ...prev, [apiKey.provider]: !prev[apiKey.provider] }))}
                            >
                              {showKey[apiKey.provider] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className={`btn ${apiKey.isActive ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
                          onClick={() => toggleAPIKey(apiKey.provider)}
                          title={apiKey.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {apiKey.isActive ? <Zap size={14} /> : <Power size={14} />}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => removeAPIKey(apiKey.provider)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Providers */}
          <div className="panel">
            <h3 className="panel-title">
              <Database size={18} style={{ color: 'var(--accent)' }} />
              Available Providers
            </h3>
            <div className="stats-row">
              {PROVIDER_TEMPLATES.map(template => {
                const isConnected = providersInUse.includes(template.provider);
                return (
                  <div key={template.provider} className="stat-chip" style={{
                    borderColor: isConnected ? 'rgba(46, 204, 113, 0.4)' : 'var(--border)',
                    background: isConnected ? 'rgba(46, 204, 113, 0.06)' : 'transparent',
                  }}>
                    {isConnected
                      ? <CheckCircle2 size={14} style={{ color: '#2ecc71' }} />
                      : <Zap size={14} style={{ opacity: 0.4 }} />
                    }
                    {template.label}
                    <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '0.2rem' }}>
                      {isConnected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add API Key Modal */}
          {showAddKey && (
            <div className="modal-overlay" onClick={() => setShowAddKey(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Key size={20} />
                    Add API Key
                  </h3>
                  <button className="modal-close" onClick={() => setShowAddKey(false)}>
                    <X size={18} />
                  </button>
                </div>

                <div className="form-group">
                  <label>Provider</label>
                  <select
                    className="form-select"
                    value={keyProvider}
                    onChange={(e) => {
                      setKeyProvider(e.target.value);
                      const template = PROVIDER_TEMPLATES.find(t => t.provider === e.target.value);
                      if (template) setKeyLabel(template.label);
                    }}
                  >
                    {PROVIDER_TEMPLATES.map(t => (
                      <option key={t.provider} value={t.provider}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>API Key</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="nvapi-..."
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Label (optional)</label>
                  <input
                    className="form-input"
                    placeholder="e.g., Production Key"
                    value={keyLabel}
                    onChange={(e) => setKeyLabel(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-ghost" onClick={() => setShowAddKey(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleAddKey} disabled={!keyValue.trim()}>
                    <Plus size={16} />
                    Add Key
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MCP Servers Tab */}
      {activeTab === 'mcp' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setShowAddMCP(true)}>
              <Plus size={16} />
              Add MCP Server
            </button>
          </div>

          {mcpServers.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
                <Server size={48} />
              </div>
              <h3 style={{ color: 'var(--text-primary)' }}>No MCP Servers Connected</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '450px', textAlign: 'center' }}>
                MCP (Model Context Protocol) servers let your agents discover and call external tools.
                Add a server endpoint to extend agent capabilities.
              </p>
              <button className="btn btn-primary" onClick={() => setShowAddMCP(true)} style={{ marginTop: '1rem' }}>
                <Plus size={16} />
                Add Your First MCP Server
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mcpServers.map(server => (
                <div key={server.id} className="panel" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                    <div className="stats-icon" style={{
                      background: server.status === 'online'
                        ? 'rgba(46, 204, 113, 0.1)'
                        : server.status === 'error' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(255,255,255,0.04)',
                      color: server.status === 'online' ? '#2ecc71' : server.status === 'error' ? '#e74c3c' : 'var(--text-muted)',
                      width: 40, height: 40, borderRadius: 10,
                    }}>
                      <Server size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{server.name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{server.description}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {server.status === 'online' ? (
                        <span className="stat-chip" style={{ color: '#2ecc71', background: 'rgba(46, 204, 113, 0.1)', borderColor: 'rgba(46, 204, 113, 0.2)' }}>
                          <CheckCircle2 size={12} /> Online
                        </span>
                      ) : server.status === 'error' ? (
                        <span className="stat-chip" style={{ color: '#e74c3c', background: 'rgba(231, 76, 60, 0.1)', borderColor: 'rgba(231, 76, 60, 0.2)' }}>
                          <XCircle size={12} /> Error
                        </span>
                      ) : (
                        <span className="stat-chip">
                          <AlertTriangle size={12} /> Offline
                        </span>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => suggestMCPEndpoint(server)} title="Test Connection">
                        <RefreshCw size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => removeMCPServer(server.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
                    <code style={{ fontSize: '0.78rem', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {server.endpoint}
                    </code>
                  </div>

                  {server.tools.length > 0 && (
                    <div style={{ marginTop: '0.8rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                        Available Tools ({server.tools.length})
                      </div>
                      <div className="stats-row" style={{ margin: 0 }}>
                        {server.tools.map(tool => (
                          <div key={tool.name} className="stat-chip" style={{ cursor: 'default' }}>
                            <Bot size={12} />
                            {tool.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add MCP Server Modal */}
          {showAddMCP && (
            <div className="modal-overlay" onClick={() => setShowAddMCP(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Server size={20} />
                    Add MCP Server
                  </h3>
                  <button className="modal-close" onClick={() => setShowAddMCP(false)}>
                    <X size={18} />
                  </button>
                </div>

                <div className="form-group">
                  <label>Server Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g., Database Tools"
                    value={mcpName}
                    onChange={(e) => setMcpName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="What tools does this server provide?"
                    value={mcpDesc}
                    onChange={(e) => setMcpDesc(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Endpoint URL</label>
                  <input
                    className="form-input"
                    placeholder="https://your-mcp-server.com/api"
                    value={mcpEndpoint}
                    onChange={(e) => setMcpEndpoint(e.target.value)}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    MCP servers should implement the JSON-RPC 2.0 protocol for tool discovery
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-ghost" onClick={() => setShowAddMCP(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleAddMCP} disabled={!mcpName.trim() || !mcpEndpoint.trim()}>
                    <Plus size={16} />
                    Add Server
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
