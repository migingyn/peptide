# Sprint 2 — Protocol, Schedule & Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `2026-06-17-peps-00-foundations.md` first. Prerequisite: Sprint 0-1 complete.

**Goal:** Let a user start the seeded Muscle Growth protocol and run the daily loop — see "Week 1/8", a current-week date strip, today's expected doses (Ipamorelin 0.1 mg / 10 units @ 7:00 AM and Tesamorelin 1 mg / 50 units @ 10:00 PM), and check a dose off (`LOG_DOSE 'taken'`) or undo it (`UNDO_DOSE`).

**Architecture:** All scheduling logic is a set of pure, deterministic functions in `src/lib/schedule.ts` that take `now`/`day` as explicit params (never call `new Date()` in `lib/`, per Foundations §10). `START_PROTOCOL`, `LOG_DOSE`, `UNDO_DOSE` are pure reducer cases in `src/state/reducer.ts`. The `Home` Dashboard view is thin: it reads `AppState` via `useAppState()`, computes occurrences from `lib/schedule.ts`, and dispatches actions. Persistence is automatic via the store's slice mapping (Foundations §6).

**Tech Stack:** React 18 + Vite + TypeScript, React Router, React Context + `useReducer`, Vitest + React Testing Library. Reuse Foundations §4 types, §6 actions, §7 seed data, §8 tokens.

---

## Task 1 — `START_PROTOCOL` reducer case (STRICT TDD)

**Files:**

- `src/state/reducer.test.ts` (extend)
- `src/state/reducer.ts` (extend)

Contract (Foundations §6): `{ type: 'START_PROTOCOL'; payload: { protocolId: string; startDate: string } }`. Creates a `UserProtocol` (Foundations §4) `{ id, protocolId, startDate, active: true }`, **deactivating any prior active one**.

1. - [ ] **Write failing test: starts a protocol.** Append to `src/state/reducer.test.ts`:

   ```ts
   import { describe, it, expect } from 'vitest';
   import { reducer } from './reducer';
   import { initialState } from './types';

   describe('START_PROTOCOL', () => {
     it('appends an active UserProtocol with the given protocolId and startDate', () => {
       const next = reducer(initialState, {
         type: 'START_PROTOCOL',
         payload: { protocolId: 'muscle-growth-tesa-ipa', startDate: '2026-06-17' },
       });
       expect(next.userProtocols).toHaveLength(1);
       const up = next.userProtocols[0];
       expect(up.protocolId).toBe('muscle-growth-tesa-ipa');
       expect(up.startDate).toBe('2026-06-17');
       expect(up.active).toBe(true);
       expect(typeof up.id).toBe('string');
       expect(up.id.length).toBeGreaterThan(0);
     });

     it('deactivates any prior active UserProtocol when a new one starts', () => {
       const first = reducer(initialState, {
         type: 'START_PROTOCOL',
         payload: { protocolId: 'muscle-growth-tesa-ipa', startDate: '2026-01-01' },
       });
       const second = reducer(first, {
         type: 'START_PROTOCOL',
         payload: { protocolId: 'muscle-growth-tesa-ipa', startDate: '2026-06-17' },
       });
       expect(second.userProtocols).toHaveLength(2);
       expect(second.userProtocols.filter((u) => u.active)).toHaveLength(1);
       expect(second.userProtocols.find((u) => u.active)?.startDate).toBe('2026-06-17');
       expect(second.userProtocols.find((u) => u.startDate === '2026-01-01')?.active).toBe(false);
     });
   });
   ```

2. - [ ] **Run, expect FAIL.** `npx vitest run src/state/reducer.test.ts` — fails (no `START_PROTOCOL` case yet).

3. - [ ] **Minimal impl.** In `src/state/reducer.ts`, add the import for `id` and the case inside the `switch`:

   ```ts
   import { id } from '../lib/ids';
   // ...inside switch (action.type) {
     case 'START_PROTOCOL': {
       const userProtocols = state.userProtocols.map((u) =>
         u.active ? { ...u, active: false } : u,
       );
       userProtocols.push({
         id: id(),
         protocolId: action.payload.protocolId,
         startDate: action.payload.startDate,
         active: true,
       });
       return { ...state, userProtocols };
     }
   ```

4. - [ ] **Run, expect PASS.** `npx vitest run src/state/reducer.test.ts`.

5. - [ ] **Commit.** `git commit -am "feat: START_PROTOCOL reducer case"`.

---

## Task 2 — `LOG_DOSE` + `UNDO_DOSE` reducer cases (STRICT TDD)

**Files:**

- `src/state/reducer.test.ts` (extend)
- `src/state/reducer.ts` (extend)

