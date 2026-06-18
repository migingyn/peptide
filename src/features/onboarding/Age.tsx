import { useNavigate } from 'react-router-dom';
import { useAppState, useDispatch } from '../../state/store';
import type { AgeBand } from '../../state/types';
import './onboarding.css';

const BANDS: AgeBand[] = ['18-29', '30-39', '40-49', '50-59', '60+'];

export function Age() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { profile } = useAppState();

  function choose(band: AgeBand) {
    dispatch({ type: 'SET_PROFILE', payload: { ageBand: band } });
    nav('/onboarding/carousel');
  }

  return (
    <main className="ob-screen">
      <span className="ob-kicker">Step 2 of 3</span>
      <h1 className="ob-title">How old are you?</h1>
      <p className="ob-sub">Age helps us set sensible starting doses.</p>
      <div className="ob-options" role="group" aria-label="Select your age band">
        {BANDS.map((band) => (
          <button
            key={band}
            className="ob-option"
            aria-pressed={profile.ageBand === band}
            onClick={() => choose(band)}
          >
            {band}
          </button>
        ))}
      </div>
      <div className="ob-spacer" />
    </main>
  );
}
