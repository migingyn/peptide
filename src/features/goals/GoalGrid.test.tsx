import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStateProvider } from '../../state/store';
import { initialState, type AppState } from '../../state/types';
import { GoalGrid } from './GoalGrid';
import { GOALS } from '../../data/goals.seed';

function seeded(): AppState {
  return { ...initialState, goals: GOALS, hydrated: true };
}

describe('GoalGrid', () => {
  it('renders all 7 seeded goals with their taglines', () => {
    render(
      <AppStateProvider initialState={seeded()}>
        <MemoryRouter>
          <GoalGrid />
        </MemoryRouter>
      </AppStateProvider>,
    );
    expect(GOALS).toHaveLength(7);
    for (const g of GOALS) {
      expect(screen.getByText(g.name)).toBeInTheDocument();
      expect(screen.getByText(g.tagline)).toBeInTheDocument();
    }
  });
});
