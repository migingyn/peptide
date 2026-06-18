# Explore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `2026-06-17-peps-00-foundations.md` first. Prerequisite: Sprint 0-3 complete (needs ProtocolDetail + CalculatorView routes).

**Goal:** Add an Explore bottom tab with Protocols and Peptides sub-tabs — browse curated protocol cards and a searchable/filterable peptide catalog, routing into ProtocolDetail and a new PeptideDetail.

**Architecture:** A new `features/explore/` route (`/explore`) renders a `Segmented` control switching between `ProtocolsTab` (curated cards from `protocols.seed`) and `PeptidesTab` (catalog grid from `peptides.seed` with text search + category filters). All catalog filtering is delegated to a single pure helper `lib/search.ts` (`filterPeptides`), unit-tested under strict TDD. A new `PeptideDetail` route (`/explore/peptide/:peptideId`) reads the peptide from store state and links to the existing CalculatorView and ProtocolDetail routes — no new state, no new actions.

**Tech Stack:** React 18 + Vite + TypeScript, React Router, React Context + `useReducer` (read-only here via `useAppState`), Vitest + React Testing Library. Pure logic in `lib/`; thin views.

---

## Task 1 — Pure search helper (`lib/search.ts`) — STRICT TDD

**Files:**
- Create: `src/lib/search.ts`
- Test: `src/lib/search.test.ts`

- [ ] **Write the failing test file.** Create `src/lib/search.test.ts` with the full code below. It imports `filterPeptides` (not yet implemented) and a 10-peptide fixture mirroring Foundations §7.

```ts
import { describe, it, expect } from 'vitest';
import type { Peptide } from '../state/types';
import { filterPeptides } from './search';

const FIXTURE: Peptide[] = [
  { id: 'tesamorelin', name: 'Tesamorelin', nickname: 'Night Builder', category: 'Growth', blurb: 'GHRH analog; supports lean mass and fat loss.' },
  { id: 'ipamorelin', name: 'Ipamorelin', nickname: 'Morning Pulse', category: 'Growth', blurb: 'Selective GH secretagogue; gentle GH pulse.' },
  { id: 'bpc-157', name: 'BPC-157', category: 'Recovery', blurb: 'Body-protection compound; tissue repair.' },
  { id: 'cjc-1295', name: 'CJC-1295 (no DAC)', category: 'Growth', blurb: 'GHRH analog; pairs with a GHRP.' },
  { id: 'epitalon', name: 'Epitalon', category: 'Longevity', blurb: 'Telomerase-related peptide.' },
  { id: 'ghk-cu', name: 'GHK-Cu', category: 'Beauty', blurb: 'Copper peptide; skin and collagen.' },
  { id: 'kpv', name: 'KPV', category: 'Recovery', blurb: 'Anti-inflammatory tripeptide.' },
  { id: 'melanotan-2', name: 'Melanotan II', category: 'Beauty', blurb: 'Melanocortin agonist; tanning.' },
  { id: 'mots-c', name: 'MOTS-c', category: 'Performance', blurb: 'Mitochondrial peptide; metabolism.' },
  { id: '5-amino-1mq', name: '5-Amino-1MQ', category: 'Performance', blurb: 'NNMT inhibitor; metabolic support.' },
];

const ids = (ps: Peptide[]) => ps.map((p) => p.id).sort();

describe('filterPeptides', () => {
  it('returns all peptides when query is empty and category is null', () => {
    expect(filterPeptides(FIXTURE, '', null)).toHaveLength(10);
  });

  it('trims whitespace-only queries to "no query"', () => {
    expect(filterPeptides(FIXTURE, '   ', null)).toHaveLength(10);
  });

  it('matches "morning" against Ipamorelin via nickname (case-insensitive)', () => {
    expect(ids(filterPeptides(FIXTURE, 'MORNING', null))).toEqual(['ipamorelin']);
  });

  it('matches "growth" via category text for Growth-category peptides', () => {
    // "growth" appears in the Growth category for tesamorelin, ipamorelin, cjc-1295
    expect(ids(filterPeptides(FIXTURE, 'growth', null))).toEqual(['cjc-1295', 'ipamorelin', 'tesamorelin']);
  });

  it('matches name substrings case-insensitively', () => {
    expect(ids(filterPeptides(FIXTURE, 'tesa', null))).toEqual(['tesamorelin']);
  });

  it('matches blurb substrings (e.g. "collagen" -> GHK-Cu)', () => {
    expect(ids(filterPeptides(FIXTURE, 'collagen', null))).toEqual(['ghk-cu']);
  });

  it('filters by exact category when provided', () => {
    expect(ids(filterPeptides(FIXTURE, '', 'Recovery'))).toEqual(['bpc-157', 'kpv']);
  });

  it('category match is exact, not substring', () => {
    expect(filterPeptides(FIXTURE, '', 'Grow')).toHaveLength(0);
  });

  it('combines query AND category (both must match)', () => {
    // category Growth + query "pulse" -> only ipamorelin (blurb "gentle GH pulse")
    expect(ids(filterPeptides(FIXTURE, 'pulse', 'Growth'))).toEqual(['ipamorelin']);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterPeptides(FIXTURE, 'zzzznope', null)).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const copy = [...FIXTURE];
    filterPeptides(FIXTURE, 'growth', 'Growth');
    expect(FIXTURE).toEqual(copy);
  });
});
```

