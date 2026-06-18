# Sprint 3 — Onboarding, Goals & Guide Me Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `2026-06-17-peps-00-foundations.md` first. Prerequisite: Sprint 0-2 complete.

**Goal:** Deliver the full first-run experience — onboarding (splash → sex → age → value-prop carousel → medical gate), the goal flow (get-started → goal grid → goal intro → proceed), protocol detail + start, the 5-step Guide Me reconstitution walkthrough, browser notifications, and an a11y/empty-state polish pass — so the app is demoable end-to-end.

**Architecture:** Reducer cases (`SET_PROFILE`, `ACK_MEDICAL`, `COMPLETE_ONBOARDING`) are pure and unit-tested in `reducer.ts`; all real logic (notifications feature-detection) lives in `lib/`. Views are thin React components under `src/features/*` driven by the existing Context store (`useAppState`/`useDispatch`) and React Router stacked routes (Foundations §10). The onboarding gate lives in `App.tsx`, using the `peps.onboarded` localStorage fast-path (Foundations §5) to route before idb hydration completes and avoid a splash flash.

**Tech Stack:** React 18 + Vite + TypeScript, React Router, React Context + `useReducer`, Vitest + React Testing Library, design tokens from `src/styles/tokens.css` (Foundations §8). No new runtime dependencies — illustrations are inline SVG/emoji.

---

## Task 1 — Reducer cases: SET_PROFILE, ACK_MEDICAL, COMPLETE_ONBOARDING (TDD)

These three cases are pure state transitions (Foundations §6). The action union already declares them (added in Sprint 0); this task implements them with a failing-test-first loop.

**Files:**

- `src/state/reducer.ts` (edit — add 3 cases)
- `src/state/reducer.test.ts` (edit — add tests)

Steps:

- [ ] 1. **Write failing test for SET_PROFILE.** Append to `src/state/reducer.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { reducer } from './reducer';
  import { initialState } from './types';

  describe('SET_PROFILE', () => {
    it('merges partial profile fields without clobbering others', () => {
      const afterSex = reducer(initialState, {
        type: 'SET_PROFILE',
        payload: { sex: 'male' },
      });
      expect(afterSex.profile.sex).toBe('male');
      expect(afterSex.profile.ageBand).toBeNull();

      const afterAge = reducer(afterSex, {
        type: 'SET_PROFILE',
        payload: { ageBand: '30-39' },
      });
      expect(afterAge.profile.sex).toBe('male');
      expect(afterAge.profile.ageBand).toBe('30-39');
    });

    it('does not mutate the input state', () => {
      const next = reducer(initialState, { type: 'SET_PROFILE', payload: { sex: 'female' } });
      expect(initialState.profile.sex).toBeNull();
      expect(next).not.toBe(initialState);
    });
  });
  ```

- [ ] 2. **Run and expect FAIL.** `npx vitest run src/state/reducer.test.ts -t SET_PROFILE` — must fail (case missing).

- [ ] 3. **Write failing test for ACK_MEDICAL.** Append to `src/state/reducer.test.ts`:

  ```ts
  describe('ACK_MEDICAL', () => {
    it('sets medicalAck true', () => {
      const next = reducer(initialState, { type: 'ACK_MEDICAL' });
      expect(next.profile.medicalAck).toBe(true);
    });
    it('leaves other profile fields untouched', () => {
      const withSex = reducer(initialState, { type: 'SET_PROFILE', payload: { sex: 'other' } });
      const next = reducer(withSex, { type: 'ACK_MEDICAL' });
      expect(next.profile.sex).toBe('other');
      expect(next.profile.medicalAck).toBe(true);
    });
  });
  ```

- [ ] 4. **Run and expect FAIL.** `npx vitest run src/state/reducer.test.ts -t ACK_MEDICAL` — must fail.

- [ ] 5. **Write failing test for COMPLETE_ONBOARDING.** Append to `src/state/reducer.test.ts`:

  ```ts
  describe('COMPLETE_ONBOARDING', () => {
    it('sets onboardedAt to an ISO string', () => {
      const next = reducer(initialState, { type: 'COMPLETE_ONBOARDING' });
      expect(next.profile.onboardedAt).not.toBeNull();
      expect(() => new Date(next.profile.onboardedAt as string).toISOString()).not.toThrow();
      expect(new Date(next.profile.onboardedAt as string).toISOString()).toBe(
        next.profile.onboardedAt,
      );
    });
    it('is idempotent-safe: overwrites with a fresh timestamp but keeps acks', () => {
      const acked = reducer(initialState, { type: 'ACK_MEDICAL' });
      const next = reducer(acked, { type: 'COMPLETE_ONBOARDING' });
      expect(next.profile.medicalAck).toBe(true);
      expect(next.profile.onboardedAt).not.toBeNull();
    });
  });
  ```

- [ ] 6. **Run and expect FAIL.** `npx vitest run src/state/reducer.test.ts -t COMPLETE_ONBOARDING` — must fail.

- [ ] 7. **Implement the three cases.** In `src/state/reducer.ts`, add these cases inside the `switch (action.type)` block (alongside the existing cases from Sprint 0-2; do not remove others):

  ```ts
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'ACK_MEDICAL':
      return { ...state, profile: { ...state.profile, medicalAck: true } };

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        profile: { ...state.profile, onboardedAt: new Date().toISOString() },
      };
  ```

- [ ] 8. **Run and expect PASS.** `npx vitest run src/state/reducer.test.ts` — all reducer tests green.

- [ ] 9. **Commit.** `git add -A && git commit -m "feat: SET_PROFILE, ACK_MEDICAL, COMPLETE_ONBOARDING reducer cases"`

---

## Task 2 — notifications.ts feature-detected wrapper (TDD)

Browser `Notification` wrapper, fully guarded by `'Notification' in window` so it degrades gracefully where the API is absent or permission is denied (Foundations §2). The pure guard is unit-tested with a mocked window.

**Files:**

- `src/lib/notifications.ts` (new)
- `src/lib/notifications.test.ts` (new)

Steps:

- [ ] 1. **Write failing test for the feature-detection guard.** Create `src/lib/notifications.test.ts`:

  ```ts
  import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
  import { notificationsSupported, requestPermission, notifyDose } from './notifications';

  describe('notifications feature detection', () => {
    const original = (globalThis as { Notification?: unknown }).Notification;
    afterEach(() => {
      if (original === undefined) delete (globalThis as { Notification?: unknown }).Notification;
      else (globalThis as { Notification?: unknown }).Notification = original;
      vi.restoreAllMocks();
    });

    it('reports unsupported when Notification is absent', async () => {
      delete (globalThis as { Notification?: unknown }).Notification;
      expect(notificationsSupported()).toBe(false);
      await expect(requestPermission()).resolves.toBe('unsupported');
      // must not throw when firing a notification on an unsupported platform
      expect(() => notifyDose({ title: 'Tesamorelin', body: 'Time for your dose' })).not.toThrow();
    });

    it('reports supported and requests permission when Notification exists', async () => {
      const requestPermissionMock = vi.fn().mockResolvedValue('granted');
      (globalThis as { Notification?: unknown }).Notification = Object.assign(
        function MockNotification() {},
        { permission: 'default', requestPermission: requestPermissionMock },
      );
      expect(notificationsSupported()).toBe(true);
      await expect(requestPermission()).resolves.toBe('granted');
      expect(requestPermissionMock).toHaveBeenCalledOnce();
    });

    it('does not construct a Notification when permission is not granted', () => {
      const ctor = vi.fn();
      (globalThis as { Notification?: unknown }).Notification = Object.assign(ctor, {
        permission: 'denied',
        requestPermission: vi.fn(),
      });
      notifyDose({ title: 'Ipamorelin', body: 'Morning pulse' });
      expect(ctor).not.toHaveBeenCalled();
    });
  });
  ```

- [ ] 2. **Run and expect FAIL.** `npx vitest run src/lib/notifications.test.ts` — must fail (module missing).

