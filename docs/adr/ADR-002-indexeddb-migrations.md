# ADR-002: IndexedDB with versioned migrations

**Status:** Accepted

**Context:** Local data (vials, dose logs, protocols) is structured and will grow. We need durable, scalable on-device storage that evolves safely.

**Decision:** Use IndexedDB via the `idb` library with an explicit schema version. On any schema change, bump the version and migrate inside the `upgrade` callback; never silently drop user data.

**Consequences:**

- Give up: the simplicity of localStorage.
- Gain: structured, scalable local data with controlled, non-destructive migrations.
