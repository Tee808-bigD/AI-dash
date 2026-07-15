import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            textAlign: 'center',
            minHeight: '40vh',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(231, 76, 60, 0.1)',
              color: '#e74c3c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <AlertTriangle size={32} />
          </div>
          <h2
            style={{
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
              fontSize: '1.3rem',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              maxWidth: 400,
              marginBottom: '1.5rem',
              lineHeight: 1.6,
            }}
          >
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            className="btn btn-primary"
            onClick={this.handleRetry}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          {import.meta.env.MODE === 'development' && this.state.error && (
            <pre
              style={{
                marginTop: '2rem',
                padding: '1rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                fontSize: '0.78rem',
                color: '#e74c3c',
                maxWidth: '100%',
                overflow: 'auto',
                textAlign: 'left',
                border: '1px solid rgba(231, 76, 60, 0.2)',
              }}
            >
              {this.state.error.message}
              {this.state.error.stack && `\n\n${this.state.error.stack}`}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
