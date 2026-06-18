import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../state/store';
import './goals.css';

export function GoalGrid() {
  const nav = useNavigate();
  const { goals } = useAppState();
  return (
    <main className="goal-screen">
      <h1 className="goal-title">What&apos;s your goal?</h1>
      <p className="goal-sub">Choose a focus and we&apos;ll point you to a starting protocol.</p>
      <div className="goal-grid">
        {goals.map((g) => (
          <button
            key={g.id}
            className="goal-card"
            onClick={() => nav(`/goal/${g.id}`)}
            aria-label={`${g.name}: ${g.tagline}`}
          >
            <p className="goal-card-name">{g.name}</p>
            <p className="goal-card-tag">{g.tagline}</p>
          </button>
        ))}
      </div>
    </main>
  );
}
