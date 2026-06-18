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
import { id } from '../lib/ids';

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

    // --- Sprint 1: vial kit ---
    case 'SAVE_VIAL': {
      const vial = action.payload;
      const exists = state.vials.some((v) => v.id === vial.id);
      const vials = exists
        ? state.vials.map((v) => (v.id === vial.id ? vial : v))
        : [...state.vials, vial];
      return { ...state, vials };
    }

    case 'REMOVE_VIAL': {
      return {
        ...state,
        vials: state.vials.filter((v) => v.id !== action.payload.id),
      };
    }

    // --- Sprint 2: protocol + dose loop ---
    case 'START_PROTOCOL': {
      const userProtocols = state.userProtocols.map((u) =>
        u.active ? { ...u, active: false } : u,
      );
      userProtocols.push({
        id: id(),
        protocolId: action.payload.protocolId,
        startDate: action.payload.startDate,
        active: true,
      });
      return { ...state, userProtocols };
    }

    case 'LOG_DOSE':
      return { ...state, doseLogs: [...state.doseLogs, action.payload] };

    case 'UNDO_DOSE':
      return {
        ...state,
        doseLogs: state.doseLogs.filter((l) => l.id !== action.payload.id),
      };

    // --- Sprint 3: onboarding + profile ---
    case 'SET_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'ACK_MEDICAL':
      return { ...state, profile: { ...state.profile, medicalAck: true } };

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        profile: { ...state.profile, onboardedAt: new Date().toISOString() },
      };

    case 'SET_PREFS':
      return { ...state, prefs: { ...state.prefs, ...action.payload } };

    default:
      return assertNever(action);
  }
}

function assertNever(action: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(action)}`);
}
