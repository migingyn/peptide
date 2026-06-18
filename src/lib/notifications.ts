// Feature-detected browser Notification wrapper (Foundations §2).
// Every entry point is guarded by `'Notification' in window` and degrades
// gracefully when the API is missing or permission is denied.

export type PermissionResult = NotificationPermission | 'unsupported';

export interface DoseNotice {
  title: string; // e.g. peptide name
  body: string; // e.g. "Time for your 22:00 dose"
}

function getCtor(): typeof Notification | null {
  if (typeof globalThis === 'undefined') return null;
  if (!('Notification' in globalThis)) return null;
  return (globalThis as unknown as { Notification: typeof Notification }).Notification;
}

export function notificationsSupported(): boolean {
  return getCtor() !== null;
}

export async function requestPermission(): Promise<PermissionResult> {
  const Ctor = getCtor();
  if (!Ctor) return 'unsupported';
  try {
    return await Ctor.requestPermission();
  } catch {
    return 'denied';
  }
}

export function currentPermission(): PermissionResult {
  const Ctor = getCtor();
  if (!Ctor) return 'unsupported';
  return Ctor.permission;
}

export function notifyDose(notice: DoseNotice): void {
  const Ctor = getCtor();
  if (!Ctor) return;
  if (Ctor.permission !== 'granted') return;
  try {
    // eslint-disable-next-line no-new
    new Ctor(notice.title, { body: notice.body });
  } catch {
    // Swallow construction errors (e.g. user gesture requirements) — degrade silently.
  }
}
