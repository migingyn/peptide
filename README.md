# PepS

A local-first peptide tracker (React + Vite + TypeScript). All data stays on your
device in IndexedDB — no backend, works offline.

The app has three primary tabs: **Home** (`/`), **Explore** (`/explore`), and
**Reconstitute** (`/reconstitute`).

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
```

## Develop

```bash
npm run dev      # start the Vite dev server (http://localhost:5173)
```

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # type-check (tsc -b) then produce a production build in dist/
npm run preview      # preview the production build locally
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run format:check # Prettier (check only)
npm run typecheck    # tsc -b (no emit)
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch)
```

A Husky pre-commit hook runs `lint-staged` (Prettier + ESLint `--fix`) on staged files.

## Build

```bash
npm run build    # type-check then produce a production build in dist/
npm run preview  # preview the production build locally
```

## Test

```bash
npm run test     # run the Vitest suite once (reducer unit tests + App smoke tests)
```

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs install → lint → typecheck → test →
build on every pull request and on every push to `main`.

## Deploy (Vercel)

Hosting target is **Vercel**.

- Import this repository into Vercel once. Framework preset: **Vite**
  (build command `npm run build`, output directory `dist`).
- `vercel.json` adds an SPA rewrite (`/(.*) -> /index.html`) so client-side
  routes resolve on refresh and deep-link.
- Vercel auto-deploys: every push to `main` ships to production; pull requests get
  preview deployments automatically.

## Project docs

- Product requirements: [`docs/PepS_PRD.md`](./docs/PepS_PRD.md)
- Implementation plans: [`docs/superpowers/plans/`](./docs/superpowers/plans/README.md)
- Architecture & shared contracts:
  [`docs/superpowers/plans/2026-06-17-peps-00-foundations.md`](./docs/superpowers/plans/2026-06-17-peps-00-foundations.md)
- Architecture decisions: [`docs/adr/`](./docs/adr)

## Walkthrough

End-to-end first-run flow:

1. **Onboarding** — Splash ("Find your protocol") → "What's your sex?" → "How old are you?" → value-prop carousel → medical gate ("This app is not medical advice" → "I understand").
2. **Get started** — choose "Match my goal".
3. **Goals** — pick a goal from the grid (e.g. _Muscle Growth_ → "Build Lean Muscle Fast").
4. **Proceed** — "See Recommended Protocol" (goals without a recommended protocol show a graceful "coming soon" state).
5. **Protocol detail** — At a Glance, Why This Stack, What to Expect, Important to Know, FAQ → **Start Protocol**.
6. **Start** — pick a start date → the schedule is generated.
7. **Reconstitute** — mix the first dose; tap **Guide Me** for the 5-step illustrated walkthrough (Sanitize → Equalize Pressure → Draw & Inject Water → Dissolve → Draw Dose).
8. **Home** — see today's doses and check them off.

### Settings & data

- **Dose reminders** — opt-in browser notifications (feature-detected; degrades when unsupported or denied).
- **Reset / delete all data** — wipes all local data and returns to onboarding.

### Video walkthrough

A short screen-recorded walkthrough of the full flow above is included as a project deliverable (link/file in the submission).
