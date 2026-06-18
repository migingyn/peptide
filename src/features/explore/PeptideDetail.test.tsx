import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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
];

vi.mock('../../state/store', () => ({
  useAppState: () => ({ peptides: PEPTIDES }),
}));

import { PeptideDetail } from './PeptideDetail';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/explore/peptide/:peptideId" element={<PeptideDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PeptideDetail', () => {
  it('shows name, nickname, category, and blurb', () => {
    renderAt('/explore/peptide/tesamorelin');
    expect(screen.getByRole('heading', { name: 'Tesamorelin' })).toBeInTheDocument();
    expect(screen.getByText('Night Builder')).toBeInTheDocument();
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText(/GHRH analog/)).toBeInTheDocument();
  });

  it('navigates to the calculator on "Reconstitute this"', async () => {
    renderAt('/explore/peptide/tesamorelin');
    await userEvent.click(screen.getByRole('button', { name: 'Reconstitute this' }));
    expect(mockNavigate).toHaveBeenCalledWith('/reconstitute/calc/tesamorelin');
  });

  it('shows an empty state for an unknown id', () => {
    renderAt('/explore/peptide/does-not-exist');
    expect(screen.getByText('Peptide not found')).toBeInTheDocument();
  });
});
