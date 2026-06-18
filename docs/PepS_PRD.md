# 📄 PepS — Product Requirements Document (PRD)

> MVP clone of **The Peptide App: Tracker** (iOS). Built as a local-first React web app for the CSE 110 project. Written to hand off cleanly to Claude Code: every section is concrete, scoped, and dependency-light. Flow and screens below are taken from the captured app screenshots (`Peptide App.pdf`), not guessed.

---

## 0. Document Info

- **Product Name:** PepS
- **Version:** 1.0 (MVP)
- **Date:** 2026-06-17
- **Purpose:** Define a buildable MVP that replicates the core functionality and flow of The Peptide App — onboarding → goal/protocol selection → reconstitution → daily dose tracking — on a minimal, Claude-Code-friendly stack, with the SWE practices from CSE 110 baked into the process.

**Fidelity source:** captured screenshots covering Onboarding (10), Choosing Goals (4), Muscle Growth Goal (10), Outcome-tracking steps (6), Reconstitution Calculator (6), Reconstitution Guide (4), Home/Dashboard, Explore (Protocols + Peptides), and the Reconstitution kit page.

---

## 1. Project Overview

### 1.1 Summary

- **What is the product?** A local-first peptide protocol companion. PepS takes a user from a goal to a curated protocol, walks them through reconstituting each vial (how much water to add, how many syringe units to draw), and then runs that protocol as a daily dose schedule they check off.
- **Who is it for?** People self-administering peptides who need the dosing math done for them and a reliable daily schedule to stay consistent.
- **What problem does it solve?** Reconstitution math is error-prone and adherence is hard. PepS removes the math and turns a protocol into a trackable, reminder-driven schedule.
- **Why does it matter?** Dosing errors are the highest-risk, lowest-tooling part of the workflow; correct math plus a reliable schedule is the smallest slice that delivers real value — the "smaller and bounded project" the course recommends.

### 1.2 Value Proposition

- **Core benefit:** Go from "I picked a goal" to "I know exactly how much to draw and when" in a few taps.
- **Differentiation:** Local-first (data on device, works offline, no account wall), guided reconstitution, and a clean daily dose loop.
- **Key insight:** The **reconstitution calculator** is the wedge feature ("The calculator alone is worth it" — testimonial in-app). It's self-contained, easy to verify, and the thing users return to. Build the wedge well; everything else hangs off it.

### 1.3 Target Users

- **Primary persona — "Cautious First-Timer":** Wants confidence the dose is correct and a structure to follow. The app's "We'll walk you through it" promise targets exactly this user.
- **Secondary persona — "Consistent Runner":** Comfortable already; mainly wants fast daily logging and a kit overview.

---

## 2. Goals & Success Metrics

### 2.1 Goals

