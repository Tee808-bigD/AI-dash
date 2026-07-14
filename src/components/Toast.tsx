import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { Toast as ToastType } from '../types';

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--success, #22c55e)', flexShrink: 0 }} />}
          {toast.type === 'error' && <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />}
          {toast.type === 'info' && <Info size={18} style={{ color: 'var(--info, #3b82f6)', flexShrink: 0 }} />}
          <span className="toast-message">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="toast-close"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
