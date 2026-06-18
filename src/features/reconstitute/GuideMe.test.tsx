import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppStateProvider } from '../../state/store';
import { initialState, type AppState } from '../../state/types';
import { PEPTIDES } from '../../data/peptides.seed';
import { GuideMe } from './GuideMe';

function seeded(): AppState {
  return { ...initialState, peptides: PEPTIDES, hydrated: true };
}

function renderGuide(entry: string) {
  return render(
    <AppStateProvider initialState={seeded()}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/reconstitute/guide/:peptideId" element={<GuideMe />} />
          <Route path="/reconstitute" element={<div>kit</div>} />
        </Routes>
      </MemoryRouter>
    </AppStateProvider>,
  );
}

describe('GuideMe', () => {
  it('walks through all 5 steps and returns to kit on Done', () => {
    renderGuide('/reconstitute/guide/tesamorelin?vialMg=2&waterMl=1&doseMg=1&units=50');
    expect(screen.getByText('1. Sanitize')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    expect(screen.getByText(/50 units/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // 2
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // 3
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // 4
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // 5
    expect(screen.getByText('5. Draw Dose')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('kit')).toBeInTheDocument();
  });

  it('shows an empty state for an unknown peptide', () => {
    renderGuide('/reconstitute/guide/nope');
    expect(screen.getByText('Peptide not found')).toBeInTheDocument();
  });
});
