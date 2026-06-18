import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppStateProvider } from '../../state/store';
import { clearAll } from '../../state/persistence';
import App from '../../App';

// Mount the full app (real store + fake-indexeddb) starting at a given route.
function mountApp(initialPath: string) {
  return render(
    <AppStateProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </AppStateProvider>,
  );
}

describe('reconstitution wedge — end-to-end (offline persistence)', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('reconstitutes a vial, shows it in the kit, and persists it across a reload', async () => {
    const user = userEvent.setup();

    // 1. Empty kit shows the strong empty state.
    const first = mountApp('/reconstitute');
    expect((await screen.findAllByText('0 vials reconstituted')).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Reconstitute a vial' })).toBeInTheDocument();

    // 2. Open the calculator (defaults vial 2 / water 1 / dose 1 -> 2 mg/mL, 50 units).
    first.unmount();
    const calc = mountApp('/reconstitute/calc/tesamorelin');
    // peptide name from seed appears in the header once hydrated/seeded
    expect(await screen.findByRole('heading', { name: 'Tesamorelin' })).toBeInTheDocument();
    expect(screen.getByText('2 mg/mL')).toBeInTheDocument();
    expect(screen.getByText('50 units')).toBeInTheDocument();

    // units <-> mL toggle
    await user.click(screen.getByRole('button', { name: 'mL' }));
    expect(screen.getByText('0.5 mL')).toBeInTheDocument();

    // 3. Save to kit -> navigates back to /reconstitute.
    await user.click(screen.getByRole('button', { name: 'Save to kit' }));
    expect(await screen.findByText('1 vial in your kit')).toBeInTheDocument();
    expect(screen.getByText(/2 mg\/mL · 50 u draw · 1 mg/)).toBeInTheDocument();
    calc.unmount();

    // 4. Reload: fresh provider + router rehydrate from IndexedDB.
    mountApp('/reconstitute');
    expect(await screen.findByText('1 vial in your kit')).toBeInTheDocument();
    expect(screen.getByText(/2 mg\/mL · 50 u draw · 1 mg/)).toBeInTheDocument();
  });

  it('removes a vial via REMOVE_VIAL', async () => {
    const user = userEvent.setup();

    const calc = mountApp('/reconstitute/calc/tesamorelin');
    await screen.findByRole('heading', { name: 'Tesamorelin' });
    await user.click(screen.getByRole('button', { name: 'Save to kit' }));
    await screen.findByText('1 vial in your kit');

    const remove = screen.getByRole('button', { name: /Remove Tesamorelin vial/ });
    await user.click(remove);
    expect((await screen.findAllByText('0 vials reconstituted')).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Reconstitute a vial' })).toBeInTheDocument();
    calc.unmount();
  });

  it('catches invalid input (empty field) without crashing and disables save', async () => {
    const user = userEvent.setup();
    mountApp('/reconstitute/calc/tesamorelin');
    await screen.findByRole('heading', { name: 'Tesamorelin' });

    // Edit the vial field down to empty via backspace.
    const vialInput = screen.getByLabelText('Vial size (mg)') as HTMLInputElement;
    await user.click(vialInput);
    const pad = screen.getByRole('group', { name: 'Number pad' });
    await user.click(within(pad).getByRole('button', { name: 'Backspace' }));
    expect(vialInput.value).toBe('');

    // No crash; output dashes out; save disabled.
    expect(screen.getByRole('button', { name: 'Save to kit' })).toBeDisabled();
  });

  it('surfaces the dose-exceeds-vial warning (D > M)', async () => {
    const user = userEvent.setup();
    mountApp('/reconstitute/calc/tesamorelin');
    await screen.findByRole('heading', { name: 'Tesamorelin' });

    // dose preset 1, bump vial below dose: set vial to 0.1 via chip not present,
    // so edit vial to "0" then "." then "1" using the pad while vial is active.
    const vialInput = screen.getByLabelText('Vial size (mg)') as HTMLInputElement;
    await user.click(vialInput);
    const pad = screen.getByRole('group', { name: 'Number pad' });
    await user.click(within(pad).getByRole('button', { name: 'Backspace' })); // ''
    await user.click(within(pad).getByRole('button', { name: '.' })); // '0.'
    await user.click(within(pad).getByRole('button', { name: '5' })); // '0.5'
    expect(vialInput.value).toBe('0.5');

    // dose default is 1 (> 0.5) -> warning surfaces.
    expect(screen.getByRole('alert')).toHaveTextContent(/dose exceeds a full vial/);
  });
});
