import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AppStateProvider } from './state/store';

function renderApp(initialPath = '/') {
  return render(
    <AppStateProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </AppStateProvider>,
  );
}

describe('App', () => {
  it('renders the Home screen by default', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders the three primary tabs', () => {
    renderApp('/');
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reconstitute' })).toBeInTheDocument();
  });

  it('routes to the Explore screen', () => {
    renderApp('/explore');
    expect(screen.getByRole('heading', { name: 'Explore' })).toBeInTheDocument();
  });

  it('routes to the Reconstitute (Kit) screen', () => {
    renderApp('/reconstitute');
    expect(screen.getByRole('heading', { name: 'Your Kit' })).toBeInTheDocument();
  });
});
