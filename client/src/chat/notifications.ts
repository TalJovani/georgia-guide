import { apiFetch } from '../lib/api'

// Notifications for new chat messages come in two kinds:
// - Push (best): the server sends them through the browser's push service, and a service
//   worker shows them even when the site is closed.
// - In-page (fallback): the open page notices new messages while polling and shows them.
//   Used when push isn't available (old browser, server without VAPID keys).
// The browser asks the user once; on top of that, the user can switch them off here
// (a site can't take back a permission it was given, so we keep our own switch).

const SWITCH_KEY = 'notify-new-messages'
const PUSH_KEY = 'notify-by-push'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked (e.g. private mode): the choice just won't be remembered.
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function pushSupported(): boolean {
  return notificationsSupported() && 'serviceWorker' in navigator && 'PushManager' in window
}

// Whether the open page should pop up notifications itself: allowed, switched on, and not
// already covered by push (which would show the same message twice).
export function notificationsOn(): boolean {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false
  return read(SWITCH_KEY) !== 'off' && read(PUSH_KEY) !== 'on'
}

export function setNotificationsSwitch(on: boolean) {
  write(SWITCH_KEY, on ? 'on' : 'off')
}

// The VAPID public key comes as base64url text; the browser wants the raw bytes.
function base64UrlToBytes(text: string): Uint8Array<ArrayBuffer> {
  const base64 = (text + '='.repeat((4 - (text.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const registration = await navigator.serviceWorker.getRegistration()
  return (await registration?.pushManager.getSubscription()) ?? null
}

export async function pushIsOn(): Promise<boolean> {
  return (await currentSubscription()) !== null
}

// Turn push on for this browser: ask permission, install the service worker, subscribe at
// the browser's push service, and give the server the subscription.
// Throws if anything fails; ApiError 503 means the server has no VAPID keys.
export async function enablePush(): Promise<void> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not given')

  const { publicKey } = await apiFetch<{ publicKey: string }>('/api/push/public-key')
  await navigator.serviceWorker.register('/sw.js')
  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      // A promise to the browser that every push shows the user something.
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(publicKey),
    }))
  await apiFetch<void>('/api/push/subscriptions', {
    method: 'POST',
    body: JSON.stringify(subscription.toJSON()),
  })
  write(PUSH_KEY, 'on')
  setNotificationsSwitch(true)
}

// Stop push on this browser, here and on the server. Also on sign-out, so the next person
// on a shared computer doesn't get this user's messages.
export async function disablePush(): Promise<void> {
  const subscription = await currentSubscription()
  if (subscription) {
    await apiFetch<void>('/api/push/subscriptions', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => {})
    await subscription.unsubscribe()
  }
  write(PUSH_KEY, 'off')
}

// On every sign-in or page load: if this browser is subscribed, make sure the server has it
// for the signed-in user (it may have dropped it, or the session may have changed hands).
export async function claimPushSubscription(): Promise<void> {
  const subscription = await currentSubscription()
  if (!subscription) {
    write(PUSH_KEY, 'off')
    return
  }
  await apiFetch<void>('/api/push/subscriptions', {
    method: 'POST',
    body: JSON.stringify(subscription.toJSON()),
  })
  write(PUSH_KEY, 'on')
}
