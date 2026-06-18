import type { CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../../state/store';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';

const wrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--s-4)',
  padding: 'var(--s-5)',
};

const nameStyle: CSSProperties = {
  margin: 0,
  fontSize: 'var(--t-h1)',
  fontWeight: 700,
  color: 'var(--text-0)',
};
const nickStyle: CSSProperties = { margin: 0, color: 'var(--amber)', fontSize: 'var(--t-body)' };
const catStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: 'var(--s-1) var(--s-3)',
  borderRadius: 'var(--r-pill)',
  background: 'var(--glass)',
  border: '1px solid var(--border)',
  color: 'var(--text-1)',
  fontSize: 'var(--t-xs)',
};
const blurbStyle: CSSProperties = {
  margin: 0,
  color: 'var(--text-1)',
  fontSize: 'var(--t-body)',
  lineHeight: 1.5,
};

export function PeptideDetail() {
  const { peptideId } = useParams<{ peptideId: string }>();
  const { peptides } = useAppState();
  const navigate = useNavigate();
  const peptide = peptides.find((p) => p.id === peptideId);

  if (!peptide) {
    return <EmptyState title="Peptide not found" body="This peptide is not in the catalog." />;
  }

  return (
    <div style={wrap}>
      <h1 style={nameStyle}>{peptide.name}</h1>
      {peptide.nickname && <p style={nickStyle}>{peptide.nickname}</p>}
      <span style={catStyle}>{peptide.category}</span>
      <p style={blurbStyle}>{peptide.blurb}</p>
      <Button onClick={() => navigate(`/reconstitute/calc/${peptide.id}`)}>
        Reconstitute this
      </Button>
    </div>
  );
}
