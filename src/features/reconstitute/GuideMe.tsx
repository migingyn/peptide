import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppState } from '../../state/store';
import { EmptyState } from '../../components/EmptyState';
import './guide.css';

const STEPS = [
  {
    art: '🧴',
    title: 'Sanitize',
    body: 'Wipe the vial stopper and your hands with an alcohol swab. Let it dry.',
  },
  {
    art: '🌬️',
    title: 'Equalize Pressure',
    body: 'Pull air into the syringe equal to your water volume, then inject that air into the bacteriostatic water vial.',
  },
  {
    art: '💧',
    title: 'Draw & Inject Water',
    body: 'Draw your measured bacteriostatic water, then slowly inject it down the inner wall of the peptide vial.',
  },
  {
    art: '🌀',
    title: 'Dissolve',
    body: 'Gently swirl — never shake — until the powder fully dissolves into a clear solution.',
  },
  {
    art: '💉',
    title: 'Draw Dose',
    body: 'Invert the vial and draw your dose to the marked units. Tap out bubbles. You’re ready.',
  },
];

export function GuideMe() {
  const nav = useNavigate();
  const { peptideId } = useParams();
  const [params] = useSearchParams();
  const { peptides, vials } = useAppState();
  const [i, setI] = useState(0);

  const peptide = peptides.find((p) => p.id === peptideId);
  const vial = vials.find((v) => v.peptideId === peptideId);

  if (!peptide) {
    return (
      <main className="gm-screen">
        <EmptyState
          icon="🧪"
          title="Peptide not found"
          actionLabel="Back to kit"
          onAction={() => nav('/reconstitute')}
        />
      </main>
    );
  }

  const vialMg = vial?.vialMg ?? Number(params.get('vialMg'));
  const waterMl = vial?.waterMl ?? Number(params.get('waterMl'));
  const doseMg = vial?.doseMg ?? Number(params.get('doseMg'));
  const drawUnits = vial?.drawUnits ?? Number(params.get('units'));
  const hasSummary = [vialMg, waterMl, doseMg, drawUnits].every((n) => Number.isFinite(n) && n > 0);

  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <main className="gm-screen">
      <div className="gm-header">
        <strong>{peptide.name}</strong>
        {hasSummary ? (
          <>
            {' '}
            — dose {doseMg} mg · vial {vialMg} mg · water {waterMl} mL ·{' '}
            <strong>{drawUnits} units</strong>
          </>
        ) : (
          <> — reconstitution guide</>
        )}
      </div>

      <div className="gm-art" aria-hidden="true">
        {step.art}
      </div>
      <h1 className="gm-step-title">{`${i + 1}. ${step.title}`}</h1>
      <p className="gm-step-body">{step.body}</p>

      <div
        className="gm-indicator"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={i + 1}
        aria-label={`Step ${i + 1} of ${STEPS.length}`}
      >
        {STEPS.map((s, idx) => (
          <span key={s.title} className="gm-pip" data-active={idx === i} />
        ))}
      </div>

      <div className="gm-nav">
        <button
          className="gm-btn gm-btn-prev"
          onClick={() => setI((n) => n - 1)}
          disabled={i === 0}
        >
          Prev
        </button>
        {last ? (
          <button className="gm-btn gm-btn-next" onClick={() => nav('/reconstitute')}>
            Done
          </button>
        ) : (
          <button className="gm-btn gm-btn-next" onClick={() => setI((n) => n + 1)}>
            Next
          </button>
        )}
      </div>
    </main>
  );
}
