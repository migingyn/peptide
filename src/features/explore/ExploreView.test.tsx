import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Peptide, Protocol } from '../../state/types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const PEPTIDES: Peptide[] = [
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    nickname: 'Night Builder',
    category: 'Growth',
    blurb: 'GHRH analog.',
  },
];
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
  items: [],
};

vi.mock('../../state/store', () => ({
  useAppState: () => ({ peptides: PEPTIDES, protocols: [PROTOCOL] }),
}));

import { ExploreView } from './ExploreView';

describe('ExploreView', () => {
  it('shows the Peptides catalog by default', () => {
    render(
      <MemoryRouter>
        <ExploreView />
      </MemoryRouter>,
    );
    expect(screen.getByRole('searchbox', { name: 'Search peptides' })).toBeInTheDocument();
  });

  it('switches to the Protocols tab via the Segmented control', async () => {
    render(
      <MemoryRouter>
        <ExploreView />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Protocols' }));
    expect(screen.getByText('Muscle Growth Stack')).toBeInTheDocument();
  });

  it('opens the Protocols tab when ?tab=protocols is present', () => {
    render(
      <MemoryRouter initialEntries={['/explore?tab=protocols']}>
        <ExploreView />
      </MemoryRouter>,
    );
    expect(screen.getByText('Muscle Growth Stack')).toBeInTheDocument();
  });
});
