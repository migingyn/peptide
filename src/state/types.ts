export type Sex = 'male' | 'female' | 'other';
export type AgeBand = '18-29' | '30-39' | '40-49' | '50-59' | '60+';
export type DoseStatus = 'taken' | 'skipped';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface Profile {
  sex: Sex | null;
  ageBand: AgeBand | null;
  onboardedAt: string | null; // ISO string
  medicalAck: boolean;
}

export interface Peptide {
  id: string;
  name: string;
  nickname?: string;
  category: string; // e.g. "Growth", "Recovery", "Beauty"
  blurb: string;
}

export interface ProtocolItem {
  peptideId: string;
  doseMg: number;
  timeOfDay: string; // "07:00" 24h
  daysOfWeek: DayOfWeek[]; // e.g. Mon–Fri => [1,2,3,4,5]
  nickname?: string; // "Night Builder"
}

export interface Protocol {
  id: string;
  goalId: string;
  name: string;
  weeks: number;
  injectionsPerWeek: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  costPerWeek?: number; // ~66
  summary: string; // "At a Glance" line
  whyThisStack: { peptideId: string; nickname: string; reason: string }[];
  whatToExpect: { range: string; text: string }[]; // "Week 1", "2-4", "5-8"
  importantToKnow: string[];
  faq: { q: string; a: string }[];
  items: ProtocolItem[];
}

export interface Goal {
  id: string;
  name: string; // "Muscle Growth"
  tagline: string; // "Build Lean Muscle Fast"
  blurb: string;
  recommendedProtocolId: string | null;
}

export interface UserProtocol {
  id: string;
  protocolId: string;
  startDate: string; // ISO date "2026-06-17"
  active: boolean;
}

export interface Vial {
  id: string;
  peptideId: string;
  vialMg: number;
  waterMl: number;
  doseMg: number;
  concentrationMgPerMl: number;
  drawUnits: number;
  reconstitutedAt: string; // ISO
}

export interface DoseLog {
  id: string;
  userProtocolId: string;
  peptideId: string;
  scheduledFor: string; // ISO datetime of the scheduled occurrence
  status: DoseStatus;
  loggedAt: string; // ISO
}

export interface Prefs {
  notificationsEnabled: boolean;
  theme: 'dark';
}

export interface AppState {
  profile: Profile;
  peptides: Peptide[]; // seeded
  protocols: Protocol[]; // seeded
  goals: Goal[]; // seeded
  userProtocols: UserProtocol[];
  vials: Vial[];
  doseLogs: DoseLog[];
  prefs: Prefs;
  hydrated: boolean; // false until idb rehydrate completes
}

export const initialState: AppState = {
  profile: { sex: null, ageBand: null, onboardedAt: null, medicalAck: false },
  peptides: [],
  protocols: [],
  goals: [],
  userProtocols: [],
  vials: [],
  doseLogs: [],
  prefs: { notificationsEnabled: false, theme: 'dark' },
  hydrated: false,
};