- [ ] 3. **Implement `notifications.ts`.** Create `src/lib/notifications.ts`:

  ```ts
  // Feature-detected browser Notification wrapper (Foundations §2).
  // Every entry point is guarded by `'Notification' in window` and degrades
  // gracefully when the API is missing or permission is denied.

  export type PermissionResult = NotificationPermission | 'unsupported';

  export interface DoseNotice {
    title: string; // e.g. peptide name
    body: string; // e.g. "Time for your 22:00 dose"
  }

  function getCtor(): typeof Notification | null {
    if (typeof globalThis === 'undefined') return null;
    if (!('Notification' in globalThis)) return null;
    return (globalThis as unknown as { Notification: typeof Notification }).Notification;
  }

  export function notificationsSupported(): boolean {
    return getCtor() !== null;
  }

  export async function requestPermission(): Promise<PermissionResult> {
    const Ctor = getCtor();
    if (!Ctor) return 'unsupported';
    try {
      return await Ctor.requestPermission();
    } catch {
      return 'denied';
    }
  }

  export function currentPermission(): PermissionResult {
    const Ctor = getCtor();
    if (!Ctor) return 'unsupported';
    return Ctor.permission;
  }

  export function notifyDose(notice: DoseNotice): void {
    const Ctor = getCtor();
    if (!Ctor) return;
    if (Ctor.permission !== 'granted') return;
    try {
      // eslint-disable-next-line no-new
      new Ctor(notice.title, { body: notice.body });
    } catch {
      // Swallow construction errors (e.g. user gesture requirements) — degrade silently.
    }
  }
  ```

- [ ] 4. **Run and expect PASS.** `npx vitest run src/lib/notifications.test.ts` — green.

- [ ] 5. **Commit.** `git add -A && git commit -m "feat: feature-detected browser Notification wrapper"`

---

## Task 3 — EmptyState component (shared polish primitive)

A reusable strong empty state used by "coming soon" goal proceed, empty kit, etc.

**Files:**

- `src/components/EmptyState.tsx` (new)

Steps:

- [ ] 1. **Implement `EmptyState`.** Create `src/components/EmptyState.tsx`:

  ```tsx
  import type { ReactNode } from 'react';

  interface EmptyStateProps {
    icon?: string; // emoji glyph
    title: string;
    body?: string;
    action?: ReactNode; // e.g. a Button
  }

  export function EmptyState({ icon = '✨', title, body, action }: EmptyStateProps) {
    return (
      <section
        role="status"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--s-3)',
          padding: 'var(--s-7) var(--s-5)',
          color: 'var(--text-1)',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 48, lineHeight: 1 }}>
          {icon}
        </span>
        <h2 style={{ fontSize: 'var(--t-h2)', color: 'var(--text-0)', margin: 0 }}>{title}</h2>
        {body && <p style={{ fontSize: 'var(--t-body)', maxWidth: 320, margin: 0 }}>{body}</p>}
        {action && <div style={{ marginTop: 'var(--s-3)' }}>{action}</div>}
      </section>
    );
  }
  ```

- [ ] 2. **Commit.** `git add -A && git commit -m "feat: EmptyState polish component"`

---

## Task 4 — Onboarding flow (5 screens) + stacked routes

Stacked routes under `/onboarding/*` (Foundations §10): Splash → Sex → Age → Carousel → MedicalGate. Each screen advances via React Router `useNavigate`. The medical gate dispatches `ACK_MEDICAL` + `COMPLETE_ONBOARDING` and writes the `peps.onboarded` localStorage fast-path key (Foundations §5).

**Files:**

- `src/features/onboarding/Onboarding.tsx` (new — nested route host)
- `src/features/onboarding/Splash.tsx` (new)
- `src/features/onboarding/Sex.tsx` (new)
- `src/features/onboarding/Age.tsx` (new)
- `src/features/onboarding/Carousel.tsx` (new)
- `src/features/onboarding/MedicalGate.tsx` (new)
- `src/features/onboarding/onboarding.css` (new)
- `src/features/onboarding/MedicalGate.test.tsx` (new)

Steps:

- [ ] 1. **Create onboarding styles.** Create `src/features/onboarding/onboarding.css`:

  ```css
  .ob-screen {
    min-height: 100dvh;
    max-width: var(--app-max);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    padding: var(--s-6) var(--s-5) var(--s-7);
    background: var(--grad-hero);
    color: var(--text-0);
  }
  .ob-spacer {
    flex: 1;
  }
  .ob-kicker {
    font-size: var(--t-sm);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-2);
  }
  .ob-title {
    font-family: var(--font-display);
    font-size: var(--t-display);
    line-height: 1.1;
    margin: var(--s-3) 0 var(--s-4);
  }
  .ob-sub {
    font-size: var(--t-body);
    color: var(--text-1);
    margin: 0;
  }
  .ob-options {
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
    margin: var(--s-5) 0;
  }
  .ob-option {
    width: 100%;
    text-align: left;
    padding: var(--s-4);
    border-radius: var(--r-md);
    background: var(--glass);
    border: 1px solid var(--border);
    color: var(--text-0);
    font-size: var(--t-body);
    cursor: pointer;
  }
  .ob-option[aria-pressed='true'] {
    border-color: var(--indigo);
    background: rgba(91, 108, 255, 0.12);
  }
  .ob-option:focus-visible {
    outline: 2px solid var(--indigo);
    outline-offset: 2px;
  }
  .ob-cta {
    width: 100%;
    padding: var(--s-4);
    border-radius: var(--r-pill);
    border: none;
    background: var(--amber);
    color: #1a1200;
    font-size: var(--t-body);
    font-weight: 700;
    cursor: pointer;
  }
  .ob-cta:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .ob-cta:focus-visible {
    outline: 2px solid var(--indigo);
    outline-offset: 2px;
  }
  .ob-dots {
    display: flex;
    gap: var(--s-2);
    justify-content: center;
    margin: var(--s-4) 0;
  }
  .ob-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-2);
    border: none;
    padding: 0;
  }
  .ob-dot[aria-current='true'] {
    background: var(--amber);
  }
  ```

- [ ] 2. **Implement Splash.** Create `src/features/onboarding/Splash.tsx`:

  ```tsx
  import { useNavigate } from 'react-router-dom';
  import './onboarding.css';

  export function Splash() {
    const nav = useNavigate();
    return (
      <main className="ob-screen">
        <div className="ob-spacer" />
        <span aria-hidden="true" style={{ fontSize: 64 }}>
          🧬
        </span>
        <h1 className="ob-title">Find your protocol</h1>
        <p className="ob-sub">
          A calmer way to plan, mix, and track your peptide routine — all on this device.
        </p>
        <div className="ob-spacer" />
        <button className="ob-cta" onClick={() => nav('/onboarding/sex')}>
          Get started
        </button>
      </main>
    );
  }
  ```

- [ ] 3. **Implement Sex.** Create `src/features/onboarding/Sex.tsx`:

  ```tsx
  import { useNavigate } from 'react-router-dom';
  import { useAppState, useDispatch } from '../../state/store';
  import type { Sex as SexValue } from '../../state/types';
  import './onboarding.css';

  const OPTIONS: { value: SexValue; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other / prefer not to say' },
  ];

  export function Sex() {
    const nav = useNavigate();
    const dispatch = useDispatch();
    const { profile } = useAppState();

    function choose(value: SexValue) {
      dispatch({ type: 'SET_PROFILE', payload: { sex: value } });
      nav('/onboarding/age');
    }

    return (
      <main className="ob-screen">
        <span className="ob-kicker">Step 1 of 3</span>
        <h1 className="ob-title">What's your sex?</h1>
        <p className="ob-sub">
          We use this only to tailor dosing guidance. It never leaves your device.
        </p>
        <div className="ob-options" role="group" aria-label="Select your sex">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              className="ob-option"
              aria-pressed={profile.sex === o.value}
              onClick={() => choose(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="ob-spacer" />
      </main>
    );
  }
  ```