Contract (Foundations §6): `{ type: 'LOG_DOSE'; payload: DoseLog }` appends; `{ type: 'UNDO_DOSE'; payload: { id: string } }` removes by id.

1. - [ ] **Write failing test.** Append to `src/state/reducer.test.ts`:

   ```ts
   import type { DoseLog } from './types';

   const sampleLog: DoseLog = {
     id: 'log-1',
     userProtocolId: 'up-1',
     peptideId: 'ipamorelin',
     scheduledFor: '2026-06-17T07:00:00.000Z',
     status: 'taken',
     loggedAt: '2026-06-17T07:01:00.000Z',
   };

   describe('LOG_DOSE / UNDO_DOSE', () => {
     it('LOG_DOSE appends the dose log', () => {
       const next = reducer(initialState, { type: 'LOG_DOSE', payload: sampleLog });
       expect(next.doseLogs).toHaveLength(1);
       expect(next.doseLogs[0]).toEqual(sampleLog);
     });

     it('UNDO_DOSE removes the dose log by id', () => {
       const logged = reducer(initialState, { type: 'LOG_DOSE', payload: sampleLog });
       const undone = reducer(logged, { type: 'UNDO_DOSE', payload: { id: 'log-1' } });
       expect(undone.doseLogs).toHaveLength(0);
     });

     it('UNDO_DOSE leaves unrelated logs intact', () => {
       const other: DoseLog = { ...sampleLog, id: 'log-2', peptideId: 'tesamorelin' };
       let s = reducer(initialState, { type: 'LOG_DOSE', payload: sampleLog });
       s = reducer(s, { type: 'LOG_DOSE', payload: other });
       const undone = reducer(s, { type: 'UNDO_DOSE', payload: { id: 'log-1' } });
       expect(undone.doseLogs).toHaveLength(1);
       expect(undone.doseLogs[0].id).toBe('log-2');
     });
   });
   ```

2. - [ ] **Run, expect FAIL.** `npx vitest run src/state/reducer.test.ts`.

3. - [ ] **Minimal impl.** Add two cases to the `switch` in `src/state/reducer.ts`:

   ```ts
     case 'LOG_DOSE':
       return { ...state, doseLogs: [...state.doseLogs, action.payload] };

     case 'UNDO_DOSE':
       return {
         ...state,
         doseLogs: state.doseLogs.filter((l) => l.id !== action.payload.id),
       };
   ```

4. - [ ] **Run, expect PASS.** `npx vitest run src/state/reducer.test.ts`.

5. - [ ] **Commit.** `git commit -am "feat: LOG_DOSE and UNDO_DOSE reducer cases"`.

---

## Task 3 — `lib/schedule.ts` pure dose-occurrence generator (STRICT TDD)

**Files:**

- `src/lib/schedule.test.ts` (new)
- `src/lib/schedule.ts` (new)

Signatures (define exactly):

```ts
export interface DoseOccurrence {
  userProtocolId: string;
  peptideId: string;
  doseMg: number;
  timeOfDay: string;
  scheduledFor: string; /* ISO datetime */
  nickname?: string;
}
export function occurrencesForDay(
  userProtocol: UserProtocol,
  protocol: Protocol,
  day: Date,
): DoseOccurrence[];
export function protocolWeek(
  userProtocol: UserProtocol,
  now: Date,
): { week: number; totalWeeks: number };
export function isOccurrenceLogged(occ: DoseOccurrence, logs: DoseLog[]): DoseStatus | null;
```

Rules: NEVER call `new Date()` inside `lib/`. Deterministic. `occurrencesForDay` filters `ProtocolItem.daysOfWeek` against `day.getDay()`, builds `scheduledFor` from `day` + `timeOfDay`, sorts by `timeOfDay` ascending. `isOccurrenceLogged` matches by `peptideId` + `scheduledFor`.

