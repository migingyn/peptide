import { describe, it, expect } from 'vitest';
import { reducer } from './reducer';
import { initialState } from './types';
import type { Vial, AppState } from './types';
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

  it('stubbed actions return state unchanged', () => {
    const seeded = reducer(initialState, {
      type: 'SEED',
      payload: { peptides: PEPTIDES, protocols: PROTOCOLS, goals: GOALS },
    });
    const next = reducer(seeded, { type: 'SET_PREFS', payload: { notificationsEnabled: true } });
    expect(next).toBe(seeded);
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