- [ ] 4. **Implement Age.** Create `src/features/onboarding/Age.tsx`:

  ```tsx
  import { useNavigate } from 'react-router-dom';
  import { useAppState, useDispatch } from '../../state/store';
  import type { AgeBand } from '../../state/types';
  import './onboarding.css';

  const BANDS: AgeBand[] = ['18-29', '30-39', '40-49', '50-59', '60+'];

  export function Age() {
    const nav = useNavigate();
    const dispatch = useDispatch();
    const { profile } = useAppState();

    function choose(band: AgeBand) {
      dispatch({ type: 'SET_PROFILE', payload: { ageBand: band } });
      nav('/onboarding/carousel');
    }

    return (
      <main className="ob-screen">
        <span className="ob-kicker">Step 2 of 3</span>
        <h1 className="ob-title">How old are you?</h1>
        <p className="ob-sub">Age helps us set sensible starting doses.</p>
        <div className="ob-options" role="group" aria-label="Select your age band">
          {BANDS.map((band) => (
            <button
              key={band}
              className="ob-option"
              aria-pressed={profile.ageBand === band}
              onClick={() => choose(band)}
            >
              {band}
            </button>
          ))}
        </div>
        <div className="ob-spacer" />
      </main>
    );
  }
  ```

- [ ] 5. **Implement Carousel (value prop).** Create `src/features/onboarding/Carousel.tsx`:

  ```tsx
  import { useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import './onboarding.css';

  const SLIDES = [
    {
      icon: '🎯',
      title: 'Match a goal',
      body: 'Pick what you want and get a vetted starting protocol.',
    },
    {
      icon: '🧪',
      title: 'Mix with confidence',
      body: 'Exact units to draw — no math, no guessing.',
    },
    {
      icon: '🔔',
      title: 'Stay on schedule',
      body: 'See today’s doses and check them off in one tap.',
    },
  ];

  export function Carousel() {
    const nav = useNavigate();
    const [i, setI] = useState(0);
    const last = i === SLIDES.length - 1;

    function next() {
      if (last) nav('/onboarding/medical');
      else setI((n) => n + 1);
    }

    const slide = SLIDES[i];
    return (
      <main className="ob-screen">
        <div className="ob-spacer" />
        <span aria-hidden="true" style={{ fontSize: 64 }}>
          {slide.icon}
        </span>
        <h1 className="ob-title">{slide.title}</h1>
        <p className="ob-sub">{slide.body}</p>
        <div className="ob-dots" role="tablist" aria-label="Slide">
          {SLIDES.map((s, idx) => (
            <button
              key={s.title}
              className="ob-dot"
              role="tab"
              aria-current={idx === i}
              aria-label={`Slide ${idx + 1} of ${SLIDES.length}`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
        <div className="ob-spacer" />
        <button className="ob-cta" onClick={next}>
          {last ? 'Continue' : 'Next'}
        </button>
      </main>
    );
  }
  ```

- [ ] 6. **Implement MedicalGate.** Create `src/features/onboarding/MedicalGate.tsx`:

  ```tsx
  import { useNavigate } from 'react-router-dom';
  import { useDispatch } from '../../state/store';
  import './onboarding.css';

  export function MedicalGate() {
    const nav = useNavigate();
    const dispatch = useDispatch();

    function understand() {
      dispatch({ type: 'ACK_MEDICAL' });
      dispatch({ type: 'COMPLETE_ONBOARDING' });
      try {
        localStorage.setItem('peps.onboarded', '1');
      } catch {
        // localStorage may be unavailable (private mode) — gate still completes in state.
      }
      nav('/get-started', { replace: true });
    }

    return (
      <main className="ob-screen">
        <span className="ob-kicker">Step 3 of 3</span>
        <h1 className="ob-title">This app is not medical advice</h1>
        <p className="ob-sub">
          PepS is an organizational tool for informational purposes only. It does not diagnose,
          treat, or prescribe. Talk to a qualified clinician before starting any peptide.
        </p>
        <div className="ob-spacer" />
        <button className="ob-cta" onClick={understand}>
          I understand
        </button>
      </main>
    );
  }
  ```

- [ ] 7. **Implement the Onboarding nested-route host.** Create `src/features/onboarding/Onboarding.tsx`:

  ```tsx
  import { Routes, Route, Navigate } from 'react-router-dom';
  import { Splash } from './Splash';
  import { Sex } from './Sex';
  import { Age } from './Age';
  import { Carousel } from './Carousel';
  import { MedicalGate } from './MedicalGate';

  export function Onboarding() {
    return (
      <Routes>
        <Route index element={<Splash />} />
        <Route path="sex" element={<Sex />} />
        <Route path="age" element={<Age />} />
        <Route path="carousel" element={<Carousel />} />
        <Route path="medical" element={<MedicalGate />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }
  ```

- [ ] 8. **Write the medical-gate RTL test (gate blocks until ack).** Create `src/features/onboarding/MedicalGate.test.tsx`:

  ```tsx
  import { describe, it, expect, beforeEach } from 'vitest';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { MemoryRouter, Routes, Route } from 'react-router-dom';
  import { AppStateProvider, useAppState } from '../../state/store';
  import { MedicalGate } from './MedicalGate';

  function Probe() {
    const { profile } = useAppState();
    return (
      <div>
        landed
        <span data-testid="ack">{String(profile.medicalAck)}</span>
        <span data-testid="onboarded">{String(profile.onboardedAt != null)}</span>
      </div>
    );
  }

  function renderGate() {
    return render(
      <AppStateProvider>
        <MemoryRouter initialEntries={['/onboarding/medical']}>
          <Routes>
            <Route path="/onboarding/medical" element={<MedicalGate />} />
            <Route path="/get-started" element={<Probe />} />
          </Routes>
        </MemoryRouter>
      </AppStateProvider>,
    );
  }

  describe('MedicalGate', () => {
    beforeEach(() => localStorage.clear());

    it('does not advance until "I understand" is pressed', () => {
      renderGate();
      expect(screen.queryByText('landed')).toBeNull();
      expect(screen.getByText('This app is not medical advice')).toBeInTheDocument();
    });

    it('acks medical, completes onboarding, sets fast-path, and advances', () => {
      renderGate();
      fireEvent.click(screen.getByRole('button', { name: 'I understand' }));
      expect(screen.getByText('landed')).toBeInTheDocument();
      expect(screen.getByTestId('ack').textContent).toBe('true');
      expect(screen.getByTestId('onboarded').textContent).toBe('true');
      expect(localStorage.getItem('peps.onboarded')).toBe('1');
    });
  });
  ```

- [ ] 9. **Run and expect PASS.** `npx vitest run src/features/onboarding/MedicalGate.test.tsx` — green.

- [ ] 10. **Commit.** `git add -A && git commit -m "feat: onboarding flow (splash, sex, age, carousel, medical gate)"`

---

## Task 5 — Onboarding gate in App.tsx

If `profile.onboardedAt == null`, force the user to `/onboarding`. Use the `peps.onboarded` localStorage fast-path (Foundations §5) to make the routing decision before idb hydration completes, avoiding an onboarding flash for returning users.

**Files:**

- `src/App.tsx` (edit)
- `src/App.test.tsx` (new)

Steps:

- [ ] 1. **Add the onboarding gate to `App.tsx`.** In `src/App.tsx`, add the route `<Route path="/onboarding/*" element={<Onboarding />} />` alongside the existing routes (`/get-started`, `/goals`, `/goal/:goalId`, `/protocol/:protocolId`, `/protocol/:protocolId/start`, `/`, `/reconstitute`, `/reconstitute/guide/:peptideId`, `/explore`, etc.), and wrap the routed area with a gate. Add near the top of the `App` component body:

  ```tsx
  import { useEffect } from 'react';
  import { useNavigate, useLocation } from 'react-router-dom';
  import { useAppState } from './state/store';
  import { Onboarding } from './features/onboarding/Onboarding';

  function OnboardingGate({ children }: { children: React.ReactNode }) {
    const { profile, hydrated } = useAppState();
    const nav = useNavigate();
    const loc = useLocation();

    // Fast-path: trust localStorage before idb hydration to avoid a flash.
    const fastOnboarded = (() => {
      try {
        return localStorage.getItem('peps.onboarded') === '1';
      } catch {
        return false;
      }
    })();

    const onboarded = hydrated ? profile.onboardedAt != null : fastOnboarded;
    const inOnboarding = loc.pathname.startsWith('/onboarding');

    useEffect(() => {
      if (!onboarded && !inOnboarding) nav('/onboarding', { replace: true });
      if (onboarded && inOnboarding) nav('/get-started', { replace: true });
    }, [onboarded, inOnboarding, nav]);

    return <>{children}</>;
  }
  ```

  Then render `<OnboardingGate>` wrapping the `<Routes>` element, with `/onboarding/*` included in the route table.

