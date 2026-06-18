# PepS — Foundations & Shared Contracts

> **For agentic workers:** This is the **shared reference** for every PepS sprint plan. It is NOT executed on its own — it locks down the types, data model, math, tokens, seed data, and reducer contract that all sprint plans (`peps-01` … `peps-05`) depend on. When a sprint task says "see Foundations §X," it means this file. If you change a type here, update every sprint plan that uses it.

**Goal:** Define the immutable contracts (types, file layout, math, tokens, seed data, store actions) so that five independently-executable sprint plans stay mutually consistent.

**Tech Stack:** React 18 + Vite + TypeScript, React Router, IndexedDB via `idb`, React Context + `useReducer`, Vitest + React Testing Library, ESLint + Prettier + Husky + lint-staged, GitHub Actions → Vercel.

---

## §1. Sprint Map

Each sprint is its own plan file and produces working, testable software.

| Plan | Sprint | Produces | DoD |
|---|---|---|---|
| `peps-01-scaffold.md` | Sprint 0 | Vite app, tooling, 3-tab shell, tokens, CI, Vercel deploy | Green CI, live URL |
| `peps-02-reconstitution-wedge.md` | Sprint 1 | `lib/reconstitution.ts` (TDD), CalculatorView, Vial persistence, KitView | Reconstitute a vial offline, see it in kit |
| `peps-03-protocol-schedule-home.md` | Sprint 2 | Protocol seed, `START_PROTOCOL`, `lib/schedule.ts` (TDD), Home dashboard, dose check-off | Start → today → check-off loop works |
| `peps-04-onboarding-goals-guide.md` | Sprint 3 | Onboarding + medical gate, goal grid, protocol detail, Guide Me 5-step, notifications, a11y | Full flow demoable end-to-end |
| `peps-05-explore.md` | Promoted P1 | Explore tabs: Protocols + Peptides catalog w/ search/categories, detail routes | Browse catalog, route into detail |

**Build order:** 01 → 02 → 03 → 04, with 05 after 03 (needs seed data + detail routes). Foundations is a prerequisite read for all.

---

## §2. File Structure (target)

```
peptide/
  index.html
  package.json
  tsconfig.json
  tsconfig.node.json
  vite.config.ts                 # also holds Vitest config (test block)
  vitest.setup.ts                # RTL + jest-dom matchers
  .eslintrc.cjs
  .prettierrc
  .husky/pre-commit
  .github/workflows/ci.yml
  vercel.json                    # SPA rewrite
  src/
    main.tsx                     # entry: mount <App/> in <AppStateProvider>
    App.tsx                      # router + tab layout + onboarding gate
    vite-env.d.ts
    state/
      store.tsx                  # Context + useReducer, typed actions (§6)
      reducer.ts                 # pure reducer fn (unit-tested)
      types.ts                   # ALL domain types (§4) — single source
      persistence.ts             # idb open/read/write, schema versioning (§5)
    lib/
      reconstitution.ts          # PURE calculator core (§3) — unit-tested
      schedule.ts                # PURE dose-occurrence generator — unit-tested
      notifications.ts           # browser Notification wrapper, feature-detected
      ids.ts                     # id() helper (crypto.randomUUID wrapper)
    features/
      onboarding/                # Splash, Sex, Age, Carousel, MedicalGate
      goals/                     # GetStarted, GoalGrid, GoalIntro, Proceed
      protocol/                  # ProtocolDetail, StartProtocol
      reconstitute/             # CalculatorView, GuideMe, KitView
      home/                      # Dashboard (week strip, Today's doses, check-off)
      explore/                   # ProtocolsTab, PeptidesTab, PeptideDetail
    components/                  # Button, Chip, NumberPad, Card, TabBar, ProgressRing, EmptyState
    data/
      peptides.seed.ts           # catalog (§7)
      protocols.seed.ts          # Muscle Growth etc. (§7)
      goals.seed.ts              # 7 goals (§7)
    styles/
      tokens.css                 # design tokens (§8)
      global.css                 # resets, base element styles
  docs/
    adr/                         # ADR-001..003
    superpowers/plans/           # these plans
```

**Principle:** all real logic lives in pure functions in `lib/` (no React, no I/O). Views are thin. `state/reducer.ts` is pure and unit-tested; `state/store.tsx` wires it to Context + persistence.

---

## §3. Reconstitution Math (canonical spec)

Given vial mass `M` (mg), bacteriostatic water `W` (mL), dose `D` (mg), U-100 insulin syringe (1 mL = 100 units):

```
concentration_mg_per_ml = M / W
volume_ml               = D / concentration_mg_per_ml   // = D * W / M
units_to_draw           = volume_ml * 100               // = (D * W / M) * 100
doses_per_vial          = M / D
```

