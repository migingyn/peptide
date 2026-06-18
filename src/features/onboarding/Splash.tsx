import { useNavigate } from 'react-router-dom';
import './onboarding.css';

export function Splash() {
  const nav = useNavigate();
  return (
    <main className="ob-screen">
      <div className="ob-spacer" />
      <span aria-hidden="true" style={{ fontSize: 64 }}>
        🧬
      </span>
      <h1 className="ob-title">Find your protocol</h1>
      <p className="ob-sub">
        A calmer way to plan, mix, and track your peptide routine — all on this device.
      </p>
      <div className="ob-spacer" />
      <button className="ob-cta" onClick={() => nav('/onboarding/sex')}>
        Get started
      </button>
    </main>
  );
}
