import type { Peptide } from '../state/types';

export const PEPTIDES: Peptide[] = [
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
  {
    id: 'epitalon',
    name: 'Epitalon',
    category: 'Longevity',
    blurb: 'Telomerase-related peptide.',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    category: 'Beauty',
    blurb: 'Copper peptide; skin and collagen.',
  },
  {
    id: 'kpv',
    name: 'KPV',
    category: 'Recovery',
    blurb: 'Anti-inflammatory tripeptide.',
  },
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