- **Goal 1 — Correctness:** A reconstitution calculator that produces verifiably correct concentration and **units-to-draw** for any valid vial/water/dose input (matches the app's numbers).
- **Goal 2 — Adherence loop:** A goal → protocol → reconstitute → daily-dose flow where the user can check off today's doses and see week progress.
- **Goal 3 — Clean handoff:** A repo + PRD clean enough that a fresh contributor (or Claude Code) can build, test, and deploy without tribal knowledge.

### 2.2 Non-Goals

- No medical advice; the "This app is not medical advice" gate is reproduced as a disclaimer.
- No real backend, accounts, or cloud sync in the MVP (local-first only).
- No native push; reminders are in-app (dose times shown) + optional browser Notification.
- No Discord/"Ask an expert," no vendor sourcing/cost data, no body-scan device integrations.
- Progress photos and full outcome analytics are **P1** (the onboarding "steps of goal" tracker is stubbed, not fully built, in P0).

### 2.3 KPIs / Success Metrics

- **Activation:** % of new users who finish onboarding and start a protocol.
- **Wedge usage:** # of reconstitutions completed.
- **Core action:** doses checked off per active user per week (adherence proxy).
- **Retention (Day 1 / Day 7):** returns to the Home dashboard to log doses.
- **Quality (engineering KPI):** CI pass rate, % of calculator/schedule logic covered by unit tests, build-to-deploy success rate.

---

## 3. Tech Stack

Chosen for **minimal dependency hell** and **clean translation to Claude Code**. Local-first → no server, no DB provisioning, no auth config.

| Layer | Technology | Notes |
|---|---|---|
| Frontend | **React 18 + Vite + TypeScript** | Vite is the only build tool. TS for safe refactors. Claude Code is highly fluent here. |
| Styling | **Plain CSS + CSS variables (design tokens)** | No Tailwind/UI-kit dependency. One `tokens.css` drives the dark/indigo theme. |
| State Management | **React Context + `useReducer`** | No Redux/Zustand at MVP size. One typed app store + actions. |
| Persistence (DB) | **IndexedDB via `idb`** | Local-first. `idb` is a tiny promise wrapper; the only data dependency. `localStorage` for prefs/onboarding flags. |
| Routing | **React Router** | Three tabs (Home / Explore / Reconstitute) + stacked onboarding & calculator routes. |
| Backend / APIs | **None (P0)** | All logic client-side. Optional browser `Notification` API. |
| Testing | **Vitest + React Testing Library** | Vitest shares Vite config (no separate toolchain). Pure logic gets unit tests. |
| Tooling | **ESLint + Prettier + Husky + lint-staged** | Pre-commit gate. Mirrors the lecture's pre-commit-check stage. |
| CI/CD | **GitHub Actions → Vercel/Netlify** | Static SPA build; auto-deploy on merge to `main`. Free hosting = the live-URL deliverable. |

**Runtime dependency budget:** `react`, `react-dom`, `react-router-dom`, `idb`. Everything else is dev-only.

> **ADR-001 — No backend (local-first).** Trade-off: we lose cross-device sync and real auth; we gain offline support, zero infra cost, and a much smaller dependency/attack surface. Aligns with the lecture's *local-first*, *minimalism*, *fewer-tools-is-better* themes.

---

## 4. Core Features

### 4.1 Feature List

| Feature | Description | Priority |
|---|---|---|
| Onboarding | Splash ("Find your protocol") → sex → age → value-prop carousel → **"not medical advice"** gate. Stores light profile locally. | **P0** |
| Goal selection + protocol match | "How do you want to get started?" → "What's your goal?" (7 goals) → goal intro → "We found one for you" → **protocol detail** (At a Glance, Why This Stack, What to Expect, Important to Know, FAQ) → **Start Protocol**. | **P0** |
| Reconstitution Calculator | Per peptide: set **vial size (mg)**, **water (mL)**, **dose**, via chips + number pad → outputs concentration and **"draw to N units"** (U-100), with a units↔mL toggle and a "Why N mL?" explainer. | **P0** |
| Guided Reconstitution ("Guide Me") | 5-step illustrated guide: Sanitize → Equalize Pressure → Draw & Inject water → Dissolve → Draw dose. Carries the dose/vial/water/units summary in the header. | **P0** |
| Home / Dashboard | Week ring ("Week 1/8"), MON–SUN date strip, **"Today's doses"** cards with checkboxes + dose time + units, "Upcoming doses," My Peptides. Bottom tabs. | **P0** |
| Reconstitute kit page | "N vials in your kit," per-vial cards (RECONSTITUTED, mg/mL · u draw · mg, Fresh, day count), `+` to add. | **P0** |
| Explore | Tabs **Protocols** (curated combos) and **Peptides** (catalog grid with categories + search). Tapping routes into protocol/peptide detail. | P1 |
| Outcome tracking | The 4-step "how you'll know it's working" + baselines + progress photos from onboarding, plus "Track an outcome" on Home. | P1 |
| Custom stack / blends | "Add current stack," multi-peptide blends. | P2 |

### 4.2 Functional Requirements

**Users should be able to:**
- Complete onboarding (sex, age), acknowledge the not-medical-advice gate, and land in the app.
- Pick a goal and start a **recommended protocol** (seeded). Muscle Growth = Tesamorelin + Ipamorelin, 8 weeks, 5×/week.
- For each peptide in the protocol, run the **calculator**: enter vial mg, water mL, and dose → see concentration and **units to draw**; toggle units↔mL; save the reconstituted vial to their kit.
- Open the **Guide Me** step-by-step reconstitution walkthrough.
- See **Today's doses** on Home with the correct units and time, and **check each off** (logged); navigate the week strip.
- See their **kit** on the Reconstitute tab with each vial's concentration, draw units, and status.
- Use the app fully **offline**, with all data persisted on-device between sessions; reset/delete data.

**System should:**
- Compute reconstitution deterministically and correctly; reject invalid input (≤0, NaN, water 0).
- Generate the dose schedule from a protocol (peptides × times × frequency × cycle length) and surface "today."
- Persist all state to IndexedDB and rehydrate on load; never block the core flow on network.
- Mark a protocol's week/progress (e.g., Week 1/8) from start date + cycle length.
- Optionally fire a browser notification at dose time when permission is granted; degrade gracefully when denied.

**Definition of Done (per feature):** code + unit/integration tests pass in CI, lint/format clean, no console errors, works offline, screen matches the captured flow, documented in README.

---

## 5. User Flow & UX Design

### 5.1 Key User Flow (matches the screenshots)

1. **Splash** → "Find your protocol."
2. **Onboarding** → "What's your sex?" → "How old are you?" → value-prop carousel → **"This app is not medical advice" → I understand.**
3. **Get started** → "How do you want to get started?" (Match my goal / Choose a peptide / Browse protocols / Add current stack) → **"What's your goal?"** (Muscle Growth, Injury Recovery, Skincare & Beauty, Energy & Performance, Weight Loss, Brain Enhancement, Anti Aging).
4. **Goal intro** → "Build Lean Muscle Fast" → "What's going on?" → **"How would you like to proceed?"** (See Recommended Protocol / Pick a Specific Peptide) → **"We found one for you."**
5. **Protocol detail** → At a Glance (Beginner · 8 weeks · ~$66/wk · 5× weekly) → Why This Stack (Tesamorelin "Night Builder", Ipamorelin "Morning Pulse") → What to Expect (Week 1 / 2–4 / 5–8) → Important to Know → FAQ → **Start Protocol** → pick start date.
6. **Reconstitute** → "Mix before your first dose" (0/2 vials) → per vial: **vial size (mg) → water (mL) → dose → "draw to N units"** → Save & Close, or **Guide Me** (5 steps).
7. **Home dashboard** → "Week 1/8," week strip, **Today's doses** (Ipamorelin 0.1 mg / 10 units @ 7:00 AM; Tesamorelin 1 mg / 50 units @ 10:00 PM) → check off as taken.
8. **Re-engage** → return daily via dose times/notification; **Reconstitute** tab shows the kit; **Explore** browses more protocols/peptides.

Navigation: persistent bottom tab bar — **Home · Explore · Reconstitute** (exactly the app). The calculator and Guide are stacked routes reached from Reconstitute / protocol start; onboarding is a pre-app stacked flow.

### 5.2 Design Principles

- **Design style:** Dark, premium, mobile-first. Deep navy → indigo gradients, glassy rounded cards, **orange/amber primary CTA** (e.g., "Start Protocol," "Mix Tesamorelin"), indigo secondary, soft shadows, generous spacing, large tap targets. Serif display headings on some marketing/protocol screens, sans for UI.
- **UX philosophy:** Reduce friction and *guide the user* (UCD). The calculator's job is "no math, no guesswork." Strong empty states that teach the next action ("Add a peptide," "0/2 vials reconstituted").
- **Accessibility:** Semantic HTML, labeled inputs, `inputmode="decimal"` on numeric fields, keyboard navigable, visible focus, WCAG AA contrast on the dark theme, `prefers-reduced-motion` respected.

---

## 6. Architecture, Data Model & Build Plan

### 6.1 Component Structure

```
src/
  main.tsx                 # entry
  App.tsx                  # router + AppStateProvider + tab layout
  state/
    store.tsx              # Context + useReducer, typed actions
    persistence.ts         # idb read/write, schema versioning
  lib/
    reconstitution.ts      # PURE — calculator core (heavily unit-tested)
    schedule.ts            # PURE — generate dose occurrences from a protocol
    notifications.ts       # browser Notification wrapper (feature-detected)
  features/
    onboarding/            # splash, sex, age, carousel, medical-gate
    goals/                 # get-started, goal grid, goal intro, proceed
    protocol/              # protocol detail, why-this-stack, what-to-expect, FAQ, start
    reconstitute/          # CalculatorView, GuideMe (5 steps), KitView
    home/                  # Dashboard: week strip, Today's doses, log/check-off
    explore/               # Protocols + Peptides tabs (P1)
  components/              # Button, Chip, NumberPad, Card, TabBar, ProgressRing, EmptyState
  data/
    peptides.seed.ts       # catalog (Tesamorelin, Ipamorelin, BPC-157, ...)
    protocols.seed.ts      # Muscle Growth (Tesa+Ipa), etc.
    goals.seed.ts          # 7 goals
  styles/tokens.css
```

**Principle:** all real logic lives in pure functions in `lib/` (no React, no I/O). Views are thin. The high-risk math is testable in isolation — avoiding "Death Star" architecture where everything depends on everything.

### 6.2 State Management

- One typed app state: `{ profile, peptides[], protocols[], userProtocols[], vials[], doseLogs[], prefs }`.
- `useReducer` with explicit actions (`SET_PROFILE`, `START_PROTOCOL`, `SAVE_VIAL`, `LOG_DOSE`, `UNDO_DOSE`, …).
- A persistence middleware writes changes to IndexedDB; on boot, state rehydrates. In-memory SSoT, durable copy on device.

### 6.3 Data Model (IndexedDB stores)

```ts
Profile      { sex, ageBand, onboardedAt, medicalAck: boolean }
Peptide      { id, name, nickname?, category, blurb }            // catalog (seed)
Protocol     { id, goalId, name, weeks, injectionsPerWeek, items: ProtocolItem[] }  // seed
ProtocolItem { peptideId, doseMg, timeOfDay, daysOfWeek }
UserProtocol { id, protocolId, startDate, active }               // a started protocol
Vial         { id, peptideId, vialMg, waterMl, doseMg,           // a reconstituted vial
               concentrationMgPerMl, drawUnits, reconstitutedAt }
DoseLog      { id, userProtocolId, peptideId, scheduledFor, status: 'taken'|'skipped', loggedAt }
Prefs        { notificationsEnabled, theme }
```

Store a schema `version`; bump + migrate on change (don't silently break existing local data — **ADR-002: IndexedDB w/ versioned migrations**).

### 6.4 Reconstitution Math (spec — implement exactly, then unit-test)

Given vial mass `M` (mg), bacteriostatic water `W` (mL), dose `D` (mg), using a **U-100 insulin syringe** (1 mL = 100 units):

```
concentration_mg_per_ml = M / W
volume_ml               = D / concentration_mg_per_ml      // = D * W / M
units_to_draw           = volume_ml * 100                  // = (D * W / M) * 100
doses_per_vial          = M / D
```

**Verified against the app screenshots:**
- Tesamorelin — 2 mg vial, 1 mL water, 1 mg dose → 2 mg/mL, 0.5 mL, **50 units** ✓ ("draw to 50 units"; kit shows "2 mg/mL · 50 u draw · 1 mg").
- Ipamorelin — 2 mg vial, 2 mL water, 0.1 mg dose → 1 mg/mL, 0.1 mL, **10 units** ✓ ("draw to 10 units"; kit shows "1 mg/mL · 10 u draw · 0.1 mg").

Use these two as unit-test fixtures. Edge cases: `W ≤ 0`, `M ≤ 0`, `D ≤ 0`, non-numeric, `D > M` (warn: dose exceeds a full vial). Compute on raw numbers; round only for display. Support dose entered in mg or mcg (1 mg = 1000 mcg).

### 6.5 Phased Build Plan (sprint-sized, Claude-Code-friendly)

- **Sprint 0 — Scaffold:** `npm create vite@latest` (react-ts) → ESLint/Prettier/Husky → Vitest → router + 3-tab shell + `tokens.css` (dark theme) → CI workflow → deploy a "hello" build to get the live URL early. *DoD: green CI, live URL.*
- **Sprint 1 — Reconstitution wedge (P0):** `lib/reconstitution.ts` + unit tests **first** (TDD) → `CalculatorView` (chips + number pad + units↔mL) → save Vial to IndexedDB → KitView. *DoD: tests pass, can reconstitute a vial offline and see it in the kit.*
- **Sprint 2 — Protocol + schedule + Home (P0):** seed Muscle Growth protocol → `START_PROTOCOL` → `lib/schedule.ts` + tests → Home dashboard (week strip, Today's doses, check-off). *DoD: end-to-end start → today → check-off loop works.*
- **Sprint 3 — Onboarding + goal flow + Guide Me + polish (P0):** onboarding screens + medical gate → goal grid → protocol detail → Start → Guide Me 5-step → notifications, empty states, a11y, README + walkthrough recording. *DoD: full flow demoable end-to-end; deliverables ready.*
- **Backlog (P1/P2):** Explore tabs, outcome tracking + photos, custom stacks/blends.

> Seed data to lift straight from the screenshots — Goals: Muscle Growth, Injury Recovery, Skincare & Beauty, Energy & Performance, Weight Loss, Brain Enhancement, Anti Aging. Muscle Growth protocol: **Tesamorelin** (1 mg, 10:00 PM, "Night Builder") + **Ipamorelin** (0.1 mg, 7:00 AM, "Morning Pulse"), 8 weeks, 5×/week. Catalog: 5-Amino-1MQ, BPC-157, CJC-1295 (no DAC), Epitalon, GHK-Cu, Ipamorelin, KPV, Melanotan II, MOTS-c, Tesamorelin.

---

## 7. Engineering Practices (mapped from the CSE 110 lecture)

These are the "optimal SWE practices" from the *(Re)introduction & Finale* deck, each turned into something this project actually does. They are the rubric the build is held to.

**Process & Agile**
- **Bounded scope over free-form** — P0 is the spine (onboarding → protocol → reconstitute → dose loop), not the whole app (lecture: smaller/bounded projects succeed).
- **Sprints + backlog + standups** — the four sprints above; backlog holds Explore/outcomes/blends.
- **Story points & Definition of Done** — each task estimated; DoD = tests pass + lint clean + offline-works + matches captured screen + documented.
- **Retros each iteration** — short retro after each sprint; capture keep/change and act on it ("retro per iteration provides value… stay vigilant").

**Repo & SSoT**
- **Repo as Single Source of Truth** — code, docs, ADRs, and seed data all in the repo.
- **Branch/merge strategy** — short-lived feature branches → PR → merge to `main`; `main` always deployable.
- **ADRs** — ADR-001 local-first/no-backend, ADR-002 IndexedDB + migrations, ADR-003 Context+reducer over Redux. Avoid "Death Star" architecture.

**Quality gates / the CI factory**
- **Pre-commit checks** (Husky + lint-staged): style, format, lint, basic complexity — fail fast locally.
- **Local build checks:** type-check + unit + integration before push.
- **CI pipeline** (GitHub Actions): install → lint → typecheck → test → build on every PR; red = no merge.
- **CD:** auto-deploy `main` to Vercel/Netlify → the live URL; PR preview deploys for "stage."
- **Testing:** unit tests for pure logic (`reconstitution`, `schedule`); integration test for the check-off-a-dose flow. The math is the highest-risk surface → most coverage.

**Design & users**
- **User-Centered Design (UCD)** — flows optimized for lowest friction; strong empty states; primary persona = cautious first-timer.
- **Trade-offs are explicit** — "all engineering is a game of optimization and trade-offs"; each ADR states what we give up and gain.

**Forward-looking / sustainable**
- **Local-first, offline, web-platform first** — straight from the deck's local-first / service-worker / web-components themes. Optional: add a service worker for an installable PWA in P1.
- **Minimalism & sustainability** — tiny runtime dependency budget; quality over disposability; fewer tools is better.
- **Observability (lightweight)** — error boundary + simple in-app event counts (reconstitutions, doses logged) so §2.3 metrics are measurable; structured for real analytics later.
- **Docs as part of "done"** — README (run/build/test/deploy), this PRD as the spec, optional typedoc ("engineering = everything it takes to make software: process, tools, culture").

**The THINK filter (applied to scope):** is each feature *True* (correct), *Helpful*, *Inspiring*, *Necessary*, *Kind* (safe/clear for a health-adjacent user)? Anything failing "Necessary" goes to the backlog — which is why progress photos, Discord, and cost data are deferred.

---

## 8. Deliverables Checklist (project requirements)

- [ ] **Live Deployment URL** — static SPA on Vercel/Netlify, auto-deployed from `main`.
- [ ] **Public GitHub repo** — clean, commented, README (setup/build/test/deploy), ADRs, documented component structure + state management.
- [ ] **Video walkthrough** — full flow: onboarding → goal → protocol → start → reconstitute (calculator + Guide Me) → Home/check-off dose → Reconstitute kit.

---

*Open items before build: confirm hosting (Vercel vs Netlify); decide whether Explore is in the demo scope or backlog; decide whether a PWA/service-worker install is wanted in P0 or P1.*