1. - [ ] **Write failing test.** Create `src/lib/schedule.test.ts`:

   ```ts
   import { describe, it, expect } from 'vitest';
   import {
     occurrencesForDay,
     protocolWeek,
     isOccurrenceLogged,
     type DoseOccurrence,
   } from './schedule';
   import type { Protocol, UserProtocol, DoseLog } from '../state/types';

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
     items: [
       {
         peptideId: 'tesamorelin',
         doseMg: 1,
         timeOfDay: '22:00',
         daysOfWeek: [1, 2, 3, 4, 5],
         nickname: 'Night Builder',
       },
       {
         peptideId: 'ipamorelin',
         doseMg: 0.1,
         timeOfDay: '07:00',
         daysOfWeek: [1, 2, 3, 4, 5],
         nickname: 'Morning Pulse',
       },
     ],
   };

   // Wed 2026-06-17 is the start date (verified: 2026-06-17 is a Wednesday).
   const USER_PROTOCOL: UserProtocol = {
     id: 'up-1',
     protocolId: 'muscle-growth-tesa-ipa',
     startDate: '2026-06-17',
     active: true,
   };

   // Use local-time Date constructor (year, monthIndex, day) to avoid TZ drift.
   const wednesday = new Date(2026, 5, 17); // Wed
   const sunday = new Date(2026, 5, 21); // Sun

   describe('occurrencesForDay', () => {
     it('yields 2 occurrences on a weekday, sorted by timeOfDay (Ipamorelin 07:00 then Tesamorelin 22:00)', () => {
       const occ = occurrencesForDay(USER_PROTOCOL, PROTOCOL, wednesday);
       expect(occ).toHaveLength(2);
       expect(occ[0].peptideId).toBe('ipamorelin');
       expect(occ[0].timeOfDay).toBe('07:00');
       expect(occ[0].doseMg).toBe(0.1);
       expect(occ[1].peptideId).toBe('tesamorelin');
       expect(occ[1].timeOfDay).toBe('22:00');
       expect(occ[1].doseMg).toBe(1);
       expect(occ[0].userProtocolId).toBe('up-1');
       expect(occ[0].nickname).toBe('Morning Pulse');
     });

     it('builds scheduledFor from the day + timeOfDay', () => {
       const occ = occurrencesForDay(USER_PROTOCOL, PROTOCOL, wednesday);
       const d = new Date(occ[0].scheduledFor);
       expect(d.getFullYear()).toBe(2026);
       expect(d.getMonth()).toBe(5);
       expect(d.getDate()).toBe(17);
       expect(d.getHours()).toBe(7);
       expect(d.getMinutes()).toBe(0);
     });

     it('yields 0 occurrences on Sunday (not in daysOfWeek)', () => {
       expect(occurrencesForDay(USER_PROTOCOL, PROTOCOL, sunday)).toHaveLength(0);
     });
   });

   describe('protocolWeek', () => {
     it('returns week 1 of 8 on the start date', () => {
       expect(protocolWeek(USER_PROTOCOL, new Date(2026, 5, 17))).toEqual({
         week: 1,
         totalWeeks: 8,
       });
     });
     it('returns week 2 of 8 eight days after start', () => {
       expect(protocolWeek(USER_PROTOCOL, new Date(2026, 5, 25))).toEqual({
         week: 2,
         totalWeeks: 8,
       });
     });
     it('clamps week to at least 1 before the start date', () => {
       expect(protocolWeek(USER_PROTOCOL, new Date(2026, 5, 10))).toEqual({
         week: 1,
         totalWeeks: 8,
       });
     });
   });

   describe('isOccurrenceLogged', () => {
     it('returns the status when a log matches peptideId + scheduledFor', () => {
       const occ = occurrencesForDay(USER_PROTOCOL, PROTOCOL, wednesday)[0];
       const log: DoseLog = {
         id: 'log-1',
         userProtocolId: 'up-1',
         peptideId: occ.peptideId,
         scheduledFor: occ.scheduledFor,
         status: 'taken',
         loggedAt: '2026-06-17T07:05:00.000Z',
       };
       expect(isOccurrenceLogged(occ, [log])).toBe('taken');
     });

     it('returns null when no log matches', () => {
       const occ: DoseOccurrence = occurrencesForDay(USER_PROTOCOL, PROTOCOL, wednesday)[0];
       expect(isOccurrenceLogged(occ, [])).toBeNull();
     });
   });
   ```

2. - [ ] **Run, expect FAIL.** `npx vitest run src/lib/schedule.test.ts` — fails (module does not exist).

