import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../state/store';
import { filterPeptides } from '../../lib/search';
import { EmptyState } from '../../components/EmptyState';

const controls: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' };

const searchInput: CSSProperties = {
  width: '100%',
  padding: 'var(--s-3) var(--s-4)',
  background: 'var(--bg-1)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  color: 'var(--text-0)',
  fontSize: 'var(--t-body)',
  fontFamily: 'var(--font-ui)',
};

const filterRow: CSSProperties = {
  display: 'flex',
  gap: 'var(--s-2)',
  overflowX: 'auto',
  paddingBottom: 'var(--s-1)',
};

function chip(active: boolean): CSSProperties {
  return {
    flex: '0 0 auto',
    padding: 'var(--s-2) var(--s-4)',
    borderRadius: 'var(--r-pill)',
    border: `1px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
    background: active ? 'var(--amber)' : 'transparent',
    color: active ? 'var(--bg-0)' : 'var(--text-1)',
    fontSize: 'var(--t-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
  };
}

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gridAutoRows: '1fr', // every row the same height -> uniform cards
  gap: 'var(--s-3)',
  marginTop: 'var(--s-4)',
};

const cell: CSSProperties = {
  width: '100%',
  height: '100%', // fill the grid cell so all bubbles match
  minHeight: '88px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  textAlign: 'left',
  padding: 'var(--s-4)',
  background: 'var(--bg-1)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  cursor: 'pointer',
  color: 'var(--text-0)',
  fontFamily: 'var(--font-ui)',
};

const cellName: CSSProperties = { margin: 0, fontSize: 'var(--t-body)', fontWeight: 700 };
const cellCat: CSSProperties = {
  marginTop: 'var(--s-1)',
  color: 'var(--text-2)',
  fontSize: 'var(--t-xs)',
};

const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
};

export function PeptidesTab() {
  const { peptides } = useAppState();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(peptides.map((p) => p.category))).sort(),
    [peptides],
  );

  const results = useMemo(
    () => filterPeptides(peptides, query, category),
    [peptides, query, category],
  );

  return (
    <div>
      <div style={controls}>
        <label htmlFor="peptide-search" style={srOnly}>
          Search peptides
        </label>
        <input
          id="peptide-search"
          type="search"
          inputMode="search"
          placeholder="Search peptides…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={searchInput}
        />

        <div style={filterRow} role="group" aria-label="Filter by category">
          <button
            type="button"
            aria-pressed={category === null}
            style={chip(category === null)}
            onClick={() => setCategory(null)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              style={chip(category === c)}
              onClick={() => setCategory(category === c ? null : c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState title="No peptides match" body="Try a different search or category." />
      ) : (
        <ul style={grid}>
          {results.map((p) => (
            <li key={p.id} style={{ listStyle: 'none', display: 'flex' }}>
              <button
                type="button"
                style={cell}
                onClick={() => navigate(`/explore/peptide/${p.id}`)}
              >
                <h3 style={cellName}>{p.name}</h3>
                <div style={cellCat}>{p.category}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