- [ ] **Run the test and expect FAIL.** Run `npx vitest run src/lib/search.test.ts`. Confirm it fails because `./search` / `filterPeptides` does not exist yet (module-resolution error). Do NOT proceed until you have seen red.

- [ ] **Write the minimal implementation.** Create `src/lib/search.ts` with the full code below. Case-insensitive substring match across `name + nickname + category + blurb`; exact category match when `category` is non-null; empty/whitespace query means "no query filter".

```ts
import type { Peptide } from '../state/types';

/**
 * Pure, deterministic peptide filter.
 * - `query`: case-insensitive substring; matched against name, nickname, category, and blurb.
 *   Empty or whitespace-only query applies no text filter.
 * - `category`: when non-null, requires an EXACT category match.
 * Returns a new array; never mutates `peptides`.
 */
export function filterPeptides(
  peptides: Peptide[],
  query: string,
  category: string | null,
): Peptide[] {
  const q = query.trim().toLowerCase();

  return peptides.filter((p) => {
    if (category !== null && p.category !== category) return false;
    if (q === '') return true;
    const haystack = [p.name, p.nickname ?? '', p.category, p.blurb]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
```

- [ ] **Run the test and expect PASS.** Run `npx vitest run src/lib/search.test.ts`. All cases green.

- [ ] **Commit.** `git add src/lib/search.ts src/lib/search.test.ts && git commit -m "feat: add pure filterPeptides search helper (TDD)"`

---

## Task 2 — `Segmented` control component

**Files:**
- Create: `src/components/Segmented.tsx`
- Test: `src/components/Segmented.test.tsx`

- [ ] **Write the component.** Create `src/components/Segmented.tsx` with the full code below. A two-or-more option pill switcher; options are real buttons with `aria-pressed`. Token-based classNames inline via `style` (no CSS module required; matches existing component style).

```tsx
import type { CSSProperties } from 'react';

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

const wrap: CSSProperties = {
  display: 'flex',
  gap: 'var(--s-1)',
  padding: 'var(--s-1)',
  background: 'var(--bg-1)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-pill)',
};

function segStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    padding: 'var(--s-2) var(--s-4)',
    borderRadius: 'var(--r-pill)',
    border: 'none',
    cursor: 'pointer',
    fontSize: 'var(--t-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: active ? 600 : 500,
    color: active ? 'var(--bg-0)' : 'var(--text-1)',
    background: active ? 'var(--amber)' : 'transparent',
  };
}

export function Segmented({ options, value, onChange, ariaLabel }: SegmentedProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} style={wrap}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-pressed={active}
            style={segStyle(active)}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Write the component test.** Create `src/components/Segmented.test.tsx` with the full code below.

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Segmented } from './Segmented';

const OPTS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

describe('Segmented', () => {
  it('marks the active option with aria-pressed=true', () => {
    render(<Segmented options={OPTS} value="a" onChange={() => {}} ariaLabel="Pick" />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with the clicked value', async () => {
    const onChange = vi.fn();
    render(<Segmented options={OPTS} value="a" onChange={onChange} ariaLabel="Pick" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
```

