# Sprint 0 — Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `2026-06-17-peps-00-foundations.md` first.

**Goal:** Stand up the PepS Vite + React + TypeScript app with full dev tooling, design tokens, a 3-tab router shell, state/persistence/seed scaffolding, ADRs, CI, and Vercel deploy so later sprints have a green, deployable foundation.

**Architecture:** A local-first SPA: pure logic lives in `src/lib/`, all domain types in `src/state/types.ts` (single source), a Context + `useReducer` store in `src/state/store.tsx` backed by IndexedDB (`src/state/persistence.ts`) with idempotent seeding from `src/data/*.seed.ts`. Views are thin React Router screens; Sprint 0 ships placeholder screens behind a `<TabBar>`. CI runs lint → typecheck → test → build; Vercel auto-deploys `main`.

**Tech Stack:** React 18 + Vite + TypeScript, React Router DOM, IndexedDB via `idb`, React Context + `useReducer`, Vitest + React Testing Library + jest-dom, ESLint + Prettier + Husky + lint-staged, GitHub Actions → Vercel.

---

## Task 1 — Scaffold Vite into the existing repo (non-destructive)

**Files:**

- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `.gitignore`
- Modify: (none — existing `LICENSE`, `README.md`, `docs/` must be preserved)

1. **[ ] Confirm working directory and that nothing will be clobbered.** The repo already has `LICENSE`, `README.md`, `docs/`. We scaffold Vite into a temp dir then copy in, to avoid the interactive "directory not empty" prompt.

   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   ls -la
   # Expect: LICENSE  README.md  docs/  .git/
   ```

2. **[ ] Create the Vite react-ts app in a temp sibling dir.** Use a non-interactive scaffold so it never overwrites repo files.

   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   npm create vite@latest .peps-tmp -- --template react-ts
   # Expect: "Scaffolding project in .../peptide/.peps-tmp ..." then "Done."
   ```

3. **[ ] Copy scaffold files in WITHOUT overwriting README.md.** Move everything except the temp's `README.md` and `.gitignore` (we write our own below), then remove the temp dir.

   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   rm -f .peps-tmp/README.md
   # copy hidden + visible files, do not clobber existing repo files
   cp -Rn .peps-tmp/. .
   rm -rf .peps-tmp
   ls -la
   # Expect now also: package.json  index.html  vite.config.ts  tsconfig*.json  src/  public/  eslint.config.js
   ```

   Note: `cp -Rn` (no-clobber) guarantees our `README.md`/`LICENSE`/`docs/` survive.

4. **[ ] Replace `.gitignore` with a complete one.** Vite's default is fine but make it explicit.

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/.gitignore <<'EOF'
   # Logs
   logs
   *.log
   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*
   pnpm-debug.log*

   node_modules
   dist
   dist-ssr
   *.local
   coverage

   # Editor
   .vscode/*
   !.vscode/extensions.json
   .idea
   .DS_Store
   *.suo
   *.ntvs*
   *.njsproj
   *.sln
   *.sw?

   # Vercel
   .vercel
   EOF
   ```

5. **[ ] Pin `package.json` to the exact runtime/dev dependency budget.** Replace the generated `package.json` entirely. Runtime deps: `react`, `react-dom`, `react-router-dom`, `idb`. Everything else dev-only.

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/package.json <<'EOF'
   {
     "name": "peps",
     "private": true,
     "version": "0.0.0",
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "tsc -b && vite build",
       "preview": "vite preview",
       "lint": "eslint .",
       "format": "prettier --write .",
       "format:check": "prettier --check .",
       "typecheck": "tsc -b --noEmit",
       "test": "vitest run",
       "test:watch": "vitest",
       "prepare": "husky"
     },
     "dependencies": {
       "idb": "^8.0.0",
       "react": "^18.3.1",
       "react-dom": "^18.3.1",
       "react-router-dom": "^6.26.2"
     },
     "devDependencies": {
       "@testing-library/jest-dom": "^6.5.0",
       "@testing-library/react": "^16.0.1",
       "@testing-library/user-event": "^14.5.2",
       "@types/react": "^18.3.5",
       "@types/react-dom": "^18.3.0",
       "@typescript-eslint/eslint-plugin": "^8.5.0",
       "@typescript-eslint/parser": "^8.5.0",
       "@vitejs/plugin-react": "^4.3.1",
       "eslint": "^8.57.0",
       "eslint-config-prettier": "^9.1.0",
       "eslint-plugin-react-hooks": "^4.6.2",
       "eslint-plugin-react-refresh": "^0.4.11",
       "husky": "^9.1.6",
       "jsdom": "^25.0.0",
       "lint-staged": "^15.2.10",
       "prettier": "^3.3.3",
       "typescript": "^5.5.4",
       "vite": "^5.4.6",
       "vitest": "^2.1.1"
     },
     "lint-staged": {
       "*.{ts,tsx,js,jsx,json,css,md}": "prettier --write",
       "*.{ts,tsx}": "eslint --fix"
     }
   }
   EOF
   ```

   Note: we use the classic ESLint 8 + `.eslintrc.cjs` config (Task 3) rather than Vite's flat `eslint.config.js`, so delete the generated flat config:

   ```bash
   rm -f /Users/migi/Documents/GitHub/peptide/eslint.config.js
   ```

6. **[ ] Install dependencies.**

   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   npm install
   # Expect: "added N packages" and a package-lock.json created. No high-severity errors that block.
   ```

7. **[ ] Replace `index.html` with the PepS shell.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/index.html <<'EOF'
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
       <meta name="theme-color" content="#0b1020" />
       <title>PepS</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>
   EOF
   ```

8. **[ ] Replace `tsconfig.json` and `tsconfig.node.json`.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/tsconfig.json <<'EOF'
   {
     "compilerOptions": {
       "target": "ES2020",
       "useDefineForClassFields": true,
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "moduleDetection": "force",
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true,
       "types": ["vitest/globals", "@testing-library/jest-dom"]
     },
     "include": ["src", "vitest.setup.ts"],
     "references": [{ "path": "./tsconfig.node.json" }]
   }
   EOF
   cat > /Users/migi/Documents/GitHub/peptide/tsconfig.node.json <<'EOF'
   {
     "compilerOptions": {
       "composite": true,
       "skipLibCheck": true,
       "module": "ESNext",
       "moduleResolution": "bundler",
       "allowSyntheticDefaultImports": true,
       "strict": true,
       "noEmit": true
     },
     "include": ["vite.config.ts"]
   }
   EOF
   ```

