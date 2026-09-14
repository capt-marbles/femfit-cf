// VAPID public key — safe to ship, it is handed to every browser that subscribes.
const VAPID_PUBLIC_KEY =
  'BLTZovwKJBuCpEGFw29UmW4VxD5PFl3I9xEY-8b7ACHPb2q7VZChJ7kufiC22k48zN2VuOS5U5pjd82g_3PunpI';

const HOUR_KEY = 'femfit:reminder-hour';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * iOS only exposes Push to PWAs launched from the home screen. In a plain
 * Safari tab the APIs exist but subscribing throws, so detect it up front
 * to show the "Add to Home Screen first" hint instead of a broken toggle.
 */
export function needsHomeScreenInstall(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!isIOS) return false;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return !standalone;
}

export function getPermission(): NotificationPermission {
  return typeof Notification === 'undefined' ? 'denied' : Notification.permission;
}

export function getSavedHour(): number {
  const raw = localStorage.getItem(HOUR_KEY);
  const n = raw === null ? NaN : parseInt(raw, 10);
  return Number.isInteger(n) && n >= 0 && n <= 23 ? n : 8;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/** Subscribe (or re-point an existing subscription) to fire at `hour` local time. */
export async function enableReminders(hour: number): Promise<void> {
  if (!isPushSupported()) throw new Error('Push is not supported on this device.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const res = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      hour,
      // Refreshed on every enable so the server's idea of the local hour
      // survives DST shifts and travel.
      tzOffset: new Date().getTimezoneOffset(),
    }),
  });
  if (!res.ok) throw new Error('Could not save the reminder on the server.');

  localStorage.setItem(HOUR_KEY, String(hour));
}

export async function disableReminders(): Promise<void> {
  const sub = await getExistingSubscription();
  if (sub) {
    await fetch('/api/push', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
  localStorage.removeItem(HOUR_KEY);
}
