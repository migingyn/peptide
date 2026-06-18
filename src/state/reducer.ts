import {
  type AppState,
  type Goal,
  type Peptide,
  type Protocol,
  type Profile,
  type Vial,
  type DoseLog,
  type Prefs,
  initialState,
} from './types';

// Canonical action union (Foundations §6). Sprints add cases, never rename.
export type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SET_PROFILE'; payload: Partial<Profile> }
  | { type: 'ACK_MEDICAL' }
  | { type: 'COMPLETE_ONBOARDING' } // sets onboardedAt
  | { type: 'SEED'; payload: { peptides: Peptide[]; protocols: Protocol[]; goals: Goal[] } }
  | { type: 'START_PROTOCOL'; payload: { protocolId: string; startDate: string } }
  | { type: 'SAVE_VIAL'; payload: Vial }
  | { type: 'REMOVE_VIAL'; payload: { id: string } }
  | { type: 'LOG_DOSE'; payload: DoseLog }
  | { type: 'UNDO_DOSE'; payload: { id: string } }
  | { type: 'SET_PREFS'; payload: Partial<Prefs> }
  | { type: 'RESET_ALL' };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // --- Implemented in Sprint 0 ---
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };

    case 'SEED':
      return {
        ...state,
        peptides: action.payload.peptides,
        protocols: action.payload.protocols,
        goals: action.payload.goals,
      };

    case 'RESET_ALL':
      // Reset to a fresh state but keep hydrated=true (we are loaded, just empty).
      // The store re-seeds after dispatching RESET_ALL.
      return { ...initialState, hydrated: true };

    // --- Stubs: fleshed out by later sprints. Return state unchanged so the
    //     union compiles and exhaustiveness is satisfied today. ---
    case 'SET_PROFILE': // Sprint 3
    case 'ACK_MEDICAL': // Sprint 3
    case 'COMPLETE_ONBOARDING': // Sprint 3
    case 'START_PROTOCOL': // Sprint 2
    case 'SAVE_VIAL': // Sprint 1
    case 'REMOVE_VIAL': // Sprint 1
    case 'LOG_DOSE': // Sprint 2
    case 'UNDO_DOSE': // Sprint 2
    case 'SET_PREFS': // Sprint 3
      return state;

    default:
      return assertNever(action);
  }
}

function assertNever(action: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(action)}`);
}
