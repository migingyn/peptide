import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState, useDispatch } from '../../state/store';
import { EmptyState } from '../../components/EmptyState';
import './protocol.css';

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function StartProtocol() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { protocolId } = useParams();
  const { protocols } = useAppState();
  const p = protocols.find((x) => x.id === protocolId);
  const [startDate, setStartDate] = useState(todayISODate());

  if (!p) {
    return (
      <main className="pd-screen">
        <EmptyState
          icon="📋"
          title="Protocol not found"
          actionLabel="Back to goals"
          onAction={() => nav('/goals')}
        />
      </main>
    );
  }

  function start() {
    if (!p) return;
    dispatch({ type: 'START_PROTOCOL', payload: { protocolId: p.id, startDate } });
    nav('/reconstitute', { replace: true });
  }

  return (
    <main className="pd-screen">
      <h1 className="pd-name" style={{ fontSize: 'var(--t-h1)' }}>
        Pick a start date
      </h1>
      <p className="pd-glance" style={{ color: 'var(--text-1)' }}>
        {p.name} — {p.weeks} weeks. We&apos;ll build your schedule from this date.
      </p>
      <div className="pd-field">
        <label htmlFor="start-date" className="pd-label">
          Start date
        </label>
        <input
          id="start-date"
          className="pd-input"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div className="pd-bar">
        <button className="pd-cta" onClick={start} disabled={!startDate}>
          Start &amp; mix first dose
        </button>
      </div>
    </main>
  );
}
