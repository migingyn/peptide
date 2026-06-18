import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppStateProvider } from '../../state/store';
import { clearAll, persistSlice } from '../../state/persistence';
import { PEPTIDES } from '../../data/peptides.seed';
import { PROTOCOLS } from '../../data/protocols.seed';
import { GOALS } from '../../data/goals.seed';
import App from '../../App';

function mountApp(path: string) {
  return render(
    <AppStateProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </AppStateProvider>,
  );
}

// Regression: after a reload, idb getAll() returns peptides sorted by id, so
// peptides[0] is '5-amino-1mq' (it sorts before letters). The kit's "add a vial"
// default must come from the ACTIVE protocol (Tesamorelin), not array order.
describe('KitView default add-vial peptide', () => {
  beforeEach(async () => {
    await clearAll();
    localStorage.setItem('peps.onboarded', '1');
    await persistSlice('profile', {
      sex: 'male',
      ageBand: '30-39',
      onboardedAt: '2026-06-17T00:00:00.000Z',
      medicalAck: true,
    });
    // Pre-populate idb so boot HYDRATEs (reproducing the post-reload sorted order)
    // and an active Muscle Growth protocol exists.
    await persistSlice('peptides', PEPTIDES);
    await persistSlice('protocols', PROTOCOLS);
    await persistSlice('goals', GOALS);
    await persistSlice('userProtocols', [
      {
        id: 'up-1',
        protocolId: 'muscle-growth-tesa-ipa',
        startDate: '2026-06-17',
        active: true,
      },
    ]);
  });

  it('opens the calculator for the active protocol peptide (Tesamorelin), not 5-Amino', async () => {
    const user = userEvent.setup();
    mountApp('/reconstitute');

    const add = await screen.findByRole('button', { name: 'Reconstitute a vial' });
    await user.click(add);

    expect(await screen.findByRole('heading', { name: 'Tesamorelin' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '5-Amino-1MQ' })).not.toBeInTheDocument();
  });
});
