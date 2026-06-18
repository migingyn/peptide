import type { UserProtocol, Protocol, DoseLog, DoseStatus, DayOfWeek } from '../state/types';

export interface DoseOccurrence {
  userProtocolId: string;
  peptideId: string;
  doseMg: number;
  timeOfDay: string;
  scheduledFor: string; /* ISO datetime */
  nickname?: string;
}

// totalWeeks for the seeded Muscle Growth protocol (Foundations §7).
const TOTAL_WEEKS = 8;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse "HH:MM" into [hours, minutes]. */
function parseTime(timeOfDay: string): [number, number] {
  const [h, m] = timeOfDay.split(':');
  return [Number(h), Number(m)];
}

/** Doses scheduled on `day`, filtered by daysOfWeek, sorted by timeOfDay. */
export function occurrencesForDay(
  userProtocol: UserProtocol,
  protocol: Protocol,
  day: Date,
): DoseOccurrence[] {
  const dow = day.getDay() as DayOfWeek;
  return protocol.items
    .filter((item) => item.daysOfWeek.includes(dow))
    .map((item) => {
      const [h, m] = parseTime(item.timeOfDay);
      const scheduled = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
      return {
        userProtocolId: userProtocol.id,
        peptideId: item.peptideId,
        doseMg: item.doseMg,
        timeOfDay: item.timeOfDay,
        scheduledFor: scheduled.toISOString(),
        nickname: item.nickname,
      };
    })
    .sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
}

/** Current week (1-based) of the protocol given `now`. */
export function protocolWeek(
  userProtocol: UserProtocol,
  now: Date,
): { week: number; totalWeeks: number } {
  const start = new Date(userProtocol.startDate + 'T00:00:00');
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((nowMidnight.getTime() - startMidnight.getTime()) / MS_PER_DAY);
  const week = Math.max(1, Math.floor(diffDays / 7) + 1);
  return { week, totalWeeks: TOTAL_WEEKS };
}

/** Status of a logged dose matching by peptideId + scheduledFor, else null. */
export function isOccurrenceLogged(occ: DoseOccurrence, logs: DoseLog[]): DoseStatus | null {
  const match = logs.find(
    (l) => l.peptideId === occ.peptideId && l.scheduledFor === occ.scheduledFor,
  );
  return match ? match.status : null;
}