9. **[ ] Write `vite.config.ts` with the shared Vitest block.** RTL + jsdom + setup file, globals on.

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/vite.config.ts <<'EOF'
   /// <reference types="vitest/config" />
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   // https://vitejs.dev/config/
   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: './vitest.setup.ts',
       css: false,
     },
   });
   EOF
   ```

10. **[ ] Write `vitest.setup.ts` (jest-dom matchers).**

    ```bash
    cat > /Users/migi/Documents/GitHub/peptide/vitest.setup.ts <<'EOF'
    import '@testing-library/jest-dom/vitest';
    EOF
    ```

11. **[ ] Ensure `src/vite-env.d.ts` exists (Vite generates it; verify).**

    ```bash
    cat /Users/migi/Documents/GitHub/peptide/src/vite-env.d.ts
    # Expect: /// <reference types="vite/client" />
    ```

12. **[ ] Remove generated boilerplate we will replace.** Delete the demo `App.css`, `index.css`, `assets/react.svg`, and the demo `App.tsx`/`main.tsx` (rewritten in Task 5).

    ```bash
    cd /Users/migi/Documents/GitHub/peptide/src
    rm -f App.css index.css
    rm -rf assets
    ```

13. **[ ] Commit the scaffold.**
    ```bash
    cd /Users/migi/Documents/GitHub/peptide
    git add -A
    git commit -m "chore: scaffold Vite react-ts app with pinned deps"
    ```

---

## Task 2 — Design tokens & global styles

**Files:**

- Create: `src/styles/tokens.css`, `src/styles/global.css`

1. **[ ] Write `src/styles/tokens.css` — EXACT copy of Foundations §8.**

   ```bash
   mkdir -p /Users/migi/Documents/GitHub/peptide/src/styles
   cat > /Users/migi/Documents/GitHub/peptide/src/styles/tokens.css <<'EOF'
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
   EOF
   ```

2. **[ ] Write `src/styles/global.css` — resets + base element styles + focus ring.** Implements the §8 a11y baseline (visible `:focus-visible` outline using `--indigo`, dark theme defaults, mobile-first column).

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/styles/global.css <<'EOF'
   @import './tokens.css';

   *,
   *::before,
   *::after {
     box-sizing: border-box;
   }

   * {
     margin: 0;
   }

   html,
   body,
   #root {
     height: 100%;
   }

   body {
     font-family: var(--font-ui);
     font-size: var(--t-body);
     line-height: 1.5;
     color: var(--text-0);
     background: var(--bg-0);
     -webkit-font-smoothing: antialiased;
     text-rendering: optimizeLegibility;
   }

   img,
   picture,
   video,
   canvas,
   svg {
     display: block;
     max-width: 100%;
   }

   input,
   button,
   textarea,
   select {
     font: inherit;
     color: inherit;
   }

   button {
     cursor: pointer;
     background: none;
     border: none;
   }

   a {
     color: inherit;
     text-decoration: none;
   }

   p,
   h1,
   h2,
   h3,
   h4,
   h5,
   h6 {
     overflow-wrap: break-word;
   }

   ul,
   ol {
     list-style: none;
     padding: 0;
   }

   :focus-visible {
     outline: 2px solid var(--indigo);
     outline-offset: 2px;
     border-radius: var(--r-sm);
   }

   #root {
     max-width: var(--app-max);
     margin-inline: auto;
     min-height: 100%;
   }
   EOF
   ```

3. **[ ] Commit styles.**
   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   git add -A
   git commit -m "feat: add design tokens and global styles"
   ```

---

## Task 3 — Dev tooling: ESLint + Prettier + Husky + lint-staged

**Files:**

- Create: `.eslintrc.cjs`, `.eslintignore`, `.prettierrc`, `.prettierignore`, `.husky/pre-commit`

1. **[ ] Write `.eslintrc.cjs`.** TypeScript + React Hooks + react-refresh, Prettier-compatible (turns off stylistic rules via `eslint-config-prettier`).

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/.eslintrc.cjs <<'EOF'
   /* eslint-env node */
   module.exports = {
     root: true,
     env: { browser: true, es2020: true, node: true },
     extends: [
       'eslint:recommended',
       'plugin:@typescript-eslint/recommended',
       'plugin:react-hooks/recommended',
       'prettier',
     ],
     parser: '@typescript-eslint/parser',
     parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
     plugins: ['@typescript-eslint', 'react-refresh'],
     ignorePatterns: ['dist', 'coverage', 'node_modules', 'vite.config.ts'],
     rules: {
       'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
       '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
     },
     overrides: [
       {
         files: ['**/*.test.ts', '**/*.test.tsx', 'vitest.setup.ts'],
         env: { 'vitest/globals': true },
       },
     ],
   };
   EOF
   ```

2. **[ ] Write `.eslintignore`.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/.eslintignore <<'EOF'
   dist
   coverage
   node_modules
   vite.config.ts
   EOF
   ```

3. **[ ] Write `.prettierrc`.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/.prettierrc <<'EOF'
   {
     "semi": true,
     "singleQuote": true,
     "trailingComma": "all",
     "printWidth": 100,
     "tabWidth": 2
   }
   EOF
   ```

4. **[ ] Write `.prettierignore`.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/.prettierignore <<'EOF'
   dist
   coverage
   node_modules
   package-lock.json
   EOF
   ```

5. **[ ] Initialize Husky.** `npm install` already ran the `prepare` script (Task 1.6) which creates `.husky/`; run it explicitly to be safe.

   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   npx husky init
   # Expect: creates .husky/ and a sample .husky/pre-commit
   ```

6. **[ ] Write the `.husky/pre-commit` gate (runs lint-staged).**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/.husky/pre-commit <<'EOF'
   npx lint-staged
   EOF
   chmod +x /Users/migi/Documents/GitHub/peptide/.husky/pre-commit
   ```

7. **[ ] Format the whole repo and verify lint passes (no source files yet beyond styles — that's fine).**

   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   npm run format
   npm run lint
   # Expect: prettier writes files; eslint exits 0 (no errors).
   ```

