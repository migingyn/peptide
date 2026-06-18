import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppStateProvider, useAppState } from '../../state/store';
import { MedicalGate } from './MedicalGate';

function Probe() {
  const { profile } = useAppState();
  return (
    <div>
      landed
      <span data-testid="ack">{String(profile.medicalAck)}</span>
      <span data-testid="onboarded">{String(profile.onboardedAt != null)}</span>
    </div>
  );
}

function renderGate() {
  return render(
    <AppStateProvider>
      <MemoryRouter initialEntries={['/onboarding/medical']}>
        <Routes>
          <Route path="/onboarding/medical" element={<MedicalGate />} />
          <Route path="/get-started" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </AppStateProvider>,
  );
}

describe('MedicalGate', () => {
  beforeEach(() => localStorage.clear());

  it('does not advance until "I understand" is pressed', () => {
    renderGate();
    expect(screen.queryByText('landed')).toBeNull();
    expect(screen.getByText('This app is not medical advice')).toBeInTheDocument();
  });

  it('acks medical, completes onboarding, sets fast-path, and advances', () => {
    renderGate();
    fireEvent.click(screen.getByRole('button', { name: 'I understand' }));
    expect(screen.getByText('landed')).toBeInTheDocument();
    expect(screen.getByTestId('ack').textContent).toBe('true');
    expect(screen.getByTestId('onboarded').textContent).toBe('true');
    expect(localStorage.getItem('peps.onboarded')).toBe('1');
  });
});
