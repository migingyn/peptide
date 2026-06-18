# PepS Implementation Plans

Built from `PepS_PRD.md`. Read **Foundations** first — it locks the shared types, math, tokens, seed data, and reducer/action contract that every sprint depends on.

| Order | Plan                                                                           | Sprint         | Produces                                                                             |
| ----- | ------------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------ |
| 0     | [Foundations & Contracts](./2026-06-17-peps-00-foundations.md)                 | — (read first) | Shared types, math spec, tokens, seed data, store/action contract                    |
| 1     | [Scaffold](./2026-06-17-peps-01-scaffold.md)                                   | Sprint 0       | Vite app, tooling, 3-tab shell, CI, Vercel deploy                                    |
| 2     | [Reconstitution Wedge](./2026-06-17-peps-02-reconstitution-wedge.md)           | Sprint 1       | `lib/reconstitution.ts` (TDD), CalculatorView, Vial persistence, KitView             |
| 3     | [Protocol, Schedule & Home](./2026-06-17-peps-03-protocol-schedule-home.md)    | Sprint 2       | `lib/schedule.ts` (TDD), START/LOG/UNDO, Home dashboard, dose check-off              |
| 4     | [Onboarding, Goals & Guide Me](./2026-06-17-peps-04-onboarding-goals-guide.md) | Sprint 3       | Onboarding + medical gate, goal flow, protocol detail, Guide Me, notifications, a11y |
| 5     | [Explore](./2026-06-17-peps-05-explore.md)                                     | Promoted P1    | Protocols + Peptides catalog, search/filter, detail routes                           |

**Build order:** 01 → 02 → 03 → 04, with 05 after 03. **Hosting:** Vercel. **Explore:** in demo scope.

Each plan is bite-sized (one action per step), TDD-first for all `lib/` logic, with complete code in every step and conventional-commit checkpoints.