- [ ] **Run and expect PASS.** Run `npx vitest run src/components/Segmented.test.tsx`.

- [ ] **Commit.** `git add src/components/Segmented.tsx src/components/Segmented.test.tsx && git commit -m "feat: add Segmented control component"`

---

## Task 3 — `ProtocolsTab` (curated protocol cards)

**Files:**
- Create: `src/features/explore/ProtocolsTab.tsx`
- Test: `src/features/explore/ProtocolsTab.test.tsx`

- [ ] **Write the ProtocolsTab.** Create `src/features/explore/ProtocolsTab.tsx` with the full code below. Reads `protocols` from `useAppState`; renders a card per protocol with name, summary, and a level/weeks meta line. Each card is a button navigating to the existing `/protocol/:protocolId` route (Sprint 3). Empty state if no protocols.

```tsx
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
const summaryStyle: CSSProperties = { margin: 'var(--s-2) 0 0', color: 'var(--text-1)', fontSize: 'var(--t-body)' };
const metaStyle: CSSProperties = { marginTop: 'var(--s-3)', color: 'var(--text-2)', fontSize: 'var(--t-sm)' };

export function ProtocolsTab() {
  const { protocols } = useAppState();
  const navigate = useNavigate();

  if (protocols.length === 0) {
    return <EmptyState title="No protocols yet" body="Curated protocols will appear here." />;
  }

  return (
    <div style={list}>
      {protocols.map((p) => (
        <button
          key={p.id}
          type="button"
          style={card}
          onClick={() => navigate(`/protocol/${p.id}`)}
        >
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
```

- [ ] **Write the ProtocolsTab test.** Create `src/features/explore/ProtocolsTab.test.tsx` with the full code below. It wraps the component with a real `MemoryRouter` and a minimal store double. (Use the project's existing test helper if one exists; otherwise this self-contained mock works because the component only reads `protocols`.)

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Protocol } from '../../state/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const PROTOCOL: Protocol = {
  id: 'muscle-growth-tesa-ipa',
  goalId: 'muscle-growth',
  name: 'Muscle Growth Stack',
  weeks: 8,
  injectionsPerWeek: 5,
  level: 'Beginner',
  costPerWeek: 66,
  summary: 'Beginner · 8 weeks · ~$66/wk · 5× weekly',
  whyThisStack: [],
  whatToExpect: [],
  importantToKnow: [],
  faq: [],
  items: [],
};

vi.mock('../../state/store', () => ({
  useAppState: () => ({ protocols: [PROTOCOL] }),
}));

// eslint-disable-next-line import/first
import { ProtocolsTab } from './ProtocolsTab';

describe('ProtocolsTab', () => {
  it('renders a card per protocol with name, summary, and meta', () => {
    render(
      <MemoryRouter>
        <ProtocolsTab />
      </MemoryRouter>,
    );
    expect(screen.getByText('Muscle Growth Stack')).toBeInTheDocument();
    expect(screen.getByText('Beginner · 8 weeks · ~$66/wk · 5× weekly')).toBeInTheDocument();
    expect(screen.getByText('Beginner · 8 weeks')).toBeInTheDocument();
  });

  it('navigates to protocol detail when a card is clicked', async () => {
    render(
      <MemoryRouter>
        <ProtocolsTab />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Muscle Growth Stack/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/protocol/muscle-growth-tesa-ipa');
  });
});
```

- [ ] **Run and expect PASS.** Run `npx vitest run src/features/explore/ProtocolsTab.test.tsx`.

- [ ] **Commit.** `git add src/features/explore/ProtocolsTab.tsx src/features/explore/ProtocolsTab.test.tsx && git commit -m "feat: add Explore ProtocolsTab curated cards"`

---

## Task 4 — `PeptidesTab` (catalog grid with search + category filters)

**Files:**
- Create: `src/features/explore/PeptidesTab.tsx`
- Test: `src/features/explore/PeptidesTab.test.tsx`

- [ ] **Write the PeptidesTab.** Create `src/features/explore/PeptidesTab.tsx` with the full code below. Local state for `query` and `category`. Derives categories from the seeded peptides. Delegates ALL filtering to `filterPeptides`. Search input is labeled, `type="search"`, `inputMode="search"`. Category filters are real buttons with `aria-pressed` (an "All" button sets `category = null`). Grid cells are buttons navigating to `/explore/peptide/:peptideId`. Empty state "No peptides match" when filtered list is empty.

```tsx
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
  gap: 'var(--s-3)',
  marginTop: 'var(--s-4)',
};