**Canonical test fixtures (from app screenshots):**
- Tesamorelin: M=2, W=1, D=1 → concentration 2 mg/mL, volume 0.5 mL, **50 units**, 2 doses/vial.
- Ipamorelin: M=2, W=2, D=0.1 → concentration 1 mg/mL, volume 0.1 mL, **10 units**, 20 doses/vial.

**Rules:**
- Compute on raw numbers; round only for display.
- Invalid input → throw or return an error result for: `W <= 0`, `M <= 0`, `D <= 0`, non-numeric/NaN.
- `D > M` is valid math but warn ("dose exceeds a full vial").
- Dose may be entered in mg or mcg (1 mg = 1000 mcg); store/compute in mg.

**Canonical function signature (Sprint 1 implements; everyone imports this shape):**

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
  warnings: string[];        // e.g. ["dose exceeds a full vial"]
}

export class ReconError extends Error {}

export function reconstitute(input: ReconInput): ReconResult;
export function mcgToMg(mcg: number): number;     // mcg / 1000
export function roundUnits(units: number): number; // display: 1 decimal place
```

---

## §4. Domain Types (`src/state/types.ts`) — SINGLE SOURCE

Every sprint imports from here. Do not redefine these locally.

```ts
export type Sex = 'male' | 'female' | 'other';
export type AgeBand = '18-29' | '30-39' | '40-49' | '50-59' | '60+';
export type DoseStatus = 'taken' | 'skipped';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface Profile {
  sex: Sex | null;
  ageBand: AgeBand | null;
  onboardedAt: string | null;   // ISO string
  medicalAck: boolean;
}

export interface Peptide {
  id: string;
  name: string;
  nickname?: string;
  category: string;             // e.g. "Growth", "Recovery", "Beauty"
  blurb: string;
}

export interface ProtocolItem {
  peptideId: string;
  doseMg: number;
  timeOfDay: string;            // "07:00" 24h
  daysOfWeek: DayOfWeek[];      // e.g. Mon–Fri => [1,2,3,4,5]
  nickname?: string;            // "Night Builder"
}

export interface Protocol {
  id: string;
  goalId: string;
  name: string;
  weeks: number;
  injectionsPerWeek: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  costPerWeek?: number;         // ~66
  summary: string;              // "At a Glance" line
  whyThisStack: { peptideId: string; nickname: string; reason: string }[];
  whatToExpect: { range: string; text: string }[];   // "Week 1", "2-4", "5-8"
  importantToKnow: string[];
  faq: { q: string; a: string }[];
  items: ProtocolItem[];
}

export interface Goal {
  id: string;
  name: string;                 // "Muscle Growth"
  tagline: string;              // "Build Lean Muscle Fast"
  blurb: string;
  recommendedProtocolId: string | null;
}

export interface UserProtocol {
  id: string;
  protocolId: string;
  startDate: string;            // ISO date "2026-06-17"
  active: boolean;
}

export interface Vial {
  id: string;
  peptideId: string;
  vialMg: number;
  waterMl: number;
  doseMg: number;
  concentrationMgPerMl: number;
  drawUnits: number;
  reconstitutedAt: string;      // ISO
}

export interface DoseLog {
  id: string;
  userProtocolId: string;
  peptideId: string;
  scheduledFor: string;         // ISO datetime of the scheduled occurrence
  status: DoseStatus;
  loggedAt: string;             // ISO
}

export interface Prefs {
  notificationsEnabled: boolean;
  theme: 'dark';
}

