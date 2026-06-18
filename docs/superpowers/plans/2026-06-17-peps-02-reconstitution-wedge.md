# Sprint 1 — Reconstitution Wedge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `2026-06-17-peps-00-foundations.md` first. Prerequisite: Sprint 0 (peps-01) complete.

**Goal:** Build the reconstitution wedge — a fully tested pure math core, a calculator UI that turns vial + water + dose into "draw to N units," and a persisted vial kit that survives reload offline.

**Architecture:** All reconstitution math lives in a pure, React-free module (`src/lib/reconstitution.ts`) with exhaustive TDD coverage. The `SAVE_VIAL`/`REMOVE_VIAL` reducer cases are pure and unit-tested; the store persists the `vials` slice to IndexedDB. `CalculatorView` and `KitView` are thin views that call the pure core, dispatch actions, and read state — no business logic in components.

**Tech Stack:** React 18 + Vite + TypeScript, React Router, React Context + `useReducer`, IndexedDB via `idb`, Vitest + React Testing Library. Conventional commits, commit after each green step.

---

## Task 1 — Reconstitution pure core (strict TDD)

This is the highest-risk math in the product. Write the failing test file in full **first**, watch it fail, then implement the minimal code to make it pass. Compute on raw numbers; round only for display.

**Files:**

- Create: `src/lib/reconstitution.ts`
- Test: `src/lib/reconstitution.test.ts`

### Steps

- [ ] **1.1 Write the failing test file (full).** Create `src/lib/reconstitution.test.ts` with the complete suite below — both canonical fixtures plus every edge case. Do NOT create `reconstitution.ts` yet.

```ts
// src/lib/reconstitution.test.ts
import { describe, it, expect } from 'vitest';
import { reconstitute, mcgToMg, roundUnits, ReconError, type ReconInput } from './reconstitution';

describe('reconstitute — canonical fixtures', () => {
  it('Tesamorelin: M=2, W=1, D=1 → 2 mg/mL, 0.5 mL, 50 units, 2 doses', () => {
    const out = reconstitute({ vialMg: 2, waterMl: 1, doseMg: 1 });
    expect(out.concentrationMgPerMl).toBe(2);
    expect(out.volumeMl).toBe(0.5);
    expect(out.drawUnits).toBe(50);
    expect(out.dosesPerVial).toBe(2);
    expect(out.warnings).toEqual([]);
  });

  it('Ipamorelin: M=2, W=2, D=0.1 → 1 mg/mL, 0.1 mL, 10 units, 20 doses', () => {
    const out = reconstitute({ vialMg: 2, waterMl: 2, doseMg: 0.1 });
    expect(out.concentrationMgPerMl).toBe(1);
    expect(out.volumeMl).toBeCloseTo(0.1, 10);
    expect(out.drawUnits).toBeCloseTo(10, 10);
    expect(out.dosesPerVial).toBe(20);
    expect(out.warnings).toEqual([]);
  });
});

describe('reconstitute — invalid input throws ReconError', () => {
  const bad: Array<[string, ReconInput]> = [
    ['waterMl <= 0 (zero)', { vialMg: 2, waterMl: 0, doseMg: 1 }],
    ['waterMl <= 0 (negative)', { vialMg: 2, waterMl: -1, doseMg: 1 }],
    ['vialMg <= 0 (zero)', { vialMg: 0, waterMl: 1, doseMg: 1 }],
    ['vialMg <= 0 (negative)', { vialMg: -2, waterMl: 1, doseMg: 1 }],
    ['doseMg <= 0 (zero)', { vialMg: 2, waterMl: 1, doseMg: 0 }],
    ['doseMg <= 0 (negative)', { vialMg: 2, waterMl: 1, doseMg: -1 }],
    ['NaN vialMg', { vialMg: NaN, waterMl: 1, doseMg: 1 }],
    ['NaN waterMl', { vialMg: 2, waterMl: NaN, doseMg: 1 }],
    ['NaN doseMg', { vialMg: 2, waterMl: 1, doseMg: NaN }],
    // non-numeric values arriving via untyped boundaries (parse failures)
    ['non-numeric vialMg', { vialMg: 'x' as unknown as number, waterMl: 1, doseMg: 1 }],
    ['Infinity waterMl', { vialMg: 2, waterMl: Infinity, doseMg: 1 }],
  ];

  it.each(bad)('throws ReconError for %s', (_label, input) => {
    expect(() => reconstitute(input)).toThrow(ReconError);
  });
});

describe('reconstitute — D > M produces a warning (valid math)', () => {
  it('warns "dose exceeds a full vial" when doseMg > vialMg', () => {
    const out = reconstitute({ vialMg: 2, waterMl: 1, doseMg: 3 });
    expect(out.warnings).toContain('dose exceeds a full vial');
    // math still computes on raw numbers
    expect(out.concentrationMgPerMl).toBe(2);
    expect(out.volumeMl).toBe(1.5);
    expect(out.drawUnits).toBe(150);
    expect(out.dosesPerVial).toBeCloseTo(2 / 3, 10);
  });

  it('does NOT warn when doseMg === vialMg', () => {
    const out = reconstitute({ vialMg: 2, waterMl: 1, doseMg: 2 });
    expect(out.warnings).toEqual([]);
  });
});

describe('mcgToMg', () => {
  it('converts 1000 mcg to 1 mg', () => {
    expect(mcgToMg(1000)).toBe(1);
  });

  it('converts 100 mcg to 0.1 mg', () => {
    expect(mcgToMg(100)).toBeCloseTo(0.1, 10);
  });

  it('converts 0 mcg to 0 mg', () => {
    expect(mcgToMg(0)).toBe(0);
  });
});

describe('roundUnits', () => {
  it('rounds to 1 decimal place', () => {
    expect(roundUnits(49.96)).toBe(50);
    expect(roundUnits(10.04)).toBe(10);
    expect(roundUnits(12.34)).toBe(12.3);
    expect(roundUnits(12.35)).toBe(12.4);
  });

  it('leaves whole numbers unchanged', () => {
    expect(roundUnits(50)).toBe(50);
  });
});
```

