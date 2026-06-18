import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AppStateProvider } from './state/store';
import { initialState, type AppState } from './state/types';

// A fully-hydrated, onboarded state so the gate lets the app render.
function onboardedState(): AppState {
  return {
    ...initialState,
    profile: { ...initialState.profile, onboardedAt: '2026-06-17T00:00:00.000Z', medicalAck: true },
    hydrated: true,
  };
}

function renderApp(initialPath = '/', seed?: AppState) {
  return render(
    <AppStateProvider initialState={seed}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </AppStateProvider>,
  );
}

describe('onboarding gate', () => {
  beforeEach(() => localStorage.clear());

  it('redirects a fresh user to the onboarding splash', async () => {
    renderApp('/');
    await waitFor(() => expect(screen.getByText('Find your protocol')).toBeInTheDocument());
  });

  it('keeps an onboarded user out of onboarding (fast-path)', async () => {
    localStorage.setItem('peps.onboarded', '1');
    renderApp('/onboarding', onboardedState());
    await waitFor(() => expect(screen.queryByText('Find your protocol')).not.toBeInTheDocument());
  });
});

describe('App (onboarded)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('peps.onboarded', '1');
  });

  it('renders the Home dashboard by default (empty state with no active protocol)', () => {
    renderApp('/', onboardedState());
    expect(screen.getByRole('heading', { name: 'No active protocol' })).toBeInTheDocument();
  });

  it('renders the three primary tabs', () => {
    renderApp('/', onboardedState());
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reconstitute' })).toBeInTheDocument();
  });

  it('routes to the Explore screen', () => {
    renderApp('/explore', onboardedState());
    expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();
  });

  it('routes to the Reconstitute (Kit) screen', () => {
    renderApp('/reconstitute', onboardedState());
    expect(screen.getByRole('heading', { name: 'Your Kit' })).toBeInTheDocument();
  });
});
