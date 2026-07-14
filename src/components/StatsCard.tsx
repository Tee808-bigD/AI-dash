import { useState, useEffect, useRef, type ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  trend?: string;
}

function AnimatedValue({ value }: { value: string | number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const prevValueRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value as unknown as number);
      return;
    }

    if (prevValueRef.current !== null && prevValueRef.current !== value) {
      hasAnimated.current = false;
    }
    prevValueRef.current = value;

    if (hasAnimated.current) {
      setDisplayValue(value);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const target = value as number;
          const duration = 1000;
          const steps = 30;
          const increment = target / steps;
          let current = 0;

          timerRef.current = setInterval(() => {
            current += increment;
            if (current >= target) {
              setDisplayValue(target);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            } else {
              setDisplayValue(Math.round(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      observer.disconnect();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value]);

  return <div ref={ref}>{typeof value === 'number' ? displayValue : value}</div>;
}

export default function StatsCard({ label, value, icon, color, trend }: StatsCardProps) {
  return (
    <div
      className="stats-card fade-in-up"
      style={{ '--accent-color': color } as React.CSSProperties}
    >
      <div className="stats-card-header">
        <span className="stats-icon" style={{ background: `${color}15`, color }}>{icon}</span>
        {trend && <span className="stats-trend">{trend}</span>}
      </div>
      <div className="stats-value">
        <AnimatedValue value={value} />
      </div>
      <div className="stats-label">{label}</div>
    </div>
  );
}