8. **[ ] Commit tooling.**
   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   git add -A
   git commit -m "chore: add eslint, prettier, husky pre-commit and lint-staged"
   ```

---

## Task 4 — State scaffolding: types, ids, seed data

**Files:**

- Create: `src/state/types.ts`, `src/lib/ids.ts`, `src/data/goals.seed.ts`, `src/data/peptides.seed.ts`, `src/data/protocols.seed.ts`

1. **[ ] Write `src/state/types.ts` — EXACT copy of ALL Foundations §4 types incl `initialState`.**

   ```bash
   mkdir -p /Users/migi/Documents/GitHub/peptide/src/state
   cat > /Users/migi/Documents/GitHub/peptide/src/state/types.ts <<'EOF'
   export type Sex = 'male' | 'female' | 'other';
   export type AgeBand = '18-29' | '30-39' | '40-49' | '50-59' | '60+';
   export type DoseStatus = 'taken' | 'skipped';
   export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

   export interface Profile {
     sex: Sex | null;
     ageBand: AgeBand | null;
     onboardedAt: string | null; // ISO string
     medicalAck: boolean;
   }

   export interface Peptide {
     id: string;
     name: string;
     nickname?: string;
     category: string; // e.g. "Growth", "Recovery", "Beauty"
     blurb: string;
   }

   export interface ProtocolItem {
     peptideId: string;
     doseMg: number;
     timeOfDay: string; // "07:00" 24h
     daysOfWeek: DayOfWeek[]; // e.g. Mon–Fri => [1,2,3,4,5]
     nickname?: string; // "Night Builder"
   }

   export interface Protocol {
     id: string;
     goalId: string;
     name: string;
     weeks: number;
     injectionsPerWeek: number;
     level: 'Beginner' | 'Intermediate' | 'Advanced';
     costPerWeek?: number; // ~66
     summary: string; // "At a Glance" line
     whyThisStack: { peptideId: string; nickname: string; reason: string }[];
     whatToExpect: { range: string; text: string }[]; // "Week 1", "2-4", "5-8"
     importantToKnow: string[];
     faq: { q: string; a: string }[];
     items: ProtocolItem[];
   }

   export interface Goal {
     id: string;
     name: string; // "Muscle Growth"
     tagline: string; // "Build Lean Muscle Fast"
     blurb: string;
     recommendedProtocolId: string | null;
   }

   export interface UserProtocol {
     id: string;
     protocolId: string;
     startDate: string; // ISO date "2026-06-17"
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
     reconstitutedAt: string; // ISO
   }

   export interface DoseLog {
     id: string;
     userProtocolId: string;
     peptideId: string;
     scheduledFor: string; // ISO datetime of the scheduled occurrence
     status: DoseStatus;
     loggedAt: string; // ISO
   }

   export interface Prefs {
     notificationsEnabled: boolean;
     theme: 'dark';
   }

   export interface AppState {
     profile: Profile;
     peptides: Peptide[]; // seeded
     protocols: Protocol[]; // seeded
     goals: Goal[]; // seeded
     userProtocols: UserProtocol[];
     vials: Vial[];
     doseLogs: DoseLog[];
     prefs: Prefs;
     hydrated: boolean; // false until idb rehydrate completes
   }

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
   EOF
   ```

2. **[ ] Write `src/lib/ids.ts` — `id()` helper per Foundations §10.** Uses `crypto.randomUUID` with a counter fallback for environments that lack it.

   ```bash
   mkdir -p /Users/migi/Documents/GitHub/peptide/src/lib
   cat > /Users/migi/Documents/GitHub/peptide/src/lib/ids.ts <<'EOF'
   let counter = 0;

   /**
    * Generate a unique id. Prefers crypto.randomUUID (browser + jsdom);
    * falls back to a time + counter string where unavailable.
    */
   export const id = (): string => {
     if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
       return crypto.randomUUID();
     }
     counter += 1;
     return `id-${Date.now().toString(36)}-${counter.toString(36)}`;
   };
   EOF
   ```

3. **[ ] Write `src/data/goals.seed.ts` — EXACT Foundations §7 goals.**

   ```bash
   mkdir -p /Users/migi/Documents/GitHub/peptide/src/data
   cat > /Users/migi/Documents/GitHub/peptide/src/data/goals.seed.ts <<'EOF'
   import type { Goal } from '../state/types';

   export const GOALS: Goal[] = [
     {
       id: 'muscle-growth',
       name: 'Muscle Growth',
       tagline: 'Build Lean Muscle Fast',
       blurb: 'Stack growth-hormone secretagogues to build lean mass.',
       recommendedProtocolId: 'muscle-growth-tesa-ipa',
     },
     {
       id: 'injury-recovery',
       name: 'Injury Recovery',
       tagline: 'Heal Faster',
       blurb: 'Support tissue repair.',
       recommendedProtocolId: null,
     },
     {
       id: 'skincare-beauty',
       name: 'Skincare & Beauty',
       tagline: 'Glow From Within',
       blurb: 'Collagen & skin support.',
       recommendedProtocolId: null,
     },
     {
       id: 'energy-performance',
       name: 'Energy & Performance',
       tagline: 'Peak Output',
       blurb: 'Mitochondrial & endurance support.',
       recommendedProtocolId: null,
     },
     {
       id: 'weight-loss',
       name: 'Weight Loss',
       tagline: 'Lean Down',
       blurb: 'Metabolic support.',
       recommendedProtocolId: null,
     },
     {
       id: 'brain-enhancement',
       name: 'Brain Enhancement',
       tagline: 'Sharper Focus',
       blurb: 'Cognitive support.',
       recommendedProtocolId: null,
     },
     {
       id: 'anti-aging',
       name: 'Anti Aging',
       tagline: 'Age Well',
       blurb: 'Longevity support.',
       recommendedProtocolId: null,
     },
   ];
   EOF
   ```

4. **[ ] Write `src/data/peptides.seed.ts` — EXACT Foundations §7 catalog of 10.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/data/peptides.seed.ts <<'EOF'
   import type { Peptide } from '../state/types';

   export const PEPTIDES: Peptide[] = [
     {
       id: 'tesamorelin',
       name: 'Tesamorelin',
       nickname: 'Night Builder',
       category: 'Growth',
       blurb: 'GHRH analog; supports lean mass and fat loss.',
     },
     {
       id: 'ipamorelin',
       name: 'Ipamorelin',
       nickname: 'Morning Pulse',
       category: 'Growth',
       blurb: 'Selective GH secretagogue; gentle GH pulse.',
     },
     {
       id: 'bpc-157',
       name: 'BPC-157',
       category: 'Recovery',
       blurb: 'Body-protection compound; tissue repair.',
     },
     {
       id: 'cjc-1295',
       name: 'CJC-1295 (no DAC)',
       category: 'Growth',
       blurb: 'GHRH analog; pairs with a GHRP.',
     },
     {
       id: 'epitalon',
       name: 'Epitalon',
       category: 'Longevity',
       blurb: 'Telomerase-related peptide.',
     },
     {
       id: 'ghk-cu',
       name: 'GHK-Cu',
       category: 'Beauty',
       blurb: 'Copper peptide; skin and collagen.',
     },
     {
       id: 'kpv',
       name: 'KPV',
       category: 'Recovery',
       blurb: 'Anti-inflammatory tripeptide.',
     },
     {
       id: 'melanotan-2',
       name: 'Melanotan II',
       category: 'Beauty',
       blurb: 'Melanocortin agonist; tanning.',
     },
     {
       id: 'mots-c',
       name: 'MOTS-c',
       category: 'Performance',
       blurb: 'Mitochondrial peptide; metabolism.',
     },
     {
       id: '5-amino-1mq',
       name: '5-Amino-1MQ',
       category: 'Performance',
       blurb: 'NNMT inhibitor; metabolic support.',
     },
   ];
   EOF
   ```

