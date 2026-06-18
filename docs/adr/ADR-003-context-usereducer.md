# ADR-003: Context + useReducer over Redux/Zustand

**Status:** Accepted

**Context:** State is modest (profile, seeded catalogs, vials, dose logs, prefs). We want a pure, testable reducer without extra runtime dependencies.

**Decision:** Use React Context + `useReducer`. The reducer is a pure function (unit-tested); the store wires it to Context and a persistence effect.

**Consequences:**

- Give up: the Redux/Zustand devtools and middleware ecosystem.
- Gain: zero additional runtime dependencies, right-sized for an MVP.
