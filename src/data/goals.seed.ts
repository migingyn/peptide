import type { Goal } from '../state/types';

export const GOALS: Goal[] = [
  {
    id: 'muscle-growth',
    name: 'Muscle Growth',
    tagline: 'Build Lean Muscle Fast',
    blurb: 'Stack growth-hormone secretagogues to build lean mass.',
    recommendedProtocolId: 'muscle-growth-tesa-ipa',
  },
  {
    id: 'injury-recovery',
    name: 'Injury Recovery',
    tagline: 'Heal Faster',
    blurb: 'Support tissue repair.',
    recommendedProtocolId: null,
  },
  {
    id: 'skincare-beauty',
    name: 'Skincare & Beauty',
    tagline: 'Glow From Within',
    blurb: 'Collagen & skin support.',
    recommendedProtocolId: null,
  },
  {
    id: 'energy-performance',
    name: 'Energy & Performance',
    tagline: 'Peak Output',
    blurb: 'Mitochondrial & endurance support.',
    recommendedProtocolId: null,
  },
  {
    id: 'weight-loss',
    name: 'Weight Loss',
    tagline: 'Lean Down',
    blurb: 'Metabolic support.',
    recommendedProtocolId: null,
  },
  {
    id: 'brain-enhancement',
    name: 'Brain Enhancement',
    tagline: 'Sharper Focus',
    blurb: 'Cognitive support.',
    recommendedProtocolId: null,
  },
  {
    id: 'anti-aging',
    name: 'Anti Aging',
    tagline: 'Age Well',
    blurb: 'Longevity support.',
    recommendedProtocolId: null,
  },
];