5. **[ ] Write `src/data/protocols.seed.ts` — EXACT Foundations §7 Muscle Growth stack.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/data/protocols.seed.ts <<'EOF'
   import type { Protocol } from '../state/types';

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
         {
           peptideId: 'tesamorelin',
           nickname: 'Night Builder',
           reason: 'Drives nighttime GH for recovery and lean mass.',
         },
         {
           peptideId: 'ipamorelin',
           nickname: 'Morning Pulse',
           reason: 'A clean morning GH pulse without cortisol spikes.',
         },
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
         {
           q: 'Do I need to fast?',
           a: 'A small fasting window around dosing can help GH response.',
         },
         {
           q: 'What if I miss a dose?',
           a: 'Skip it; do not double up. Resume next scheduled time.',
         },
       ],
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
     },
   ];
   EOF
   ```

6. **[ ] Typecheck + format + commit.**
   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   npm run format
   npm run typecheck
   # Expect: tsc exits 0 (no type errors).
   git add -A
   git commit -m "feat: add domain types, id helper and seed data"
   ```

---

## Task 5 — Persistence, reducer, store

**Files:**

- Create: `src/state/persistence.ts`, `src/state/reducer.ts`, `src/state/store.tsx`
- Test: `src/state/reducer.test.ts`

1. **[ ] Write `src/state/persistence.ts` — idb v1 with all §5 stores, `loadAll`, `persistSlice`.** DB name `peps`, schema version 1; `profile`/`prefs` keyed `'singleton'`, the rest keyed by `id`. Also mirrors `peps.onboarded` to `localStorage` is handled in the store, not here.

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/state/persistence.ts <<'EOF'
   import { openDB, type IDBPDatabase } from 'idb';
   import type { AppState } from './types';

   export const DB_NAME = 'peps';
   export const DB_VERSION = 1;

   // Stores keyed by record `id`.
   const COLLECTION_STORES = [
     'peptides',
     'protocols',
     'goals',
     'userProtocols',
     'vials',
     'doseLogs',
   ] as const;

   // Singleton stores: a single record under key 'singleton'.
   const SINGLETON_STORES = ['profile', 'prefs'] as const;

   const SINGLETON_KEY = 'singleton';

   let dbPromise: Promise<IDBPDatabase> | null = null;

   /**
    * Open (or upgrade) the PepS IndexedDB database.
    * ADR-002: bump DB_VERSION and migrate inside `upgrade` on any schema change;
    * never silently drop user data.
    */
   export async function openPepsDb(): Promise<IDBPDatabase> {
     if (!dbPromise) {
       dbPromise = openDB(DB_NAME, DB_VERSION, {
         upgrade(db) {
           for (const name of COLLECTION_STORES) {
             if (!db.objectStoreNames.contains(name)) {
               db.createObjectStore(name, { keyPath: 'id' });
             }
           }
           for (const name of SINGLETON_STORES) {
             if (!db.objectStoreNames.contains(name)) {
               db.createObjectStore(name);
             }
           }
         },
       });
     }
     return dbPromise;
   }

   /**
    * Read every store into partial AppState slices.
    * Returns only the persisted slices; the store merges them over initialState.
    */
   export async function loadAll(): Promise<Partial<AppState>> {
     const db = await openPepsDb();
     const slices: Partial<AppState> = {};

     for (const name of COLLECTION_STORES) {
       const records = await db.getAll(name);
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       (slices as any)[name] = records;
     }

     const profile = await db.get('profile', SINGLETON_KEY);
     if (profile) slices.profile = profile;

     const prefs = await db.get('prefs', SINGLETON_KEY);
     if (prefs) slices.prefs = prefs;

     return slices;
   }

   /**
    * Persist a single state slice to its object store.
    * Collection slices replace the whole store contents; singletons upsert one record.
    */
   export async function persistSlice<K extends keyof AppState>(
     key: K,
     value: AppState[K],
   ): Promise<void> {
     const db = await openPepsDb();

     if ((SINGLETON_STORES as readonly string[]).includes(key as string)) {
       await db.put(key as string, value, SINGLETON_KEY);
       return;
     }

     if ((COLLECTION_STORES as readonly string[]).includes(key as string)) {
       const tx = db.transaction(key as string, 'readwrite');
       await tx.store.clear();
       for (const record of value as unknown as { id: string }[]) {
         await tx.store.put(record);
       }
       await tx.done;
     }
   }

   /** Clear every store (used by RESET_ALL before re-seeding). */
   export async function clearAll(): Promise<void> {
     const db = await openPepsDb();
     for (const name of [...COLLECTION_STORES, ...SINGLETON_STORES]) {
       await db.clear(name);
     }
   }
   EOF
   ```

2. **[ ] Write `src/state/reducer.ts` — Action union (§6) with HYDRATE/SEED/RESET_ALL implemented; all other cases stubbed (return state unchanged) so the union compiles.** Later sprints flesh out the stubs. The intentionally-minimal stubs are marked.

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/state/reducer.ts <<'EOF'
   import {
     type AppState,
     type Goal,
     type Peptide,
     type Protocol,
     type Profile,
     type Vial,
     type DoseLog,
     type Prefs,
     initialState,
   } from './types';

   // Canonical action union (Foundations §6). Sprints add cases, never rename.
   export type Action =
     | { type: 'HYDRATE'; payload: Partial<AppState> }
     | { type: 'SET_PROFILE'; payload: Partial<Profile> }
     | { type: 'ACK_MEDICAL' }
     | { type: 'COMPLETE_ONBOARDING' } // sets onboardedAt
     | { type: 'SEED'; payload: { peptides: Peptide[]; protocols: Protocol[]; goals: Goal[] } }
     | { type: 'START_PROTOCOL'; payload: { protocolId: string; startDate: string } }
     | { type: 'SAVE_VIAL'; payload: Vial }
     | { type: 'REMOVE_VIAL'; payload: { id: string } }
     | { type: 'LOG_DOSE'; payload: DoseLog }
     | { type: 'UNDO_DOSE'; payload: { id: string } }
     | { type: 'SET_PREFS'; payload: Partial<Prefs> }
     | { type: 'RESET_ALL' };

   export function reducer(state: AppState, action: Action): AppState {
     switch (action.type) {
       // --- Implemented in Sprint 0 ---
       case 'HYDRATE':
         return { ...state, ...action.payload, hydrated: true };

       case 'SEED':
         return {
           ...state,
           peptides: action.payload.peptides,
           protocols: action.payload.protocols,
           goals: action.payload.goals,
         };

       case 'RESET_ALL':
         // Reset to a fresh state but keep hydrated=true (we are loaded, just empty).
         // The store re-seeds after dispatching RESET_ALL.
         return { ...initialState, hydrated: true };

       // --- Stubs: fleshed out by later sprints. Return state unchanged so the
       //     union compiles and exhaustiveness is satisfied today. ---
       case 'SET_PROFILE': // Sprint 3
       case 'ACK_MEDICAL': // Sprint 3
       case 'COMPLETE_ONBOARDING': // Sprint 3
       case 'START_PROTOCOL': // Sprint 2
       case 'SAVE_VIAL': // Sprint 1
       case 'REMOVE_VIAL': // Sprint 1
       case 'LOG_DOSE': // Sprint 2
       case 'UNDO_DOSE': // Sprint 2
       case 'SET_PREFS': // Sprint 3
         return state;

       default:
         return assertNever(action);
     }
   }

   function assertNever(action: never): never {
     throw new Error(`Unhandled action: ${JSON.stringify(action)}`);
   }
   EOF
   ```

