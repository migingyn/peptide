import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../../state/store';
import { EmptyState } from '../../components/EmptyState';
import './goals.css';

export function GoalIntro() {
  const nav = useNavigate();
  const { goalId } = useParams();
  const { goals } = useAppState();
  const goal = goals.find((g) => g.id === goalId);

  if (!goal) {
    return (
      <main className="goal-screen">
        <EmptyState
          icon="🧭"
          title="Goal not found"
          body="That goal isn't available."
          actionLabel="Back to goals"
          onAction={() => nav('/goals')}
        />
      </main>
    );
  }

  return (
    <main className="goal-screen">
      <div className="goal-spacer" />
      <span className="goal-card-tag" style={{ fontSize: 'var(--t-sm)' }}>
        {goal.name}
      </span>
      <h1 className="goal-title" style={{ fontSize: 'var(--t-display)' }}>
        {goal.tagline}
      </h1>
      <p className="goal-sub">{goal.blurb}</p>
      <div className="goal-spacer" />
      <button className="goal-cta" onClick={() => nav(`/goal/${goal.id}/proceed`)}>
        Continue
      </button>
    </main>
  );
}
