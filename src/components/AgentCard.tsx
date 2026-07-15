import { useNavigate } from 'react-router-dom';
import type { Agent } from '../types';
import { AGENT_ROLE_CONFIG } from '../types';
import { formatTime } from '../data/storage';
import { ROLE_ICONS } from './Icons';
import { MessageSquare, CheckCircle2, Clock, ChevronRight } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const navigate = useNavigate();
  const roleConfig = AGENT_ROLE_CONFIG[agent.role];
  const RoleIcon = ROLE_ICONS[agent.role] || ROLE_ICONS.assistant;

  const statusColors: Record<string, string> = {
    idle: '#2ecc71',
    working: '#3498db',
    error: '#e74c3c',
  };

  return (
    <div
      className="agent-card"
      onClick={() => navigate(`/agents/${agent.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/agents/${agent.id}`)}
    >
      <div className="agent-card-header">
        <div className="agent-avatar" style={{ background: `${roleConfig.color}20`, borderColor: roleConfig.color }}>
          <div style={{ color: roleConfig.color }}>
            <RoleIcon size={24} />
          </div>
        </div>
        <div className="agent-status-dot" style={{ background: statusColors[agent.status] }} />
      </div>

      <h3 className="agent-name">{agent.name}</h3>
      <span className="agent-role-badge" style={{ background: `${roleConfig.color}20`, color: roleConfig.color }}>
        {roleConfig.label}
      </span>

      <p className="agent-description">{agent.description}</p>

      <div className="agent-meta">
        <div className="agent-meta-item">
          <CheckCircle2 size={14} style={{ color: '#2ecc71' }} />
          <span>{agent.tasksCompleted} tasks</span>
        </div>
        <div className="agent-meta-item">
          <Clock size={14} style={{ opacity: 0.7 }} />
          <span>{formatTime(agent.lastActive)}</span>
        </div>
      </div>

      <div className="agent-card-footer">
        <button
          className="btn btn-primary btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/agents?chat=${agent.id}`);
          }}
        >
          <MessageSquare size={14} />
          Chat
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/agents/${agent.id}`);
          }}
        >
          View Profile <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