3. - [ ] **Minimal impl.** Create `src/lib/schedule.ts`:

   ```ts
   import type { UserProtocol, Protocol, DoseLog, DoseStatus, DayOfWeek } from '../state/types';

   export interface DoseOccurrence {
     userProtocolId: string;
     peptideId: string;
     doseMg: number;
     timeOfDay: string;
     scheduledFor: string; /* ISO datetime */
     nickname?: string;
   }

   /** Parse "HH:MM" into [hours, minutes]. */
   function parseTime(timeOfDay: string): [number, number] {
     const [h, m] = timeOfDay.split(':');
     return [Number(h), Number(m)];
   }

   /** Doses scheduled on `day`, filtered by daysOfWeek, sorted by timeOfDay. */
   export function occurrencesForDay(
     userProtocol: UserProtocol,
     protocol: Protocol,
     day: Date,
   ): DoseOccurrence[] {
     const dow = day.getDay() as DayOfWeek;
     return protocol.items
       .filter((item) => item.daysOfWeek.includes(dow))
       .map((item) => {
         const [h, m] = parseTime(item.timeOfDay);
         const scheduled = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
         return {
           userProtocolId: userProtocol.id,
           peptideId: item.peptideId,
           doseMg: item.doseMg,
           timeOfDay: item.timeOfDay,
           scheduledFor: scheduled.toISOString(),
           nickname: item.nickname,
         };
       })
       .sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
   }

   const MS_PER_DAY = 24 * 60 * 60 * 1000;

   /** Current week (1-based) of the protocol given `now`. */
   export function protocolWeek(
     userProtocol: UserProtocol,
     now: Date,
   ): { week: number; totalWeeks: number } {
     // totalWeeks must come from the protocol; callers pass startDate via userProtocol.
     // We only have weeks via the protocol, so this helper takes totalWeeks separately
     // through the protocol — but per the contract signature it derives from startDate.
     const start = new Date(userProtocol.startDate + 'T00:00:00');
     const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
     const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
     const diffDays = Math.floor((nowMidnight.getTime() - startMidnight.getTime()) / MS_PER_DAY);
     const week = Math.max(1, Math.floor(diffDays / 7) + 1);
     return { week, totalWeeks: TOTAL_WEEKS };
   }

   // totalWeeks for the seeded Muscle Growth protocol (Foundations §7).
   const TOTAL_WEEKS = 8;

   /** Status of a logged dose matching by peptideId + scheduledFor, else null. */
   export function isOccurrenceLogged(occ: DoseOccurrence, logs: DoseLog[]): DoseStatus | null {
     const match = logs.find(
       (l) => l.peptideId === occ.peptideId && l.scheduledFor === occ.scheduledFor,
     );
     return match ? match.status : null;
   }
   ```

   > NOTE: The contract signature `protocolWeek(userProtocol, now)` does not pass the `Protocol`, so `totalWeeks` is the seeded protocol's 8 weeks (`TOTAL_WEEKS`). This matches the only P0 protocol. Keep `TOTAL_WEEKS = 8`; the test asserts `totalWeeks: 8`.

4. - [ ] **Run, expect PASS.** `npx vitest run src/lib/schedule.test.ts`.

5. - [ ] **Commit.** `git commit -am "feat: lib/schedule pure dose-occurrence generator (TDD)"`.

---

## Task 4 — `ProgressRing` component

**Files:**

- `src/components/ProgressRing.tsx` (new)

A pure SVG ring showing `value/max` progress with a center label. Respects `prefers-reduced-motion` via tokens.

1. - [ ] **Create `ProgressRing.tsx`.**

   ```tsx
   interface ProgressRingProps {
     value: number; // current (e.g. week 1)
     max: number; // total (e.g. 8)
     label: string; // e.g. "Week 1/8"
     size?: number; // px
   }

   export function ProgressRing({ value, max, label, size = 120 }: ProgressRingProps) {
     const stroke = 10;
     const radius = (size - stroke) / 2;
     const circumference = 2 * Math.PI * radius;
     const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
     const offset = circumference * (1 - pct);
     return (
       <div
         role="img"
         aria-label={label}
         style={{ width: size, height: size, position: 'relative' }}
       >
         <svg width={size} height={size}>
           <circle
             cx={size / 2}
             cy={size / 2}
             r={radius}
             fill="none"
             stroke="var(--bg-2)"
             strokeWidth={stroke}
           />
           <circle
             cx={size / 2}
             cy={size / 2}
             r={radius}
             fill="none"
             stroke="var(--amber)"
             strokeWidth={stroke}
             strokeLinecap="round"
             strokeDasharray={circumference}
             strokeDashoffset={offset}
             transform={`rotate(-90 ${size / 2} ${size / 2})`}
             style={{ transition: 'stroke-dashoffset 400ms ease' }}
           />
         </svg>
         <div
           style={{
             position: 'absolute',
             inset: 0,
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             color: 'var(--text-0)',
             fontSize: 'var(--t-h2)',
             fontWeight: 600,
           }}
         >
           {label}
         </div>
       </div>
     );
   }
   ```

2. - [ ] **Commit.** `git commit -am "feat: ProgressRing SVG component"`.

---

## Task 5 — `EmptyState` component (create if absent)

**Files:**

- `src/components/EmptyState.tsx` (new — skip if it already exists from a prior sprint)

1. - [ ] **Check existence.** `ls src/components/EmptyState.tsx` — if it exists and matches this shape, skip to Task 6.