3. **[ ] Write `src/state/store.tsx` — Context + useReducer + persistence effect skeleton + hooks.** On boot: read `localStorage('peps.onboarded')` is left for Sprint 3 routing; here we hydrate from idb, idempotently seed, and persist affected slices after each dispatch per the §6 mapping.

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/state/store.tsx <<'EOF'
   import {
     createContext,
     useContext,
     useEffect,
     useReducer,
     useRef,
     type ReactNode,
   } from 'react';
   import { reducer, type Action } from './reducer';
   import { initialState, type AppState } from './types';
   import { loadAll, persistSlice, clearAll } from './persistence';
   import { GOALS } from '../data/goals.seed';
   import { PEPTIDES } from '../data/peptides.seed';
   import { PROTOCOLS } from '../data/protocols.seed';

   const StateContext = createContext<AppState | null>(null);
   const DispatchContext = createContext<React.Dispatch<Action> | null>(null);

   // Which slices each action persists (Foundations §6).
   const PERSIST_MAP: Partial<Record<Action['type'], (keyof AppState)[]>> = {
     SET_PROFILE: ['profile'],
     ACK_MEDICAL: ['profile'],
     COMPLETE_ONBOARDING: ['profile'],
     START_PROTOCOL: ['userProtocols'],
     SAVE_VIAL: ['vials'],
     REMOVE_VIAL: ['vials'],
     LOG_DOSE: ['doseLogs'],
     UNDO_DOSE: ['doseLogs'],
     SET_PREFS: ['prefs'],
   };

   export function AppStateProvider({ children }: { children: ReactNode }) {
     const [state, dispatch] = useReducer(reducer, initialState);
     const lastAction = useRef<Action | null>(null);

     // Wrap dispatch to remember the last action for the persistence effect.
     const trackedDispatch: React.Dispatch<Action> = (action) => {
       lastAction.current = action;
       dispatch(action);
     };

     // Boot: hydrate from idb, then idempotently seed catalogs.
     useEffect(() => {
       let cancelled = false;
       (async () => {
         const slices = await loadAll();
         if (cancelled) return;
         dispatch({ type: 'HYDRATE', payload: slices });

         // Idempotent seeding: write to idb only if a store is empty.
         const needsSeed =
           !slices.peptides?.length || !slices.protocols?.length || !slices.goals?.length;
         if (needsSeed) {
           dispatch({
             type: 'SEED',
             payload: { peptides: PEPTIDES, protocols: PROTOCOLS, goals: GOALS },
           });
           await persistSlice('peptides', PEPTIDES);
           await persistSlice('protocols', PROTOCOLS);
           await persistSlice('goals', GOALS);
         }
       })();
       return () => {
         cancelled = true;
       };
     }, []);

     // After each tracked dispatch, persist the affected slice(s).
     useEffect(() => {
       const action = lastAction.current;
       if (!action || !state.hydrated) return;

       if (action.type === 'RESET_ALL') {
         (async () => {
           await clearAll();
           dispatch({
             type: 'SEED',
             payload: { peptides: PEPTIDES, protocols: PROTOCOLS, goals: GOALS },
           });
           await persistSlice('peptides', PEPTIDES);
           await persistSlice('protocols', PROTOCOLS);
           await persistSlice('goals', GOALS);
         })();
         lastAction.current = null;
         return;
       }

       const keys = PERSIST_MAP[action.type];
       if (keys) {
         for (const key of keys) {
           void persistSlice(key, state[key]);
         }
       }
       lastAction.current = null;
     }, [state]);

     return (
       <StateContext.Provider value={state}>
         <DispatchContext.Provider value={trackedDispatch}>{children}</DispatchContext.Provider>
       </StateContext.Provider>
     );
   }

   export function useAppState(): AppState {
     const ctx = useContext(StateContext);
     if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
     return ctx;
   }

   export function useDispatch(): React.Dispatch<Action> {
     const ctx = useContext(DispatchContext);
     if (!ctx) throw new Error('useDispatch must be used within AppStateProvider');
     return ctx;
   }
   EOF
   ```

4. **[ ] Write `src/state/reducer.test.ts` — unit-test the implemented reducer cases.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/state/reducer.test.ts <<'EOF'
   import { describe, it, expect } from 'vitest';
   import { reducer } from './reducer';
   import { initialState } from './types';
   import { GOALS } from '../data/goals.seed';
   import { PEPTIDES } from '../data/peptides.seed';
   import { PROTOCOLS } from '../data/protocols.seed';

   describe('reducer', () => {
     it('HYDRATE merges payload and sets hydrated', () => {
       const next = reducer(initialState, {
         type: 'HYDRATE',
         payload: { prefs: { notificationsEnabled: true, theme: 'dark' } },
       });
       expect(next.hydrated).toBe(true);
       expect(next.prefs.notificationsEnabled).toBe(true);
     });

     it('SEED loads catalogs', () => {
       const next = reducer(initialState, {
         type: 'SEED',
         payload: { peptides: PEPTIDES, protocols: PROTOCOLS, goals: GOALS },
       });
       expect(next.peptides).toHaveLength(10);
       expect(next.protocols).toHaveLength(1);
       expect(next.goals).toHaveLength(7);
     });

     it('RESET_ALL returns a fresh hydrated state', () => {
       const dirty = reducer(initialState, {
         type: 'SEED',
         payload: { peptides: PEPTIDES, protocols: PROTOCOLS, goals: GOALS },
       });
       const next = reducer(dirty, { type: 'RESET_ALL' });
       expect(next.peptides).toHaveLength(0);
       expect(next.hydrated).toBe(true);
     });

     it('stubbed actions return state unchanged', () => {
       const seeded = reducer(initialState, {
         type: 'SEED',
         payload: { peptides: PEPTIDES, protocols: PROTOCOLS, goals: GOALS },
       });
       const next = reducer(seeded, { type: 'SET_PREFS', payload: { notificationsEnabled: true } });
       expect(next).toBe(seeded);
     });
   });
   EOF
   ```

