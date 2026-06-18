import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../../state/store';
import { EmptyState } from '../../components/EmptyState';
import './protocol.css';

export function ProtocolDetail() {
  const nav = useNavigate();
  const { protocolId } = useParams();
  const { protocols } = useAppState();
  const p = protocols.find((x) => x.id === protocolId);

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

  const costStr = p.costPerWeek != null ? `~$${p.costPerWeek}/wk` : 'cost varies';
  const glance = `${p.level} · ${p.weeks} weeks · ${costStr} · ${p.injectionsPerWeek}× weekly`;

  return (
    <main className="pd-screen">
      <h1 className="pd-name">{p.name}</h1>

      <section className="pd-section" aria-label="At a Glance">
        <h2 className="pd-h">At a Glance</h2>
        <p className="pd-glance">{glance}</p>
      </section>

      <section className="pd-section" aria-label="Why This Stack">
        <h2 className="pd-h">Why This Stack</h2>
        {p.whyThisStack.map((w) => (
          <div key={w.peptideId} className="pd-row">
            <p className="pd-row-title">{w.nickname}</p>
            <p className="pd-row-text">{w.reason}</p>
          </div>
        ))}
      </section>

      <section className="pd-section" aria-label="What to Expect">
        <h2 className="pd-h">What to Expect</h2>
        {p.whatToExpect.map((e) => (
          <div key={e.range} className="pd-row">
            <p className="pd-row-title">{e.range}</p>
            <p className="pd-row-text">{e.text}</p>
          </div>
        ))}
      </section>

      <section className="pd-section" aria-label="Important to Know">
        <h2 className="pd-h">Important to Know</h2>
        <ul style={{ paddingLeft: 'var(--s-4)', margin: 0, listStyle: 'disc' }}>
          {p.importantToKnow.map((item) => (
            <li key={item} className="pd-li">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="pd-section" aria-label="FAQ">
        <h2 className="pd-h">FAQ</h2>
        {p.faq.map((f) => (
          <details key={f.q} className="pd-row">
            <summary className="pd-row-title" style={{ cursor: 'pointer' }}>
              {f.q}
            </summary>
            <p className="pd-row-text" style={{ marginTop: 'var(--s-2)' }}>
              {f.a}
            </p>
          </details>
        ))}
      </section>

      <div className="pd-bar">
        <button className="pd-cta" onClick={() => nav(`/protocol/${p.id}/start`)}>
          Start Protocol
        </button>
      </div>
    </main>
  );
}
