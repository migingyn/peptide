import { useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Segmented } from '../../components/Segmented';
import { ProtocolsTab } from './ProtocolsTab';
import { PeptidesTab } from './PeptidesTab';

const page: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--s-4)',
  padding: 'var(--s-5)',
  maxWidth: 'var(--app-max)',
  margin: '0 auto',
};

const heading: CSSProperties = {
  margin: 0,
  fontSize: 'var(--t-h1)',
  fontWeight: 700,
  color: 'var(--text-0)',
};

const SUBTABS = [
  { value: 'peptides', label: 'Peptides' },
  { value: 'protocols', label: 'Protocols' },
];

type Tab = 'peptides' | 'protocols';

export function ExploreView() {
  const [searchParams] = useSearchParams();
  const initial: Tab = searchParams.get('tab') === 'protocols' ? 'protocols' : 'peptides';
  const [tab, setTab] = useState<Tab>(initial);

  return (
    <div style={page}>
      <h1 style={heading}>Explore</h1>
      <Segmented
        options={SUBTABS}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        ariaLabel="Explore sub-tabs"
      />
      {tab === 'peptides' ? <PeptidesTab /> : <ProtocolsTab />}
    </div>
  );
}