5. **[ ] Typecheck, test, format, commit.**
   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   npm run format
   npm run typecheck
   npm run test
   # Expect: tsc 0 errors; vitest "4 passed".
   git add -A
   git commit -m "feat: add persistence, pure reducer and context store with seeding"
   ```

---

## Task 6 — Router shell: TabBar, placeholder screens, App, main

**Files:**

- Create: `src/components/TabBar.tsx`, `src/components/TabBar.css`, `src/features/home/HomeScreen.tsx`, `src/features/explore/ExploreScreen.tsx`, `src/features/reconstitute/ReconstituteScreen.tsx`, `src/App.tsx`, `src/App.css`, `src/main.tsx`
- Test: `src/App.test.tsx`

1. **[ ] Write `src/components/TabBar.tsx` — bottom 3-tab nav per Foundations §10 (Home `/`, Explore `/explore`, Reconstitute `/reconstitute`).**

   ```bash
   mkdir -p /Users/migi/Documents/GitHub/peptide/src/components
   cat > /Users/migi/Documents/GitHub/peptide/src/components/TabBar.tsx <<'EOF'
   import { NavLink } from 'react-router-dom';
   import './TabBar.css';

   const TABS = [
     { to: '/', label: 'Home', end: true },
     { to: '/explore', label: 'Explore', end: false },
     { to: '/reconstitute', label: 'Reconstitute', end: false },
   ];

   export function TabBar() {
     return (
       <nav className="tabbar" aria-label="Primary">
         {TABS.map((tab) => (
           <NavLink
             key={tab.to}
             to={tab.to}
             end={tab.end}
             className={({ isActive }) => (isActive ? 'tabbar__link is-active' : 'tabbar__link')}
           >
             {tab.label}
           </NavLink>
         ))}
       </nav>
     );
   }
   EOF
   ```

2. **[ ] Write `src/components/TabBar.css`.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/components/TabBar.css <<'EOF'
   .tabbar {
     position: fixed;
     bottom: 0;
     left: 50%;
     transform: translateX(-50%);
     width: 100%;
     max-width: var(--app-max);
     height: var(--tabbar-h);
     display: flex;
     align-items: stretch;
     background: var(--bg-1);
     border-top: 1px solid var(--border);
     padding-bottom: env(safe-area-inset-bottom);
     z-index: 10;
   }

   .tabbar__link {
     flex: 1;
     display: flex;
     align-items: center;
     justify-content: center;
     font-size: var(--t-sm);
     color: var(--text-2);
   }

   .tabbar__link.is-active {
     color: var(--amber);
     font-weight: 600;
   }
   EOF
   ```

3. **[ ] Write the three placeholder screens.**

   ```bash
   mkdir -p /Users/migi/Documents/GitHub/peptide/src/features/home \
            /Users/migi/Documents/GitHub/peptide/src/features/explore \
            /Users/migi/Documents/GitHub/peptide/src/features/reconstitute

   cat > /Users/migi/Documents/GitHub/peptide/src/features/home/HomeScreen.tsx <<'EOF'
   export function HomeScreen() {
     return (
       <section>
         <h1>Home</h1>
         <p>Your protocol dashboard will live here.</p>
       </section>
     );
   }
   EOF

   cat > /Users/migi/Documents/GitHub/peptide/src/features/explore/ExploreScreen.tsx <<'EOF'
   export function ExploreScreen() {
     return (
       <section>
         <h1>Explore</h1>
         <p>Browse protocols and the peptide catalog here.</p>
       </section>
     );
   }
   EOF

   cat > /Users/migi/Documents/GitHub/peptide/src/features/reconstitute/ReconstituteScreen.tsx <<'EOF'
   export function ReconstituteScreen() {
     return (
       <section>
         <h1>Reconstitute</h1>
         <p>Reconstitution calculator and your kit will live here.</p>
       </section>
     );
   }
   EOF
   ```

