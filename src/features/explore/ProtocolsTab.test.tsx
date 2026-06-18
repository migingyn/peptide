import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Protocol } from '../../state/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

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
  useAppState: () => ({ protocols: [PROTOCOL] }),
}));

import { ProtocolsTab } from './ProtocolsTab';

describe('ProtocolsTab', () => {
  it('renders a card per protocol with name, summary, and meta', () => {
    render(
      <MemoryRouter>
        <ProtocolsTab />
      </MemoryRouter>,
    );
    expect(screen.getByText('Muscle Growth Stack')).toBeInTheDocument();
    expect(screen.getByText('Beginner · 8 weeks · ~$66/wk · 5× weekly')).toBeInTheDocument();
    expect(screen.getByText('Beginner · 8 weeks')).toBeInTheDocument();
  });

  it('navigates to protocol detail when a card is clicked', async () => {
    render(
      <MemoryRouter>
        <ProtocolsTab />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Muscle Growth Stack/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/protocol/muscle-growth-tesa-ipa');
  });
});