2. - [ ] **Create `EmptyState.tsx`.** Reuses `Button` from `src/components/Button.tsx`.

   ```tsx
   import type { ReactNode } from 'react';
   import { Button } from './Button';

   interface EmptyStateProps {
     title: string;
     body?: string;
     actionLabel?: string;
     onAction?: () => void;
     icon?: ReactNode;
   }

   export function EmptyState({ title, body, actionLabel, onAction, icon }: EmptyStateProps) {
     return (
       <div
         style={{
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'center',
           textAlign: 'center',
           gap: 'var(--s-3)',
           padding: 'var(--s-6) var(--s-4)',
           color: 'var(--text-1)',
         }}
       >
         {icon}
         <h2 style={{ color: 'var(--text-0)', fontSize: 'var(--t-h2)', margin: 0 }}>{title}</h2>
         {body ? <p style={{ margin: 0, color: 'var(--text-2)' }}>{body}</p> : null}
         {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
       </div>
     );
   }
   ```

3. - [ ] **Commit.** `git commit -am "feat: EmptyState component"`.

---

## Task 6 — `Home` Dashboard view

**Files:**

- `src/features/home/Dashboard.tsx` (new)
- `src/App.tsx` (wire route `/` to `<Dashboard />` — verify it is mounted)

Reads `AppState` via `useAppState()`, computes today's occurrences from `lib/schedule.ts`, dispatches `LOG_DOSE`/`UNDO_DOSE`. Uses `new Date()` only here (a view), never in `lib/` (Foundations §10). Reuses `Card`, `Button`, `ProgressRing`, `EmptyState`. Draw units come from a matching reconstituted `Vial` (by `peptideId` + `doseMg`), else `"—"`.

1. - [ ] **Create `Dashboard.tsx` — imports, helpers, week strip.**

   ```tsx
   import { useMemo, useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { useAppState, useDispatch } from '../../state/store';
   import {
     occurrencesForDay,
     protocolWeek,
     isOccurrenceLogged,
     type DoseOccurrence,
   } from '../../lib/schedule';
   import { id } from '../../lib/ids';
   import { roundUnits } from '../../lib/reconstitution';
   import { ProgressRing } from '../../components/ProgressRing';
   import { Card } from '../../components/Card';
   import { EmptyState } from '../../components/EmptyState';
   import type { Vial } from '../../state/types';

   const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

   function startOfWeek(d: Date): Date {
     // Monday-first week strip: shift so Monday is index 0.
     const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
     const day = date.getDay(); // 0 = Sun
     const diff = day === 0 ? -6 : 1 - day; // back to Monday
     date.setDate(date.getDate() + diff);
     return date;
   }

   function sameDay(a: Date, b: Date): boolean {
     return (
       a.getFullYear() === b.getFullYear() &&
       a.getMonth() === b.getMonth() &&
       a.getDate() === b.getDate()
     );
   }

   function formatTime(timeOfDay: string): string {
     const [h, m] = timeOfDay.split(':').map(Number);
     const ampm = h >= 12 ? 'PM' : 'AM';
     const h12 = h % 12 === 0 ? 12 : h % 12;
     return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
   }

   function matchingVial(vials: Vial[], peptideId: string, doseMg: number): Vial | undefined {
     return vials.find((v) => v.peptideId === peptideId && v.doseMg === doseMg);
   }
   ```

2. - [ ] **Add the component body — active protocol + empty state.** Append to `Dashboard.tsx`:

   ```tsx
   export function Dashboard() {
     const state = useAppState();
     const dispatch = useDispatch();
     const navigate = useNavigate();

     const now = useMemo(() => new Date(), []);
     const [selectedDay, setSelectedDay] = useState<Date>(
       () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
     );

     const userProtocol = state.userProtocols.find((u) => u.active) ?? null;
     const protocol = userProtocol
       ? state.protocols.find((p) => p.id === userProtocol.protocolId) ?? null
       : null;

     const peptideName = (peptideId: string) =>
       state.peptides.find((p) => p.id === peptideId)?.name ?? peptideId;

     if (!userProtocol || !protocol) {
       return (
         <main style={{ padding: 'var(--s-4)' }}>
           <EmptyState
             title="No active protocol"
             body="Start a protocol to see your daily doses here."
             actionLabel="Start a protocol"
             onAction={() => navigate('/goals')}
           />
         </main>
       );
     }

     const { week, totalWeeks } = protocolWeek(userProtocol, now);
     const weekStart = startOfWeek(now);
     const weekDays = Array.from({ length: 7 }, (_, i) => {
       const d = new Date(weekStart);
       d.setDate(weekStart.getDate() + i);
       return d;
     });

     const todays = occurrencesForDay(userProtocol, protocol, selectedDay);
     const tomorrow = new Date(selectedDay);
     tomorrow.setDate(selectedDay.getDate() + 1);
     const upcoming = occurrencesForDay(userProtocol, protocol, tomorrow);

     const toggleDose = (occ: DoseOccurrence) => {
       const existing = state.doseLogs.find(
         (l) => l.peptideId === occ.peptideId && l.scheduledFor === occ.scheduledFor,
       );
       if (existing) {
         dispatch({ type: 'UNDO_DOSE', payload: { id: existing.id } });
       } else {
         dispatch({
           type: 'LOG_DOSE',
           payload: {
             id: id(),
             userProtocolId: occ.userProtocolId,
             peptideId: occ.peptideId,
             scheduledFor: occ.scheduledFor,
             status: 'taken',
             loggedAt: new Date().toISOString(),
           },
         });
       }
     };

     const drawUnitsLabel = (occ: DoseOccurrence): string => {
       const vial = matchingVial(state.vials, occ.peptideId, occ.doseMg);
       return vial ? `${roundUnits(vial.drawUnits)} units` : '—';
     };
   ```