- [ ] 2. **Write App gate RTL test.** Create `src/App.test.tsx`:

  ```tsx
  import { describe, it, expect, beforeEach } from 'vitest';
  import { render, screen, waitFor } from '@testing-library/react';
  import { MemoryRouter } from 'react-router-dom';
  import { AppStateProvider } from './state/store';
  import App from './App';

  function renderApp(path: string) {
    return render(
      <AppStateProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </AppStateProvider>,
    );
  }

  describe('onboarding gate', () => {
    beforeEach(() => localStorage.clear());

    it('redirects a fresh user to onboarding splash', async () => {
      renderApp('/');
      await waitFor(() => expect(screen.getByText('Find your protocol')).toBeInTheDocument());
    });

    it('keeps an onboarded user out of onboarding', async () => {
      localStorage.setItem('peps.onboarded', '1');
      renderApp('/onboarding');
      await waitFor(() => expect(screen.queryByText('Find your protocol')).not.toBeInTheDocument());
    });
  });
  ```

  Note: if `App` is not the default export or `<App/>` already mounts its own `MemoryRouter`/`BrowserRouter`, adapt the harness — render the gate-bearing subtree with a `MemoryRouter` and provider so the two assertions hold.

- [ ] 3. **Run and expect PASS.** `npx vitest run src/App.test.tsx` — green.

- [ ] 4. **Commit.** `git add -A && git commit -m "feat: onboarding gate with localStorage fast-path in App"`

---

## Task 6 — Goal flow: GetStarted, GoalGrid, GoalIntro, Proceed

Routes (Foundations §10): `/get-started`, `/goals`, `/goal/:goalId`. GetStarted offers four entry points; GoalGrid renders the 7 goals from `goals.seed`; GoalIntro shows the goal tagline; Proceed routes to protocol detail when `recommendedProtocolId` is set, else a graceful "coming soon" EmptyState.

**Files:**

- `src/features/goals/goals.css` (new)
- `src/features/goals/GetStarted.tsx` (new)
- `src/features/goals/GoalGrid.tsx` (new)
- `src/features/goals/GoalIntro.tsx` (new)
- `src/features/goals/Proceed.tsx` (new)
- `src/features/goals/GoalGrid.test.tsx` (new)

Steps:

- [ ] 1. **Create goal styles.** Create `src/features/goals/goals.css`:

  ```css
  .goal-screen {
    min-height: 100dvh;
    max-width: var(--app-max);
    margin: 0 auto;
    padding: var(--s-6) var(--s-5) var(--s-7);
    background: var(--bg-0);
    color: var(--text-0);
    display: flex;
    flex-direction: column;
  }
  .goal-title {
    font-family: var(--font-display);
    font-size: var(--t-h1);
    margin: 0 0 var(--s-2);
  }
  .goal-sub {
    font-size: var(--t-body);
    color: var(--text-1);
    margin: 0 0 var(--s-5);
  }
  .goal-list {
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
  }
  .goal-card {
    width: 100%;
    text-align: left;
    padding: var(--s-4);
    border-radius: var(--r-md);
    background: var(--bg-1);
    border: 1px solid var(--border);
    color: var(--text-0);
    cursor: pointer;
  }
  .goal-card:focus-visible {
    outline: 2px solid var(--indigo);
    outline-offset: 2px;
  }
  .goal-card-name {
    font-size: var(--t-h2);
    margin: 0;
  }
  .goal-card-tag {
    font-size: var(--t-sm);
    color: var(--amber);
    margin: var(--s-1) 0 0;
  }
  .goal-card-blurb {
    font-size: var(--t-sm);
    color: var(--text-1);
    margin: var(--s-2) 0 0;
  }
  .goal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--s-3);
  }
  .goal-cta {
    width: 100%;
    padding: var(--s-4);
    border-radius: var(--r-pill);
    border: none;
    background: var(--amber);
    color: #1a1200;
    font-weight: 700;
    font-size: var(--t-body);
    cursor: pointer;
  }
  .goal-cta:focus-visible {
    outline: 2px solid var(--indigo);
    outline-offset: 2px;
  }
  ```

- [ ] 2. **Implement GetStarted.** Create `src/features/goals/GetStarted.tsx`:

  ```tsx
  import { useNavigate } from 'react-router-dom';
  import './goals.css';

  const ENTRIES = [
    { label: 'Match my goal', to: '/goals', icon: '🎯' },
    { label: 'Choose a peptide', to: '/explore/peptides', icon: '🧪' },
    { label: 'Browse protocols', to: '/explore/protocols', icon: '📋' },
    { label: 'Add current stack', to: '/reconstitute', icon: '➕' },
  ];

  export function GetStarted() {
    const nav = useNavigate();
    return (
      <main className="goal-screen">
        <h1 className="goal-title">How do you want to get started?</h1>
        <p className="goal-sub">Pick a path — you can change direction anytime.</p>
        <div className="goal-list">
          {ENTRIES.map((e) => (
            <button key={e.label} className="goal-card" onClick={() => nav(e.to)}>
              <span aria-hidden="true" style={{ fontSize: 24, marginRight: 'var(--s-2)' }}>
                {e.icon}
              </span>
              <span className="goal-card-name" style={{ fontSize: 'var(--t-body)' }}>
                {e.label}
              </span>
            </button>
          ))}
        </div>
      </main>
    );
  }
  ```

- [ ] 3. **Implement GoalGrid.** Create `src/features/goals/GoalGrid.tsx`:

  ```tsx
  import { useNavigate } from 'react-router-dom';
  import { useAppState } from '../../state/store';
  import './goals.css';

  export function GoalGrid() {
    const nav = useNavigate();
    const { goals } = useAppState();
    return (
      <main className="goal-screen">
        <h1 className="goal-title">What's your goal?</h1>
        <p className="goal-sub">Choose a focus and we’ll point you to a starting protocol.</p>
        <div className="goal-grid">
          {goals.map((g) => (
            <button
              key={g.id}
              className="goal-card"
              onClick={() => nav(`/goal/${g.id}`)}
              aria-label={`${g.name}: ${g.tagline}`}
            >
              <p className="goal-card-name">{g.name}</p>
              <p className="goal-card-tag">{g.tagline}</p>
            </button>
          ))}
        </div>
      </main>
    );
  }
  ```

- [ ] 4. **Implement GoalIntro.** Create `src/features/goals/GoalIntro.tsx`:

  ```tsx
  import { useNavigate, useParams } from 'react-router-dom';
  import { useAppState } from '../../state/store';
  import { EmptyState } from '../../components/EmptyState';
  import './goals.css';

  export function GoalIntro() {
    const nav = useNavigate();
    const { goalId } = useParams();
    const { goals } = useAppState();
    const goal = goals.find((g) => g.id === goalId);

    if (!goal) {
      return (
        <main className="goal-screen">
          <EmptyState
            icon="🧭"
            title="Goal not found"
            body="That goal isn’t available."
            action={
              <button className="goal-cta" onClick={() => nav('/goals')}>
                Back to goals
              </button>
            }
          />
        </main>
      );
    }

    return (
      <main className="goal-screen">
        <div style={{ flex: 1 }} />
        <span className="goal-card-tag" style={{ fontSize: 'var(--t-sm)' }}>
          {goal.name}
        </span>
        <h1 className="goal-title" style={{ fontSize: 'var(--t-display)' }}>
          {goal.tagline}
        </h1>
        <p className="goal-sub">{goal.blurb}</p>
        <div style={{ flex: 1 }} />
        <button className="goal-cta" onClick={() => nav(`/goal/${goal.id}/proceed`)}>
          Continue
        </button>
      </main>
    );
  }
  ```

