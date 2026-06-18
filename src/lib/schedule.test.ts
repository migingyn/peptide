import { describe, it, expect } from 'vitest';
import {
  occurrencesForDay,
  protocolWeek,
  isOccurrenceLogged,
  type DoseOccurrence,
} from './schedule';
import type { Protocol, UserProtocol, DoseLog } from '../state/types';

const PROTOCOL: Protocol = {
  id: 'muscle-growth-tesa-ipa',
  goalId: 'muscle-growth',
  name: 'Muscle Growth Stack',
  weeks: 8,
  injectionsPerWeek: 5,
  level: 'Beginner',
  costPerWeek: 66,
  summary: 'Beginner · 8 weeks · ~$66/wk · 5× weekly',
  whyThisStack: [],
  whatToExpect: [],
  importantToKnow: [],
  faq: [],
  items: [
    {
      peptideId: 'tesamorelin',
      doseMg: 1,
      timeOfDay: '22:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      nickname: 'Night Builder',
    },
    {
      peptideId: 'ipamorelin',
      doseMg: 0.1,
      timeOfDay: '07:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      nickname: 'Morning Pulse',
    },
  ],
};

// Wed 2026-06-17 is the start date (verified: 2026-06-17 is a Wednesday).
const USER_PROTOCOL: UserProtocol = {
  id: 'up-1',
  protocolId: 'muscle-growth-tesa-ipa',
  startDate: '2026-06-17',
  active: true,
};

// Use local-time Date constructor (year, monthIndex, day) to avoid TZ drift.
const wednesday = new Date(2026, 5, 17); // Wed
const sunday = new Date(2026, 5, 21); // Sun

describe('occurrencesForDay', () => {
  it('yields 2 occurrences on a weekday, sorted by timeOfDay (Ipamorelin 07:00 then Tesamorelin 22:00)', () => {
    const occ = occurrencesForDay(USER_PROTOCOL, PROTOCOL, wednesday);
    expect(occ).toHaveLength(2);
    expect(occ[0].peptideId).toBe('ipamorelin');
    expect(occ[0].timeOfDay).toBe('07:00');
    expect(occ[0].doseMg).toBe(0.1);
    expect(occ[1].peptideId).toBe('tesamorelin');
    expect(occ[1].timeOfDay).toBe('22:00');
    expect(occ[1].doseMg).toBe(1);
    expect(occ[0].userProtocolId).toBe('up-1');
    expect(occ[0].nickname).toBe('Morning Pulse');
  });

  it('builds scheduledFor from the day + timeOfDay', () => {
    const occ = occurrencesForDay(USER_PROTOCOL, PROTOCOL, wednesday);
    const d = new Date(occ[0].scheduledFor);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(17);
    expect(d.getHours()).toBe(7);
    expect(d.getMinutes()).toBe(0);
  });

  it('yields 0 occurrences on Sunday (not in daysOfWeek)', () => {
    expect(occurrencesForDay(USER_PROTOCOL, PROTOCOL, sunday)).toHaveLength(0);
  });
});

describe('protocolWeek', () => {
  it('returns week 1 of 8 on the start date', () => {
    expect(protocolWeek(USER_PROTOCOL, new Date(2026, 5, 17))).toEqual({
      week: 1,
      totalWeeks: 8,
    });
  });
  it('returns week 2 of 8 eight days after start', () => {
    expect(protocolWeek(USER_PROTOCOL, new Date(2026, 5, 25))).toEqual({
      week: 2,
      totalWeeks: 8,
    });
  });
  it('clamps week to at least 1 before the start date', () => {
    expect(protocolWeek(USER_PROTOCOL, new Date(2026, 5, 10))).toEqual({
      week: 1,
      totalWeeks: 8,
    });
  });
});

describe('isOccurrenceLogged', () => {
  it('returns the status when a log matches peptideId + scheduledFor', () => {
    const occ = occurrencesForDay(USER_PROTOCOL, PROTOCOL, wednesday)[0];
    const log: DoseLog = {
      id: 'log-1',
      userProtocolId: 'up-1',
      peptideId: occ.peptideId,
      scheduledFor: occ.scheduledFor,
      status: 'taken',
      loggedAt: '2026-06-17T07:05:00.000Z',
    };
    expect(isOccurrenceLogged(occ, [log])).toBe('taken');
  });

  it('returns null when no log matches', () => {
    const occ: DoseOccurrence = occurrencesForDay(USER_PROTOCOL, PROTOCOL, wednesday)[0];
    expect(isOccurrenceLogged(occ, [])).toBeNull();
  });
});
