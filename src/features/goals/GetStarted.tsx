import { useNavigate } from 'react-router-dom';
import './goals.css';

const ENTRIES = [
  { label: 'Match my goal', to: '/goals', icon: '🎯' },
  { label: 'Choose a peptide', to: '/explore?tab=peptides', icon: '🧪' },
  { label: 'Browse protocols', to: '/explore?tab=protocols', icon: '📋' },
  { label: 'Add current stack', to: '/reconstitute', icon: '➕' },
];

export function GetStarted() {
  const nav = useNavigate();
  return (
    <main className="goal-screen">
      <h1 className="goal-title">How do you want to get started?</h1>
      <p className="goal-sub">Pick a path — you can change direction anytime.</p>
      <div className="goal-list">
        {ENTRIES.map((e) => (
          <button key={e.label} className="goal-card" onClick={() => nav(e.to)}>
            <span className="goal-card-icon" aria-hidden="true">
              {e.icon}
            </span>
            <span className="goal-card-name" style={{ fontSize: 'var(--t-body)' }}>
              {e.label}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
