import { useNavigate } from 'react-router-dom';
import { useDispatch } from '../../state/store';
import './onboarding.css';

export function MedicalGate() {
  const nav = useNavigate();
  const dispatch = useDispatch();

  function understand() {
    dispatch({ type: 'ACK_MEDICAL' });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    try {
      localStorage.setItem('peps.onboarded', '1');
    } catch {
      // localStorage may be unavailable (private mode) — gate still completes in state.
    }
    nav('/get-started', { replace: true });
  }

  return (
    <main className="ob-screen">
      <span className="ob-kicker">Step 3 of 3</span>
      <h1 className="ob-title">This app is not medical advice</h1>
      <p className="ob-sub">
        PepS is an organizational tool for informational purposes only. It does not diagnose, treat,
        or prescribe. Talk to a qualified clinician before starting any peptide.
      </p>
      <div className="ob-spacer" />
      <button className="ob-cta" onClick={understand}>
        I understand
      </button>
    </main>
  );
}
