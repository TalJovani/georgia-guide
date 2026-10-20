// Browser notifications for new chat messages (the Notification API).
// The browser asks the user once; on top of that, the user can switch them off here
// (a site can't take back a permission it was given, so we keep our own on/off switch).

const STORAGE_KEY = 'notify-new-messages'

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

// On only if the browser allows it AND the user didn't switch it off in their account page.
export function notificationsOn(): boolean {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setNotificationsSwitch(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Storage blocked (e.g. private mode): the switch just won't be remembered.
  }
}
