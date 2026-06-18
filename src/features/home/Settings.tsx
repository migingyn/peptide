import { useNavigate } from 'react-router-dom';
import { useAppState, useDispatch } from '../../state/store';
import { notificationsSupported, requestPermission } from '../../lib/notifications';
import './settings.css';

export function Settings() {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const { prefs } = useAppState();
  const supported = notificationsSupported();

  async function toggleNotifications() {
    const next = !prefs.notificationsEnabled;
    if (next && supported) {
      const result = await requestPermission();
      if (result !== 'granted') {
        dispatch({ type: 'SET_PREFS', payload: { notificationsEnabled: false } });
        return;
      }
    }
    dispatch({ type: 'SET_PREFS', payload: { notificationsEnabled: next } });
  }

  function resetAll() {
    const ok = window.confirm(
      'This permanently deletes all your data on this device: profile, vials, schedule, and logs. This cannot be undone. Continue?',
    );
    if (!ok) return;
    dispatch({ type: 'RESET_ALL' });
    try {
      localStorage.removeItem('peps.onboarded');
    } catch {
      // ignore
    }
    nav('/onboarding', { replace: true });
  }

  return (
    <main className="set-screen">
      <h1 className="set-title">Settings</h1>

      <div className="set-row">
        <div>
          <p className="set-row-label">Dose reminders</p>
          <p className="set-row-help">
            {supported
              ? 'Browser notifications when a dose is due.'
              : 'Not supported on this device.'}
          </p>
        </div>
        <button
          className="set-toggle"
          type="button"
          role="switch"
          aria-checked={prefs.notificationsEnabled}
          aria-label="Toggle dose reminders"
          disabled={!supported}
          onClick={toggleNotifications}
        />
      </div>

      <button className="set-danger" type="button" onClick={resetAll}>
        Reset / delete all data
      </button>
    </main>
  );
}
