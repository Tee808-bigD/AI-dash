import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, X, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err);
        } else {
          onClose();
        }
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setSubmitting(false);
          return;
        }
        const { error: err } = await signUp(email, password);
        if (err) {
          setError(err);
        } else {
          setSuccess('Account created! Check your email for a confirmation link, or try logging in.');
          setMode('login');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content create-agent-modal"
        style={{ maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {!configured && (
          <div className="status-message warning" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>
              Supabase not configured. Add <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file to enable
              multi-user support. You can continue using the app without signing in.
            </span>
          </div>
        )}

        {error && (
          <div className="status-message error" style={{ marginBottom: '1rem', animation: 'slideUp 0.3s ease-out' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="status-message success" style={{ marginBottom: '1rem' }}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={16} />
              </span>
              <input
                id="auth-email"
                name="email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={16} />
              </span>
              <input
                id="auth-password"
                name="password"
                className="form-input"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <span className="spinner-sm" />
            ) : mode === 'login' ? (
              <>
                <LogIn size={16} />
                Sign In
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={switchMode}
                style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '0.9rem' }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={switchMode}
                style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '0.9rem' }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