3. - [ ] **Add the JSX return — ring, week strip, today's doses, upcoming, my peptides.** Continue inside `Dashboard`:

   ```tsx
     return (
       <main style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
         <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
           <ProgressRing value={week} max={totalWeeks} label={`Week ${week}/${totalWeeks}`} />
           <div>
             <h1 style={{ margin: 0, fontSize: 'var(--t-h1)', color: 'var(--text-0)' }}>{protocol.name}</h1>
             <p style={{ margin: 0, color: 'var(--text-2)' }}>{protocol.summary}</p>
           </div>
         </header>

         <nav aria-label="Week" style={{ display: 'flex', gap: 'var(--s-2)', justifyContent: 'space-between' }}>
           {weekDays.map((d, i) => {
             const isToday = sameDay(d, now);
             const isSelected = sameDay(d, selectedDay);
             return (
               <button
                 key={d.toISOString()}
                 type="button"
                 onClick={() => setSelectedDay(d)}
                 aria-pressed={isSelected}
                 aria-current={isToday ? 'date' : undefined}
                 style={{
                   flex: 1,
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   gap: 'var(--s-1)',
                   padding: 'var(--s-2) 0',
                   borderRadius: 'var(--r-md)',
                   border: isToday ? '1px solid var(--amber)' : '1px solid var(--border)',
                   background: isSelected ? 'var(--indigo)' : 'var(--bg-1)',
                   color: 'var(--text-0)',
                   cursor: 'pointer',
                 }}
               >
                 <span style={{ fontSize: 'var(--t-xs)', color: 'var(--text-2)' }}>
                   {DAY_LABELS[d.getDay()]}
                 </span>
                 <span style={{ fontSize: 'var(--t-body)', fontWeight: 600 }}>{d.getDate()}</span>
               </button>
             );
           })}
         </nav>

         <section aria-label="Today's doses" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
           <h2 style={{ margin: 0, fontSize: 'var(--t-h2)', color: 'var(--text-0)' }}>Today&apos;s doses</h2>
           {todays.length === 0 ? (
             <p style={{ color: 'var(--text-2)', margin: 0 }}>No doses scheduled for this day.</p>
           ) : (
             todays.map((occ) => {
               const status = isOccurrenceLogged(occ, state.doseLogs);
               const taken = status === 'taken';
               return (
                 <Card key={`${occ.peptideId}-${occ.scheduledFor}`}>
                   <label
                     style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: 'var(--s-3)',
                       cursor: 'pointer',
                     }}
                   >
                     <input
                       type="checkbox"
                       checked={taken}
                       onChange={() => toggleDose(occ)}
                       aria-label={`Mark ${peptideName(occ.peptideId)} as taken`}
                     />
                     <div style={{ flex: 1 }}>
                       <div style={{ color: 'var(--text-0)', fontWeight: 600 }}>
                         {peptideName(occ.peptideId)}
                       </div>
                       <div style={{ color: 'var(--text-2)', fontSize: 'var(--t-sm)' }}>
                         {occ.doseMg} mg · {drawUnitsLabel(occ)} · {formatTime(occ.timeOfDay)}
                       </div>
                     </div>
                     <span
                       style={{ color: taken ? 'var(--ok)' : 'var(--text-2)', fontSize: 'var(--t-sm)' }}
                     >
                       {taken ? 'Taken' : 'Pending'}
                     </span>
                   </label>
                 </Card>
               );
             })
           )}
         </section>

         <section aria-label="Upcoming doses" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
           <h2 style={{ margin: 0, fontSize: 'var(--t-h2)', color: 'var(--text-0)' }}>Upcoming doses</h2>
           {upcoming.length === 0 ? (
             <p style={{ color: 'var(--text-2)', margin: 0 }}>Nothing scheduled for tomorrow.</p>
           ) : (
             upcoming.map((occ) => (
               <Card key={`up-${occ.peptideId}-${occ.scheduledFor}`}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-0)' }}>{peptideName(occ.peptideId)}</span>
                   <span style={{ color: 'var(--text-2)', fontSize: 'var(--t-sm)' }}>
                     {occ.doseMg} mg · {formatTime(occ.timeOfDay)}
                   </span>
                 </div>
               </Card>
             ))
           )}
         </section>

         <section aria-label="My Peptides" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
           <h2 style={{ margin: 0, fontSize: 'var(--t-h2)', color: 'var(--text-0)' }}>My Peptides</h2>
           {protocol.items.map((item) => (
             <Card key={`pep-${item.peptideId}`}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-0)' }}>{peptideName(item.peptideId)}</span>
                 <span style={{ color: 'var(--text-2)', fontSize: 'var(--t-sm)' }}>
                   {item.doseMg} mg · {formatTime(item.timeOfDay)}
                 </span>
               </div>
             </Card>
           ))}
         </section>
       </main>
     );
   }
   ```

