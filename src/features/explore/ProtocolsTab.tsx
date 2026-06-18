import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../state/store';
import { EmptyState } from '../../components/EmptyState';

const list: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' };

const card: CSSProperties = {
  textAlign: 'left',
  width: '100%',
  padding: 'var(--s-5)',
  background: 'var(--bg-1)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  boxShadow: 'var(--shadow-card)',
  cursor: 'pointer',
  color: 'var(--text-0)',
  fontFamily: 'var(--font-ui)',
};

const titleStyle: CSSProperties = { margin: 0, fontSize: 'var(--t-h2)', fontWeight: 700 };
const summaryStyle: CSSProperties = {
  margin: 'var(--s-2) 0 0',
  color: 'var(--text-1)',
  fontSize: 'var(--t-body)',
};
const metaStyle: CSSProperties = {
  marginTop: 'var(--s-3)',
  color: 'var(--text-2)',
  fontSize: 'var(--t-sm)',
};

export function ProtocolsTab() {
  const { protocols } = useAppState();
  const navigate = useNavigate();

  if (protocols.length === 0) {
    return <EmptyState title="No protocols yet" body="Curated protocols will appear here." />;
  }

  return (
    <div style={list}>
      {protocols.map((p) => (
        <button key={p.id} type="button" style={card} onClick={() => navigate(`/protocol/${p.id}`)}>
          <h3 style={titleStyle}>{p.name}</h3>
          <p style={summaryStyle}>{p.summary}</p>
          <div style={metaStyle}>
            {p.level} · {p.weeks} weeks
          </div>
        </button>
      ))}
    </div>
  );
}
