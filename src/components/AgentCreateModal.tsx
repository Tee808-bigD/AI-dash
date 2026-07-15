import { useState } from 'react';
import type { AgentRole } from '../types';
import { AGENT_ROLE_CONFIG } from '../types';
import { useAgents } from '../context/AgentContext';
import { ROLE_ICONS } from './Icons';
import { X, Check, ArrowRight, ArrowLeft, Bot, Zap, Sparkles } from 'lucide-react';

interface AgentCreateModalProps {
  onClose: () => void;
}

export default function AgentCreateModal({ onClose }: AgentCreateModalProps) {
  const { addAgent } = useAgents();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [role, setRole] = useState<AgentRole | null>(null);
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.5);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) { setError('Agent name is required'); return; }
    if (!role) { setError('Please select a role'); return; }
    if (!description.trim()) { setError('Description is required'); return; }
    if (!systemPrompt.trim()) { setError('System prompt is required'); return; }

    const avatar = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=${['b6e3f4','d1d4f9','c0aede','ffd5dc','f0e6d3','baffc9'][Math.floor(Math.random() * 6)]}`;

    addAgent({
      name: name.trim(),
      role,
      description: description.trim(),
      avatar,
      model: 'z-ai/glm-5.2',
      temperature,
      systemPrompt: systemPrompt.trim(),
    });

    onClose();
  };

  const SelectedRoleIcon = role ? ROLE_ICONS[role] || Bot : Bot;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content create-agent-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {step === 1 ? (
              <><Bot size={20} /> Create New Agent</>
            ) : step === 2 ? (
              <><Sparkles size={20} /> Configure Agent</>
            ) : (
              <><Check size={20} /> Review & Create</>
            )}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="step-indicators">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`step-dot ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
              <span>{step > s ? <Check size={14} /> : s}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="create-step">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Choose Agent Role</h4>
            <div className="role-grid">
              {(Object.entries(AGENT_ROLE_CONFIG) as [AgentRole, typeof AGENT_ROLE_CONFIG[AgentRole]][]).map(([key, cfg]) => {
                const Icon = ROLE_ICONS[key] || Bot;
                return (
                  <div
                    key={key}
                    className={`role-option ${role === key ? 'selected' : ''}`}
                    style={{ '--role-color': cfg.color } as React.CSSProperties}
                    onClick={() => setRole(key)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setRole(key)}
                  >
                    <div style={{ color: cfg.color }}><Icon size={32} /></div>
                    <div className="role-name">{cfg.label}</div>
                    <div className="role-desc">{cfg.description}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { if (!role) { setError('Please select a role'); return; } setError(''); setStep(2); }}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="create-step">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Configure Agent</h4>
            <div className="form-group">
              <label htmlFor="agent-name">Agent Name</label>
              <input id="agent-name" name="agent-name" className="form-input" placeholder="Enter a unique name..." value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="agent-description">Description</label>
              <textarea id="agent-description" name="agent-description" className="form-textarea" placeholder="What does this agent do?" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="form-group">
              <label htmlFor="agent-system-prompt">System Prompt</label>
              <textarea id="agent-system-prompt" name="agent-system-prompt" className="form-textarea" placeholder="Instructions that define the agent's personality and capabilities..." value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={4} />
            </div>
            <div className="form-group">
              <label>Temperature: {temperature.toFixed(1)}</label>
              <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="form-range" />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" onClick={() => { if (!name.trim() || !systemPrompt.trim()) { setError('Name and system prompt are required'); return; } setError(''); setStep(3); }}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="create-step">
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Review & Create</h4>
            <div className="review-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ color: role ? AGENT_ROLE_CONFIG[role].color : 'var(--accent)' }}>
                  <SelectedRoleIcon size={40} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{name}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{role ? AGENT_ROLE_CONFIG[role].label : ''}</div>
                </div>
              </div>
              <div className="review-item"><span>Description:</span> {description}</div>
              <div className="review-item"><span>Model:</span> z-ai/glm-5.2</div>
              <div className="review-item"><span>Temperature:</span> {temperature.toFixed(1)}</div>
              <div className="review-item" style={{ flexDirection: 'column', gap: '0.3rem' }}>
                <span>System Prompt:</span>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {systemPrompt}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
              <button className="btn btn-primary" onClick={handleCreate}>
                <Zap size={16} />
                Create Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
