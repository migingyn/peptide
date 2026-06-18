interface ProgressRingProps {
  value: number; // current (e.g. week 1)
  max: number; // total (e.g. 8)
  label: string; // e.g. "Week 1/8"
  size?: number; // px
}

export function ProgressRing({ value, max, label, size = 120 }: ProgressRingProps) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const offset = circumference * (1 - pct);
  return (
    <div role="img" aria-label={label} style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--amber)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-0)',
          fontSize: 'var(--t-h2)',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}