- [ ] **1.2 Run the test, expect FAIL.** The module does not exist yet — run:

```bash
npx vitest run src/lib/reconstitution.test.ts
```

Expected: failure with a resolve/import error such as `Failed to resolve import "./reconstitution"` (or "Cannot find module"). Do not proceed until you see it fail for this reason.

- [ ] **1.3 Implement the minimal core (full).** Create `src/lib/reconstitution.ts` with EXACTLY the Foundations §3 signature:

```ts
// src/lib/reconstitution.ts
export interface ReconInput {
  vialMg: number;
  waterMl: number;
  doseMg: number;
}

export interface ReconResult {
  concentrationMgPerMl: number;
  volumeMl: number;
  drawUnits: number;
  dosesPerVial: number;
  warnings: string[];
}

export class ReconError extends Error {}

function assertPositiveNumber(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new ReconError(`${label} must be a finite number > 0`);
  }
}

export function reconstitute(input: ReconInput): ReconResult {
  const { vialMg, waterMl, doseMg } = input;
  assertPositiveNumber(vialMg, 'vialMg');
  assertPositiveNumber(waterMl, 'waterMl');
  assertPositiveNumber(doseMg, 'doseMg');

  const concentrationMgPerMl = vialMg / waterMl; // M / W
  const volumeMl = doseMg / concentrationMgPerMl; // D * W / M
  const drawUnits = volumeMl * 100; // U-100: 1 mL = 100 units
  const dosesPerVial = vialMg / doseMg; // M / D

  const warnings: string[] = [];
  if (doseMg > vialMg) {
    warnings.push('dose exceeds a full vial');
  }

  return { concentrationMgPerMl, volumeMl, drawUnits, dosesPerVial, warnings };
}

export function mcgToMg(mcg: number): number {
  return mcg / 1000;
}

export function roundUnits(units: number): number {
  return Math.round(units * 10) / 10; // 1 decimal place for display
}
```

- [ ] **1.4 Run the test, expect PASS.** Run:

```bash
npx vitest run src/lib/reconstitution.test.ts
```

Expected: all tests pass (canonical fixtures, 11 invalid-input cases, D>M warning, `mcgToMg`, `roundUnits`).

- [ ] **1.5 Commit.**

```bash
git add src/lib/reconstitution.ts src/lib/reconstitution.test.ts
git commit -m "feat: reconstitution pure core with TDD coverage"
```

---

## Task 2 — `SAVE_VIAL` / `REMOVE_VIAL` reducer cases (TDD)

Pure reducer cases, unit-tested. The action shapes are fixed by Foundations §6: `SAVE_VIAL` carries a full `Vial`, `REMOVE_VIAL` carries `{ id }`.

**Files:**

- Modify: `src/state/reducer.ts`
- Test: `src/state/reducer.test.ts`

### Steps

- [ ] **2.1 Write the failing reducer tests (append, full).** Add the block below to `src/state/reducer.test.ts` (create the file with these imports if Sprint 0 did not). Use `initialState` from `src/state/types.ts`.

