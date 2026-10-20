import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { apiFetch } from '../lib/api'
import { UnreadContext } from './context'
import { notificationsOn } from './notifications'

// How often to ask the server about new messages.
const POLL_EVERY_MS = 15_000

type NewestMessage = { id: string; body: string; from: string }
type UnreadResponse = {
  unread: Record<string, number>
  newest: Record<string, NewestMessage>
}

// Keeps one count of unread chat messages for the whole app, so every page
// (app bar, trip lists) shows the same numbers from a single polling loop.
// With notifications on, it also pops up a browser notification for each new message.
export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [byTrip, setByTrip] = useState<Record<string, number>>({})
  // Messages we already told the user about. Null until the first check, which only
  // remembers what is there: messages from before the page was opened don't pop up.
  const notified = useRef<Set<string> | null>(null)

  // Opens a trip's chat. Kept in a ref so `refresh` stays the same function across
  // page changes (it is in other effects' dependencies, which would restart on every change).
  const openChat = useRef<(tripId: string) => void>(() => {})
  useEffect(() => {
    openChat.current = (tripId) =>
      navigate(user?.role === 'GUIDE' ? `/guide/trips/${tripId}/chat` : `/trips/${tripId}/chat`)
  }, [navigate, user])

  const refresh = useCallback(() => {
    apiFetch<UnreadResponse>('/api/messages/unread')
      .then((data) => {
        setByTrip(data.unread)

        const newest = Object.entries(data.newest)
        if (notified.current === null) {
          notified.current = new Set(newest.map(([, message]) => message.id))
          return
        }
        for (const [tripId, message] of newest) {
          if (notified.current.has(message.id)) continue
          notified.current.add(message.id)
          // Looking at the page already? The badge is enough.
          if (!notificationsOn() || document.hasFocus()) continue
          const notification = new Notification(message.from, {
            body: message.body,
            // One notification per trip: a newer message replaces the older one.
            tag: tripId,
          })
          notification.onclick = () => {
            window.focus()
            openChat.current(tripId)
            notification.close()
          }
        }
      })
      // A missed check is fine: the next one comes in a few seconds.
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    notified.current = null
    refresh()
    const timer = setInterval(() => {
      // In a hidden tab, keep checking only if a notification can tell the user.
      if (!document.hidden || notificationsOn()) refresh()
    }, POLL_EVERY_MS)
    // Coming back to the tab: check right away instead of waiting for the next tick.
    function onVisible() {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user, refresh])

  // After logout, don't show the previous user's numbers.
  const counts = user ? byTrip : {}
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  return (
    <UnreadContext.Provider value={{ byTrip: counts, total, refresh }}>
      {children}
    </UnreadContext.Provider>
  )
}
