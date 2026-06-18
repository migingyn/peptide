import { useNavigate } from 'react-router-dom';
import { useAppState, useDispatch } from '../../state/store';
import type { Sex as SexValue } from '../../state/types';
import './onboarding.css';

const OPTIONS: { value: SexValue; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other / prefer not to say' },
];

export function Sex() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { profile } = useAppState();

  function choose(value: SexValue) {
    dispatch({ type: 'SET_PROFILE', payload: { sex: value } });
    nav('/onboarding/age');
  }

  return (
    <main className="ob-screen">
      <span className="ob-kicker">Step 1 of 3</span>
      <h1 className="ob-title">What&apos;s your sex?</h1>
      <p className="ob-sub">
        We use this only to tailor dosing guidance. It never leaves your device.
      </p>
      <div className="ob-options" role="group" aria-label="Select your sex">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            className="ob-option"
            aria-pressed={profile.sex === o.value}
            onClick={() => choose(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="ob-spacer" />
    </main>
  );
}
