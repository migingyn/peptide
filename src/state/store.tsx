import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import { reducer, type Action } from './reducer';
import { initialState, type AppState } from './types';
import { loadAll, persistSlice, clearAll } from './persistence';
import { GOALS } from '../data/goals.seed';
import { PEPTIDES } from '../data/peptides.seed';
import { PROTOCOLS } from '../data/protocols.seed';

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<React.Dispatch<Action> | null>(null);

// Which slices each action persists (Foundations §6).
const PERSIST_MAP: Partial<Record<Action['type'], (keyof AppState)[]>> = {
  SET_PROFILE: ['profile'],
  ACK_MEDICAL: ['profile'],
  COMPLETE_ONBOARDING: ['profile'],
  START_PROTOCOL: ['userProtocols'],
  SAVE_VIAL: ['vials'],
  REMOVE_VIAL: ['vials'],
  LOG_DOSE: ['doseLogs'],
  UNDO_DOSE: ['doseLogs'],
  SET_PREFS: ['prefs'],
};

export function AppStateProvider({
  children,
  initialState: seed,
}: {
  children: ReactNode;
  initialState?: AppState;
}) {
  const [state, dispatch] = useReducer(reducer, seed ?? initialState);
  const lastAction = useRef<Action | null>(null);
  // When a seed state is supplied (e.g. tests), skip idb boot + persistence.
  const seeded = useRef(seed !== undefined);

  // Wrap dispatch to remember the last action for the persistence effect.
  const trackedDispatch: React.Dispatch<Action> = (action) => {
    lastAction.current = action;
    dispatch(action);
  };

  // Boot: hydrate from idb, then idempotently seed catalogs.
  useEffect(() => {
    if (seeded.current) return;
    let cancelled = false;
    (async () => {
      const slices = await loadAll();
      if (cancelled) return;
      dispatch({ type: 'HYDRATE', payload: slices });

      // Idempotent seeding: write to idb only if a store is empty.
      const needsSeed =
        !slices.peptides?.length || !slices.protocols?.length || !slices.goals?.length;
      if (needsSeed) {
        dispatch({
          type: 'SEED',
          payload: { peptides: PEPTIDES, protocols: PROTOCOLS, goals: GOALS },
        });
        await persistSlice('peptides', PEPTIDES);
        await persistSlice('protocols', PROTOCOLS);
        await persistSlice('goals', GOALS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // After each tracked dispatch, persist the affected slice(s).
  useEffect(() => {
    if (seeded.current) return;
    const action = lastAction.current;
    if (!action || !state.hydrated) return;

    if (action.type === 'RESET_ALL') {
      (async () => {
        await clearAll();
        dispatch({
          type: 'SEED',
          payload: { peptides: PEPTIDES, protocols: PROTOCOLS, goals: GOALS },
        });
        await persistSlice('peptides', PEPTIDES);
        await persistSlice('protocols', PROTOCOLS);
        await persistSlice('goals', GOALS);
      })();
      lastAction.current = null;
      return;
    }

    const keys = PERSIST_MAP[action.type];
    if (keys) {
      for (const key of keys) {
        void persistSlice(key, state[key]);
      }
    }
    lastAction.current = null;
  }, [state]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={trackedDispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export function useDispatch(): React.Dispatch<Action> {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error('useDispatch must be used within AppStateProvider');
  return ctx;
}
