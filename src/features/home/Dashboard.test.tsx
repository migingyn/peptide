import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { AppStateProvider } from '../../state/store';
import { reducer } from '../../state/reducer';
import { initialState, type AppState } from '../../state/types';
import { PEPTIDES } from '../../data/peptides.seed';
import { PROTOCOLS } from '../../data/protocols.seed';
import { GOALS } from '../../data/goals.seed';

// Build a hydrated state: seeded + an active protocol started today (a Wednesday)
// + reconstituted vials for both peptides.
function buildState(): AppState {
  let s: AppState = {
    ...initialState,
    peptides: PEPTIDES,
    protocols: PROTOCOLS,
    goals: GOALS,
    hydrated: true,
  };
  s = reducer(s, {
    type: 'START_PROTOCOL',
    payload: { protocolId: 'muscle-growth-tesa-ipa', startDate: '2026-06-17' },
  });
  s = {
    ...s,
    vials: [
      {
        id: 'vial-tesa',
        peptideId: 'tesamorelin',
        vialMg: 2,
        waterMl: 1,
        doseMg: 1,
        concentrationMgPerMl: 2,
        drawUnits: 50,
        reconstitutedAt: '2026-06-17T00:00:00.000Z',
      },
      {
        id: 'vial-ipa',
        peptideId: 'ipamorelin',
        vialMg: 2,
        waterMl: 2,
        doseMg: 0.1,
        concentrationMgPerMl: 1,
        drawUnits: 10,
        reconstitutedAt: '2026-06-17T00:00:00.000Z',
      },
    ],
  };
  return s;
}

beforeEach(() => {
  // Pin "now" to Wed 2026-06-17 09:00 local so the week + today's doses are deterministic.
  // Only fake `Date` so userEvent's real timers keep working.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 5, 17, 9, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

function renderHome() {
  return render(
    <MemoryRouter>
      <AppStateProvider initialState={buildState()}>
        <Dashboard />
      </AppStateProvider>
    </MemoryRouter>,
  );
}

describe('Home Dashboard', () => {
  it('shows Week 1/8 progress', () => {
    renderHome();
    expect(screen.getByLabelText('Week 1/8')).toBeInTheDocument();
  });

  it("renders both of today's doses with PRD dose + units", () => {
    renderHome();
    const today = within(screen.getByRole('region', { name: "Today's doses" }));
    expect(today.getByText('Ipamorelin')).toBeInTheDocument();
    expect(today.getByText('Tesamorelin')).toBeInTheDocument();
    expect(today.getByText(/0\.1 mg · 10 units · 7:00 AM/)).toBeInTheDocument();
    expect(today.getByText(/1 mg · 50 units · 10:00 PM/)).toBeInTheDocument();
  });

  it('checks off a dose → it becomes taken, then unchecks → pending', async () => {
    const user = userEvent.setup();
    renderHome();

    const checkbox = screen.getByLabelText('Mark Ipamorelin as taken') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await user.click(checkbox);
    expect((screen.getByLabelText('Mark Ipamorelin as taken') as HTMLInputElement).checked).toBe(
      true,
    );

    const card = screen.getByLabelText('Mark Ipamorelin as taken').closest('label')!;
    expect(within(card).getByText('Taken')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Mark Ipamorelin as taken'));
    expect((screen.getByLabelText('Mark Ipamorelin as taken') as HTMLInputElement).checked).toBe(
      false,
    );
  });
});
