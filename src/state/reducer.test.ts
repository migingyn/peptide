import { describe, it, expect } from 'vitest';
import { reducer } from './reducer';
import { initialState } from './types';
import type { Vial, AppState, DoseLog } from './types';
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

  it('SET_PREFS merges the partial prefs immutably', () => {
    const seeded = reducer(initialState, {
      type: 'SEED',
      payload: { peptides: PEPTIDES, protocols: PROTOCOLS, goals: GOALS },
    });
    const next = reducer(seeded, { type: 'SET_PREFS', payload: { notificationsEnabled: true } });
    expect(next).not.toBe(seeded);
    expect(next.prefs.notificationsEnabled).toBe(true);
    // theme (and other prefs) are preserved
    expect(next.prefs.theme).toBe('dark');
    // input is not mutated
    expect(seeded.prefs.notificationsEnabled).toBe(false);
  });

  it('SET_PREFS toggling back to false preserves other prefs', () => {
    const on = reducer(initialState, {
      type: 'SET_PREFS',
      payload: { notificationsEnabled: true },
    });
    const off = reducer(on, { type: 'SET_PREFS', payload: { notificationsEnabled: false } });
    expect(off.prefs.notificationsEnabled).toBe(false);
    expect(off.prefs.theme).toBe('dark');
  });
});

// --- Sprint 1 additions ---

function makeVial(over: Partial<Vial> = {}): Vial {
  return {
    id: 'v1',
    peptideId: 'tesamorelin',
    vialMg: 2,
    waterMl: 1,
    doseMg: 1,
    concentrationMgPerMl: 2,
    drawUnits: 50,
    reconstitutedAt: '2026-06-17T00:00:00.000Z',
    ...over,
  };
}

describe('reducer — SAVE_VIAL', () => {
  it('appends a new vial immutably', () => {
    const vial = makeVial();
    const next = reducer(initialState, { type: 'SAVE_VIAL', payload: vial });
    expect(next.vials).toEqual([vial]);
    expect(initialState.vials).toEqual([]); // no mutation of input
    expect(next).not.toBe(initialState);
  });

  it('replaces an existing vial with the same id (upsert)', () => {
    const base: AppState = { ...initialState, vials: [makeVial()] };
    const updated = makeVial({ doseMg: 0.5, drawUnits: 25 });
    const next = reducer(base, { type: 'SAVE_VIAL', payload: updated });
    expect(next.vials).toHaveLength(1);
    expect(next.vials[0]).toEqual(updated);
  });

  it('keeps other vials when adding a new one', () => {
    const base: AppState = { ...initialState, vials: [makeVial({ id: 'v1' })] };
    const second = makeVial({ id: 'v2', peptideId: 'ipamorelin' });
    const next = reducer(base, { type: 'SAVE_VIAL', payload: second });
    expect(next.vials.map((v) => v.id)).toEqual(['v1', 'v2']);
  });
});

describe('reducer — REMOVE_VIAL', () => {
  it('removes the vial with the given id immutably', () => {
    const base: AppState = {
      ...initialState,
      vials: [makeVial({ id: 'v1' }), makeVial({ id: 'v2' })],
    };
    const next = reducer(base, { type: 'REMOVE_VIAL', payload: { id: 'v1' } });
    expect(next.vials.map((v) => v.id)).toEqual(['v2']);
    expect(base.vials).toHaveLength(2); // no mutation
  });

  it('is a no-op (new state) when id is absent', () => {
    const base: AppState = { ...initialState, vials: [makeVial({ id: 'v1' })] };
    const next = reducer(base, { type: 'REMOVE_VIAL', payload: { id: 'nope' } });
    expect(next.vials.map((v) => v.id)).toEqual(['v1']);
  });
});

// --- Sprint 2 additions ---

describe('START_PROTOCOL', () => {
  it('appends an active UserProtocol with the given protocolId and startDate', () => {
    const next = reducer(initialState, {
      type: 'START_PROTOCOL',
      payload: { protocolId: 'muscle-growth-tesa-ipa', startDate: '2026-06-17' },
    });
    expect(next.userProtocols).toHaveLength(1);
    const up = next.userProtocols[0];
    expect(up.protocolId).toBe('muscle-growth-tesa-ipa');
    expect(up.startDate).toBe('2026-06-17');
    expect(up.active).toBe(true);
    expect(typeof up.id).toBe('string');
    expect(up.id.length).toBeGreaterThan(0);
  });

  it('deactivates any prior active UserProtocol when a new one starts', () => {
    const first = reducer(initialState, {
      type: 'START_PROTOCOL',
      payload: { protocolId: 'muscle-growth-tesa-ipa', startDate: '2026-01-01' },
    });
    const second = reducer(first, {
      type: 'START_PROTOCOL',
      payload: { protocolId: 'muscle-growth-tesa-ipa', startDate: '2026-06-17' },
    });
    expect(second.userProtocols).toHaveLength(2);
    expect(second.userProtocols.filter((u) => u.active)).toHaveLength(1);
    expect(second.userProtocols.find((u) => u.active)?.startDate).toBe('2026-06-17');
    expect(second.userProtocols.find((u) => u.startDate === '2026-01-01')?.active).toBe(false);
  });
});

const sampleLog: DoseLog = {
  id: 'log-1',
  userProtocolId: 'up-1',
  peptideId: 'ipamorelin',
  scheduledFor: '2026-06-17T07:00:00.000Z',
  status: 'taken',
  loggedAt: '2026-06-17T07:01:00.000Z',
};

describe('LOG_DOSE / UNDO_DOSE', () => {
  it('LOG_DOSE appends the dose log', () => {
    const next = reducer(initialState, { type: 'LOG_DOSE', payload: sampleLog });
    expect(next.doseLogs).toHaveLength(1);
    expect(next.doseLogs[0]).toEqual(sampleLog);
  });

  it('UNDO_DOSE removes the dose log by id', () => {
    const logged = reducer(initialState, { type: 'LOG_DOSE', payload: sampleLog });
    const undone = reducer(logged, { type: 'UNDO_DOSE', payload: { id: 'log-1' } });
    expect(undone.doseLogs).toHaveLength(0);
  });

  it('UNDO_DOSE leaves unrelated logs intact', () => {
    const other: DoseLog = { ...sampleLog, id: 'log-2', peptideId: 'tesamorelin' };
    let s = reducer(initialState, { type: 'LOG_DOSE', payload: sampleLog });
    s = reducer(s, { type: 'LOG_DOSE', payload: other });
    const undone = reducer(s, { type: 'UNDO_DOSE', payload: { id: 'log-1' } });
    expect(undone.doseLogs).toHaveLength(1);
    expect(undone.doseLogs[0].id).toBe('log-2');
  });
});

// --- Sprint 3 additions ---

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
