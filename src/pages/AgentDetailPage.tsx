import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgents } from '../context/AgentContext';
import AgentChat from '../components/AgentChat';
import TaskHistory from '../components/TaskHistory';
import LoadingSpinner from '../components/LoadingSpinner';
import { AGENT_ROLE_CONFIG } from '../types';
import { formatTime } from '../data/storage';
import { ROLE_ICONS } from '../components/Icons';
import { ArrowLeft, Trash2, Send, CircleDot, Zap, XCircle, CheckCircle2, Clock, Settings, ClipboardList, MessageSquare, AlertTriangle, X } from 'lucide-react';

export default function AgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { agents, tasks, getAgentMessages, deleteAgent, createTask, cancelTask, clearTask, updateAgent } = useAgents();
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'config'>('chat');
  const [taskInput, setTaskInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editSystemPrompt, setEditSystemPrompt] = useState('');
  const [editTemperature, setEditTemperature] = useState(0.5);
  const [editModel, setEditModel] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const agent = agents.find(a => a.id === agentId);
  const agentTasks = tasks.filter(t => t.agentId === agentId);
  const messages = agent ? getAgentMessages(agent.id) : [];
  const RoleIcon = agent ? ROLE_ICONS[agent.role] || ROLE_ICONS.assistant : null;

  useEffect(() => {
    if (!agent && agents.length > 0) {
      navigate('/agents', { replace: true });
    }
  }, [agent, agents, navigate]);

  if (!agent) return <div className="container"><LoadingSpinner text="Loading agent..." /></div>;

  const roleConfig = AGENT_ROLE_CONFIG[agent.role];

  const handleDelete = () => {
    deleteAgent(agent.id);
    navigate('/agents', { replace: true });
  };

  const handleQuickTask = async () => {
    if (!taskInput.trim()) return;
    const title = taskInput.trim().substring(0, 60) + (taskInput.trim().length > 60 ? '...' : '');
    await createTask(agent.id, title, 'Task from agent detail', taskInput.trim());
    setTaskInput('');
    setActiveTab('tasks');
  };

  const statusIcon = agent.status === 'idle'
    ? <CircleDot size={20} style={{ color: '#2ecc71' }} />
    : agent.status === 'working'
    ? <Zap size={20} style={{ color: '#3498db' }} />
    : <XCircle size={20} style={{ color: '#e74c3c' }} />;

  return (
    <div className="container fade-in">
      {/* Back button */}
      <button className="btn btn-ghost" onClick={() => navigate('/agents')} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} />
        Back to Agents
      </button>

      {/* Agent Profile Header */}
      <div className="agent-profile-header">
        <div className="agent-profile-avatar" style={{ background: `${roleConfig.color}20`, borderColor: roleConfig.color }}>
          <div style={{ color: roleConfig.color }}>
            {RoleIcon && <RoleIcon size={40} />}
          </div>
        </div>
        <div className="agent-profile-info">
          <div className="agent-profile-name">{agent.name}</div>
          <span className="agent-role-badge" style={{ background: `${roleConfig.color}20`, color: roleConfig.color }}>
            {roleConfig.label}
          </span>
          <p className="agent-profile-bio">{agent.description}</p>
          <div className="agent-profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">
                <CheckCircle2 size={16} style={{ color: '#2ecc71' }} />
                {' '}{agent.tasksCompleted}
              </span>
              <span className="profile-stat-label">Tasks Done</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">
                <Clock size={16} style={{ opacity: 0.7 }} />
                {' '}{formatTime(agent.lastActive)}
              </span>
              <span className="profile-stat-label">Last Active</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">
                {statusIcon}
              </span>
              <span className="profile-stat-label">{agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}</span>
            </div>
          </div>
        </div>
        <div className="agent-profile-actions">
          <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Quick Task Input */}
      <div className="quick-task-bar">
        <input
          className="form-input"
          id="agent-quick-task"
          name="quickTask"
          placeholder={`Assign a task to ${agent.name}...`}
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuickTask()}
        />
        <button className="btn btn-primary" onClick={handleQuickTask} disabled={!taskInput.trim()}>
          <Send size={16} />
          Run
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} style={{ marginRight: '0.4rem' }} />
          Chat
        </button>
        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <ClipboardList size={16} style={{ marginRight: '0.4rem' }} />
          Tasks ({agentTasks.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={16} style={{ marginRight: '0.4rem' }} />
          Configuration
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' && <AgentChat agent={agent} messages={messages} />}

      {activeTab === 'tasks' && (
        <div className="panel">
          <h3 className="panel-title">
            <ClipboardList size={18} style={{ color: 'var(--accent)' }} />
            Task History
          </h3>
          <TaskHistory tasks={agentTasks} onCancel={cancelTask} onClear={clearTask} />
        </div>
      )}

      {activeTab === 'config' && (
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Settings size={18} style={{ color: 'var(--accent)' }} />
              Agent Configuration
            </h3>
            <button
              className={`btn ${isEditing ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => {
                if (isEditing) {
                  updateAgent(agent.id, {
                    systemPrompt: editSystemPrompt,
                    temperature: editTemperature,
                    model: editModel,
                  });
                  setConfigSaved(true);
                  setTimeout(() => setConfigSaved(false), 2000);
                } else {
                  setEditSystemPrompt(agent.systemPrompt);
                  setEditTemperature(agent.temperature);
                  setEditModel(agent.model);
                }
                setIsEditing(!isEditing);
              }}
            >
              <Settings size={14} />
              {isEditing ? 'Save Changes' : 'Edit'}
            </button>
          </div>
          {configSaved && (
            <div className="status-message success" style={{ marginBottom: '1rem' }}>
              Configuration saved successfully!
            </div>
          )}
          <div className="config-grid">
            <div className="config-item">
              <span className="config-label">Model</span>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  id="edit-agent-model"
                  name="agentModel"
                />
              ) : (
                <span className="config-value">{agent.model}</span>
              )}
            </div>
            <div className="config-item">
              <span className="config-label">Temperature</span>
              {isEditing ? (
                <div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editTemperature}
                    onChange={(e) => setEditTemperature(parseFloat(e.target.value))}
                    className="form-range"
                    id="edit-agent-temp"
                    name="agentTemperature"
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{editTemperature.toFixed(1)}</span>
                </div>
              ) : (
                <span className="config-value">{agent.temperature.toFixed(1)}</span>
              )}
            </div>
            <div className="config-item">
              <span className="config-label">Created</span>
              <span className="config-value">{new Date(agent.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="config-item config-item-full">
              <span className="config-label">System Prompt</span>
              {isEditing ? (
                <textarea
                  className="form-textarea"
                  value={editSystemPrompt}
                  onChange={(e) => setEditSystemPrompt(e.target.value)}
                  rows={6}
                  id="edit-agent-prompt"
                  name="agentSystemPrompt"
                />
              ) : (
                <pre className="config-prompt">{agent.systemPrompt}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: '#e74c3c', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertTriangle size={20} />
                Delete Agent
              </h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>{agent.name}</strong>? This will remove all associated tasks and messages.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={14} />
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
