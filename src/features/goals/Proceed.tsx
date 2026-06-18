import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../../state/store';
import { EmptyState } from '../../components/EmptyState';
import './goals.css';

export function Proceed() {
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
          actionLabel="Back to goals"
          onAction={() => nav('/goals')}
        />
      </main>
    );
  }

  const hasProtocol = goal.recommendedProtocolId != null;

  return (
    <main className="goal-screen">
      <h1 className="goal-title">How would you like to proceed?</h1>
      <p className="goal-sub">For {goal.name}.</p>
      {hasProtocol ? (
        <div className="goal-list">
          <button
            className="goal-card"
            onClick={() => nav(`/protocol/${goal.recommendedProtocolId}`)}
          >
            <span>
              <p className="goal-card-name">See Recommended Protocol</p>
              <p className="goal-card-blurb">A vetted starting stack for this goal.</p>
            </span>
          </button>
          <button className="goal-card" onClick={() => nav('/explore')}>
            <span>
              <p className="goal-card-name">Pick a Specific Peptide</p>
              <p className="goal-card-blurb">Browse the catalog and build your own.</p>
            </span>
          </button>
        </div>
      ) : (
        <EmptyState
          icon="🛠️"
          title="Protocols coming soon"
          body={`We're still curating a recommended protocol for ${goal.name}. You can pick a specific peptide in the meantime.`}
          actionLabel="Pick a Specific Peptide"
          onAction={() => nav('/explore')}
        />
      )}
    </main>
  );
}
