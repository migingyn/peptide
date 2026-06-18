import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppStateProvider } from '../../state/store';
import { initialState, type AppState } from '../../state/types';
import { Settings } from './Settings';

function seeded(): AppState {
  return { ...initialState, hydrated: true };
}

function renderSettings() {
  return render(
    <AppStateProvider initialState={seeded()}>
      <MemoryRouter initialEntries={['/settings']}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
          <Route path="/onboarding" element={<div>onboarding</div>} />
        </Routes>
      </MemoryRouter>
    </AppStateProvider>,
  );
}

describe('Settings', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does nothing when reset is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Reset / delete all data' }));
    expect(screen.queryByText('onboarding')).toBeNull();
  });

  it('resets and routes to onboarding when confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('peps.onboarded', '1');
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Reset / delete all data' }));
    expect(screen.getByText('onboarding')).toBeInTheDocument();
    expect(localStorage.getItem('peps.onboarded')).toBeNull();
  });

  it('exposes the dose reminders switch', () => {
    renderSettings();
    expect(screen.getByRole('switch', { name: 'Toggle dose reminders' })).toBeInTheDocument();
  });
});