const cell: CSSProperties = {
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
const cellCat: CSSProperties = { marginTop: 'var(--s-1)', color: 'var(--text-2)', fontSize: 'var(--t-xs)' };

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
        <label htmlFor="peptide-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
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
        <div style={grid} role="list">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              role="listitem"
              style={cell}
              onClick={() => navigate(`/explore/peptide/${p.id}`)}
            >
              <h3 style={cellName}>{p.name}</h3>
              <div style={cellCat}>{p.category}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Write the PeptidesTab test.** Create `src/features/explore/PeptidesTab.test.tsx` with the full code below — covers default render, typing filters the grid, category filter, empty state, and navigation.

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Peptide } from '../../state/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const PEPTIDES: Peptide[] = [
  { id: 'tesamorelin', name: 'Tesamorelin', nickname: 'Night Builder', category: 'Growth', blurb: 'GHRH analog; supports lean mass and fat loss.' },
  { id: 'ipamorelin', name: 'Ipamorelin', nickname: 'Morning Pulse', category: 'Growth', blurb: 'Selective GH secretagogue; gentle GH pulse.' },
  { id: 'bpc-157', name: 'BPC-157', category: 'Recovery', blurb: 'Body-protection compound; tissue repair.' },
  { id: 'kpv', name: 'KPV', category: 'Recovery', blurb: 'Anti-inflammatory tripeptide.' },
];

vi.mock('../../state/store', () => ({
  useAppState: () => ({ peptides: PEPTIDES }),
}));

// eslint-disable-next-line import/first
import { PeptidesTab } from './PeptidesTab';

function renderTab() {
  return render(
    <MemoryRouter>
      <PeptidesTab />
    </MemoryRouter>,
  );
}

