import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Peptide } from '../../state/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const PEPTIDES: Peptide[] = [
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
  { id: 'kpv', name: 'KPV', category: 'Recovery', blurb: 'Anti-inflammatory tripeptide.' },
];

vi.mock('../../state/store', () => ({
  useAppState: () => ({ peptides: PEPTIDES }),
}));

import { PeptidesTab } from './PeptidesTab';

function renderTab() {
  return render(
    <MemoryRouter>
      <PeptidesTab />
    </MemoryRouter>,
  );
}

describe('PeptidesTab', () => {
  it('renders all peptides by default', () => {
    renderTab();
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('filters the grid as the user types in search', async () => {
    renderTab();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search peptides' }), 'morning');
    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Ipamorelin');
  });

  it('filters by category and toggles aria-pressed', async () => {
    renderTab();
    const recovery = screen.getByRole('button', { name: 'Recovery' });
    await userEvent.click(recovery);
    expect(recovery).toHaveAttribute('aria-pressed', 'true');
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(2); // BPC-157 + KPV
  });

  it('shows the empty state when nothing matches', async () => {
    renderTab();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search peptides' }), 'zzznope');
    expect(screen.getByText('No peptides match')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('navigates to peptide detail when a cell is clicked', async () => {
    renderTab();
    await userEvent.click(screen.getByRole('button', { name: /Tesamorelin/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/explore/peptide/tesamorelin');
  });
});
