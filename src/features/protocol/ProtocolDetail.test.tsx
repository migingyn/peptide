import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppStateProvider, useAppState } from '../../state/store';
import { initialState, type AppState } from '../../state/types';
import { PROTOCOLS } from '../../data/protocols.seed';
import { ProtocolDetail } from './ProtocolDetail';
import { StartProtocol } from './StartProtocol';

function seeded(): AppState {
  return { ...initialState, protocols: PROTOCOLS, hydrated: true };
}

function renderDetail(id: string) {
  return render(
    <AppStateProvider initialState={seeded()}>
      <MemoryRouter initialEntries={[`/protocol/${id}`]}>
        <Routes>
          <Route path="/protocol/:protocolId" element={<ProtocolDetail />} />
        </Routes>
      </MemoryRouter>
    </AppStateProvider>,
  );
}

describe('ProtocolDetail', () => {
  it('renders all five sections and the At a Glance line for the seeded protocol', () => {
    renderDetail('muscle-growth-tesa-ipa');
    expect(screen.getByText('At a Glance')).toBeInTheDocument();
    expect(screen.getByText('Why This Stack')).toBeInTheDocument();
    expect(screen.getByText('What to Expect')).toBeInTheDocument();
    expect(screen.getByText('Important to Know')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText(/Beginner · 8 weeks · ~\$66\/wk · 5× weekly/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Protocol' })).toBeInTheDocument();
  });

  it('shows an empty state for an unknown protocol', () => {
    renderDetail('does-not-exist');
    expect(screen.getByText('Protocol not found')).toBeInTheDocument();
  });
});

function Probe() {
  const { userProtocols } = useAppState();
  const active = userProtocols.find((u) => u.active);
  return <div>reconstitute:{active ? active.protocolId : 'none'}</div>;
}

describe('StartProtocol', () => {
  it('dispatches START_PROTOCOL and routes to /reconstitute', () => {
    render(
      <AppStateProvider initialState={seeded()}>
        <MemoryRouter initialEntries={['/protocol/muscle-growth-tesa-ipa/start']}>
          <Routes>
            <Route path="/protocol/:protocolId/start" element={<StartProtocol />} />
            <Route path="/reconstitute" element={<Probe />} />
          </Routes>
        </MemoryRouter>
      </AppStateProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start & mix first dose' }));
    expect(screen.getByText('reconstitute:muscle-growth-tesa-ipa')).toBeInTheDocument();
  });
});