```ts
// src/state/reducer.test.ts  (Sprint 1 additions)
import { describe, it, expect } from 'vitest';
import { reducer } from './reducer';
import { initialState } from './types';
import type { Vial, AppState } from './types';

function makeVial(over: Partial<Vial> = {}): Vial {
  return {
    id: 'v1',
    peptideId: 'tesamorelin',
    vialMg: 2,
    waterMl: 1,
    doseMg: 1,
    concentrationMgPerMl: 2,
    drawUnits: 50,
    reconstitutedAt: '2026-06-17T00:00:00.000Z',
    ...over,
  };
}

describe('reducer — SAVE_VIAL', () => {
  it('appends a new vial immutably', () => {
    const vial = makeVial();
    const next = reducer(initialState, { type: 'SAVE_VIAL', payload: vial });
    expect(next.vials).toEqual([vial]);
    expect(initialState.vials).toEqual([]); // no mutation of input
    expect(next).not.toBe(initialState);
  });

  it('replaces an existing vial with the same id (upsert)', () => {
    const base: AppState = { ...initialState, vials: [makeVial()] };
    const updated = makeVial({ doseMg: 0.5, drawUnits: 25 });
    const next = reducer(base, { type: 'SAVE_VIAL', payload: updated });
    expect(next.vials).toHaveLength(1);
    expect(next.vials[0]).toEqual(updated);
  });

  it('keeps other vials when adding a new one', () => {
    const base: AppState = { ...initialState, vials: [makeVial({ id: 'v1' })] };
    const second = makeVial({ id: 'v2', peptideId: 'ipamorelin' });
    const next = reducer(base, { type: 'SAVE_VIAL', payload: second });
    expect(next.vials.map((v) => v.id)).toEqual(['v1', 'v2']);
  });
});

describe('reducer — REMOVE_VIAL', () => {
  it('removes the vial with the given id immutably', () => {
    const base: AppState = {
      ...initialState,
      vials: [makeVial({ id: 'v1' }), makeVial({ id: 'v2' })],
    };
    const next = reducer(base, { type: 'REMOVE_VIAL', payload: { id: 'v1' } });
    expect(next.vials.map((v) => v.id)).toEqual(['v2']);
    expect(base.vials).toHaveLength(2); // no mutation
  });

  it('is a no-op (new state) when id is absent', () => {
    const base: AppState = { ...initialState, vials: [makeVial({ id: 'v1' })] };
    const next = reducer(base, { type: 'REMOVE_VIAL', payload: { id: 'nope' } });
    expect(next.vials.map((v) => v.id)).toEqual(['v1']);
  });
});
```

- [ ] **2.2 Run, expect FAIL.** Run:

```bash
npx vitest run src/state/reducer.test.ts
```

Expected failure: the `SAVE_VIAL`/`REMOVE_VIAL` cases are not yet handled (the reducer falls through to `default` and returns state unchanged, so `appends a new vial` fails its `toEqual([vial])` assertion). If the file/`reducer` export does not exist, expect an import error instead.

- [ ] **2.3 Implement the reducer cases (minimal).** In `src/state/reducer.ts`, add the two cases to the `switch (action.type)`. Keep them pure and immutable. (Do not rename or remove existing cases; the `Action` union in Foundations §6 already declares these.)

```ts
// src/state/reducer.ts  (inside switch (action.type), Sprint 1 cases)
    case 'SAVE_VIAL': {
      const vial = action.payload;
      const exists = state.vials.some((v) => v.id === vial.id);
      const vials = exists
        ? state.vials.map((v) => (v.id === vial.id ? vial : v))
        : [...state.vials, vial];
      return { ...state, vials };
    }

    case 'REMOVE_VIAL': {
      return {
        ...state,
        vials: state.vials.filter((v) => v.id !== action.payload.id),
      };
    }
```

If Sprint 0's reducer does not yet exist, create `src/state/reducer.ts` as a pure function with the full `Action` union from Foundations §6, a `default: return state;`, and the `HYDRATE`/`SEED` cases it needs; then add the two cases above. Minimum scaffold:

```ts
// src/state/reducer.ts
import { initialState } from './types';
import type { AppState, Action } from './types';

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };
    case 'SEED':
      return {
        ...state,
        peptides: action.payload.peptides,
        protocols: action.payload.protocols,
        goals: action.payload.goals,
      };
    // ...SAVE_VIAL / REMOVE_VIAL cases inserted here...
    case 'RESET_ALL':
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}
```

> Note: the `Action` type is declared once (Foundations §6). If Sprint 0 placed it in `src/state/store.tsx` rather than `types.ts`, import `Action` from there instead — do not redefine it.

