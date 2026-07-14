interface LoadingSpinnerProps {
  text?: string;
  size?: number;
  fullPage?: boolean;
}

export default function LoadingSpinner({ text = 'Loading...', size = 44, fullPage = false }: LoadingSpinnerProps) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: fullPage ? '6rem 2rem' : '3rem',
        gap: '1.2rem',
      }}
    >
      {/* Double-ring spinner */}
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Outer ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `3px solid var(--border)`,
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: 'absolute',
            inset: '6px',
            border: `2px solid transparent`,
            borderTopColor: 'var(--accent-light)',
            borderRadius: '50%',
            animation: 'spin 1.2s linear infinite reverse',
          }}
        />
        {/* Center dot */}
        <div
          style={{
            position: 'absolute',
            inset: '50%',
            transform: 'translate(-50%, -50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 8px var(--accent)',
          }}
        />
      </div>

      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.88rem',
          fontWeight: 500,
          display: 'flex',
          gap: '0.3rem',
          animation: 'fadeIn 0.5s ease-out',
        }}
      >
        <span>{text}</span>
        <span style={{ animation: 'typing 1.4s infinite', animationDelay: '0s' }}>.</span>
        <span style={{ animation: 'typing 1.4s infinite', animationDelay: '0.2s' }}>.</span>
        <span style={{ animation: 'typing 1.4s infinite', animationDelay: '0.4s' }}>.</span>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
