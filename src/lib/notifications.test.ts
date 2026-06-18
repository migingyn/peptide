import { describe, it, expect, afterEach, vi } from 'vitest';
import { notificationsSupported, requestPermission, notifyDose } from './notifications';

describe('notifications feature detection', () => {
  const original = (globalThis as { Notification?: unknown }).Notification;
  afterEach(() => {
    if (original === undefined) delete (globalThis as { Notification?: unknown }).Notification;
    else (globalThis as { Notification?: unknown }).Notification = original;
    vi.restoreAllMocks();
  });

  it('reports unsupported when Notification is absent', async () => {
    delete (globalThis as { Notification?: unknown }).Notification;
    expect(notificationsSupported()).toBe(false);
    await expect(requestPermission()).resolves.toBe('unsupported');
    // must not throw when firing a notification on an unsupported platform
    expect(() => notifyDose({ title: 'Tesamorelin', body: 'Time for your dose' })).not.toThrow();
  });

  it('reports supported and requests permission when Notification exists', async () => {
    const requestPermissionMock = vi.fn().mockResolvedValue('granted');
    (globalThis as { Notification?: unknown }).Notification = Object.assign(
      function MockNotification() {},
      { permission: 'default', requestPermission: requestPermissionMock },
    );
    expect(notificationsSupported()).toBe(true);
    await expect(requestPermission()).resolves.toBe('granted');
    expect(requestPermissionMock).toHaveBeenCalledOnce();
  });

  it('does not construct a Notification when permission is not granted', () => {
    const ctor = vi.fn();
    (globalThis as { Notification?: unknown }).Notification = Object.assign(ctor, {
      permission: 'denied',
      requestPermission: vi.fn(),
    });
    notifyDose({ title: 'Ipamorelin', body: 'Morning pulse' });
    expect(ctor).not.toHaveBeenCalled();
  });
});