- [ ] **2.4 Run, expect PASS.** Run:

```bash
npx vitest run src/state/reducer.test.ts
```

Expected: all `SAVE_VIAL` and `REMOVE_VIAL` tests pass.

- [ ] **2.5 Commit.**

```bash
git add src/state/reducer.ts src/state/reducer.test.ts
git commit -m "feat: SAVE_VIAL and REMOVE_VIAL reducer cases with tests"
```

---

## Task 3 — Shared components: `Button`, `Card`, `Chip`, `NumberPad`

`Button` and `Card` may already be stubbed by Sprint 0. **Check first** — extend, do not duplicate. `Chip` and `NumberPad` are new in this sprint. All styling uses tokens from Foundations §8 via CSS Modules.

**Files:**

- Modify (or Create if absent): `src/components/Button.tsx`, `src/components/Button.module.css`
- Modify (or Create if absent): `src/components/Card.tsx`, `src/components/Card.module.css`
- Create: `src/components/Chip.tsx`, `src/components/Chip.module.css`
- Create: `src/components/NumberPad.tsx`, `src/components/NumberPad.module.css`

### Steps

- [ ] **3.1 Check for existing Button/Card.** Run:

```bash
ls src/components/Button.tsx src/components/Card.tsx 2>/dev/null
```

If they exist, open them and reuse their props; only add what's missing. If they do not exist, create them per the next two steps.

- [ ] **3.2 Create/confirm `Button`.** Ensure `src/components/Button.tsx` exposes `variant: 'primary' | 'secondary' | 'ghost'` and forwards native button props.

```tsx
// src/components/Button.tsx
import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  const cls = [styles.btn, styles[variant], className].filter(Boolean).join(' ');
  return <button className={cls} {...rest} />;
}
```

```css
/* src/components/Button.module.css */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  min-height: 48px;
  padding: var(--s-3) var(--s-5);
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  font-family: var(--font-ui);
  font-size: var(--t-body);
  font-weight: 600;
  cursor: pointer;
  transition:
    filter 0.15s ease,
    background 0.15s ease;
}
.btn:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 2px;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.primary {
  background: var(--amber);
  color: var(--bg-0);
}
.primary:hover:not(:disabled) {
  background: var(--amber-600);
}
.secondary {
  background: var(--indigo);
  color: var(--text-0);
}
.secondary:hover:not(:disabled) {
  background: var(--indigo-600);
}
.ghost {
  background: transparent;
  color: var(--text-0);
  border-color: var(--border);
}
.ghost:hover:not(:disabled) {
  background: var(--glass);
}
```

- [ ] **3.3 Create/confirm `Card`.** Ensure `src/components/Card.tsx` is a token-styled container that forwards props and merges `className`.

```tsx
// src/components/Card.tsx
import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const cls = [styles.card, className].filter(Boolean).join(' ');
  return <div className={cls} {...rest} />;
}
```

```css
/* src/components/Card.module.css */
.card {
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-card);
  padding: var(--s-5);
}
```

- [ ] **3.4 Create `Chip` (preset selector).** A toggleable pill button. `selected` drives the active style; it is a real `<button>` for keyboard access.

```tsx
// src/components/Chip.tsx
import type { ButtonHTMLAttributes } from 'react';
import styles from './Chip.module.css';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected = false, className, ...rest }: ChipProps) {
  const cls = [styles.chip, selected ? styles.selected : '', className].filter(Boolean).join(' ');
  return <button type="button" aria-pressed={selected} className={cls} {...rest} />;
}
```

```css
/* src/components/Chip.module.css */
.chip {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: var(--s-2) var(--s-4);
  border: 1px solid var(--border);
  border-radius: var(--r-pill);
  background: var(--glass);
  color: var(--text-1);
  font-family: var(--font-ui);
  font-size: var(--t-sm);
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}
.chip:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 2px;
}
.selected {
  background: var(--indigo);
  border-color: var(--indigo);
  color: var(--text-0);
}
```

- [ ] **3.5 Create `NumberPad`.** A controlled numeric keypad: digits 0–9, a decimal point, and backspace. It edits a string `value` and reports changes via `onChange`. Guards against multiple decimal points.

```tsx
// src/components/NumberPad.tsx
import styles from './NumberPad.module.css';

interface NumberPadProps {
  value: string;
  onChange: (next: string) => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'] as const;

export function NumberPad({ value, onChange }: NumberPadProps) {
  function press(key: string) {
    if (key === '⌫') {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (value.includes('.')) return; // only one decimal point
      onChange(value === '' ? '0.' : value + '.');
      return;
    }
    // digit
    onChange(value === '0' ? key : value + key);
  }

  return (
    <div className={styles.pad} role="group" aria-label="Number pad">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          className={styles.key}
          aria-label={key === '⌫' ? 'Backspace' : key}
          onClick={() => press(key)}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
```