- [ ] 5. **Implement Proceed.** Create `src/features/goals/Proceed.tsx`:

  ```tsx
  import { useNavigate, useParams } from 'react-router-dom';
  import { useAppState } from '../../state/store';
  import { EmptyState } from '../../components/EmptyState';
  import './goals.css';

  export function Proceed() {
    const nav = useNavigate();
    const { goalId } = useParams();
    const { goals } = useAppState();
    const goal = goals.find((g) => g.id === goalId);

    if (!goal) {
      return (
        <main className="goal-screen">
          <EmptyState
            icon="🧭"
            title="Goal not found"
            action={
              <button className="goal-cta" onClick={() => nav('/goals')}>
                Back to goals
              </button>
            }
          />
        </main>
      );
    }

    const hasProtocol = goal.recommendedProtocolId != null;

    return (
      <main className="goal-screen">
        <h1 className="goal-title">How would you like to proceed?</h1>
        <p className="goal-sub">For {goal.name}.</p>
        {hasProtocol ? (
          <div className="goal-list">
            <button
              className="goal-card"
              onClick={() => nav(`/protocol/${goal.recommendedProtocolId}`)}
            >
              <p className="goal-card-name">See Recommended Protocol</p>
              <p className="goal-card-blurb">A vetted starting stack for this goal.</p>
            </button>
            <button className="goal-card" onClick={() => nav('/explore/peptides')}>
              <p className="goal-card-name">Pick a Specific Peptide</p>
              <p className="goal-card-blurb">Browse the catalog and build your own.</p>
            </button>
          </div>
        ) : (
          <EmptyState
            icon="🛠️"
            title="Protocols coming soon"
            body={`We’re still curating a recommended protocol for ${goal.name}. You can pick a specific peptide in the meantime.`}
            action={
              <button className="goal-cta" onClick={() => nav('/explore/peptides')}>
                Pick a Specific Peptide
              </button>
            }
          />
        )}
      </main>
    );
  }
  ```

- [ ] 6. **Register goal routes in `App.tsx`.** Add to the route table:

  ```tsx
  import { GetStarted } from './features/goals/GetStarted';
  import { GoalGrid } from './features/goals/GoalGrid';
  import { GoalIntro } from './features/goals/GoalIntro';
  import { Proceed } from './features/goals/Proceed';
  // ...
  <Route path="/get-started" element={<GetStarted />} />
  <Route path="/goals" element={<GoalGrid />} />
  <Route path="/goal/:goalId" element={<GoalIntro />} />
  <Route path="/goal/:goalId/proceed" element={<Proceed />} />
  ```

- [ ] 7. **Write GoalGrid RTL test (renders 7 goals).** Create `src/features/goals/GoalGrid.test.tsx`:

  ```tsx
  import { describe, it, expect } from 'vitest';
  import { render, screen } from '@testing-library/react';
  import { MemoryRouter } from 'react-router-dom';
  import { AppStateProvider } from '../../state/store';
  import { GoalGrid } from './GoalGrid';
  import { GOALS } from '../../data/goals.seed';

  describe('GoalGrid', () => {
    it('renders all 7 seeded goals with their taglines', () => {
      render(
        <AppStateProvider>
          <MemoryRouter>
            <GoalGrid />
          </MemoryRouter>
        </AppStateProvider>,
      );
      expect(GOALS).toHaveLength(7);
      for (const g of GOALS) {
        expect(screen.getByText(g.name)).toBeInTheDocument();
        expect(screen.getByText(g.tagline)).toBeInTheDocument();
      }
    });
  });
  ```

  Note: `AppStateProvider` must seed `goals` synchronously (or the test must dispatch `SEED`). If the provider seeds only after idb hydration, wrap the assertion in `waitFor` or render with a pre-seeded store helper.

- [ ] 8. **Run and expect PASS.** `npx vitest run src/features/goals/GoalGrid.test.tsx` — green.

- [ ] 9. **Commit.** `git add -A && git commit -m "feat: goal flow (get-started, goal grid, intro, proceed)"`

---

## Task 7 — Protocol detail + Start

Route `/protocol/:protocolId` (Foundations §10) renders the full protocol from `Protocol` fields (Foundations §4/§7): At a Glance, Why This Stack, What to Expect, Important to Know, FAQ. Amber "Start Protocol" CTA → `/protocol/:protocolId/start` to pick a start date → dispatch `START_PROTOCOL` (already implemented Sprint 2) → route to `/reconstitute`.

**Files:**

- `src/features/protocol/protocol.css` (new)
- `src/features/protocol/ProtocolDetail.tsx` (new)
- `src/features/protocol/StartProtocol.tsx` (new)
- `src/features/protocol/ProtocolDetail.test.tsx` (new)

Steps:

- [ ] 1. **Create protocol styles.** Create `src/features/protocol/protocol.css`:

  ```css
  .pd-screen {
    min-height: 100dvh;
    max-width: var(--app-max);
    margin: 0 auto;
    padding: var(--s-6) var(--s-5) calc(var(--s-7) + 72px);
    background: var(--bg-0);
    color: var(--text-0);
  }
  .pd-name {
    font-family: var(--font-display);
    font-size: var(--t-display);
    margin: 0 0 var(--s-2);
  }
  .pd-glance {
    font-size: var(--t-body);
    color: var(--amber);
    margin: 0 0 var(--s-5);
  }
  .pd-section {
    margin: 0 0 var(--s-5);
  }
  .pd-h {
    font-size: var(--t-h2);
    margin: 0 0 var(--s-3);
  }
  .pd-row {
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: var(--s-4);
    margin-bottom: var(--s-2);
  }
  .pd-row-title {
    font-size: var(--t-body);
    margin: 0 0 var(--s-1);
    color: var(--text-0);
  }
  .pd-row-text {
    font-size: var(--t-sm);
    margin: 0;
    color: var(--text-1);
  }
  .pd-li {
    font-size: var(--t-body);
    color: var(--text-1);
    margin: 0 0 var(--s-2);
  }
  .pd-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: var(--s-3) var(--s-5) var(--s-5);
    max-width: var(--app-max);
    margin: 0 auto;
    background: linear-gradient(transparent, var(--bg-0) 30%);
  }
  .pd-cta {
    width: 100%;
    padding: var(--s-4);
    border-radius: var(--r-pill);
    border: none;
    background: var(--amber);
    color: #1a1200;
    font-weight: 700;
    font-size: var(--t-body);
    cursor: pointer;
  }
  .pd-cta:focus-visible {
    outline: 2px solid var(--indigo);
    outline-offset: 2px;
  }
  .pd-field {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
    margin: var(--s-5) 0;
  }
  .pd-input {
    padding: var(--s-4);
    border-radius: var(--r-md);
    border: 1px solid var(--border);
    background: var(--bg-1);
    color: var(--text-0);
    font-size: var(--t-body);
  }
  .pd-input:focus-visible {
    outline: 2px solid var(--indigo);
    outline-offset: 2px;
  }
  ```

- [ ] 2. **Implement ProtocolDetail.** Create `src/features/protocol/ProtocolDetail.tsx`:

  ```tsx
  import { useNavigate, useParams } from 'react-router-dom';
  import { useAppState } from '../../state/store';
  import { EmptyState } from '../../components/EmptyState';
  import './protocol.css';

  export function ProtocolDetail() {
    const nav = useNavigate();
    const { protocolId } = useParams();
    const { protocols } = useAppState();
    const p = protocols.find((x) => x.id === protocolId);

    if (!p) {
      return (
        <main className="pd-screen">
          <EmptyState
            icon="📋"
            title="Protocol not found"
            action={
              <button className="pd-cta" onClick={() => nav('/goals')}>
                Back to goals
              </button>
            }
          />
        </main>
      );
    }

    const costStr = p.costPerWeek != null ? `~$${p.costPerWeek}/wk` : 'cost varies';
    const glance = `${p.level} · ${p.weeks} weeks · ${costStr} · ${p.injectionsPerWeek}× weekly`;

    return (
      <main className="pd-screen">
        <h1 className="pd-name">{p.name}</h1>

        <section className="pd-section" aria-label="At a Glance">
          <h2 className="pd-h">At a Glance</h2>
          <p className="pd-glance">{glance}</p>
        </section>

        <section className="pd-section" aria-label="Why This Stack">
          <h2 className="pd-h">Why This Stack</h2>
          {p.whyThisStack.map((w) => (
            <div key={w.peptideId} className="pd-row">
              <p className="pd-row-title">{w.nickname}</p>
              <p className="pd-row-text">{w.reason}</p>
            </div>
          ))}
        </section>

        <section className="pd-section" aria-label="What to Expect">
          <h2 className="pd-h">What to Expect</h2>
          {p.whatToExpect.map((e) => (
            <div key={e.range} className="pd-row">
              <p className="pd-row-title">{e.range}</p>
              <p className="pd-row-text">{e.text}</p>
            </div>
          ))}
        </section>

        <section className="pd-section" aria-label="Important to Know">
          <h2 className="pd-h">Important to Know</h2>
          <ul style={{ paddingLeft: 'var(--s-4)', margin: 0 }}>
            {p.importantToKnow.map((item) => (
              <li key={item} className="pd-li">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="pd-section" aria-label="FAQ">
          <h2 className="pd-h">FAQ</h2>
          {p.faq.map((f) => (
            <details key={f.q} className="pd-row">
              <summary className="pd-row-title" style={{ cursor: 'pointer' }}>
                {f.q}
              </summary>
              <p className="pd-row-text" style={{ marginTop: 'var(--s-2)' }}>
                {f.a}
              </p>
            </details>
          ))}
        </section>

        <div className="pd-bar">
          <button className="pd-cta" onClick={() => nav(`/protocol/${p.id}/start`)}>
            Start Protocol
          </button>
        </div>
      </main>
    );
  }
  ```

