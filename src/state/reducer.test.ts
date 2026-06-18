import { describe, it, expect } from 'vitest';
import { reducer } from './reducer';
import { initialState } from './types';
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
