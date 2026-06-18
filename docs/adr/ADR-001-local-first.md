# ADR-001: Local-first, no backend

**Status:** Accepted

**Context:** PepS is a personal peptide tracker MVP. We want offline use, fast iteration, and minimal operational surface.

**Decision:** Build the app local-first with no backend. All user data lives on-device (IndexedDB). No server, no accounts.

**Consequences:**

- Give up: cross-device sync and real authentication.
- Gain: full offline support, zero infrastructure cost, and a small attack surface.