- [ ] 3. **Implement StartProtocol.** Create `src/features/protocol/StartProtocol.tsx`:

  ```tsx
  import { useState } from 'react';
  import { useNavigate, useParams } from 'react-router-dom';
  import { useAppState, useDispatch } from '../../state/store';
  import { EmptyState } from '../../components/EmptyState';
  import './protocol.css';

  function todayISODate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  export function StartProtocol() {
    const nav = useNavigate();
    const dispatch = useDispatch();
    const { protocolId } = useParams();
    const { protocols } = useAppState();
    const p = protocols.find((x) => x.id === protocolId);
    const [startDate, setStartDate] = useState(todayISODate());

    if (!p) {
      return (
        <main className="pd-screen">
          <EmptyState
            icon="📋"
            title="Protocol not found"
            action={
              <button className="pd-cta" onClick={() => nav('/goals')}>
                Back to goals
              </button>
            }
          />
        </main>
      );
    }

    function start() {
      dispatch({ type: 'START_PROTOCOL', payload: { protocolId: p!.id, startDate } });
      nav('/reconstitute', { replace: true });
    }

    return (
      <main className="pd-screen">
        <h1 className="pd-name" style={{ fontSize: 'var(--t-h1)' }}>
          Pick a start date
        </h1>
        <p className="pd-glance" style={{ color: 'var(--text-1)' }}>
          {p.name} — {p.weeks} weeks. We’ll build your schedule from this date.
        </p>
        <div className="pd-field">
          <label htmlFor="start-date" style={{ color: 'var(--text-1)', fontSize: 'var(--t-sm)' }}>
            Start date
          </label>
          <input
            id="start-date"
            className="pd-input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="pd-bar">
          <button className="pd-cta" onClick={start} disabled={!startDate}>
            Start &amp; mix first dose
          </button>
        </div>
      </main>
    );
  }
  ```

- [ ] 4. **Register protocol routes in `App.tsx`.** Add:

  ```tsx
  import { ProtocolDetail } from './features/protocol/ProtocolDetail';
  import { StartProtocol } from './features/protocol/StartProtocol';
  // ...
  <Route path="/protocol/:protocolId" element={<ProtocolDetail />} />
  <Route path="/protocol/:protocolId/start" element={<StartProtocol />} />
  ```

- [ ] 5. **Write ProtocolDetail RTL test (renders all sections).** Create `src/features/protocol/ProtocolDetail.test.tsx`:

  ```tsx
  import { describe, it, expect } from 'vitest';
  import { render, screen } from '@testing-library/react';
  import { MemoryRouter, Routes, Route } from 'react-router-dom';
  import { AppStateProvider } from '../../state/store';
  import { ProtocolDetail } from './ProtocolDetail';

  function renderDetail(id: string) {
    return render(
      <AppStateProvider>
        <MemoryRouter initialEntries={[`/protocol/${id}`]}>
          <Routes>
            <Route path="/protocol/:protocolId" element={<ProtocolDetail />} />
          </Routes>
        </MemoryRouter>
      </AppStateProvider>,
    );
  }

  describe('ProtocolDetail', () => {
    it('renders all five sections and the At a Glance line for the seeded protocol', () => {
      renderDetail('muscle-growth-tesa-ipa');
      expect(screen.getByText('At a Glance')).toBeInTheDocument();
      expect(screen.getByText('Why This Stack')).toBeInTheDocument();
      expect(screen.getByText('What to Expect')).toBeInTheDocument();
      expect(screen.getByText('Important to Know')).toBeInTheDocument();
      expect(screen.getByText('FAQ')).toBeInTheDocument();
      expect(screen.getByText(/Beginner · 8 weeks · ~\$66\/wk · 5× weekly/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Start Protocol' })).toBeInTheDocument();
    });

    it('shows an empty state for an unknown protocol', () => {
      renderDetail('does-not-exist');
      expect(screen.getByText('Protocol not found')).toBeInTheDocument();
    });
  });
  ```

  Note: ensure `AppStateProvider` seeds `protocols` synchronously for the test (see Task 6 step 7 note).

- [ ] 6. **Run and expect PASS.** `npx vitest run src/features/protocol/ProtocolDetail.test.tsx` — green.

- [ ] 7. **Commit.** `git add -A && git commit -m "feat: protocol detail + start date flow"`

---

## Task 8 — Guide Me 5-step reconstitution walkthrough

Route `/reconstitute/guide/:peptideId` (Foundations §10). Five illustrated steps: Sanitize → Equalize Pressure → Draw & Inject water → Dissolve → Draw dose. Header carries the dose/vial/water/units summary from a saved `Vial` (Foundations §4) or query params. Prev/Next stepper, step indicator, "Done" returns to the kit (`/reconstitute`). Inline emoji illustrations — no asset deps.

**Files:**

- `src/features/reconstitute/guide.css` (new)
- `src/features/reconstitute/GuideMe.tsx` (new)
- `src/features/reconstitute/GuideMe.test.tsx` (new)

Steps:

- [ ] 1. **Create guide styles.** Create `src/features/reconstitute/guide.css`:

  ```css
  .gm-screen {
    min-height: 100dvh;
    max-width: var(--app-max);
    margin: 0 auto;
    padding: var(--s-5) var(--s-5) var(--s-7);
    background: var(--bg-0);
    color: var(--text-0);
    display: flex;
    flex-direction: column;
  }
  .gm-header {
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: var(--s-3) var(--s-4);
    font-size: var(--t-sm);
    color: var(--text-1);
    margin-bottom: var(--s-4);
  }
  .gm-header strong {
    color: var(--text-0);
  }
  .gm-art {
    font-size: 72px;
    text-align: center;
    margin: var(--s-5) 0;
  }
  .gm-step-title {
    font-family: var(--font-display);
    font-size: var(--t-h1);
    margin: 0 0 var(--s-3);
    text-align: center;
  }
  .gm-step-body {
    font-size: var(--t-body);
    color: var(--text-1);
    text-align: center;
    margin: 0 auto;
    max-width: 320px;
  }
  .gm-indicator {
    display: flex;
    gap: var(--s-2);
    justify-content: center;
    margin: var(--s-5) 0;
  }
  .gm-pip {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-2);
  }
  .gm-pip[data-active='true'] {
    background: var(--amber);
  }
  .gm-nav {
    display: flex;
    gap: var(--s-3);
    margin-top: auto;
  }
  .gm-btn {
    flex: 1;
    padding: var(--s-4);
    border-radius: var(--r-pill);
    font-size: var(--t-body);
    font-weight: 700;
    cursor: pointer;
    border: 1px solid var(--border);
  }
  .gm-btn-prev {
    background: var(--glass);
    color: var(--text-0);
  }
  .gm-btn-next {
    background: var(--amber);
    color: #1a1200;
    border: none;
  }
  .gm-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .gm-btn:focus-visible {
    outline: 2px solid var(--indigo);
    outline-offset: 2px;
  }
  ```