4. - [ ] **Wire route `/`.** Confirm `src/App.tsx` renders `<Dashboard />` at path `/`. If it shows a placeholder from Sprint 0, replace the element:

   ```tsx
   import { Dashboard } from './features/home/Dashboard';
   // ...
   <Route path="/" element={<Dashboard />} />;
   ```

5. - [ ] **Typecheck + lint.** `npx tsc --noEmit && npx eslint src/features/home/Dashboard.tsx src/components/ProgressRing.tsx src/components/EmptyState.tsx`.

6. - [ ] **Commit.** `git commit -am "feat: Home Dashboard with week strip, today's doses, check-off"`.

---

## Task 7 — Dashboard integration test: the check-off-a-dose flow (STRICT TDD)

**Files:**

- `src/features/home/Dashboard.test.tsx` (new)

Render with a started protocol + reconstituted vials, check off a dose, assert it becomes 'taken' (the PRD's required integration test). Pin the clock with fake timers so the seeded Wednesday start day yields the two known occurrences.

1. - [ ] **Write failing test.** Create `src/features/home/Dashboard.test.tsx`:

   ```tsx
   import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
   import { render, screen, within } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import { MemoryRouter } from 'react-router-dom';
   import { Dashboard } from './Dashboard';
   import { AppStateProvider } from '../../state/store';
   import { reducer } from '../../state/reducer';
   import { initialState, type AppState } from '../../state/types';
   import { PEPTIDES } from '../../data/peptides.seed';
   import { PROTOCOLS } from '../../data/protocols.seed';
   import { GOALS } from '../../data/goals.seed';

   // Build a hydrated state: seeded + an active protocol started today (a Wednesday)
   // + reconstituted vials for both peptides.
   function buildState(): AppState {
     let s: AppState = {
       ...initialState,
       peptides: PEPTIDES,
       protocols: PROTOCOLS,
       goals: GOALS,
       hydrated: true,
     };
     s = reducer(s, {
       type: 'START_PROTOCOL',
       payload: { protocolId: 'muscle-growth-tesa-ipa', startDate: '2026-06-17' },
     });
     s = {
       ...s,
       vials: [
         {
           id: 'vial-tesa',
           peptideId: 'tesamorelin',
           vialMg: 2,
           waterMl: 1,
           doseMg: 1,
           concentrationMgPerMl: 2,
           drawUnits: 50,
           reconstitutedAt: '2026-06-17T00:00:00.000Z',
         },
         {
           id: 'vial-ipa',
           peptideId: 'ipamorelin',
           vialMg: 2,
           waterMl: 2,
           doseMg: 0.1,
           concentrationMgPerMl: 1,
           drawUnits: 10,
           reconstitutedAt: '2026-06-17T00:00:00.000Z',
         },
       ],
     };
     return s;
   }

   beforeEach(() => {
     // Pin "now" to Wed 2026-06-17 09:00 local so the week + today's doses are deterministic.
     vi.useFakeTimers();
     vi.setSystemTime(new Date(2026, 5, 17, 9, 0, 0));
   });

   afterEach(() => {
     vi.useRealTimers();
   });

   function renderHome() {
     return render(
       <MemoryRouter>
         <AppStateProvider initialState={buildState()}>
           <Dashboard />
         </AppStateProvider>
       </MemoryRouter>,
     );
   }

   describe('Home Dashboard', () => {
     it('shows Week 1/8 progress', () => {
       renderHome();
       expect(screen.getByLabelText('Week 1/8')).toBeInTheDocument();
     });

     it("renders both of today's doses with PRD dose + units", () => {
       renderHome();
       expect(screen.getByText('Ipamorelin')).toBeInTheDocument();
       expect(screen.getByText('Tesamorelin')).toBeInTheDocument();
       expect(screen.getByText(/0\.1 mg · 10 units · 7:00 AM/)).toBeInTheDocument();
       expect(screen.getByText(/1 mg · 50 units · 10:00 PM/)).toBeInTheDocument();
     });

     it('checks off a dose → it becomes taken, then unchecks → pending', async () => {
       const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
       renderHome();

       const checkbox = screen.getByLabelText('Mark Ipamorelin as taken') as HTMLInputElement;
       expect(checkbox.checked).toBe(false);

       await user.click(checkbox);
       expect((screen.getByLabelText('Mark Ipamorelin as taken') as HTMLInputElement).checked).toBe(
         true,
       );

       const card = screen.getByLabelText('Mark Ipamorelin as taken').closest('label')!;
       expect(within(card).getByText('Taken')).toBeInTheDocument();

       await user.click(screen.getByLabelText('Mark Ipamorelin as taken'));
       expect((screen.getByLabelText('Mark Ipamorelin as taken') as HTMLInputElement).checked).toBe(
         false,
       );
     });
   });
   ```

   > NOTE: `AppStateProvider` must accept an optional `initialState` prop for tests (Sprint 0 should already support this; if not, add `initialState?: AppState` to its props and use it instead of the module default when provided). If the provider name/prop differs, align to the Sprint 0 implementation — do not change the contract types.

2. - [ ] **Run, expect FAIL.** `npx vitest run src/features/home/Dashboard.test.tsx` — fails until Task 6's Dashboard is wired (and provider accepts `initialState`).

3. - [ ] **Make it pass.** If failing only on the provider `initialState` prop, add the optional prop to `AppStateProvider` in `src/state/store.tsx`:

   ```tsx
   export function AppStateProvider({
     children,
     initialState: seed,
   }: {
     children: React.ReactNode;
     initialState?: AppState;
   }) {
     const [state, dispatch] = useReducer(reducer, seed ?? initialState);
     // ...existing context + persistence effect unchanged...
   }
   ```

   Otherwise the Dashboard from Task 6 already satisfies the assertions.

4. - [ ] **Run, expect PASS.** `npx vitest run src/features/home/Dashboard.test.tsx`.

5. - [ ] **Run full suite.** `npx vitest run` — all green.

6. - [ ] **Commit.** `git commit -am "test: Dashboard check-off-a-dose integration test"`.

---

## Sprint 2 DoD checklist

- [ ] `START_PROTOCOL` reducer case implemented, pure, deactivates prior active protocol, unit-tested green in `src/state/reducer.test.ts`.
- [ ] `LOG_DOSE` + `UNDO_DOSE` reducer cases implemented, pure, unit-tested green.
- [ ] `src/lib/schedule.ts` exports `DoseOccurrence`, `occurrencesForDay`, `protocolWeek`, `isOccurrenceLogged` with the exact contract signatures; NO `new Date()` inside `lib/`; deterministic.
- [ ] `src/lib/schedule.test.ts` green: Wednesday → 2 occurrences sorted Ipamorelin(07:00) then Tesamorelin(22:00); Sunday → 0; `protocolWeek` startDate → week 1/8 and +8 days → week 2; `isOccurrenceLogged` matches a taken log.
- [ ] `ProgressRing` SVG component renders "Week 1/8" with an accessible label.
- [ ] `EmptyState` exists and is used for the no-active-protocol case (routes to `/goals`).
- [ ] `Home` Dashboard at route `/`: ProgressRing, MON–SUN week strip (today highlighted, tappable to change selected day), Today's doses cards (name, dose mg, draw units from matching Vial else "—", dose time, checkbox), Upcoming doses, My Peptides.
- [ ] PRD numbers render: Ipamorelin 0.1 mg / 10 units @ 7:00 AM; Tesamorelin 1 mg / 50 units @ 10:00 PM.
- [ ] Checking a dose dispatches `LOG_DOSE 'taken'`; unchecking dispatches `UNDO_DOSE`; integration test `src/features/home/Dashboard.test.tsx` green.
- [ ] `npx tsc --noEmit` clean; `npx eslint` clean; `npx vitest run` all green.
- [ ] End-to-end: start a protocol → Home shows today's doses → check one off → it shows "Taken" and persists across reload (slice `doseLogs` persisted per Foundations §6).