describe('PeptidesTab', () => {
  it('renders all peptides by default', () => {
    renderTab();
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('filters the grid as the user types in search', async () => {
    renderTab();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search peptides' }), 'morning');
    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Ipamorelin');
  });

  it('filters by category and toggles aria-pressed', async () => {
    renderTab();
    const recovery = screen.getByRole('button', { name: 'Recovery' });
    await userEvent.click(recovery);
    expect(recovery).toHaveAttribute('aria-pressed', 'true');
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(2); // BPC-157 + KPV
  });

  it('shows the empty state when nothing matches', async () => {
    renderTab();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search peptides' }), 'zzznope');
    expect(screen.getByText('No peptides match')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('navigates to peptide detail when a cell is clicked', async () => {
    renderTab();
    await userEvent.click(screen.getByRole('listitem', { name: /Tesamorelin/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/explore/peptide/tesamorelin');
  });
});
```

- [ ] **Run and expect PASS.** Run `npx vitest run src/features/explore/PeptidesTab.test.tsx`.

- [ ] **Commit.** `git add src/features/explore/PeptidesTab.tsx src/features/explore/PeptidesTab.test.tsx && git commit -m "feat: add Explore PeptidesTab with search and category filters"`

---

## Task 5 — `PeptideDetail` view + route

**Files:**
- Create: `src/features/explore/PeptideDetail.tsx`
- Test: `src/features/explore/PeptideDetail.test.tsx`

- [ ] **Write the PeptideDetail.** Create `src/features/explore/PeptideDetail.tsx` with the full code below. Reads `peptideId` from the route, finds the peptide in store state, and shows name, nickname, category, blurb, plus a "Reconstitute this" CTA navigating to `/reconstitute/calc/:peptideId` (Sprint 1 CalculatorView). Handles unknown id with an empty state.

```tsx
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

const nameStyle: CSSProperties = { margin: 0, fontSize: 'var(--t-h1)', fontWeight: 700, color: 'var(--text-0)' };
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
const blurbStyle: CSSProperties = { margin: 0, color: 'var(--text-1)', fontSize: 'var(--t-body)', lineHeight: 1.5 };

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
```

- [ ] **Write the PeptideDetail test.** Create `src/features/explore/PeptideDetail.test.tsx` with the full code below.

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { Peptide } from '../../state/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const PEPTIDES: Peptide[] = [
  { id: 'tesamorelin', name: 'Tesamorelin', nickname: 'Night Builder', category: 'Growth', blurb: 'GHRH analog; supports lean mass and fat loss.' },
];

vi.mock('../../state/store', () => ({
  useAppState: () => ({ peptides: PEPTIDES }),
}));

// eslint-disable-next-line import/first
import { PeptideDetail } from './PeptideDetail';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/explore/peptide/:peptideId" element={<PeptideDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PeptideDetail', () => {
  it('shows name, nickname, category, and blurb', () => {
    renderAt('/explore/peptide/tesamorelin');
    expect(screen.getByRole('heading', { name: 'Tesamorelin' })).toBeInTheDocument();
    expect(screen.getByText('Night Builder')).toBeInTheDocument();
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText(/GHRH analog/)).toBeInTheDocument();
  });

  it('navigates to the calculator on "Reconstitute this"', async () => {
    renderAt('/explore/peptide/tesamorelin');
    await userEvent.click(screen.getByRole('button', { name: 'Reconstitute this' }));
    expect(mockNavigate).toHaveBeenCalledWith('/reconstitute/calc/tesamorelin');
  });

  it('shows an empty state for an unknown id', () => {
    renderAt('/explore/peptide/does-not-exist');
    expect(screen.getByText('Peptide not found')).toBeInTheDocument();
  });
});
```

- [ ] **Run and expect PASS.** Run `npx vitest run src/features/explore/PeptideDetail.test.tsx`.

- [ ] **Commit.** `git add src/features/explore/PeptideDetail.tsx src/features/explore/PeptideDetail.test.tsx && git commit -m "feat: add PeptideDetail view"`

---

## Task 6 — Explore screen (sub-tab switch) + routes

**Files:**
- Create: `src/features/explore/ExploreView.tsx`
- Test: `src/features/explore/ExploreView.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Write the ExploreView.** Create `src/features/explore/ExploreView.tsx` with the full code below. Holds the `Segmented` control and renders `ProtocolsTab` or `PeptidesTab`. Default sub-tab is Peptides (the catalog is the headline of this feature).

```tsx
import { useState, type CSSProperties } from 'react';
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

const heading: CSSProperties = { margin: 0, fontSize: 'var(--t-h1)', fontWeight: 700, color: 'var(--text-0)' };

const SUBTABS = [
  { value: 'peptides', label: 'Peptides' },
  { value: 'protocols', label: 'Protocols' },
];

export function ExploreView() {
  const [tab, setTab] = useState<'peptides' | 'protocols'>('peptides');

  return (
    <div style={page}>
      <h1 style={heading}>Explore</h1>
      <Segmented
        options={SUBTABS}
        value={tab}
        onChange={(v) => setTab(v as 'peptides' | 'protocols')}
        ariaLabel="Explore sub-tabs"
      />
      {tab === 'peptides' ? <PeptidesTab /> : <ProtocolsTab />}
    </div>
  );
}
```

- [ ] **Write the ExploreView test.** Create `src/features/explore/ExploreView.test.tsx` with the full code below — verifies the Peptides tab shows by default and the Segmented control switches to Protocols.

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Peptide, Protocol } from '../../state/types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const PEPTIDES: Peptide[] = [
  { id: 'tesamorelin', name: 'Tesamorelin', nickname: 'Night Builder', category: 'Growth', blurb: 'GHRH analog.' },
];
const PROTOCOL: Protocol = {
  id: 'muscle-growth-tesa-ipa',
  goalId: 'muscle-growth',
  name: 'Muscle Growth Stack',
  weeks: 8,
  injectionsPerWeek: 5,
  level: 'Beginner',
  costPerWeek: 66,
  summary: 'Beginner · 8 weeks · ~$66/wk · 5× weekly',
  whyThisStack: [],
  whatToExpect: [],
  importantToKnow: [],
  faq: [],
  items: [],
};

vi.mock('../../state/store', () => ({
  useAppState: () => ({ peptides: PEPTIDES, protocols: [PROTOCOL] }),
}));

// eslint-disable-next-line import/first
import { ExploreView } from './ExploreView';

describe('ExploreView', () => {
  it('shows the Peptides catalog by default', () => {
    render(
      <MemoryRouter>
        <ExploreView />
      </MemoryRouter>,
    );
    expect(screen.getByRole('searchbox', { name: 'Search peptides' })).toBeInTheDocument();
  });

  it('switches to the Protocols tab via the Segmented control', async () => {
    render(
      <MemoryRouter>
        <ExploreView />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Protocols' }));
    expect(screen.getByText('Muscle Growth Stack')).toBeInTheDocument();
  });
});
```

- [ ] **Run and expect PASS.** Run `npx vitest run src/features/explore/ExploreView.test.tsx`.

- [ ] **Wire the routes in `App.tsx`.** Open `src/App.tsx`. Import the two new views:

```tsx
import { ExploreView } from './features/explore/ExploreView';
import { PeptideDetail } from './features/explore/PeptideDetail';
```

Then ensure the router has these two routes (replace any placeholder `/explore` element from Sprint 0 with `<ExploreView />`, and add the detail route):

```tsx
<Route path="/explore" element={<ExploreView />} />
<Route path="/explore/peptide/:peptideId" element={<PeptideDetail />} />
```

The Explore bottom tab (`/explore`) already exists from Sprint 0's TabBar; this task only swaps in the real screen and adds the detail route. Do not change the TabBar.

- [ ] **Run the full suite and expect PASS.** Run `npx vitest run` and confirm green, including all Explore tests.

- [ ] **Lint/format clean.** Run `npx eslint src/features/explore src/lib/search.ts src/components/Segmented.tsx && npx prettier --check "src/features/explore/**/*" "src/lib/search.ts" "src/components/Segmented.tsx"`. Fix any issues.

- [ ] **Commit.** `git add src/features/explore/ExploreView.tsx src/features/explore/ExploreView.test.tsx src/App.tsx && git commit -m "feat: wire Explore tab and peptide detail routes"`

---

## Explore DoD checklist

- [ ] `lib/search.ts` `filterPeptides(peptides, query, category)` is pure, deterministic, case-insensitive substring match across name+nickname+category+blurb, exact category match when provided — built strict-TDD with `src/lib/search.test.ts` green.
- [ ] Fixture tests pass: query "morning" → Ipamorelin (nickname); query "growth" → the Growth-category peptides; category 'Recovery' → BPC-157 + KPV.
- [ ] `/explore` renders the `ExploreView` with a `Segmented` control switching Peptides ⇄ Protocols (default Peptides).
- [ ] Protocols tab shows curated cards from `protocols.seed` (name, summary, level/weeks); tapping routes to `/protocol/:protocolId`.
- [ ] Peptides tab shows a catalog grid of all 10 peptides with a labeled `type="search"` / `inputMode="search"` box and category filter buttons (`aria-pressed`, "All" resets to null).
- [ ] Search filters by name/nickname/blurb/category (case-insensitive); category filter narrows by exact category; both combine.
- [ ] Empty state "No peptides match" shows when the filtered list is empty.
- [ ] Tapping a peptide routes to `/explore/peptide/:peptideId`; `PeptideDetail` shows name, nickname, category, blurb and a "Reconstitute this" CTA → `/reconstitute/calc/:peptideId`.
- [ ] a11y: search input labeled; category filters are real buttons with `aria-pressed`; grid cells are keyboard-focusable buttons; visible focus ring honored.
- [ ] `npx vitest run` green; ESLint + Prettier clean; no console errors; works offline (no network calls).
- [ ] Each step committed with a conventional message.