```css
/* src/components/NumberPad.module.css */
.pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-2);
}
.key {
  min-height: 56px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-2);
  color: var(--text-0);
  font-family: var(--font-ui);
  font-size: var(--t-h2);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease;
}
.key:hover {
  background: var(--bg-1);
}
.key:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 2px;
}
```

- [ ] **3.6 Commit.**

```bash
git add src/components/Button.tsx src/components/Button.module.css \
  src/components/Card.tsx src/components/Card.module.css \
  src/components/Chip.tsx src/components/Chip.module.css \
  src/components/NumberPad.tsx src/components/NumberPad.module.css
git commit -m "feat: Chip and NumberPad components; confirm Button/Card"
```

---

## Task 4 — `CalculatorView` (`/reconstitute/calc/:peptideId`)

Thin view over the pure core. Inputs: vial size (mg), water (mL), dose — each via preset **chips** + a shared **NumberPad**. Outputs concentration and "draw to N units" (U-100), a units↔mL toggle, and a "Why N mL?" explainer. Numeric display fields use `inputmode="decimal"` and are labeled. On save it builds a `Vial` (Foundations §4) from `reconstitute()` output and dispatches `SAVE_VIAL`, then navigates back to `/reconstitute`.

**Files:**

- Create: `src/features/reconstitute/CalculatorView.tsx`
- Create: `src/features/reconstitute/CalculatorView.module.css`
- Modify: `src/App.tsx` (register the route)

### Steps

- [ ] **4.1 Create `CalculatorView` (full).** Write the complete component below.

