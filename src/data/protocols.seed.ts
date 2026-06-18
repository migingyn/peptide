import type { Protocol } from '../state/types';

export const PROTOCOLS: Protocol[] = [
  {
    id: 'muscle-growth-tesa-ipa',
    goalId: 'muscle-growth',
    name: 'Muscle Growth Stack',
    weeks: 8,
    injectionsPerWeek: 5,
    level: 'Beginner',
    costPerWeek: 66,
    summary: 'Beginner · 8 weeks · ~$66/wk · 5× weekly',
    whyThisStack: [
      {
        peptideId: 'tesamorelin',
        nickname: 'Night Builder',
        reason: 'Drives nighttime GH for recovery and lean mass.',
      },
      {
        peptideId: 'ipamorelin',
        nickname: 'Morning Pulse',
        reason: 'A clean morning GH pulse without cortisol spikes.',
      },
    ],
    whatToExpect: [
      { range: 'Week 1', text: 'Adjusting; better sleep is common.' },
      { range: 'Week 2-4', text: 'Improved recovery and fullness.' },
      { range: 'Week 5-8', text: 'Visible lean-mass changes for most.' },
    ],
    importantToKnow: [
      'Inject on an empty stomach when possible.',
      'Rotate injection sites.',
      'This is not medical advice.',
    ],
    faq: [
      {
        q: 'Do I need to fast?',
        a: 'A small fasting window around dosing can help GH response.',
      },
      {
        q: 'What if I miss a dose?',
        a: 'Skip it; do not double up. Resume next scheduled time.',
      },
    ],
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
  },
];