4. **[ ] Write `src/App.tsx` — router + layout + TabBar.** Sprint 0 wires only the three tab routes; other routes (`/onboarding/*`, `/goals`, etc. per §10) are added by later sprints.

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/App.tsx <<'EOF'
   import { Routes, Route, Navigate } from 'react-router-dom';
   import { TabBar } from './components/TabBar';
   import { HomeScreen } from './features/home/HomeScreen';
   import { ExploreScreen } from './features/explore/ExploreScreen';
   import { ReconstituteScreen } from './features/reconstitute/ReconstituteScreen';
   import './App.css';

   export default function App() {
     return (
       <div className="app">
         <main className="app__main">
           <Routes>
             <Route path="/" element={<HomeScreen />} />
             <Route path="/explore" element={<ExploreScreen />} />
             <Route path="/reconstitute" element={<ReconstituteScreen />} />
             <Route path="*" element={<Navigate to="/" replace />} />
           </Routes>
         </main>
         <TabBar />
       </div>
     );
   }
   EOF
   ```

5. **[ ] Write `src/App.css`.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/App.css <<'EOF'
   .app {
     min-height: 100%;
   }

   .app__main {
     padding: var(--s-5) var(--s-4);
     padding-bottom: calc(var(--tabbar-h) + var(--s-5));
   }

   .app__main h1 {
     font-family: var(--font-display);
     font-size: var(--t-h1);
     margin-bottom: var(--s-3);
   }

   .app__main p {
     color: var(--text-1);
   }
   EOF
   ```

6. **[ ] Write `src/main.tsx` — mount `<App/>` inside `<AppStateProvider>` and `<BrowserRouter>`, import global styles.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/main.tsx <<'EOF'
   import { StrictMode } from 'react';
   import { createRoot } from 'react-dom/client';
   import { BrowserRouter } from 'react-router-dom';
   import App from './App';
   import { AppStateProvider } from './state/store';
   import './styles/global.css';

   createRoot(document.getElementById('root')!).render(
     <StrictMode>
       <AppStateProvider>
         <BrowserRouter>
           <App />
         </BrowserRouter>
       </AppStateProvider>
     </StrictMode>,
   );
   EOF
   ```

7. **[ ] Write `src/App.test.tsx` — smoke test (App renders + tabs present).** Wraps App in the same providers as production.

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/src/App.test.tsx <<'EOF'
   import { describe, it, expect } from 'vitest';
   import { render, screen } from '@testing-library/react';
   import { MemoryRouter } from 'react-router-dom';
   import App from './App';
   import { AppStateProvider } from './state/store';

   function renderApp(initialPath = '/') {
     return render(
       <AppStateProvider>
         <MemoryRouter initialEntries={[initialPath]}>
           <App />
         </MemoryRouter>
       </AppStateProvider>,
     );
   }

   describe('App', () => {
     it('renders the Home screen by default', () => {
       renderApp('/');
       expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
     });

     it('renders the three primary tabs', () => {
       renderApp('/');
       const nav = screen.getByRole('navigation', { name: 'Primary' });
       expect(nav).toBeInTheDocument();
       expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
       expect(screen.getByRole('link', { name: 'Explore' })).toBeInTheDocument();
       expect(screen.getByRole('link', { name: 'Reconstitute' })).toBeInTheDocument();
     });

     it('routes to the Explore screen', () => {
       renderApp('/explore');
       expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();
     });

     it('routes to the Reconstitute screen', () => {
       renderApp('/reconstitute');
       expect(screen.getByRole('heading', { name: 'Reconstitute' })).toBeInTheDocument();
     });
   });
   EOF
   ```

   Note: jsdom has no IndexedDB, so the store's boot effect's `loadAll()` will reject; that is harmless for these render tests (the rejection is unhandled inside the effect and does not fail rendering). If a later sprint needs idb in tests, add `fake-indexeddb` then. For Sprint 0 the smoke tests assert only rendered output.

8. **[ ] Run the full local gate.**

   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   npm run format
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   # Expect: lint 0 errors; tsc 0 errors; vitest "8 passed" (4 reducer + 4 App); build writes dist/.
   ```

9. **[ ] Manually verify the 3 tabs navigate in the dev server.**

   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   npm run dev
   # Open the printed http://localhost:5173 — confirm Home shows, and clicking
   # Explore / Reconstitute swaps the heading. Ctrl-C to stop.
   ```

10. **[ ] Commit the shell.**
    ```bash
    cd /Users/migi/Documents/GitHub/peptide
    git add -A
    git commit -m "feat: add router shell, tab bar, placeholder screens and smoke tests"
    ```

---

## Task 7 — ADRs

**Files:**

- Create: `docs/adr/ADR-001-local-first.md`, `docs/adr/ADR-002-indexeddb-migrations.md`, `docs/adr/ADR-003-context-usereducer.md`

1. **[ ] Write ADR-001 (Foundations §9).**

   ```bash
   mkdir -p /Users/migi/Documents/GitHub/peptide/docs/adr
   cat > /Users/migi/Documents/GitHub/peptide/docs/adr/ADR-001-local-first.md <<'EOF'
   # ADR-001: Local-first, no backend

   **Status:** Accepted

   **Context:** PepS is a personal peptide tracker MVP. We want offline use, fast iteration, and minimal operational surface.

   **Decision:** Build the app local-first with no backend. All user data lives on-device (IndexedDB). No server, no accounts.

   **Consequences:**
   - Give up: cross-device sync and real authentication.
   - Gain: full offline support, zero infrastructure cost, and a small attack surface.
   EOF
   ```