```tsx
// src/features/reconstitute/CalculatorView.tsx
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reconstitute, roundUnits, ReconError, type ReconResult } from '../../lib/reconstitution';
import { id } from '../../lib/ids';
import { useAppState, useDispatch } from '../../state/store';
import type { Vial } from '../../state/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { NumberPad } from '../../components/NumberPad';
import styles from './CalculatorView.module.css';

type Field = 'vial' | 'water' | 'dose';
type Unit = 'units' | 'ml';

const PRESETS: Record<Field, string[]> = {
  vial: ['2', '5', '10'],
  water: ['1', '2', '3'],
  dose: ['0.1', '0.5', '1'],
};

const FIELD_LABEL: Record<Field, string> = {
  vial: 'Vial size (mg)',
  water: 'Bacteriostatic water (mL)',
  dose: 'Dose (mg)',
};

function toNumber(s: string): number {
  if (s.trim() === '') return NaN;
  return Number(s);
}

export function CalculatorView() {
  const { peptideId = '' } = useParams<{ peptideId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { peptides } = useAppState();

  const peptide = peptides.find((p) => p.id === peptideId);

  const [vial, setVial] = useState('2');
  const [water, setWater] = useState('1');
  const [dose, setDose] = useState('1');
  const [active, setActive] = useState<Field>('vial');
  const [unit, setUnit] = useState<Unit>('units');
  const [whyOpen, setWhyOpen] = useState(false);

  const values: Record<Field, string> = { vial, water, dose };
  const setters: Record<Field, (s: string) => void> = {
    vial: setVial,
    water: setWater,
    dose: setDose,
  };

  const result = useMemo<ReconResult | null>(() => {
    try {
      return reconstitute({
        vialMg: toNumber(vial),
        waterMl: toNumber(water),
        doseMg: toNumber(dose),
      });
    } catch (e) {
      if (e instanceof ReconError) return null;
      throw e;
    }
  }, [vial, water, dose]);

  const drawDisplay =
    result === null
      ? '—'
      : unit === 'units'
        ? `${roundUnits(result.drawUnits)} units`
        : `${roundUnits(result.volumeMl * 10) / 10} mL`;

  function handleSave() {
    if (result === null) return;
    const vialRecord: Vial = {
      id: id(),
      peptideId,
      vialMg: toNumber(vial),
      waterMl: toNumber(water),
      doseMg: toNumber(dose),
      concentrationMgPerMl: result.concentrationMgPerMl,
      drawUnits: result.drawUnits,
      reconstitutedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SAVE_VIAL', payload: vialRecord });
    navigate('/reconstitute');
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          aria-label="Back to kit"
          onClick={() => navigate('/reconstitute')}
        >
          ←
        </button>
        <h1 className={styles.title}>{peptide ? peptide.name : 'Reconstitute'}</h1>
      </header>

      <Card className={styles.outputCard}>
        <div className={styles.outRow}>
          <span className={styles.outLabel}>Concentration</span>
          <span className={styles.outValue}>
            {result ? `${result.concentrationMgPerMl} mg/mL` : '—'}
          </span>
        </div>
        <div className={styles.outRow}>
          <span className={styles.outLabel}>Draw to</span>
          <span className={styles.outValueBig}>{drawDisplay}</span>
        </div>
        <div className={styles.toggle} role="group" aria-label="Display unit">
          <Chip selected={unit === 'units'} onClick={() => setUnit('units')}>
            units
          </Chip>
          <Chip selected={unit === 'ml'} onClick={() => setUnit('ml')}>
            mL
          </Chip>
        </div>

        {result && result.warnings.length > 0 && (
          <p className={styles.warn} role="alert">
            ⚠ {result.warnings.join('; ')}
          </p>
        )}

        <button
          type="button"
          className={styles.whyToggle}
          aria-expanded={whyOpen}
          onClick={() => setWhyOpen((o) => !o)}
        >
          {result ? `Why ${roundUnits(result.volumeMl * 10) / 10} mL?` : 'Why this volume?'}
        </button>
        {whyOpen && result && (
          <p className={styles.why}>
            Concentration is {result.concentrationMgPerMl} mg/mL ({vial} mg ÷ {water} mL). A {dose}{' '}
            mg dose needs {dose} ÷ {result.concentrationMgPerMl} ={' '}
            {roundUnits(result.volumeMl * 10) / 10} mL, which is {roundUnits(result.drawUnits)}{' '}
            units on a U-100 syringe (1 mL = 100 units). This vial yields about{' '}
            {Math.floor(result.dosesPerVial)} doses.
          </p>
        )}
      </Card>

      <div className={styles.fields}>
        {(Object.keys(FIELD_LABEL) as Field[]).map((field) => (
          <div key={field} className={styles.field}>
            <label className={styles.fieldLabel} htmlFor={`field-${field}`}>
              {FIELD_LABEL[field]}
            </label>
            <input
              id={`field-${field}`}
              className={
                active === field
                  ? `${styles.fieldInput} ${styles.fieldInputActive}`
                  : styles.fieldInput
              }
              type="text"
              inputMode="decimal"
              readOnly
              value={values[field]}
              aria-label={FIELD_LABEL[field]}
              onFocus={() => setActive(field)}
              onClick={() => setActive(field)}
            />
            <div className={styles.chips}>
              {PRESETS[field].map((preset) => (
                <Chip
                  key={preset}
                  selected={values[field] === preset}
                  onClick={() => {
                    setActive(field);
                    setters[field](preset);
                  }}
                >
                  {preset}
                </Chip>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card className={styles.padCard}>
        <p className={styles.padHint}>
          Editing <strong>{FIELD_LABEL[active]}</strong>
        </p>
        <NumberPad value={values[active]} onChange={setters[active]} />
      </Card>

      <Button
        variant="primary"
        className={styles.save}
        disabled={result === null}
        onClick={handleSave}
      >
        Save to kit
      </Button>
    </main>
  );
}
```

- [ ] **4.2 Create `CalculatorView.module.css` (full).** Token-driven styling.

```css
/* src/features/reconstitute/CalculatorView.module.css */
.screen {
  max-width: var(--app-max);
  margin: 0 auto;
  padding: var(--s-4) var(--s-4) calc(var(--tabbar-h) + var(--s-6));
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
}
.header {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}
.back {
  background: var(--glass);
  border: 1px solid var(--border);
  border-radius: var(--r-pill);
  width: 40px;
  height: 40px;
  color: var(--text-0);
  font-size: var(--t-h2);
  cursor: pointer;
}
.back:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 2px;
}
.title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--t-h1);
  color: var(--text-0);
}
.outputCard {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
  background: var(--grad-hero);
}
.outRow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.outLabel {
  color: var(--text-1);
  font-size: var(--t-sm);
}
.outValue {
  color: var(--text-0);
  font-size: var(--t-h2);
  font-weight: 700;
}
.outValueBig {
  color: var(--amber);
  font-size: var(--t-display);
  font-weight: 800;
  line-height: 1;
}
.toggle {
  display: flex;
  gap: var(--s-2);
}
.warn {
  margin: 0;
  color: var(--warn);
  font-size: var(--t-sm);
}
.whyToggle {
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0;
  color: var(--indigo);
  font-size: var(--t-sm);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}
.whyToggle:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 2px;
}
.why {
  margin: 0;
  color: var(--text-1);
  font-size: var(--t-sm);
  line-height: 1.5;
}
.fields {
  display: flex;
  flex-direction: column;
  gap: var(--s-4);
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
}
.fieldLabel {
  color: var(--text-1);
  font-size: var(--t-sm);
  font-weight: 600;
}
.fieldInput {
  width: 100%;
  min-height: 48px;
  padding: var(--s-3) var(--s-4);
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text-0);
  font-family: var(--font-ui);
  font-size: var(--t-h2);
  font-weight: 700;
}
.fieldInputActive {
  border-color: var(--indigo);
}
.fieldInput:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 2px;
}
.chips {
  display: flex;
  gap: var(--s-2);
  flex-wrap: wrap;
}
.padCard {
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}
.padHint {
  margin: 0;
  color: var(--text-1);
  font-size: var(--t-sm);
}
.save {
  width: 100%;
}
```

