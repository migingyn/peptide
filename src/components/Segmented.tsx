import type { CSSProperties } from 'react';

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

const wrap: CSSProperties = {
  display: 'flex',
  gap: 'var(--s-1)',
  padding: 'var(--s-1)',
  background: 'var(--bg-1)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-pill)',
};

function segStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    padding: 'var(--s-2) var(--s-4)',
    borderRadius: 'var(--r-pill)',
    border: 'none',
    cursor: 'pointer',
    fontSize: 'var(--t-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: active ? 600 : 500,
    color: active ? 'var(--bg-0)' : 'var(--text-1)',
    background: active ? 'var(--amber)' : 'transparent',
  };
}

export function Segmented({ options, value, onChange, ariaLabel }: SegmentedProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} style={wrap}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-pressed={active}
            style={segStyle(active)}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
