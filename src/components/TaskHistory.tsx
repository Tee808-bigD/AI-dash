import { useState } from 'react';
import type { Task } from '../types';
import { formatTime } from '../data/storage';
import { Clock, Bot, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, X, Zap, ClipboardList } from 'lucide-react';

interface TaskHistoryProps {
  tasks: Task[];
  onCancel?: (taskId: string) => void;
  onClear?: (taskId: string) => void;
}

export default function TaskHistory({ tasks, onCancel, onClear }: TaskHistoryProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>
          <ClipboardList size={40} />
        </div>
        <p>No tasks yet. Create a task to get started!</p>
      </div>
    );
  }

  const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    pending: { icon: <Clock size={16} />, color: '#f39c12' },
    running: { icon: <Zap size={16} />, color: '#3498db' },
    completed: { icon: <CheckCircle2 size={16} />, color: '#2ecc71' },
    failed: { icon: <XCircle size={16} />, color: '#e74c3c' },
  };

  return (
    <div className="task-list">
      {tasks.map((task) => {
        const config = statusConfig[task.status];
        const isExpanded = expandedTask === task.id;

        return (
          <div key={task.id} className={`task-item ${task.status === 'running' ? 'task-running' : ''}`}>
            <div className="task-header" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
              <div className="task-status-icon" style={{ color: config.color }}>{config.icon}</div>
              <div className="task-info">
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Bot size={12} />
                    {task.agentName}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={12} />
                    {formatTime(task.createdAt)}
                  </span>
                  <span className={`task-status-badge`} style={{ background: `${config.color}20`, color: config.color }}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="task-expand-icon">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </div>

            {isExpanded && (
              <div className="task-body">
                <div className="task-section">
                  <div className="task-section-label">Input</div>
                  <div className="task-section-content">{task.input}</div>
                </div>
                {task.output && (
                  <div className="task-section">
                    <div className="task-section-label">Output</div>
                    <div className="task-section-content">
                      {task.output.startsWith('Error:') ? (
                        <span style={{ color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={14} />
                          {task.output}
                        </span>
                      ) : (
                        <pre className="task-output-pre">{task.output}</pre>
                      )}
                    </div>
                  </div>
                )}
                <div className="task-actions">
                  {task.status === 'running' && onCancel && (
                    <button className="btn btn-danger btn-sm" onClick={() => onCancel(task.id)}>
                      <X size={14} />
                      Cancel Task
                    </button>
                  )}
                  {task.status !== 'running' && onClear && (
                    <button className="btn btn-ghost btn-sm" onClick={() => onClear(task.id)}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