- [ ] 2. **Implement GuideMe.** Create `src/features/reconstitute/GuideMe.tsx`:

  ```tsx
  import { useState } from 'react';
  import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
  import { useAppState } from '../../state/store';
  import { EmptyState } from '../../components/EmptyState';
  import './guide.css';

  const STEPS = [
    {
      art: '🧴',
      title: 'Sanitize',
      body: 'Wipe the vial stopper and your hands with an alcohol swab. Let it dry.',
    },
    {
      art: '🌬️',
      title: 'Equalize Pressure',
      body: 'Pull air into the syringe equal to your water volume, then inject that air into the bacteriostatic water vial.',
    },
    {
      art: '💧',
      title: 'Draw & Inject Water',
      body: 'Draw your measured bacteriostatic water, then slowly inject it down the inner wall of the peptide vial.',
    },
    {
      art: '🌀',
      title: 'Dissolve',
      body: 'Gently swirl — never shake — until the powder fully dissolves into a clear solution.',
    },
    {
      art: '💉',
      title: 'Draw Dose',
      body: 'Invert the vial and draw your dose to the marked units. Tap out bubbles. You’re ready.',
    },
  ];

  export function GuideMe() {
    const nav = useNavigate();
    const { peptideId } = useParams();
    const [params] = useSearchParams();
    const { peptides, vials } = useAppState();
    const [i, setI] = useState(0);

    const peptide = peptides.find((p) => p.id === peptideId);
    const vial = vials.find((v) => v.peptideId === peptideId);

    if (!peptide) {
      return (
        <main className="gm-screen">
          <EmptyState
            icon="🧪"
            title="Peptide not found"
            action={
              <button className="gm-btn gm-btn-next" onClick={() => nav('/reconstitute')}>
                Back to kit
              </button>
            }
          />
        </main>
      );
    }

    const vialMg = vial?.vialMg ?? Number(params.get('vialMg'));
    const waterMl = vial?.waterMl ?? Number(params.get('waterMl'));
    const doseMg = vial?.doseMg ?? Number(params.get('doseMg'));
    const drawUnits = vial?.drawUnits ?? Number(params.get('units'));
    const hasSummary = [vialMg, waterMl, doseMg, drawUnits].every(
      (n) => Number.isFinite(n) && n > 0,
    );

    const step = STEPS[i];
    const last = i === STEPS.length - 1;

    return (
      <main className="gm-screen">
        <div className="gm-header">
          <strong>{peptide.name}</strong>
          {hasSummary ? (
            <>
              {' '}
              — dose {doseMg} mg · vial {vialMg} mg · water {waterMl} mL ·{' '}
              <strong>{drawUnits} units</strong>
            </>
          ) : (
            <> — reconstitution guide</>
          )}
        </div>

        <div className="gm-art" aria-hidden="true">
          {step.art}
        </div>
        <h1 className="gm-step-title">{`${i + 1}. ${step.title}`}</h1>
        <p className="gm-step-body">{step.body}</p>

        <div
          className="gm-indicator"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={i + 1}
          aria-label={`Step ${i + 1} of ${STEPS.length}`}
        >
          {STEPS.map((s, idx) => (
            <span key={s.title} className="gm-pip" data-active={idx === i} />
          ))}
        </div>

        <div className="gm-nav">
          <button
            className="gm-btn gm-btn-prev"
            onClick={() => setI((n) => n - 1)}
            disabled={i === 0}
          >
            Prev
          </button>
          {last ? (
            <button className="gm-btn gm-btn-next" onClick={() => nav('/reconstitute')}>
              Done
            </button>
          ) : (
            <button className="gm-btn gm-btn-next" onClick={() => setI((n) => n + 1)}>
              Next
            </button>
          )}
        </div>
      </main>
    );
  }
  ```

- [ ] 3. **Register the guide route in `App.tsx`.** Add:

  ```tsx
  import { GuideMe } from './features/reconstitute/GuideMe';
  // ...
  <Route path="/reconstitute/guide/:peptideId" element={<GuideMe />} />;
  ```

- [ ] 4. **Write GuideMe RTL test (stepper flow).** Create `src/features/reconstitute/GuideMe.test.tsx`:

  ```tsx
  import { describe, it, expect } from 'vitest';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { MemoryRouter, Routes, Route } from 'react-router-dom';
  import { AppStateProvider } from '../../state/store';
  import { GuideMe } from './GuideMe';

  function renderGuide(entry: string) {
    return render(
      <AppStateProvider>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path="/reconstitute/guide/:peptideId" element={<GuideMe />} />
            <Route path="/reconstitute" element={<div>kit</div>} />
          </Routes>
        </MemoryRouter>
      </AppStateProvider>,
    );
  }

  describe('GuideMe', () => {
    it('walks through all 5 steps and returns to kit on Done', () => {
      renderGuide('/reconstitute/guide/tesamorelin?vialMg=2&waterMl=1&doseMg=1&units=50');
      expect(screen.getByText('1. Sanitize')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
      // header summary from query params
      expect(screen.getByText(/50 units/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Next' })); // 2
      fireEvent.click(screen.getByRole('button', { name: 'Next' })); // 3
      fireEvent.click(screen.getByRole('button', { name: 'Next' })); // 4
      fireEvent.click(screen.getByRole('button', { name: 'Next' })); // 5
      expect(screen.getByText('5. Draw Dose')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      expect(screen.getByText('kit')).toBeInTheDocument();
    });

    it('shows an empty state for an unknown peptide', () => {
      renderGuide('/reconstitute/guide/nope');
      expect(screen.getByText('Peptide not found')).toBeInTheDocument();
    });
  });
  ```

  Note: ensure `AppStateProvider` seeds `peptides` synchronously for the test (see Task 6 step 7 note).

- [ ] 5. **Run and expect PASS.** `npx vitest run src/features/reconstitute/GuideMe.test.tsx` — green.

- [ ] 6. **Commit.** `git add -A && git commit -m "feat: Guide Me 5-step reconstitution walkthrough"`

---

## Task 9 — Settings: notifications toggle + RESET_ALL danger action

Wire a Prefs toggle that requests notification permission and dispatches `SET_PREFS` (`notificationsEnabled`), and a "Reset / delete data" danger action that dispatches `RESET_ALL` (PRD §4.2, Foundations §6). Reachable from a Settings screen.

**Files:**

- `src/features/home/Settings.tsx` (new)
- `src/features/home/settings.css` (new)
- `src/features/home/Settings.test.tsx` (new)

Steps:

- [ ] 1. **Create settings styles.** Create `src/features/home/settings.css`:

  ```css
  .set-screen {
    min-height: 100dvh;
    max-width: var(--app-max);
    margin: 0 auto;
    padding: var(--s-6) var(--s-5) calc(var(--tabbar-h) + var(--s-6));
    background: var(--bg-0);
    color: var(--text-0);
  }
  .set-title {
    font-family: var(--font-display);
    font-size: var(--t-h1);
    margin: 0 0 var(--s-5);
  }
  .set-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s-3);
    background: var(--bg-1);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: var(--s-4);
    margin-bottom: var(--s-3);
  }
  .set-row-label {
    font-size: var(--t-body);
    margin: 0;
  }
  .set-row-help {
    font-size: var(--t-sm);
    color: var(--text-2);
    margin: var(--s-1) 0 0;
  }
  .set-danger {
    width: 100%;
    padding: var(--s-4);
    border-radius: var(--r-pill);
    margin-top: var(--s-5);
    background: transparent;
    border: 1px solid var(--danger);
    color: var(--danger);
    font-weight: 700;
    font-size: var(--t-body);
    cursor: pointer;
  }
  .set-danger:focus-visible,
  .set-toggle:focus-visible {
    outline: 2px solid var(--indigo);
    outline-offset: 2px;
  }
  .set-toggle {
    width: 52px;
    height: 30px;
    border-radius: var(--r-pill);
    border: 1px solid var(--border);
    background: var(--bg-2);
    position: relative;
    cursor: pointer;
  }
  .set-toggle[aria-checked='true'] {
    background: var(--amber);
  }
  .set-toggle::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--text-0);
    transition: transform 0.15s;
  }
  .set-toggle[aria-checked='true']::after {
    transform: translateX(22px);
  }
  ```

