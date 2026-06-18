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