export interface AppState {
  profile: Profile;
  peptides: Peptide[];          // seeded
  protocols: Protocol[];        // seeded
  goals: Goal[];                // seeded
  userProtocols: UserProtocol[];
  vials: Vial[];
  doseLogs: DoseLog[];
  prefs: Prefs;
  hydrated: boolean;            // false until idb rehydrate completes
}
```

**Initial state:**
```ts
export const initialState: AppState = {
  profile: { sex: null, ageBand: null, onboardedAt: null, medicalAck: false },
  peptides: [],
  protocols: [],
  goals: [],
  userProtocols: [],
  vials: [],
  doseLogs: [],
  prefs: { notificationsEnabled: false, theme: 'dark' },
  hydrated: false,
};
```

---

## §5. Persistence (`src/state/persistence.ts`)

- **IndexedDB** via `idb`. DB name `peps`, **schema version 1**.
- Object stores (keyPath `id` unless noted): `profile` (key `'singleton'`), `peptides`, `protocols`, `goals`, `userProtocols`, `vials`, `doseLogs`, `prefs` (key `'singleton'`).
- **ADR-002:** bump version + migrate in the `upgrade` callback on schema change; never silently drop user data.
- API surface the store calls:

```ts
export async function openPepsDb(): Promise<IDBPDatabase>;
export async function loadAll(): Promise<Partial<AppState>>;   // reads every store → state slices
export async function persistSlice<K extends keyof AppState>(key: K, value: AppState[K]): Promise<void>;
```

- Seed data (`peptides`, `protocols`, `goals`) is loaded from `src/data/*.seed.ts` into state on boot and written to idb only if the store is empty (idempotent seeding).
- `localStorage` key `peps.onboarded` mirrors `profile.onboardedAt != null` for a fast pre-hydrate routing decision (avoids onboarding flash).

---

## §6. Store & Reducer Contract (`src/state/reducer.ts`, `store.tsx`)

`reducer.ts` exports a **pure** `reducer(state, action): AppState` (unit-tested, no I/O). `store.tsx` wraps it with Context, dispatch, and a persistence effect.

**Action union (canonical — sprints add cases, never rename):**

```ts
export type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SET_PROFILE'; payload: Partial<Profile> }
  | { type: 'ACK_MEDICAL' }
  | { type: 'COMPLETE_ONBOARDING' }                      // sets onboardedAt
  | { type: 'SEED'; payload: { peptides: Peptide[]; protocols: Protocol[]; goals: Goal[] } }
  | { type: 'START_PROTOCOL'; payload: { protocolId: string; startDate: string } }
  | { type: 'SAVE_VIAL'; payload: Vial }
  | { type: 'REMOVE_VIAL'; payload: { id: string } }
  | { type: 'LOG_DOSE'; payload: DoseLog }
  | { type: 'UNDO_DOSE'; payload: { id: string } }
  | { type: 'SET_PREFS'; payload: Partial<Prefs> }
  | { type: 'RESET_ALL' };
```

**Persistence mapping (which action writes which slice):** the store's effect, after each dispatch, persists only the affected slice(s):
- `SET_PROFILE`/`ACK_MEDICAL`/`COMPLETE_ONBOARDING` → `persistSlice('profile', ...)`
- `START_PROTOCOL` → `persistSlice('userProtocols', ...)`
- `SAVE_VIAL`/`REMOVE_VIAL` → `persistSlice('vials', ...)`
- `LOG_DOSE`/`UNDO_DOSE` → `persistSlice('doseLogs', ...)`
- `SET_PREFS` → `persistSlice('prefs', ...)`
- `RESET_ALL` → clear all stores, reset to `initialState` (then re-seed).

**Hooks exposed by `store.tsx`:**
```ts
export function useAppState(): AppState;
export function useDispatch(): React.Dispatch<Action>;
```

---

## §7. Seed Data (`src/data/*.seed.ts`)

**`goals.seed.ts`** — 7 goals; only Muscle Growth has a recommended protocol in P0:
```ts
export const GOALS: Goal[] = [
  { id: 'muscle-growth', name: 'Muscle Growth', tagline: 'Build Lean Muscle Fast',
    blurb: 'Stack growth-hormone secretagogues to build lean mass.', recommendedProtocolId: 'muscle-growth-tesa-ipa' },
  { id: 'injury-recovery', name: 'Injury Recovery', tagline: 'Heal Faster', blurb: 'Support tissue repair.', recommendedProtocolId: null },
  { id: 'skincare-beauty', name: 'Skincare & Beauty', tagline: 'Glow From Within', blurb: 'Collagen & skin support.', recommendedProtocolId: null },
  { id: 'energy-performance', name: 'Energy & Performance', tagline: 'Peak Output', blurb: 'Mitochondrial & endurance support.', recommendedProtocolId: null },
  { id: 'weight-loss', name: 'Weight Loss', tagline: 'Lean Down', blurb: 'Metabolic support.', recommendedProtocolId: null },
  { id: 'brain-enhancement', name: 'Brain Enhancement', tagline: 'Sharper Focus', blurb: 'Cognitive support.', recommendedProtocolId: null },
  { id: 'anti-aging', name: 'Anti Aging', tagline: 'Age Well', blurb: 'Longevity support.', recommendedProtocolId: null },
];
```

**`peptides.seed.ts`** — catalog of 10:
```ts
export const PEPTIDES: Peptide[] = [
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
```

**`protocols.seed.ts`** — Muscle Growth stack (Tesa+Ipa, 8 weeks, 5×/week Mon–Fri):
```ts
export const PROTOCOLS: Protocol[] = [
  {
    id: 'muscle-growth-tesa-ipa',
    goalId: 'muscle-growth',
    name: 'Muscle Growth Stack',
    weeks: 8,
    injectionsPerWeek: 5,
    level: 'Beginner',
    costPerWeek: 66,
    summary: 'Beginner · 8 weeks · ~$66/wk · 5× weekly',
    whyThisStack: [
      { peptideId: 'tesamorelin', nickname: 'Night Builder', reason: 'Drives nighttime GH for recovery and lean mass.' },
      { peptideId: 'ipamorelin', nickname: 'Morning Pulse', reason: 'A clean morning GH pulse without cortisol spikes.' },
    ],
    whatToExpect: [
      { range: 'Week 1', text: 'Adjusting; better sleep is common.' },
      { range: 'Week 2-4', text: 'Improved recovery and fullness.' },
      { range: 'Week 5-8', text: 'Visible lean-mass changes for most.' },
    ],
    importantToKnow: [
      'Inject on an empty stomach when possible.',
      'Rotate injection sites.',
      'This is not medical advice.',
    ],
    faq: [
      { q: 'Do I need to fast?', a: 'A small fasting window around dosing can help GH response.' },
      { q: 'What if I miss a dose?', a: 'Skip it; do not double up. Resume next scheduled time.' },
    ],
    items: [
      { peptideId: 'tesamorelin', doseMg: 1,   timeOfDay: '22:00', daysOfWeek: [1,2,3,4,5], nickname: 'Night Builder' },
      { peptideId: 'ipamorelin',  doseMg: 0.1, timeOfDay: '07:00', daysOfWeek: [1,2,3,4,5], nickname: 'Morning Pulse' },
    ],
  },
];
```

---

## §8. Design Tokens (`src/styles/tokens.css`)

Dark, premium, mobile-first. Deep navy → indigo, amber primary CTA.

```css
:root {
  /* color */
  --bg-0: #0b1020;          /* deepest navy */
  --bg-1: #121a33;          /* card base */
  --bg-2: #1b2547;          /* raised */
  --grad-hero: linear-gradient(160deg, #0b1020 0%, #1a1f4d 55%, #2a2170 100%);
  --indigo: #5b6cff;        /* secondary */
  --indigo-600: #4453e0;
  --amber: #ff9f43;         /* primary CTA */
  --amber-600: #f08a1d;
  --text-0: #f5f7ff;        /* primary text */
  --text-1: #b9c0e0;        /* secondary text */
  --text-2: #7e87b0;        /* muted */
  --ok: #34d399;
  --warn: #fbbf24;
  --danger: #f87171;
  --border: rgba(255,255,255,0.08);
  --glass: rgba(255,255,255,0.04);

  /* radius / shadow */
  --r-sm: 8px; --r-md: 14px; --r-lg: 22px; --r-pill: 999px;
  --shadow-card: 0 8px 30px rgba(0,0,0,0.35);

  /* spacing scale (4px base) */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px; --s-7: 48px;

  /* type */
  --font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Georgia', 'Times New Roman', serif;
  --t-display: clamp(28px, 7vw, 40px);
  --t-h1: 24px; --t-h2: 20px; --t-body: 16px; --t-sm: 14px; --t-xs: 12px;

  /* layout */
  --app-max: 480px;         /* mobile-first column */
  --tabbar-h: 64px;
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
```

**A11y baseline (all sprints):** semantic HTML, labeled inputs, `inputmode="decimal"` on numeric fields, visible focus ring (`:focus-visible` outline using `--indigo`), WCAG AA contrast, `prefers-reduced-motion` respected.

---

## §9. ADRs (write in Sprint 0, `docs/adr/`)

- **ADR-001** — Local-first / no backend. Give up: cross-device sync, real auth. Gain: offline, zero infra, small attack surface.
- **ADR-002** — IndexedDB with versioned migrations. Give up: simplicity of localStorage. Gain: structured, scalable local data without silent breakage.
- **ADR-003** — Context + `useReducer` over Redux/Zustand. Give up: devtools/middleware ecosystem. Gain: zero runtime deps, right-sized for MVP.

---

## §10. Conventions

- **IDs:** `src/lib/ids.ts` → `export const id = () => crypto.randomUUID();` (test env: jsdom provides it; if not, fall back to a counter — implemented in Sprint 0).
- **Time:** store ISO strings. The app's "today" is computed from `new Date()` only inside views/store, never inside `lib/` pure functions (schedule takes an explicit `now` param — see Sprint 2).
- **Routing:** routes — `/onboarding/*`, `/get-started`, `/goals`, `/goal/:goalId`, `/protocol/:protocolId`, `/protocol/:protocolId/start`, `/` (Home), `/reconstitute`, `/reconstitute/calc/:peptideId`, `/reconstitute/guide/:peptideId`, `/explore`, `/explore/peptide/:peptideId`. Bottom tabs: Home `/`, Explore `/explore`, Reconstitute `/reconstitute`.
- **Commits:** small, conventional (`feat:`, `test:`, `chore:`, `docs:`). Commit after each green step.
- **Definition of Done (every feature):** unit/integration tests pass in CI, lint/format clean, no console errors, works offline, matches captured flow, documented in README.
```
