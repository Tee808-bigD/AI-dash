import { useState } from 'react';
import { useAgents } from '../context/AgentContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateId } from '../data/storage';
import { AGENT_ROLE_CONFIG } from '../types';
import type { WorkflowStep } from '../types';
import { ROLE_ICONS } from '../components/Icons';
import { Plus, Workflow, Zap, CheckCircle2, Link2, Clock, ChevronDown, Play, Trash2, X, Box, Bot, CircleDot } from 'lucide-react';

const WORKFLOW_CATEGORIES = ['Market Research', 'Content Strategy', 'Technical Audit', 'Competitive Analysis', 'Operational Efficiency', 'Other'];

export default function WorkflowsPage() {
  const { agents, tasks, workflows, runWorkflow, createWorkflow, deleteWorkflow, loading } = useAgents();
  const [showCreate, setShowCreate] = useState(false);
  const [wfName, setWfName] = useState('');
  const [wfDescription, setWfDescription] = useState('');
  const [wfCategory, setWfCategory] = useState(WORKFLOW_CATEGORIES[0]);
  const [wfSteps, setWfSteps] = useState<WorkflowStep[]>([]);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);

  if (loading) return <div className="container"><LoadingSpinner text="Loading workflows..." /></div>;

  const addStep = () => {
    const firstAgent = agents[0];
    if (!firstAgent) return;
    setWfSteps(prev => [...prev, {
      id: generateId(),
      agentId: firstAgent.id,
      agentName: firstAgent.name,
      prompt: '',
      order: prev.length + 1,
    }]);
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setWfSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  const removeStep = (stepId: string) => {
    setWfSteps(prev => prev.filter(s => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleCreateWorkflow = () => {
    if (!wfName.trim() || wfSteps.length === 0 || wfSteps.some(s => !s.prompt.trim())) return;
    createWorkflow({
      name: wfName.trim(),
      description: wfDescription.trim(),
      category: wfCategory,
      steps: wfSteps,
    });
    setShowCreate(false);
    setWfName('');
    setWfDescription('');
    setWfCategory(WORKFLOW_CATEGORIES[0]);
    setWfSteps([]);
  };

  const runningCount = workflows.filter(w => w.status === 'running').length;
  const completedCount = workflows.filter(w => w.status === 'completed').length;
  const totalSteps = workflows.reduce((acc, wf) => acc + wf.steps.length, 0);

  return (
    <div className="container fade-in">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Workflow Orchestration</h1>
          <p className="page-subtitle">Design and deploy multi-agent business processes for scalable automation</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} disabled={agents.length === 0}>
          <Plus size={18} />
          New Workflow
        </button>
      </div>

      {/* Business Stats Overview */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-card-header">
            <div className="stats-icon" style={{ background: 'rgba(108, 92, 231, 0.1)', color: 'var(--accent)' }}>
              <Workflow size={22} />
            </div>
          </div>
          <div className="stats-value">{workflows.length}</div>
          <div className="stats-label">Total Workflows</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-header">
            <div className="stats-icon" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
              <Zap size={22} />
            </div>
          </div>
          <div className="stats-value">{runningCount}</div>
          <div className="stats-label">Active Executions</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-header">
            <div className="stats-icon" style={{ background: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="stats-value">{completedCount}</div>
          <div className="stats-label">Successfully Completed</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-header">
            <div className="stats-icon" style={{ background: 'rgba(230, 126, 34, 0.1)', color: '#e67e22' }}>
              <Link2 size={22} />
            </div>
          </div>
          <div className="stats-value">{totalSteps}</div>
          <div className="stats-label">Total Process Steps</div>
        </div>
      </div>

      {workflows.length === 0 && !showCreate ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
            <Workflow size={48} />
          </div>
          <h3 style={{ color: 'var(--text-primary)' }}>No Operational Workflows</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', textAlign: 'center', lineHeight: '1.6' }}>
            Transform complex business requirements into automated agent pipelines.
            Chain multiple specialists together to handle end-to-end tasks with precision.
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: '1.5rem' }}>
            <Plus size={18} />
            Initialize Your First Workflow
          </button>
        </div>
      ) : (
        <div className="workflows-list">
          {workflows.map(wf => {
            const isRunning = wf.status === 'running';
            const isExpanded = expandedWorkflow === wf.id;

            return (
              <div key={wf.id} className={`workflow-card ${isRunning ? 'workflow-running' : ''}`}>
                <div className="workflow-header" onClick={() => setExpandedWorkflow(isExpanded ? null : wf.id)}>
                  <div className="workflow-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 className="workflow-name">{wf.name}</h3>
                      <span className="stat-chip" style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem' }}>
                        {wf.category || 'General'}
                      </span>
                    </div>
                    <p className="workflow-desc">{wf.description}</p>
                    <div className="workflow-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Link2 size={12} />
                        {wf.steps.length} Process Steps
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        {new Date(wf.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`workflow-status ${wf.status}`} style={{
                        fontWeight: 700,
                        color: wf.status === 'running' ? '#3498db' : wf.status === 'completed' ? '#2ecc71' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        {wf.status === 'running' ? <Zap size={14} /> : wf.status === 'completed' ? <CheckCircle2 size={14} /> : <CircleDot size={14} />}
                        {wf.status === 'running' ? 'Processing' : wf.status === 'completed' ? 'Finalized' : 'Standby'}
                      </span>
                    </div>
                  </div>
                  <div className="workflow-chevron" style={{ fontSize: '1.2rem', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'var(--transition)' }}>
                    <ChevronDown size={20} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="workflow-body">
                    <div className="workflow-steps">
                      {wf.steps.map((step, idx) => {
                        const agent = agents.find(a => a.id === step.agentId);
                        const role = agent ? AGENT_ROLE_CONFIG[agent.role] : null;
                        const StepIcon = role ? ROLE_ICONS[agent!.role] || Bot : Bot;

                        // Find the most recent task for this specific step in this workflow
                        const latestTask = tasks
                          .filter(t => t.title === `${wf.name} - Step ${step.order}`)
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

                        return (
                          <div key={step.id} className="workflow-step-item">
                            <div className="workflow-step-number">{step.order}</div>
                            <div className="workflow-step-content">
                              <div className="workflow-step-agent" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <StepIcon size={16} />
                                {step.agentName}
                                <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '0.5rem' }}>
                                  ({role?.label})
                                </span>
                              </div>
                              <div className="workflow-step-prompt" style={{ marginTop: '0.3rem' }}>
                                {step.prompt}
                              </div>
                              {latestTask && (
                                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Last Run Result: </span>
                                  <span style={{ fontStyle: 'italic' }}>
                                    {latestTask.status === 'completed' ? latestTask.output.substring(0, 150) + (latestTask.output.length > 150 ? '...' : '') : latestTask.status}
                                  </span>
                                </div>
                              )}
                            </div>
                            {idx < wf.steps.length - 1 && <div className="workflow-step-arrow">
                              <ChevronDown size={16} />
                            </div>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="workflow-actions">
                      {!isRunning && wf.status !== 'completed' && (
                        <button className="btn btn-primary" onClick={() => runWorkflow(wf.id)}>
                          <Play size={16} />
                          Execute Workflow
                        </button>
                      )}
                      {!isRunning && (
                        <button className="btn btn-danger btn-sm" onClick={() => deleteWorkflow(wf.id)}>
                          <Trash2 size={14} />
                          Archive Workflow
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Workflow Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content create-workflow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Workflow size={20} />
                Design New Workflow
              </h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>
                <X size={18} />
              </button>
            </div>              <div className="form-group">
                <label htmlFor="wf-name">Workflow Name</label>
                <input className="form-input" id="wf-name" name="workflowName" placeholder="e.g., Strategic Market Intelligence Pipeline" value={wfName} onChange={(e) => setWfName(e.target.value)} />
              </div>

              <div className="form-group">
                <label htmlFor="wf-category">Business Category</label>
                <select
                  className="form-select"
                  id="wf-category"
                  name="workflowCategory"
                  value={wfCategory}
                  onChange={(e) => setWfCategory(e.target.value)}
                >
                  {WORKFLOW_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="wf-description">Objective / Description</label>
                <textarea className="form-textarea" id="wf-description" name="workflowDescription" placeholder="Describe the business value and objective of this automation..." value={wfDescription} onChange={(e) => setWfDescription(e.target.value)} rows={2} />
              </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <label style={{ margin: 0 }}>Operational Sequence (Steps)</label>
                <button className="btn btn-outline btn-sm" onClick={addStep}>
                  <Plus size={14} />
                  Add Process Step
                </button>
              </div>

              {wfSteps.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No steps defined. Add agents to build your sequence.
                  </p>
                </div>
              )}

              {wfSteps.map((step) => (
                <div key={step.id} className="workflow-step-editor">
                  <div className="step-editor-header">
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Box size={14} />
                      Step {step.order}
                    </span>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const idx = wfSteps.findIndex(s => s.id === step.id);
                          if (idx > 0) {
                            const reordered = [...wfSteps];
                            [reordered[idx-1], reordered[idx]] = [reordered[idx], reordered[idx-1]];
                            setWfSteps(reordered.map((s, i) => ({ ...s, order: i + 1 })));
                          }
                        }}
                        disabled={step.order <= 1}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const idx = wfSteps.findIndex(s => s.id === step.id);
                          if (idx < wfSteps.length - 1) {
                            const reordered = [...wfSteps];
                            [reordered[idx], reordered[idx+1]] = [reordered[idx+1], reordered[idx]];
                            setWfSteps(reordered.map((s, i) => ({ ...s, order: i + 1 })));
                          }
                        }}
                        disabled={step.order >= wfSteps.length}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: '#e74c3c' }} onClick={() => removeStep(step.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <select
                      className="form-select"
                      value={step.agentId}
                      onChange={(e) => {
                        const agent = agents.find(a => a.id === e.target.value);
                        if (agent) updateStep(step.id, { agentId: agent.id, agentName: agent.name });
                      }}
                    >
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} - {AGENT_ROLE_CONFIG[a.role].label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className="form-textarea"
                      placeholder="Define the specific instruction for this agent..."
                      value={step.prompt}
                      onChange={(e) => updateStep(step.id, { prompt: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Discard</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateWorkflow}
                disabled={!wfName.trim() || wfSteps.length === 0 || wfSteps.some(s => !s.prompt.trim())}
              >
                <Zap size={16} />
                Deploy Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