- [ ] **4.3 Register the route.** In `src/App.tsx`, add the route inside the existing `<Routes>` (import the component at the top). Match the Foundations §10 path exactly.

```tsx
// src/App.tsx — add import
import { CalculatorView } from './features/reconstitute/CalculatorView';

// src/App.tsx — add inside <Routes>
<Route path="/reconstitute/calc/:peptideId" element={<CalculatorView />} />;
```

- [ ] **4.4 Type-check + smoke run.** Run:

```bash
npx tsc --noEmit && npm run dev
```

Expected: no type errors. Visit `/reconstitute/calc/tesamorelin` — with vial 2, water 1, dose 1 the card reads concentration `2 mg/mL` and draw `50 units`; the units↔mL toggle switches to `0.5 mL`; "Why 0.5 mL?" expands the explainer. Stop the dev server when confirmed.

- [ ] **4.5 Commit.**

```bash
git add src/features/reconstitute/CalculatorView.tsx \
  src/features/reconstitute/CalculatorView.module.css src/App.tsx
git commit -m "feat: CalculatorView with chips, number pad, and SAVE_VIAL"
```

---

## Task 5 — `KitView` (`/reconstitute`)

Reads `vials` from state. Shows "N vials in your kit," per-vial cards reading "mg/mL · u draw · mg" with reconstituted date, a `+` to add (routes to a peptide picker → calc), and an empty state. Each card has a remove control dispatching `REMOVE_VIAL`.

**Files:**

- Create: `src/features/reconstitute/KitView.tsx`
- Create: `src/features/reconstitute/KitView.module.css`
- Modify: `src/App.tsx` (register the route)

### Steps

- [ ] **5.1 Create `KitView` (full).** The `+` routes to the calculator for the first catalog peptide (peptide selection lands in a later sprint; for P0 the `+` opens the calculator pre-seeded with a peptide).

```tsx
// src/features/reconstitute/KitView.tsx
import { useNavigate } from 'react-router-dom';
import { useAppState, useDispatch } from '../../state/store';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import styles from './KitView.module.css';

function peptideName(peptides: { id: string; name: string }[], peptideId: string): string {
  return peptides.find((p) => p.id === peptideId)?.name ?? peptideId;
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
                    {vial.concentrationMgPerMl} mg/mL · {vial.drawUnits} u draw · {vial.doseMg} mg
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
```

- [ ] **5.2 Create `KitView.module.css` (full).**

```css
/* src/features/reconstitute/KitView.module.css */
.screen {
  max-width: var(--app-max);
  margin: 0 auto;
  padding: var(--s-5) var(--s-4) calc(var(--tabbar-h) + var(--s-6));
  display: flex;
  flex-direction: column;
  gap: var(--s-5);
}
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--t-display);
  color: var(--text-0);
}
.count {
  margin: var(--s-1) 0 0;
  color: var(--text-1);
  font-size: var(--t-sm);
}
.add {
  width: 48px;
  height: 48px;
  border-radius: var(--r-pill);
  border: none;
  background: var(--amber);
  color: var(--bg-0);
  font-size: var(--t-h1);
  font-weight: 800;
  cursor: pointer;
}
.add:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 2px;
}
.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--s-3);
}
.emptyTitle {
  margin: 0;
  color: var(--text-0);
  font-size: var(--t-h2);
  font-weight: 700;
}
.emptyBody {
  margin: 0;
  color: var(--text-1);
  font-size: var(--t-sm);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-3);
}
.vialCard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
}
.vialMain {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
}
.vialName {
  color: var(--text-0);
  font-size: var(--t-body);
  font-weight: 700;
}
.vialSpec {
  color: var(--text-1);
  font-size: var(--t-sm);
}
.vialMeta {
  color: var(--text-2);
  font-size: var(--t-xs);
}
.remove {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--r-pill);
  border: 1px solid var(--border);
  background: var(--glass);
  color: var(--text-1);
  cursor: pointer;
}
.remove:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 2px;
}
```

