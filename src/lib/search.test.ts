import { describe, it, expect } from 'vitest';
import type { Peptide } from '../state/types';
import { filterPeptides } from './search';

const FIXTURE: Peptide[] = [
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    nickname: 'Night Builder',
    category: 'Growth',
    blurb: 'GHRH analog; supports lean mass and fat loss.',
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    nickname: 'Morning Pulse',
    category: 'Growth',
    blurb: 'Selective GH secretagogue; gentle GH pulse.',
  },
  {
    id: 'bpc-157',
    name: 'BPC-157',
    category: 'Recovery',
    blurb: 'Body-protection compound; tissue repair.',
  },
  {
    id: 'cjc-1295',
    name: 'CJC-1295 (no DAC)',
    category: 'Growth',
    blurb: 'GHRH analog; pairs with a GHRP.',
  },
  { id: 'epitalon', name: 'Epitalon', category: 'Longevity', blurb: 'Telomerase-related peptide.' },
  { id: 'ghk-cu', name: 'GHK-Cu', category: 'Beauty', blurb: 'Copper peptide; skin and collagen.' },
  { id: 'kpv', name: 'KPV', category: 'Recovery', blurb: 'Anti-inflammatory tripeptide.' },
  {
    id: 'melanotan-2',
    name: 'Melanotan II',
    category: 'Beauty',
    blurb: 'Melanocortin agonist; tanning.',
  },
  {
    id: 'mots-c',
    name: 'MOTS-c',
    category: 'Performance',
    blurb: 'Mitochondrial peptide; metabolism.',
  },
  {
    id: '5-amino-1mq',
    name: '5-Amino-1MQ',
    category: 'Performance',
    blurb: 'NNMT inhibitor; metabolic support.',
  },
];

const ids = (ps: Peptide[]) => ps.map((p) => p.id).sort();

describe('filterPeptides', () => {
  it('returns all peptides when query is empty and category is null', () => {
    expect(filterPeptides(FIXTURE, '', null)).toHaveLength(10);
  });

  it('trims whitespace-only queries to "no query"', () => {
    expect(filterPeptides(FIXTURE, '   ', null)).toHaveLength(10);
  });

  it('matches "morning" against Ipamorelin via nickname (case-insensitive)', () => {
    expect(ids(filterPeptides(FIXTURE, 'MORNING', null))).toEqual(['ipamorelin']);
  });

  it('matches "growth" via category text for Growth-category peptides', () => {
    // "growth" appears in the Growth category for tesamorelin, ipamorelin, cjc-1295
    expect(ids(filterPeptides(FIXTURE, 'growth', null))).toEqual([
      'cjc-1295',
      'ipamorelin',
      'tesamorelin',
    ]);
  });

  it('matches name substrings case-insensitively', () => {
    expect(ids(filterPeptides(FIXTURE, 'tesa', null))).toEqual(['tesamorelin']);
  });

  it('matches blurb substrings (e.g. "collagen" -> GHK-Cu)', () => {
    expect(ids(filterPeptides(FIXTURE, 'collagen', null))).toEqual(['ghk-cu']);
  });

  it('filters by exact category when provided', () => {
    expect(ids(filterPeptides(FIXTURE, '', 'Recovery'))).toEqual(['bpc-157', 'kpv']);
  });

  it('category match is exact, not substring', () => {
    expect(filterPeptides(FIXTURE, '', 'Grow')).toHaveLength(0);
  });

  it('combines query AND category (both must match)', () => {
    // category Growth + query "pulse" -> only ipamorelin (blurb "gentle GH pulse")
    expect(ids(filterPeptides(FIXTURE, 'pulse', 'Growth'))).toEqual(['ipamorelin']);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterPeptides(FIXTURE, 'zzzznope', null)).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const copy = [...FIXTURE];
    filterPeptides(FIXTURE, 'growth', 'Growth');
    expect(FIXTURE).toEqual(copy);
  });
});
