import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgents } from '../context/AgentContext';
import StatsCard from '../components/StatsCard';
import AgentCard from '../components/AgentCard';
import TaskHistory from '../components/TaskHistory';
import AgentCreateModal from '../components/AgentCreateModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { AGENT_ROLE_CONFIG } from '../types';
import { Plus, Users, Zap, CheckCircle2, TrendingUp, Workflow, Send, ChevronRight, Bot, ClipboardList, CircleDot, XCircle, MessageSquare } from 'lucide-react';

/* Helper skeleton block for the loading state */
function SkeletonBlock({ width, height }: { width: string; height: string }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 'var(--radius-sm)' }} />;
}

export default function DashboardPage() {
  const { agents, tasks, stats, loading, cancelTask, clearTask, createTask } = useAgents();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [taskAgentId, setTaskAgentId] = useState(agents[0]?.id || '');

  if (loading) {
    return (
      <div className="container fade-in">
        <div className="page-header">
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <div className="skeleton" style={{ width: '280px', height: '2rem', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div className="skeleton" style={{ width: '200px', height: '1rem', borderRadius: 'var(--radius-sm)' }} />
          </div>
          <LoadingSkeleton variant="chip" width="130px" height="2.5rem" />
        </div>

        <div className="stats-grid">
          {[1,2,3,4,5].map(i => (
            <LoadingSkeleton key={i} variant="stat-card" />
          ))}
        </div>

        <div className="dashboard-grid">
          <LoadingSkeleton variant="panel" />
          <LoadingSkeleton variant="panel" />
        </div>

        <div className="panel" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <SkeletonBlock width="18px" height="18px" />
            <SkeletonBlock width="120px" height="1.2rem" />
          </div>
          <LoadingSkeleton variant="text" count={1} />
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <SkeletonBlock width="18px" height="18px" />
            <SkeletonBlock width="120px" height="1.2rem" />
          </div>
          <div className="agent-grid">
            {[1,2,3].map(i => (
              <LoadingSkeleton key={i} variant="agent-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentTasks = tasks.slice(0, 5);
  const recentAgents = agents.slice(0, 3);

  const handleQuickTask = async () => {
    if (!taskInput.trim() || !taskAgentId) return;
    const agent = agents.find(a => a.id === taskAgentId);
    if (!agent) return;
    const title = taskInput.trim().substring(0, 60) + (taskInput.trim().length > 60 ? '...' : '');
    await createTask(taskAgentId, title, 'Quick task from dashboard', taskInput.trim());
    setTaskInput('');
  };

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agent Dashboard</h1>
          <p className="page-subtitle">Monitor and manage your AI agent ecosystem</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Agent
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatsCard label="Total Agents" value={stats.totalAgents} icon={<Users size={20} />} color="#3498db" />
        <StatsCard label="Active Tasks" value={stats.activeTasks} icon={<Zap size={20} />} color="#e67e22" />
        <StatsCard label="Tasks Completed" value={stats.tasksCompleted} icon={<CheckCircle2 size={20} />} color="#2ecc71" />
        <StatsCard label="Success Rate" value={`${stats.successRate}%`} icon={<TrendingUp size={20} />} color="#9b59b6" />
        <StatsCard label="Active Workflows" value={stats.activeWorkflows} icon={<Workflow size={20} />} color="#1abc9c" />
      </div>

      {/* Status Chips */}
      <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
        <span className="stat-chip" style={{ color: '#2ecc71' }}>
          <CircleDot size={12} />
          {agents.filter(a => a.status === 'idle').length} Idle
        </span>
        <span className="stat-chip" style={{ color: '#3498db' }}>
          <Zap size={12} />
          {agents.filter(a => a.status === 'working').length} Working
        </span>
        <span className="stat-chip" style={{ color: '#e74c3c' }}>
          <XCircle size={12} />
          {agents.filter(a => a.status === 'error').length} Error
        </span>
        <span className="stat-chip">
          <CheckCircle2 size={12} style={{ color: '#2ecc71' }} />
          {agents.reduce((sum, a) => sum + a.tasksCompleted, 0)} Total Tasks
        </span>
        <span className="stat-chip">
          <TrendingUp size={12} style={{ color: '#9b59b6' }} />
          {stats.successRate}% Success
        </span>
      </div>

      <div className="dashboard-grid">
        {/* Quick Task */}
        <div className="panel">
          <h3 className="panel-title">
            <Zap size={18} style={{ color: 'var(--accent)' }} />
            Quick Task
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Assign a task to any agent instantly
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <select
              className="form-select"
              value={taskAgentId}
              onChange={(e) => setTaskAgentId(e.target.value)}
              id="quick-task-agent"
              name="taskAgent"
              aria-label="Select agent"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} — {AGENT_ROLE_CONFIG[a.role].label}
                </option>
              ))}
            </select>
            <textarea
              className="form-textarea"
              placeholder="Describe the task..."
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              id="quick-task-input"
              name="taskDescription"
              rows={3}
            />
            <button className="btn btn-primary" onClick={handleQuickTask} disabled={!taskInput.trim()}>
              <Send size={16} />
              Execute Task
            </button>
          </div>
        </div>

        {/* Recent Agents */}
        <div className="panel">
          <h3 className="panel-title">
            <Bot size={18} style={{ color: 'var(--accent)' }} />
            Active Agents
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Click an agent to chat or view their profile
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {recentAgents.map(agent => (
              <div
                key={agent.id}
                className="compact-agent"
                onClick={() => navigate(`/agents/${agent.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/agents/${agent.id}`)}
              >
                <div className="compact-agent-avatar" style={{ background: `${AGENT_ROLE_CONFIG[agent.role].color}15`, color: AGENT_ROLE_CONFIG[agent.role].color }}>
                  <Bot size={20} />
                </div>
                <div className="compact-agent-info">
                  <div className="compact-agent-name">{agent.name}</div>
                  <div className="compact-agent-role">{AGENT_ROLE_CONFIG[agent.role].label}</div>
                </div>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: agent.status === 'idle' ? '#2ecc71' : agent.status === 'working' ? '#3498db' : '#e74c3c',
                  boxShadow: agent.status === 'working' ? '0 0 8px #3498db' : 'none',
                  animation: agent.status === 'working' ? 'pulse 1.5s infinite' : 'none',
                }} />
              </div>
            ))}
          </div>
          {agents.length > 3 && (
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => navigate('/agents')}>
              View all {agents.length} agents <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <ClipboardList size={18} style={{ color: 'var(--accent)' }} />
            Recent Tasks
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/agents')}>
            View All
          </button>
        </div>
        <TaskHistory tasks={recentTasks} onCancel={cancelTask} onClear={clearTask} />
      </div>

      {/* Agent Cards */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 className="panel-title" style={{ marginBottom: '1rem' }}>
          <Users size={18} style={{ color: 'var(--accent)' }} />
          All Agents
        </h3>
        <div className="agent-grid">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && <AgentCreateModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}