- [ ] **5.3 Register the route.** In `src/App.tsx`, add the index reconstitute route (import the component). Match Foundations §10 (`/reconstitute` is also a bottom-tab destination).

```tsx
// src/App.tsx — add import
import { KitView } from './features/reconstitute/KitView';

// src/App.tsx — add inside <Routes>
<Route path="/reconstitute" element={<KitView />} />;
```

- [ ] **5.4 Commit.**

```bash
git add src/features/reconstitute/KitView.tsx \
  src/features/reconstitute/KitView.module.css src/App.tsx
git commit -m "feat: KitView with per-vial cards, empty state, and REMOVE_VIAL"
```

---

## Task 6 — End-to-end verification (offline persistence)

Confirm the wedge DoD: reconstitute a vial offline and see it persisted in the kit across reload.

**Files:**

- (No new files — verification only.)

### Steps

- [ ] **6.1 Run the full test suite, expect PASS.** Run:

```bash
npx vitest run
```

Expected: `reconstitution.test.ts` and `reducer.test.ts` (plus any Sprint 0 tests) all green.

- [ ] **6.2 Lint and type-check, expect clean.** Run:

```bash
npm run lint && npx tsc --noEmit
```

Expected: no errors, no warnings.

- [ ] **6.3 Manual offline persistence check.** Run `npm run dev`. In the browser:
  1. Open DevTools → Network → set to **Offline**.
  2. Go to `/reconstitute` — confirm empty state reads "0 vials reconstituted".
  3. Tap `+`, enter vial 2 / water 1 / dose 1 → card reads `2 mg/mL` and `50 units` → "Save to kit".
  4. Back on `/reconstitute`, confirm one card reads "2 mg/mL · 50 u draw · 1 mg" with today's date and "1 vial in your kit".
  5. **Reload the page (still offline).** The vial must still be there (rehydrated from IndexedDB).
  6. Confirm no console errors. Stop the dev server.

- [ ] **6.4 Commit any verification fixups (if needed).** If steps surfaced a bug, fix it under TDD (add a failing test first), then:

```bash
git add -A
git commit -m "fix: reconstitution wedge verification fixups"
```

---

## Sprint 1 DoD checklist

- [ ] `src/lib/reconstitution.ts` matches Foundations §3 signature exactly (`ReconInput`, `ReconResult`, `ReconError`, `reconstitute`, `mcgToMg`, `roundUnits`).
- [ ] Both canonical fixtures pass: Tesamorelin (M=2, W=1, D=1 → 2 mg/mL, 0.5 mL, 50 units, 2 doses) and Ipamorelin (M=2, W=2, D=0.1 → 1 mg/mL, 0.1 mL, 10 units, 20 doses).
- [ ] Edge-case tests pass: `W<=0`, `M<=0`, `D<=0`, NaN, and non-numeric inputs throw `ReconError`; `D > M` produces the "dose exceeds a full vial" warning; `mcgToMg(1000) === 1`; `roundUnits` rounds to 1 decimal.
- [ ] Math computed on raw numbers; rounding applied only for display.
- [ ] `SAVE_VIAL` (upsert) and `REMOVE_VIAL` reducer cases are pure, immutable, and unit-tested in `src/state/reducer.test.ts`.
- [ ] `Chip` and `NumberPad` created; `Button` and `Card` confirmed/extended (not duplicated). All styled with tokens (§8) and keyboard-accessible.
- [ ] `CalculatorView` at `/reconstitute/calc/:peptideId`: chip presets + `NumberPad`, concentration + "draw to N units" output, units↔mL toggle, "Why N mL?" explainer; numeric fields `inputmode="decimal"` and labeled.
- [ ] Saving builds a `Vial` (Foundations §4) from `reconstitute()` output, dispatches `SAVE_VIAL`, and the store persists the `vials` slice to IndexedDB.
- [ ] `KitView` at `/reconstitute`: vial count, per-vial "mg/mL · u draw · mg" cards with reconstituted date, `+` to add, and "0 vials reconstituted" empty state.
- [ ] Reconstitute a vial offline and see it persisted in the kit across reload (Task 6.3).
- [ ] `npx vitest run`, `npm run lint`, and `npx tsc --noEmit` all clean; no console errors.
- [ ] All work committed with conventional commit messages.
