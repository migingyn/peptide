import { useNavigate } from 'react-router-dom';
import { useAppState, useDispatch } from '../../state/store';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { roundUnits } from '../../lib/reconstitution';
import styles from './KitView.module.css';

function peptideName(peptides: { id: string; name: string }[], peptideId: string): string {
  return peptides.find((p) => p.id === peptideId)?.name ?? peptideId;
}

// Stored vial values are raw; round for display so arbitrary inputs don't dump long floats.
function fmt(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function KitView() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { vials, peptides } = useAppState();

  const addPeptideId = peptides[0]?.id ?? 'tesamorelin';

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Kit</h1>
          <p className={styles.count}>
            {vials.length === 0
              ? '0 vials reconstituted'
              : `${vials.length} vial${vials.length === 1 ? '' : 's'} in your kit`}
          </p>
        </div>
        <button
          type="button"
          className={styles.add}
          aria-label="Add a vial"
          onClick={() => navigate(`/reconstitute/calc/${addPeptideId}`)}
        >
          +
        </button>
      </header>

      {vials.length === 0 ? (
        <Card className={styles.empty}>
          <p className={styles.emptyTitle}>0 vials reconstituted</p>
          <p className={styles.emptyBody}>
            Reconstitute your first vial to start tracking your kit.
          </p>
          <Button variant="primary" onClick={() => navigate(`/reconstitute/calc/${addPeptideId}`)}>
            Reconstitute a vial
          </Button>
        </Card>
      ) : (
        <ul className={styles.list}>
          {vials.map((vial) => (
            <li key={vial.id}>
              <Card className={styles.vialCard}>
                <div className={styles.vialMain}>
                  <span className={styles.vialName}>{peptideName(peptides, vial.peptideId)}</span>
                  <span className={styles.vialSpec}>
                    {fmt(vial.concentrationMgPerMl)} mg/mL · {roundUnits(vial.drawUnits)} u draw ·{' '}
                    {vial.doseMg} mg
                  </span>
                  <span className={styles.vialMeta}>
                    Reconstituted {formatDate(vial.reconstitutedAt)}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={`Remove ${peptideName(peptides, vial.peptideId)} vial`}
                  onClick={() => dispatch({ type: 'REMOVE_VIAL', payload: { id: vial.id } })}
                >
                  ✕
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