2. **[ ] Write ADR-002 (Foundations §9).**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/docs/adr/ADR-002-indexeddb-migrations.md <<'EOF'
   # ADR-002: IndexedDB with versioned migrations

   **Status:** Accepted

   **Context:** Local data (vials, dose logs, protocols) is structured and will grow. We need durable, scalable on-device storage that evolves safely.

   **Decision:** Use IndexedDB via the `idb` library with an explicit schema version. On any schema change, bump the version and migrate inside the `upgrade` callback; never silently drop user data.

   **Consequences:**
   - Give up: the simplicity of localStorage.
   - Gain: structured, scalable local data with controlled, non-destructive migrations.
   EOF
   ```

3. **[ ] Write ADR-003 (Foundations §9).**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/docs/adr/ADR-003-context-usereducer.md <<'EOF'
   # ADR-003: Context + useReducer over Redux/Zustand

   **Status:** Accepted

   **Context:** State is modest (profile, seeded catalogs, vials, dose logs, prefs). We want a pure, testable reducer without extra runtime dependencies.

   **Decision:** Use React Context + `useReducer`. The reducer is a pure function (unit-tested); the store wires it to Context and a persistence effect.

   **Consequences:**
   - Give up: the Redux/Zustand devtools and middleware ecosystem.
   - Gain: zero additional runtime dependencies, right-sized for an MVP.
   EOF
   ```

4. **[ ] Commit ADRs.**
   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   git add -A
   git commit -m "docs: add ADR-001..003"
   ```

---

## Task 8 — CI, Vercel deploy config, README

**Files:**

- Create: `.github/workflows/ci.yml`, `vercel.json`
- Modify: `README.md`

1. **[ ] Write `.github/workflows/ci.yml` — install → lint → typecheck → test → build on PR + push to main.**

   ```bash
   mkdir -p /Users/migi/Documents/GitHub/peptide/.github/workflows
   cat > /Users/migi/Documents/GitHub/peptide/.github/workflows/ci.yml <<'EOF'
   name: CI

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: npm

         - name: Install
           run: npm ci

         - name: Lint
           run: npm run lint

         - name: Typecheck
           run: npm run typecheck

         - name: Test
           run: npm run test

         - name: Build
           run: npm run build
   EOF
   ```

2. **[ ] Write `vercel.json` — SPA rewrite so client routes resolve.**

   ```bash
   cat > /Users/migi/Documents/GitHub/peptide/vercel.json <<'EOF'
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   EOF
   ```

3. **[ ] Replace `README.md` with setup/build/test/deploy docs.**

   ````bash
   cat > /Users/migi/Documents/GitHub/peptide/README.md <<'EOF'
   # PepS

   A local-first peptide tracker (React + Vite + TypeScript). All data stays on your
   device in IndexedDB — no backend, works offline.

   ## Requirements

   - Node.js 20+
   - npm

   ## Setup

   ```bash
   npm install
   ````

   ## Develop

   ```bash
   npm run dev      # start the Vite dev server (http://localhost:5173)
   ```

   ## Quality gates

   ```bash
   npm run lint         # ESLint
   npm run format       # Prettier (write)
   npm run format:check # Prettier (check only)
   npm run typecheck    # tsc, no emit
   npm run test         # Vitest (run once)
   npm run test:watch   # Vitest (watch)
   ```

   A Husky pre-commit hook runs `lint-staged` (Prettier + ESLint --fix on staged files).

   ## Build

   ```bash
   npm run build    # type-check then produce a production build in dist/
   npm run preview  # preview the production build locally
   ```

   ## Continuous integration

   GitHub Actions (`.github/workflows/ci.yml`) runs install → lint → typecheck → test →
   build on every pull request and on pushes to `main`.

   ## Deploy (Vercel)

   Hosting target is **Vercel**.

   - Import this repository into Vercel once. Framework preset: **Vite**
     (build command `npm run build`, output directory `dist`).
   - `vercel.json` adds an SPA rewrite (`/(.*) -> /index.html`) so client-side
     routes resolve on refresh/deep-link.
   - Vercel auto-deploys: every push to `main` ships to production; pull requests get
     preview deployments automatically.

   ## Project docs
   - Architecture & shared contracts: `docs/superpowers/plans/2026-06-17-peps-00-foundations.md`
   - Architecture decisions: `docs/adr/`
     EOF

   ```

   ```

4. **[ ] Verify CI steps pass locally one more time, then commit.**

   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   npm run lint && npm run typecheck && npm run test && npm run build
   # Expect: all four succeed; dist/ produced.
   git add -A
   git commit -m "ci: add GitHub Actions pipeline, Vercel SPA config and README"
   ```

5. **[ ] (Optional, if pushing) push and confirm CI is green.** Only if the user wants the branch pushed.
   ```bash
   cd /Users/migi/Documents/GitHub/peptide
   git push -u origin main
   gh run watch
   # Expect: CI workflow completes successfully (lint/typecheck/test/build all green).
   ```

---

## Sprint 0 DoD checklist

- [ ] `npm install` succeeds; runtime deps are exactly `react`, `react-dom`, `react-router-dom`, `idb` (all else dev-only).
- [ ] Existing `LICENSE`, `README.md` (now updated), and `docs/` were preserved — scaffold did not clobber them.
- [ ] `npm run lint` and `npm run format:check` pass clean.
- [ ] `npm run typecheck` passes (0 errors); the full Action union from Foundations §6 compiles.
- [ ] `npm run test` passes — reducer unit tests + App smoke test green (a trivial "App renders" test passes).
- [ ] `npm run build` succeeds and produces `dist/`.
- [ ] App runs (`npm run dev`); the 3 tabs (Home `/`, Explore `/explore`, Reconstitute `/reconstitute`) navigate via `<TabBar>`.
- [ ] `src/styles/tokens.css` matches Foundations §8 exactly; `global.css` provides resets + `:focus-visible` ring.
- [ ] `src/state/types.ts` matches Foundations §4 exactly (incl `initialState`); seed files match §7 exactly.
- [ ] `src/state/persistence.ts` opens `peps` DB v1 with all §5 stores and exposes `openPepsDb`/`loadAll`/`persistSlice`.
- [ ] Store hydrates from idb and seeds idempotently (catalogs only written when empty).
- [ ] ADR-001..003 exist under `docs/adr/`.
- [ ] `.github/workflows/ci.yml` runs install → lint → typecheck → test → build on PR + push to `main`; CI is green.
- [ ] `vercel.json` SPA rewrite present; README documents the Vercel auto-deploy-from-`main` flow.
- [ ] Husky pre-commit gate runs `lint-staged` on staged files.