- [ ] 2. **Implement Settings.** Create `src/features/home/Settings.tsx`:

  ```tsx
  import { useNavigate } from 'react-router-dom';
  import { useAppState, useDispatch } from '../../state/store';
  import { notificationsSupported, requestPermission } from '../../lib/notifications';
  import './settings.css';

  export function Settings() {
    const nav = useNavigate();
    const dispatch = useDispatch();
    const { prefs } = useAppState();
    const supported = notificationsSupported();

    async function toggleNotifications() {
      const next = !prefs.notificationsEnabled;
      if (next && supported) {
        const result = await requestPermission();
        if (result !== 'granted') {
          dispatch({ type: 'SET_PREFS', payload: { notificationsEnabled: false } });
          return;
        }
      }
      dispatch({ type: 'SET_PREFS', payload: { notificationsEnabled: next } });
    }

    function resetAll() {
      const ok = window.confirm(
        'This permanently deletes all your data on this device: profile, vials, schedule, and logs. This cannot be undone. Continue?',
      );
      if (!ok) return;
      dispatch({ type: 'RESET_ALL' });
      try {
        localStorage.removeItem('peps.onboarded');
      } catch {
        // ignore
      }
      nav('/onboarding', { replace: true });
    }

    return (
      <main className="set-screen">
        <h1 className="set-title">Settings</h1>

        <div className="set-row">
          <div>
            <p className="set-row-label">Dose reminders</p>
            <p className="set-row-help">
              {supported
                ? 'Browser notifications when a dose is due.'
                : 'Not supported on this device.'}
            </p>
          </div>
          <button
            className="set-toggle"
            role="switch"
            aria-checked={prefs.notificationsEnabled}
            aria-label="Toggle dose reminders"
            disabled={!supported}
            onClick={toggleNotifications}
          />
        </div>

        <button className="set-danger" onClick={resetAll}>
          Reset / delete all data
        </button>
      </main>
    );
  }
  ```

- [ ] 3. **Register the settings route in `App.tsx`.** Add `import { Settings } from './features/home/Settings';` and `<Route path="/settings" element={<Settings />} />`. Add a link/affordance to Settings from the Home dashboard header (a gear button navigating to `/settings`).

- [ ] 4. **Write Settings RTL test (reset confirms + dispatches).** Create `src/features/home/Settings.test.tsx`:

  ```tsx
  import { describe, it, expect, vi, afterEach } from 'vitest';
  import { render, screen, fireEvent } from '@testing-library/react';
  import { MemoryRouter, Routes, Route } from 'react-router-dom';
  import { AppStateProvider } from '../../state/store';
  import { Settings } from './Settings';

  function renderSettings() {
    return render(
      <AppStateProvider>
        <MemoryRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/settings" element={<Settings />} />
            <Route path="/onboarding" element={<div>onboarding</div>} />
          </Routes>
        </MemoryRouter>
      </AppStateProvider>,
    );
  }

  describe('Settings', () => {
    afterEach(() => vi.restoreAllMocks());

    it('does nothing when reset is cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderSettings();
      fireEvent.click(screen.getByRole('button', { name: 'Reset / delete all data' }));
      expect(screen.queryByText('onboarding')).toBeNull();
    });

    it('resets and routes to onboarding when confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      localStorage.setItem('peps.onboarded', '1');
      renderSettings();
      fireEvent.click(screen.getByRole('button', { name: 'Reset / delete all data' }));
      expect(screen.getByText('onboarding')).toBeInTheDocument();
      expect(localStorage.getItem('peps.onboarded')).toBeNull();
    });

    it('exposes the dose reminders switch', () => {
      renderSettings();
      expect(screen.getByRole('switch', { name: 'Toggle dose reminders' })).toBeInTheDocument();
    });
  });
  ```

- [ ] 5. **Run and expect PASS.** `npx vitest run src/features/home/Settings.test.tsx` — green.

- [ ] 6. **Commit.** `git add -A && git commit -m "feat: settings — notifications toggle + RESET_ALL danger action"`

---

## Task 10 — a11y pass + global focus-visible + reduced-motion verify

Verify and harden the a11y baseline (Foundations §8): visible `:focus-visible` ring using `--indigo`, labeled inputs, `inputmode` on numeric fields, WCAG AA, `prefers-reduced-motion` already in tokens.

**Files:**

- `src/styles/global.css` (edit)

Steps:

- [ ] 1. **Add a global focus-visible fallback.** Ensure `src/styles/global.css` contains a global focus ring so any element missed by a component class still gets one:

  ```css
  :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
    outline: 2px solid var(--indigo);
    outline-offset: 2px;
    border-radius: var(--r-sm);
  }
  ```

- [ ] 2. **Audit numeric inputs.** Confirm every numeric field across the app (calculator, water/dose/vial fields from Sprint 1, start-date is a native `date` so exempt) carries `inputmode="decimal"` and an associated `<label htmlFor>`. Fix any that do not. (No new numeric fields are introduced this sprint, so this is a verification step.)

- [ ] 3. **Run the full suite.** `npx vitest run` — all tests green; then `npm run lint` clean and check the dev server console shows no errors.

- [ ] 4. **Commit.** `git add -A && git commit -m "chore: a11y pass — global focus-visible ring, input audit"`

---

## Task 11 — README walkthrough + video deliverable note

Document the end-to-end flow per Foundations §10 Definition of Done.

**Files:**

- `README.md` (edit)

Steps:

- [ ] 1. **Add a "Walkthrough" section to `README.md`.** Append:

  ```markdown
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
  ```

- [ ] 2. **Commit.** `git add -A && git commit -m "docs: README walkthrough + video deliverable note"`

---

## Sprint 3 DoD checklist

- [ ] `SET_PROFILE`, `ACK_MEDICAL`, `COMPLETE_ONBOARDING` reducer cases implemented, pure, and unit-tested in `reducer.test.ts` (green).
- [ ] `src/lib/notifications.ts` is fully feature-detected (`'Notification' in window`), degrades gracefully when absent/denied, and its guard is unit-tested with a mocked window.
- [ ] Onboarding flow: all five screens (Splash, Sex, Age, Carousel, MedicalGate) implemented as stacked routes under `/onboarding/*`; medical gate dispatches `ACK_MEDICAL` + `COMPLETE_ONBOARDING` and writes the `peps.onboarded` fast-path; RTL test proves the gate blocks until "I understand".
- [ ] Onboarding gate in `App.tsx` forces `/onboarding` when `profile.onboardedAt == null`, using the localStorage fast-path to avoid a flash; RTL test covers fresh vs. onboarded.
- [ ] Goal flow: GetStarted (4 entries), GoalGrid (`/goals`, all 7 seeded goals — RTL verified), GoalIntro (`/goal/:goalId`, tagline), Proceed (`/goal/:goalId/proceed`) routes to protocol detail when `recommendedProtocolId` set, else a graceful "coming soon" EmptyState.
- [ ] ProtocolDetail (`/protocol/:protocolId`) renders At a Glance, Why This Stack, What to Expect, Important to Know, FAQ from `Protocol` fields; RTL test verifies all sections + the glance line; amber "Start Protocol" CTA.
- [ ] StartProtocol (`/protocol/:protocolId/start`) picks a date, dispatches `START_PROTOCOL`, routes to `/reconstitute`.
- [ ] GuideMe (`/reconstitute/guide/:peptideId`) — 5 illustrated steps, header dose/vial/water/units summary (Vial or query params), Prev/Next stepper + indicator, "Done" returns to kit; RTL test walks all 5 steps.
- [ ] Settings: notifications toggle (`SET_PREFS notificationsEnabled`, permission-gated) and "Reset / delete all data" (`RESET_ALL`, confirmed) wired; RTL tested.
- [ ] EmptyState component used for all empty/coming-soon states.
- [ ] a11y: global `:focus-visible` ring (`--indigo`), labeled inputs, `inputmode` on numeric fields, WCAG AA, `prefers-reduced-motion` respected.
- [ ] README walkthrough section added; video walkthrough deliverable noted.
- [ ] `npx vitest run` fully green; `npm run lint` clean; no console errors; works offline.
- [ ] **Full flow demoable end-to-end:** onboarding → goal → protocol → start → reconstitute → Home/check-off.
